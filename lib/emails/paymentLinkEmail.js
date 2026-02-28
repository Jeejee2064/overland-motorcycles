export const generatePaymentLinkEmailHTML = (booking, links) => {
  const balanceAmount = (parseFloat(booking.total_price) - parseFloat(booking.down_payment)).toFixed(2);

  const sections = links.map((link, i) => {
    const num = i + 1;

    if (link.type === 'full') {
      return `
        <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:24px;margin-bottom:20px;">
          <h3 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 4px;">${num}. Full Payment — $${parseFloat(booking.total_price).toFixed(2)}</h3>
          <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">Complete payment for your rental (initial + remaining balance combined).</p>
          <a href="${link.url}" style="display:block;background:#22c55e;color:#ffffff;text-align:center;padding:14px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">
            Pay Full Amount →
          </a>
        </div>`;
    }

    if (link.type === 'initial') {
      return `
        <div style="background:#fefce8;border:2px solid #facc15;border-radius:12px;padding:24px;margin-bottom:20px;">
          <h3 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 4px;">${num}. Initial Payment (50%) — $${parseFloat(booking.down_payment).toFixed(2)}</h3>
          <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">First payment to confirm your booking.</p>
          <a href="${link.url}" style="display:block;background:#facc15;color:#111827;text-align:center;padding:14px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">
            Pay Initial Deposit →
          </a>
        </div>`;
    }

    if (link.type === 'auth') {
      const label = booking.bike_quantity > 1
        ? `Security Deposit #${link.index + 1}`
        : 'Security Deposit';
      return `
        <div style="background:#fefce8;border:2px solid #facc15;border-radius:12px;padding:24px;margin-bottom:20px;">
          <h3 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 4px;">${num}. ${label} — $1,000.00</h3>
          <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">Authorization only — your card will not be charged unless damages occur.</p>
          <a href="${link.url}" style="display:block;background:#facc15;color:#111827;text-align:center;padding:14px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">
            Authorize Deposit →
          </a>
        </div>`;
    }

    // balance
    return `
      <div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:12px;padding:24px;margin-bottom:20px;">
        <h3 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 4px;">${num}. Remaining Balance — $${balanceAmount}</h3>
        <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">Final payment. Already paid: $${parseFloat(booking.down_payment).toFixed(2)}</p>
        <a href="${link.url}" style="display:block;background:#3b82f6;color:#ffffff;text-align:center;padding:14px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">
          Pay Remaining Balance →
        </a>
      </div>`;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#111827;padding:32px;text-align:center;">
      <img src="${process.env.NEXT_PUBLIC_BASE_URL}/LOGO.svg" alt="Overland Motorcycles" style="height:50px;" />
    </div>
    <div style="background:#1f2937;padding:32px;text-align:center;">
      <h1 style="color:#facc15;font-size:28px;margin:0 0 8px;">Complete Your Booking</h1>
      <p style="color:#d1d5db;font-size:16px;margin:0;">Hi ${booking.first_name}, please complete the following payment${links.length > 1 ? 's' : ''}.</p>
    </div>
    <div style="padding:32px;">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:4px 0;">Name</td><td style="color:#111827;font-weight:600;text-align:right;">${booking.first_name} ${booking.last_name}</td></tr>
          <tr><td style="color:#6b7280;padding:4px 0;">Motorcycle</td><td style="color:#111827;font-weight:600;text-align:right;">${booking.motorcycle_model}</td></tr>
          <tr><td style="color:#6b7280;padding:4px 0;">Dates</td><td style="color:#111827;font-weight:600;text-align:right;">${booking.start_date} → ${booking.end_date}</td></tr>
          <tr><td style="color:#6b7280;padding:4px 0;">Bikes</td><td style="color:#111827;font-weight:600;text-align:right;">${booking.bike_quantity}</td></tr>
        </table>
      </div>
      ${sections}
      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        Questions? <a href="https://wa.me/50768051100" style="color:#facc15;">WhatsApp</a><br/>Overland Motorcycles Panama
      </p>
    </div>
  </div>
</body>
</html>`;
};