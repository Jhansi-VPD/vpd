"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { hrApi } from '../../../api/hr.api';
import { attendanceApi } from '../../../api';

export interface PunchEntry {
  id: string;
  type: 'in' | 'out';
  timestamp: number; // epoch ms
  displayTime: string; // e.g. "08:57"
}

interface AttendanceTrackerCardProps {
  onPunchChange?: (isTappedIn: boolean, punches: PunchEntry[]) => void;
  className?: string;
  variant?: 'card' | 'banner';
}

// Helper to convert time strings like "08:57" or "08:57:00" into today's exact epoch timestamp
const parseTimeToTodayEpoch = (timeStr: any): number => {
  if (!timeStr) return Date.now();
  const str = String(timeStr).trim();

  // If full ISO timestamp
  if (str.includes('T')) {
    const epoch = new Date(str).getTime();
    if (!isNaN(epoch)) return epoch;
  }

  // Parse "HH:MM" or "HH:MM:SS"
  const parts = str.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parts.length > 2 ? parseInt(parts[2], 10) : 0;
    if (!isNaN(h) && !isNaN(m)) {
      const d = new Date();
      d.setHours(h, m, isNaN(s) ? 0 : s, 0);
      return d.getTime();
    }
  }

  return Date.now();
};

export const AttendanceTrackerCard: React.FC<AttendanceTrackerCardProps> = ({
  onPunchChange,
  className = '',
  variant = 'card',
}) => {
  const [punches, setPunches] = useState<PunchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Today key for local storage (YYYY-MM-DD)
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Format today header e.g. "Friday 09/10/2026"
  const formattedTodayDate = useMemo(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dayName} ${dd}/${mm}/${yyyy}`;
  }, []);

  // Sync / load today's punches
  useEffect(() => {
    const loadTodayData = async () => {
      const storageKey = `vpd_punches_${todayKey}`;
      const saved = localStorage.getItem(storageKey);

      let initialPunches: PunchEntry[] = [];
      if (saved) {
        try {
          initialPunches = JSON.parse(saved);
        } catch {
          initialPunches = [];
        }
      }

      // Reconcile and fix any stale or mismatched timestamps in stored punches
      initialPunches = initialPunches.map((p) => {
        if (p.displayTime && p.displayTime !== '--:--') {
          const expected = parseTimeToTodayEpoch(p.displayTime);
          // If mismatch is greater than 2 minutes, heal with the accurate time
          if (Math.abs(expected - p.timestamp) > 120000) {
            return { ...p, timestamp: expected };
          }
        }
        return p;
      });

      // If localStorage is empty, check backend status
      if (initialPunches.length === 0) {
        try {
          const res = await hrApi.getMyTodayAttendance().catch(() => null);
          const data = res?.data;
          if (data && data.check_in) {
            const rawIn = String(data.check_in).slice(0, 5); // "08:57"
            const inEntry: PunchEntry = {
              id: 'init-in',
              type: 'in',
              timestamp: parseTimeToTodayEpoch(data.check_in),
              displayTime: rawIn,
            };
            initialPunches.push(inEntry);

            if (data.check_out) {
              const rawOut = String(data.check_out).slice(0, 5);
              initialPunches.push({
                id: 'init-out',
                type: 'out',
                timestamp: parseTimeToTodayEpoch(data.check_out),
                displayTime: rawOut,
              });
            }
            localStorage.setItem(storageKey, JSON.stringify(initialPunches));
          }
        } catch {
          // ignore error
        }
      }

      setPunches(initialPunches);
    };

    loadTodayData();
  }, [todayKey]);

  // Real-time ticking every second to update work & break time dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [isShiftEnded, setIsShiftEnded] = useState(false);

  // Load shift ended state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ended = localStorage.getItem(`vpd_shift_ended_${todayKey}`) === 'true';
      setIsShiftEnded(ended);
    }
  }, [todayKey]);

  // Current state: is employee currently clocked in?
  const isTappedIn = useMemo(() => {
    if (punches.length === 0) return false;
    return punches[punches.length - 1].type === 'in';
  }, [punches]);

  // First Time In and Latest Time Out
  const firstTimeIn = useMemo(() => {
    const firstIn = punches.find((p) => p.type === 'in');
    return firstIn ? firstIn.displayTime : '--:--';
  }, [punches]);

  const latestTimeOut = useMemo(() => {
    if (isTappedIn) return '--:--';
    const lastOut = [...punches].reverse().find((p) => p.type === 'out');
    return lastOut ? lastOut.displayTime : '--:--';
  }, [punches, isTappedIn]);

  // Calculate Total Work Time and Total Break Time (in minutes)
  const { workMinutes, breakMinutes, isShiftCompleted } = useMemo(() => {
    let totalWorkMs = 0;
    let totalBreakMs = 0;

    for (let i = 0; i < punches.length; i++) {
      const p = punches[i];

      if (p.type === 'in') {
        // Find corresponding 'out' for this work session
        const nextOut = punches[i + 1];
        if (nextOut && nextOut.type === 'out') {
          totalWorkMs += Math.max(0, nextOut.timestamp - p.timestamp);
        } else if (i === punches.length - 1) {
          // Currently actively working: tick live
          totalWorkMs += Math.max(0, currentTime - p.timestamp);
        }
      } else if (p.type === 'out') {
        // Find next 'in' for break duration between sessions
        const nextIn = punches[i + 1];
        if (nextIn && nextIn.type === 'in') {
          totalBreakMs += Math.max(0, nextIn.timestamp - p.timestamp);
        }
      }
    }

    const completedWorkMins = Math.floor(totalWorkMs / (1000 * 60));
    // Shift is completed when employee is tapped out and has reached standard work hours (>= 8 hrs / 480 mins) or explicitly ended shift
    const isCompleted = !isTappedIn && punches.length > 0 && (completedWorkMins >= 480 || isShiftEnded);

    // If currently tapped out and shift is NOT concluded (i.e. taking a break during workday)
    if (!isTappedIn && !isCompleted && punches.length > 0) {
      const lastOut = punches[punches.length - 1];
      if (lastOut && lastOut.type === 'out') {
        const activeBreakMs = Math.max(0, currentTime - lastOut.timestamp);
        // Cap single active break at 120 mins to avoid runaway
        const cappedBreakMs = Math.min(activeBreakMs, 120 * 60 * 1000);
        totalBreakMs += cappedBreakMs;
      }
    }

    return {
      workMinutes: completedWorkMins,
      breakMinutes: Math.floor(totalBreakMs / (1000 * 60)),
      isShiftCompleted: isCompleted,
    };
  }, [punches, currentTime, isTappedIn, isShiftEnded]);

  // Format durations into "X Hrs Y Mins"
  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} Hrs ${m} Mins`;
  };

  const handleTapIn = async () => {
    if (isTappedIn || loading) return;
    setLoading(true);

    const now = new Date();
    const display = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const newEntry: PunchEntry = {
      id: Date.now().toString(),
      type: 'in',
      timestamp: Date.now(),
      displayTime: display,
    };

    setIsShiftEnded(false);
    localStorage.removeItem(`vpd_shift_ended_${todayKey}`);

    const updated = [...punches, newEntry];
    setPunches(updated);
    localStorage.setItem(`vpd_punches_${todayKey}`, JSON.stringify(updated));

    // Backend sync
    try {
      await hrApi.checkIn().catch(() => attendanceApi.checkIn({ date: todayKey, check_in: display }));
    } catch {
      // offline/fallback
    } finally {
      setLoading(false);
      onPunchChange?.(true, updated);
    }
  };

  const handleTapOut = async () => {
    if (!isTappedIn || loading) return;
    setLoading(true);

    const now = new Date();
    const display = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const newEntry: PunchEntry = {
      id: Date.now().toString(),
      type: 'out',
      timestamp: Date.now(),
      displayTime: display,
    };

    const updated = [...punches, newEntry];
    setPunches(updated);
    localStorage.setItem(`vpd_punches_${todayKey}`, JSON.stringify(updated));

    // Backend sync
    try {
      await hrApi.checkOut().catch(() => attendanceApi.checkOut({ date: todayKey, check_out: display }));
    } catch {
      // offline/fallback
    } finally {
      setLoading(false);
      onPunchChange?.(false, updated);
    }
  };

  if (variant === 'banner') {
    return (
      <div className={`bg-[#0E1013]/90 border border-[#272B35] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 shadow-2xl backdrop-blur-sm w-full md:w-auto ${className}`}>
        {/* Left Stats: Work & Break */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Work Time */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1C2028] border border-[#2B313E] flex items-center justify-center text-white flex-shrink-0 shadow-inner">
              <svg className="w-4 h-4 text-[#EDB940]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 3" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight leading-tight">
                {formatDuration(workMinutes)}
              </div>
              <div className="text-[10px] text-[#9B9DA3] font-medium">
                Work Time
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-[#272B35]" />

          {/* Break Time */}
          <div>
            <div className="text-sm font-bold text-[#818CF8] tracking-tight leading-tight">
              {formatDuration(breakMinutes)}
            </div>
            <div className="text-[10px] text-[#9B9DA3] font-medium">
              Break Time
            </div>
          </div>
        </div>

        {/* Right Actions: Time In/Out & Tap Button */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#272B35]">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-mono text-[#9B9DA3]">
              In: <span className="text-white font-medium">{firstTimeIn}</span>
            </div>
            <div className="text-[10px] text-[#7A7D84]">
              {latestTimeOut !== '--:--' ? `Out: ${latestTimeOut}` : isTappedIn ? '● Active' : '● Idle'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isTappedIn ? (
              <button
                type="button"
                onClick={handleTapIn}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-100 text-black border border-white shadow-sm transition-all"
              >
                {loading ? '...' : 'Tap In'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTapOut}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-red-500/20 active:scale-95 transition-all"
              >
                {loading ? '...' : 'Tap Out'}
              </button>
            )}

            <Link
              href="/hr/attendance"
              className="p-1.5 text-[#9B9DA3] hover:text-[#EDB940] rounded-lg hover:bg-[#1C2028] transition-colors border border-transparent hover:border-[#272B35]"
              title="View full attendance history and logs"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#15181D] border border-[#272B35] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 ${className}`}>
      {/* Top Date Header & Live Shift Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#9B9DA3] tracking-wide">
          {formattedTodayDate}
        </span>
        <div className="self-start sm:self-auto">
          {isTappedIn ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Shift Active (Working)
            </span>
          ) : isShiftCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Shift Completed ({formatDuration(workMinutes)})
            </span>
          ) : punches.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                On Break (Tap In to Resume)
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsShiftEnded(true);
                  localStorage.setItem(`vpd_shift_ended_${todayKey}`, 'true');
                }}
                className="text-[10px] text-[#9B9DA3] hover:text-white underline transition-colors"
                title="End shift and finalize break time for today"
              >
                Finish Day
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1C2028] text-[#9B9DA3] border border-[#2B313E]">
              Not Started Today
            </span>
          )}
        </div>
      </div>

      {/* Main Clock & Metric Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Clock Icon + Metrics */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          {/* Clock Icon in Soft Rounded Box */}
          <div className="w-12 h-12 rounded-2xl bg-[#1C2028] border border-[#2B313E] flex items-center justify-center text-xl text-white shadow-inner flex-shrink-0">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 3" />
            </svg>
          </div>

          {/* Metric 1: Total Work Time */}
          <div>
            <div className="text-base sm:text-lg font-bold text-white tracking-tight">
              {formatDuration(workMinutes)}
            </div>
            <div className="text-xs text-[#9B9DA3] font-medium mt-0.5">
              Total Work Time
            </div>
          </div>

          {/* Metric 2: Total Break Time (in purple/indigo) */}
          <div>
            <div className="text-base sm:text-lg font-bold text-[#818CF8] tracking-tight">
              {formatDuration(breakMinutes)}
            </div>
            <div className="text-xs text-[#9B9DA3] font-medium mt-0.5">
              Total Break Time
            </div>
          </div>
        </div>

        {/* Right: Time In, Tap Buttons, Time Out */}
        <div className="flex items-center gap-5 sm:gap-6 self-start lg:self-auto">
          {/* Time In */}
          <div className="text-center min-w-[50px]">
            <div className="text-xs text-[#9B9DA3] font-medium">Time In</div>
            <div className="text-sm font-bold text-[#818CF8] mt-1">
              {firstTimeIn}
            </div>
          </div>

          {/* Buttons: Tap In / Tap Out */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleTapIn}
              disabled={isTappedIn || loading}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                !isTappedIn
                  ? 'bg-white hover:bg-zinc-100 text-black border-white shadow-sm'
                  : 'bg-transparent text-[#5A5D64] border-[#272B35] cursor-not-allowed opacity-60'
              }`}
            >
              {loading && !isTappedIn ? '...' : 'Tap In'}
            </button>

            <button
              type="button"
              onClick={handleTapOut}
              disabled={!isTappedIn || loading}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isTappedIn
                  ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-red-500/20 active:scale-95'
                  : 'bg-[#20242D] text-[#5A5D64] border border-[#272B35] cursor-not-allowed opacity-60'
              }`}
            >
              {loading && isTappedIn ? '...' : 'Tap Out'}
            </button>
          </div>

          {/* Time Out */}
          <div className="text-center min-w-[50px]">
            <div className="text-xs text-[#9B9DA3] font-medium">Time Out</div>
            <div className="text-sm font-bold text-[#818CF8] mt-1">
              {latestTimeOut}
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Divider */}
      <div className="border-t border-[#272B35]" />

      {/* Bottom: Today's Entries */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-[#9B9DA3]">
          Today&apos;s Entries
        </div>

        {punches.length === 0 ? (
          <p className="text-xs text-[#5A5D64] italic">
            No clock-in entries recorded yet today. Tap In to start your work session.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {punches.map((p, idx) => {
              const isIn = p.type === 'in';
              return (
                <div
                  key={p.id || idx}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono font-medium border ${
                    isIn
                      ? 'bg-[#10B981]/10 text-[#34D399] border-[#10B981]/30'
                      : 'bg-[#EF4444]/10 text-[#F87171] border-[#EF4444]/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isIn ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                    } ${isIn && idx === punches.length - 1 ? 'animate-pulse' : ''}`}
                  />
                  <span>{p.displayTime}</span>
                  <span className="text-[10px] text-[#9B9DA3] uppercase">
                    ({isIn ? 'In' : 'Out'})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTrackerCard;
