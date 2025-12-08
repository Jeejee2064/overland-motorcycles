'use client'
import React from 'react';
import { XCircle } from 'lucide-react';

const AddBookingModal = ({ show, onClose, newBooking, setNewBooking, onSubmit, calculateDays, calculatePrice }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Booking</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle size={24} />
            </button>
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6">
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
  );
};

export default AddBookingModal;