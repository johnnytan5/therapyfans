"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Settings, 
  Users, 
  Clock,
  Copy,
  CheckCircle,
  Shield
} from "lucide-react";
import Link from "next/link";
import { useCurrentAccount } from '@mysten/dapp-kit';

export default function SessionRoom() {
  const params = useParams();
  const currentAccount = useCurrentAccount();
  const roomId = params.roomId as string;

  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Mock session data - in production, fetch from blockchain/database
  const mockSessionData = {
    therapistName: "Dr. Anonymous",
    clientName: "Anonymous Client", 
    scheduledTime: "2:00 PM - 2:30 PM",
    date: "Dec 20, 2024",
    status: "waiting",
    meetingLink: `https://devmatch.com/session/${roomId}`,
  };

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(mockSessionData.meetingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const startSession = () => {
    setSessionStarted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 via-background to-blue-900/20 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/marketplace">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Marketplace
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Therapy <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Session</span>
                </h1>
                <p className="text-sm text-muted-foreground">Room ID: {roomId}</p>
              </div>
            </div>
            
            <Badge variant="outline" className="glass border-glow">
              <Shield className="w-3 h-3 mr-1 text-green-400" />
              Secure Session
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            <Card className="glass border-glow h-96 lg:h-[500px]">
              <CardContent className="p-0 h-full">
                <div className="relative h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
                  {!sessionStarted ? (
                    // Pre-session waiting area
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">Session Ready</h3>
                        <p className="text-muted-foreground">Click "Start Session" when both parties are ready</p>
                        <Button 
                          onClick={startSession}
                          size="lg"
                          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        >
                          Start Session
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Active session placeholder
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Session Active</h3>
                        <p className="text-sm text-muted-foreground">Video call interface would be embedded here</p>
                        <div className="text-xs text-muted-foreground/70">
                          Integration with WebRTC, Zoom, or Google Meet
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-3 bg-black/50 rounded-lg p-3 backdrop-blur-sm">
                      <Button
                        variant={isVideoEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                        className="w-10 h-10 p-0"
                      >
                        {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant={isAudioEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                        className="w-10 h-10 p-0"
                      >
                        {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </Button>
                      
                      <Button variant="outline" size="sm" className="w-10 h-10 p-0">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Info Sidebar */}
          <div className="space-y-6">
            {/* Session Details */}
            <Card className="glass border-glow">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Session Details
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground">{mockSessionData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="text-foreground">{mockSessionData.scheduledTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="text-foreground">30 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={sessionStarted ? "default" : "outline"}>
                      {sessionStarted ? "Active" : "Waiting"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="glass border-glow">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Participants
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">T</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{mockSessionData.therapistName}</div>
                    <div className="text-xs text-muted-foreground">Therapist</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {sessionStarted ? "Online" : "Waiting"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">C</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{mockSessionData.clientName}</div>
                    <div className="text-xs text-muted-foreground">Client</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {currentAccount ? "Online" : "Offline"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Link */}
            <Card className="glass border-glow">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-foreground">Meeting Link</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground break-all">
                      {mockSessionData.meetingLink}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyMeetingLink}
                    className="w-full"
                  >
                    {linkCopied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session Notes */}
            <Card className="glass border-glow">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-foreground">Privacy Notice</h3>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>• This session is private and secure</p>
                  <p>• Meeting data is encrypted end-to-end</p>
                  <p>• Session details stored on blockchain</p>
                  <p>• No recordings without consent</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}