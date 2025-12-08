'use client'
import React, { useState, useEffect } from 'react';
import { createBooking, getAllBookings, updateBookingStatus, deleteBooking } from '@/lib/supabase/bookings';
import { getAllMessages, markMessageAsRead, markMessageAsReplied, deleteMessage } from '@/lib/supabase/messages';

// Import all the new components
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


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    start_date: '',
    end_date: '',
    bike_quantity: 1,
    total_price: 0,
    down_payment: 0,
    deposit: 1000,
    special_requests: '',
    hear_about_us: 'walk-in',
    status: 'confirmed',
    paid: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, messagesData] = await Promise.all([
        getAllBookings(),
        getAllMessages()
      ]);
      setBookings(bookingsData || []);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data. Make sure you are using the service_role key for admin access.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings.filter(b => b.paid).reduce((sum, b) => sum + parseFloat(b.total_price), 0),
    unreadMessages: messages.filter(m => m.status === 'unread').length,
    avgBookingValue: bookings.length > 0 ? bookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0) / bookings.length : 0
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
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

  const handleMarkMessageRead = async (messageId) => {
    try {
      await markMessageAsRead(messageId);
      await loadData();
    } catch (error) {
      alert('Error marking message as read: ' + error.message);
    }
  };

  const handleMarkMessageReplied = async (messageId, notes) => {
    try {
      await markMessageAsReplied(messageId, notes);
      await loadData();
      setSelectedMessage(null);
      alert('Message marked as replied!');
    } catch (error) {
      alert('Error marking message as replied: ' + error.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(messageId);
        await loadData();
        setSelectedMessage(null);
        alert('Message deleted successfully!');
      } catch (error) {
        alert('Error deleting message: ' + error.message);
      }
    }
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    try {
      await createBooking(newBooking);
      await loadData();
      setShowAddBooking(false);
      setNewBooking({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        country: '',
        start_date: '',
        end_date: '',
        bike_quantity: 1,
        total_price: 0,
        down_payment: 0,
        deposit: 1000,
        special_requests: '',
        hear_about_us: 'walk-in',
        status: 'confirmed',
        paid: false
      });
      alert('Booking added successfully!');
    } catch (error) {
      alert('Error adding booking: ' + error.message);
    }
  };

  const calculateDays = () => {
    if (newBooking.start_date && newBooking.end_date) {
      const start = new Date(newBooking.start_date);
      const end = new Date(newBooking.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const pricingData = [
    { days: 1, price: 280 },
    { days: 2, price: 280 },
    { days: 3, price: 400 },
    { days: 4, price: 530 },
    { days: 5, price: 660 },
    { days: 6, price: 790 },
    { days: 7, price: 899 },
    { days: 8, price: 1010 },
    { days: 9, price: 1175 },
    { days: 10, price: 1230 },
    { days: 11, price: 1290 },
    { days: 12, price: 1350 },
    { days: 13, price: 1380 },
    { days: 14, price: 1420 },
    { days: 21, price: 1800 }
  ];

  const calculatePrice = () => {
    const days = calculateDays();
    if (days === 0) return 0;
    
    const pricing = pricingData.find(p => p.days === days);
    if (pricing) return pricing.price;
    
    const sortedPricing = [...pricingData].sort((a, b) => a.days - b.days);
    for (let i = 0; i < sortedPricing.length - 1; i++) {
      if (days > sortedPricing[i].days && days < sortedPricing[i + 1].days) {
        return sortedPricing[i + 1].price;
      }
    }
    
    if (days > 21) {
      const basePrice = 1800;
      const baseDays = 21;
      return Math.round((basePrice / baseDays) * days);
    }
    
    return 0;
  };

  // Auto-calculate prices when dates or bike quantity changes
  useEffect(() => {
    if (newBooking.start_date && newBooking.end_date) {
      const rentalPrice = calculatePrice();
      const numBikes = newBooking.bike_quantity;
      const totalRentalPrice = rentalPrice * numBikes;
      const depositPerBike = 1000;
      const totalDeposit = depositPerBike * numBikes;
      const downPayment = totalRentalPrice / 2;

      setNewBooking(prev => ({
        ...prev,
        total_price: totalRentalPrice,
        down_payment: downPayment,
        deposit: totalDeposit
      }));
    }
  }, [newBooking.start_date, newBooking.end_date, newBooking.bike_quantity]);

  const handleMessageClick = (msg) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      handleMarkMessageRead(msg.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader onRefresh={loadData} />
      
      <AdminNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        stats={stats} 
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <OverviewTab 
            stats={stats} 
            bookings={bookings} 
            messages={messages} 
          />
        )}

        {activeTab === 'bookings' && (
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

        {activeTab === 'messages' && (
          <MessagesTab
            messages={messages}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onMessageClick={handleMessageClick}
            onMarkReplied={handleMarkMessageReplied}
            onDeleteMessage={handleDeleteMessage}
          />
        )}

        {activeTab === 'calendar' && <CalendarTab />}

        {activeTab === 'motorcycles' && <MotorcyclesTab />}
         {activeTab === 'link-generator' && 
    <BookingLinkGeneratorTab />
  }
      </main>

      {/* Modals */}
      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDeleteBooking}
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