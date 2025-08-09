"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VibeTag } from "@/components/therapy/VibeTag";
import { mockTherapistsWithProfiles, mockAvailableSlots } from "@/data/mockData";
import { 
  Star, 
  Shield, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  CheckCircle,
  Award,
  Users,
  MessageCircle,
  Zap
} from "lucide-react";
import Link from "next/link";
import { createBlurredAvatar, formatSui } from "@/lib/utils";

interface TherapistProfilePageProps {
  params: {
    id: string;
  };
}

export default function TherapistProfilePage({ params }: TherapistProfilePageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{id: string} | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");

  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);
  
  // Mock therapist data (in real app, fetch from API based on params.id)
  const therapist = mockTherapistsWithProfiles.find(t => t.id === resolvedParams?.id) || mockTherapistsWithProfiles[0];
  const { alias, profile, tags } = therapist;

  // Mock session stats
  const sessionStats = {
    totalSessions: 127,
    responseTime: "< 2 hours",
    completionRate: 98
  };

  const handleBookSession = (timeSlot: string) => {
    // Navigate to purchase page with selected time
    router.push(`/purchase/session-${therapist.id}?time=${timeSlot}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Therapist Profile
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Anonymous verified professional
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Profile Card */}
            <Card className="border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardHeader>
                <div className="flex items-start gap-6">
                  {/* Blurred Avatar */}
                  <div className="relative">
                    <div 
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 blur-sm opacity-70"
                      style={{
                        backgroundImage: `url(${createBlurredAvatar(therapist.id)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {alias}
                      </h1>
                      {profile.verified && (
                        <Badge variant="verified" className="gap-1">
                          <Shield className="w-4 h-4" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-lg">{profile.rating}</span>
                        <span className="text-gray-600 dark:text-gray-400">({sessionStats.totalSessions} sessions)</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">{sessionStats.completionRate}% completion rate</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Specializations & Approach */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Specializations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.specializations.map((spec) => (
                      <div key={spec} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{spec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    Therapy Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <VibeTag key={tag.id} tag={tag.name} />
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Response Time:</strong> {sessionStats.responseTime}</p>
                    <p><strong>Session Format:</strong> 15-minute focused sessions</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviews Section */}
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Anonymous Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock reviews */}
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">2 days ago</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      "Really helped me work through my anxiety. {alias} has a gentle but effective approach. 
                      The anonymous format made me feel more comfortable opening up."
                    </p>
                    <div className="text-xs text-gray-500 mt-2">— Anonymous Client</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">1 week ago</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      "Practical strategies that I can actually use. Short sessions but very impactful. 
                      The verification system gives me confidence in the quality."
                    </p>
                    <div className="text-xs text-gray-500 mt-2">— Anonymous Client</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">2 weeks ago</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      "Good session, though I would have liked a bit more time. The approach matches 
                      what I was looking for. Will book again."
                    </p>
                    <div className="text-xs text-gray-500 mt-2">— Anonymous Client</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing Card */}
            <Card className="border-0 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 sticky top-24">
              <CardHeader className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatSui(5)}
                </div>
                <p className="text-gray-600 dark:text-gray-400">per 15-minute session</p>
                <Badge variant="outline" className="mx-auto">
                  <Zap className="w-3 h-3 mr-1" />
                  Instant Booking
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Available Time Slots */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Available Today
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {mockAvailableSlots.filter(slot => slot.available).slice(0, 8).map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className="text-xs"
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Book Session Button */}
                <Button 
                  size="lg" 
                  className="w-full"
                  variant="gradient"
                  disabled={!selectedTimeSlot}
                  onClick={() => selectedTimeSlot && handleBookSession(selectedTimeSlot)}
                >
                  {selectedTimeSlot ? (
                    <>Book Session at {selectedTimeSlot}</>
                  ) : (
                    "Select a time slot"
                  )}
                </Button>

                {/* Session Info */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    15-minute focused sessions
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Anonymous & secure
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Video call via secure platform
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>Licensed & Verified</span>
                    </div>
                    <p>All therapists are verified through zk-proof credentials</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Sessions:</span>
                  <span className="font-semibold">{sessionStats.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Rating:</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{profile.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                  <span className="font-semibold">{sessionStats.responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                  <span className="font-semibold text-green-600">{sessionStats.completionRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}