import { formatDate } from './utils';

export function generateCustomerEmailHTML(
  booking,
  motorcycles,
  remainingPayment,
  modelLabel
) {
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
          <p style="font-weight: 700; font-size: 20px; margin: 0 0 10px 0; color: #FCD34D;">Overland Motorcycles</p>
        </div>
      </div>
    </body>
    </html>
  `;
}