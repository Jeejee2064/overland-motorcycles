// Contact-form message helpers.
//
// Goes through server API routes instead of the anon Supabase client — RLS
// hardening removed anon's direct access (read AND write) to `messages`,
// since it holds contact-form submitters' name/email/phone.

// Create a message (from contact form)
export async function createMessage(messageData) {
  const res = await fetch('/api/messages', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name:    messageData.name,
      email:   messageData.email,
      phone:   messageData.phone || null,
      message: messageData.message,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Error creating message:', data.error);
    throw new Error(data.error || 'Failed to send message');
  }
  return data.message;
}

// Get all messages (for admin dashboard)
export async function getAllMessages() {
  const res  = await fetch('/api/admin/messages');
  const data = await res.json();
  if (!res.ok) {
    console.error('Error fetching messages:', data.error);
    throw new Error(data.error || 'Failed to fetch messages');
  }
  return data.messages || [];
}

// Get unread messages only
export async function getUnreadMessages() {
  const res  = await fetch('/api/admin/messages?status=unread');
  const data = await res.json();
  if (!res.ok) {
    console.error('Error fetching unread messages:', data.error);
    throw new Error(data.error || 'Failed to fetch unread messages');
  }
  return data.messages || [];
}
