"use client";

import * as React from "react";
import {
  format,
  parse,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  setMonth,
  setYear,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string; // Format: "YYYY-MM-DD"
  onChange: (dateStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse current value
  const parsedDate = React.useMemo(() => {
    if (!value) return null;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : null;
  }, [value]);

  // Current view month/year
  const [currentView, setCurrentView] = React.useState<Date>(() => parsedDate || new Date());

  // Update currentView when value changes externally
  React.useEffect(() => {
    if (parsedDate) {
      setCurrentView(parsedDate);
    }
  }, [parsedDate]);

  const currentYear = currentView.getFullYear();
  const currentMonthIdx = currentView.getMonth();

  // Year options: from 2000 to 2040
  const years = React.useMemo(() => {
    const list: number[] = [];
    const start = 2000;
    const end = 2040;
    for (let y = start; y <= end; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Compute days for calendar grid (starting Monday)
  const daysInGrid = React.useMemo(() => {
    const monthStart = startOfMonth(currentView);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentView]);

  const handlePrevMonth = () => setCurrentView((v) => subMonths(v, 1));
  const handleNextMonth = () => setCurrentView((v) => addMonths(v, 1));

  const handleSelectDay = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    onChange(formatted);
    setOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    onChange(format(today, "yyyy-MM-dd"));
    setCurrentView(today);
    setOpen(false);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentView((v) => setMonth(v, newMonth));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentView((v) => setYear(v, newYear));
  };

  const formattedDisplay = parsedDate
    ? format(parsedDate, "dd MMM, yyyy")
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors",
            "hover:border-slate-400 hover:bg-slate-50/50",
            "focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-slate-400",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 text-[#1e3a8a] shrink-0" />
            <span className="font-medium text-slate-700">
              {formattedDisplay || placeholder}
            </span>
          </div>
          {value && (
            <span className="text-xs font-mono text-slate-400">
              {value}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[320px] p-4 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 select-none"
      >
        {/* Header Controls: Month & Year Selectors + Nav Arrows */}
        <div className="flex items-center justify-between gap-1 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-1">
            <select
              aria-label="Select month"
              value={currentMonthIdx}
              onChange={handleMonthChange}
              className="text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-[#1e3a8a] focus:outline-none transition-colors"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              aria-label="Select year"
              value={currentYear}
              onChange={handleYearChange}
              className="text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-[#1e3a8a] focus:outline-none transition-colors font-mono"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center py-2">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <div
              key={d}
              className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-0.5"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysInGrid.map((day) => {
            const isSelected = parsedDate ? isSameDay(day, parsedDate) : false;
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentView);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={cn(
                  "h-8 w-8 text-xs rounded-xl flex items-center justify-center font-medium transition-all",
                  // Outside month
                  !isCurrentMonth && "text-slate-300 hover:bg-slate-50",
                  // Current month default
                  isCurrentMonth && !isSelected && "text-slate-700 hover:bg-blue-50 hover:text-[#1e3a8a]",
                  // Today marker (not selected)
                  isToday && !isSelected && "border border-[#1e3a8a] font-bold text-[#1e3a8a]",
                  // Selected state
                  isSelected &&
                    "bg-[#1e3a8a] text-white font-bold shadow-md shadow-blue-900/20 hover:bg-[#1e40af]"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {/* Quick Footer Action Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleSelectToday}
            className="inline-flex items-center gap-1 font-semibold text-[#1e3a8a] hover:text-[#0f766e] transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
          >
            <RotateCcw className="w-3 h-3" />
            Today ({format(new Date(), "dd MMM")})
          </button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-7 text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 rounded-lg"
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
