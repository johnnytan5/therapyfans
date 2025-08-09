'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { uploadVerificationDocuments, upsertTherapistByWallet } from '@/lib/therapistOnboardingService';
import { supabase } from '@/lib/supabase';
import { CheckCircle, X, ArrowRight } from 'lucide-react';

export default function TherapistOnboardingPage() {
  const account = useCurrentAccount();
  const walletAddress = account?.address || '';

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  // Expect input as: "Qualification, University Name" and store as [qual, university]
  const [qualificationInput, setQualificationInput] = useState('');
  const [years, setYears] = useState<number | ''>('');
  const [pricePerSession, setPricePerSession] = useState<string>('5.00');
  const [therapyStyles, setTherapyStyles] = useState<string>('');
  const [languagesSpoken, setLanguagesSpoken] = useState<string>('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [availableSpecializations, setAvailableSpecializations] = useState<{id: string, name: string}[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingSpecializations, setLoadingSpecializations] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [therapistId, setTherapistId] = useState<string | null>(null);

  // Fetch available specializations from Supabase
  useEffect(() => {
    async function fetchSpecializations() {
      try {
        const { data, error } = await supabase
          .from('specializations')
          .select('id, name')
          .order('name');
        
        if (error) {
          console.error('Error fetching specializations:', error);
          setStatus('Failed to load specializations');
        } else {
          setAvailableSpecializations(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setStatus('Failed to load specializations');
      } finally {
        setLoadingSpecializations(false);
      }
    }
    
    fetchSpecializations();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    setFiles(Array.from(list));
  };

  const toggleSpecialization = (specName: string) => {
    setSelectedSpecializations(prev => 
      prev.includes(specName) 
        ? prev.filter(s => s !== specName)
        : [...prev, specName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      setStatus('Please connect a wallet first.');
      return;
    }
    if (!fullName || !licenseNumber) {
      setStatus('Full name and license number are required.');
      return;
    }

    try {
      setSubmitting(true);
      setStatus('Uploading documents...');
      const uploads = await uploadVerificationDocuments(walletAddress, files);
      const documentUrls = uploads.map((u) => u.publicUrl).filter(Boolean) as string[];

      setStatus('Saving profile...');
      const result: { success: boolean; error?: string; therapist_id?: string } = await upsertTherapistByWallet(
        {
          wallet_address: walletAddress,
          full_name: fullName,
          bio: bio || undefined,
          qualifications: qualificationInput
            ? qualificationInput
                .split(',')
                .slice(0, 2)
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
          license_number: licenseNumber,
          years_of_experience: typeof years === 'number' ? years : undefined,
          therapy_styles: therapyStyles
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          languages_spoken: languagesSpoken
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          specialisation: selectedSpecializations,
          price_per_session: pricePerSession || undefined,
        },
        documentUrls
      );

      if (!result.success) {
        setStatus(`Failed to save: ${result.error}`);
        return;
      }

      setStatus('Submitted! We will verify your documents shortly.');
      setTherapistId(result.therapist_id || null);
      
      // Show beautiful success modal
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 500);
    } catch (err: any) {
      setStatus(err?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Therapist Onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm mb-2">Connected Wallet</label>
                <Input value={walletAddress ? `${walletAddress}` : 'Not connected'} readOnly />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Full name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Dr. Jane Doe, LCSW" />
                </div>
                <div>
                  <label className="block text-sm mb-2">License number</label>
                  <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. CA 123456" />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Qualification</label>
                <Input
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  placeholder="e.g. LMFT, Stanford University"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Years of experience</label>
                  <Input
                    type="number"
                    min={0}
                    value={years}
                    onChange={(e) => setYears(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Price per 15-min session (SUI)</label>
                  <Input value={pricePerSession} onChange={(e) => setPricePerSession(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Therapy styles (comma-separated)</label>
                  <Input
                    value={therapyStyles}
                    onChange={(e) => setTherapyStyles(e.target.value)}
                    placeholder="e.g. CBT, Mindfulness, EMDR"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Languages spoken (comma-separated)</label>
                  <Input
                    value={languagesSpoken}
                    onChange={(e) => setLanguagesSpoken(e.target.value)}
                    placeholder="e.g. English, Spanish"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Specializations {loadingSpecializations ? '(Loading...)' : `(${selectedSpecializations.length} selected)`}
                </label>
                {loadingSpecializations ? (
                  <div className="p-4 border border-border rounded-lg bg-muted">
                    Loading specializations...
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 bg-background">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableSpecializations.map((spec) => (
                        <div
                          key={spec.id}
                          onClick={() => toggleSpecialization(spec.name)}
                          className={`cursor-pointer p-2 rounded-md text-sm transition-colors ${
                            selectedSpecializations.includes(spec.name)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          {spec.name}
                        </div>
                      ))}
                    </div>
                    {selectedSpecializations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Selected:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedSpecializations.map((spec) => (
                            <Badge
                              key={spec}
                              variant="secondary"
                              className="text-xs cursor-pointer"
                              onClick={() => toggleSpecialization(spec)}
                            >
                              {spec} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2">Bio</label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief description of your practice" />
              </div>

              <div>
                <label className="block text-sm mb-2">Upload verification documents (license, ID, certifications)</label>
                <Input type="file" multiple onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, or JPG. Max ~5MB each.</p>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting || !walletAddress || !fullName || !licenseNumber}>
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </Button>
                {status && <span className="text-sm text-muted-foreground">{status}</span>}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Application Submitted!</h3>
                    <p className="text-white/90 text-sm">Successfully created your therapist profile</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="text-center space-y-3">
                  <div className="text-3xl">🎉</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Welcome to TherapyFans!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    Your therapist profile has been created and is now pending verification. 
                    Our team will review your documents and credentials shortly.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What happens next?</h5>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Document verification (24-48 hours)</li>
                    <li>• Email notification once approved</li>
                    <li>• Profile goes live on marketplace</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setShowSuccessModal(false);
                      if (therapistId) {
                        window.location.href = `/therapist/${therapistId}`;
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    View My Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSuccessModal(false);
                      window.location.href = '/';
                    }}
                    className="flex-1"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



