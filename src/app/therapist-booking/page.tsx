"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Calendar, User, ChevronDown, ChevronUp, ArrowLeft, Clock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { getTimeUntilSession } from "@/lib/utils";
import { loadTherapistSessions, TherapistSessionsResult } from "@/lib/therapistService";
import { CalendlyStyleAvailability } from "@/components/therapy/CalendlyStyleAvailability";
import { formatDate, formatTime } from "@/lib/meetingLinks";

export default function TherapistBookingPage() {
  const account = useCurrentAccount();
  const [therapist, setTherapist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessions, setSessions] = useState<TherapistSessionsResult | null>(null);
  const [availableExpanded, setAvailableExpanded] = useState(true);
  const [bookedExpanded, setBookedExpanded] = useState(true);
  const [revealedMeetingIds, setRevealedMeetingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchTherapistData() {
      if (!account?.address) {
        setError("Please connect your wallet");
        setLoading(false);
        return;
      }

      try {
        // Find therapist by wallet address
        const { data: therapistData, error: therapistError } = await supabase
          .from("therapists")
          .select("*")
          .eq("wallet_address", account.address)
          .single();

        if (therapistError || !therapistData) {
          setError("Therapist profile not found. Please complete onboarding first.");
          setLoading(false);
          return;
        }

        setTherapist(therapistData);

        // Load sessions
        const sessionsRes = await loadTherapistSessions(therapistData.id, therapistData.wallet_address);
        setSessions(sessionsRes as TherapistSessionsResult);
      } catch (err) {
        setError("Failed to load therapist data");
      } finally {
        setLoading(false);
        setSessionsLoading(false);
      }
    }

    fetchTherapistData();
  }, [account?.address]);

  const toggleMeetingIdReveal = (sessionId: string) => {
    setRevealedMeetingIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Loading booking dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !therapist) {
    return (
      <div className="min-h-screen py-10">
        <div className="max-w-6xl mx-auto px-4">
          <Card>
            <CardContent className="text-center py-10">
              <Clock className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="space-x-2">
                <Button asChild>
                  <Link href="/therapist-onboarding">Complete Onboarding</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Go Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/therapist/${therapist.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Therapist Booking Dashboard
              </CardTitle>
              <p className="text-muted-foreground">
                Manage your availability and view upcoming sessions
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Welcome back, <span className="font-medium">{therapist.full_name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" /> My Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-sm text-muted-foreground">Loading sessions…</div>
              ) : !sessions ? (
                <div className="text-sm text-muted-foreground">No session data.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Available Sessions */}
                  <div>
                    <button
                      onClick={() => setAvailableExpanded(!availableExpanded)}
                      className="w-full flex items-center justify-between font-medium mb-3 text-left hover:text-purple-600 transition-colors"
                    >
                      <span>Available ({sessions.available.length})</span>
                      {availableExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {availableExpanded && (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {sessions.available.length === 0 && (
                          <div className="text-sm text-muted-foreground">No available slots yet.</div>
                        )}
                        {sessions.available.map((s) => (
                          <div key={s.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="text-sm font-medium">
                                  {s.scheduled_at ? `${formatDate(s.scheduled_at)} • ${formatTime(new Date(s.scheduled_at).toTimeString().slice(0, 8))}` : 'TBD'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {s.duration_minutes ? `${s.duration_minutes} min` : '30 min'} • {s.price_sui || 5} SUI
                                </div>
                              </div>
                              <Badge variant="outline">Open</Badge>
                            </div>
                            {s.meeting_link && (
                              <div className="mt-2 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-300 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-xs text-purple-700 font-semibold flex items-center">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                                    Meeting ID
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleMeetingIdReveal(s.id)}
                                    className="h-6 px-3 text-xs bg-purple-100/60 hover:bg-purple-200/80 border border-purple-200 rounded-md"
                                  >
                                    {revealedMeetingIds.has(s.id) ? (
                                      <>
                                        <EyeOff className="w-3 h-3 mr-1 text-purple-600" />
                                        Hide
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-3 h-3 mr-1 text-purple-600" />
                                        Reveal
                                      </>
                                    )}
                                  </Button>
                                </div>
                                {revealedMeetingIds.has(s.id) && (
                                  <div className="text-xs text-purple-800 break-all font-mono bg-purple-50/80 p-2 rounded border border-purple-100">
                                    {s.meeting_link}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Booked Sessions */}
                  <div>
                    <button
                      onClick={() => setBookedExpanded(!bookedExpanded)}
                      className="w-full flex items-center justify-between font-medium mb-3 text-left hover:text-purple-600 transition-colors"
                    >
                      <span>Booked ({sessions.booked.length})</span>
                      {bookedExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {bookedExpanded && (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {sessions.booked.length === 0 && (
                          <div className="text-sm text-muted-foreground">No bookings yet.</div>
                        )}
                        {sessions.booked.map((s) => (
                          <div key={s.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium">
                                {s.scheduled_at ? `${formatDate(s.scheduled_at)} • ${formatTime(new Date(s.scheduled_at).toTimeString().slice(0, 8))}` : 'TBD'}
                              </div>
                              <Badge variant={((s.status || '').toLowerCase() === 'completed') ? 'secondary' : 'outline'}>
                                {(s.status || 'scheduled').toString()}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                              <User className="w-3 h-3" />
                              {s.client?.anon_display_name || s.client_wallet_address || 'Anonymous Client'}
                            </div>
                            {s.scheduled_at && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {getTimeUntilSession(s.scheduled_at).timeLeft}
                              </div>
                            )}
                            {s.meeting_link && (
                              <div className="mt-2 p-3 bg-blue-100 rounded-lg border border-blue-300 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-xs text-blue-700 font-semibold flex items-center">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                    Meeting ID
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleMeetingIdReveal(s.id)}
                                    className="h-6 px-3 text-xs bg-blue-100/60 hover:bg-blue-200/80 border border-blue-200 rounded-md"
                                  >
                                    {revealedMeetingIds.has(s.id) ? (
                                      <>
                                        <EyeOff className="w-3 h-3 mr-1 text-blue-600" />
                                        Hide
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-3 h-3 mr-1 text-blue-600" />
                                        Reveal
                                      </>
                                    )}
                                  </Button>
                                </div>
                                {revealedMeetingIds.has(s.id) && (
                                  <div className="text-xs text-blue-800 break-all font-mono bg-blue-50/80 p-2 rounded border border-blue-100">
                                    {s.meeting_link}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Availability Management */}
          <CalendlyStyleAvailability
            therapistId={therapist.id}
            therapistWallet={therapist.wallet_address}
            therapistPrice={therapist.price_per_session}
            initialSessions={sessions}
            onSessionsUpdated={(s) => setSessions(s)}
          />
        </div>
      </div>
    </div>
  );
}
