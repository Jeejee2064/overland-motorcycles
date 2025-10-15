import { supabase } from './client';

// Create a message (from contact form)
export async function createMessage(messageData) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      name: messageData.name,
      email: messageData.email,
      phone: messageData.phone || null,
      message: messageData.message
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    throw error;
  }

  return data;
}

// Get all messages (for admin dashboard)
export async function getAllMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data;
}

// Get unread messages only
export async function getUnreadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('status', 'unread')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching unread messages:', error);
    throw error;
  }

  return data;
}

// Mark message as read
export async function markMessageAsRead(id) {
  const { data, error } = await supabase
    .from('messages')
    .update({
      status: 'read',
      read_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }

  return data;
}

// Mark message as replied
export async function markMessageAsReplied(id, adminNotes) {
  const { data, error } = await supabase
    .from('messages')
    .update({
      status: 'replied',
      replied_at: new Date().toISOString(),
      admin_notes: adminNotes || null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error marking message as replied:', error);
    throw error;
  }

  return data;
}

// Delete a message
export async function deleteMessage(id) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }

  return true;
}