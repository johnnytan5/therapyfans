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
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 glass border-glow hover:glow-purple scale-in">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Blurred Avatar for Privacy */}
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 blur-sm opacity-70"
              style={{
                backgroundImage: `url(${createBlurredAvatar(therapist.id)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 rounded-full border-2 border-white/20" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{displayName}</h3>
              {therapist.is_verified && (
                <Badge variant="verified" className="gap-1">
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
                <span>15min sessions</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!compact && therapist.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {therapist.bio}
          </p>
        )}
        
        {/* Specializations */}
        {therapist.specializations && therapist.specializations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Specializations
            </h4>
            <div className="flex flex-wrap gap-1">
              {therapist.specializations.slice(0, compact ? 2 : 4).map((spec) => (
                <VibeTag key={spec} tag={spec} variant="outline" />
              ))}
              {therapist.specializations.length > (compact ? 2 : 4) && (
                <Badge variant="outline" className="text-xs">
                  +{therapist.specializations.length - (compact ? 2 : 4)} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Therapy Styles */}
        {therapist.therapy_styles && therapist.therapy_styles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Therapy Styles
            </h4>
            <div className="flex flex-wrap gap-1">
              {therapist.therapy_styles.slice(0, 3).map((style) => (
                <VibeTag key={style} tag={style} />
              ))}
            </div>
          </div>
        )}
        
        {/* Languages */}
        {therapist.languages_spoken && therapist.languages_spoken.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Languages
            </h4>
            <div className="flex flex-wrap gap-1">
              {therapist.languages_spoken.slice(0, 3).map((language) => (
                <VibeTag key={language} tag={language} />
              ))}
            </div>
          </div>
        )}
        
        {/* Book Session */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Starting at </span>
              <span className="font-semibold text-lg">{formatSui(parseFloat(price))}</span>
            </div>
            <Button 
              onClick={onBookSession}
              size="sm"
              variant="gradient"
              className="group-hover:scale-105 transition-transform"
            >
              Book Session
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}