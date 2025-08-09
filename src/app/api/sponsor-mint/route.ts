import { NextRequest, NextResponse } from 'next/server';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('Creating sponsored therapist NFT mint with ownership transfer');

    if (!sponsorPrivateKey) {
      return NextResponse.json({ 
        error: 'Gas sponsorship not available - sponsor wallet not configured' 
      }, { status: 500 });
    }

    const requestBody = await request.json();
    const { 
      userAddress, 
      packageId,
      name,
      specialization,
      credentials,
      yearsExperience,
      bio,
      sessionTypes,
      languages,
      rating,
      totalSessions,
      profileImageUrl,
      certificationUrl
    } = requestBody;

    if (!userAddress || !packageId) {
      return NextResponse.json({ 
        error: 'Missing required fields: userAddress and packageId' 
      }, { status: 400 });
    }

    console.log('Creating sponsored NFT mint for user:', userAddress);
    console.log('Package ID:', packageId);

    // Create sponsor keypair
    let sponsorKeypair;
    try {
      if (sponsorPrivateKey.startsWith('suiprivkey1')) {
        sponsorKeypair = Ed25519Keypair.fromSecretKey(sponsorPrivateKey);
      } else {
        const privateKeyBytes = fromBase64(sponsorPrivateKey);
        sponsorKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
      }
      console.log('Sponsor keypair created successfully');
    } catch (keyError) {
      console.error('Failed to create sponsor keypair:', keyError);
      return NextResponse.json({ 
        error: `Invalid sponsor private key format: ${keyError}` 
      }, { status: 500 });
    }

    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    console.log('Sponsor address:', sponsorAddress);

    // Check sponsor balance
    let sponsorCoins;
    try {
      sponsorCoins = await suiClient.getCoins({
        owner: sponsorAddress,
        coinType: '0x2::sui::SUI'
      });
      
      if (sponsorCoins.data && sponsorCoins.data.length > 0) {
        const totalBalance = sponsorCoins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
        console.log('Total sponsor balance:', totalBalance.toString(), 'MIST');
      }
    } catch (balanceError) {
      console.error('Error fetching sponsor balance:', balanceError);
      return NextResponse.json({ 
        error: 'Failed to check sponsor wallet balance' 
      }, { status: 500 });
    }

    if (!sponsorCoins.data || sponsorCoins.data.length === 0) {
      console.error('Sponsor wallet has no SUI coins');
      return NextResponse.json({ 
        error: `Sponsor wallet (${sponsorAddress}) has no SUI coins for gas payment. Please fund this address with testnet SUI from https://faucet.testnet.sui.io/` 
      }, { status: 500 });
    }

    // STEP 1: Mint NFT to sponsor wallet
    console.log('STEP 1: Minting NFT to sponsor wallet...');
    const mintTx = new Transaction();
    
    mintTx.moveCall({
      target: `${packageId}::therapist_nft::mint`,
      arguments: [
        mintTx.pure.string(name),
        mintTx.pure.string(specialization),
        mintTx.pure.string(credentials),
        mintTx.pure.u64(yearsExperience),
        mintTx.pure.string(bio),
        mintTx.pure.string(sessionTypes),
        mintTx.pure.string(languages),
        mintTx.pure.u64(rating),
        mintTx.pure.u64(totalSessions),
        mintTx.pure.string(profileImageUrl),
        mintTx.pure.string(certificationUrl)
      ],
    });

    mintTx.setSender(sponsorAddress);
    mintTx.setGasOwner(sponsorAddress);
    mintTx.setGasBudget(100_000_000);

    try {
      console.log('Executing mint transaction...');
      const mintResult = await suiClient.signAndExecuteTransaction({
        transaction: mintTx,
        signer: sponsorKeypair,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      console.log('✅ Mint successful:', mintResult.digest);
      console.log('Object changes:', JSON.stringify(mintResult.objectChanges, null, 2));
      
      // Find the created NFT ID with better error handling
      let nftId = null;
      let nftOwner = null;
      
      if (mintResult.objectChanges) {
        for (const change of mintResult.objectChanges) {
          console.log('Checking change:', change);
          
          if (change.type === 'created') {
            console.log('Created object type:', change.objectType);
            
            // More flexible matching for TherapistNFT
            if (change.objectType?.includes('TherapistNFT') || 
                change.objectType?.includes('therapist_nft')) {
              nftId = change.objectId;
              nftOwner = change.owner;
              console.log('✅ Found TherapistNFT ID:', nftId);
              console.log('✅ Initial owner:', nftOwner);
              break;
            }
          }
        }
      }

      if (!nftId) {
        console.error('❌ Could not find NFT ID from mint transaction');
        console.log('Available object changes:', mintResult.objectChanges);
        throw new Error('Could not find NFT ID from mint transaction');
      }

      // STEP 2: Wait longer and verify NFT exists before transfer
      console.log('STEP 2: Waiting for NFT to be confirmed on blockchain...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      // Verify NFT exists and get current owner
      let verifiedNft = null;
      try {
        verifiedNft = await suiClient.getObject({
          id: nftId,
          options: { showOwner: true, showContent: true, showType: true }
        });
        console.log('✅ NFT verification successful:', {
          id: nftId,
          owner: verifiedNft.data?.owner,
          type: verifiedNft.data?.type
        });
      } catch (verifyError) {
        console.error('❌ NFT verification failed:', verifyError);
        throw new Error(`NFT verification failed: ${verifyError}`);
      }

      // Check if NFT is actually owned by sponsor
      const currentOwner = (verifiedNft.data as any)?.owner?.AddressOwner;
      if (currentOwner !== sponsorAddress) {
        console.error('❌ NFT not owned by sponsor. Current owner:', currentOwner);
        throw new Error(`NFT not owned by sponsor. Current owner: ${currentOwner}, expected: ${sponsorAddress}`);
      }

      // STEP 3: Transfer NFT to user
      console.log('STEP 3: Transferring NFT to user...');
      const transferTx = new Transaction();
      transferTx.transferObjects([transferTx.object(nftId)], userAddress);
      transferTx.setSender(sponsorAddress);
      transferTx.setGasOwner(sponsorAddress);
      transferTx.setGasBudget(50_000_000);

      const transferResult = await suiClient.signAndExecuteTransaction({
        transaction: transferTx,
        signer: sponsorKeypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        }
      });

      console.log('✅ Transfer successful:', transferResult.digest);
      console.log('Transfer object changes:', JSON.stringify(transferResult.objectChanges, null, 2));

      // STEP 4: Final verification
      console.log('STEP 4: Final ownership verification...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for transfer confirmation
      
      let ownershipCorrect = false;
      try {
        const finalNftObject = await suiClient.getObject({
          id: nftId,
          options: { showOwner: true, showContent: true }
        });
        
        const finalOwner = (finalNftObject.data as any)?.owner?.AddressOwner;
        ownershipCorrect = finalOwner === userAddress;
        
        console.log('Final NFT owner:', finalOwner);
        console.log('Expected owner (user):', userAddress);
        console.log('✅ Final ownership verification:', ownershipCorrect ? 'SUCCESS' : 'FAILED');
        
      } catch (finalVerifyError) {
        console.error('Error in final verification:', finalVerifyError);
      }

      return NextResponse.json({
        success: true,
        transactionDigest: mintResult.digest,
        transferDigest: transferResult.digest,
        nftId: nftId,
        sponsorAddress: sponsorAddress,
        userAddress: userAddress,
        ownershipTransferred: ownershipCorrect,
        method: 'mint_then_transfer_with_verification',
        message: 'TherapistNFT minted by sponsor and transferred to user',
        note: ownershipCorrect ? 
              '✅ NFT successfully minted and transferred to user' : 
              '⚠️ NFT minted but final ownership transfer needs verification',
        explorerUrls: {
          mint: `https://suiscan.xyz/testnet/tx/${mintResult.digest}`,
          transfer: `https://suiscan.xyz/testnet/tx/${transferResult.digest}`
        }
      });

    } catch (executeError) {
      console.error('❌ Error with sponsored mint + transfer:', executeError);
      return NextResponse.json({ 
        error: `Failed to mint and transfer NFT: ${executeError}` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Unexpected error in sponsored NFT minting:', error);
    return NextResponse.json({ 
      error: `Failed to mint sponsored NFT: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET endpoint remains the same
export async function GET() {
  try {
    if (!sponsorPrivateKey) {
      return NextResponse.json({ error: 'No sponsor key configured' });
    }

    let sponsorKeypair;
    if (sponsorPrivateKey.startsWith('suiprivkey1')) {
      sponsorKeypair = Ed25519Keypair.fromSecretKey(sponsorPrivateKey);
    } else {
      const privateKeyBytes = fromBase64(sponsorPrivateKey);
      sponsorKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    }

    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    
    const sponsorCoins = await suiClient.getCoins({
      owner: sponsorAddress,
      coinType: '0x2::sui::SUI'
    });

    const totalBalance = sponsorCoins.data?.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0)) || BigInt(0);

    return NextResponse.json({
      service: 'sponsored-mint-with-transfer',
      sponsorAddress,
      coinCount: sponsorCoins.data?.length || 0,
      totalBalance: totalBalance.toString(),
      balanceInSui: Number(totalBalance) / 1_000_000_000,
      needsFunding: totalBalance < BigInt(100_000_000),
      method: 'Two-step process with verification',
      features: [
        'Mint NFT with sponsored gas (to sponsor first)',
        'Wait and verify NFT exists on blockchain',
        'Transfer NFT to user (sponsor pays transfer gas too)', 
        'User receives NFT without any gas cost',
        'Full ownership verification'
      ]
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}