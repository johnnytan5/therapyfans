"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileNFTCardProps {
  imageUrl?: string;
  title: string;
  priceMist?: number | null;
  subtitle?: string;
  onClick?: () => void;
  footer?: React.ReactNode;
  placeholder?: boolean;
  metadata?: Record<string, any>;
}

function formatSuiPrice(mist?: number | null): string | null {
  if (mist == null) return null;
  const sui = mist / 1_000_000_000;
  if (!Number.isFinite(sui)) return null;
  return `${sui} SUI`;
}

function formatMetadata(metadata?: Record<string, any>): Array<{ key: string; label: string; value: string }> {
  if (!metadata) return [];
  
  const displayFields = [
    { key: 'specialization', label: 'Specialization' },
    { key: 'credentials', label: 'Credentials' },
    { key: 'years_experience', label: 'Experience' },
    { key: 'session_types', label: 'Session Types' },
    { key: 'languages', label: 'Languages' },
    { key: 'rating', label: 'Rating' },
    { key: 'total_sessions', label: 'Total Sessions' }
  ];

  return displayFields
    .map(({ key, label }) => {
      const value = metadata[key];
      if (!value) return null;
      
      let displayValue = value;
      if (key === 'years_experience') {
        displayValue = `${value} years`;
      } else if (key === 'rating') {
        displayValue = `${value}/100`;
      } else if (key === 'total_sessions') {
        displayValue = `${value} sessions`;
      }
      
      return { key, label, value: displayValue };
    })
    .filter(Boolean) as Array<{ key: string; label: string; value: string }>;
}

export const ProfileNFTCard: React.FC<ProfileNFTCardProps> = ({
  imageUrl,
  title,
  priceMist,
  subtitle,
  onClick,
  footer,
  placeholder,
  metadata,
}) => {
  const priceLabel = formatSuiPrice(priceMist);
  const metadataItems = formatMetadata(metadata);

  return (
    <div className="relative group w-full max-w-sm mx-auto">
      {/* Modern Card with Hexagonal Design Elements */}
      <Card 
        className={`
          relative overflow-hidden transition-all duration-500 ease-out
          ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1' : ''}
          ${placeholder ? 'opacity-70' : ''}
          bg-gradient-to-br from-gray-900 via-black to-purple-900 
          border-2 border-purple-500/20 hover:border-purple-400/40
          shadow-2xl hover:shadow-purple-500/20
        `}
        onClick={onClick}
        style={{
          borderRadius: '24px',
        }}
      >
        {/* Hexagonal Design Elements */}
        <div className="absolute top-4 left-4 w-8 h-8 bg-purple-500/20 transform rotate-45 rounded-sm"></div>
        <div className="absolute top-4 right-4 w-6 h-6 bg-pink-500/20 transform rotate-45 rounded-sm"></div>
        <div className="absolute bottom-4 left-6 w-4 h-4 bg-purple-400/30 transform rotate-45 rounded-sm"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20"></div>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse"
              style={{
                left: `${15 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Image Background */}
        {imageUrl && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-15 blur-sm"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-purple-900/50 to-black/70" />
          </div>
        )}

        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/5 rounded-3xl" />
        
        {/* Glowing Border Effect on Hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10" />

        <CardContent className="relative z-10 p-6 text-white min-h-fit">
          {/* Header Section */}
          <div className="space-y-4 mb-6">
            {/* Price Badge - Top Right */}
            <div className="flex justify-end">
              <Badge 
                className={`
                  ${priceLabel 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-black font-bold shadow-lg shadow-green-400/30' 
                    : 'bg-gray-700/80 text-gray-300 border border-gray-600'
                  } backdrop-blur-sm transition-all duration-300 hover:scale-110
                `}
              >
                {priceLabel ?? 'Not listed'}
              </Badge>
            </div>

            {/* Title and Subtitle */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-lg leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-purple-200/80 leading-relaxed px-2">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Metadata Section */}
          {metadataItems.length > 0 && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent flex-1" />
                <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-widest">
                  NFT Details
                </h4>
                <div className="h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent flex-1" />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {metadataItems.map(({ key, label, value }) => (
                  <div key={key} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-purple-500/20 backdrop-blur-sm hover:bg-white/10 transition-colors duration-200">
                    <span className="text-purple-300/90 font-medium text-sm">
                      {label}
                    </span>
                    <span className="text-white font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 rounded-full text-sm border border-purple-400/30">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          {footer && (
            <div className="pt-4 border-t border-purple-500/30">
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full border border-purple-400/30 text-sm text-purple-200 font-medium backdrop-blur-sm">
                  {footer}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Corner Decorative Elements */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-3xl" />
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-tr-3xl" />
      </Card>
    </div>
  );
};

export default ProfileNFTCard;
