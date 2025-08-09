'use client';

import { MIST_PER_SUI } from '@mysten/sui/utils';
import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Star, BookOpen, X, ExternalLink, Copy, CheckCircle } from 'lucide-react';

import { PACKAGE_ID, CONTRACT_FUNCTIONS } from '@/lib/suiConfig';

interface TherapistNFT {
  id: string;
  name: string;
  walletAddress: string;
  specialization: string;
  credentials: string;
  yearsExperience: number;
  bio: string;
  sessionTypes: string;
  languages: string;
  rating: number;
  totalSessions: number;
  profileImageUrl: string;
  certificationUrl: string;
}

interface TimeSlot {
  date: string;
  time: string;
  duration: number;
  available: boolean;
  therapistId: string;
}

export default function ClientTestPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [paymentStep, setPaymentStep] = useState<'select' | 'payment' | 'booking'>('select');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDigest, setPaymentDigest] = useState<string>('');
  const [copied, setCopied] = useState(false);  
  
  // Mock therapist data
  const [therapists] = useState<TherapistNFT[]>([
    {
      id: "0x68f71cedbae4b2a652ad160bdf2fd1e8111b8c0c0ee9c5cee58a53c5da856cef",
      name: "Dr. Sarah Johnson",
      walletAddress: "0x80bb0b336df5b007fbbd97cfdcba38c07d50f4fa29ee5565166ab89fa1414496",
      specialization: "Anxiety, Depression, PTSD",
      credentials: "PhD Psychology, Licensed Therapist",
      yearsExperience: 15,
      bio: "Specialized in cognitive behavioral therapy with 15 years of experience.",
      sessionTypes: "Individual, Couples",
      languages: "English, Spanish",
      rating: 95,
      totalSessions: 324,
      profileImageUrl: "https://example.com/image.jpg",
      certificationUrl: "https://example.com/cert.pdf"
    },
    {
      id: "0x560b26dc35009c364fe63d13e17794986255f7e4d6a590a5b5242223cf6e01ba",
      name: "Dr. Michael Chen",
      walletAddress: "0x80bb0b336df5b007fbbd97cfdcba38c07d50f4fa29ee5565166ab89fa1414496",
      specialization: "ADHD, Autism, Child Psychology",
      credentials: "PhD Clinical Psychology, Board Certified",
      yearsExperience: 12,
      bio: "Specializing in neurodevelopmental disorders and family therapy.",
      sessionTypes: "Individual, Family, Child",
      languages: "English, Mandarin",
      rating: 98,
      totalSessions: 567,
      profileImageUrl: "https://example.com/image2.jpg",
      certificationUrl: "https://example.com/cert2.pdf"
    }
  ]);

  const [availableSlots] = useState<TimeSlot[]>([
  { date: '2025-08-15', time: '09:00', duration: 60, available: true, therapistId: '0x68f71cedbae4b2a652ad160bdf2fd1e8111b8c0c0ee9c5cee58a53c5da856cef' },
  { date: '2025-08-15', time: '10:30', duration: 30, available: true, therapistId: '0x68f71cedbae4b2a652ad160bdf2fd1e8111b8c0c0ee9c5cee58a53c5da856cef' },
  { date: '2025-08-15', time: '14:00', duration: 60, available: true, therapistId: '0x68f71cedbae4b2a652ad160bdf2fd1e8111b8c0c0ee9c5cee58a53c5da856cef' },
  { date: '2025-08-16', time: '10:00', duration: 30, available: true, therapistId: '0x560b26dc35009c364fe63d13e17794986255f7e4d6a590a5b5242223cf6e01ba' },
  { date: '2025-08-16', time: '15:30', duration: 60, available: true, therapistId: '0x560b26dc35009c364fe63d13e17794986255f7e4d6a590a5b5242223cf6e01ba' },
  { date: '2025-08-17', time: '11:00', duration: 60, available: true, therapistId: '0x68f71cedbae4b2a652ad160bdf2fd1e8111b8c0c0ee9c5cee58a53c5da856cef' },
]);

  const [selectedTherapist, setSelectedTherapist] = useState<TherapistNFT | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingProofs, setBookingProofs] = useState<any[]>([]);

  const [showBookingModal, setShowBookingModal] = useState(false);
 const [bookingDigest, setBookingDigest] = useState<string>('');
 const [mintedNftId, setMintedNftId] = useState<string>('');


  const startLoading = (key: string) => setLoading(prev => ({ ...prev, [key]: true }));
  const endLoading = (key: string) => setLoading(prev => ({ ...prev, [key]: false }));

  // Copy to clipboard helper function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

// Update the processPayment function - remove options
const processPayment = async () => {
  if (!account || !selectedTherapist || !selectedSlot) return;
  
  startLoading("payment");
  setError(null);

  try {
    const paymentAmountInSUI = selectedSlot.duration === 30 ? 0.02 : 0.04;
    const paymentAmount = BigInt(paymentAmountInSUI * Number(MIST_PER_SUI));
    
    const tx = new Transaction();
    
    // Create a coin with the exact payment amount and transfer it
    const [paymentCoin] = tx.splitCoins(tx.gas, [paymentAmount]);
    tx.transferObjects([paymentCoin], selectedTherapist.walletAddress);

    console.log(`Paying ${paymentAmountInSUI} SUI to ${selectedTherapist.name}`);
    console.log(`Therapist wallet: ${selectedTherapist.walletAddress}`);

    signAndExecuteTransaction(
      { 
        transaction: tx
        // Remove the options property - it's not supported
      },
      {
        onSuccess: (result: any) => {
          console.log("Payment successful:", result);
          setPaymentComplete(true);
          setPaymentDigest(result.digest);
          setShowPaymentModal(true);
          setPaymentStep('booking');
          setSuccess(`Payment of ${getPrice(selectedSlot.duration)} sent to ${selectedTherapist.name}!`);
          endLoading("payment");
        },
        onError: (error: any) => {
          console.error("Payment failed:", error);
          setError(`Payment failed: ${error.message}`);
          endLoading("payment");
        }
      }
    );

  } catch (e: any) {
    console.error("Error processing payment:", e);
    setError(`Error processing payment: ${e.message}`);
    endLoading("payment");
  }
};

// Update the slot selection to go to payment step
const handleSlotSelection = (slot: TimeSlot) => {
  setSelectedSlot(slot);
  setPaymentStep('payment');
};
  // Update the booking function to only work after payment
// Update the bookSession function - remove options
const bookSession = async () => {
  if (!account || !selectedTherapist || !selectedSlot || !paymentComplete) {
    setError("Please complete payment first");
    return;
  }
  
  startLoading("booking");
  setError(null);

  try {
    // Convert date/time to epoch milliseconds
    const startDate = new Date(`${selectedSlot.date}T${selectedSlot.time}`);
    const startTs = startDate.getTime();
    const endTs = startTs + (selectedSlot.duration * 60 * 1000);

    const tx = new Transaction();
    
    // Mint booking proof NFT
    tx.moveCall({
      target: `${PACKAGE_ID}::booking_proof::mint_booking_proof`,
      arguments: [
        tx.object(selectedTherapist.id), // Reference to therapist NFT object
        tx.pure.u64(startTs),
        tx.pure.u64(endTs)
      ],
    });

    signAndExecuteTransaction(
      { 
        transaction: tx
        // Remove the options property - it's not supported
      },
      {
        onSuccess: (result: any) => {
          console.log("Booking successful:", result);
          console.log("Full result object:", JSON.stringify(result, null, 2));
          
          // Extract NFT ID from transaction result
          let nftId = 'Unknown';
          try {
            // The result should contain objectChanges automatically
            if (result.objectChanges && result.objectChanges.length > 0) {
              console.log("Object changes found:", result.objectChanges);
              
              const createdObject = result.objectChanges.find((change: any) => 
                change.type === 'created' && 
                change.objectType && 
                (change.objectType.includes('BookingProofNFT') ||
                 change.objectType.includes('booking_proof'))
              );
              
              if (createdObject) {
                nftId = createdObject.objectId;
                console.log("Found NFT ID from objectChanges:", nftId);
              }
            }
            
            // Fallback: look for any created object
            if (nftId === 'Unknown' && result.objectChanges && result.objectChanges.length > 0) {
              const anyCreatedObject = result.objectChanges.find((change: any) => 
                change.type === 'created'
              );
              
              if (anyCreatedObject) {
                nftId = anyCreatedObject.objectId;
                console.log("Found generic created object ID:", nftId);
              }
            }
            
          } catch (error) {
            console.error("Error extracting NFT ID:", error);
            nftId = result.digest; // Fallback to transaction digest
          }

          const meetingId = generateMeetingId();
          setMintedNftId(nftId);
          setBookingDigest(result.digest);
          setShowBookingModal(true);
          
          setSuccess(`Session booked successfully! Meeting ID: ${meetingId}`);
          
          // Create booking proof data
          const newBookingProof = {
            id: `booking_${Date.now()}`,
            therapistId: selectedTherapist.id,
            therapistName: selectedTherapist.name,
            date: selectedSlot.date,
            time: selectedSlot.time,
            duration: selectedSlot.duration,
            meetingId: meetingId,
            status: 'confirmed',
            paymentAmount: getPrice(selectedSlot.duration),
            nftId: nftId,
            transactionDigest: result.digest
          };
          
          setBookingProofs(prev => [...prev, newBookingProof]);
          
          // Reset state
          setSelectedSlot(null);
          setSelectedTherapist(null);
          setPaymentComplete(false);
          setPaymentStep('select');
          endLoading("booking");
        },
        onError: (error: any) => {
          console.error("Error booking session:", error);
          setError(`Error booking session: ${error.message}`);
          endLoading("booking");
        }
      }
    );

  } catch (e: any) {
    console.error("Error booking session:", e);
    setError(`Error booking session: ${e.message}`);
    endLoading("booking");
  }
};

  // Generate a mock meeting ID
  const generateMeetingId = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  // Get price for duration
const getPrice = (duration: number) => {
  return duration === 30 ? "0.02 SUI" : "0.04 SUI";
};

const getPriceInMist = (duration: number) => {
  return duration === 30 ? BigInt(0.02 * Number(MIST_PER_SUI)) : BigInt(0.04 * Number(MIST_PER_SUI));
};

  // Filter slots for selected therapist
  const getTherapistSlots = (therapistId: string) => {
    return availableSlots.filter(slot => slot.therapistId === therapistId && slot.available);
  };

  if (!account) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Please connect your wallet to book therapy sessions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Book a Therapy Session</h1>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Therapist Selection */}
      {!selectedTherapist && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Therapist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {therapists.map((therapist) => (
                <div
                  key={therapist.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => setSelectedTherapist(therapist)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{therapist.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{therapist.credentials}</p>
                      <p className="text-sm mb-2">{therapist.specialization}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{therapist.rating}/100</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{therapist.totalSessions} sessions</span>
                        </div>
                        <span>{therapist.yearsExperience} years exp.</span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{therapist.bio}</p>
                      <p className="text-xs text-gray-500">
                        <strong>Languages:</strong> {therapist.languages}
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Session Types:</strong> {therapist.sessionTypes}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slot Selection */}
      {selectedTherapist && !selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle>
              Available Times for {selectedTherapist.name}
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={() => setSelectedTherapist(null)}
              className="ml-auto"
            >
              Back to Therapists
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {getTherapistSlots(selectedTherapist.id).map((slot, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-300 cursor-pointer transition-colors"
                  onClick={() => handleSlotSelection(slot)}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{slot.date}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{slot.time}</span>
                    <span className="text-sm text-gray-500">({slot.duration} min)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600">{getPrice(slot.duration)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {getTherapistSlots(selectedTherapist.id).length === 0 && (
              <p className="text-gray-500 text-center">No available slots for this therapist.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Step */}
{selectedTherapist && selectedSlot && paymentStep === 'payment' && !paymentComplete && (
  <Card>
    <CardHeader>
      <CardTitle>Payment Required</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-semibold mb-2 text-yellow-800">Payment Details:</h3>
        <p className="text-yellow-700"><strong>Amount:</strong> {getPrice(selectedSlot.duration)}</p>
        <p className="text-yellow-700"><strong>Pay to:</strong> {selectedTherapist.name}</p>
        <p className="text-yellow-700"><strong>Wallet:</strong> <code className="text-xs bg-yellow-100 px-1 py-0.5 rounded">{selectedTherapist.walletAddress}</code></p>
        <p className="text-yellow-700"><strong>Session:</strong> {selectedSlot.date} at {selectedSlot.time} ({selectedSlot.duration} min)</p>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">How it works:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Pay {getPrice(selectedSlot.duration)} to the therapist's wallet</li>
          <li>2. After payment confirmation, mint your booking proof NFT</li>
          <li>3. Receive your meeting ID and session details</li>
        </ol>
      </div>
      
      <div className="flex space-x-4">
        <Button 
          onClick={processPayment} 
          disabled={loading.payment}
          className="flex-1"
        >
          {loading.payment ? "Processing Payment..." : `Pay ${getPrice(selectedSlot.duration)}`}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            setSelectedSlot(null);
            setPaymentStep('select');
          }}
        >
          Cancel
        </Button>
      </div>
    </CardContent>
  </Card>
)}

{/* Booking Success Modal */}
{showBookingModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <h2 className="text-xl font-bold text-green-700">Booking Proof NFT Minted!</h2>
        </div>
        <button
          onClick={() => setShowBookingModal(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">✓ Session Booked Successfully!</h3>
          <div className="text-green-700 space-y-1">
            <p><strong>Therapist:</strong> {selectedTherapist?.name}</p>
            <p><strong>Date & Time:</strong> {selectedSlot?.date} at {selectedSlot?.time}</p>
            <p><strong>Duration:</strong> {selectedSlot?.duration} minutes</p>
            <p><strong>Meeting ID:</strong> {bookingProofs[bookingProofs.length - 1]?.meetingId}</p>
          </div>
        </div>
        
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 ">
            Transaction Digest:
          </label>
          <div className="flex items-center space-x-2 text-black">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate">
              {bookingDigest}
            </code>
            <button
              onClick={() => copyToClipboard(bookingDigest)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Copy transaction digest to clipboard"
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
            onClick={() => window.open(`https://suiscan.xyz/testnet/tx/${bookingDigest}`, '_blank')}
            className="flex items-center space-x-2 flex-1"
            variant="outline"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Transaction</span>
          </Button>
        </div>
        
        <Button
          onClick={() => setShowBookingModal(false)}
          className="w-full"
        >
          Close
        </Button>
        
        <div className="text-xs text-gray-500">
          <p>• Your soulbound booking proof NFT has been minted</p>
          <p>• This NFT contains your session details and cannot be transferred</p>
          <p>• Use your Meeting ID to join the therapy session</p>
        </div>
      </div>
    </div>
  </div>
)}

{/* Booking Confirmation (After Payment) */}
{selectedTherapist && selectedSlot && paymentStep === 'booking' && paymentComplete && (
  <Card>
    <CardHeader>
      <CardTitle>Complete Your Booking</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-semibold mb-2 text-green-800">✓ Payment Confirmed</h3>
        <p className="text-green-700">Payment of {getPrice(selectedSlot.duration)} has been sent to {selectedTherapist.name}</p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg text-black">
        <h3 className="font-semibold mb-2">Booking Details:</h3>
        <p><strong>Therapist:</strong> {selectedTherapist.name}</p>
        <p><strong>Specialization:</strong> {selectedTherapist.specialization}</p>
        <p><strong>Date:</strong> {selectedSlot.date}</p>
        <p><strong>Time:</strong> {selectedSlot.time}</p>
        <p><strong>Duration:</strong> {selectedSlot.duration} minutes</p>
        <p><strong>Amount Paid:</strong> {getPrice(selectedSlot.duration)}</p>
      </div>
      
      <div className="flex space-x-4">
        <Button 
          onClick={bookSession} 
          disabled={loading.booking || !paymentComplete}
          className="flex-1"
        >
          {loading.booking ? "Creating Booking Proof..." : "Complete Booking & Get Meeting ID"}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            setSelectedSlot(null);
            setSelectedTherapist(null);
            setPaymentComplete(false);
            setPaymentStep('select');
          }}
        >
          Cancel
        </Button>
      </div>
    </CardContent>
  </Card>
)}

      {/* Payment Success Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-green-700">Payment Successful!</h2>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-green-800">
                  <strong>Amount:</strong> {selectedSlot ? getPrice(selectedSlot.duration) : ''}
                </p>
                <p className="text-green-800">
                  <strong>Paid to:</strong> {selectedTherapist?.name}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Digest:
                </label>
                <div className="flex items-center space-x-2 text-black">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate">
                    {paymentDigest}
                  </code>
                  <button
                    onClick={() => copyToClipboard(paymentDigest)}
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
                  onClick={() => window.open(`https://suiscan.xyz/testnet/tx/${paymentDigest}`, '_blank')}
                  className="flex items-center space-x-2 flex-1"
                  variant="outline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on SuiScan</span>
                </Button>
                <Button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>• Your payment has been sent successfully</p>
                <p>• You can now proceed to complete your booking</p>
                <p>• View transaction details on SuiScan</p>
              </div>
            </div>
          </div>
        </div>
      )}

     {/* Booking Proofs */}
{bookingProofs.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>Your Bookings</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {bookingProofs.map((proof) => (
          <div key={proof.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-black">{proof.therapistName}</h3>
                <p className="text-sm text-gray-600">
                  {proof.date} at {proof.time} ({proof.duration} minutes)
                </p>
                <p className="text-sm text-green-600 font-medium">
                  Meeting ID: {proof.meetingId}
                </p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {proof.status}
              </span>
            </div>
            
            {/* Show NFT and Transaction Details */}
            {(proof.nftId || proof.transactionDigest) && (
              <div className="border-t border-green-200 pt-3 mt-3">
                <div className="space-y-2 text-xs">
                  {proof.nftId && proof.nftId !== 'Unknown' && (
                    <div>
                      <p className="text-gray-500 mb-1">Booking Proof NFT ID:</p>
                      <div className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded">
                        <code className="truncate flex-1">
                          {proof.nftId}
                        </code>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => copyToClipboard(proof.nftId)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Copy NFT ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => window.open(`https://suiscan.xyz/testnet/object/${proof.nftId}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                            title="View NFT on SuiScan"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {proof.transactionDigest && (
                    <div>
                      <p className="text-gray-500 mb-1">Transaction Digest:</p>
                      <div className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded text-black">
                        <code className="truncate flex-1">
                          {proof.transactionDigest}
                        </code>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => copyToClipboard(proof.transactionDigest)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Copy Transaction Digest"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => window.open(`https://suiscan.xyz/testnet/tx/${proof.transactionDigest}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Transaction on SuiScan"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
    </div>
  );
}