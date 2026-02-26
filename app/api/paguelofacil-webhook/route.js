import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const MODEL_LABELS = {
  Himalayan: 'Royal Enfield Himalayan 450',
  CFMoto700: 'CF Moto 700 CL-X',
};

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('📥 PaguéloFácil webhook received:', JSON.stringify(data, null, 2));

    /* -------------------------------------------------
       1️⃣ Extract fields
    --------------------------------------------------*/
    const {
      status,
      codOper,
      messageSys,
      totalPay,
      email,
      customFields = {},
    } = data;

    const bookingId      = customFields['Booking ID'];
    const securityToken  = customFields['Security Token'];

    if (!bookingId || !securityToken) {
      console.error('❌ Missing booking ID or token', customFields);
      return NextResponse.json({ error: 'Missing booking ID or token' }, { status: 400 });
    }

    /* -------------------------------------------------
       2️⃣ Fetch booking + validate token
    --------------------------------------------------*/
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('paguelofacil_token', securityToken)
      .single();

    if (fetchError || !booking) {
      console.error('❌ Booking not found or token mismatch');
      return NextResponse.json({ error: 'Invalid booking' }, { status: 404 });
    }

    /* -------------------------------------------------
       3️⃣ Idempotency guard
    --------------------------------------------------*/
    if (booking.webhook_received) {
      console.log('⚠️ Webhook already processed:', bookingId);
      return NextResponse.json({ status: 'already_processed' });
    }

    /* -------------------------------------------------
       4️⃣ Declined payment
    --------------------------------------------------*/
    const approved = status === 1 || status === '1';

    if (!approved) {
      await supabase
        .from('bookings')
        .update({
          status:                       'failed',
          payment_status:               'failed',
          webhook_received:             true,
          pending_verification:         false,
          paguelofacil_transaction_id:  codOper,
        })
        .eq('id', bookingId);

      return NextResponse.json({ status: 'payment_failed', message: messageSys });
    }

    /* -------------------------------------------------
       5️⃣ Confirm booking
    --------------------------------------------------*/
    await supabase
      .from('bookings')
      .update({
        status:                       'confirmed',
        payment_status:               'paid',
        paid:                         false,   // remaining paid at pickup
        webhook_received:             true,
        pending_verification:         false,
        paguelofacil_transaction_id:  codOper,
      })
      .eq('id', bookingId);

    const { data: updatedBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    /* -------------------------------------------------
       6️⃣ Model-aware motorcycle assignment
    --------------------------------------------------*/
    const motorcycleModel = updatedBooking.motorcycle_model || 'Himalayan';
    const startDate       = new Date(updatedBooking.start_date);
    const endDate         = new Date(updatedBooking.end_date);

    // Find all motorcycle IDs already booked for the overlapping period
    // (for ANY model — we don't want to double-assign the same physical bike)
    const { data: overlappingBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        booking_motorcycles ( motorcycle_id )
      `)
      .in('status', ['confirmed', 'paid']);

    const bookedMotorcycleIds = new Set();

    overlappingBookings?.forEach(b => {
      if (b.id === bookingId) return;

      const bStart = new Date(b.start_date);
      const bEnd   = new Date(b.end_date);

      if (startDate <= bEnd && endDate >= bStart) {
        b.booking_motorcycles?.forEach(m => bookedMotorcycleIds.add(m.motorcycle_id));
      }
    });

    // Fetch only motorcycles matching the booked model
    const { data: modelMotorcycles } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('model', motorcycleModel)
      .eq('is_available', true)
      .order('name');

    const available = (modelMotorcycles || []).filter(
      m => !bookedMotorcycleIds.has(m.id)
    );

    const assigned = available.slice(0, updatedBooking.bike_quantity);

    if (assigned.length < updatedBooking.bike_quantity) {
      // Log the shortage but don't fail the webhook — payment already went through.
      // Admin email will flag this.
      console.error(
        `⚠️ Only ${assigned.length} of ${updatedBooking.bike_quantity} ${motorcycleModel} bikes could be assigned for booking ${bookingId}`
      );
    }

    for (const moto of assigned) {
      await supabase.from('booking_motorcycles').insert({
        booking_id:    bookingId,
        motorcycle_id: moto.id,
      });
    }

    /* -------------------------------------------------
       7️⃣ Emails
    --------------------------------------------------*/
    const remainingPayment = updatedBooking.total_price - updatedBooking.down_payment;
    const modelLabel       = MODEL_LABELS[motorcycleModel] || motorcycleModel;
    const shortageWarning  = assigned.length < updatedBooking.bike_quantity;

    try {
      await resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to:      [updatedBooking.email],
        subject: `🏍️ Booking Confirmed — ${modelLabel}`,
        html:    generateCustomerEmailHTML(updatedBooking, assigned, remainingPayment, modelLabel),
      });
    } catch (e) {
      console.error('❌ Customer email failed', e);
    }

    try {
      await resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to:      ['overlandmotorcycles@gmail.com'],
        subject: `🚨 NEW BOOKING — ${updatedBooking.first_name} ${updatedBooking.last_name} — ${modelLabel}${shortageWarning ? ' ⚠️ BIKE SHORTAGE' : ''}`,
        html:    generateCompanyEmailHTML(updatedBooking, assigned, remainingPayment, modelLabel, shortageWarning),
      });
    } catch (e) {
      console.error('❌ Admin email failed', e);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ status: 'success', bookingId, transactionId: codOper });

  } catch (err) {
    console.error('❌ Webhook fatal error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/* =============================================================
   Email helpers
============================================================= */

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function generateCustomerEmailHTML(booking, motorcycles, remainingPayment, modelLabel) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6; }
        .email-container { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%); color: #1F2937; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .success-icon { text-align: center; font-size: 56px; margin: 0 0 20px 0; }
        .intro-text { text-align: center; font-size: 18px; color: #1F2937; margin-bottom: 30px; }
        .section { margin: 25px 0; padding: 20px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB; }
        .section h2 { color: #1F2937; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #FCD34D; padding-bottom: 8px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #6B7280; }
        .detail-value { color: #1F2937; text-align: right; font-weight: 500; }
        .highlight { background: #DEF7EC; color: #03543F; padding: 4px 10px; border-radius: 4px; font-weight: 600; }
        .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 25px 0; border-radius: 6px; }
        .warning ul { margin: 10px 0 0 0; padding-left: 20px; }
        .warning li { margin: 8px 0; }
        .cta-section { text-align: center; margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 8px; }
        .footer { background: #1F2937; color: #F9FAFB; padding: 30px; text-align: center; }
        .contact-info { margin: 20px 0; padding: 20px; background: rgba(252,211,77,0.1); border-radius: 6px; }
        .contact-info a { color: #FCD34D; text-decoration: none; }
        @media only screen and (max-width: 600px) {
          body { padding: 10px; }
          .header, .content, .footer { padding: 25px 20px; }
          .detail-row { flex-direction: column; gap: 5px; }
          .detail-value { text-align: left; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏍️ Booking Confirmed!</h1>
        </div>

        <div class="content">
          <div class="success-icon">✅</div>

          <div class="intro-text">
            <strong>Thank you for your booking, ${booking.first_name}!</strong><br>
            Your <strong>${modelLabel}</strong> rental is confirmed.<br>
            <span style="font-size: 14px; color: #6B7280; margin-top: 10px; display: block;">
              Experience the freedom of the open road across Panama.
            </span>
          </div>

          <div class="section">
            <h2>📋 Booking Details</h2>
            <div class="detail-row">
              <span class="detail-label">Booking Reference:</span>
              <span class="detail-value"><code style="font-size: 11px;">${booking.id}</code></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Customer Name:</span>
              <span class="detail-value">${booking.first_name} ${booking.last_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Motorcycle:</span>
              <span class="detail-value">${booking.bike_quantity} × ${modelLabel}</span>
            </div>
          </div>

          <div class="section">
            <h2>📅 Rental Period</h2>
            <div class="detail-row">
              <span class="detail-label">Pick-up Date:</span>
              <span class="detail-value">${formatDate(booking.start_date)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Return Date:</span>
              <span class="detail-value">${formatDate(booking.end_date)}</span>
            </div>
          </div>

          <div class="section">
            <h2>💰 Payment Summary</h2>
            <div class="detail-row">
              <span class="detail-label">Total Rental Price:</span>
              <span class="detail-value">$${booking.total_price.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Down Payment:</span>
              <span class="detail-value"><span class="highlight">$${booking.down_payment.toFixed(2)} PAID ✓</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Remaining Balance:</span>
              <span class="detail-value" style="font-size: 18px; font-weight: bold; color: #DC2626;">$${remainingPayment.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Security Deposit:</span>
              <span class="detail-value">$${booking.deposit.toFixed(2)}</span>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Important Reminders</strong>
            <ul>
              <li><strong>Valid motorcycle driver's license required</strong></li>
              <li>Bring remaining balance: <strong>$${remainingPayment.toFixed(2)}</strong></li>
              <li>Security deposit: <strong>$${booking.deposit.toFixed(2)}</strong> (refundable)</li>
              <li>Valid ID / Passport</li>
              <li>Arrive at least <strong>30 minutes before</strong> your scheduled pickup time</li>
            </ul>
          </div>

          <div class="cta-section">
            <p style="font-size: 16px; margin: 0; color: #1F2937;">
              <strong>Ready for your adventure?</strong><br>
              We'll have your ${modelLabel} ready and waiting!
            </p>
          </div>
        </div>

        <div class="footer">
          <div class="footer-content">
            <p style="font-weight: 700; font-size: 20px; margin: 0 0 10px 0; color: #FCD34D;">Overland Motorcycles</p>
            <p style="font-size: 14px; color: #D1D5DB; margin: 5px 0 20px 0; line-height: 1.5;">
              Your trusted partner for motorcycle adventures in Panama.
            </p>
            <p style="margin: 15px 0;">
              <a href="https://www.overland-motorcycles.com" style="color: #FCD34D; text-decoration: none; font-weight: 600; font-size: 15px;">
                🌐 www.overland-motorcycles.com
              </a>
            </p>
          </div>
          <div class="contact-info">
            <p style="margin: 15px 0; font-size: 15px;"><strong style="color: #FCD34D;">Get in Touch</strong></p>
            <p style="margin: 10px 0; font-size: 14px; line-height: 1.8;">
              📍 Local 1 - Edificio Antigua Domingo<br>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Plaza Santa Ana<br>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Panama City, Panama
            </p>
            <p style="margin: 15px 0; font-size: 14px; line-height: 1.8;">
              📧 <a href="mailto:overlandmotorcycles@gmail.com" style="color: #FCD34D; text-decoration: none;">overlandmotorcycles@gmail.com</a><br>
              📞 <a href="tel:+50768051100" style="color: #FCD34D; text-decoration: none;">+507 6805-1100</a>
            </p>
          </div>
          <div style="margin: 20px 0; padding: 15px; background: rgba(252,211,77,0.1); border-radius: 6px;">
            <p style="margin: 5px 0; font-size: 14px;"><strong style="color: #FCD34D;">Opening Hours</strong></p>
            <p style="margin: 8px 0; font-size: 13px; color: #D1D5DB;">
              Monday to Friday: 10:00 AM - 6:00 PM<br>
              Weekends: By appointment
            </p>
          </div>
          <p style="font-size: 11px; color: #6B7280; margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
            This is an automated confirmation email. For questions or changes, please contact us directly.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCompanyEmailHTML(booking, motorcycles, remainingPayment, modelLabel, shortageWarning) {
  const motorcyclesList = motorcycles.length
    ? motorcycles.map(m => `• ${m.name} (${modelLabel})`).join('<br>')
    : '<span style="color:#DC2626;">⚠️ No motorcycles assigned — manual assignment required!</span>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
        .container { background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: ${shortageWarning ? '#7C3AED' : '#DC2626'}; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .alert-badge { display: inline-block; background: #FCD34D; color: #1F2937; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
        .content { padding: 30px; }
        .info-box { background: #F9FAFB; border-left: 4px solid #FCD34D; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .info-box h3 { margin-top: 0; color: #1F2937; font-size: 16px; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .detail-item { padding: 10px; background: white; border-radius: 4px; border: 1px solid #E5E7EB; }
        .detail-label { font-size: 12px; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 5px; }
        .detail-value { font-size: 16px; color: #1F2937; font-weight: 500; }
        .payment-summary { background: #FEF3C7; border: 2px solid #FCD34D; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .payment-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #FDE68A; }
        .payment-row:last-child { border-bottom: none; font-size: 18px; font-weight: bold; }
        .paid-badge { background: #10B981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .action-needed { background: #FEE2E2; border: 2px solid #DC2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .action-needed h3 { color: #DC2626; margin-top: 0; }
        .motorcycles-list { background: #EFF6FF; border: 1px solid #BFDBFE; padding: 15px; border-radius: 6px; margin: 15px 0; line-height: 2; }
        .shortage-alert { background: #F5F3FF; border: 2px solid #7C3AED; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .shortage-alert h3 { color: #7C3AED; margin-top: 0; }
        .footer { background: #1F2937; color: white; padding: 20px; text-align: center; font-size: 12px; }
        .timestamp { background: #E5E7EB; padding: 10px; border-radius: 4px; text-align: center; font-size: 12px; color: #6B7280; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 NEW BOOKING — ${modelLabel}</h1>
          <div class="alert-badge">${shortageWarning ? '⚠️ BIKE SHORTAGE — MANUAL ACTION REQUIRED' : 'ACTION REQUIRED'}</div>
        </div>

        <div class="content">
          <div class="timestamp">
            📅 Received: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
          </div>

          ${shortageWarning ? `
          <div class="shortage-alert">
            <h3>⚠️ Motorcycle Assignment Shortage</h3>
            <p>Only <strong>${motorcycles.length}</strong> of <strong>${booking.bike_quantity}</strong> ${modelLabel} bike(s) could be automatically assigned. Please assign the remaining bike(s) manually in the admin dashboard immediately.</p>
          </div>` : ''}

          <div class="info-box">
            <h3>👤 Customer Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Full Name</div>
                <div class="detail-value">${booking.first_name} ${booking.last_name}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Booking ID</div>
                <div class="detail-value" style="font-family: monospace; font-size: 12px;">${booking.id}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value" style="font-size: 14px;"><a href="mailto:${booking.email}">${booking.email}</a></div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value"><a href="tel:${booking.phone}">${booking.phone || 'Not provided'}</a></div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Country</div>
                <div class="detail-value">${booking.country || 'Not provided'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Motorcycle</div>
                <div class="detail-value" style="font-size: 14px; color: #DC2626;">
                  ${booking.bike_quantity} × ${modelLabel}
                </div>
              </div>
            </div>
          </div>

          <div class="info-box">
            <h3>📅 Rental Period</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Pick-up Date</div>
                <div class="detail-value">${formatDate(booking.start_date)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Return Date</div>
                <div class="detail-value">${formatDate(booking.end_date)}</div>
              </div>
            </div>
          </div>

          <div class="motorcycles-list">
            <strong>🏍️ Assigned Motorcycles:</strong><br>
            ${motorcyclesList}
          </div>

          <div class="payment-summary">
            <h3 style="margin-top: 0; color: #92400E;">💰 Payment Details</h3>
            <div class="payment-row">
              <span>Total Rental Price:</span>
              <span style="font-weight: bold;">$${booking.total_price.toFixed(2)}</span>
            </div>
            <div class="payment-row">
              <span>Down Payment (Online):</span>
              <span><span class="paid-badge">PAID</span> $${booking.down_payment.toFixed(2)}</span>
            </div>
            <div class="payment-row">
              <span>Security Deposit (At Pickup):</span>
              <span style="font-weight: bold;">$${booking.deposit.toFixed(2)}</span>
            </div>
            <div class="payment-row" style="background: #FEE2E2; margin: 10px -10px -10px -10px; padding: 15px 10px;">
              <span style="color: #DC2626;">Remaining Balance (At Pickup):</span>
              <span style="color: #DC2626; font-size: 22px;">$${remainingPayment.toFixed(2)}</span>
            </div>
          </div>

          <div class="action-needed">
            <h3>⚠️ Action Items Before Pickup</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Verify ${modelLabel} is serviced and ready</strong></li>
              <li>Prepare rental agreement documents</li>
              <li>Confirm customer has valid motorcycle license</li>
              <li>Collect remaining balance: <strong style="color: #DC2626;">$${remainingPayment.toFixed(2)}</strong></li>
              <li>Collect security deposit: <strong>$${booking.deposit.toFixed(2)}</strong></li>
              <li>Brief customer on motorcycle features and local routes</li>
            </ul>
          </div>

          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">
              <strong>📊 View full details in Admin Dashboard</strong><br>
              <a href="https://www.overland-motorcycles.com/admin" style="color: #2563EB; text-decoration: none; font-weight: 600;">
                Go to Admin Dashboard →
              </a>
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;"><strong>Overland Motorcycles</strong> — Admin Notification System</p>
          <p style="margin: 10px 0 0 0; opacity: 0.7;">This is an automated notification. Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}