'use client'
import React, { useState, useEffect } from 'react';
import { Bike, Power, AlertTriangle } from 'lucide-react';
import { getAllMotorcycles, updateMotorcycleAvailability } from '@/lib/supabase/bookings';

const MotorcyclesTab = () => {
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMotorcycles();
  }, []);

  const loadMotorcycles = async () => {
    setLoading(true);
    try {
      const data = await getAllMotorcycles();
      setMotorcycles(data || []);
    } catch (error) {
      console.error('Error loading motorcycles:', error);
      alert('Error loading motorcycles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (motorcycleId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'enable' : 'disable';
    
    if (confirm(`Are you sure you want to ${action} this motorcycle?`)) {
      try {
        await updateMotorcycleAvailability(motorcycleId, newStatus);
        await loadMotorcycles();
        alert(`Motorcycle ${newStatus ? 'enabled' : 'disabled'} successfully!`);
      } catch (error) {
        console.error('Error updating motorcycle availability:', error);
        alert('Error updating motorcycle: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading motorcycles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Fleet Status</h3>
          <div className="text-sm text-gray-500">
            Total: {motorcycles.length} | Available: {motorcycles.filter(m => m.is_available).length}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {motorcycles.map(motorcycle => (
            <div 
              key={motorcycle.id} 
              className={`p-6 rounded-xl border-2 transition-all ${
                motorcycle.is_available 
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400' 
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <Bike size={32} className="text-gray-900" />
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  motorcycle.is_available 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {motorcycle.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                {motorcycle.name || `Motorcycle ${motorcycle.id}`}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {motorcycle.is_available ? 'Ready for rental' : 'Out of service'}
              </p>

              <button
                onClick={() => handleToggleAvailability(motorcycle.id, motorcycle.is_available)}
                className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  motorcycle.is_available
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {motorcycle.is_available ? (
                  <>
                    <AlertTriangle size={16} />
                    Mark Unavailable
                  </>
                ) : (
                  <>
                    <Power size={16} />
                    Mark Available
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {motorcycles.length === 0 && (
          <div className="text-center py-12">
            <Bike size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No motorcycles found in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotorcyclesTab;