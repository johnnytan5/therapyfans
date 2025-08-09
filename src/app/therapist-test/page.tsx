'use client';

import { X, ExternalLink, Copy, CheckCircle, Zap, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PACKAGE_ID = "0x7dee12dcb0e9afc507ef32e7741f18009f30ffbabe9fabdf53c2a4331793a76e";
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

export default function TherapistTestPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [therapistNfts, setTherapistNfts] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastMintedNftId, setLastMintedNftId] = useState<string>('');
  const [lastMintData, setLastMintData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Add this helper function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  // NFT mint form state
  const [nftForm, setNftForm] = useState({
    name: "Dr. Michael Chen",
    specialization: "ADHD, Autism, Child Psychology",
    credentials: "PhD Clinical Psychology, Board Certified",
    yearsExperience: "12",
    bio: "Specializing in neurodevelopmental disorders and family therapy with a focus on evidence-based interventions.",
    sessionTypes: "Individual, Family, Child",
    languages: "English, Mandarin, Cantonese",
    rating: "98",
    totalSessions: "567",
    profileImageUrl: "https://example.com/michael-chen.jpg",
    certificationUrl: "https://example.com/chen-cert.pdf"
  });

  // Available time slots state
  const [availableSlots, setAvailableSlots] = useState([
    { date: '2025-08-15', time: '09:00', duration: 60, available: true },
    { date: '2025-08-15', time: '10:30', duration: 30, available: true },
    { date: '2025-08-15', time: '14:00', duration: 60, available: true },
    { date: '2025-08-16', time: '10:00', duration: 30, available: true },
    { date: '2025-08-16', time: '15:30', duration: 60, available: true },
  ]);

  const [newSlot, setNewSlot] = useState({
    date: '',
    time: '',
    duration: 60
  });

  const startLoading = (key: string) => setLoading(prev => ({ ...prev, [key]: true }));
  const endLoading = (key: string) => setLoading(prev => ({ ...prev, [key]: false }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNftForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSlotChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewSlot(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // NEW: Sponsored NFT Minting
  const mintTherapistNftSponsored = async () => {
    if (!account) return;
    startLoading("mintNftSponsored");
    setError(null);

    try {
      const yearsExp = parseInt(nftForm.yearsExperience);
      const rating = parseInt(nftForm.rating);
      const totalSessions = parseInt(nftForm.totalSessions);

      // Validation
      if (isNaN(yearsExp) || yearsExp < 1 || yearsExp > 50) {
        setError("Years of experience must be between 1 and 50");
        endLoading("mintNftSponsored");
        return;
      }

      if (isNaN(rating) || rating < 0 || rating > 100) {
        setError("Rating must be between 0 and 100");
        endLoading("mintNftSponsored");
        return;
      }

      if (isNaN(totalSessions) || totalSessions < 0) {
        setError("Total sessions must be a positive number");
        endLoading("mintNftSponsored");
        return;
      }

      console.log("Requesting sponsored NFT minting...");

      const res = await fetch("/api/sponsor-mint", {
        method: "POST",
        body: JSON.stringify({
          userAddress: account.address,
          packageId: PACKAGE_ID,
          name: nftForm.name,
          specialization: nftForm.specialization,
          credentials: nftForm.credentials,
          yearsExperience: yearsExp,
          bio: nftForm.bio,
          sessionTypes: nftForm.sessionTypes,
          languages: nftForm.languages,
          rating: rating,
          totalSessions: totalSessions,
          profileImageUrl: nftForm.profileImageUrl,
          certificationUrl: nftForm.certificationUrl
        }),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      console.log("Sponsored mint response:", data);

      if (!res.ok) {
        throw new Error(data.error || `Backend error: ${res.status}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        console.log("NFT minted with sponsored gas:", data);

        setLastMintedNftId(data.transactionDigest);
        setLastMintData({
          ...data,
          gasSponsored: true,
          nftId: data.nftId
        });

        setSuccess("Therapist NFT minted successfully with sponsored gas!");
        setShowSuccessModal(true);

        // Refresh NFTs list
        setTimeout(() => {
          fetchTherapistNfts();
        }, 3000);

        endLoading("mintNftSponsored");
      } else {
        throw new Error("Unexpected response from sponsor service");
      }

    } catch (e: any) {
      console.error("Error in sponsored NFT minting:", e);
      setError(`Error minting sponsored NFT: ${e.message}`);
      endLoading("mintNftSponsored");
    }
  };

  // EXISTING: Regular NFT Minting (user pays gas)
  const mintTherapistNft = async () => {
    if (!account) return;
    startLoading("mintNft");
    setError(null);

    try {
      const yearsExp = parseInt(nftForm.yearsExperience);
      const rating = parseInt(nftForm.rating);
      const totalSessions = parseInt(nftForm.totalSessions);

      // Validation
      if (isNaN(yearsExp) || yearsExp < 1 || yearsExp > 50) {
        setError("Years of experience must be between 1 and 50");
        endLoading("mintNft");
        return;
      }

      if (isNaN(rating) || rating < 0 || rating > 100) {
        setError("Rating must be between 0 and 100");
        endLoading("mintNft");
        return;
      }

      if (isNaN(totalSessions) || totalSessions < 0) {
        setError("Total sessions must be a positive number");
        endLoading("mintNft");
        return;
      }

      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::therapist_nft::mint`,
        arguments: [
            tx.pure.string(nftForm.name),
            tx.pure.string(nftForm.specialization),
            tx.pure.string(nftForm.credentials),
            tx.pure.u64(yearsExp),        
            tx.pure.string(nftForm.bio),
            tx.pure.string(nftForm.sessionTypes),
            tx.pure.string(nftForm.languages),
            tx.pure.u64(rating),          
            tx.pure.u64(totalSessions),   
            tx.pure.string(nftForm.profileImageUrl),
            tx.pure.string(nftForm.certificationUrl)
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result: any) => {
            console.log("NFT minted successfully:", result);
            
            setLastMintedNftId(result.digest);
            setLastMintData({
              transactionDigest: result.digest,
              gasSponsored: false,
              nftId: "Check transaction for details"
            });
            
            setSuccess("Therapist NFT minted successfully!");
            setShowSuccessModal(true);
            endLoading("mintNft");
            
            // Refresh NFTs list
            setTimeout(() => {
              fetchTherapistNfts();
            }, 2000);
          },
          onError: (error: any) => {
            console.error("Error minting NFT:", error);
            setError(`Error minting NFT: ${error.message}`);
            endLoading("mintNft");
          }
        }
      );

    } catch (e: any) {
      console.error("Error minting NFT:", e);
      setError(`Error minting NFT: ${e.message}`);
      endLoading("mintNft");
    }
  };

  // EXISTING: Fetch therapist NFTs
  const fetchTherapistNfts = async () => {
    if (!account?.address) return;
    
    startLoading("fetchNfts");
    setError(null);

    try {
      console.log("Fetching NFTs for address:", account.address);
      
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${PACKAGE_ID}::therapist_nft::TherapistNFT`
        },
        options: {
          showContent: true,
          showType: true,
        }
      });

      console.log("Found objects:", ownedObjects);

      const nfts = ownedObjects.data
        .filter(obj => obj.data?.content?.dataType === 'moveObject')
        .map(obj => {
          const fields = (obj.data?.content as any)?.fields;
          if (!fields) return null;

          return {
            id: obj.data?.objectId,
            name: fields.name ? new TextDecoder().decode(new Uint8Array(fields.name)) : 'Unknown',
            specialization: fields.specialization ? new TextDecoder().decode(new Uint8Array(fields.specialization)) : 'Unknown',
            credentials: fields.credentials ? new TextDecoder().decode(new Uint8Array(fields.credentials)) : 'Unknown',
            yearsExperience: fields.years_experience,
            bio: fields.bio ? new TextDecoder().decode(new Uint8Array(fields.bio)) : 'Unknown',
            sessionTypes: fields.session_types ? new TextDecoder().decode(new Uint8Array(fields.session_types)) : 'Unknown',
            languages: fields.languages ? new TextDecoder().decode(new Uint8Array(fields.languages)) : 'Unknown',
            rating: fields.rating,
            totalSessions: fields.total_sessions,
            profileImageUrl: fields.profile_image_url ? new TextDecoder().decode(new Uint8Array(fields.profile_image_url)) : '',
            certificationUrl: fields.certification_url ? new TextDecoder().decode(new Uint8Array(fields.certification_url)) : ''
          };
        })
        .filter(nft => nft !== null);

      console.log("Parsed NFTs:", nfts);
      setTherapistNfts(nfts);
      
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setError(`Error fetching NFTs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      endLoading("fetchNfts");
    }
  };

  // EXISTING: Time slot management functions
  const addTimeSlot = () => {
    if (!newSlot.date || !newSlot.time) {
      setError("Please select both date and time");
      return;
    }

    const slot = {
      date: newSlot.date,
      time: newSlot.time,
      duration: parseInt(newSlot.duration.toString()),
      available: true
    };

    setAvailableSlots(prev => [...prev, slot]);
    setNewSlot({ date: '', time: '', duration: 60 });
    setSuccess("Time slot added successfully!");
    
    console.log("Added slot:", slot);
  };

  const removeTimeSlot = (index: number) => {
    setAvailableSlots(prev => prev.filter((_, i) => i !== index));
    setSuccess("Time slot removed successfully!");
  };

  useEffect(() => {
    if (account) {
      fetchTherapistNfts();
    }
  }, [account]);

  if (!account) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Please connect your wallet to access therapist features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Therapist Dashboard</h1>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && !showSuccessModal && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Mint Therapist NFT Section - UPDATED */}
      <Card>
        <CardHeader>
          <CardTitle>Create Your Therapist Profile NFT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="name"
              placeholder="Full Name"
              value={nftForm.name}
              onChange={handleInputChange}
            />
            <Input
              name="specialization"
              placeholder="Specialization"
              value={nftForm.specialization}
              onChange={handleInputChange}
            />
            <Input
              name="credentials"
              placeholder="Credentials"
              value={nftForm.credentials}
              onChange={handleInputChange}
            />
            <Input
              name="yearsExperience"
              type="number"
              placeholder="Years of Experience"
              value={nftForm.yearsExperience}
              onChange={handleInputChange}
            />
            <Input
              name="sessionTypes"
              placeholder="Session Types"
              value={nftForm.sessionTypes}
              onChange={handleInputChange}
            />
            <Input
              name="languages"
              placeholder="Languages"
              value={nftForm.languages}
              onChange={handleInputChange}
            />
            <Input
              name="rating"
              type="number"
              placeholder="Rating (0-100)"
              value={nftForm.rating}
              onChange={handleInputChange}
            />
            <Input
              name="totalSessions"
              type="number"
              placeholder="Total Sessions Completed"
              value={nftForm.totalSessions}
              onChange={handleInputChange}
            />
          </div>
          
          <Textarea
            name="bio"
            placeholder="Professional Bio"
            value={nftForm.bio}
            onChange={handleInputChange}
            rows={3}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="profileImageUrl"
              placeholder="Profile Image URL"
              value={nftForm.profileImageUrl}
              onChange={handleInputChange}
            />
            <Input
              name="certificationUrl"
              placeholder="Certification URL"
              value={nftForm.certificationUrl}
              onChange={handleInputChange}
            />
          </div>

          {/* UPDATED: Dual minting options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sponsored Minting */}
            <div className="border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Zap className="w-4 h-4 mr-2 text-purple-400" />
                <h4 className="font-medium text-purple-300">Sponsored Minting</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Mint your NFT with sponsored gas - completely free for you!
              </p>
              <Button 
                onClick={mintTherapistNftSponsored} 
                disabled={loading.mintNftSponsored}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {loading.mintNftSponsored ? "Minting..." : "Mint with Sponsored Gas"}
              </Button>
            </div>

            {/* Regular Minting */}
            <div className="border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Wallet className="w-4 h-4 mr-2 text-blue-400" />
                <h4 className="font-medium text-blue-300">Regular Minting</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Mint your NFT using your own gas - traditional approach
              </p>
              <Button 
                onClick={mintTherapistNft} 
                disabled={loading.mintNft}
                variant="outline"
                className="w-full"
              >
                {loading.mintNft ? "Minting..." : "Mint with Own Gas"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UPDATED: Success Modal */}
      {showSuccessModal && lastMintData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-green-700">NFT Minted Successfully!</h2>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {lastMintData.gasSponsored && (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center text-purple-700">
                    <Zap className="w-4 h-4 mr-2" />
                    <span className="font-medium">Gas fees sponsored!</span>
                  </div>
                  <p className="text-sm text-purple-600 mt-1">
                    This NFT mint was completely free for you.
                  </p>
                </div>
              )}

              {lastMintData.nftId && lastMintData.nftId !== "Check transaction for details" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NFT ID:
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate text-black">
                      {lastMintData.nftId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(lastMintData.nftId)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Digest:
                </label>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate text-black">
                    {lastMintedNftId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(lastMintedNftId)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => window.open(`https://suiscan.xyz/testnet/tx/${lastMintedNftId}`, '_blank')}
                  className="flex items-center space-x-2 flex-1"
                  variant="outline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Transaction</span>
                </Button>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>• Your NFT has been minted to your wallet</p>
                <p>• It may take a few moments to appear in your wallet</p>
                <p>• You can view the transaction details on SuiScan</p>
                {lastMintData.gasSponsored && <p>• Gas fees were sponsored by the platform</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXISTING: Time Slots and Current NFTs sections remain the same */}
      {/* Available Time Slots Management */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Available Time Slots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Slot */}
          <div className="grid grid-cols-4 gap-4">
            <Input
              name="date"
              type="date"
              value={newSlot.date}
              onChange={handleSlotChange}
            />
            <Input
              name="time"
              type="time"
              value={newSlot.time}
              onChange={handleSlotChange}
            />
            <select
              name="duration"
              value={newSlot.duration}
              onChange={handleSlotChange}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
            <Button onClick={addTimeSlot}>Add Slot</Button>
          </div>

          {/* Current Slots */}
          <div className="space-y-2">
            <h3 className="font-semibold">Current Available Slots:</h3>
            {availableSlots.length === 0 ? (
              <p className="text-gray-500">No available slots</p>
            ) : (
              <div className="grid gap-2">
                {availableSlots.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{slot.date}</span> at{' '}
                      <span className="font-medium">{slot.time}</span> ({slot.duration} min)
                      {!slot.available && <span className="text-red-500 ml-2">(Booked)</span>}
                    </div>
                    {slot.available && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTimeSlot(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current NFTs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Therapist NFTs</span>
            <Button 
              onClick={fetchTherapistNfts}
              disabled={loading.fetchNfts}
              variant="outline"
              size="sm"
            >
              {loading.fetchNfts ? "Loading..." : "Refresh"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading.fetchNfts ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Fetching your NFTs...</span>
            </div>
          ) : therapistNfts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No therapist NFTs found. Mint one above!</p>
          ) : (
            <div className="grid gap-4">
              {therapistNfts.map((nft, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{nft.name}</h3>
                    <button
                      onClick={() => window.open(`https://suiscan.xyz/testnet/object/${nft.id}`, '_blank')}
                      className="text-blue-500 hover:text-blue-700"
                      title="View on SuiScan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{nft.specialization}</p>
                  <p className="text-sm text-gray-600 mb-1">{nft.credentials}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Rating: {nft.rating}/100</span>
                    <span>Sessions: {nft.totalSessions}</span>
                    <span>Experience: {nft.yearsExperience} years</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-mono">{nft.id}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}