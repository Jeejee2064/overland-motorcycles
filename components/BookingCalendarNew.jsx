'use client';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import { enUS } from 'date-fns/locale';
import { checkBikesAvailabilityRange } from '@/lib/supabase/bookings';
import { useTranslations } from 'next-intl';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const MAX_BIKES = 4;

export default function BookingCalendar({ onDateRangeChange }) {
  const t = useTranslations('calendar');
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Initialize selectedRange state
  const [selectedRange, setSelectedRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection'
  });

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const data = await checkBikesAvailabilityRange();
        setAvailabilityMap(data || {});
        console.log('Availability map:', data);
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  // Handle date range change
  const handleRangeChange = (item) => {
    setSelectedRange(item.selection);
    
    // Call parent callback with the range
    if (onDateRangeChange) {
      onDateRangeChange(item.selection);
    }
  };

  // Function to check if date is within selected range
  const isSelected = (day) => {
    const start = selectedRange?.startDate;
    const end = selectedRange?.endDate;
    if (!start || !end) return false;
    
    const dayTime = new Date(day).setHours(0, 0, 0, 0);
    const startTime = new Date(start).setHours(0, 0, 0, 0);
    const endTime = new Date(end).setHours(0, 0, 0, 0);
    
    return dayTime >= startTime && dayTime <= endTime;
  };

  // Format dates consistently without timezone issues
  const customDayContent = (day) => {
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dayNum = String(day.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayNum}`;
    
    const booked = availabilityMap[dateKey] || 0;
    const remaining = MAX_BIKES - booked;

    let bgColor = '';
    let textColor = 'text-gray-900';

    if (isSelected(day)) {
      // Highlight user selection — overrides availability
      bgColor = 'bg-yellow-400';
      textColor = 'text-gray-900 font-bold';
    } else {
      // Availability colors
      if (remaining === MAX_BIKES) bgColor = 'bg-green-200';
      else if (remaining >= 2) bgColor = 'bg-yellow-200';
      else if (remaining === 1) bgColor = 'bg-orange-300';
      else {
        bgColor = 'bg-red-400';
        textColor = 'text-white';
      }
    }

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div
          className={`absolute inset-0 rounded-md pointer-events-none ${bgColor}`}
        />
        <span className={`relative z-10 ${isMobile ? 'text-xs' : 'text-sm'} font-medium ${textColor}`}>
          {day.getDate()}
        </span>
      </div>
    );
  };

  return (
    <div className="border-2 border-gray-700 rounded-2xl overflow-hidden shadow-lg bg-gray-900">
      {loading ? (
        <div className="p-6 text-center text-gray-400">{t('loading')}</div>
      ) : (
        <div className="overflow-x-auto">
          <DateRange
            ranges={[selectedRange]}
            onChange={handleRangeChange}
            moveRangeOnFirstSelection={false}
            minDate={new Date(Date.now() + 48 * 60 * 60 * 1000)}
            rangeColors={['#FACC15']}
            locale={enUS}
            dayContentRenderer={customDayContent}
            months={isMobile ? 1 : 2}
            direction={isMobile ? 'vertical' : 'horizontal'}
            showDateDisplay={false}
            fixedHeight={true}
            preventSnapRefocus={true}
            className="booking-calendar-dark"
          />
        </div>
      )}

      {/* Legend - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs p-3 md:p-4 bg-gray-800 border-t border-gray-700">
        <LegendItem 
          color="bg-yellow-400" 
          borderColor="border-yellow-500" 
          label={t('selectedPeriod')} 
        />
        <LegendItem 
          color="bg-green-200" 
          borderColor="border-green-400" 
          label={t('allAvailable')} 
        />
        <LegendItem 
          color="bg-yellow-200" 
          borderColor="border-yellow-400" 
          label={t('twoThreeLeft')} 
        />
        <LegendItem 
          color="bg-orange-300" 
          borderColor="border-orange-500" 
          label={t('oneLeft')} 
        />
        <LegendItem 
          color="bg-red-400" 
          borderColor="border-red-600" 
          label={t('fullyBooked')} 
        />
      </div>
    </div>
  );
}

// Legend Item Component for cleaner code
function LegendItem({ color, borderColor, label }) {
  return (
    <span className="flex items-center gap-1.5 md:gap-2">
      <span className={`w-3 h-3 md:w-4 md:h-4 ${color} rounded-sm border ${borderColor} flex-shrink-0`} />
      <span className="text-gray-300 font-medium text-xs truncate">{label}</span>
    </span>
  );
}