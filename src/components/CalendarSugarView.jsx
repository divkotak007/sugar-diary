import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

const CalendarSugarView = ({ logs }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    // Aggregate logs by date and calculate daily average
    const dailyData = useMemo(() => {
        const grouped = {};

        logs.forEach(log => {
            if (!log.hgt) return; // Only sugar logs

            const timestamp = log.timestamp?.seconds ? log.timestamp.seconds * 1000 : log.timestamp;
            const date = new Date(timestamp);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            if (!grouped[dateKey]) {
                grouped[dateKey] = { values: [], logs: [] };
            }

            grouped[dateKey].values.push(parseFloat(log.hgt));
            grouped[dateKey].logs.push({ ...log, timestamp });
        });

        // Calculate averages and determine colors
        const result = {};
        Object.keys(grouped).forEach(dateKey => {
            const values = grouped[dateKey].values;
            const avg = values.reduce((a, b) => a + b, 0) / values.length;

            let color = 'green';
            if (avg > 180) color = 'red';
            else if (avg > 140) color = 'amber';

            result[dateKey] = {
                average: avg.toFixed(0),
                color,
                count: values.length,
                logs: grouped[dateKey].logs.sort((a, b) => a.timestamp - b.timestamp)
            };
        });

        return result;
    }, [logs]);

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Previous month padding
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ date: null, isCurrentMonth: false });
        }

        // Current month days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({
                date,
                dateKey,
                day,
                isCurrentMonth: true,
                isToday: dateKey === new Date().toISOString().split('T')[0],
                data: dailyData[dateKey]
            });
        }

        return days;
    }, [currentMonth, dailyData]);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const handleDateClick = (day) => {
        if (day.data && day.isCurrentMonth) {
            setSelectedDate(day);
        }
    };

    const colorClasses = {
        green: 'bg-emerald-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500'
    };

    return (
        <div className="bg-white dark:bg-stone-800 rounded-[24px] p-4 shadow-sm border border-stone-100 dark:border-stone-700 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-stone-400" />
                    <h3 className="font-bold text-stone-700 dark:text-stone-200 text-sm">Sugar Control Calendar</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors">
                        <ChevronLeft size={18} className="text-stone-600 dark:text-stone-400" />
                    </button>
                    <div className="text-sm font-bold text-stone-700 dark:text-stone-200 min-w-[120px] text-center">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors">
                        <ChevronRight size={18} className="text-stone-600 dark:text-stone-400" />
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-[10px] font-bold text-stone-400 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => (
                    <button
                        key={i}
                        onClick={() => handleDateClick(day)}
                        disabled={!day.isCurrentMonth || !day.data}
                        className={`
              aspect-square rounded-lg flex flex-col items-center justify-center relative
              transition-all duration-200
              ${day.isCurrentMonth ? 'text-stone-700 dark:text-stone-200' : 'text-stone-300 dark:text-stone-600'}
              ${day.isToday ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}
              ${day.data ? 'hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer' : 'cursor-default'}
              ${!day.isCurrentMonth ? 'opacity-30' : ''}
            `}
                    >
                        {day.date && (
                            <>
                                <span className="text-xs font-bold">{day.day}</span>
                                {day.data && (
                                    <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${colorClasses[day.data.color]}`} />
                                )}
                            </>
                        )}
                    </button>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">Good (&lt;140)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">Fair (140-180)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">High (&gt;180)</span>
                </div>
            </div>

            {/* Day Detail Modal */}
            {selectedDate && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}>
                    <div className="bg-white dark:bg-stone-800 rounded-[24px] max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">
                                    {selectedDate.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                    Daily Average: <span className="font-bold text-stone-700 dark:text-stone-200">{selectedDate.data.average} mg/dL</span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl transition-colors">
                                <X size={20} className="text-stone-400" />
                            </button>
                        </div>

                        {/* Logs List */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-3">
                                {selectedDate.data.logs.map((log, idx) => {
                                    const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 rounded-xl">
                                            <div>
                                                <div className="text-sm font-bold text-stone-700 dark:text-stone-200">{time}</div>
                                                {log.mealStatus && (
                                                    <div className="text-xs text-stone-500 dark:text-stone-400">{log.mealStatus}</div>
                                                )}
                                            </div>
                                            <div className="text-xl font-black text-stone-800 dark:text-stone-100">
                                                {log.hgt} <span className="text-xs font-bold text-stone-400">mg/dL</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarSugarView;
