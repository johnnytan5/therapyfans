"use client";

import { useState, useEffect } from "react";
import { ClientPreferencesForm } from "@/components/therapy/ClientPreferencesForm";
import { AIMatchResults } from "@/components/therapy/AIMatchResults";
import { getTherapists, TherapistWithSpecializations } from "@/lib/therapistService";
import { matchClientWithTherapists, ClientPreferences, TherapistMatch } from "@/lib/aiMatchmaking";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MatchmakingPage() {
  const [therapists, setTherapists] = useState<TherapistWithSpecializations[]>([]);
  const [matches, setMatches] = useState<TherapistMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [clientPreferences, setClientPreferences] = useState<ClientPreferences | null>(null);

  // Fetch therapists on component mount
  useEffect(() => {
    async function fetchTherapists() {
      try {
        const data = await getTherapists();
        setTherapists(data);
      } catch (error) {
        console.error('Error fetching therapists:', error);
      }
    }

    fetchTherapists();
  }, []);

  const handlePreferencesSubmit = async (preferences: ClientPreferences) => {
    setLoading(true);
    setClientPreferences(preferences);

    try {
      const matchResults = await matchClientWithTherapists({
        clientPreferences: preferences,
        therapists,
        maxResults: 3
      });

      setMatches(matchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Matchmaking error:', error);
      // Still show results with fallback matching
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setShowResults(false);
    setMatches([]);
    setClientPreferences(null);
  };

  const handleBookSession = (therapistId: string) => {
    // Navigate to booking page
    window.location.href = `/purchase/session-${therapistId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-900/20 via-background to-blue-900/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/marketplace">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Marketplace
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  AI <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Matchmaking</span>
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Find your perfect therapist match with AI-powered recommendations
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
              <span className="text-sm text-muted-foreground">Powered by Google Gemini</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {!showResults ? (
          <ClientPreferencesForm
            onPreferencesSubmit={handlePreferencesSubmit}
            loading={loading}
          />
        ) : (
          <AIMatchResults
            matches={matches}
            therapists={therapists}
            onBookSession={handleBookSession}
            onRetry={handleRetry}
            loading={loading}
          />
        )}

        {/* Info Section */}
        <div className="mt-16 glass rounded-2xl p-8 border-glow">
          <h3 className="text-lg font-semibold text-foreground mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            How AI Matchmaking Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center glass p-4 rounded-lg border-glow">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="font-semibold mb-2">Smart Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes your preferences, therapy goals, and emotional state
              </p>
            </div>
            <div className="text-center glass p-4 rounded-lg border-glow">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="font-semibold mb-2">Compatibility Scoring</h4>
              <p className="text-sm text-muted-foreground">
                Matches therapists based on vibe, language, specialty, and budget fit
              </p>
            </div>
            <div className="text-center glass p-4 rounded-lg border-glow">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="font-semibold mb-2">Personalized Results</h4>
              <p className="text-sm text-muted-foreground">
                Get detailed compatibility breakdowns and reasoning for each match
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

