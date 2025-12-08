import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { sessionId } = await req.json();

    // 1️⃣ Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const meta = session.metadata;
    const startDate = new Date(meta.startDate);
    const endDate = new Date(meta.endDate);

    // 2️⃣ Create the booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          first_name: meta.firstName,
          last_name: meta.lastName,
          email: meta.email,
          phone: meta.phone || '',
          country: meta.country || '',
          start_date: meta.startDate,
          end_date: meta.endDate,
          bike_quantity: parseInt(meta.bikeQuantity),
          down_payment: parseFloat(meta.downPayment),
          total_price: parseFloat(meta.totalRentalPrice),
          deposit: parseFloat(meta.totalDeposit),
          status: 'confirmed',
          payment_status: 'paid',
          paid: true,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent
        },
      ])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 3️⃣ Get all confirmed bookings that overlap the requested period
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        booking_motorcycles (
          motorcycle_id
        )
      `)
      .in('status', ['confirmed', 'paid', 'pending']);

    if (overlapError) throw overlapError;

    // 4️⃣ Extract IDs of motorcycles already booked during this period
    const bookedMotorcycleIds = new Set();

    for (const b of overlappingBookings) {
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);

      const overlaps = startDate <= bEnd && endDate >= bStart;

      if (overlaps && b.booking_motorcycles?.length) {
        for (const bm of b.booking_motorcycles) {
          bookedMotorcycleIds.add(bm.motorcycle_id);
        }
      }
    }

    // 5️⃣ Fetch motorcycles that are NOT booked in this range
    const { data: allMotorcycles, error: motoError } = await supabase
      .from('motorcycles')
      .select('*')
      .order('id', { ascending: true });

    if (motoError) throw motoError;

    const availableMotorcycles = allMotorcycles.filter(
      (m) => !bookedMotorcycleIds.has(m.id)
    );

    if (availableMotorcycles.length < booking.bike_quantity) {
      return NextResponse.json({
        booking,
        warning: 'Not enough motorcycles available for this date range'
      });
    }

    // 6️⃣ Assign motorcycles to booking
    const assigned = availableMotorcycles.slice(0, booking.bike_quantity);

    for (let moto of assigned) {
      const { error: assignError } = await supabase
        .from('booking_motorcycles')
        .insert({
          booking_id: booking.id,
          motorcycle_id: moto.id
        });

      if (assignError) {
        console.error('Error inserting booking_motorcycles:', assignError);
        return NextResponse.json({
          booking,
          warning: 'Booking created, but failed to assign motorcycles'
        });
      }
    }

    // 7️⃣ Calculate remaining payment
    const remainingPayment = booking.total_price - booking.down_payment;

    // 8️⃣ Send confirmation email to CUSTOMER
    try {
      console.log('📧 Sending customer confirmation email...');
      const customerEmailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [booking.email],
        subject: `🏍️ Booking Confirmation - ${booking.first_name} ${booking.last_name}`,
        html: generateCustomerEmailHTML(booking, assigned, remainingPayment),
      });
      console.log('✅ Customer email sent!', customerEmailResult.data?.id);
    } catch (emailError) {
      console.error('❌ Failed to send customer email:', emailError);
    }

    // 9️⃣ Send notification email to COMPANY
    try {
      console.log('📧 Sending company notification email...');
      const companyEmailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: ['overlandmotorcycles@gmail.com'],
        subject: `🚨 NEW BOOKING - ${booking.first_name} ${booking.last_name} - ${booking.bike_quantity} Bike${booking.bike_quantity > 1 ? 's' : ''}`,
        html: generateCompanyEmailHTML(booking, assigned, remainingPayment),
      });
      console.log('✅ Company email sent!', companyEmailResult.data?.id);
    } catch (emailError) {
      console.error('❌ Failed to send company email:', emailError);
    }

    // ✅ Done
    return NextResponse.json({ booking, assignedMotorcycles: assigned });

  } catch (error) {
    console.error('❌ verify-payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to generate CUSTOMER email HTML
function generateCustomerEmailHTML(booking, motorcycles, remainingPayment) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f3f4f6;
        }
        .email-container {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%);
          color: #1F2937;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
        }
        .success-icon {
          text-align: center;
          font-size: 56px;
          margin: 0 0 20px 0;
        }
        .intro-text {
          text-align: center;
          font-size: 18px;
          color: #1F2937;
          margin-bottom: 30px;
        }
        .section {
          margin: 25px 0;
          padding: 20px;
          background: #F9FAFB;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
        }
        .section h2 {
          color: #1F2937;
          font-size: 18px;
          margin-top: 0;
          margin-bottom: 15px;
          border-bottom: 2px solid #FCD34D;
          padding-bottom: 8px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #E5E7EB;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #6B7280;
        }
        .detail-value {
          color: #1F2937;
          text-align: right;
          font-weight: 500;
        }
        .highlight {
          background: #DEF7EC;
          color: #03543F;
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: 600;
        }
        .warning {
          background: #FEF3C7;
          border-left: 4px solid #F59E0B;
          padding: 20px;
          margin: 25px 0;
          border-radius: 6px;
        }
        .warning ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }
        .warning li {
          margin: 8px 0;
        }
        .cta-section {
          text-align: center;
          margin: 30px 0;
          padding: 25px;
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-radius: 8px;
        }
        .footer {
          background: #1F2937;
          color: #F9FAFB;
          padding: 30px;
          text-align: center;
        }
        .footer-content {
          margin-bottom: 20px;
        }
        .contact-info {
          margin: 20px 0;
          padding: 20px;
          background: rgba(252, 211, 77, 0.1);
          border-radius: 6px;
        }
        .contact-info a {
          color: #FCD34D;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          body {
            padding: 10px;
          }
          .header, .content, .footer {
            padding: 25px 20px;
          }
          .detail-row {
            flex-direction: column;
            gap: 5px;
          }
          .detail-value {
            text-align: left;
          }
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
            Your Royal Enfield Himalayan rental is confirmed.<br>
            <span style="font-size: 14px; color: #6B7280; margin-top: 10px; display: block;">
              Experience the freedom of the open road with our premium Royal Enfield Himalayan fleet.
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
              <span class="detail-label">Number of Motorcycles:</span>
              <span class="detail-value">${booking.bike_quantity} Royal Enfield Himalayan${booking.bike_quantity > 1 ? 's' : ''}</span>
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
              <li>Valid ID/Passport</li>
              <li>Arrive at least <strong>30 minutes before</strong> your scheduled pickup time</li>
            </ul>
          </div>

          <div class="cta-section">
            <p style="font-size: 16px; margin: 0; color: #1F2937;">
              <strong>Ready for your adventure?</strong><br>
              We'll have your Royal Enfield Himalayan ready and waiting!
            </p>
          </div>
        </div>

        <div class="footer">
          <div class="footer-content">
            <p style="font-weight: 700; font-size: 20px; margin: 0 0 10px 0; color: #FCD34D;">
              Overland Motorcycles
            </p>
            <p style="font-size: 14px; color: #D1D5DB; margin: 5px 0 20px 0; line-height: 1.5;">
              Your trusted partner for motorcycle adventures in Panama.<br>
              Experience the freedom of the open road with our premium Royal Enfield Himalayan fleet.
            </p>
            <p style="margin: 15px 0;">
              <a href="https://www.overland-motorcycles.com" style="color: #FCD34D; text-decoration: none; font-weight: 600; font-size: 15px;">
                🌐 www.overland-motorcycles.com
              </a>
            </p>
          </div>

          <div class="contact-info">
            <p style="margin: 15px 0; font-size: 15px;">
              <strong style="color: #FCD34D;">Get in Touch</strong>
            </p>
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

          <div style="margin: 20px 0; padding: 15px; background: rgba(252, 211, 77, 0.1); border-radius: 6px;">
            <p style="margin: 5px 0; font-size: 14px;">
              <strong style="color: #FCD34D;">Opening Hours</strong>
            </p>
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

// NEW: Helper function to generate COMPANY notification email HTML
function generateCompanyEmailHTML(booking, motorcycles, remainingPayment) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const motorcyclesList = motorcycles.map(m => `Motorcycle ${m.id}: ${m.name || 'Royal Enfield Himalayan'}`).join('<br>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: #DC2626;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .alert-badge {
          display: inline-block;
          background: #FCD34D;
          color: #1F2937;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          margin-top: 10px;
        }
        .content {
          padding: 30px;
        }
        .info-box {
          background: #F9FAFB;
          border-left: 4px solid #FCD34D;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box h3 {
          margin-top: 0;
          color: #1F2937;
          font-size: 16px;
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 10px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 15px 0;
        }
        .detail-item {
          padding: 10px;
          background: white;
          border-radius: 4px;
          border: 1px solid #E5E7EB;
        }
        .detail-label {
          font-size: 12px;
          color: #6B7280;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .detail-value {
          font-size: 16px;
          color: #1F2937;
          font-weight: 500;
        }
        .payment-summary {
          background: #FEF3C7;
          border: 2px solid #FCD34D;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .payment-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #FDE68A;
        }
        .payment-row:last-child {
          border-bottom: none;
          font-size: 18px;
          font-weight: bold;
        }
        .paid-badge {
          background: #10B981;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .action-needed {
          background: #FEE2E2;
          border: 2px solid #DC2626;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .action-needed h3 {
          color: #DC2626;
          margin-top: 0;
        }
        .motorcycles-list {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
        }
        .footer {
          background: #1F2937;
          color: white;
          padding: 20px;
          text-align: center;
          font-size: 12px;
        }
        .timestamp {
          background: #E5E7EB;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 NEW BOOKING RECEIVED</h1>
          <div class="alert-badge">ACTION REQUIRED</div>
        </div>

        <div class="content">
          <div class="timestamp">
            📅 Received: ${new Date().toLocaleString('en-US', { 
              dateStyle: 'full', 
              timeStyle: 'short' 
            })}
          </div>

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
                <div class="detail-value" style="font-size: 14px;">
                  <a href="mailto:${booking.email}">${booking.email}</a>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value">
                  <a href="tel:${booking.phone}">${booking.phone || 'Not provided'}</a>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Country</div>
                <div class="detail-value">${booking.country || 'Not provided'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Motorcycles</div>
                <div class="detail-value" style="font-size: 20px; color: #DC2626;">
                  ${booking.bike_quantity} Bike${booking.bike_quantity > 1 ? 's' : ''}
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
            ${motorcyclesList || 'No motorcycles assigned yet'}
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
              <li><strong>Verify motorcycles ${booking.bike_quantity > 1 ? 'are' : 'is'} serviced and ready</strong></li>
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
          <p style="margin: 0;">
            <strong>Overland Motorcycles</strong> - Admin Notification System
          </p>
          <p style="margin: 10px 0 0 0; opacity: 0.7;">
            This is an automated notification. Do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}