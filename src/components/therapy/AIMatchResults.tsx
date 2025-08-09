"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TherapistCard } from "./TherapistCard";
import { TherapistMatch, TherapistWithSpecializations, getTherapistFromMatch } from "@/lib/aiMatchmaking";
import { 
  Sparkles, 
  Star, 
  Heart, 
  Languages, 
  Target, 
  DollarSign,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  CheckCircle,
  TrendingUp,
  Award,
  Shield,
  Clock
} from "lucide-react";

interface AIMatchResultsProps {
  matches: TherapistMatch[];
  therapists: TherapistWithSpecializations[];
  onBookSession: (therapistId: string) => void;
  onRetry: () => void;
  loading?: boolean;
}

export function AIMatchResults({ 
  matches, 
  therapists, 
  onBookSession, 
  onRetry,
  loading = false 
}: AIMatchResultsProps) {
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-blue-400";
    if (score >= 70) return "text-yellow-400";
    return "text-orange-400";
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 90) return "Perfect Match";
    if (score >= 80) return "Excellent Match";
    if (score >= 70) return "Great Match";
    return "Good Match";
  };

  const getMatchEmoji = (score: number) => {
    if (score >= 90) return "🎯";
    if (score >= 80) return "⭐";
    if (score >= 70) return "👍";
    return "✅";
  };

  const getPersonalizedMessage = (match: TherapistMatch, index: number) => {
    const therapist = getTherapistFromMatch(match, therapists);
    if (!therapist) return "";

    if (index === 0 && match.match_score >= 90) {
      return "This is your perfect match! We're confident this therapist will be an excellent fit for your needs.";
    } else if (index === 0) {
      return "This therapist stands out as your top recommendation based on your preferences.";
    } else if (match.match_score >= 85) {
      return "Another excellent option that closely matches your requirements.";
    } else {
      return "A solid alternative that meets most of your criteria.";
    }
  };

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              We found your matches!
            </h2>
            <p className="text-lg text-muted-foreground">
              Based on your preferences, here are {matches.length} personalized recommendations
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>Personalized</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4 text-yellow-400" />
            <span>Verified</span>
          </div>
        </div>
      </div>

      {/* Match Results */}
      <div className="space-y-6">
        {matches.map((match, index) => {
          const therapist = getTherapistFromMatch(match, therapists);
          if (!therapist) return null;

          return (
            <Card key={match.therapist_id} className="glass border-glow hover:glow-purple transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Match Badge */}
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                        match.match_score >= 90 ? 'border-green-500 bg-green-500/10' :
                        match.match_score >= 80 ? 'border-blue-500 bg-blue-500/10' :
                        match.match_score >= 70 ? 'border-yellow-500 bg-yellow-500/10' :
                        'border-orange-500 bg-orange-500/10'
                      }`}>
                        <span className="text-2xl">{getMatchEmoji(match.match_score)}</span>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">
                          <span className={getMatchScoreColor(match.match_score)}>
                            {match.match_score}% Match
                          </span>
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {getMatchScoreLabel(match.match_score)}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3 leading-relaxed">
                        {getPersonalizedMessage(match, index)}
                      </p>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm text-foreground italic">
                          "{match.reason}"
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onBookSession(therapist.id)}
                    size="lg"
                    variant="gradient"
                    className="group-hover:scale-105 transition-transform"
                  >
                    Book Session
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Compatibility Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 glass rounded-lg border-glow hover:glow-red transition-all duration-300">
                    <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground mb-1">Vibe Match</div>
                    <div className="text-xl font-bold text-red-400">
                      {match.compatibility_factors.vibe_match}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Communication style
                    </div>
                  </div>
                  
                  <div className="text-center p-4 glass rounded-lg border-glow hover:glow-blue transition-all duration-300">
                    <Languages className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground mb-1">Language</div>
                    <div className="text-xl font-bold text-blue-400">
                      {match.compatibility_factors.language_match}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Communication comfort
                    </div>
                  </div>
                  
                  <div className="text-center p-4 glass rounded-lg border-glow hover:glow-green transition-all duration-300">
                    <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground mb-1">Specialty</div>
                    <div className="text-xl font-bold text-green-400">
                      {match.compatibility_factors.specialty_match}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Goal alignment
                    </div>
                  </div>
                  
                  <div className="text-center p-4 glass rounded-lg border-glow hover:glow-yellow transition-all duration-300">
                    <DollarSign className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground mb-1">Price</div>
                    <div className="text-xl font-bold text-yellow-400">
                      {match.compatibility_factors.price_match}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Budget fit
                    </div>
                  </div>
                </div>

                {/* Therapist Card */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <TherapistCard
                    therapist={therapist}
                    compact={true}
                    onBookSession={() => onBookSession(therapist.id)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Matches */}
      {matches.length === 0 && !loading && (
        <Card className="text-center py-16 glass border-glow">
          <CardContent>
            <div className="mx-auto w-20 h-20 glass rounded-full flex items-center justify-center mb-6 border-glow">
              <MessageCircle className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              No perfect matches found
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Don't worry! This just means we need to adjust your preferences to find better matches. 
              Try being more flexible with your criteria.
            </p>
            <Button onClick={onRetry} variant="outline" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Adjust Preferences
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="text-center py-16 glass border-glow">
          <CardContent>
            <div className="mx-auto w-20 h-20 glass rounded-full flex items-center justify-center mb-6 border-glow animate-pulse">
              <Sparkles className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Finding your perfect match...
            </h3>
            <p className="text-muted-foreground mb-4">
              Our AI is carefully analyzing your preferences and therapist profiles
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Actions */}
      {matches.length > 0 && (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>All therapists verified</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Secure booking</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>15min sessions</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <p className="text-muted-foreground">
              Not satisfied with these matches?
            </p>
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Different Preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
