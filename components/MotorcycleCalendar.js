'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getMotorcycleCalendar, getAllMotorcycles } from '@/lib/supabase/bookings';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  addMonths,
  differenceInCalendarDays,
} from 'date-fns';

const MOTORCYCLE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500', text: 'text-blue-800' },
  { bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500', text: 'text-green-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', bar: 'bg-purple-500', text: 'text-purple-800' },
  { bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500', text: 'text-orange-800' },
];

const CELL_WIDTH = 40;
const LEFT_COLUMN_WIDTH = 200;

export default function MotorcycleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [motorcycles, setMotorcycles] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorMap, setColorMap] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bikes, bookings] = await Promise.all([
        getAllMotorcycles(),
        getMotorcycleCalendar(),
      ]);

      setMotorcycles(bikes || []);
      setCalendarData(bookings || []);

      const map = {};
      (bikes || []).forEach((b, i) => {
        map[b.id] = MOTORCYCLE_COLORS[i % MOTORCYCLE_COLORS.length];
      });
      setColorMap(map);
    } catch (err) {
      console.error('Error loading calendar', err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const monthName = format(currentDate, 'MMMM yyyy');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const gridColumns = `${LEFT_COLUMN_WIDTH}px repeat(${daysInMonth.length}, minmax(${CELL_WIDTH}px, 1fr))`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="min-w-fit" style={{ display: 'grid', gridTemplateColumns: gridColumns }}>
          {/* Header Row */}
          <div className="sticky left-0 bg-gray-50 border-r border-gray-200 font-semibold text-sm py-2 px-3 z-20">
            Motorcycle
          </div>
          {daysInMonth.map((d) => (
            <div
              key={format(d, 'yyyy-MM-dd')}
              className={`text-center text-xs text-gray-600 py-2 border-r border-gray-100 ${isSameDay(d, new Date()) ? 'bg-yellow-50 font-bold text-yellow-700' : ''}`}
            >
              {format(d, 'd')}
            </div>
          ))}

          {/* Motorcycle Rows */}
          {motorcycles.map((bike) => {
            const bookings = calendarData
              .filter((b) => b.motorcycle_id === bike.id)
              .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            const color = colorMap[bike.id];

            return (
              <React.Fragment key={bike.id}>
                {/* Row container relative */}
                <div className="relative col-span-full flex">
                  {/* Left Column */}
                  <div
                    className={`sticky left-0 ${color.bg} ${color.border} border-r px-3 py-2 font-medium text-gray-800 border-t border-gray-100 z-10`}
                    style={{ width: LEFT_COLUMN_WIDTH }}
                  >
                    {bike.name}
                  </div>

                  {/* Day Cells */}
                  {daysInMonth.map((day) => (
                    <div
                      key={format(day, 'yyyy-MM-dd')}
                      className="h-12 border-t border-r border-gray-100"
                      style={{ width: CELL_WIDTH }}
                    />
                  ))}

                  {/* Booking Bars */}
                  <div className="absolute top-0 left-[200px] h-12 w-full">
                    {bookings.map((b) => {
                      const start = new Date(b.start_date);
                      const end = new Date(b.end_date);
                      const startIdx = Math.max(differenceInCalendarDays(start, monthStart), 0);
                      const endIdx = Math.min(differenceInCalendarDays(end, monthStart), daysInMonth.length - 1);

                      return (
                        <div
                          key={b.id}
                          className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-center ${color.bar} text-white shadow-md hover:scale-105 transition-transform cursor-pointer`}
                          style={{
                            left: startIdx * CELL_WIDTH + CELL_WIDTH / 2,
                            width: (endIdx - startIdx + 1) * CELL_WIDTH - CELL_WIDTH,
                          }}
                          onClick={() => setSelectedBooking({ ...b, motorcycle_name: bike.name })}
                          title={`${b.customer_name} (${format(start, 'MMM d')} - ${format(end, 'MMM d')})`}
                        >
                          <span className="truncate">{b.customer_name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900"
              onClick={() => setSelectedBooking(null)}
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-3 border-b pb-2">{selectedBooking.customer_name}</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-gray-600">Motorcycle:</span>{' '}
                <span className="font-medium text-gray-800">{selectedBooking.motorcycle_name}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-600">Period:</span>{' '}
                {format(new Date(selectedBooking.start_date), 'MMM d, yyyy')} –{' '}
                {format(new Date(selectedBooking.end_date), 'MMM d, yyyy')}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Phone:</span> {selectedBooking.phone}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Email:</span> {selectedBooking.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
