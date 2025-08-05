"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TherapistCard } from "@/components/therapy/TherapistCard";
import { VibeTag } from "@/components/therapy/VibeTag";
import { mockTherapistsWithProfiles, mockTags } from "@/data/mockData";
import { Search, Filter, Star, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"rating" | "price" | "name">("rating");
  const [minRating, setMinRating] = useState(0);

  // Get unique specializations for filtering
  const allSpecializations = useMemo(() => {
    const specs = new Set<string>();
    mockTherapistsWithProfiles.forEach(therapist => {
      therapist.profile.specializations.forEach(spec => specs.add(spec));
    });
    return Array.from(specs);
  }, []);

  // Filter and sort therapists
  const filteredTherapists = useMemo(() => {
    let filtered = mockTherapistsWithProfiles.filter(therapist => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        therapist.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        therapist.profile.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        therapist.profile.specializations.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Specialty filter
      const matchesSpecialty = selectedSpecialties.length === 0 ||
        selectedSpecialties.some(spec => 
          therapist.profile.specializations.includes(spec)
        );

      // Rating filter
      const matchesRating = therapist.profile.rating >= minRating;

      return matchesSearch && matchesSpecialty && matchesRating;
    });

    // Sort therapists
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.profile.rating - a.profile.rating;
        case "price":
          return 5 - 5; // All sessions are $5, so no sorting needed
        case "name":
          return a.alias.localeCompare(b.alias);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedSpecialties, sortBy, minRating]);

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

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
        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search therapists by name, specialization, or approach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg border-glow"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-foreground">
                Filters:
              </span>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
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

            {/* Rating Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Min Rating:</span>
              <div className="flex gap-1">
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

          {/* Specialization Filters */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Filter by Specialization:
            </h3>
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

          {/* Active Filters Display */}
          {(selectedSpecialties.length > 0 || minRating > 0 || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 p-4 glass rounded-lg border-glow">
              <span className="text-sm font-medium text-foreground">
                Active filters:
              </span>
              
              {searchQuery && (
                <Badge variant="secondary">
                  Search: "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              {selectedSpecialties.map(specialty => (
                <Badge key={specialty} variant="secondary">
                  {specialty}
                  <button 
                    onClick={() => toggleSpecialty(specialty)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              
              {minRating > 0 && (
                <Badge variant="secondary">
                  Rating: {minRating}+
                  <button 
                    onClick={() => setMinRating(0)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSpecialties([]);
                  setMinRating(0);
                }}
                className="ml-2"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Available Therapists ({filteredTherapists.length})
            </h2>
            
            {filteredTherapists.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Starting from <span className="font-semibold text-green-400">5.00 SUI</span> per 15min session
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
                    // Navigate to therapist profile or purchase page
                    window.location.href = `/purchase/session-${therapist.id}`;
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
              <div className="text-2xl font-bold text-purple-400">{mockTherapistsWithProfiles.length}</div>
              <div className="text-sm text-muted-foreground">Verified Therapists</div>
            </div>
            <div className="text-center glass p-4 rounded-lg border-glow hover:glow-blue transition-all duration-300">
              <div className="text-2xl font-bold text-blue-400">4.8</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div className="text-center glass p-4 rounded-lg border-glow hover:glow-green transition-all duration-300">
              <div className="text-2xl font-bold text-green-400">5.00 SUI</div>
              <div className="text-sm text-muted-foreground">Per 15min Session</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}