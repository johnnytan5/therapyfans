"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus, Trash2 } from "lucide-react";
import {
  AvailableSession,
  createAvailableSession,
  deleteAvailableSession,
  loadTherapistSessions,
  TherapistSessionsResult,
} from "@/lib/therapistService";

interface Props {
  therapistId: string;
  therapistWallet?: string;
  therapistPrice?: string | number | null; // price from therapist table
  initialSessions: TherapistSessionsResult | null;
  onSessionsUpdated?: (sessions: TherapistSessionsResult) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

export function CalendlyStyleAvailability({ therapistId, therapistWallet, therapistPrice, initialSessions, onSessionsUpdated }: Props) {
  const [sessions, setSessions] = useState<TherapistSessionsResult | null>(initialSessions);
  const [busy, setBusy] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    return startOfWeek;
  });

  const reload = useCallback(async () => {
    const updated = await loadTherapistSessions(therapistId, therapistWallet);
    setSessions(updated);
    onSessionsUpdated?.(updated);
  }, [therapistId, therapistWallet, onSessionsUpdated]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeek);
      date.setDate(currentWeek.getDate() + i);
      days.push(date);
      console.log(`Day ${i}:`, {
        date: date.toDateString(),
        dayOfWeek: date.getDay(),
        expectedDayName: DAYS[date.getDay()],
        columnDayName: DAYS[i]
      });
    }
    return days;
  }, [currentWeek]);

  const getSlotForDateTime = useCallback((date: Date, time: string) => {
    // Create a date object for the exact slot we're looking for in local time
    const [hours, minutes] = time.split(':').map(Number);
    const targetDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    const targetISO = targetDateTime.toISOString();
    
    // Debug log for August 9th specifically
    if (date.getDate() === 9 && date.getMonth() === 7) { // August is month 7
      console.log('🔍 AUGUST 9th DEBUGGING - getSlotForDateTime:', {
        inputDate: date.toDateString(),
        inputTime: time,
        targetDateTime: targetDateTime.toString(),
        targetISO: targetISO,
        availableSessions: sessions?.available?.map(s => ({
          id: s.id,
          scheduled_at: s.scheduled_at,
          parsed: new Date(s.scheduled_at || '').toString()
        }))
      });
    }
    
    return sessions?.available.find(s => {
      if (!s.scheduled_at) return false;
      
      // Compare the ISO strings directly (within 1 minute tolerance for any rounding)
      const storedTime = new Date(s.scheduled_at).getTime();
      const targetTime = targetDateTime.getTime();
      const timeDiff = Math.abs(storedTime - targetTime);
      
      const matches = timeDiff < 60000; // Within 1 minute
      if (matches || (date.getDate() === 9 && date.getMonth() === 7)) {
        console.log('Slot comparison result:', {
          lookingFor: { date: date.toDateString(), time, iso: targetISO },
          found: { iso: s.scheduled_at, timeDiff, matches },
          storedDateTime: new Date(s.scheduled_at).toString(),
          targetDateTime: targetDateTime.toString()
        });
      }
      
      return matches;
    });
  }, [sessions?.available]);

  const isBooked = useCallback((date: Date, time: string) => {
    // Return false for now since booked_sessions table may not exist
    return false;
  }, []);

  const toggleSlot = useCallback(async (date: Date, time: string) => {
    setBusy(true);
    try {
      const existing = getSlotForDateTime(date, time);
      if (existing) {
        // Remove slot
        console.log('Removing slot:', existing.id);
        await deleteAvailableSession(existing.id);
      } else {
        // Add slot - create in local timezone to match what user sees
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const [hours, minutes] = time.split(':').map(Number);
        
        console.log('BEFORE Creating Date:', {
          originalDate: date.toDateString(),
          year, month, day, hours, minutes,
          timeSlot: time,
          dateToString: date.toString(),
          dateGetTimezoneOffset: date.getTimezoneOffset()
        });
        
        // Create date in local timezone
        const localDateTime = new Date(year, month, day, hours, minutes);
        const iso = localDateTime.toISOString();
        
        console.log('AFTER Creating Date:', {
          localDateTime: localDateTime.toString(),
          localDateTimeISO: localDateTime.toISOString(),
          localDateTimeGetTime: localDateTime.getTime(),
          timezoneOffset: localDateTime.getTimezoneOffset(),
          formattedTime: localDateTime.toTimeString(),
          iso: iso
        });
        
        // Use therapist's price or default to 5 SUI
        const priceToUse = therapistPrice ? parseFloat(therapistPrice.toString()) : 5;
        
        const result = await createAvailableSession({
          therapistId,
          therapistWallet,
          scheduledAt: iso,
          durationMinutes: 30,
          priceSui: priceToUse,
        });
        console.log('Create result:', result);
      }
      await reload();
    } catch (error) {
      console.error('Error toggling slot:', error);
    } finally {
      setBusy(false);
    }
  }, [therapistId, therapistWallet, getSlotForDateTime, reload]);

  const navigateWeek = useCallback((direction: 'prev' | 'next') => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev);
      newWeek.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newWeek;
    });
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const isPast = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Set Your Availability
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header row with days */}
            <div className="grid grid-cols-8 bg-muted/50">
              <div className="p-3 text-sm font-medium text-center border-r">Time</div>
              {weekDays.map((date, i) => (
                <div key={i} className={`p-3 text-sm font-medium text-center border-r last:border-r-0 ${isToday(date) ? 'bg-blue-50 text-blue-700' : ''}`}>
                  <div>{DAYS[date.getDay()]}</div>
                  <div className="text-xs opacity-70">{date.getDate()}</div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-8 border-t">
                <div className="p-2 text-xs text-center border-r bg-muted/30 flex items-center justify-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {time}
                </div>
                {weekDays.map((date, i) => {
                  const existing = getSlotForDateTime(date, time);
                  const booked = isBooked(date, time);
                  const disabled = isPast(date) || busy;
                  
                  return (
                    <div key={i} className="border-r last:border-r-0 p-1">
                      <Button
                        variant={existing ? "default" : "ghost"}
                        size="sm"
                        className={`w-full h-8 text-xs ${
                          booked ? 'bg-red-100 text-red-700 hover:bg-red-100' : 
                          existing ? 'bg-green-100 text-green-700 hover:bg-green-200' : 
                          'hover:bg-blue-50'
                        }`}
                        disabled={disabled || booked}
                        onClick={() => {
                          const isAug9 = date.getDate() === 9 && date.getMonth() === 7;
                          const isFirstSlot = time === '00:00';
                          
                          console.log('Button clicked for:', {
                            dateString: date.toDateString(),
                            dayOfWeek: date.getDay(), // 0=Sunday, 1=Monday, etc.
                            expectedDay: DAYS[date.getDay()],
                            columnIndex: i,
                            time: time,
                            fullDate: date,
                            isAug9: isAug9,
                            isFirstSlot: isFirstSlot,
                            special: isAug9 && isFirstSlot ? '🚨 AUGUST 9th FIRST SLOT' : ''
                          });
                          toggleSlot(date, time);
                        }}
                      >
                        {booked ? 'Booked' : existing ? 'Available' : '+'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              Available
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              Booked
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
              Unavailable
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
