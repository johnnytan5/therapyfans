"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TherapistCard } from "@/components/therapy/TherapistCard";
import { VibeTag } from "@/components/therapy/VibeTag";
import { ClientService } from "@/lib/clientService";
import { SessionService, BookedSession } from "@/lib/sessionService";
import { getTherapists, TherapistWithSpecializations } from "@/lib/therapistService";
import { useClientProfile } from "@/components/providers/ClientAuthProvider";
import { ClientProfile } from "@/types";
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
  TrendingUp,
  Wallet,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatTime, getTimeUntilSession, formatSui } from "@/lib/utils";
import { CreateProfileModal } from "@/components/client/CreateProfileModal";
import { UserRoleBadge } from "@/components/role/UserRoleBadge";

interface ClientProfilePageProps {
  params: {
    walletAddress: string;
  };
}

export default function ClientProfilePage({ params }: ClientProfilePageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{walletAddress: string} | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "upcoming" | "recommendations">("upcoming");
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [recommendedTherapists, setRecommendedTherapists] = useState<TherapistWithSpecializations[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const { client: authClient, isAuthenticated, wallet_address } = useClientProfile();
  const loadingRef = useRef(false);

  // Debug: Track renders
  console.log('🔄 ClientProfilePage render:', {
    resolvedParams,
    clientProfile: !!clientProfile,
    isLoadingProfile,
    isAuthenticated,
    wallet_address
  });

  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);

  // Load client profile based on wallet address only
  useEffect(() => {
    if (!resolvedParams?.walletAddress || loadingRef.current) return;

    const loadClientProfile = async () => {
      loadingRef.current = true;
      setIsLoadingProfile(true);
      try {
        // Decode wallet address if URL encoded
        const walletAddress = decodeURIComponent(resolvedParams.walletAddress);
        
        // Validate wallet address format (basic check)
        if (!walletAddress.startsWith('0x') || walletAddress.length < 10) {
          console.error('Invalid wallet address format:', walletAddress);
          setClientProfile(null);
          return;
        }

        console.log('🔍 Loading profile for wallet:', walletAddress);

        // Fetch profile by wallet address (primary key)
        const profile = await ClientService.getClientByWalletAddress(walletAddress);
        
        if (profile) {
          console.log('✅ Profile found:', profile);
          // Only update if the profile is different to prevent flickering
          setClientProfile(prev => {
            if (prev?.wallet_address !== profile.wallet_address) {
              return profile;
            }
            return prev || profile; // Use profile if prev is null
          });
        } else {
          console.log('❌ No profile found for wallet:', walletAddress);
          setClientProfile(null);
        }
      } catch (error) {
        console.error('💥 Error loading client profile:', error);
        setClientProfile(null);
      } finally {
        setIsLoadingProfile(false);
        loadingRef.current = false;
      }
    };

    loadClientProfile();
  }, [resolvedParams?.walletAddress]);

  // Load booked sessions for the client
  useEffect(() => {
    async function loadBookedSessions() {
      if (!resolvedParams?.walletAddress) return;

      setIsLoadingSessions(true);
      try {
        console.log('📋 Loading booked sessions for:', resolvedParams.walletAddress);
        const sessions = await SessionService.getClientBookedSessions(resolvedParams.walletAddress);
        setBookedSessions(sessions);
        console.log('✅ Loaded sessions:', sessions.length);
      } catch (error) {
        console.error('❌ Error loading booked sessions:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    }

    loadBookedSessions();
  }, [resolvedParams?.walletAddress]);

  // Load recommended therapists from Supabase
  useEffect(() => {
    async function loadRecommendedTherapists() {
      if (!clientProfile) return;

      setIsLoadingRecommendations(true);
      try {
        console.log('🎯 Loading recommended therapists from Supabase...');
        
        // Get all therapists from Supabase
        const allTherapists = await getTherapists();
        
        // For now, show top 3 highest rated therapists as recommendations
        // In the future, this could be enhanced with AI-based matching
        const recommendations = allTherapists
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);
        
        setRecommendedTherapists(recommendations);
        console.log('✅ Loaded', recommendations.length, 'recommended therapists');
      } catch (error) {
        console.error('💥 Error loading recommended therapists:', error);
        setRecommendedTherapists([]);
      } finally {
        setIsLoadingRecommendations(false);
      }
    }

    loadRecommendedTherapists();
  }, [clientProfile]);
  
  if (!resolvedParams || isLoadingProfile) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid pt-20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    </div>;
  }

  if (!clientProfile) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid pt-20 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground mb-4">
          No profile found for wallet address: 
          <br />
          <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
            {resolvedParams?.walletAddress}
          </code>
        </p>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This wallet address hasn't been registered yet. {isAuthenticated && wallet_address === resolvedParams?.walletAddress 
              ? "Create your profile to get started!" 
              : "Connect your wallet to create a profile automatically."}
          </p>
          <div className="flex gap-3 justify-center">
            {isAuthenticated && wallet_address === resolvedParams?.walletAddress ? (
              <>
                <Button 
                  onClick={() => setShowCreateProfileModal(true)}
                  className="border-glow hover:glow-purple"
                >
                  Create My Profile
                </Button>
                <Button asChild variant="outline">
                  <Link href="/marketplace">Browse Therapists</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/marketplace">Browse Therapists</Link>
                </Button>
                <Button asChild>
                  <Link href="/">Go Home</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>;
  }

  // Check if this is the authenticated user's own profile
  const isOwnProfile = isAuthenticated && authClient?.wallet_address === clientProfile.wallet_address;
  
  // Filter real booked sessions by status
  const pastSessions = bookedSessions.filter(s => 
    s.session_status === 'completed' || s.session_status === 'cancelled' || s.session_status === 'no_show'
  );
  const upcomingSessions = bookedSessions.filter(s => 
    s.session_status === 'upcoming' || s.session_status === 'ongoing'
  );
  


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-900/20 via-background to-blue-900/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isOwnProfile ? 'My' : `${clientProfile.anon_display_name}'s`} <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Profile</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                {isOwnProfile ? 'Anonymous therapy dashboard' : 'Client profile'}
              </p>
            </div>
            
            {isOwnProfile && (
              <Button variant="outline" size="sm" className="border-glow hover:glow-purple transition-all duration-200">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            )}
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
                <CardTitle className="text-xl">{clientProfile.anon_display_name}</CardTitle>
                <div className="flex flex-col items-center gap-2">
                  <UserRoleBadge walletAddress={clientProfile.wallet_address} />
                  {clientProfile.auth_provider && (
                    <Badge variant="secondary" className="mx-auto text-xs">
                      {clientProfile.auth_provider} zkLogin
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Member since {formatDate(clientProfile.created_at)}
                  </p>
                  {isOwnProfile && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Wallet: {clientProfile.wallet_address.slice(0, 6)}...{clientProfile.wallet_address.slice(-4)}
                    </p>
                  )}
                </div>
                
                {/* Client Tags/Preferences */}
                {clientProfile.vibe_tags && clientProfile.vibe_tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {isOwnProfile ? 'My Tags' : 'Tags'}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {clientProfile.vibe_tags.map((tag) => (
                        <VibeTag key={tag} tag={tag} variant="outline" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Wallet & Privacy Info */}
                <div className="space-y-3">
                  {isOwnProfile && (
                    <div className="p-3 glass rounded-lg border border-blue-500/30 glow-blue">
                      <div className="flex items-center gap-2 text-blue-400">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm font-medium">Sui Wallet Connected</span>
                      </div>
                      <p className="text-xs text-blue-300 mt-1">
                        Balance tracked • zkLogin authenticated
                      </p>
                    </div>
                  )}
                  
                  <div className="p-3 glass rounded-lg border border-purple-500/30 glow-purple">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">100% Anonymous</span>
                    </div>
                    <p className="text-xs text-purple-300 mt-1">
                      Identity protected by zkLogin technology
                    </p>
                  </div>
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
                    <div className="text-2xl font-bold text-blue-400">
                      {clientProfile.total_sessions || pastSessions.length}
                    </div>
                    <div className="text-xs text-blue-300">Sessions Completed</div>
                  </div>
                  <div className="text-center p-3 glass rounded-lg border border-green-500/30 glow-green">
                    <div className="text-2xl font-bold text-green-400">{upcomingSessions.length}</div>
                    <div className="text-xs text-green-300">Upcoming Sessions</div>
                  </div>
                </div>
                
                <div className="text-center p-3 glass rounded-lg border border-purple-500/30 glow-purple">
                  <div className="text-lg font-bold text-purple-400">
                    {formatSui(clientProfile.total_spent_sui || pastSessions.reduce((sum, session) => sum + parseFloat(session.price_sui?.toString() || '0'), 0))}
                  </div>
                  <div className="text-xs text-purple-300">Total Investment in Wellness</div>
                </div>

                {/* Additional Stats for Own Profile */}
                {isOwnProfile && clientProfile.last_login && (
                  <div className="text-center p-3 glass rounded-lg border border-cyan-500/30 glow-cyan">
                    <div className="text-sm font-medium text-cyan-400">Last Active</div>
                    <div className="text-xs text-cyan-300 mt-1">
                      {formatDate(clientProfile.last_login)}
                    </div>
                  </div>
                )}
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
                    {isLoadingSessions ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading sessions...</p>
                      </div>
                    ) : (
                      upcomingSessions.map((session) => {
                        const sessionDateTime = new Date(`${session.date}T${session.start_time}`);
                        const { timeLeft, isToday, isUpcoming } = getTimeUntilSession(sessionDateTime.toISOString());
                        
                        return (
                          <Card key={session.id} className="border-0 glass border-glow hover:glow-blue transition-all duration-300">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <img
                                    src={session.therapist_profile_picture || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face&auto=format&q=80&seed=${session.therapist_wallet}`}
                                    alt={`${session.therapist_name} - Professional Therapist`}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-border"
                                  />
                                  <div>
                                    <h3 className="font-semibold text-lg">{session.therapist_name || 'Therapist'}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Calendar className="w-4 h-4" />
                                      {formatDate(session.date)} at {session.start_time}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="w-4 h-4" />
                                      {session.duration_minutes} minutes • {session.price_sui} SUI
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono mt-1">
                                      {session.therapist_wallet.slice(0, 8)}...{session.therapist_wallet.slice(-6)}
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
                                    <Link href={session.meeting_link || `/session/${session.meeting_room_id}`}>
                                      {isToday ? "Join Session" : "View Details"}
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
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
                
                {isLoadingSessions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading sessions...</p>
                  </div>
                ) : pastSessions.length > 0 ? (
                  <div className="space-y-4">
                    {pastSessions.map((session) => (
                      <Card key={session.id} className="border-0 glass border-glow hover:glow-green transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <img
                                src={session.therapist_profile_picture || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face&auto=format&q=80&seed=${session.therapist_wallet}`}
                                alt={`${session.therapist_name} - Professional Therapist`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-border"
                              />
                              <div>
                                <h3 className="font-semibold text-lg">{session.therapist_name || 'Therapist'}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(session.date)} at {session.start_time}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  {session.duration_minutes} minutes • {session.price_sui} SUI
                                </div>
                                <div className="text-xs text-muted-foreground font-mono mt-1">
                                  {session.therapist_wallet.slice(0, 8)}...{session.therapist_wallet.slice(-6)}
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
                  Top-rated therapists from our verified professional network
                </p>
                
                {isLoadingRecommendations ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading recommendations...</p>
                  </div>
                ) : recommendedTherapists.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {recommendedTherapists.map((therapist) => (
                      <TherapistCard
                        key={therapist.id}
                        therapist={therapist}
                        onBookSession={() => {
                          router.push(`/marketplace/${therapist.id}`);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-0">
                    <CardContent className="text-center py-12">
                      <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No recommendations yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Complete a session to get personalized therapist recommendations
                      </p>
                    </CardContent>
                  </Card>
                )}
                
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
      
      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={showCreateProfileModal}
        onClose={() => setShowCreateProfileModal(false)}
        onSuccess={() => {
          setShowCreateProfileModal(false);
          // Refresh the page to load the new profile
          window.location.reload();
        }}
      />
    </div>
  );
}