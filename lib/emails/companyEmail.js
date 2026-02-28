import { formatDate } from './utils';

export function generateCompanyEmailHTML(
  booking,
  motorcycles,
  remainingPayment,
  modelLabel,
  shortageWarning
) {
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