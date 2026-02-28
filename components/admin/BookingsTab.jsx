'use client'
import React, { useState } from 'react';
import { Search, Package, Link as LinkIcon, X, Copy, Mail, Send } from 'lucide-react';

const BookingsTab = ({
  bookings,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onViewDetails,
  onAddBooking
}) => {

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bikes, setBikes] = useState(1);
  const [sendingMail, setSendingMail] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const generateLink = () => {
    if (!startDate || !endDate) return '';
    const params = new URLSearchParams({ start: startDate, end: endDate, bikes: bikes.toString() });
    return 'https://overland-motorcycles.com/Booking?' + params.toString();
  };

  const copyLink = () => {
    const link = generateLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
  };

  const handleSendPaymentMail = async (e, bookingId) => {
    e.stopPropagation();
    setSendingMail(bookingId);
    try {
      const res = await fetch('/api/pay/send-payment-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Payment mail sent!');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSendingMail(null);
    }
  };

  const needsPaymentMail = (booking) =>
    booking.status === 'confirmed' &&
    booking.payment_status === 'paid' &&
    (booking.auth_status !== 'authorized' || booking.balance_status !== 'captured');

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="fully paid">Fully Paid</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={onAddBooking}
            className="px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-2"
          >
            <Package size={20} />
            Add Booking
          </button>

          <button
            onClick={() => setShowLinkModal(true)}
            className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <LinkIcon size={20} />
            Generate Link
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bikes</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payments</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50">

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {booking.first_name} {booking.last_name}
                      </p>
                      <a
                        href={'mailto:' + booking.email}
                        className="text-sm text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail size={12} />
                        {booking.email}
                      </a>
                      {needsPaymentMail(booking) && (
                        <button
                          onClick={(e) => handleSendPaymentMail(e, booking.id)}
                          disabled={sendingMail === booking.id}
                          className="mt-1 flex items-center gap-1 px-2 py-0.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                        >
                          <Send size={11} />
                          {sendingMail === booking.id ? 'Sending...' : 'Send Pay Mail'}
                        </button>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                    </td>

                    {/* Bikes */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.bike_quantity}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${parseFloat(booking.total_price).toFixed(0)}
                    </td>

                    {/* Payments — 3 dots */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          title="Initial payment"
                          className={'w-2.5 h-2.5 rounded-full ' + (booking.payment_status === 'paid' ? 'bg-green-500' : 'bg-gray-300')}
                        />
                        <span
                          title="Security deposit (AUTH)"
                          className={'w-2.5 h-2.5 rounded-full ' + (
                            booking.auth_status === 'authorized' ? 'bg-green-500'
                            : booking.auth_status === 'pending'  ? 'bg-yellow-400'
                            : booking.auth_status === 'failed'   ? 'bg-red-500'
                            : 'bg-gray-300'
                          )}
                        />
                        <span
                          title="Remaining balance"
                          className={'w-2.5 h-2.5 rounded-full ' + (
                            booking.balance_status === 'captured' ? 'bg-green-500'
                            : booking.balance_status === 'pending' ? 'bg-yellow-400'
                            : booking.balance_status === 'failed'  ? 'bg-red-500'
                            : 'bg-gray-300'
                          )}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + (
                        booking.status === 'confirmed'    ? 'bg-green-100 text-green-700'
                        : booking.status === 'pending'    ? 'bg-yellow-100 text-yellow-700'
                        : booking.status === 'cancelled'  ? 'bg-red-100 text-red-700'
                        : booking.status === 'fully paid' ? 'bg-blue-100 text-blue-700'
                        : 'bg-blue-100 text-blue-700'
                      )}>
                        {booking.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onViewDetails(booking)}
                        className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm"
                      >
                        View
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl relative">
            <button onClick={() => setShowLinkModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <X size={22} />
            </button>
            <h2 className="text-xl font-bold mb-4">Booking Link Generator</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" autoFocus value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of Bikes</label>
                <input type="number" min="1" value={bikes}
                  onChange={(e) => setBikes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg text-sm break-all mb-4 border border-gray-200">
              {generateLink() || <span className="text-gray-400">Fill in all fields to generate a link</span>}
            </div>
            <button disabled={!generateLink()} onClick={copyLink}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-yellow-400 disabled:bg-gray-300 font-semibold rounded-lg hover:bg-yellow-500 transition">
              <Copy size={18} /> Copy Link
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingsTab;