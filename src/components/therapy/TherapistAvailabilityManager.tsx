"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Calendar } from "lucide-react";
import { 
  AvailableSession,
  createAvailableSession,
  deleteAvailableSession,
  loadTherapistSessions,
  TherapistSessionsResult,
} from "@/lib/therapistService";
import { formatDate, formatTime } from "@/lib/utils";

interface Props {
  therapistId: string; // if your table uses therapist_id
  therapistWallet?: string; // if your table uses therapist_wallet
  initialSessions: TherapistSessionsResult | null;
  onSessionsUpdated?: (sessions: TherapistSessionsResult) => void;
}

export function TherapistAvailabilityManager({ therapistId, therapistWallet, initialSessions, onSessionsUpdated }: Props) {
  const [sessions, setSessions] = useState<TherapistSessionsResult | null>(initialSessions);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [rangeStart, setRangeStart] = useState<string>("09:00");
  const [rangeEnd,   setRangeEnd]   = useState<string>("17:30");
  const [rangePrice, setRangePrice] = useState<number>(5);

  const available = sessions?.available ?? [];

  const isoFromDateTime = useCallback((d: string, t: string) => {
    // Expect date as YYYY-MM-DD and time as HH:mm (24h)
    if (!d || !t) return null;
    try {
      const iso = new Date(`${d}T${t}:00Z`).toISOString();
      return iso;
    } catch {
      return null;
    }
  }, []);

  const reload = useCallback(async () => {
    const updated = await loadTherapistSessions(therapistId);
    setSessions(updated);
    onSessionsUpdated?.(updated);
  }, [therapistId, onSessionsUpdated]);

  const createSlot = useCallback(async (slotTimeHHmm: string) => {
    const iso = isoFromDateTime(date, slotTimeHHmm);
    if (!iso) return;
    setBusy(true);
    try {
      const created = await createAvailableSession({
        therapistId,
        therapistWallet,
        scheduledAt: iso,
        durationMinutes: 30,
        priceSui: null,
      });
      if (created) {
        await reload();
      }
    } finally {
      setBusy(false);
    }
  }, [date, therapistId, isoFromDateTime, reload]);

  const removeSlot = useCallback(async (id: string) => {
    setBusy(true);
    try {
      const ok = await deleteAvailableSession(id);
      if (ok) {
        await reload();
      }
    } finally {
      setBusy(false);
    }
  }, [reload]);

  // Maps for the selected day's availability and bookings (used by range creation)
  const selectedDayAvailableByTime = useMemo(() => {
    const map = new Map<string, AvailableSession>();
    available
      .filter((s) => s.scheduled_at && s.scheduled_at.slice(0, 10) === date)
      .forEach((s) => {
        const timeStr = new Date(s.scheduled_at as string).toISOString().slice(11, 16); // HH:mm
        map.set(timeStr, s);
      });
    return map;
  }, [available, date]);

  const selectedDayBookedTimes = useMemo(() => {
    const set = new Set<string>();
    (sessions?.booked ?? [])
      .filter((s) => s.scheduled_at && s.scheduled_at.slice(0, 10) === date)
      .forEach((s) => {
        const timeStr = new Date(s.scheduled_at as string).toISOString().slice(11, 16);
        set.add(timeStr);
      });
    return set;
  }, [sessions?.booked, date]);

  // Bulk create 30-min slots within a time range
  const createRange = useCallback(async () => {
    if (!date || !rangeStart || !rangeEnd) return;
    // Normalize HH:mm
    const [sh, sm] = rangeStart.split(":").map((v) => parseInt(v, 10));
    const [eh, em] = rangeEnd.split(":").map((v) => parseInt(v, 10));
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    if (isNaN(startMins) || isNaN(endMins) || endMins <= startMins) return;

    setBusy(true);
    try {
      // generate half-hour steps, skip duplicates/booked
      const promises: Promise<any>[] = [];
      for (let m = startMins; m < endMins; m += 30) {
        const hh = Math.floor(m / 60)
          .toString()
          .padStart(2, "0");
        const mm = (m % 60).toString().padStart(2, "0");
        const hhmm = `${hh}:${mm}`;
        // if already available or booked at this time, skip
        const exists = selectedDayAvailableByTime.get(`${hh}:${mm}`) || selectedDayBookedTimes.has(`${hh}:${mm}`);
        if (exists) continue;
        const iso = isoFromDateTime(date, hhmm);
        if (!iso) continue;
        promises.push(
          createAvailableSession({
            therapistId,
            therapistWallet,
            scheduledAt: iso,
            durationMinutes: 30,
            priceSui: rangePrice,
          })
        );
      }
      if (promises.length > 0) {
        await Promise.allSettled(promises);
        await reload();
      }
    } finally {
      setBusy(false);
    }
  }, [date, rangeStart, rangeEnd, therapistId, therapistWallet, rangePrice, isoFromDateTime, reload, selectedDayAvailableByTime, selectedDayBookedTimes]);

  // (duplicates removed above)

  const timeSlots: string[] = useMemo(() => {
    // Generate half-hour slots between 09:00 and 17:30 inclusive
    const slots: string[] = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour !== 17) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      } else {
        // include 17:30 as last slot
        slots.push(`17:30`);
      }
    }
    return slots;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Manage Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date selector */}
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label htmlFor="date" className="text-xs text-muted-foreground">Date</label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="rstart" className="text-xs text-muted-foreground">Range start (UTC)</label>
            <Input id="rstart" type="time" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
          </div>
          <div>
            <label htmlFor="rend" className="text-xs text-muted-foreground">Range end (UTC)</label>
            <Input id="rend" type="time" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
          </div>
          <div>
            <label htmlFor="rprice" className="text-xs text-muted-foreground">Price (SUI)</label>
            <Input id="rprice" type="number" min={0} step={0.01} value={rangePrice} onChange={(e) => setRangePrice(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={createRange} disabled={busy} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Range
          </Button>
        </div>

        {/* Time grid (30-min strict) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Available Times</Badge>
            <span className="text-xs text-muted-foreground">Select a 30-minute session slot</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {timeSlots.map((hhmm) => {
              const existing = selectedDayAvailableByTime.get(hhmm);
              const booked = selectedDayBookedTimes.has(hhmm);
              const label = (() => {
                const [h, m] = hhmm.split(":").map(Number);
                const ampm = h >= 12 ? "PM" : "AM";
                const hour12 = h % 12 === 0 ? 12 : h % 12;
                return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
              })();

              return (
                <div key={hhmm} className="relative">
                  <Button
                    variant={existing ? "default" : "ghost"}
                    className={`w-full justify-center ${booked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={busy || booked}
                    onClick={() => {
                      if (existing) {
                        removeSlot(existing.id);
                      } else {
                        createSlot(hhmm);
                      }
                    }}
                  >
                    {label}
                  </Button>
                  {booked && (
                    <div className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-red-400">Booked</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing custom list with delete (fallback) */}
        <div className="space-y-3 hidden">
          {available.map((s: AvailableSession) => (
            <div key={s.id} className="border rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {s.scheduled_at ? `${formatDate(s.scheduled_at)} • ${formatTime(s.scheduled_at)}` : 'TBD'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.duration_minutes ? `${s.duration_minutes} min` : ''}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => removeSlot(s.id)} disabled={busy}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


