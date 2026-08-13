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

