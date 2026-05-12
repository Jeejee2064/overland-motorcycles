import { formatDate } from './utils';

const MODEL_LABELS = {
  Himalayan: 'Royal Enfield Himalayan 450',
  CFMoto700: 'CF Moto 700 CL-X',
};

export function generateReturnReminderEmailHTML(booking, motorcycles, riders) {
  const modelLabel = MODEL_LABELS[booking.motorcycle_model] || booking.motorcycle_model || 'Unknown model';

  const motorcyclesList = motorcycles.length
    ? motorcycles.map(m => `• ${m.name} (${modelLabel})`).join('<br>')
    : '<span style="color:#DC2626;">⚠️ No motorcycles assigned</span>';

  // All riders: primary booker first, then additional riders
  const allRiders = [
    {
      name:  `${booking.first_name} ${booking.last_name}`,
      email: booking.email,
      phone: booking.phone,
      label: 'Primary Rider',
    },
    ...(riders || []).map((r, i) => ({
      name:  `${r.first_name} ${r.last_name}`,
      email: r.email,
      phone: r.phone,
      label: `Rider ${i + 2}`,
    })),
  ];

  const ridersHTML = allRiders.map(r => `
    <div class="rider-card">
      <div class="rider-label">${r.label}</div>
      <div class="rider-name">${r.name}</div>
      <div class="rider-contacts">
        ${r.email ? `<a href="mailto:${r.email}">${r.email}</a>` : '<span style="color:#9CA3AF;">No email</span>'}
        &nbsp;·&nbsp;
        ${r.phone ? `<a href="https://wa.me/${r.phone.replace(/\D/g, '')}">${r.phone}</a>` : '<span style="color:#9CA3AF;">No phone</span>'}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
        .container { background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }
        .badge { display: inline-block; background: white; color: #0284C7; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-top: 12px; }
        .content { padding: 28px 30px; }
        .timestamp { background: #F9FAFB; border: 1px solid #E5E7EB; padding: 10px 16px; border-radius: 6px; text-align: center; font-size: 12px; color: #6B7280; margin-bottom: 24px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; padding: 12px 14px; }
        .info-label { font-size: 11px; color: #9CA3AF; font-weight: 600; text-transform: uppercase; margin-bottom: 3px; }
        .info-value { font-size: 15px; color: #111827; font-weight: 600; }
        .info-value a { color: #2563EB; text-decoration: none; }
        .bikes-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 14px 16px; line-height: 2; font-size: 14px; color: #1E40AF; }
        .rider-card { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
        .rider-label { font-size: 11px; font-weight: 700; color: #16A34A; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .rider-name { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .rider-contacts { font-size: 13px; color: #374151; }
        .rider-contacts a { color: #2563EB; text-decoration: none; }
        .cta { background: #1F2937; border-radius: 8px; padding: 18px; text-align: center; margin-top: 20px; }
        .cta a { color: #FACC15; text-decoration: none; font-weight: 700; font-size: 14px; }
        .footer { background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 18px; text-align: center; font-size: 12px; color: #9CA3AF; }
      </style>
    </head>
    <body>
      <div class="container">

        <div class="header">
          <div style="font-size: 28px; margin-bottom: 6px;">🔄</div>
          <h1>Return Tomorrow</h1>
          <p>${modelLabel} · ${booking.bike_quantity} bike${booking.bike_quantity > 1 ? 's' : ''}</p>
          <div class="badge">📅 Return date: ${formatDate(booking.end_date)}</div>
        </div>

        <div class="content">

          <div class="timestamp">
            Auto-reminder sent ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Panama' })} (Panama time)
          </div>

          <!-- Riders -->
          <div class="section">
            <div class="section-title">👤 Rider${allRiders.length > 1 ? 's' : ''}</div>
            ${ridersHTML}
          </div>

          <!-- Dates -->
          <div class="section">
            <div class="section-title">📅 Rental Period</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Pick-up</div>
                <div class="info-value">${formatDate(booking.start_date)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Return</div>
                <div class="info-value" style="color: #0284C7;">${formatDate(booking.end_date)}</div>
              </div>
            </div>
          </div>

          <!-- Bikes -->
          <div class="section">
            <div class="section-title">🏍️ Motorcycles to Return</div>
            <div class="bikes-box">${motorcyclesList}</div>
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
