"use client";

import { useState, useEffect } from "react";
import { 
  useCurrentAccount, 
  useSignAndExecuteTransaction,
  useSuiClient
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Check, 
  Clock, 
  X, 
  Plus, 
  ExternalLink, 
  DollarSign, 
  ShoppingBag,
  List,
  Calendar,
  Trash2,
  Star
} from "lucide-react";

// Constants
const PACKAGE_ID = "0x4d8b7cc84d041c2134bf8719b77162d39db06f9ca376ca5a27ef2ace6e084908";
const NETWORK = "testnet";
const EXPLORER_URL = "https://suiscan.xyz/testnet";

export default function SmartContractTest() {
  // Updated wallet hooks from dapp-kit
  const account = useCurrentAccount();
const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();  const suiClient = useSuiClient();
  // Add this with your other state variables
const [useSpecificAddress, setUseSpecificAddress] = useState(true);
const specificWalletAddress = "0x80bb0b336df5b007fbbd97cfdcba38c07d50f4fa29ee5565166ab89fa1414496";
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [transactions, setTransactions] = useState<string[]>([]);
  const [userKiosks, setUserKiosks] = useState<any[]>([]);
  const [userNfts, setUserNfts] = useState<any[]>([]);
  const [listedServices, setListedServices] = useState<any[]>([]);
  const [rentedServices, setRentedServices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // NFT mint form state
  const [nftForm, setNftForm] = useState({
    name: "Dr. Sarah Johnson",
    specialization: "Anxiety, Depression, PTSD",
    credentials: "PhD Psychology, Licensed Therapist",
    yearsExperience: "15",
    bio: "Specialized in cognitive behavioral therapy with 15 years of experience.",
    sessionTypes: "Individual, Couples",
    languages: "English, Spanish",
    rating: "95",
    totalSessions: "324",
    profileImageUrl: "https://example.com/image.jpg",
    certificationUrl: "https://example.com/cert.pdf"
  });

  // For selecting items in UI
  const [selectedNft, setSelectedNft] = useState<string | null>(null);
  const [selectedKiosk, setSelectedKiosk] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Load user's data when wallet connects
  useEffect(() => {
    if (account) {
      fetchUserKiosks();
      fetchUserNfts();
      fetchListedServices();
      fetchRentedServices();
    }
  }, [account]);

  // Helper function to start loading state
  const startLoading = (operation: string) => {
    setError(null);
    setLoading(prev => ({ ...prev, [operation]: true }));
  };

  // Helper function to end loading state
  const endLoading = (operation: string) => {
    setLoading(prev => ({ ...prev, [operation]: false }));
  };

// Update your handleTxResult function to safely handle different response formats
const handleTxResult = (result: any, operation: string) => {
  console.log(`${operation} result:`, result); // Add logging to see the actual structure
  
  // Check if transaction was successful using a more robust approach
  const isSuccess = result?.effects?.status?.status === "success" || 
                   result?.status === "success" || 
                   result?.digest; // If we have a digest, assume success
  
  if (isSuccess) {
    // Add transaction to history if we have a digest
    if (result?.digest) {
      setTransactions(prev => [result.digest, ...prev]);
    }
    
    // Update relevant data
    setTimeout(() => {
      fetchUserKiosks();
      fetchUserNfts();
      fetchListedServices();
      fetchRentedServices();
    }, 2000); // Small delay to allow indexing
  } else {
    // Extract error message using a more flexible approach
    const errorMessage = result?.effects?.status?.error || 
                        result?.error?.message || 
                        "Unknown error";
    setError(`${operation} failed: ${errorMessage}`);
  }
  
  endLoading(operation);
};

// Create a new kiosk
const createKiosk = async () => {
  if (!account) return;
  startLoading("createKiosk");
  
  try {
    const tx = new Transaction();
    if (useSpecificAddress) {
      tx.setSender(specificWalletAddress);
    }
    tx.moveCall({
      target: `${PACKAGE_ID}::nft_rental::new_kiosk`,
    });
    
    console.log("Executing create kiosk transaction...");
    
    const result = await signAndExecuteTransaction({
      transaction: tx.serialize(),
    });
    
    console.log("Create kiosk result:", result);
    
    handleTxResult(result, "Create Kiosk");
  } catch (e: any) {
    console.error("Error creating kiosk:", e);
    setError(`Error creating kiosk: ${e.message}`);
    endLoading("createKiosk");
  }
};

  // Install rental extension in kiosk
  const installRentalExtension = async (kioskId: string, capId: string) => {
    if (!account) return;
    startLoading("installExtension");
    
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::install`,
        arguments: [
          tx.object(kioskId),
          tx.object(capId),
          tx.object("0x6")  // System transaction context
        ],
      });
      
      const result = await signAndExecuteTransaction({
  transaction: tx.serialize(),

});
      
      handleTxResult(result, "Install Extension");
    } catch (e: any) {
      setError(`Error installing extension: ${e.message}`);
      endLoading("installExtension");
    }
  };

// Mint a therapist NFT
const mintTherapistNft = async () => {
  if (!account) return;
  startLoading("mintNft");

  try {
    // Validate input values first
    const yearsExp = parseInt(nftForm.yearsExperience);
    const rating = parseInt(nftForm.rating);
    const totalSessions = parseInt(nftForm.totalSessions);

    // Validation for your specific ranges
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

    if (isNaN(totalSessions) || totalSessions < 1 || totalSessions > 100) {
      setError("Total sessions must be between 1 and 100");
      endLoading("mintNft");
      return;
    }

    console.log("Validated values:", { yearsExp, rating, totalSessions });

    const tx = new Transaction();
    
    console.log("Building mint transaction...");
    
    tx.moveCall({
      target: `${PACKAGE_ID}::therapist_nft::mint`,
      arguments: [
        tx.pure.string(nftForm.name),
        tx.pure.string(nftForm.specialization),
        tx.pure.string(nftForm.credentials),
        tx.pure.u8(yearsExp),        // 1-50 fits in u8
        tx.pure.string(nftForm.bio),
        tx.pure.string(nftForm.sessionTypes),
        tx.pure.string(nftForm.languages),
        tx.pure.u8(rating),          // 0-100 fits in u8
        tx.pure.u8(totalSessions),   // Changed from u16 to u8 (1-100)
        tx.pure.string(nftForm.profileImageUrl),
        tx.pure.string(nftForm.certificationUrl)
      ],
    });

    console.log("transaction", tx);
    
    signAndExecuteTransaction(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log("Transaction successful:", result);
          handleTxResult(result, "Mint NFT");
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
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
  // List a therapist NFT for rental
  const listTherapistService = async (nftId: string, kioskId: string, capId: string) => {
    if (!account) return;
    startLoading("listService");

    try {
      // We would need the protected transfer policy ID, but for simplicity, we'll create a mock one
      // In a real app, you'd fetch this from your backend or a registry
      const mockProtectedTpId = "0x123"; // Replace with actual ID
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::list_therapist_service`,
        arguments: [
          tx.object(kioskId),
          tx.object(capId),
          tx.object(mockProtectedTpId),
          tx.object(nftId),
          tx.object("0x6")  // System transaction context
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx.serialize(), // Convert TransactionBlock to serialized format
      });
      
      handleTxResult(result, "List Service");
    } catch (e: any) {
      setError(`Error listing service: ${e.message}`);
      endLoading("listService");
    }
  };

  // Delist a therapist NFT from rental
  const delistTherapistService = async (listingId: string, kioskId: string, capId: string) => {
    if (!account) return;
    startLoading("delistService");

    try {
      // Mock transfer policy ID
      const mockTransferPolicyId = "0x123"; // Replace with actual ID
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::delist_therapist_service`,
        arguments: [
          tx.object(kioskId),
          tx.object(capId),
          tx.object(mockTransferPolicyId),
          tx.object(listingId),
          tx.object("0x6")  // System transaction context
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx.serialize(), // Convert TransactionBlock to serialized format
      });
      
      handleTxResult(result, "Delist Service");
    } catch (e: any) {
      setError(`Error delisting service: ${e.message}`);
      endLoading("delistService");
    }
  };

  // Rent therapist service for 30 minutes
  const rentTherapistService30Min = async (listingId: string, renterKioskId: string, borrowerKioskId: string) => {
    if (!account) return;
    startLoading("rentService30Min");

    try {
      // Mock rental policy ID
      const mockRentalPolicyId = "0x123"; // Replace with actual ID
      
      const tx = new Transaction();
      
      // Create payment coin (5 SUI = 5,000,000,000 MIST)
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(5000000000)]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::rent_30_minutes`,
        arguments: [
          tx.object(renterKioskId),
          tx.object(borrowerKioskId),
          tx.object(mockRentalPolicyId),
          tx.object(listingId),
          coin,
          tx.object("0x6"),  // Clock object ID
          tx.object("0x6")   // System transaction context
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx.serialize(), // Convert TransactionBlock to serialized format
      });
      
      handleTxResult(result, "Rent Service (30 min)");
    } catch (e: any) {
      setError(`Error renting service: ${e.message}`);
      endLoading("rentService30Min");
    }
  };

  // Rent therapist service for 1 hour
  const rentTherapistService1Hour = async (listingId: string, renterKioskId: string, borrowerKioskId: string) => {
    if (!account) return;
    startLoading("rentService1Hour");

    try {
      // Mock rental policy ID
      const mockRentalPolicyId = "0x123"; // Replace with actual ID
      
      const tx = new Transaction();
      
      // Create payment coin (10 SUI = 10,000,000,000 MIST)
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(10000000000)]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::rent_1_hour`,
        arguments: [
          tx.object(renterKioskId),
          tx.object(borrowerKioskId),
          tx.object(mockRentalPolicyId),
          tx.object(listingId),
          coin,
          tx.object("0x6"),  // Clock object ID
          tx.object("0x6")   // System transaction context
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx.serialize(), // Convert TransactionBlock to serialized format
      });
      
      handleTxResult(result, "Rent Service (1 hour)");
    } catch (e: any) {
      setError(`Error renting service: ${e.message}`);
      endLoading("rentService1Hour");
    }
  };

  // Borrow NFT by reference for immutable access
  const borrowNft = async (nftId: string, kioskId: string, capId: string) => {
    if (!account) return;
    startLoading("borrowNft");

    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::borrow`,
        arguments: [
          tx.object(kioskId),
          tx.object(capId),
          tx.object(nftId),
          tx.object("0x6")  // System transaction context
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx.serialize(), // Convert TransactionBlock to serialized format
      });
      
      handleTxResult(result, "Borrow NFT");
    } catch (e: any) {
      setError(`Error borrowing NFT: ${e.message}`);
      endLoading("borrowNft");
    }
  };

  // Start a session - borrow NFT by value
  const startSession = async (nftId: string, kioskId: string, capId: string) => {
    if (!account) return;
    startLoading("startSession");

    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::borrow_val`,
        arguments: [
          tx.object(kioskId),
          tx.object(capId),
          tx.object(nftId),
          tx.object("0x6")  // System transaction context
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx.serialize(), // Convert TransactionBlock to serialized format
      });
      
      handleTxResult(result, "Start Session");
    } catch (e: any) {
      setError(`Error starting session: ${e.message}`);
      endLoading("startSession");
    }
  };

  // Reclaim NFT after session expires
  const reclaimNft = async (nftId: string, renterKioskId: string, borrowerKioskId: string) => {
    if (!account) return;
    startLoading("reclaimNft");

    try {
      // Mock transfer policy ID
      const mockTransferPolicyId = "0x123"; // Replace with actual ID
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::nft_rental::reclaim`,
        arguments: [
          tx.object(renterKioskId),
          tx.object(borrowerKioskId),
          tx.object(mockTransferPolicyId),
          tx.object("0x6"), // Clock object ID
          tx.object(nftId),
          tx.object("0x6")  // System transaction context
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx.serialize(), // Convert TransactionBlock to serialized format
      });
      
      handleTxResult(result, "Reclaim NFT");
    } catch (e: any) {
      setError(`Error reclaiming NFT: ${e.message}`);
      endLoading("reclaimNft");
    }
  };

  // Fetch user's kiosks
  const fetchUserKiosks = async () => {
    if (!account) return;
    
    try {
      // In a real application, you'd query the blockchain for the user's kiosks
      // This is a mock implementation
      const mockKiosks = [
        { id: "0x123456", cap: "0xabcdef", hasExtension: true },
        { id: "0x789012", cap: "0xghijkl", hasExtension: false }
      ];
      setUserKiosks(mockKiosks);
    } catch (error) {
      console.error("Error fetching user kiosks:", error);
    }
  };

  // Fetch user's NFTs
  const fetchUserNfts = async () => {
    if (!account) return;
    
    try {
      // In a real application, you'd query the blockchain for the user's NFTs
      // This is a mock implementation
      const mockNfts = [
        { 
          id: "0xnft1", 
          name: "Dr. Sarah Johnson",
          specialization: "Anxiety, Depression",
          rating: 95
        },
        { 
          id: "0xnft2", 
          name: "Dr. Michael Chen",
          specialization: "Family Therapy, Trauma",
          rating: 92
        }
      ];
      setUserNfts(mockNfts);
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
    }
  };

  // Fetch listed services
  const fetchListedServices = async () => {
    try {
      // In a real application, you'd query the blockchain for listed services
      // This is a mock implementation
      const mockListings = [
        { 
          id: "0xlisting1",
          nftId: "0xnft1",
          name: "Dr. Sarah Johnson", 
          specialization: "Anxiety, Depression",
          kioskId: "0x123456",
          price30min: 5,
          price1hour: 10,
          rating: 95
        },
        { 
          id: "0xlisting2",
          nftId: "0xnft2", 
          name: "Dr. Michael Chen",
          specialization: "Family Therapy, Trauma",
          kioskId: "0x789012",
          price30min: 5,
          price1hour: 10,
          rating: 92
        }
      ];
      setListedServices(mockListings);
    } catch (error) {
      console.error("Error fetching listed services:", error);
    }
  };

  // Fetch rented services
  const fetchRentedServices = async () => {
    if (!account) return;
    
    try {
      // In a real application, you'd query the blockchain for the user's rented services
      // This is a mock implementation
      const mockRented = [
        { 
          id: "0xrental1",
          nftId: "0xnft1", 
          name: "Dr. Sarah Johnson",
          specialization: "Anxiety, Depression",
          sessionType: 1, // 30 minutes
          startTime: Date.now() - 600000, // 10 minutes ago
          endTime: Date.now() + 1200000,  // 20 minutes from now
          active: true
        }
      ];
      setRentedServices(mockRented);
    } catch (error) {
      console.error("Error fetching rented services:", error);
    }
  };

  // Generate SuiScan link for a transaction
  const getTxLink = (digest: string) => `${EXPLORER_URL}/tx/${digest}`;

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNftForm(prev => ({ ...prev, [name]: value }));
  };

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return address.length > 12 
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 cyber-grid">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">
          TherapyFans <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Smart Contract Integration</span>
        </h1>

        {!account ? (
          <Card className="mb-8 border-0 glass border-glow hover:glow-purple">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-6">Connect your wallet to interact with the smart contracts</p>
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
            
            {/* Wallet Info */}
            <Card className="border-0 glass border-glow hover:glow-blue">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Connected Wallet</span>
                  <Badge variant="outline" className="font-mono">
                    {formatAddress(account.address)}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>


            {/* Kiosk Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 glass border-glow hover:glow-purple">
                <CardHeader>
                  <CardTitle>Kiosk Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={createKiosk} 
                    disabled={loading.createKiosk}
                    className="w-full"
                  >
                    {loading.createKiosk ? (
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create New Kiosk
                  </Button>

                  {userKiosks.length > 0 && (
                    <div className="mt-4 space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Your Kiosks:</h3>
                      {userKiosks.map(kiosk => (
                        <div 
                          key={kiosk.id} 
                          className={`p-3 rounded-lg border ${selectedKiosk === kiosk.id 
                            ? 'border-purple-500/50 bg-purple-500/10' 
                            : 'border-border bg-secondary/50'}`}
                          onClick={() => setSelectedKiosk(kiosk.id === selectedKiosk ? null : kiosk.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Badge variant="outline" className="font-mono">
                                {formatAddress(kiosk.id)}
                              </Badge>
                              {kiosk.hasExtension && (
                                <Badge variant="secondary" className="ml-2">
                                  Rental Extension
                                </Badge>
                              )}
                            </div>
                            {!kiosk.hasExtension && (
                              <Button
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  installRentalExtension(kiosk.id, kiosk.cap);
                                }}
                                disabled={loading.installExtension}
                              >
                                {loading.installExtension ? (
                                  <Clock className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Plus className="w-3 h-3 mr-1" />
                                )}
                                Install Extension
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mint Therapist NFT */}
              <Card className="border-0 glass border-glow hover:glow-green">
                <CardHeader>
                  <CardTitle>Mint Therapist NFT</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                      <Input 
                        name="name" 
                        value={nftForm.name} 
                        onChange={handleInputChange} 
                        placeholder="Full name"
                        className="mb-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Specialization</label>
                      <Input 
                        name="specialization" 
                        value={nftForm.specialization} 
                        onChange={handleInputChange} 
                        placeholder="Anxiety, Depression, etc."
                        className="mb-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Years Experience</label>
                      <Input 
                        name="yearsExperience" 
                        value={nftForm.yearsExperience} 
                        onChange={handleInputChange} 
                        type="number"
                        className="mb-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Rating (0-100)</label>
                      <Input 
                        name="rating" 
                        value={nftForm.rating} 
                        onChange={handleInputChange} 
                        type="number"
                        min="0"
                        max="100"
                        className="mb-2"
                      />
                    </div>
                  </div>

                  <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                  <Input 
                    name="bio" 
                    value={nftForm.bio} 
                    onChange={handleInputChange} 
                    placeholder="Short bio"
                    className="mb-2"
                  />

                  <Button 
                    onClick={mintTherapistNft} 
                    disabled={loading.mintNft}
                    className="w-full"
                    variant="gradient"
                  >
                    {loading.mintNft ? (
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Mint Therapist NFT
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Your NFTs */}
            <Card className="border-0 glass border-glow hover:glow-blue">
              <CardHeader>
                <CardTitle>Your Therapist NFTs</CardTitle>
              </CardHeader>
              <CardContent>
                {userNfts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No NFTs found. Mint a new Therapist NFT to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userNfts.map(nft => (
                      <div 
                        key={nft.id}
                        className={`p-4 rounded-lg border ${selectedNft === nft.id 
                          ? 'border-blue-500/50 bg-blue-500/10' 
                          : 'border-border bg-secondary/50'}`}
                        onClick={() => setSelectedNft(nft.id === selectedNft ? null : nft.id)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{nft.name}</h3>
                            <p className="text-sm text-muted-foreground">{nft.specialization}</p>
                            <div className="flex items-center mt-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm">{nft.rating/20} / 5</span>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="font-mono">
                              {formatAddress(nft.id)}
                            </Badge>

                            {selectedNft === nft.id && selectedKiosk && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Find kiosk cap from selected kiosk
                                  const kiosk = userKiosks.find(k => k.id === selectedKiosk);
                                  if (kiosk) {
                                    listTherapistService(nft.id, selectedKiosk, kiosk.cap);
                                  }
                                }}
                                disabled={loading.listService}
                                className="ml-auto"
                              >
                                {loading.listService ? (
                                  <Clock className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <ShoppingBag className="w-3 h-3 mr-1" />
                                )}
                                List Service
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Listed Services */}
            <Card className="border-0 glass border-glow hover:glow-green">
              <CardHeader>
                <CardTitle>Listed Therapy Services</CardTitle>
              </CardHeader>
              <CardContent>
                {listedServices.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No services listed. List your Therapist NFT to make it available for booking.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listedServices.map(listing => (
                      <div 
                        key={listing.id}
                        className={`p-4 rounded-lg border ${selectedListing === listing.id 
                          ? 'border-green-500/50 bg-green-500/10' 
                          : 'border-border bg-secondary/50'}`}
                        onClick={() => setSelectedListing(listing.id === selectedListing ? null : listing.id)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{listing.name}</h3>
                            <p className="text-sm text-muted-foreground">{listing.specialization}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="text-sm">{listing.rating/20} / 5</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">30min:</span>{" "}
                                <span className="font-medium text-green-400">{listing.price30min} SUI</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">1hr:</span>{" "}
                                <span className="font-medium text-green-400">{listing.price1hour} SUI</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="font-mono">
                              {formatAddress(listing.id)}
                            </Badge>

                            {selectedListing === listing.id && (
                              <div className="flex gap-2">
                                {/* For therapist (delist) */}
                                {userNfts.some(nft => nft.id === listing.nftId) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Find kiosk cap from kiosk ID
                                      const kiosk = userKiosks.find(k => k.id === listing.kioskId);
                                      if (kiosk) {
                                        delistTherapistService(listing.id, listing.kioskId, kiosk.cap);
                                      }
                                    }}
                                    disabled={loading.delistService}
                                  >
                                    {loading.delistService ? (
                                      <Clock className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3 mr-1" />
                                    )}
                                    Delist
                                  </Button>
                                )}

                                {/* For client (rent) */}
                                {selectedKiosk && !userNfts.some(nft => nft.id === listing.nftId) && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        rentTherapistService30Min(
                                          listing.id, 
                                          listing.kioskId, 
                                          selectedKiosk
                                        );
                                      }}
                                      disabled={loading.rentService30Min}
                                      className="border-green-500/30 text-green-500"
                                    >
                                      {loading.rentService30Min ? (
                                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                                      ) : (
                                        <Clock className="w-3 h-3 mr-1" />
                                      )}
                                      Rent 30min
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        rentTherapistService1Hour(
                                          listing.id, 
                                          listing.kioskId, 
                                          selectedKiosk
                                        );
                                      }}
                                      disabled={loading.rentService1Hour}
                                      className="border-blue-500/30 text-blue-500"
                                    >
                                      {loading.rentService1Hour ? (
                                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                                      ) : (
                                        <Calendar className="w-3 h-3 mr-1" />
                                      )}
                                      Rent 1hr
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active/Rented Services */}
            <Card className="border-0 glass border-glow hover:glow-purple">
              <CardHeader>
                <CardTitle>Your Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {rentedServices.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No active sessions. Rent a therapy service to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rentedServices.map(session => (
                      <div 
                        key={session.id}
                        className={`p-4 rounded-lg border ${selectedService === session.id 
                          ? 'border-purple-500/50 bg-purple-500/10' 
                          : 'border-border bg-secondary/50'}`}
                        onClick={() => setSelectedService(session.id === selectedService ? null : session.id)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{session.name}</h3>
                            <p className="text-sm text-muted-foreground">{session.specialization}</p>
                            
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant={session.active ? "default" : "secondary"} className="bg-green-500/20 text-green-400 border-green-500/30">
                                {session.active ? "Active Now" : "Session Ended"}
                              </Badge>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Duration:</span>{" "}
                                <span className="font-medium">{session.sessionType === 1 ? "30min" : "1hr"}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="font-mono">
                              {formatAddress(session.id)}
                            </Badge>

                            {selectedService === session.id && selectedKiosk && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Start session with therapist
                                    const kiosk = userKiosks.find(k => k.id === selectedKiosk);
                                    if (kiosk) {
                                      startSession(session.nftId, selectedKiosk, kiosk.cap);
                                    }
                                  }}
                                  disabled={loading.startSession || !session.active}
                                >
                                  {loading.startSession ? (
                                    <Clock className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <ArrowRight className="w-3 h-3 mr-1" />
                                  )}
                                  Start Session
                                </Button>
                                
                                {!session.active && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Reclaim NFT after session ends (for therapist)
                                      // We'd need renter kiosk ID and borrower kiosk ID
                                      const renterKioskId = "0x123456"; // Mock ID
                                      reclaimNft(session.nftId, renterKioskId, selectedKiosk);
                                    }}
                                    disabled={loading.reclaimNft || session.active}
                                    className="border-red-500/30 text-red-400"
                                  >
                                    {loading.reclaimNft ? (
                                      <Clock className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3 mr-1" />
                                    )}
                                    Reclaim NFT
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            {transactions.length > 0 && (
              <Card className="border-0 glass border-glow hover:glow-blue">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {transactions.map((digest, index) => (
                      <a 
                        key={index} 
                        href={getTxLink(digest)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors"
                      >
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatAddress(digest)}
                        </span>
                        <div className="flex items-center text-blue-400 text-sm">
                          View on SuiScan
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}