'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Shield, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TherapistProfilePageProps {
  params: {
    id: string;
  };
}

export default function TherapistProfilePage({ params }: TherapistProfilePageProps) {
  const account = useCurrentAccount();
  const [therapist, setTherapist] = useState<any>(null);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTherapistData() {
      try {
        const resolvedParams = await params;
        
        // Fetch therapist data
        const { data: therapistData, error: therapistError } = await supabase
          .from('therapists')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (therapistError) {
          setError('Therapist not found');
          return;
        }

        setTherapist(therapistData);

        // Fetch specializations
        const { data: specData, error: specError } = await supabase
          .from('therapist_specializations')
          .select(`
            specializations(name)
          `)
          .eq('therapist_id', resolvedParams.id);

        if (!specError && specData) {
          const specNames = specData
            .map((spec: any) => spec.specializations?.name)
            .filter(Boolean);
          setSpecializations(specNames);
        }
      } catch (err) {
        setError('Failed to load therapist profile');
      } finally {
        setLoading(false);
      }
    }

    fetchTherapistData();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Loading therapist profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !therapist) {
    return (
      <div className="min-h-screen py-10">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="text-center py-10">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild>
                <Link href="/therapist-onboarding">Go to Onboarding</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwner = account?.address === therapist.wallet_address;

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{therapist.full_name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {therapist.is_verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Verification
                      </Badge>
                    )}
                    {isOwner && (
                      <Badge variant="outline">Your Profile</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!therapist.is_verified && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Clock className="w-4 h-4" />
                    <h3 className="font-medium">Application Under Review</h3>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your therapist application is being reviewed. You'll be notified once verification is complete.
                  </p>
                </div>
              )}
              
              {therapist.bio && (
                <div>
                  <h3 className="font-medium mb-2">About</h3>
                  <p className="text-muted-foreground">{therapist.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">License Number</label>
                  <p>{therapist.license_number}</p>
                </div>
                
                {therapist.qualifications && Array.isArray(therapist.qualifications) && therapist.qualifications.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Qualifications</label>
                    <p>{therapist.qualifications.join(', ')}</p>
                  </div>
                )}
                
                {therapist.years_of_experience && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Years of Experience</label>
                    <p>{therapist.years_of_experience} years</p>
                  </div>
                )}
                
                {therapist.price_per_session && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Price per Session</label>
                    <p>{therapist.price_per_session} SUI</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Specializations & Styles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {specializations.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Specializations</label>
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((spec) => (
                        <Badge key={spec} variant="outline">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {therapist.therapy_styles && Array.isArray(therapist.therapy_styles) && therapist.therapy_styles.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Therapy Styles</label>
                    <div className="flex flex-wrap gap-2">
                      {therapist.therapy_styles.map((style: string) => (
                        <Badge key={style} variant="secondary">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {therapist.languages_spoken && Array.isArray(therapist.languages_spoken) && therapist.languages_spoken.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {therapist.languages_spoken.map((lang: string) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}