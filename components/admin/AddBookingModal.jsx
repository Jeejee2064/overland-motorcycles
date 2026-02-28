'use client'
import React from 'react';
import { XCircle } from 'lucide-react';

const MODEL_OPTIONS = [
  { value: 'Himalayan', label: 'Royal Enfield Himalayan 450', maxBikes: 6 },
  { value: 'CFMoto700', label: 'CF Moto 700 CL-X',           maxBikes: 1 },
];

const AddBookingModal = ({ show, onClose, newBooking, setNewBooking, onSubmit, calculateDays, calculatePrice }) => {
  if (!show) return null;

  const selectedModelConfig = MODEL_OPTIONS.find(m => m.value === newBooking.motorcycle_model) || MODEL_OPTIONS[0];
  const isCFMoto            = newBooking.motorcycle_model === 'CFMoto700';
  const bikeOptions         = Array.from({ length: selectedModelConfig.maxBikes }, (_, i) => i + 1);

  const handleModelChange = (model) => {
    setNewBooking(prev => ({
      ...prev,
      motorcycle_model: model,
      bike_quantity: model === 'CFMoto700' ? 1 : prev.bike_quantity,
    }));
  };

  const balanceAmount = newBooking.total_price > 0
    ? (parseFloat(newBooking.total_price) - parseFloat(newBooking.down_payment)).toFixed(2)
    : '—';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
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
                <input type="text" required value={newBooking.first_name}
                  onChange={(e) => setNewBooking({ ...newBooking, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                <input type="text" required value={newBooking.last_name}
                  onChange={(e) => setNewBooking({ ...newBooking, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input type="email" required value={newBooking.email}
                  onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                <input type="tel" required value={newBooking.phone}
                  onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="+1 234 567 8900" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                <input type="text" required value={newBooking.country}
                  onChange={(e) => setNewBooking({ ...newBooking, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="United States" />
              </div>
            </div>
          </div>

          {/* Motorcycle Model */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Motorcycle Model</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {MODEL_OPTIONS.map((model) => (
                <button key={model.value} type="button" onClick={() => handleModelChange(model.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    newBooking.motorcycle_model === model.value
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}>
                  <div className="font-bold text-gray-900">{model.label}</div>
                  <div className="text-sm text-gray-500 mt-1">Max {model.maxBikes} bike{model.maxBikes > 1 ? 's' : ''}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Trip Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Details</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                <input type="date" required value={newBooking.start_date}
                  onChange={(e) => setNewBooking({ ...newBooking, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                <input type="date" required value={newBooking.end_date}
                  onChange={(e) => setNewBooking({ ...newBooking, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motorcycles *{isCFMoto && <span className="ml-1 text-xs text-yellow-600">(max 1)</span>}
                </label>
                {isCFMoto ? (
                  <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-semibold">
                    1 Motorcycle
                  </div>
                ) : (
                  <select required value={newBooking.bike_quantity}
                    onChange={(e) => setNewBooking({ ...newBooking, bike_quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
                    {bikeOptions.map(n => (
                      <option key={n} value={n}>{n} Motorcycle{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            {calculateDays() > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Duration:</span> {calculateDays()} days
                  {calculatePrice() > 0 && (
                    <span className="ml-3">
                      <span className="font-semibold">Per-bike rate:</span> ${calculatePrice()}
                    </span>
                  )}
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
                  <input type="number" value={newBooking.total_price}
                    onChange={(e) => setNewBooking({ ...newBooking, total_price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="500.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Down Payment (50%)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" value={newBooking.down_payment}
                    onChange={(e) => setNewBooking({ ...newBooking, down_payment: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="250.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deposit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" value={newBooking.deposit}
                    onChange={(e) => setNewBooking({ ...newBooking, deposit: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="1000.00" />
                </div>
              </div>
            </div>
            {newBooking.total_price > 0 && (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-600">Total Rental:</span><span className="font-bold text-gray-900 ml-2">${newBooking.total_price}</span></div>
                  <div><span className="text-gray-600">Down Payment:</span><span className="font-bold text-green-600 ml-2">${newBooking.down_payment}</span></div>
                  <div><span className="text-gray-600">At Pickup:</span><span className="font-bold text-blue-600 ml-2">${(newBooking.total_price - newBooking.down_payment + newBooking.deposit).toFixed(2)}</span></div>
                  <div><span className="text-gray-600">Deposit:</span><span className="font-bold text-gray-900 ml-2">${newBooking.deposit}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Status & Payments */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status & Payments</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Status</label>
              <select value={newBooking.status}
                onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-3">Payment Status</p>
            <div className="space-y-3">

              {/* Initial 50% */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" checked={newBooking.paid}
                  onChange={(e) => setNewBooking({ ...newBooking, paid: e.target.checked })}
                  className="w-4 h-4 rounded text-yellow-400 focus:ring-yellow-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Initial Payment (50%) paid</p>
                  <p className="text-xs text-gray-500">
                    ${newBooking.down_payment > 0 ? parseFloat(newBooking.down_payment).toFixed(2) : '—'}
                  </p>
                </div>
              </label>

              {/* AUTH */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox"
                  checked={newBooking.auth_status === 'authorized'}
                  onChange={(e) => setNewBooking({ ...newBooking, auth_status: e.target.checked ? 'authorized' : null })}
                  className="w-4 h-4 rounded text-yellow-400 focus:ring-yellow-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Security Deposit authorized</p>
                  <p className="text-xs text-gray-500">$1,000.00 AUTH</p>
                </div>
              </label>

              {/* Balance */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox"
                  checked={newBooking.balance_status === 'captured'}
                  onChange={(e) => setNewBooking({ ...newBooking, balance_status: e.target.checked ? 'captured' : null })}
                  className="w-4 h-4 rounded text-yellow-400 focus:ring-yellow-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Remaining balance paid</p>
                  <p className="text-xs text-gray-500">${balanceAmount}</p>
                </div>
              </label>

            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requests</label>
            <textarea rows={3} value={newBooking.special_requests}
              onChange={(e) => setNewBooking({ ...newBooking, special_requests: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Any special requests or notes..." />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500">
              Add Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookingModal;