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
import { getTherapistById, TherapistWithSpecializations, getDisplayName } from "@/lib/therapistService";
import { 
  SessionNFT, 
  getDayName 
} from "@/lib/meetingLinks";
import { SessionService, BookingData } from "@/lib/sessionService";
import { createBlurredAvatar, formatSui, mistToSui, formatTime, formatDate } from "@/lib/utils";

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
        console.log('🔍 URL walletAddress parameter:', walletAddress);
        const therapistData = await getTherapistById(walletAddress);
        if (therapistData) {
          setTherapist(therapistData);
          console.log('🔍 Therapist data:', { id: therapistData.id, wallet_address: therapistData.wallet_address });
          
          // Use the therapist's actual wallet address for session queries
          const therapistWalletAddress = therapistData.wallet_address;
          console.log('🔍 Fetching sessions for therapist wallet:', therapistWalletAddress);
          const sessions = await SessionService.getAllAvailableSessionsForTherapist(therapistWalletAddress);
          console.log('📅 Fetched sessions:', sessions);
          console.log('📅 Session dates:', sessions.map(s => ({ id: s.id, date: s.date, start_time: s.start_time })));
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
      if (therapist?.wallet_address) {
        console.log('🔄 Using therapist wallet address:', therapist.wallet_address);
        const sessions = await SessionService.getAllAvailableSessionsForTherapist(therapist.wallet_address);
        setTimeSlots(sessions);
      } else {
        console.error('No therapist wallet address available for refresh');
      }
    } catch (error) {
      console.error('Error refreshing sessions:', error);
    }
  };

  // Filter time slots for selected date only
  const selectedDateSlots = useMemo(() => {
    const dateString = selectedDate.toISOString().split('T')[0];
    console.log('🗓️ Filtering for date:', dateString);
    console.log('🗓️ Available time slots:', timeSlots.map(s => ({ id: s.id, date: s.date, start_time: s.start_time })));
    const filtered = timeSlots.filter(slot => {
      const matches = slot.date === dateString;
      console.log(`🔍 Slot ${slot.id}: date=${slot.date}, matches=${matches}`);
      return matches;
    });
    console.log('✅ Filtered slots for date:', filtered);
    return filtered.sort((a, b) => a.start_time.localeCompare(b.start_time));
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

    // Use mock wallet address if no real wallet connected
    const walletAddr = currentAccount?.address || 'mock-wallet-address';
    
    setPurchasing(true);
    setPaymentError('');
    
    try {
      console.log('Starting session booking...', { 
        slot: selectedSlot.id, 
        wallet: walletAddr,
        therapist: walletAddress 
      });
      
      // Mock payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Generate mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 40)}`;
      setTransactionHash(mockTxHash);
      
      // Book the session in the database
      const bookingData: BookingData = {
        client_wallet: walletAddr,
        transaction_hash: mockTxHash,
        payment_status: 'completed'
      };
      
      const bookingResult = await SessionService.bookSession(selectedSlot.id, bookingData);
      
      if (!bookingResult.success) {
        throw new Error(bookingResult.error || 'Booking failed');
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
      
      console.log('Session booking successful:', {
        amount: selectedSlot.price_sui,
        therapist: walletAddress,
        booking: bookingResult.bookedSession
      });
      
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-400" />
                      Available Times
                    </h3>
                    <p className="text-sm text-muted-foreground">Select a 30-minute session slot</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshSessions}
                    className="text-xs"
                  >
                    🔄 Refresh
                  </Button>
                </div>
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
                        <div className="text-xs font-medium">{formatTime(`${slot.date}T${slot.start_time}Z`)}</div>
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
                      <p className="font-medium">{formatTime(`${selectedSlot.date}T${selectedSlot.start_time}Z`)} - {formatTime(`${selectedSlot.date}T${selectedSlot.end_time}Z`)}</p>
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
                    <span className="font-medium">{formatTime(`${bookedNFT.date}T${bookedNFT.start_time}Z`)} - {formatTime(`${bookedNFT.date}T${bookedNFT.end_time}Z`)}</span>
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