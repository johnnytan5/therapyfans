"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TherapistCard } from "@/components/therapy/TherapistCard";
import { VibeTag } from "@/components/therapy/VibeTag";
import { mockUsers, mockSessionsWithDetails, mockTherapistsWithProfiles } from "@/data/mockData";
import { 
  User, 
  Calendar, 
  Clock, 
  Star, 
  ArrowLeft, 
  Shield, 
  Eye, 
  Settings,
  Zap,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatTime, getTimeUntilSession, formatSui } from "@/lib/utils";

interface ClientProfilePageProps {
  params: {
    id: string;
  };
}

export default function ClientProfilePage({ params }: ClientProfilePageProps) {
  const [resolvedParams, setResolvedParams] = useState<{id: string} | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "upcoming" | "recommendations">("upcoming");

  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);
  
  if (!resolvedParams) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid pt-20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>;
  }

  // Mock client data (in real app, fetch from API based on params.id)
  const client = mockUsers.find(u => u.id === resolvedParams.id && u.role === 'client') || mockUsers[0];
  
  // Get client's sessions
  const clientSessions = mockSessionsWithDetails.filter(s => s.client_id === client.id);
  const pastSessions = clientSessions.filter(s => s.status === 'completed');
  const upcomingSessions = clientSessions.filter(s => s.status === 'scheduled');
  
  // Mock recommended therapists (AI-matched)
  const recommendedTherapists = mockTherapistsWithProfiles.slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-900/20 via-background to-blue-900/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                My <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Profile</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Anonymous therapy dashboard
              </p>
            </div>
            
            <Button variant="outline" size="sm" className="border-glow hover:glow-purple transition-all duration-200">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Anonymous Profile Card */}
            <Card className="border-0 glass border-glow hover:glow-purple transition-all duration-300">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">{client.alias}</CardTitle>
                <Badge variant="outline" className="mx-auto">
                  <Eye className="w-3 h-3 mr-1" />
                  Anonymous Client
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Member since {formatDate(client.created_at)}
                  </p>
                </div>
                
                {/* Client Tags/Preferences */}
                {client.metadata?.vibe_tags && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      My Tags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {client.metadata.vibe_tags.map((tag) => (
                        <VibeTag key={tag} tag={tag} variant="outline" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy Notice */}
                <div className="p-3 glass rounded-lg border border-purple-500/30 glow-purple">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">100% Anonymous</span>
                  </div>
                  <p className="text-xs text-purple-300 mt-1">
                    Your identity is protected by zkLogin technology
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 glass border-glow hover:glow-blue transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 glass rounded-lg border border-blue-500/30 glow-blue">
                    <div className="text-2xl font-bold text-blue-400">{pastSessions.length}</div>
                    <div className="text-xs text-blue-300">Sessions Completed</div>
                  </div>
                  <div className="text-center p-3 glass rounded-lg border border-green-500/30 glow-green">
                    <div className="text-2xl font-bold text-green-400">{upcomingSessions.length}</div>
                    <div className="text-xs text-green-300">Upcoming Sessions</div>
                  </div>
                </div>
                
                <div className="text-center p-3 glass rounded-lg border border-purple-500/30 glow-purple">
                  <div className="text-lg font-bold text-purple-400">
                    {formatSui(pastSessions.length * 5)}
                  </div>
                  <div className="text-xs text-purple-300">Total Investment in Wellness</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sessions & Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 glass rounded-lg border-glow">
              <Button
                variant={activeTab === "upcoming" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("upcoming")}
                className="flex-1"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upcoming ({upcomingSessions.length})
              </Button>
              <Button
                variant={activeTab === "sessions" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("sessions")}
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-2" />
                Past Sessions ({pastSessions.length})
              </Button>
              <Button
                variant={activeTab === "recommendations" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("recommendations")}
                className="flex-1"
              >
                <Star className="w-4 h-4 mr-2" />
                Recommended
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === "upcoming" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Upcoming Sessions
                </h2>
                
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => {
                      const { timeLeft, isToday, isUpcoming } = getTimeUntilSession(session.scheduled_time);
                      
                      return (
                        <Card key={session.id} className="border-0 glass border-glow hover:glow-blue transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-sm opacity-70" />
                                <div>
                                  <h3 className="font-semibold text-lg">{session.therapist.alias}</h3>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(session.scheduled_time)} at {formatTime(session.scheduled_time)}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {session.duration_min} minutes • {formatSui(session.price_sui)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right space-y-2">
                                {isUpcoming && (
                                  <Badge variant={isToday ? "default" : "outline"}>
                                    {isToday ? "Today" : "Upcoming"}
                                  </Badge>
                                )}
                                <div className="text-sm font-medium text-blue-400">
                                  {timeLeft}
                                </div>
                                <Button size="sm" asChild>
                                  <Link href={`/session/${session.id}`}>
                                    {isToday ? "Join Session" : "View Details"}
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-0">
                    <CardContent className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No upcoming sessions
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Book a session with one of our verified therapists
                      </p>
                      <Button asChild>
                        <Link href="/marketplace">Find Therapists</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "sessions" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Past Sessions
                </h2>
                
                {pastSessions.length > 0 ? (
                  <div className="space-y-4">
                    {pastSessions.map((session) => (
                      <Card key={session.id} className="border-0 glass border-glow hover:glow-green transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-sm opacity-70" />
                              <div>
                                <h3 className="font-semibold text-lg">{session.therapist.alias}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(session.scheduled_time)}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  {session.duration_min} minutes • {formatSui(session.price_sui)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right space-y-2">
                              <Badge variant="outline" className="glass border border-green-500/30 text-green-300">
                                Completed
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">5.0</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-0">
                    <CardContent className="text-center py-12">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No past sessions yet
                      </h3>
                      <p className="text-muted-foreground">
                        Your completed sessions will appear here
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "recommendations" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Recommended for You
                </h2>
                <p className="text-muted-foreground">
                  AI-matched therapists based on your preferences and session history
                </p>
                
                <div className="grid grid-cols-1 gap-6">
                  {recommendedTherapists.map((therapist) => (
                    <TherapistCard
                      key={therapist.id}
                      therapist={therapist}
                      onBookSession={() => {
                        window.location.href = `/purchase/session-${therapist.id}`;
                      }}
                    />
                  ))}
                </div>
                
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/marketplace">
                      View All Therapists
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}