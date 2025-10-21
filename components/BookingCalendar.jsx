'use client';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import { enUS } from 'date-fns/locale';
import { checkBikesAvailabilityRange } from '@/lib/supabase/bookings';
import { useTranslations } from 'next-intl';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const MAX_BIKES = 4;

export default function BookingCalendar({ onChange, selectedRange }) {
  const t = useTranslations('calendar');
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loading, setLoading] = useState(false);

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

  // Function to check if date is within selected range
  const isSelected = (day) => {
    const start = selectedRange?.startDate;
    const end = selectedRange?.endDate;
    if (!start || !end) return false;
    return day >= new Date(start.setHours(0, 0, 0, 0)) && day <= new Date(end.setHours(0, 0, 0, 0));
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
      bgColor = 'bg-blue-500';
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
          className={`absolute inset-0 rounded-md  pointer-events-none ${bgColor}`}
        />
        <span className={`relative z-10 text-sm font-medium ${textColor}`}>
          {day.getDate()}
        </span>
      </div>
    );
  };

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden shadow-md bg-white">
      {loading ? (
        <div className="p-6 text-center text-gray-500">{t('loading')}</div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">

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
        </ div>     )}

      {/* Legend */}
      <div className="flex justify-around text-xs p-2 bg-gray-50 border-t">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded-sm border border-yellow-500" />
          <span className="font-medium">{t('selectedPeriod')}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-200 rounded-sm border border-green-400" />
          <span className="font-medium">{t('allAvailable')}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-200 rounded-sm border border-yellow-400" />
          <span className="font-medium">{t('twoThreeLeft')}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-300 rounded-sm border border-orange-500" />
          <span className="font-medium">{t('oneLeft')}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-400 rounded-sm border border-red-600" />
          <span className="font-medium">{t('fullyBooked')}</span>
        </span>
      </div>
    </div>
  );
}
