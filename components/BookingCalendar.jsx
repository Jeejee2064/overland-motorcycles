'use client';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { checkBikesAvailabilityRange } from '@/lib/supabase/bookings';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const MAX_BIKES = 4;

export default function BookingCalendar({ onChange, selectedRange }) {
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const data = await checkBikesAvailabilityRange();
        setAvailabilityMap(data || {});
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  // Improved design: uses absolute overlay inside native cell
  const customDayContent = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const booked = availabilityMap[dateKey] || 0;
    const remaining = MAX_BIKES - booked;

    let bgColor = '';
    if (remaining === MAX_BIKES) bgColor = 'bg-green-200';
    else if (remaining >= 2) bgColor = 'bg-yellow-200';
    else if (remaining === 1) bgColor = 'bg-orange-300 text-white';
    else bgColor = 'bg-red-400 text-white';

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* background availability indicator */}
        <div
          className={`absolute inset-0 rounded-md opacity-60 pointer-events-none ${bgColor}`}
        />
        {/* day number */}
        <span className="relative z-10 text-sm font-medium">
          {format(day, 'd')}
        </span>
      
      </div>
    );
  };

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden shadow-md bg-white">
      {loading ? (
        <div className="p-6 text-center text-gray-500">Loading availability...</div>
      ) : (
        <DateRange
          ranges={[selectedRange]}
          onChange={(item) => onChange(item.selection)}
          moveRangeOnFirstSelection={false}
          minDate={new Date(Date.now() + 48 * 60 * 60 * 1000)}
          rangeColors={['#FACC15']}
          locale={enUS}
          dayContentRenderer={customDayContent}
          months={1}
          direction="horizontal"
          showDateDisplay={false}
        />
      )}

      {/* Legend */}
      <div className="flex justify-around text-xs p-2 bg-gray-50 border-t">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-200 rounded-sm" /> Many
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-200 rounded-sm" /> Some
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-300 rounded-sm" /> 1 left
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-400 rounded-sm" /> Full
        </span>
      </div>
    </div>
  );
}
