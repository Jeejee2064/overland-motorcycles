'use client'
import React, { useState, useEffect } from 'react';
import { XCircle, Edit2, Save, X, Bike } from 'lucide-react';
import { 
  getBookingMotorcycles, 
  updateBookingDetails, 
  getAvailableMotorcyclesForEdit,
  updateSingleMotorcycleAssignment
} from '@/lib/supabase/bookings-admin-helpers';
import { getAllMotorcycles } from '@/lib/supabase/bookings';

const BookingDetailModal = ({ booking, onClose, onStatusUpdate, onDelete, onPaymentToggle, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState(null);
  const [assignedMotorcycles, setAssignedMotorcycles] = useState([]);
  const [availableMotorcycles, setAvailableMotorcycles] = useState([]);
  const [allMotorcycles, setAllMotorcycles] = useState([]);
  const [motorcycleSelections, setMotorcycleSelections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingMotorcycle, setSavingMotorcycle] = useState(false);

  useEffect(() => {
    if (booking) {
      setEditedBooking({ ...booking });
      loadMotorcycleData();
    }
  }, [booking]);

  useEffect(() => {
    if (editedBooking && isEditing) {
      loadAvailableMotorcycles();
    }
  }, [editedBooking?.start_date, editedBooking?.end_date, isEditing]);

  useEffect(() => {
    if (booking && assignedMotorcycles) {
      initializeMotorcycleSelections();
    }
  }, [booking, assignedMotorcycles]);

  const loadMotorcycleData = async () => {
    if (!booking) return;
    
    setLoading(true);
    try {
      const [assigned, all] = await Promise.all([
        getBookingMotorcycles(booking.id),
        getAllMotorcycles()
      ]);
      
      setAssignedMotorcycles(assigned);
      setAllMotorcycles(all);
    } catch (error) {
      console.error('Error loading motorcycle data:', error);
      alert('Error loading motorcycle data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeMotorcycleSelections = () => {
    if (!booking) return;
    
    const slots = [];
    for (let i = 0; i < booking.bike_quantity; i++) {
      const assignment = assignedMotorcycles[i];
      slots.push({
        index: i,
        assignmentId: assignment?.id || null,
        motorcycleId: assignment?.motorcycle_id || '',
        motorcycleName: assignment?.motorcycles?.name || ''
      });
    }
    setMotorcycleSelections(slots);
  };

  const loadAvailableMotorcycles = async () => {
    if (!editedBooking?.start_date || !editedBooking?.end_date) return;

    try {
      const available = await getAvailableMotorcyclesForEdit(
        editedBooking.start_date,
        editedBooking.end_date,
        booking.id
      );
      setAvailableMotorcycles(available);
    } catch (error) {
      console.error('Error loading available motorcycles:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateBookingDetails(booking.id, {
        first_name: editedBooking.first_name,
        last_name: editedBooking.last_name,
        email: editedBooking.email,
        phone: editedBooking.phone,
        country: editedBooking.country,
        start_date: editedBooking.start_date,
        end_date: editedBooking.end_date,
        bike_quantity: editedBooking.bike_quantity,
        total_price: editedBooking.total_price,
        down_payment: editedBooking.down_payment,
        deposit: editedBooking.deposit,
        special_requests: editedBooking.special_requests,
        hear_about_us: editedBooking.hear_about_us
      });

      setIsEditing(false);
      if (onUpdate) {
        await onUpdate();
      }
      alert('Booking updated successfully!');
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Error saving booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMotorcycleChange = async (slotIndex, newMotorcycleId, oldAssignmentId) => {
    setSavingMotorcycle(true);
    try {
      await updateSingleMotorcycleAssignment(
        booking.id,
        oldAssignmentId,
        newMotorcycleId
      );
      
      await loadMotorcycleData();
      alert('Motorcycle updated successfully!');
    } catch (error) {
      console.error('Error updating motorcycle:', error);
      alert('Error updating motorcycle: ' + error.message);
    } finally {
      setSavingMotorcycle(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedBooking(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDuration = () => {
    if (!editedBooking?.start_date || !editedBooking?.end_date) return 0;
    const start = new Date(editedBooking.start_date + 'T00:00:00');
    const end = new Date(editedBooking.end_date + 'T00:00:00');
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (!booking || !editedBooking) return null;

  const remainingAmount = (
    parseFloat(editedBooking.total_price) + 
    parseFloat(editedBooking.deposit) - 
    parseFloat(editedBooking.down_payment)
  ).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit2 size={18} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedBooking({ ...booking });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">First Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedBooking.first_name}
                    onChange={(e) => handleFieldChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="font-semibold">{editedBooking.first_name}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedBooking.last_name}
                    onChange={(e) => handleFieldChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="font-semibold">{editedBooking.last_name}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedBooking.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="font-semibold">{editedBooking.email}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedBooking.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="font-semibold">{editedBooking.phone}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Country</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedBooking.country}
                    onChange={(e) => handleFieldChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="font-semibold">{editedBooking.country}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">How did you hear about us?</p>
                {isEditing ? (
                  <select
                    value={editedBooking.hear_about_us || ''}
                    onChange={(e) => handleFieldChange('hear_about_us', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select...</option>
                    <option value="walk-in">Walk-in</option>
                    <option value="google">Google</option>
                    <option value="social-media">Social Media</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="font-semibold capitalize">{editedBooking.hear_about_us || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Trip Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedBooking.start_date}
                    onChange={(e) => handleFieldChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="font-semibold">{editedBooking.start_date}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">End Date</p>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedBooking.end_date}
                    onChange={(e) => handleFieldChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="font-semibold">{editedBooking.end_date}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="font-semibold">
                  {calculateDuration()} day{calculateDuration() !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Bike Quantity</p>
                <p className="font-semibold">{editedBooking.bike_quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="font-semibold capitalize">{editedBooking.status}</p>
              </div>
            </div>
          </div>

          {/* Assigned Motorcycles */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Bike size={20} />
              Assigned Motorcycles
            </h3>
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading motorcycles...</div>
            ) : (
              <div className="space-y-3">
                {motorcycleSelections.map((slot, index) => (
                  <div key={slot.index}>
                    <p className="text-sm text-gray-500 mb-1">Motorcycle {index + 1}</p>
                    {isEditing ? (
                      <select
                        value={slot.motorcycleId}
                        onChange={(e) => handleMotorcycleChange(slot.index, e.target.value, slot.assignmentId)}
                        disabled={savingMotorcycle}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                      >
                        <option value="">Select a motorcycle...</option>
                        {/* Show currently assigned motorcycle */}
                        {slot.motorcycleId && slot.motorcycleName && (
                          <option value={slot.motorcycleId}>
                            {slot.motorcycleName} (Current)
                          </option>
                        )}
                        {/* Show available motorcycles */}
                        {availableMotorcycles
                          .filter(m => m.id !== slot.motorcycleId)
                          .map((moto) => (
                            <option key={moto.id} value={moto.id}>
                              {moto.name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                        <Bike size={18} className="text-blue-600" />
                        <span className="font-semibold text-gray-900">
                          {slot.motorcycleName || 'Not assigned'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {motorcycleSelections.length === 0 && (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                    No motorcycle slots available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Pricing</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Price</p>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editedBooking.total_price}
                      onChange={(e) => handleFieldChange('total_price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <p className="font-semibold">${editedBooking.total_price}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Down Payment</p>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editedBooking.down_payment}
                      onChange={(e) => handleFieldChange('down_payment', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <p className="font-semibold">${editedBooking.down_payment}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Deposit</p>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editedBooking.deposit}
                      onChange={(e) => handleFieldChange('deposit', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <p className="font-semibold">${editedBooking.deposit}</p>
                  )}
                </div>
              </div>
              
              {!editedBooking.paid && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Amount Still to be Paid</span>
                  <span className="font-semibold text-red-600">${remainingAmount}</span>
                </div>
              )}
              
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-bold">Payment Status</span>
                <span className={`font-bold ${editedBooking.paid ? 'text-green-600' : 'text-red-600'}`}>
                  {editedBooking.paid ? 'PAID' : 'UNPAID'}
                </span>
              </div>
              
              {!editedBooking.paid && (
                <div className="pt-2">
                  <button
                    onClick={() => onPaymentToggle(editedBooking.id, true)}
                    className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Mark as Fully Paid
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Special Requests</h3>
            {isEditing ? (
              <textarea
                value={editedBooking.special_requests || ''}
                onChange={(e) => handleFieldChange('special_requests', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Enter any special requests..."
              />
            ) : (
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {editedBooking.special_requests || 'No special requests'}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <select
                onChange={(e) => onStatusUpdate(editedBooking.id, e.target.value)}
                value={editedBooking.status}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="fully paid">Fully Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => onDelete(editedBooking.id)}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;