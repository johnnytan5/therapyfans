"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VibeTag } from "@/components/therapy/VibeTag";
import { mockTherapistsWithProfiles, mockWalletData } from "@/data/mockData";
import { 
  ArrowLeft, 
  Wallet, 
  Shield, 
  Clock, 
  Calendar, 
  CheckCircle,
  Star,
  Zap,
  CreditCard,
  Loader2,
  AlertCircle,
  Gift
} from "lucide-react";
import Link from "next/link";
import { createBlurredAvatar, formatSui, truncateAddress } from "@/lib/utils";

interface PurchasePageProps {
  params: {
    sessionId: string;
  };
  searchParams: {
    time?: string;
  };
}

export default async function PurchasePage({ params, searchParams }: PurchasePageProps) {
  // Await the params and searchParams to fix Next.js 15 warnings
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [suiBalance, setSuiBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [sessionNftId, setSessionNftId] = useState("");

  // Extract therapist ID from sessionId (format: "session-therapist-1")
  const therapistId = resolvedParams.sessionId.replace('session-', '');
  const therapist = mockTherapistsWithProfiles.find(t => t.id === therapistId) || mockTherapistsWithProfiles[0];
  
  const selectedTime = resolvedSearchParams.time || "14:00";
  const sessionPrice = 5.0;
  const sessionDate = new Date().toISOString().split('T')[0]; // Today's date

  // Mock wallet connection
  const connectWallet = async () => {
    setIsConnecting(true);
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setWalletConnected(true);
    setWalletAddress("0x1234...5678");
    setSuiBalance(25.5);
    setIsConnecting(false);
  };

  // Mock payment processing
  const processPayment = async () => {
    setIsProcessingPayment(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setPaymentComplete(true);
    setSessionNftId("NFT_0x789abc...def123");
    setSuiBalance(prev => prev - sessionPrice);
    setIsProcessingPayment(false);
  };

  const handleBookSession = () => {
    if (paymentComplete) {
      // Navigate to session page
      window.location.href = `/session/booked-${resolvedParams.sessionId}`;
    } else {
      processPayment();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-purple-900/20 via-background to-blue-900/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <span>›</span>
            <Link href="/marketplace" className="hover:text-purple-400 transition-colors">Marketplace</Link>
            <span>›</span>
            <Link href={`/therapist/${therapistId}`} className="hover:text-purple-400 transition-colors">{therapist.alias}</Link>
            <span>›</span>
            <span className="text-foreground">Book Session</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Book <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Session</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Secure payment via <span className="text-blue-400">Sui Network</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Session Details */}
          <div className="space-y-6">
            {/* Session Summary */}
            <Card className="border-0 glass border-glow hover:glow-blue transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 blur-sm opacity-70"
                    style={{
                      backgroundImage: `url(${createBlurredAvatar(therapist.id)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{therapist.alias}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{therapist.profile.rating} rating</span>
                      {therapist.profile.verified && (
                        <>
                          <span>•</span>
                          <Badge variant="verified" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <div className="font-semibold text-foreground">Today, {sessionDate}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <div className="font-semibold text-foreground">{selectedTime}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <div className="font-semibold text-foreground">15 minutes</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Format:</span>
                    <div className="font-semibold text-foreground">Video Call</div>
                  </div>
                </div>

                <div className="p-3 glass rounded-lg border border-blue-500/30 glow-blue">
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Anonymous & Secure</span>
                  </div>
                  <p className="text-xs text-blue-300 mt-1">
                    Your identity remains protected through zkLogin technology
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Therapist Specializations */}
            <Card className="border-0 glass border-glow hover:glow-purple transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Specializations & Approach</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Specializations:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {therapist.profile.specializations.map((spec) => (
                      <Badge key={spec} variant="outline">{spec}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Therapy Style:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {therapist.tags.map((tag) => (
                      <VibeTag key={tag.id} tag={tag.name} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card className="border-0 glass border-glow hover:glow-green transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  {paymentComplete ? "Payment Complete" : "Payment Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-lg text-foreground">
                  <span>Session Fee:</span>
                  <span className="font-bold text-green-400">{formatSui(sessionPrice)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Platform Fee:</span>
                  <span className="line-through">0.50 SUI</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-green-400">
                  <span>Launch Promotion:</span>
                  <span>-0.50 SUI</span>
                </div>
                
                <hr className="border-border" />
                
                <div className="flex justify-between items-center text-xl font-bold text-foreground">
                  <span>Total:</span>
                  <span className="text-green-400">{formatSui(sessionPrice)}</span>
                </div>

                {paymentComplete && sessionNftId && (
                  <div className="p-3 glass rounded-lg border border-purple-500/30 glow-purple">
                    <div className="flex items-center gap-2 text-purple-400 text-sm">
                      <Gift className="w-4 h-4" />
                      <span className="font-medium">Session NFT Minted</span>
                    </div>
                    <p className="text-xs text-purple-300 mt-1">
                      Token ID: {truncateAddress(sessionNftId)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wallet Connection */}
            <Card className="border-0 glass border-glow hover:glow-blue transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  Sui Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!walletConnected ? (
                  <div className="text-center space-y-4">
                    <div className="p-4 glass rounded-lg border border-yellow-500/30 shadow-lg shadow-yellow-500/20">
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Connect your Sui wallet to continue</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={connectWallet}
                      disabled={isConnecting}
                      size="lg"
                      className="w-full"
                      variant="gradient"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Connect Sui Wallet
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 glass rounded-lg border border-green-500/30 glow-green">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Wallet Connected</span>
                      </div>
                      <p className="text-xs text-green-300 mt-1">
                        {truncateAddress(walletAddress)}
                      </p>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SUI Balance:</span>
                      <span className="font-semibold text-foreground">{formatSui(suiBalance)}</span>
                    </div>
                    
                    {suiBalance < sessionPrice && (
                      <div className="p-3 glass rounded-lg border border-red-500/30 shadow-lg shadow-red-500/20">
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>Insufficient SUI balance</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Book Session Button */}
            <Button
              onClick={handleBookSession}
              disabled={!walletConnected || suiBalance < sessionPrice || isProcessingPayment}
              size="lg"
              className="w-full"
              variant={paymentComplete ? "default" : "gradient"}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : paymentComplete ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Go to Session
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Confirm & Pay {formatSui(sessionPrice)}
                </>
              )}
            </Button>

            {/* Trust Indicators */}
            <div className="text-center text-xs text-muted-foreground space-y-2">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 hover:text-green-400 transition-colors">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                  <span>Verified Therapist</span>
                </div>
                <div className="flex items-center gap-1 hover:text-purple-400 transition-colors">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>Instant Booking</span>
                </div>
              </div>
              <p>All transactions are secured by <span className="text-blue-400">Sui Network</span> blockchain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}