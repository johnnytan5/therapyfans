"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Building2, 
  Wallet, 
  ArrowRight, 
  DollarSign, 

  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Coins
} from "lucide-react";
import Link from "next/link";

const SUI_PRICE_USD = 3.60;

const paymentMethods = [
  {
    id: "card",
    name: "Credit/Debit Card",
    icon: CreditCard,
    fees: "2.9% + $0.30",
    processingTime: "Instant",
    minAmount: 10,
    maxAmount: 5000,
    popular: true
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: Building2,
    fees: "0.5%",
    processingTime: "1-3 business days",
    minAmount: 50,
    maxAmount: 25000,
    popular: false
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: Wallet,
    fees: "3.4% + $0.30",
    processingTime: "Instant",
    minAmount: 10,
    maxAmount: 2500,
    popular: true
  }
];

export default function OnrampPage() {
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [usdAmount, setUsdAmount] = useState("100");
  const [suiAmount, setSuiAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Amount, 2: Payment, 3: Processing, 4: Complete

  // Calculate SUI amount when USD changes
  useEffect(() => {
    const usd = parseFloat(usdAmount) || 0;
    const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
    
    if (selectedPaymentMethod && usd > 0) {
      // Calculate fees
      let feeAmount = 0;
      if (selectedMethod === "card" || selectedMethod === "paypal") {
        const percentage = selectedMethod === "card" ? 0.029 : 0.034;
        feeAmount = (usd * percentage) + 0.30;
      } else if (selectedMethod === "bank") {
        feeAmount = usd * 0.005;
      }
      
      const netAmount = usd - feeAmount;
      const sui = netAmount / SUI_PRICE_USD;
      setSuiAmount(sui.toFixed(6));
    } else {
      setSuiAmount("");
    }
  }, [usdAmount, selectedMethod]);

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);
  const usdValue = parseFloat(usdAmount) || 0;
  const isValidAmount = selectedPaymentMethod && 
    usdValue >= selectedPaymentMethod.minAmount && 
    usdValue <= selectedPaymentMethod.maxAmount;

  const handlePurchase = async () => {
    if (!isValidAmount) return;
    
    setIsProcessing(true);
    setStep(3);
    
    // Mock processing delay
    setTimeout(() => {
      setStep(4);
      setIsProcessing(false);
    }, 3000);
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-green-950/20 cyber-grid">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 glow-green">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Purchase Complete!
              </h1>
              <p className="text-muted-foreground">
                Your SUI tokens have been successfully purchased
              </p>
            </div>

            <Card className="glass border-glow p-6 mb-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Purchased</span>
                  <span className="font-semibold">{suiAmount} SUI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-semibold">${usdAmount} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-semibold">{selectedPaymentMethod?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-sm">TX-{Date.now()}</span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Button 
                size="lg" 
                variant="gradient" 
                className="w-full glow-purple"
                asChild
              >
                <Link href="/marketplace">
                  Start Using SUI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full border-glow"
                onClick={() => {
                  setStep(1);
                  setUsdAmount("100");
                  setSuiAmount("");
                }}
              >
                Buy More SUI
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20 cyber-grid">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 glow-blue animate-pulse">
                <Coins className="w-10 h-10 text-white animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Processing Payment...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we process your transaction
              </p>
            </div>

            <Card className="glass border-glow p-6 mb-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchasing</span>
                  <span className="font-semibold">{suiAmount} SUI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">${usdAmount} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-semibold">{selectedPaymentMethod?.name}</span>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>This usually takes a few seconds...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Buy SUI with{" "}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Fiat Currency
              </span>
            </h1>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Amount & Payment Method */}
            <div className="space-y-6">
              {/* Amount Input */}
              <Card className="glass border-glow p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                  Enter Amount
                </h3>
                
                <div className="space-y-4">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="100"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      className="pl-10 text-lg h-12 glass border-glow"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  
                  {selectedPaymentMethod && (
                    <div className="text-sm text-muted-foreground">
                      Min: ${selectedPaymentMethod.minAmount} • Max: ${selectedPaymentMethod.maxAmount.toLocaleString()}
                    </div>
                  )}
                  
                  {!isValidAmount && usdValue > 0 && (
                    <div className="flex items-center text-sm text-red-400">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Amount must be between ${selectedPaymentMethod?.minAmount} and ${selectedPaymentMethod?.maxAmount.toLocaleString()}
                    </div>
                  )}
                </div>
              </Card>

              {/* Payment Methods */}
              <Card className="glass border-glow p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-400" />
                  Payment Method
                </h3>
                
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;
                    
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-purple-500/50 bg-purple-500/10 glow-purple' 
                            : 'border-border hover:border-purple-500/30 glass'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-400' : 'text-muted-foreground'}`} />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{method.name}</span>
                                {method.popular && (
                                  <Badge variant="outline" className="text-xs">Popular</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Fee: {method.fees} • {method.processingTime}
                              </div>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            isSelected ? 'border-purple-400 bg-purple-400' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Column - Conversion & Summary */}
            <div className="space-y-6">
              {/* Live Conversion */}
              <Card className="glass border-glow p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Coins className="w-5 h-5 mr-2 text-cyan-400" />
                  Live Conversion
                </h3>
                
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="text-3xl font-bold text-foreground mb-2">
                      1 SUI = ${SUI_PRICE_USD}
                    </div>
                    <div className="text-sm text-green-400 flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                      Live Price
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">You Pay</span>
                      <span className="text-xl font-semibold">${usdAmount || "0"} USD</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">You Receive</span>
                      <span className="text-xl font-semibold text-cyan-400">
                        {suiAmount || "0"} SUI
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Transaction Summary */}
              <Card className="glass border-glow p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-400" />
                  Transaction Summary
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${usdAmount || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span>{selectedPaymentMethod?.fees || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Time</span>
                    <span>{selectedPaymentMethod?.processingTime || "N/A"}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-semibold">
                    <span>You'll Receive</span>
                    <span className="text-cyan-400">{suiAmount || "0"} SUI</span>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  variant="gradient" 
                  className="w-full mt-6 glow-purple"
                  disabled={!isValidAmount || isProcessing}
                  onClick={handlePurchase}
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Purchase SUI
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </Card>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}