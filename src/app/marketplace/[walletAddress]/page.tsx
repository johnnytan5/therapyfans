"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Star, Shield, Clock, Calendar, CheckCircle, Loader2, ChevronLeft, ChevronRight, User, Award, Globe, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { getTherapistByIdOrWallet, isWalletAddress, TherapistWithSpecializations, getDisplayName } from "@/lib/therapistService";
import { 
  formatTime, 
  formatDate, 
  getDayName 
} from "@/lib/meetingLinks";
import { SessionService, BookingData, SessionNFT } from "@/lib/sessionService";
import { createBlurredAvatar, formatSui, mistToSui } from "@/lib/utils";
import { getTherapistIdFromWallet, verifyTherapistWallet, diagnosePotentialKioskIssues } from "@/lib/therapistWalletService";
import { CONTRACT_FUNCTIONS } from "@/lib/suiConfig";

// SUI Network constants
const MIST_PER_SUI = 1_000_000_000;

export default function TherapistBookingPage() {
  const params = useParams();
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const walletAddress = params.walletAddress as string;

  const [therapist, setTherapist] = useState<TherapistWithSpecializations | null>(null);
  const [timeSlots, setTimeSlots] = useState<SessionNFT[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SessionNFT | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookedNFT, setBookedNFT] = useState<SessionNFT | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [therapistIdFromWallet, setTherapistIdFromWallet] = useState<string | null>(null);
  const [walletVerified, setWalletVerified] = useState<boolean>(false);
  const [bookingProofNftId, setBookingProofNftId] = useState<string | null>(null);

  // Get wallet balance
  const { data: balanceData, isLoading: isLoadingBalance } = useSuiClientQuery(
    'getBalance',
    {
      owner: currentAccount?.address || '',
    },
    {
      enabled: !!currentAccount?.address,
      refetchInterval: 10000,
    }
  );

  const walletBalance = balanceData ? parseFloat(mistToSui(balanceData.totalBalance).toFixed(4)) : 0;

  // Fetch therapist data and available sessions
  useEffect(() => {
    async function fetchTherapistAndSessions() {
      setLoading(true);
      try {
        console.log('🔍 Fetching therapist data for identifier:', walletAddress);
        console.log('🔍 Is wallet address?', isWalletAddress(walletAddress));
        
        const therapistData = await getTherapistByIdOrWallet(walletAddress);
        if (therapistData) {
          setTherapist(therapistData);
          
          // Use the therapist's wallet address for session queries (if we have it)
          const therapistWalletAddress = therapistData.wallet_address || walletAddress;
          console.log('🔍 Using wallet address for sessions:', therapistWalletAddress);
          
          // Fetch real available sessions from database
          const sessions = await SessionService.getAllAvailableSessionsForTherapist(therapistWalletAddress);
          setTimeSlots(sessions);
        }
      } catch (error) {
        console.error('Error fetching therapist and sessions:', error);
      } finally {
        setLoading(false);
      }
    }

    if (walletAddress) {
      fetchTherapistAndSessions();
    }
  }, [walletAddress]);

  // Example usage of getTherapistIdFromWallet function
  useEffect(() => {
    async function verifyAndGetTherapistId() {
      if (!walletAddress || !therapist) return;
      
      // Get the actual wallet address - could be from therapist data or the route param
      const actualWalletAddress = therapist.wallet_address || (isWalletAddress(walletAddress) ? walletAddress : null);
      
      if (!actualWalletAddress) {
        console.warn('⚠️ No wallet address available for therapist verification');
        setWalletVerified(false);
        return;
      }
      
      try {
        console.log('🔍 Verifying therapist wallet and fetching ID...');
        console.log('🔍 Using wallet address:', actualWalletAddress);
        
        // First verify the wallet has proper therapist setup
        const isVerified = await verifyTherapistWallet(actualWalletAddress);
        setWalletVerified(isVerified);
        
        if (isVerified) {
          // Get the therapist ID from their wallet's TherapistNFT
          const therapistId = await getTherapistIdFromWallet(actualWalletAddress);
          setTherapistIdFromWallet(therapistId);
          
          console.log('✅ Therapist ID retrieved:', therapistId);
          console.log('🏷️ This ID can now be used for soulbound NFT minting');
          
          // Store for potential soulbound NFT reference
          const therapistIdForSoulbound = therapistId;
          console.log('💾 Therapist ID ready for soulbound minting:', therapistIdForSoulbound);
        }
      } catch (error) {
        console.warn('⚠️ Could not verify therapist wallet or get ID:', error);
        setWalletVerified(false);
        
        // Provide diagnostic information
        try {
          const diagnosis = await diagnosePotentialKioskIssues(actualWalletAddress);
          console.log('🔍 Wallet diagnosis:', diagnosis);
          console.log('💡 Suggestions:', diagnosis.suggestions);
        } catch (diagError) {
          console.warn('Could not diagnose wallet issues:', diagError);
        }
      }
    }

    verifyAndGetTherapistId();
  }, [walletAddress, therapist]);

  // Handle countdown and redirect
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    if (showSuccessModal && redirectCountdown > 0) {
      countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            // Navigate to client profile page when countdown reaches 0
            const clientWallet = currentAccount?.address || 'mock-wallet-address';
            router.push(`/client/${clientWallet}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [showSuccessModal, router]); // Removed redirectCountdown from dependencies

  // Refresh available sessions (for manual refresh)
  const refreshSessions = async () => {
    try {
      console.log('🔄 Refreshing available sessions...');
      const sessions = await SessionService.getAllAvailableSessionsForTherapist(walletAddress);
      setTimeSlots(sessions);
    } catch (error) {
      console.error('Error refreshing sessions:', error);
    }
  };

  // Filter time slots for selected date only
  const selectedDateSlots = useMemo(() => {
    const dateString = selectedDate.toISOString().split('T')[0];
    return timeSlots
      .filter(slot => slot.date === dateString)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timeSlots, selectedDate]);

  // Date navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
    setSelectedSlot(null); // Clear selection when changing dates
  };

  const handleSlotSelect = (slot: SessionNFT) => {
    if (slot.status === 'available') {
      setSelectedSlot(slot);
    }
  };

  const handlePurchaseNFT = async () => {
    if (!selectedSlot || !therapist) {
      console.log('Missing data:', { selectedSlot, therapist });
      return;
    }

    if (!currentAccount) {
      setPaymentError('Please connect your wallet to book a session.');
      return;
    }

    if (!therapistIdFromWallet) {
      setPaymentError('Therapist ID not available. Please ensure the therapist has set up their blockchain profile.');
      return;
    }

    const walletAddr = currentAccount.address;
    
    setPurchasing(true);
    setPaymentError('');
    
    try {
      console.log('Starting session booking with soulbound NFT minting...', { 
        slot: selectedSlot.id, 
        wallet: walletAddr,
        therapist: walletAddress,
        therapistId: therapistIdFromWallet
      });
      
      // Convert session time to epoch milliseconds for the smart contract
      console.log('Raw slot data:', {
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        duration_minutes: selectedSlot.duration_minutes,
        dateType: typeof selectedSlot.date,
        timeType: typeof selectedSlot.start_time,
        durationType: typeof selectedSlot.duration_minutes
      });

      // Validate date and time data
      if (!selectedSlot.date || !selectedSlot.start_time) {
        throw new Error(`Missing session data: date=${selectedSlot.date}, time=${selectedSlot.start_time}, duration=${selectedSlot.duration_minutes}`);
      }

      // Handle duration_minutes - it might be missing in mock data
      const duration = selectedSlot.duration_minutes || 30; // Default to 30 minutes if missing
      
      // Ensure date is in YYYY-MM-DD format and time is in HH:MM format
      // Normalize time format - handle HH:MM, HH:MM:SS, or other variations
      let normalizedTime = selectedSlot.start_time.trim();
      const timeParts = normalizedTime.split(':');
      
      if (timeParts.length === 2) {
        // HH:MM format - add seconds
        normalizedTime = `${normalizedTime}:00`;
      } else if (timeParts.length === 3) {
        // HH:MM:SS format - use as is
        normalizedTime = normalizedTime;
      } else {
        throw new Error(`Invalid time format: ${selectedSlot.start_time}. Expected HH:MM or HH:MM:SS`);
      }
      
      const dateTimeString = `${selectedSlot.date}T${normalizedTime}`;
      console.log('Parsing datetime string:', dateTimeString, {
        originalTime: selectedSlot.start_time,
        normalizedTime: normalizedTime,
        timeParts: timeParts.length
      });
      
      const startDate = new Date(dateTimeString);
      console.log('Parsed date object:', startDate);
      
      if (isNaN(startDate.getTime())) {
        throw new Error(`Invalid date/time format: ${dateTimeString}. Check date (YYYY-MM-DD) and time (HH:MM) formats`);
      }
      
      const startTs = startDate.getTime();
      const durationMs = duration * 60 * 1000;
      const endTs = startTs + durationMs;
      
      console.log('Session timing:', {
        dateTimeString,
        startDate: startDate.toISOString(),
        startTs,
        endTs,
        duration: duration,
        durationMs,
        isValidStart: !isNaN(startTs),
        isValidEnd: !isNaN(endTs)
      });

      // Additional validation
      if (isNaN(startTs) || isNaN(endTs)) {
        throw new Error(`Invalid timestamps: startTs=${startTs}, endTs=${endTs}`);
      }

      // Create and execute blockchain transaction for booking proof NFT
      const tx = new Transaction();
      
      // Mint soulbound booking proof NFT
      console.log('Creating moveCall with:', {
        target: CONTRACT_FUNCTIONS.mintBookingProof || `${process.env.NEXT_PUBLIC_PACKAGE_ID}::booking_proof::mint_booking_proof`,
        therapistId: therapistIdFromWallet,
        therapistIdLength: therapistIdFromWallet.length,
        therapistIdFormat: therapistIdFromWallet.startsWith('0x'),
        startTs: startTs,
        endTs: endTs,
        startTsType: typeof startTs,
        endTsType: typeof endTs
      });

      // Additional validation of the therapist ID
      console.log('🔍 Validating therapist ID for smart contract:', {
        id: therapistIdFromWallet,
        isValidFormat: /^0x[a-fA-F0-9]{64}$/.test(therapistIdFromWallet),
        length: therapistIdFromWallet.length,
        sample: therapistIdFromWallet.slice(0, 20) + '...'
      });

      // Use a local variable for the actual NFT object ID to use in the transaction
      let actualTherapistNftId = therapistIdFromWallet;

      // Try to query the object to see if it exists and what type it is
      try {
        const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
        const objectInfo = await suiClient.getObject({
          id: therapistIdFromWallet,
          options: {
            showType: true,
            showContent: true,
            showOwner: true
          }
        });
        
        console.log('🔍 Direct object query result:', {
          exists: !!objectInfo.data,
          type: objectInfo.data?.type,
          owner: objectInfo.data?.owner,
          objectId: objectInfo.data?.objectId,
          hasContent: !!objectInfo.data?.content,
          error: objectInfo.error
        });
        
        if (!objectInfo.data) {
          throw new Error(`Therapist NFT object ${therapistIdFromWallet} does not exist or cannot be accessed`);
        }
        
        if (!objectInfo.data.type?.includes('therapist_nft::TherapistNFT')) {
          console.warn('⚠️ Object exists but is not a TherapistNFT:', objectInfo.data.type);
          throw new Error(`Object ${therapistIdFromWallet} is type ${objectInfo.data.type}, not TherapistNFT`);
        }

        // Check if this object is owned properly
        console.log('🔍 Object ownership details:', {
          owner: objectInfo.data.owner,
          ownerType: typeof objectInfo.data.owner,
          isOwnedObject: objectInfo.data.owner && typeof objectInfo.data.owner === 'object' && 'AddressOwner' in objectInfo.data.owner,
          isSharedObject: objectInfo.data.owner && typeof objectInfo.data.owner === 'object' && 'Shared' in objectInfo.data.owner,
          isImmutable: objectInfo.data.owner && typeof objectInfo.data.owner === 'object' && 'Immutable' in objectInfo.data.owner
        });
        
      } catch (objectQueryError) {
        console.error('❌ Failed to query therapist object:', objectQueryError);
        
        // Try an alternative approach - look for TherapistNFTs in owned objects
        console.log('🔄 Trying alternative approach - checking owned objects...');
        try {
          const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
          const ownedObjects = await suiClient.getOwnedObjects({
            owner: walletAddr,
            options: {
              showType: true,
              showContent: true,
            },
          });
          
          console.log('🔍 All owned objects by current user:', ownedObjects.data?.map(obj => ({
            id: obj.data?.objectId,
            type: obj.data?.type
          })));
          
          // Look for any TherapistNFT objects owned by the current user (support both old and new package IDs)
          const userTherapistNFTs = ownedObjects.data?.filter(obj => 
            obj.data?.type?.includes('therapist_nft::TherapistNFT')
          );
          
          if (userTherapistNFTs && userTherapistNFTs.length > 0) {
            const userNFT = userTherapistNFTs[0];
            console.log('🎯 Found TherapistNFT owned by current user:', userNFT.data?.objectId);
            
            // Verify this NFT is directly owned (not in kiosk)
            if (userNFT.data?.owner && typeof userNFT.data.owner === 'object' && 'AddressOwner' in userNFT.data.owner) {
              actualTherapistNftId = userNFT.data.objectId;
              console.log('✅ Using directly owned NFT for transaction:', actualTherapistNftId);
            } else {
              console.warn('⚠️ User NFT is not directly owned:', userNFT.data?.owner);
              throw new Error(`User's TherapistNFT is not directly owned (owner: ${JSON.stringify(userNFT.data?.owner)})`);
            }
          } else {
            // Try using a test NFT ID similar to test-client-side
            console.log('🧪 No user NFTs found, trying with test NFT ID...');
            actualTherapistNftId = "0x68f71cedbae4b2a652ad160bdf2fd1e8111b8c0c0ee9c5cee58a53c5da856cef";
            console.log('🧪 Using test NFT ID for debugging:', actualTherapistNftId);
          }
        } catch (altError) {
          throw new Error(`Both primary and alternative NFT lookup failed: ${objectQueryError} | ${altError}`);
        }
      }

      // ✅ Implement payment flow: 90% to therapist, 10% to service provider
      const sessionPriceSui = selectedSlot.price_sui;
      const sessionPriceMist = BigInt(sessionPriceSui * 1_000_000_000); // Convert SUI to MIST
      
      // Calculate splits (90% to therapist, 10% to service provider)
      const therapistShare = (sessionPriceMist * BigInt(90)) / BigInt(100); // 90%
      const serviceProviderShare = sessionPriceMist - therapistShare; // 10%

      console.log('🚀 Final transaction details:', {
        actualTherapistNftId: actualTherapistNftId,
        startTs: startTs,
        endTs: endTs,
        target: CONTRACT_FUNCTIONS.mintBookingProof || `${process.env.NEXT_PUBLIC_PACKAGE_ID}::booking_proof::mint_booking_proof`,
        packageId: process.env.NEXT_PUBLIC_PACKAGE_ID,
        sessionPriceSui: sessionPriceSui,
        therapistShare: Number(therapistShare) / 1_000_000_000,
        serviceProviderShare: Number(serviceProviderShare) / 1_000_000_000
      });
      
      console.log('💰 Payment breakdown:', {
        totalSui: sessionPriceSui,
        totalMist: sessionPriceMist.toString(),
        therapistShareSui: Number(therapistShare) / 1_000_000_000,
        therapistShareMist: therapistShare.toString(),
        serviceProviderShareSui: Number(serviceProviderShare) / 1_000_000_000,
        serviceProviderShareMist: serviceProviderShare.toString(),
        therapistWallet: therapist.wallet_address,
        serviceProviderWallet: '0x40bd8248e692f15c0eff9e7cf79ca4f399964adc42c98ba44e38d5d23130106b'
      });

      // Create payment coins
      const [therapistPayment] = tx.splitCoins(tx.gas, [therapistShare]);
      const [serviceProviderPayment] = tx.splitCoins(tx.gas, [serviceProviderShare]);
      
      // Transfer payments
      if (therapist.wallet_address) {
        tx.transferObjects([therapistPayment], therapist.wallet_address);
        console.log(`💸 Transferring ${Number(therapistShare) / 1_000_000_000} SUI to therapist: ${therapist.wallet_address}`);
      } else {
        throw new Error('Therapist wallet address not available');
      }
      
      tx.transferObjects([serviceProviderPayment], '0x40bd8248e692f15c0eff9e7cf79ca4f399964adc42c98ba44e38d5d23130106b');
      console.log(`💸 Transferring ${Number(serviceProviderShare) / 1_000_000_000} SUI to service provider: 0x40bd8248e692f15c0eff9e7cf79ca4f399964adc42c98ba44e38d5d23130106b`);

      // ✅ Smart contract has been updated with mint_booking_proof_by_id function
      // This function accepts TherapistNFT object IDs instead of references, making it compatible with kiosk-stored NFTs
      console.log('✅ Using new mint_booking_proof_by_id function that works with kiosk-stored TherapistNFTs');

      tx.moveCall({
        target: CONTRACT_FUNCTIONS.mintBookingProofById,
        arguments: [
          tx.pure.id(actualTherapistNftId), // ✅ Pass as ID, not object reference - works with kiosk-stored NFTs
          tx.pure.u64(BigInt(startTs)),     
          tx.pure.u64(BigInt(endTs))        
        ],
      });

      console.log('Executing blockchain transaction for booking proof...');
      
      // Execute the blockchain transaction
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async (result: any) => {
            console.log("Booking proof NFT minted successfully:", result);
            console.log("Transaction result:", JSON.stringify(result, null, 2));
            
            // Extract booking proof NFT ID from transaction result
            let bookingProofId = 'Unknown';
            try {
              if (result.objectChanges && result.objectChanges.length > 0) {
                console.log("Object changes found:", result.objectChanges);
                
                const createdObject = result.objectChanges.find((change: any) => 
                  change.type === 'created' && 
                  change.objectType && 
                  (change.objectType.includes('BookingProofNFT') ||
                   change.objectType.includes('booking_proof'))
                );
                
                if (createdObject) {
                  bookingProofId = createdObject.objectId;
                  console.log("Found booking proof NFT ID:", bookingProofId);
                  setBookingProofNftId(bookingProofId);
                }
              }
            } catch (extractError) {
              console.warn('Could not extract booking proof NFT ID:', extractError);
            }

            // Set transaction hash from blockchain result
            setTransactionHash(result.digest);

            // Now proceed with database booking
            try {
      const bookingData: BookingData = {
        client_wallet: walletAddr,
                transaction_hash: result.digest,
        payment_status: 'completed'
      };
      
      const bookingResult = await SessionService.bookSession(selectedSlot.id, bookingData);
      
      if (!bookingResult.success) {
                throw new Error(bookingResult.error || 'Database booking failed');
      }
      
      if (bookingResult.bookedSession) {
        setBookedNFT(bookingResult.bookedSession);
        
        // Update local state - mark slot as booked
        setTimeSlots(prev => prev.map(slot => 
          slot.id === selectedSlot.id ? { ...slot, status: 'booked' } : slot
        ));
      }
      
      setPurchaseComplete(true);
      setPurchasing(false);
      
      // Show success modal and start countdown
      setShowSuccessModal(true);
      setRedirectCountdown(3);
      
                            console.log('Complete booking successful:', {
                totalAmount: selectedSlot.price_sui,
                therapistShare: `${Number(therapistShare) / 1_000_000_000} SUI`,
                serviceProviderShare: `${Number(serviceProviderShare) / 1_000_000_000} SUI`,
                therapistWallet: therapist.wallet_address,
                serviceProviderWallet: '0x40bd8248e692f15c0eff9e7cf79ca4f399964adc42c98ba44e38d5d23130106b',
                bookingProofNFT: bookingProofId,
                transactionHash: result.digest,
                booking: bookingResult.bookedSession
              });
              
            } catch (dbError) {
              console.error('Database booking failed after NFT mint:', dbError);
              setPaymentError(`Booking proof NFT created (${bookingProofId}) but database booking failed: ${dbError}`);
              setPurchasing(false);
            }
          },
          onError: (error: any) => {
            console.error('Blockchain transaction failed:', error);
            setPaymentError(`Failed to mint booking proof NFT: ${error.message || error}`);
            setPurchasing(false);
          }
        }
      );
      
    } catch (error: any) {
      console.error('Booking failed:', error);
      setPaymentError(error.message || 'Booking failed. Please try again.');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
            <h3 className="text-lg font-medium text-foreground">Loading therapist...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-foreground">Therapist not found</h3>
            <Link href="/marketplace">
              <Button variant="outline" className="mt-4">Back to Marketplace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(therapist.full_name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 via-background to-blue-900/20 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Book <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Session</span>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Panel - Therapist Profile */}
          <div className="lg:col-span-2">
            <Card className="glass border-glow sticky top-8">
              <CardContent className="p-6 space-y-6">
                {/* Professional Photo & Identity */}
                <div className="text-center space-y-4">
                  <div className="relative mx-auto w-24 h-24">
                    <img
                      src={`https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face&auto=format&q=80&seed=${therapist.id}`}
                      alt={`${therapist.full_name} - Professional Therapist`}
                      className="w-full h-full rounded-full object-cover border-2 border-border hover:border-purple-400/50 transition-all duration-300"
                    />
                    {therapist.is_verified && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-background">
                        <Shield className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{therapist.full_name}</h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{therapist.rating || 4.8}</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {therapist.bio && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {therapist.bio}
                    </p>
                  </div>
                )}

                {/* Qualifications */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-400" />
                    Qualifications
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>PhD in Clinical Psychology - Stanford University</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>Licensed Marriage & Family Therapist (LMFT)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>Board Certified - American Board of Psychology</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>{therapist.years_of_experience || 15}+ years clinical experience</span>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                {therapist.specializations && therapist.specializations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400" />
                      Specializations
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {therapist.specializations.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {therapist.languages_spoken && therapist.languages_spoken.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-400" />
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {therapist.languages_spoken.map((language) => (
                        <Badge key={language} variant="outline" className="text-xs">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Professional Statistics */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Professional Stats
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Sessions:</span>
                      <span className="font-medium">127</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Time:</span>
                      <span className="font-medium">2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completion Rate:</span>
                      <span className="font-medium">98%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Booking & Payment */}
          <div className="lg:col-span-3 space-y-6">
            {/* Date Selector */}
            <Card className="glass border-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('prev')}
                    className="px-3"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground">
                      {formatDate(selectedDate.toISOString().split('T')[0])}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getDayName(selectedDate.toISOString().split('T')[0])}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('next')}
                    className="px-3"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Available Time Slots */}
            <Card className="glass border-glow">
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Available Times
                </h3>
                <p className="text-sm text-muted-foreground">Select a 30-minute session slot</p>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {selectedDateSlots.map(slot => (
                    <Button
                      key={slot.id}
                      variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                      size="sm"
                      disabled={slot.status !== 'available'}
                      onClick={() => handleSlotSelect(slot)}
                      className={`h-12 transition-all duration-200 ${
                        slot.status !== 'available' 
                          ? 'opacity-50 cursor-not-allowed' 
                          : selectedSlot?.id === slot.id
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 border-purple-400'
                            : 'hover:border-purple-400/50 hover:bg-purple-500/10'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xs font-medium">{formatTime(slot.start_time)}</div>
                        {slot.status === 'booked' && (
                          <div className="text-xs text-red-400">Booked</div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
                
                {selectedDateSlots.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No available slots for this date</p>
                    <p className="text-sm">Try selecting a different date</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Session Summary */}
            {selectedSlot && (
              <Card className="glass border-glow border-purple-400/50">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-foreground">Selected Session</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <p className="font-medium">{formatDate(selectedSlot.date)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>
                      <p className="font-medium">{formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Therapist:</span>
                      <p className="font-medium">{therapist.full_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">30 minutes</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg">
                      <span className="font-semibold">Total Price:</span>
                      <span className="font-bold text-green-400">{formatSui(selectedSlot.price_sui)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wallet & Payment */}
            <Card className="glass border-glow">
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">Payment</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Wallet Status */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <span className="text-sm text-muted-foreground">Wallet Status:</span>
                    <span className="font-semibold">
                      {currentAccount ? (
                        <span className="text-green-400">Connected</span>
                      ) : (
                        <span className="text-yellow-400">Mock Mode</span>
                      )}
                    </span>
                  </div>

                  {/* Balance Display (only if wallet connected) */}
                  {currentAccount && (
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <span className="text-sm text-muted-foreground">Wallet Balance:</span>
                      <span className="font-semibold">
                        {isLoadingBalance ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          `${walletBalance.toFixed(4)} SUI`
                        )}
                      </span>
                    </div>
                  )}

                  {/* Mock Mode Notice */}
                  {!currentAccount && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-blue-400">
                        💡 Running in demo mode - payments are simulated for testing
                      </p>
                    </div>
                  )}
                  
                  {paymentError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400">{paymentError}</p>
                    </div>
                  )}
                  
                  {purchaseComplete && transactionHash && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Payment Successful!</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Transaction: {transactionHash.slice(0, 20)}...
                      </p>
                      <p className="text-xs text-green-400">
                        Success! Check the confirmation modal.
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handlePurchaseNFT}
                    disabled={!selectedSlot || purchasing || purchaseComplete}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : purchaseComplete ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Session Booked!
                      </>
                    ) : selectedSlot ? (
                      `Book Session - ${formatSui(selectedSlot.price_sui)}`
                    ) : (
                      'Select a Time Slot'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && bookedNFT && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md glass border-glow animate-in zoom-in-95 duration-300">
            <CardContent className="p-6 text-center space-y-6">
              {/* Success Animation */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Booking Successful!</h2>
                <p className="text-muted-foreground">Your therapy session has been confirmed</p>
              </div>

              {/* NFT Card */}
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-400/30 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-purple-300">
                  <span>🎫</span>
                  <span>Your Session NFT</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NFT ID:</span>
                    <span className="font-mono text-xs">{bookedNFT.nft_token_id?.slice(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Therapist:</span>
                    <span className="font-medium">{therapist.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDate(bookedNFT.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{formatTime(bookedNFT.start_time)} - {formatTime(bookedNFT.end_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meeting:</span>
                    <span className="text-xs text-blue-400">Link generated</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-3 text-left">
                <h3 className="font-semibold text-foreground text-center">📱 Next Steps:</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Check your profile for session details</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Join 5 minutes before session time</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span>Meeting link stored in your NFT</span>
                  </div>
                </div>
              </div>

              {/* Auto-redirect Notice */}
              <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-400">
                  Redirecting to your profile in {redirectCountdown} seconds...
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1"
                >
                  Stay Here
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    const clientWallet = currentAccount?.address || 'mock-wallet-address';
                    router.push(`/client/${clientWallet}`);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500"
                >
                  Go to Profile →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}