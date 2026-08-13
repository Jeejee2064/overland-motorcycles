'use client';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import { enUS } from 'date-fns/locale';
import { checkBikesAvailabilityRangeByModel, getFleetSize } from '@/lib/supabase/bookings';
import { useTranslations } from 'next-intl';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

// Fallback used for Panama City (pooled fleet-wide count, matches current behavior).
// Coronado uses the real fleet size fetched dynamically instead (see below).
const DEFAULT_MAX_BIKES = 6;

export default function BookingCalendar({ onDateRangeChange, location }) {
  const t = useTranslations('calendar');
  const isCoronado = location === 'Playa Coronado';
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [maxBikes, setMaxBikes] = useState(DEFAULT_MAX_BIKES);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedRange, setSelectedRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        if (isCoronado) {
          const [data, fleetSize] = await Promise.all([
            checkBikesAvailabilityRangeByModel('Himalayan', 'Playa Coronado'),
            getFleetSize('Himalayan', 'Playa Coronado'),
          ]);
          setAvailabilityMap(data || {});
          setMaxBikes(fleetSize || 0);
        } else {
          // Panama City (or no location yet): pooled fleet-wide availability, unchanged behavior.
          const data = await checkBikesAvailabilityRangeByModel('Himalayan');
          setAvailabilityMap(data || {});
          setMaxBikes(DEFAULT_MAX_BIKES);
        }
      } catch (err) {
        console.error('BookingCalendar availability error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [isCoronado]);

  const isSelected = (day) => {
    const start = selectedRange?.startDate;
    const end   = selectedRange?.endDate;
    if (!start || !end) return false;
    const d = new Date(day).setHours(0, 0, 0, 0);
    return d >= new Date(start).setHours(0, 0, 0, 0) &&
           d <= new Date(end).setHours(0, 0, 0, 0);
  };

  const customDayContent = (day) => {
    const y   = day.getFullYear();
    const m   = String(day.getMonth() + 1).padStart(2, '0');
    const d   = String(day.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    const booked    = availabilityMap[key] || 0;
    const remaining = maxBikes - booked;

    let bgColor, textColor;

    if (isSelected(day)) {
      bgColor   = 'bg-yellow-400';
      textColor = 'text-gray-900 font-bold';
    } else if (remaining === maxBikes) {
      bgColor   = 'bg-green-200';
      textColor = 'text-gray-900';
    } else if (remaining >= 2) {
      bgColor   = 'bg-yellow-200';
      textColor = 'text-gray-900';
    } else if (remaining === 1) {
      bgColor   = 'bg-orange-300';
      textColor = 'text-gray-900';
    } else {
      bgColor   = 'bg-red-400';
      textColor = 'text-white';
    }

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div className={`absolute inset-0 rounded-md pointer-events-none ${bgColor}`} />
        <span className={`relative z-10 ${isMobile ? 'text-xs' : 'text-sm'} font-medium ${textColor}`}>
          {day.getDate()}
        </span>
      </div>
    );
  };

  const handleRangeChange = (item) => {
    setSelectedRange(item.selection);
    if (onDateRangeChange) onDateRangeChange(item.selection);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-600 border-t-yellow-400 mb-3" />
            <p className="text-gray-400 text-base">{t('loading')}</p>
          </div>
        ) : (
          <div className="flex justify-center items-center p-3 md:p-4">
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

        {/* 5-state legend for Himalayan */}
        <div className="bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 px-3 md:px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <LegendItem color="bg-yellow-400" borderColor="border-yellow-500" label={t('selectedPeriod')} />
              <LegendItem color="bg-green-200"  borderColor="border-green-400"  label={t('allAvailable')} />
              <LegendItem color="bg-yellow-200" borderColor="border-yellow-400" label={t('twoThreeLeft')} />
              <LegendItem color="bg-orange-300" borderColor="border-orange-500" label={t('oneLeft')} />
              <LegendItem color="bg-red-400"    borderColor="border-red-600"    label={t('fullyBooked')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, borderColor, label }) {
  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-gray-700/20">
      <span className={`w-3 h-3 ${color} rounded border-2 ${borderColor} flex-shrink-0 shadow-sm`} />
      <span className="text-gray-200 font-medium text-xs">{label}</span>
    </div>
  );
}