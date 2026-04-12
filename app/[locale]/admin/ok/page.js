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
      alert('Incorrect password');
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
      alert('Error loading data. Make sure you are using the service_role key for admin access.');
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
      alert('Payment marked as fully paid!');
    } catch (error) {
      alert('Error updating payment status: ' + error.message);
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
      alert('Booking status updated successfully!');
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      try {
        await deleteBooking(bookingId);
        await loadData();
        setSelectedBooking(null);
        alert('Booking deleted successfully!');
      } catch (error) {
        alert('Error deleting booking: ' + error.message);
      }
    }
  };

  const handleMarkMessageRead    = async (messageId) => { try { await markMessageAsRead(messageId); await loadData(); } catch (e) { alert('Error: ' + e.message); } };
  const handleMarkMessageReplied = async (messageId, notes) => { try { await markMessageAsReplied(messageId, notes); await loadData(); setSelectedMessage(null); alert('Message marked as replied!'); } catch (e) { alert('Error: ' + e.message); } };
  const handleDeleteMessage      = async (messageId) => { if (confirm('Delete this message?')) { try { await deleteMessage(messageId); await loadData(); setSelectedMessage(null); alert('Message deleted!'); } catch (e) { alert('Error: ' + e.message); } } };

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
        alert(
          `Not enough ${modelLabel} bikes available for ${newBooking.start_date} → ${newBooking.end_date}.\n` +
          `Needed: ${needed}  |  Available: ${available.length}\n\nNo booking was created.`
        );
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

      await loadData();
      setShowAddBooking(false);
      setNewBooking(EMPTY_BOOKING);
      alert('Booking added successfully!');
    } catch (error) {
      console.error('Error adding booking:', error);
      alert('Error adding booking: ' + error.message);
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
      />

      <AddBookingModal
        show={showAddBooking}
        onClose={() => setShowAddBooking(false)}
        newBooking={newBooking}
        setNewBooking={setNewBooking}
        onSubmit={handleAddBooking}
        calculateDays={calculateDays}
        calculatePrice={calculatePrice}
      />
    </div>
  );
};

export default AdminDashboard;