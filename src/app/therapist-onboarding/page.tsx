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
import { CheckCircle, X, ArrowRight, Zap, Loader2, ExternalLink, Copy } from 'lucide-react';
import { PACKAGE_ID, getCurrentNetworkConfig } from '@/lib/suiConfig';


// add to env later
const THERAPIST_NFT_PACKAGE_ID = PACKAGE_ID;


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
  const [isLoadingBlockchain, setIsLoadingBlockchain] = useState(false);
  const [blockchainStep, setBlockchainStep] = useState<'idle' | 'kiosk' | 'nft' | 'complete'>('idle');
  const [transactionResults, setTransactionResults] = useState<{
    kioskTx?: string;
    nftTx?: string;
    kioskId?: string;
    nftId?: string;
  }>({});

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const createKioskWithSponsorship = async () => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch('/api/sponsor-kiosk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userAddress: walletAddress }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to create kiosk');
    }

    return response.json();
  };

const mintTherapistNftSponsored = async () => {
  if (!walletAddress || !fullName) {
    throw new Error('Missing required data for NFT minting');
  }

  // Add retry logic for object version conflicts
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      console.log(`Mint attempt ${retryCount + 1}/${maxRetries}...`);

      const response = await fetch('/api/sponsor-mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: walletAddress,
          packageId: THERAPIST_NFT_PACKAGE_ID,
          name: fullName,
          specialization: selectedSpecializations.join(', '),
          credentials: licenseNumber,
          yearsExperience: typeof years === 'number' ? years : 0,
          bio: bio || 'Professional therapist offering mental health services',
          sessionTypes: therapyStyles,
          languages: languagesSpoken,
          rating: 95,
          totalSessions: 0,
          profileImageUrl: 'https://example.com/therapist-nft-image.png',
          certificationUrl: 'https://example.com/default-cert.pdf',
          // Add retry info to help backend handle stale objects
          retryAttempt: retryCount,
          timestamp: Date.now()
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Backend error: ${response.status}`);
      }

      // Success - return the result
      console.log('NFT mint successful:', data);
      return data;

    } catch (error: any) {
      console.error(`Mint attempt ${retryCount + 1} failed:`, error.message);
      
      // Check if it's a version conflict error
      const isVersionConflict = error.message.includes('is not available for consumption') || 
                               error.message.includes('current version') ||
                               error.message.includes('Transaction validator signing failed');

      if (isVersionConflict && retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Retrying mint operation (attempt ${retryCount + 1}/${maxRetries}) after version conflict...`);
        // Wait progressively longer between retries
        await new Promise(resolve => setTimeout(resolve, 3000 * retryCount));
        continue;
      }

      // If it's not a version conflict or we've exhausted retries, throw the error
      throw error;
    }
  }

  throw new Error('Failed to mint NFT after maximum retry attempts');
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

      setStatus('Profile saved! Creating your blockchain assets...');
      setTherapistId(result.therapist_id || null);
      
      // Start blockchain operations
      setIsLoadingBlockchain(true);
      
      try {
        // Step 1: Create Kiosk
        setBlockchainStep('kiosk');
        setStatus('Creating your marketplace kiosk...');
        const kioskResult = await createKioskWithSponsorship();
        
        setTransactionResults(prev => ({
          ...prev,
          kioskTx: kioskResult.transactionDigest || kioskResult.txDigest, // Fixed field mapping
          kioskId: kioskResult.kioskId
        }));

        // Step 2: Mint Therapist NFT
        setBlockchainStep('nft');
        setStatus('Minting your therapist NFT...');
        const nftResult = await mintTherapistNftSponsored();
        
        setTransactionResults(prev => ({
          ...prev,
          nftTx: nftResult.transactionDigest || nftResult.txDigest, // Fixed field mapping
          nftId: nftResult.nftId || nftResult.objectId
        }));

        setBlockchainStep('complete');
        setStatus('Successfully completed onboarding with blockchain assets!');
        
        // Show success modal after short delay
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 500);

      } catch (blockchainError: any) {
        console.error('Blockchain operation failed:', blockchainError);
        setStatus(`Profile saved, but blockchain setup failed: ${blockchainError.message}`);
        setBlockchainStep('idle');
        // Still show success modal since profile was saved
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 500);
      } finally {
        setIsLoadingBlockchain(false);
      }
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
                  <label className="block text-sm mb-2">Price per 30-min session (SUI)</label>
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

              <div className="space-y-3">
                {/* Progress indicators during blockchain operations */}
                {isLoadingBlockchain && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 relative">
                        {blockchainStep === 'kiosk' ? (
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        ) : blockchainStep === 'complete' || transactionResults.kioskTx ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <span className={`text-sm ${blockchainStep === 'kiosk' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                        Creating marketplace kiosk...
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 relative">
                        {blockchainStep === 'nft' ? (
                          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                        ) : blockchainStep === 'complete' || transactionResults.nftTx ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <span className={`text-sm ${blockchainStep === 'nft' ? 'text-purple-600 font-medium' : 'text-gray-600'}`}>
                        Minting therapist NFT...
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Button 
                    type="submit" 
                    disabled={submitting || isLoadingBlockchain || !walletAddress || !fullName || !licenseNumber}
                    className="relative"
                  >
                    {submitting || isLoadingBlockchain ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {isLoadingBlockchain ? 'Creating Blockchain Assets...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Submit for Verification
                      </>
                    )}
                  </Button>
                  {status && <span className="text-sm text-muted-foreground">{status}</span>}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Success Modal with Blockchain Results */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
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
                    <p className="text-white/90 text-sm">
                      {blockchainStep === 'complete' 
                        ? 'Profile created with blockchain assets' 
                        : 'Successfully created your therapist profile'
                      }
                    </p>
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
                    {blockchainStep === 'complete' && ' Your blockchain assets are ready!'}
                  </p>
                </div>

                {/* Blockchain Results */}
                {(transactionResults.kioskTx || transactionResults.nftTx) && (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <h5 className="font-semibold text-purple-900 dark:text-purple-100">
                        Blockchain Assets Created
                      </h5>
                    </div>

                    {transactionResults.kioskTx && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Marketplace Kiosk
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 rounded p-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                            {transactionResults.kioskTx?.slice(0, 20)}...
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => copyToClipboard(transactionResults.kioskTx || '')}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={`https://suiscan.xyz/testnet/tx/${transactionResults.kioskTx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {transactionResults.nftTx && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Therapist NFT
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 rounded p-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                            {transactionResults.nftTx?.slice(0, 20)}...
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => copyToClipboard(transactionResults.nftTx || '')}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={`https://suiscan.xyz/testnet/tx/${transactionResults.nftTx}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      * Gas fees were sponsored by TherapyFans platform
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What happens next?</h5>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Document verification (24-48 hours)</li>
                    <li>• Email notification once approved</li>
                    <li>• Profile goes live on marketplace</li>
                    {blockchainStep === 'complete' && (
                      <li>• Your NFT and kiosk will be activated</li>
                    )}
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



