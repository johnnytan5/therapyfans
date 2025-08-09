"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VibeTag } from "./VibeTag";
import { TherapistWithSpecializations } from "@/lib/therapistService";
import { Star, Shield, Clock } from "lucide-react";
import { createBlurredAvatar, formatSui } from "@/lib/utils";
import { getDisplayName, formatPrice } from "@/lib/therapistService";

interface TherapistCardProps {
  therapist: TherapistWithSpecializations;
  onBookSession?: () => void;
  compact?: boolean;
}

export function TherapistCard({ therapist, onBookSession, compact = false }: TherapistCardProps) {
  const displayName = getDisplayName(therapist.full_name);
  const price = formatPrice(therapist.price_per_session);
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-500 border-0 glass border-glow hover:glow-purple scale-in hover:scale-[1.02] hover:-translate-y-1">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {/* Enhanced Blurred Avatar for Privacy */}
          <div className="relative">
            <div 
              className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 via-blue-500 to-cyan-400 blur-sm opacity-75 group-hover:opacity-90 transition-all duration-300"
              style={{
                backgroundImage: `url(${createBlurredAvatar(therapist.id)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-purple-400/50 transition-colors duration-300" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/10 to-blue-500/10 group-hover:from-purple-400/20 group-hover:to-blue-500/20 transition-all duration-300" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:from-purple-300 group-hover:to-cyan-300 transition-all duration-300">{displayName}</h3>
              {therapist.is_verified && (
                <Badge variant="verified" className="gap-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-300 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300">
                  <Shield className="w-3 h-3" />
                  Verified
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{therapist.rating || 0}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>30min sessions</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {!compact && therapist.bio && (
          <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed">
            {therapist.bio}
          </p>
        )}
        
        {/* Specializations */}
        {therapist.specializations && therapist.specializations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-purple-400"></div>
              Specializations
            </h4>
            <div className="flex flex-wrap gap-2">
              {therapist.specializations.slice(0, compact ? 2 : 4).map((spec) => (
                <VibeTag key={spec} tag={spec} variant="outline" />
              ))}
              {therapist.specializations.length > (compact ? 2 : 4) && (
                <Badge variant="outline" className="text-xs hover:bg-primary/10 transition-colors duration-200">
                  +{therapist.specializations.length - (compact ? 2 : 4)} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Therapy Styles */}
        {therapist.therapy_styles && therapist.therapy_styles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
              Therapy Styles
            </h4>
            <div className="flex flex-wrap gap-2">
              {therapist.therapy_styles.slice(0, 3).map((style) => (
                <VibeTag key={style} tag={style} />
              ))}
            </div>
          </div>
        )}
        
        {/* Languages */}
        {therapist.languages_spoken && therapist.languages_spoken.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-green-400"></div>
              Languages
            </h4>
            <div className="flex flex-wrap gap-2">
              {therapist.languages_spoken.slice(0, 3).map((language) => (
                <VibeTag key={language} tag={language} />
              ))}
            </div>
          </div>
        )}
        
        {/* Book Session */}
        <div className="pt-4 border-t border-gradient-to-r from-purple-500/20 via-border to-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground/70 uppercase tracking-wide">
                30min session
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {formatSui(parseFloat(price))}
                </span>
                <span className="text-xs text-muted-foreground/60">SUI</span>
              </div>
            </div>
            <Button 
              onClick={onBookSession}
              size="sm"
              variant="gradient"
              className="group-hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 px-6"
            >
              Book Session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}