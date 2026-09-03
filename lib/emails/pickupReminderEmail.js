import { formatDate } from './utils';

const MODEL_LABELS = {
  Himalayan: 'Royal Enfield Himalayan 450',
  CFMoto700: 'CF Moto 700 CL-X',
};

// Only Panama City has a shareable Maps link on file — Coronado pickups
// just show the location name until an address/link exists for it too.
const PANAMA_CITY_MAPS_LINK = 'https://maps.app.goo.gl/vHWdAHfEj7YE2Ayo9';

export function generatePickupReminderEmailHTML(booking) {
  const modelLabel = MODEL_LABELS[booking.motorcycle_model] || booking.motorcycle_model || 'your motorcycle';
  const pickupLocation = booking.pickup_location || 'Panama City';
  const depositAmount = 1000 * (booking.bike_quantity || 1);

  const mapsRow = pickupLocation === 'Panama City'
    ? `<a href="${PANAMA_CITY_MAPS_LINK}" style="color:#2563eb;text-decoration:none;font-weight:600;">Open in Google Maps →</a>`
    : '';

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
      <h1 style="color:#facc15;font-size:26px;margin:0 0 8px;">Your Pickup is in 2 Days</h1>
      <p style="color:#d1d5db;font-size:16px;margin:0;">Hi ${booking.first_name}, we're looking forward to seeing you soon.</p>
    </div>
    <div style="padding:32px;">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:4px 0;">Motorcycle</td><td style="color:#111827;font-weight:600;text-align:right;">${modelLabel}</td></tr>
          <tr><td style="color:#6b7280;padding:4px 0;">Pickup Date</td><td style="color:#111827;font-weight:600;text-align:right;">${formatDate(booking.start_date)}</td></tr>
          <tr><td style="color:#6b7280;padding:4px 0;">Pickup Location</td><td style="color:#111827;font-weight:600;text-align:right;">${pickupLocation}</td></tr>
        </table>
      </div>

      <div style="background:#fefce8;border:2px solid #facc15;border-radius:12px;padding:24px;margin-bottom:20px;">
        <h3 style="color:#111827;font-size:16px;font-weight:700;margin:0 0 14px;">Before you arrive, please:</h3>
        <ul style="color:#374151;font-size:14px;line-height:1.9;margin:0;padding-left:18px;">
          <li>Send us photos of your <strong>passport</strong> and <strong>motorcycle license</strong> so we can prepare your contract</li>
          <li>Let us know your <strong>expected arrival time</strong></li>
          <li>Remember a <strong>$${depositAmount.toLocaleString('en-US')} security deposit</strong> is required at pickup</li>
        </ul>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:20px;">
        <h3 style="color:#111827;font-size:15px;font-weight:700;margin:0 0 8px;">📍 Where to find us</h3>
        <p style="color:#1e40af;font-size:14px;margin:0 0 6px;">${pickupLocation}</p>
        ${mapsRow ? `<p style="margin:0 0 6px;">${mapsRow}</p>` : ''}
        <p style="color:#1e40af;font-size:14px;margin:0;">Opening hours: 9 AM – 5 PM</p>
      </div>

      <p style="color:#6b7280;font-size:13px;text-align:center;margin:24px 0 0;">
        Just reply to this email with the requested information — see you soon!
      </p>

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">
        Questions? <a href="https://wa.me/50768051100" style="color:#facc15;">WhatsApp</a><br/>Overland Motorcycles Team
      </p>
    </div>
  </div>
</body>
</html>`;
}
