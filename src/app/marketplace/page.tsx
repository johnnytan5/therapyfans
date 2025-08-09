"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TherapistCard } from "@/components/therapy/TherapistCard";
import { VibeTag } from "@/components/therapy/VibeTag";
import { ClientPreferencesForm } from "@/components/therapy/ClientPreferencesForm";
import { AIMatchResults } from "@/components/therapy/AIMatchResults";
import { Search, Filter, Star, Shield, ArrowLeft, Sparkles, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { getTherapists, TherapistWithSpecializations } from "@/lib/therapistService";
import { matchClientWithTherapists, ClientPreferences, TherapistMatch } from "@/lib/aiMatchmaking";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"rating" | "price" | "name">("rating");
  const [minRating, setMinRating] = useState(0);
  const [therapists, setTherapists] = useState<TherapistWithSpecializations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // AI Matchmaking states
  const [matches, setMatches] = useState<TherapistMatch[]>([]);
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [showMatchResults, setShowMatchResults] = useState(false);
  const [clientPreferences, setClientPreferences] = useState<ClientPreferences | null>(null);

  // Fetch therapists from Supabase
  useEffect(() => {
    async function fetchTherapists() {
      setLoading(true);
      try {
        const data = await getTherapists();
        setTherapists(data);
      } catch (error) {
        console.error('Error fetching therapists:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTherapists();
  }, []);

  // Get unique specializations for filtering
  const allSpecializations = useMemo(() => {
    const specs = new Set<string>();
    therapists.forEach(therapist => {
      therapist.therapy_styles.forEach(spec => specs.add(spec));
    });
    return Array.from(specs);
  }, [therapists]);

  // Filter and sort therapists
  const filteredTherapists = useMemo(() => {
    let filtered = therapists.filter(therapist => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        therapist.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (therapist.bio && therapist.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
        therapist.therapy_styles.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Specialty filter
      const matchesSpecialty = selectedSpecialties.length === 0 ||
        selectedSpecialties.some(spec => 
          therapist.therapy_styles.includes(spec)
        );

      // Rating filter
      const matchesRating = (therapist.rating || 0) >= minRating;

      return matchesSearch && matchesSpecialty && matchesRating;
    });

    // Sort therapists
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price":
          return parseFloat(a.price_per_session || "0") - parseFloat(b.price_per_session || "0");
        case "name":
          return a.full_name.localeCompare(b.full_name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [therapists, searchQuery, selectedSpecialties, sortBy, minRating]);

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  // Calculate active filters count
  const activeFiltersCount = selectedSpecialties.length + (minRating > 0 ? 1 : 0) + (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSpecialties([]);
    setMinRating(0);
  };

  // AI Matchmaking handlers
  const handlePreferencesSubmit = async (preferences: ClientPreferences) => {
    setMatchmakingLoading(true);
    setClientPreferences(preferences);

    try {
      const matchResults = await matchClientWithTherapists({
        clientPreferences: preferences,
        therapists,
        maxResults: 3
      });

      setMatches(matchResults);
      setShowMatchResults(true);
    } catch (error) {
      console.error('Matchmaking error:', error);
      // Still show results with fallback matching
      setShowMatchResults(true);
    } finally {
      setMatchmakingLoading(false);
    }
  };

  const handleRetry = () => {
    setShowMatchResults(false);
    setMatches([]);
    setClientPreferences(null);
  };

  const handleBookSession = (therapistId: string) => {
    // Navigate to booking page
    window.location.href = `/purchase/session-${therapistId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 glass rounded-full flex items-center justify-center mb-4 border-glow animate-pulse">
              <Search className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Loading therapists...
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-900/20 via-background to-blue-900/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Therapist <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Marketplace</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                {filteredTherapists.length} verified therapists available
              </p>
            </div>
            
            <Badge variant="outline" className="glass border-glow animate-pulse">
              <Shield className="w-3 h-3 mr-1 text-purple-400" />
              All Verified
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Collapsible Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar and Filter Toggle */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search therapists by name, specialization, or approach..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg border-glow"
              />
            </div>
            
            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="h-12 px-4 border-glow hover:glow-purple transition-all duration-300"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-2 py-0 text-xs bg-purple-500/20 text-purple-300">
                  {activeFiltersCount}
                </Badge>
              )}
              {filtersExpanded ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>

          {/* Collapsible Filters Panel */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            filtersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="glass rounded-lg border-glow p-6 space-y-6">
              {/* Sort and Rating Row */}
              <div className="flex flex-wrap items-center gap-6">
                {/* Sort Options */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Sort:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={sortBy === "rating" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("rating")}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Rating
                    </Button>
                    <Button
                      variant={sortBy === "name" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("name")}
                    >
                      Name
                    </Button>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Min Rating:</span>
                  <div className="flex gap-2">
                    {[0, 4, 4.5].map(rating => (
                      <Button
                        key={rating}
                        variant={minRating === rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMinRating(rating)}
                      >
                        {rating === 0 ? "All" : `${rating}+`}
                        <Star className="w-3 h-3 ml-1" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Specializations:</h4>
                <div className="flex flex-wrap gap-2">
                  {allSpecializations.map(specialty => (
                    <Badge
                      key={specialty}
                      variant={selectedSpecialties.includes(specialty) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleSpecialty(specialty)}
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Active Filters & Clear All */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Active:</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{searchQuery.slice(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
                      </Badge>
                    )}
                    {selectedSpecialties.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedSpecialties.length} specialization{selectedSpecialties.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {minRating > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {minRating}+ rating
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Available Therapists ({filteredTherapists.length})
            </h2>
            
            {filteredTherapists.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Starting from <span className="font-semibold text-green-400">5.00 SUI</span> per 30min session
              </div>
            )}
          </div>

          {/* Therapist Grid */}
          {filteredTherapists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTherapists.map((therapist) => (
                <TherapistCard
                  key={therapist.id}
                  therapist={therapist}
                  onBookSession={() => {
                    // Navigate to wallet-based booking page
                    window.location.href = `/marketplace/${therapist.id}`;
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 glass rounded-full flex items-center justify-center mb-4 border-glow">
                <Search className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No therapists found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSpecialties([]);
                  setMinRating(0);
                }}
                variant="outline"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="mt-16 glass rounded-2xl p-8 border-glow hover:glow-purple transition-all duration-300">
          <h3 className="text-lg font-semibold text-foreground mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Marketplace Stats
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center glass p-4 rounded-lg border-glow hover:glow-purple transition-all duration-300">
              <div className="text-2xl font-bold text-purple-400">{therapists.length}</div>
              <div className="text-sm text-muted-foreground">Verified Therapists</div>
            </div>
            <div className="text-center glass p-4 rounded-lg border-glow hover:glow-blue transition-all duration-300">
              <div className="text-2xl font-bold text-blue-400">
                {therapists.length > 0 
                  ? (therapists.reduce((sum, t) => sum + (t.rating || 0), 0) / therapists.length).toFixed(1)
                  : '0.0'
                }
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div className="text-center glass p-4 rounded-lg border-glow hover:glow-green transition-all duration-300">
              <div className="text-2xl font-bold text-green-400">5.00 SUI</div>
              <div className="text-sm text-muted-foreground">Per 30min Session</div>
            </div>
          </div>
        </div>

        {/* AI Matchmaking Section */}
        <div className="mt-16 glass rounded-2xl p-8 border-glow hover:glow-purple transition-all duration-300">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              <h3 className="text-2xl font-bold text-foreground">
                AI <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Matchmaking</span>
              </h3>
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Can't decide? Let our AI find your perfect therapist match based on your preferences, 
              therapy goals, and emotional state. Get personalized recommendations in seconds.
            </p>
          </div>

          {!showMatchResults ? (
            <ClientPreferencesForm
              onPreferencesSubmit={handlePreferencesSubmit}
              loading={matchmakingLoading}
            />
          ) : (
            <AIMatchResults
              matches={matches}
              therapists={therapists}
              onBookSession={handleBookSession}
              onRetry={handleRetry}
              loading={matchmakingLoading}
            />
          )}

          {/* How AI Matchmaking Works */}
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-lg font-semibold text-foreground mb-6 text-center">
              How AI Matchmaking Works
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center glass p-4 rounded-lg border-glow">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <h5 className="font-semibold mb-2">Smart Analysis</h5>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes your preferences, therapy goals, and emotional state
                </p>
              </div>
              <div className="text-center glass p-4 rounded-lg border-glow">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <h5 className="font-semibold mb-2">Compatibility Scoring</h5>
                <p className="text-sm text-muted-foreground">
                  Matches therapists based on vibe, language, specialty, and budget fit
                </p>
              </div>
              <div className="text-center glass p-4 rounded-lg border-glow">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-green-400" />
                </div>
                <h5 className="font-semibold mb-2">Personalized Results</h5>
                <p className="text-sm text-muted-foreground">
                  Get detailed compatibility breakdowns and reasoning for each match
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}