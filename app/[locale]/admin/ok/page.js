'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MessageSquare, 
  Bike, 
  DollarSign, 
  Users,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  Filter,
  Search,
  Download,
  TrendingUp,
  Package
} from 'lucide-react';
import { createBooking, getAllBookings, updateBookingStatus, deleteBooking } from '@/lib/supabase/bookings';
import { getAllMessages, markMessageAsRead, markMessageAsReplied, deleteMessage } from '@/lib/supabase/messages';
import MotorcycleCalendar from '@/components/MotorcycleCalendar';

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
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyData, setReplyData] = useState({
    subject: '',
    message: ''
  });
  const [motorcycles, setMotorcycles] = useState([]);
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

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredMessages = messages.filter(msg =>
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Overland Motorcycles</p>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'motorcycles', label: 'Motorcycles', icon: Bike }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-yellow-400 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <tab.icon size={20} />
                <span className="font-semibold">{tab.label}</span>
                {tab.id === 'messages' && stats.unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.unreadMessages}
                  </span>
                )}
                {tab.id === 'bookings' && stats.pendingBookings > 0 && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.pendingBookings}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-blue-600" size={24} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingBookings}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="text-yellow-600" size={24} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">${stats.totalRevenue.toFixed(0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Unread Messages</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.unreadMessages}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="text-red-600" size={24} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Bookings</h3>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{booking.first_name} {booking.last_name}</p>
                        <p className="text-sm text-gray-500">{booking.start_date} - {booking.end_date}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Messages */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Messages</h3>
                <div className="space-y-3">
                  {messages.slice(0, 5).map(msg => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${msg.status === 'unread' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{msg.name}</p>
                        <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Search & Filter with Add Button */}
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => setShowAddBooking(true)}
                className="px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-2"
              >
                <Package size={20} />
                Add Booking
              </button>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bikes</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{booking.first_name} {booking.last_name}</p>
                            <p className="text-sm text-gray-500">{booking.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{booking.bike_quantity}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">${booking.total_price}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>

            {/* Messages List */}
            <div className="grid gap-4">
              {filteredMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                    msg.status === 'unread' ? 'border-yellow-400' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (msg.status === 'unread') handleMarkMessageRead(msg.id);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{msg.name}</h3>
                        {msg.status === 'unread' && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{msg.email}</p>
                      {msg.phone && <p className="text-sm text-gray-500">{msg.phone}</p>}
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{msg.message}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkMessageReplied(msg.id, null);
                      }}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200"
                    >
                      Mark as Replied
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(msg.id);
                      }}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <MotorcycleCalendar />
          </div>
        )}

        {/* Motorcycles Tab */}
        {activeTab === 'motorcycles' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Fleet Status</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(num => (
                  <div key={num} className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-400">
                    <div className="flex items-center justify-between mb-4">
                      <Bike size={32} className="text-gray-900" />
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Available</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Motorcycle {num}</h4>
                    <p className="text-sm text-gray-600 mt-2">Ready for rental</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold">{selectedBooking.first_name} {selectedBooking.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{selectedBooking.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold">{selectedBooking.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="font-semibold">{selectedBooking.country}</p>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Trip Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-semibold">{new Date(selectedBooking.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-semibold">{new Date(selectedBooking.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Motorcycles</p>
                    <p className="font-semibold">{selectedBooking.bike_quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold capitalize">{selectedBooking.status}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Pricing</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Price</span>
                    <span className="font-semibold">${selectedBooking.total_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Down Payment</span>
                    <span className="font-semibold">${selectedBooking.down_payment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit</span>
                    <span className="font-semibold">${selectedBooking.deposit}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-bold">Payment Status</span>
                    <span className={`font-bold ${selectedBooking.paid ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedBooking.paid ? 'PAID' : 'UNPAID'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Special Requests</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedBooking.special_requests}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <select
                  onChange={(e) => handleStatusUpdate(selectedBooking.id, e.target.value)}
                  value={selectedBooking.status}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={() => handleDeleteBooking(selectedBooking.id)}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {showAddBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddBooking(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add New Booking</h2>
                <button onClick={() => setShowAddBooking(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddBooking} className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newBooking.first_name}
                      onChange={(e) => setNewBooking({...newBooking, first_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newBooking.last_name}
                      onChange={(e) => setNewBooking({...newBooking, last_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={newBooking.email}
                      onChange={(e) => setNewBooking({...newBooking, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newBooking.phone}
                      onChange={(e) => setNewBooking({...newBooking, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                    <input
                      type="text"
                      required
                      value={newBooking.country}
                      onChange={(e) => setNewBooking({...newBooking, country: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Details</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newBooking.start_date}
                      onChange={(e) => setNewBooking({...newBooking, start_date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                    <input
                      type="date"
                      required
                      value={newBooking.end_date}
                      onChange={(e) => setNewBooking({...newBooking, end_date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Motorcycles *</label>
                    <select
                      required
                      value={newBooking.bike_quantity}
                      onChange={(e) => setNewBooking({...newBooking, bike_quantity: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="1">1 Motorcycle</option>
                      <option value="2">2 Motorcycles</option>
                      <option value="3">3 Motorcycles</option>
                      <option value="4">4 Motorcycles</option>
                    </select>
                  </div>
                </div>
                {calculateDays() > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Duration:</span> {calculateDays()} days
                    </p>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing (Auto-calculated)</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={newBooking.total_price}
                        onChange={(e) => setNewBooking({...newBooking, total_price: parseFloat(e.target.value) || 0})}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="500.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Down Payment (50%)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={newBooking.down_payment}
                        onChange={(e) => setNewBooking({...newBooking, down_payment: parseFloat(e.target.value) || 0})}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="250.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Deposit</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={newBooking.deposit}
                        onChange={(e) => setNewBooking({...newBooking, deposit: parseFloat(e.target.value) || 0})}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="1000.00"
                      />
                    </div>
                  </div>
                </div>
                {newBooking.total_price > 0 && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Total Rental:</span>
                        <span className="font-bold text-gray-900 ml-2">${newBooking.total_price}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Down Payment:</span>
                        <span className="font-bold text-green-600 ml-2">${newBooking.down_payment}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">At Pickup:</span>
                        <span className="font-bold text-blue-600 ml-2">${(newBooking.total_price - newBooking.down_payment + newBooking.deposit).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Deposit:</span>
                        <span className="font-bold text-gray-900 ml-2">${newBooking.deposit}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Payment */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Status</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Status</label>
                    <select
                      value={newBooking.status}
                      onChange={(e) => setNewBooking({...newBooking, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                    <select
                      value={newBooking.paid}
                      onChange={(e) => setNewBooking({...newBooking, paid: e.target.value === 'true'})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    >
                      <option value="false">Unpaid</option>
                      <option value="true">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requests</label>
                <textarea
                  rows={3}
                  value={newBooking.special_requests}
                  onChange={(e) => setNewBooking({...newBooking, special_requests: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Any special requests or notes..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBooking(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500"
                >
                  Add Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;