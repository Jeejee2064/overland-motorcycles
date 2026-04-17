import { formatDate } from './utils';

const MODEL_LABELS = {
  Himalayan: 'Royal Enfield Himalayan 450',
  CFMoto700: 'CF Moto 700 CL-X',
};

export function generateBookingReminderEmailHTML(booking, motorcycles) {
  const modelLabel = MODEL_LABELS[booking.motorcycle_model] || booking.motorcycle_model || 'Unknown model';

  const motorcyclesList = motorcycles.length
    ? motorcycles.map(m => `• ${m.name} (${modelLabel})`).join('<br>')
    : '<span style="color:#DC2626;">⚠️ No motorcycles assigned — check admin dashboard!</span>';

  const remainingPayment = (parseFloat(booking.total_price) - parseFloat(booking.down_payment)).toFixed(2);
  const initPaid = booking.webhook_received && booking.payment_status === 'paid';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
        .container { background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FACC15 0%, #EAB308 100%); color: #1F2937; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.8; }
        .badge { display: inline-block; background: #1F2937; color: #FACC15; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-top: 12px; letter-spacing: 0.04em; }
        .content { padding: 28px 30px; }
        .timestamp { background: #F9FAFB; border: 1px solid #E5E7EB; padding: 10px 16px; border-radius: 6px; text-align: center; font-size: 12px; color: #6B7280; margin-bottom: 24px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px 14px; }
        .info-label { font-size: 11px; color: #9CA3AF; font-weight: 600; text-transform: uppercase; margin-bottom: 3px; }
        .info-value { font-size: 15px; color: #111827; font-weight: 600; }
        .info-value a { color: #2563EB; text-decoration: none; }
        .info-value a:hover { text-decoration: underline; }
        .bikes-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 14px 16px; line-height: 2; font-size: 14px; color: #1E40AF; }
        .payment-box { background: #FFFBEB; border: 2px solid #FCD34D; border-radius: 8px; padding: 16px 20px; }
        .pay-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #FDE68A; font-size: 14px; }
        .pay-row:last-child { border-bottom: none; font-size: 16px; font-weight: 700; }
        .paid-badge { background: #10B981; color: white; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; }
        .due-badge { background: #DC2626; color: white; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; }
        .checklist { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px 20px; }
        .checklist h3 { color: #DC2626; margin: 0 0 10px; font-size: 14px; }
        .checklist ul { margin: 0; padding-left: 18px; font-size: 13px; color: #374151; line-height: 2; }
        .cta { background: #1F2937; border-radius: 8px; padding: 18px; text-align: center; margin-top: 20px; }
        .cta a { color: #FACC15; text-decoration: none; font-weight: 700; font-size: 14px; }
        .footer { background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 18px; text-align: center; font-size: 12px; color: #9CA3AF; }
      </style>
    </head>
    <body>
      <div class="container">

        <div class="header">
          <div style="font-size: 28px; margin-bottom: 6px;">🏍️</div>
          <h1>Pickup in 2 Days</h1>
          <p>${modelLabel} · ${booking.bike_quantity} bike${booking.bike_quantity > 1 ? 's' : ''}</p>
          <div class="badge">⏰ Reminder — ${formatDate(booking.start_date)}</div>
        </div>

        <div class="content">

          <div class="timestamp">
            Auto-reminder sent ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Panama' })} (Panama time)
          </div>

          <!-- Customer -->
          <div class="section">
            <div class="section-title">👤 Customer</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">${booking.first_name} ${booking.last_name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Country</div>
                <div class="info-value">${booking.country || '—'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value"><a href="mailto:${booking.email}">${booking.email}</a></div>
              </div>
              <div class="info-item">
                <div class="info-label">Phone (WhatsApp)</div>
                <div class="info-value">
                  <a href="https://wa.me/${(booking.phone || '').replace(/\D/g, '')}">
                    ${booking.phone || '—'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Dates -->
          <div class="section">
            <div class="section-title">📅 Rental Period</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Pick-up</div>
                <div class="info-value" style="color: #DC2626;">${formatDate(booking.start_date)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Return</div>
                <div class="info-value">${formatDate(booking.end_date)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Duration</div>
                <div class="info-value">${booking.duration_days || '—'} days</div>
              </div>
              <div class="info-item">
                <div class="info-label">Model</div>
                <div class="info-value" style="font-size: 13px;">${modelLabel}</div>
              </div>
            </div>
          </div>

          <!-- Bikes -->
          <div class="section">
            <div class="section-title">🏍️ Assigned Motorcycles</div>
            <div class="bikes-box">${motorcyclesList}</div>
          </div>

          <!-- Payment -->
          <div class="section">
            <div class="section-title">💰 Payment Status</div>
            <div class="payment-box">
              <div class="pay-row">
                <span>Initial Payment (50%)</span>
                <span>
                  ${initPaid
                    ? `<span class="paid-badge">PAID</span> $${parseFloat(booking.down_payment).toFixed(2)}`
                    : `<span class="due-badge">PENDING</span> $${parseFloat(booking.down_payment).toFixed(2)}`
                  }
                </span>
              </div>
              <div class="pay-row">
                <span>Security Deposit (at pickup)</span>
                <span style="font-weight: 600;">$${parseFloat(booking.deposit || 0).toFixed(2)}</span>
              </div>
              <div class="pay-row">
                <span style="color: #DC2626;">Remaining Balance (at pickup)</span>
                <span style="color: #DC2626;">$${remainingPayment}</span>
              </div>
              <div class="pay-row">
                <span>Total</span>
                <span>$${parseFloat(booking.total_price).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Checklist -->
          <div class="section">
            <div class="checklist">
              <h3>⚠️ Pre-Pickup Checklist</h3>
              <ul>
                <li>Verify ${modelLabel} is serviced and fuelled</li>
                <li>Prepare rental agreement for <strong>${booking.first_name} ${booking.last_name}</strong></li>
                <li>Confirm customer has valid motorcycle license</li>
                <li>Collect remaining balance: <strong>$${remainingPayment}</strong></li>
                <li>Collect security deposit: <strong>$${parseFloat(booking.deposit || 0).toFixed(2)}</strong></li>
                ${booking.special_requests ? `<li>Special request: <strong>${booking.special_requests}</strong></li>` : ''}
              </ul>
            </div>
          </div>

          <div class="cta">
            <a href="https://www.overland-motorcycles.com/admin/ok/bookings/${booking.id}">
              📋 View Full Booking Details →
            </a>
          </div>

        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Overland Motorcycles — Automated Reminder</p>
          <p>Booking ID: <code>${booking.id}</code></p>
        </div>

      </div>
    </body>
    </html>
  `;
}