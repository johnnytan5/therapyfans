"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { mockTherapistsWithProfiles } from "@/data/mockData";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  MessageCircle,
  Send,
  Star,
  Clock,
  Shield,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  User
} from "lucide-react";
import Link from "next/link";
import { createBlurredAvatar } from "@/lib/utils";
import { useClientProfile } from "@/components/providers/ClientAuthProvider";

interface SessionPageProps {
  params: {
    id: string;
  };
}

export default function SessionPage({ params }: SessionPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{id: string} | null>(null);
  const { client, wallet_address } = useClientProfile();

  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);
  const [sessionStatus, setSessionStatus] = useState<"waiting" | "connecting" | "active" | "ended">("waiting");
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [messages, setMessages] = useState<Array<{id: string, sender: 'client' | 'therapist', message: string, timestamp: Date}>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Extract session info from ID
  const sessionId = resolvedParams?.id || '';
  const therapistId = sessionId.includes('booked-') ? sessionId.replace('booked-session-', '') : 'therapist-1';
  const therapist = mockTherapistsWithProfiles.find(t => t.id === therapistId) || mockTherapistsWithProfiles[0];

  // Show loading if params not resolved yet
  if (!resolvedParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // Countdown timer
  useEffect(() => {
    if (sessionStatus === "active" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setSessionStatus("ended");
            setShowRatingModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sessionStatus, timeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock session connection
  const joinSession = async () => {
    setSessionStatus("connecting");
    await new Promise(resolve => setTimeout(resolve, 3000));
    setSessionStatus("active");
    
    // Add welcome message from therapist
    setMessages([{
      id: '1',
      sender: 'therapist',
      message: `Hello! I'm ${therapist.alias}. Welcome to our session. How are you feeling today?`,
      timestamp: new Date()
    }]);
  };

  const endSession = () => {
    setSessionStatus("ended");
    setShowRatingModal(true);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'client',
        message: newMessage,
        timestamp: new Date()
      }]);
      setNewMessage("");
      
      // Mock therapist response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'therapist',
          message: "I understand. Let's explore that together.",
          timestamp: new Date()
        }]);
      }, 2000);
    }
  };

  const submitRating = async () => {
    setIsSubmittingRating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmittingRating(false);
    setShowRatingModal(false);
    // Navigate back to client profile
    if (wallet_address) {
      window.location.href = `/client/${encodeURIComponent(wallet_address)}`;
    } else {
      router.push('/marketplace');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Session Header - Only show for waiting/lobby state */}
      {sessionStatus === "waiting" && (
        <div className="bg-gradient-to-r from-purple-900/20 via-background to-blue-900/20 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">
                Session <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Lobby</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Anonymous therapy session with <span className="text-purple-400">{therapist.alias}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Header */}
      {sessionStatus === "active" && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-green-900/30 via-background/80 to-green-900/30 backdrop-blur-lg border-b border-green-500/30">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="bg-green-400 text-black glow-green">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  Live Session
                </Badge>
                <span className="text-muted-foreground">with {therapist.alias}</span>
              </div>
              <div className="text-xl font-mono font-bold text-red-400 neon-text">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {sessionStatus === "waiting" && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Pre-session Info */}
            <Card className="border-0 glass border-glow hover:glow-purple transition-all duration-300">
              <CardHeader className="text-center">
                <div 
                  className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-blue-500 blur-sm opacity-70 mb-4"
                  style={{
                    backgroundImage: `url(${createBlurredAvatar(therapist.id)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <CardTitle className="text-2xl text-foreground">{therapist.alias}</CardTitle>
                <Badge variant="verified" className="mx-auto">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified Therapist
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 glass rounded-lg border border-blue-500/30 glow-blue hover:glow-blue transition-all duration-300">
                    <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-sm text-blue-400">Today</div>
                    <div className="font-semibold text-foreground">15 Minutes</div>
                  </div>
                  <div className="p-4 glass rounded-lg border border-purple-500/30 glow-purple hover:glow-purple transition-all duration-300">
                    <User className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-purple-400">Anonymous</div>
                    <div className="font-semibold text-foreground">Private Session</div>
                  </div>
                </div>

                <div className="p-4 glass rounded-lg border border-green-500/30 glow-green">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Session Ready</span>
                  </div>
                  <p className="text-sm text-green-300">
                    Your session is confirmed and ready to begin. Click the button below when you're ready.
                  </p>
                </div>

                <Button 
                  onClick={joinSession}
                  size="lg" 
                  className="w-full"
                  variant="gradient"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
              </CardContent>
            </Card>

            {/* Session Guidelines */}
            <Card className="border-0 glass border-glow hover:glow-blue transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Session Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3 hover:text-blue-400 transition-colors">
                  <Shield className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Privacy Protected:</strong> Your identity remains anonymous throughout the session.
                  </div>
                </div>
                <div className="flex items-start gap-3 hover:text-green-400 transition-colors">
                  <Clock className="w-4 h-4 text-green-400 mt-0.5" />
                  <div>
                    <strong className="text-foreground">15-Minute Focus:</strong> Short, focused sessions for maximum impact.
                  </div>
                </div>
                <div className="flex items-start gap-3 hover:text-purple-400 transition-colors">
                  <MessageCircle className="w-4 h-4 text-purple-400 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Chat Available:</strong> Use text chat for additional support during the session.
                  </div>
                </div>
                <div className="flex items-start gap-3 hover:text-yellow-400 transition-colors">
                  <Star className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Feedback Welcome:</strong> Help improve the platform with your anonymous review.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {sessionStatus === "connecting" && (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4 scale-in">
              <Loader2 className="w-16 h-16 text-blue-400 mx-auto animate-spin glow-blue" />
              <h2 className="text-2xl font-bold text-foreground">
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Connecting</span> to your session...
              </h2>
              <p className="text-muted-foreground">
                Establishing secure connection with <span className="text-purple-400">{therapist.alias}</span>
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground glass p-6 rounded-lg border-glow">
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Verifying identity</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Establishing secure connection</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Joining session room...</span>
              </div>
            </div>
          </div>
        )}

        {sessionStatus === "active" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-220px)] pt-16">
            {/* Video Area */}
            <div className="lg:col-span-3 space-y-4">
              {/* Main Video */}
              <Card className="border-0 h-96 bg-black relative overflow-hidden glass border-glow">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-cyan-900/30 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center glow-purple">
                      <User className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 neon-text">{therapist.alias}</h3>
                    <Badge variant="secondary" className="bg-white/20">
                      Anonymous Session
                    </Badge>
                  </div>
                </div>
                
                {/* Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <Button
                    size="sm"
                    variant={videoEnabled ? "default" : "destructive"}
                    onClick={() => setVideoEnabled(!videoEnabled)}
                  >
                    {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={audioEnabled ? "default" : "destructive"}
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={endSession}
                  >
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {/* Client Video (Picture-in-Picture) */}
              <Card className="border-0 h-32 w-48 bg-gray-900 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm">You (Anonymous)</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Chat Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-0 h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Session Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 space-y-3 overflow-y-auto mb-4 max-h-80">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg text-sm ${
                          msg.sender === 'client' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}>
                          <div className="font-medium text-xs mb-1 opacity-70">
                            {msg.sender === 'client' ? 'You' : therapist.alias}
                          </div>
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {sessionStatus === "ended" && !showRatingModal && (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Session Complete
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Thank you for your session with {therapist.alias}
              </p>
            </div>
            
            <Button asChild>
              <Link href={wallet_address ? `/client/${encodeURIComponent(wallet_address)}` : '/marketplace'}>
                Return to Dashboard
              </Link>
            </Button>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center">Rate Your Session</CardTitle>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Your feedback helps improve the platform
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Star Rating */}
                <div className="text-center">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-8 h-8 cursor-pointer transition-colors ${
                          star <= rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    {rating === 0 ? 'Select a rating' : 
                     rating === 1 ? 'Poor' :
                     rating === 2 ? 'Fair' :
                     rating === 3 ? 'Good' :
                     rating === 4 ? 'Very Good' : 'Excellent'}
                  </p>
                </div>

                {/* Optional Feedback */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share your experience anonymously..."
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none h-24 text-sm"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowRatingModal(false)}
                  >
                    Skip
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={submitRating}
                    disabled={rating === 0 || isSubmittingRating}
                  >
                    {isSubmittingRating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Rating'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}