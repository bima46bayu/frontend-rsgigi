import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isWithinInterval,
  isAfter,
  isBefore,
  startOfDay,
  subDays,
  subWeeks,
  subMonths as subMonthsFn,
  subQuarters
} from 'date-fns';
import { id } from 'date-fns/locale';

const DateRangePicker = ({ value, onChange }) => {
  const [viewDate, setViewDate] = useState(value.start_date ? new Date(value.start_date) : new Date());
  const [hoverDate, setHoverDate] = useState(null);

  const startDate = value.start_date ? startOfDay(new Date(value.start_date)) : null;
  const endDate = value.end_date ? startOfDay(new Date(value.end_date)) : null;

  const handleDateClick = (day) => {
    const clickedDay = startOfDay(day);
    if (!startDate || (startDate && endDate)) {
      onChange({ start_date: format(clickedDay, 'yyyy-MM-dd'), end_date: null });
    } else if (startDate && !endDate) {
      if (isBefore(clickedDay, startDate)) {
        onChange({ start_date: format(clickedDay, 'yyyy-MM-dd'), end_date: null });
      } else {
        onChange({ ...value, end_date: format(clickedDay, 'yyyy-MM-dd') });
      }
    }
  };

  const presets = [
    { label: 'Hari Ini', getValue: () => ({ start: new Date(), end: new Date() }) },
    { label: 'Kemarin', getValue: () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) }) },
    { label: 'Minggu Ini', getValue: () => ({ start: startOfWeek(new Date(), { locale: id }), end: new Date() }) },
    { label: 'Bulan Ini', getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
    { label: '3 Bulan Terakhir', getValue: () => ({ start: startOfMonth(subMonthsFn(new Date(), 2)), end: new Date() }) },
  ];

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-black text-slate-700 capitalize tracking-tight">
        {format(viewDate, 'MMMM yyyy', { locale: id })}
      </span>
      <div className="flex gap-1">
        <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const dateStart = startOfWeek(monthStart, { locale: id });
    const dateEnd = endOfWeek(monthEnd, { locale: id });

    const days = [];
    let day = dateStart;

    // Weekday headers
    const weekDays = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'];
    const headers = weekDays.map(d => (
      <div key={d} className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center mb-2">{d}</div>
    ));

    while (day <= dateEnd) {
      const cloneDay = day;
      const isSelected = (startDate && isSameDay(day, startDate)) || (endDate && isSameDay(day, endDate));
      const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
      const isHoverRange = !endDate && startDate && hoverDate && isAfter(day, startDate) && isBefore(day, hoverDate);
      const isCurrentMonth = isSameMonth(day, monthStart);

      days.push(
        <div
          key={day.toString()}
          className={`relative py-2 text-center cursor-pointer group flex items-center justify-center`}
          onClick={() => handleDateClick(cloneDay)}
          onMouseEnter={() => setHoverDate(cloneDay)}
        >
          {/* Range Background */}
          {(isInRange || isHoverRange) && (
            <div className={`absolute inset-y-1 inset-x-0 ${
              isSameDay(day, startDate) ? "rounded-l-full" : 
              endDate && isSameDay(day, endDate) ? "rounded-r-full" : ""
            } bg-primary/10`} />
          )}

          <span className={`relative z-10 text-[11px] font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all ${
            isSelected ? "bg-primary text-white shadow-lg shadow-primary/30" : 
            !isCurrentMonth ? "text-slate-200" :
            isInRange || isHoverRange ? "text-primary font-black" : "text-slate-600 hover:bg-slate-100"
          }`}>
            {format(day, "d")}
          </span>
        </div>
      );
      day = addDays(day, 1);
    }

    return (
      <div className="flex-1">
        {renderHeader()}
        <div className="grid grid-cols-7">
          {headers}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row bg-white w-full">
      {/* Sidebar Presets */}
      <div className="w-full sm:w-40 border-b sm:border-b-0 sm:border-r border-slate-50 p-4 bg-slate-50/30 flex flex-row sm:flex-col gap-2 overflow-x-auto scrollbar-hide">
        <label className="hidden sm:block text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3 px-2">Pilih Cepat</label>
        {presets.map(p => {
          const isActive = startDate && endDate && isSameDay(startDate, p.getValue().start) && isSameDay(endDate, p.getValue().end);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                const range = p.getValue();
                onChange({ start_date: format(range.start, 'yyyy-MM-dd'), end_date: format(range.end, 'yyyy-MM-dd') });
              }}
              className={`whitespace-nowrap sm:w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]" 
                  : "text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange({ start_date: null, end_date: null })}
          className="whitespace-nowrap sm:w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 transition-all sm:mt-2"
        >
          Reset
        </button>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-hidden">
        {renderCalendar()}
        
        {/* Selection Info */}
        <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
           <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Rentang Terpilih</span>
                <div className="text-xs font-black text-slate-700 tabular-nums flex items-center gap-2">
                    {startDate ? format(startDate, 'dd MMM yyyy', { locale: id }) : '-- --- ----'}
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    {endDate ? format(endDate, 'dd MMM yyyy', { locale: id }) : '-- --- ----'}
                </div>
            </div>
            {startDate && endDate && (
                <div className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-wider animate-in fade-in slide-in-from-right-2">
                    Siap Download
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
