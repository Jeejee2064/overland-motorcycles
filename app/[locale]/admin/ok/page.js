'use client'

import React, { useState, useEffect } from 'react';
import { createBooking, updateBookingPayment, getAllBookings, updateBookingStatus, deleteBooking } from '@/lib/supabase/bookings';
import { getAllMessages, markMessageAsRead, markMessageAsReplied, deleteMessage } from '@/lib/supabase/messages';

import AdminHeader from '@/components/admin/AdminHeader';
import AdminNavigation from '@/components/admin/AdminNavigation';
import OverviewTab from '@/components/admin/OverviewTab';
import BookingsTab from '@/components/admin/BookingsTab';
import MessagesTab from '@/components/admin/MessagesTab';
import CalendarTab from '@/components/admin/CalendarTab';
import MotorcyclesTab from '@/components/admin/MotorcyclesTab';
import BookingDetailModal from '@/components/admin/BookingDetailModal';
import AddBookingModal from '@/components/admin/AddBookingModal';
import BookingLinkGeneratorTab from '@/components/admin/BookingLinkGeneratorTab';
import RevenueTab from '@/components/admin/RevenueTab';
import { supabase } from '@/lib/supabase/client';

const HIMALAYAN_PRICING = [
  { days: 1,  price: 280 }, { days: 2,  price: 280 }, { days: 3,  price: 400 },
  { days: 4,  price: 530 }, { days: 5,  price: 660 }, { days: 6,  price: 790 },
  { days: 7,  price: 899 }, { days: 8,  price: 1010 }, { days: 9,  price: 1175 },
  { days: 10, price: 1230 }, { days: 11, price: 1290 }, { days: 12, price: 1350 },
  { days: 13, price: 1380 }, { days: 14, price: 1420 }, { days: 21, price: 1800 },
];

const CFMOTO_PRICING = [
  { days: 1,  price: 340 }, { days: 2,  price: 340 }, { days: 3,  price: 480 },
  { days: 4,  price: 640 }, { days: 5,  price: 790 }, { days: 6,  price: 950 },
  { days: 7,  price: 1080 }, { days: 8,  price: 1210 }, { days: 9,  price: 1410 },
  { days: 10, price: 1480 }, { days: 11, price: 1550 }, { days: 12, price: 1620 },
  { days: 13, price: 1660 }, { days: 14, price: 1700 }, { days: 21, price: 2160 },
];

export const getPricingTable = (model) =>
  model === 'CFMoto700' ? CFMOTO_PRICING : HIMALAYAN_PRICING;

export const calculatePriceForModel = (days, model) => {
  if (days === 0) return 0;
  const table  = getPricingTable(model);
  const exact  = table.find(p => p.days === days);
  if (exact) return exact.price;
  const sorted = [...table].sort((a, b) => a.days - b.days);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (days > sorted[i].days && days < sorted[i + 1].days) return sorted[i + 1].price;
  }
  if (days > 21) {
    const last = sorted[sorted.length - 1];
    return Math.round((last.price / last.days) * days);
  }
  return 0;
};

const EMPTY_BOOKING = {
  first_name:       '',
  last_name:        '',
  email:            '',
  phone:            '',
  country:          '',
  start_date:       '',
  end_date:         '',
  bike_quantity:    1,
  motorcycle_model: 'Himalayan',
  total_price:      0,
  down_payment:     0,
  deposit:          1000,
  special_requests: '',
  hear_about_us:    'walk-in',
  status:           'confirmed',
  paid:             false,
  auth_status:      null,
  balance_status:   null,
};

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword]               = useState('');
  const [activeTab, setActiveTab]             = useState('calendar');
  const [bookings, setBookings]               = useState([]);
  const [messages, setMessages]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [filterStatus, setFilterStatus]       = useState('all');
  const [showAddBooking, setShowAddBooking]   = useState(false);
  const [newBooking, setNewBooking]           = useState(EMPTY_BOOKING);
  const [newBookingRiders, setNewBookingRiders] = useState([]);
  const [toast, setToast]                     = useState(null);
  const [confirmModal, setConfirmModal]       = useState(null);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const withConfirm = (msg, onConfirm) => setConfirmModal({ msg, onConfirm });

  useEffect(() => {
    const authenticated = localStorage.getItem('admin_authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const ADMIN_PASSWORD = 'RoyaleMotoPanama!';
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      loadData();
    } else {
      notify('Incorrect password', 'error');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, messagesData] = await Promise.all([
        getAllBookings(),
        getAllMessages(),
      ]);
      setBookings(bookingsData || []);
      setMessages(messagesData || []);
      return { bookings: bookingsData, messages: messagesData };
    } catch (error) {
      console.error('Error loading data:', error);
      notify('Error loading data. Check the service role key.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedBooking = async (bookingId) => {
    try {
      const freshBookings = await getAllBookings();
      const updatedBooking = freshBookings.find(b => b.id === bookingId);
      if (updatedBooking) setSelectedBooking(updatedBooking);
      setBookings(freshBookings);
    } catch (error) {
      console.error('Error refreshing booking:', error);
    }
  };

  const handleBookingUpdate = async () => {
    if (selectedBooking) await refreshSelectedBooking(selectedBooking.id);
    await loadData();
  };

  const handlePaymentToggle = async (bookingId, newPaidStatus) => {
    try {
      await updateBookingPayment(bookingId, newPaidStatus);
      if (newPaidStatus) await updateBookingStatus(bookingId, 'fully paid');
      await refreshSelectedBooking(bookingId);
      await loadData();
      notify('Payment marked as fully paid!');
    } catch (error) {
      notify('Error updating payment: ' + error.message, 'error');
    }
  };

  const stats = {
    totalBookings:     bookings.length,
    pendingBookings:   bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue:      bookings.filter(b => b.paid).reduce((sum, b) => sum + parseFloat(b.total_price), 0),
    unreadMessages:    messages.filter(m => m.status === 'unread').length,
    avgBookingValue:   bookings.length > 0
      ? bookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0) / bookings.length
      : 0,
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      await refreshSelectedBooking(bookingId);
      await loadData();
      notify('Status updated successfully!');
    } catch (error) {
      notify('Error updating status: ' + error.message, 'error');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    withConfirm('Delete this booking? This cannot be undone.', async () => {
      try {
        await deleteBooking(bookingId);
        await loadData();
        setSelectedBooking(null);
        notify('Booking deleted.');
      } catch (error) {
        notify('Error deleting booking: ' + error.message, 'error');
      }
    });
  };

  const handleMarkMessageRead = async (messageId) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'read' } : m));
    try { await markMessageAsRead(messageId); }
    catch (e) { notify('Error: ' + e.message, 'error'); await loadData(); }
  };
  const handleMarkMessageReplied = async (messageId, notes) => {
    try { await markMessageAsReplied(messageId, notes); await loadData(); setSelectedMessage(null); notify('Message marked as replied!'); }
    catch (e) { notify('Error: ' + e.message, 'error'); }
  };
  const handleDeleteMessage = async (messageId) => {
    withConfirm('Delete this message?', async () => {
      try { await deleteMessage(messageId); await loadData(); setSelectedMessage(null); notify('Message deleted.'); }
      catch (e) { notify('Error: ' + e.message, 'error'); }
    });
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    try {
      const startDate = new Date(newBooking.start_date);
      const endDate   = new Date(newBooking.end_date);

      // 1. Check availability
      const { data: overlappingBookings, error: overlapError } = await supabase
        .from('bookings')
        .select(`id, start_date, end_date, booking_motorcycles ( motorcycle_id )`)
        .in('status', ['confirmed', 'paid', 'pending']);

      if (overlapError) throw overlapError;

      const bookedMotorcycleIds = new Set();
      for (const b of overlappingBookings) {
        const bStart   = new Date(b.start_date);
        const bEnd     = new Date(b.end_date);
        const overlaps = startDate <= bEnd && endDate >= bStart;
        if (overlaps && b.booking_motorcycles?.length) {
          for (const bm of b.booking_motorcycles) bookedMotorcycleIds.add(bm.motorcycle_id);
        }
      }

      const { data: modelMotorcycles, error: motoError } = await supabase
        .from('motorcycles')
        .select('*')
        .eq('model', newBooking.motorcycle_model)
        .eq('is_available', true)
        .order('name');

      if (motoError) throw motoError;

      const available = (modelMotorcycles || []).filter(m => !bookedMotorcycleIds.has(m.id));
      const needed    = newBooking.motorcycle_model === 'CFMoto700' ? 1 : newBooking.bike_quantity;

      if (available.length < needed) {
        const modelLabel = newBooking.motorcycle_model === 'CFMoto700' ? 'CF Moto 700' : 'Himalayan';
        notify(`Not enough ${modelLabel} bikes available (needed ${needed}, available ${available.length}).`, 'error');
        return;
      }

      // 2. Create booking
      const booking = await createBooking({
        ...newBooking,
        motorcycle_model: newBooking.motorcycle_model,
        bike_quantity:    needed,
        auth_status:      newBooking.auth_status,
        balance_status:   newBooking.balance_status,
      });

      // 3. Assign motorcycles
      if (booking && newBooking.status === 'confirmed') {
        const assigned = available.slice(0, needed);
        for (const moto of assigned) {
          const { error: assignError } = await supabase
            .from('booking_motorcycles')
            .insert({ booking_id: booking.id, motorcycle_id: moto.id });
          if (assignError) throw new Error('Failed to assign motorcycles: ' + assignError.message);
        }
      }

      // 4. Insert additional riders
      const validRiders = newBookingRiders.filter(r => r.first_name && r.last_name);
      if (validRiders.length > 0) {
        const { error: ridersError } = await supabase
          .from('booking_riders')
          .insert(validRiders.map((r, i) => ({
            booking_id:  booking.id,
            rider_index: i + 2,
            first_name:  r.first_name,
            last_name:   r.last_name,
            email:       r.email || null,
            phone:       r.phone || null,
          })));
        if (ridersError) console.error('Error inserting riders:', ridersError);
      }

      await loadData();
      setShowAddBooking(false);
      setNewBooking(EMPTY_BOOKING);
      setNewBookingRiders([]);
      notify('Booking added successfully!');
    } catch (error) {
      console.error('Error adding booking:', error);
      notify('Error adding booking: ' + error.message, 'error');
    }
  };

  const calculateDays = () => {
    if (!newBooking.start_date || !newBooking.end_date) return 0;
    const start = new Date(newBooking.start_date);
    const end   = new Date(newBooking.end_date);
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculatePrice = () => calculatePriceForModel(calculateDays(), newBooking.motorcycle_model);

  useEffect(() => {
    if (newBooking.start_date && newBooking.end_date) {
      const rentalPrice      = calculatePrice();
      const numBikes         = newBooking.motorcycle_model === 'CFMoto700' ? 1 : newBooking.bike_quantity;
      const totalRentalPrice = rentalPrice * numBikes;
      const totalDeposit     = 1000 * numBikes;
      const downPayment      = totalRentalPrice / 2;
      setNewBooking(prev => ({
        ...prev,
        total_price:   totalRentalPrice,
        down_payment:  downPayment,
        deposit:       totalDeposit,
        bike_quantity: prev.motorcycle_model === 'CFMoto700' ? 1 : prev.bike_quantity,
      }));
    }
  }, [newBooking.start_date, newBooking.end_date, newBooking.bike_quantity, newBooking.motorcycle_model]);

  useEffect(() => {
    const qty = newBooking.motorcycle_model === 'CFMoto700' ? 1 : newBooking.bike_quantity;
    const riderCount = Math.max(0, qty - 1);
    setNewBookingRiders(prev =>
      Array.from({ length: riderCount }, (_, i) =>
        prev[i] || { first_name: '', last_name: '', email: '', phone: '' }
      )
    );
  }, [newBooking.bike_quantity, newBooking.motorcycle_model]);

  const handleMessageClick = (msg) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') handleMarkMessageRead(msg.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Enter password to access dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Enter admin password" autoFocus />
            </div>
            <button type="submit"
              className="w-full px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader onRefresh={loadData} onLogout={handleLogout} />
      <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview'       && <OverviewTab stats={stats} bookings={bookings} messages={messages} />}
        {activeTab === 'bookings'       && (
          <BookingsTab
            bookings={bookings}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onViewDetails={setSelectedBooking}
            onAddBooking={() => setShowAddBooking(true)}
          />
        )}
        {activeTab === 'messages'       && (
          <MessagesTab
            messages={messages}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onMessageClick={handleMessageClick}
            onMarkRead={handleMarkMessageRead}
            onMarkReplied={handleMarkMessageReplied}
            onDeleteMessage={handleDeleteMessage}
          />
        )}
        {activeTab === 'calendar'       && <CalendarTab />}
        {activeTab === 'motorcycles'    && <MotorcyclesTab />}
        {activeTab === 'revenue'        && <RevenueTab bookings={bookings} />}
        {activeTab === 'link-generator' && <BookingLinkGeneratorTab />}
      </main>

      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDeleteBooking}
        onPaymentToggle={handlePaymentToggle}
        onUpdate={handleBookingUpdate}
        notify={notify}
      />

      <AddBookingModal
        show={showAddBooking}
        onClose={() => { setShowAddBooking(false); setNewBooking(EMPTY_BOOKING); setNewBookingRiders([]); }}
        newBooking={newBooking}
        setNewBooking={setNewBooking}
        onSubmit={handleAddBooking}
        calculateDays={calculateDays}
        calculatePrice={calculatePrice}
        riders={newBookingRiders}
        setRiders={setNewBookingRiders}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-semibold transition-all ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-gray-800 font-semibold mb-6 text-center">{confirmModal.msg}</p>
            <div className="flex gap-3">
              <button
                onClick={async () => { const fn = confirmModal.onConfirm; setConfirmModal(null); await fn(); }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;