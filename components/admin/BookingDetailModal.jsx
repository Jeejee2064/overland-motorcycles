'use client'
import React from 'react';
import { XCircle } from 'lucide-react';

const BookingDetailModal = ({ booking, onClose, onStatusUpdate, onDelete }) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                <p className="font-semibold">{booking.first_name} {booking.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{booking.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold">{booking.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Country</p>
                <p className="font-semibold">{booking.country}</p>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Trip Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-semibold">{new Date(booking.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-semibold">{new Date(booking.end_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Motorcycles</p>
                <p className="font-semibold">{booking.bike_quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold capitalize">{booking.status}</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Pricing</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Price</span>
                <span className="font-semibold">${booking.total_price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Down Payment</span>
                <span className="font-semibold">${booking.down_payment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Deposit</span>
                <span className="font-semibold">${booking.deposit}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-bold">Payment Status</span>
                <span className={`font-bold ${booking.paid ? 'text-green-600' : 'text-red-600'}`}>
                  {booking.paid ? 'PAID' : 'UNPAID'}
                </span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {booking.special_requests && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Special Requests</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{booking.special_requests}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <select
              onChange={(e) => onStatusUpdate(booking.id, e.target.value)}
              value={booking.status}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={() => onDelete(booking.id)}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;