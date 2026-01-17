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
  const [pickupTime, setPickupTime] = useState('09');
  const [dropoffTime, setDropoffTime] = useState('17');
  const [internalRange, setInternalRange] = useState(selectedRange);
  const [rentalDays, setRentalDays] = useState(0);

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

  // Calculate rental days based on hours
  useEffect(() => {
    if (internalRange?.startDate && internalRange?.endDate && pickupTime && dropoffTime) {
      const pickupHour = parseInt(pickupTime);
      const dropoffHour = parseInt(dropoffTime);
      
      const start = new Date(internalRange.startDate);
      start.setHours(pickupHour, 0, 0, 0);
      
      const end = new Date(internalRange.endDate);
      end.setHours(dropoffHour, 0, 0, 0);
      
      const hoursDiff = (end - start) / (1000 * 60 * 60);
      const days = Math.ceil(hoursDiff / 24);
      
      setRentalDays(days);
      
      // Send adjusted dates to parent (add extra days if needed)
      if (days >= 2) {
        const adjustedEndDate = new Date(internalRange.startDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + days);
        
        onChange({
          startDate: internalRange.startDate,
          endDate: adjustedEndDate,
          key: 'selection'
        });
      }
    } else {
      setRentalDays(0);
    }
  }, [internalRange, pickupTime, dropoffTime]);

  // Function to check if date is within selected range
  const isSelected = (day) => {
    const start = internalRange?.startDate;
    const end = internalRange?.endDate;
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
      // Highlight user selection
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
        <div className={`absolute inset-0 rounded-md pointer-events-none ${bgColor}`} />
        <span className={`relative z-10 text-sm font-medium ${textColor}`}>
          {day.getDate()}
        </span>
      </div>
    );
  };

  const handleRangeChange = (item) => {
    setInternalRange(item.selection);
  };

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden shadow-md bg-white">
      {loading ? (
        <div className="p-6 text-center text-gray-500">{t('loading')}</div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 px-4">
            <DateRange
              ranges={[internalRange]}
              onChange={handleRangeChange}
              moveRangeOnFirstSelection={false}
              minDate={new Date(Date.now() + 48 * 60 * 60 * 1000)}
              rangeColors={['#FACC15']}
              locale={enUS}
              dayContentRenderer={customDayContent}
              months={2}
              direction="horizontal"
              showDateDisplay={false}
              fixedHeight={true}
              preventSnapRefocus={true}
            />
          </div>
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
          {/* Time Selection */}
          <div className="p-4 bg-gray-50 border-t space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pickupTime') || 'Pickup Time'}
                </label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 9 }, (_, i) => {
                    const hour = i + 9;
                    const hourStr = String(hour).padStart(2, '0');
                    const display = hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
                    return (
                      <option key={hour} value={hourStr}>
                        {display}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('dropoffTime') || 'Drop-off Time'}
                </label>
                <select
                  value={dropoffTime}
                  onChange={(e) => setDropoffTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 9 }, (_, i) => {
                    const hour = i + 9;
                    const hourStr = String(hour).padStart(2, '0');
                    const display = hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
                    return (
                      <option key={hour} value={hourStr}>
                        {display}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Rental Days Display */}
            {rentalDays > 0 && (
              <div className="text-center p-2 bg-blue-100 rounded-md">
                <span className="text-sm font-semibold text-blue-900">
                  {t('rentalDuration') || 'Rental Duration'}: {rentalDays} {rentalDays === 1 ? t('day') || 'day' : t('days') || 'days'}
                </span>
              </div>
            )}
            {rentalDays > 0 && rentalDays < 2 && (
              <div className="text-center p-2 bg-red-100 rounded-md">
                <span className="text-sm font-semibold text-red-900">
                  {t('minimumRental') || 'Minimum rental is 2 days (48 hours)'}
                </span>
              </div>
            )}
          </div>
        </>
      )}

     
    </div>
  );
}