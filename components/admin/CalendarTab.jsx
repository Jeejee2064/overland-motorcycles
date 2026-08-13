'use client'
import React from 'react';
import MotorcycleCalendar from '@/components/MotorcycleCalendar';

const CalendarTab = ({ restrictedLocation = null }) => {
  return (
    <div className="space-y-6">
      <MotorcycleCalendar restrictedLocation={restrictedLocation} />
    </div>
  );
};

export default CalendarTab;