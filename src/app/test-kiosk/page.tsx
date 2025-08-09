"use client";

import { useState, useEffect } from "react";
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  useSuiClient
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Plus, 
  ExternalLink, 
  CheckCircle,
  X,
  Copy,
  Wallet,
  Zap
} from "lucide-react";

// Constants
const PACKAGE_ID = "0x4257be6ae1a26a4bc491ca2d4db672678c3c50bee810efa8e6c34cf3cfa135c3";
const NETWORK = "testnet";
const EXPLORER_URL = "https://suiscan.xyz/testnet";

export default function TestKioskPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // State management
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userKiosks, setUserKiosks] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCreatedKiosk, setLastCreatedKiosk] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Load user's kiosks when wallet connects
  useEffect(() => {
    if (account) {
      fetchUserKiosks();
    }
  }, [account]);

  // Helper functions
  const startLoading = (operation: string) => {
    setError(null);
    setSuccess(null);
    setLoading(prev => ({ ...prev, [operation]: true }));
  };

  const endLoading = (operation: string) => {
    setLoading(prev => ({ ...prev, [operation]: false }));
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return address.length > 12 
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;
  };

  const getTxLink = (digest: string) => `${EXPLORER_URL}/tx/${digest}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

// Update createKioskWithSponsorship to work with the updated backend
const createKioskWithSponsorship = async () => {
  if (!account) return;
  startLoading("createKiosk");

  try {
    console.log("Requesting gas-sponsored kiosk creation...");

    const res = await fetch("/api/sponsor-kiosk", {
      method: "POST",
      body: JSON.stringify({ 
        userAddress: account.address 
      }),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    console.log("Backend response:", data);
    
    if (!res.ok || data.error) {
      throw new Error(data.error || `Backend error: ${res.status}`);
    }

    if (data.success) {
      console.log("Kiosk created by backend with user attribution:", data);
      
      setLastCreatedKiosk({
        kioskId: data.kioskId,
        ownerCapId: data.ownerCapId,
        transactionDigest: data.transactionDigest,
        gasSponsored: true,
        userAttribution: data.userAttribution,
        exploreUrl: data.exploreUrl
      });
      
      setSuccess("Kiosk created successfully with sponsored gas and user attribution!");
      setShowSuccessModal(true);
      
      setTimeout(() => {
        fetchUserKiosks();
      }, 3000);
      
      endLoading("createKiosk");
    } else {
      throw new Error("Unexpected response from sponsor service");
    }

  } catch (e: any) {
    console.error("Error in sponsored kiosk creation:", e);
    setError(`Error creating sponsored kiosk: ${e.message}`);
    endLoading("createKiosk");
  }
};
  // Regular (non-sponsored) Kiosk Creation
  const createKioskRegular = async () => {
    if (!account) return;
    startLoading("createKioskRegular");

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::new_kiosk`,
        arguments: [],
      });

      console.log("Executing regular kiosk creation transaction...");

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Regular kiosk created:", result);
            
            setLastCreatedKiosk({
              kioskId: "Check transaction for details",
              ownerCapId: "Check transaction for details", 
              transactionDigest: result.digest,
              gasSponsored: false
            });
            
            setSuccess("Kiosk created successfully!");
            setShowSuccessModal(true);
            
            setTimeout(() => {
              fetchUserKiosks();
            }, 3000);
            
            endLoading("createKioskRegular");
          },
          onError: (e: any) => {
            setError(`Error creating kiosk: ${e?.message || e}`);
            endLoading("createKioskRegular");
          },
        },
      );
    } catch (e: any) {
      console.error("Error creating regular kiosk:", e);
      setError(`Error creating kiosk: ${e.message}`);
      endLoading("createKioskRegular");
    }
  };

  // Fetch user's existing kiosks
  const fetchUserKiosks = async () => {
    if (!account) return;
    
    try {
      console.log("Fetching user kiosks...");
      
      const res = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: { StructType: "0x2::kiosk::KioskOwnerCap" },
        options: { showType: true, showContent: true },
      });

      const kiosks = await Promise.all(
        (res?.data || []).map(async (obj: any) => {
          const ownerCapId = obj?.data?.objectId;
          let kioskId = obj?.data?.content?.fields?.kiosk;
          
          if (!kioskId) {
            try {
              const capObj = await suiClient.getObject({ 
                id: ownerCapId, 
                options: { showContent: true } 
              });
              kioskId = (capObj as any)?.data?.content?.fields?.kiosk;
            } catch (e) {
              console.warn("Failed to resolve kiosk for cap:", ownerCapId);
            }
          }
          
          return kioskId ? {
            id: kioskId,
            cap: ownerCapId,
            hasExtension: false
          } : null;
        })
      );

      setUserKiosks(kiosks.filter(Boolean));
      console.log("Fetched kiosks:", kiosks.filter(Boolean));
      
    } catch (error) {
      console.error("Error fetching user kiosks:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">
          Gas Sponsored Kiosk Creation
        </h1>

        {!account ? (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-6">Connect your wallet to create kiosks</p>
                <div className="flex justify-center">
                  <ConnectWallet />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-4 flex items-center">
                <X className="w-5 h-5 mr-2" />
                <p>{error}</p>
              </div>
            )}

            {success && !showSuccessModal && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-lg mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <p>{success}</p>
              </div>
            )}

            {/* Wallet Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Connected Wallet</span>
                  <Badge variant="outline" className="font-mono">
                    {formatAddress(account.address)}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Kiosk Creation Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gas Sponsored Creation */}
              <Card className="border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-purple-400" />
                    Gas Sponsored Creation
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Create a kiosk with sponsored gas fees - completely free for you!
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                    <h4 className="font-medium text-purple-300 mb-2">Benefits:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Zero gas cost for you</li>
                      <li>• Faster onboarding</li>
                      <li>• Backend handles complexity</li>
                      <li>• Perfect for new users</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={createKioskWithSponsorship} 
                    disabled={loading.createKiosk}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {loading.createKiosk ? (
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Create Sponsored Kiosk
                  </Button>
                </CardContent>
              </Card>

              {/* Regular Creation */}
              <Card className="border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-blue-400" />
                    Regular Creation
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Create a kiosk using your own gas - traditional approach
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                    <h4 className="font-medium text-blue-300 mb-2">Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Pay your own gas fees</li>
                      <li>• Complete control</li>
                      <li>• Direct transaction</li>
                      <li>• No backend dependency</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={createKioskRegular} 
                    disabled={loading.createKioskRegular}
                    variant="outline"
                    className="w-full"
                  >
                    {loading.createKioskRegular ? (
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Regular Kiosk
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Your Existing Kiosks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Kiosks</span>
                  <Button size="sm" variant="outline" onClick={fetchUserKiosks}>
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userKiosks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">No kiosks found</p>
                    <p className="text-sm">Create your first kiosk using one of the options above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userKiosks.map(kiosk => (
                      <div key={kiosk.id} className="p-4 rounded-lg border bg-secondary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-mono">
                                Kiosk: {formatAddress(kiosk.id)}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground font-mono">
                              Cap: {formatAddress(kiosk.cap)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`${EXPLORER_URL}/object/${kiosk.id}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && lastCreatedKiosk && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h2 className="text-xl font-bold text-green-700">
                    Kiosk Created Successfully!
                  </h2>
                </div>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {lastCreatedKiosk.gasSponsored && (
  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
    <div className="flex items-center text-purple-700">
      <Zap className="w-4 h-4 mr-2" />
      <span className="font-medium">Gas fees sponsored!</span>
      {lastCreatedKiosk.userAttribution && (
        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
          ✓ User Attribution
        </span>
      )}
    </div>
    <p className="text-sm text-purple-600 mt-1">
      This kiosk creation was completely free for you and includes proper creator attribution.
    </p>
  </div>
)}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kiosk ID:
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate text-black">
                      {lastCreatedKiosk.kioskId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(lastCreatedKiosk.kioskId)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Cap ID:
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate text-black">
                      {lastCreatedKiosk.ownerCapId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(lastCreatedKiosk.ownerCapId)}
                      className="p-1 hover:bg-gray-100 rounded"
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
                    onClick={() => window.open(getTxLink(lastCreatedKiosk.transactionDigest), '_blank')}
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
                  <p>• Your kiosk has been created and is ready to use</p>
                  <p>• Use the Kiosk ID and Owner Cap ID for listing NFTs</p>
                  <p>• Keep the Owner Cap ID safe - it proves ownership</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}