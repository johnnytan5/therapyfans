import { NextRequest, NextResponse } from 'next/server';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('Creating kiosk with backend-only approach');

    if (!sponsorPrivateKey) {
      return NextResponse.json({ 
        error: 'Gas sponsorship not available - sponsor wallet not configured' 
      }, { status: 500 });
    }

    const requestBody = await request.json();
    const { userAddress } = requestBody;

    if (!userAddress) {
      return NextResponse.json({ 
        error: 'Missing userAddress' 
      }, { status: 400 });
    }

    console.log('Creating kiosk for user:', userAddress);

    // Create sponsor keypair
    let sponsorKeypair;
    try {
      if (sponsorPrivateKey.startsWith('suiprivkey1')) {
        console.log('Detected SUI CLI format private key');
        sponsorKeypair = Ed25519Keypair.fromSecretKey(sponsorPrivateKey);
      } else {
        console.log('Assuming base64 format private key');
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
      console.log('Sponsor coins found:', sponsorCoins.data?.length || 0);
      
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

    // SIMPLIFIED APPROACH: Sponsor creates and transfers in a single transaction
    console.log('Creating kiosk with backend-only approach...');
    const createTx = new Transaction();
    
    // Create standard kiosk using SUI's kiosk module
    const [kiosk, kioskOwnerCap] = createTx.moveCall({
      target: '0x2::kiosk::new',
      arguments: [],
    });

    // Transfer the kiosk owner cap to the user immediately
    createTx.transferObjects([kioskOwnerCap], userAddress);
    
    // Make the kiosk shared
    createTx.moveCall({
      target: '0x2::transfer::public_share_object',
      arguments: [kiosk],
      typeArguments: ['0x2::kiosk::Kiosk']
    });

    // IMPORTANT: For backend-only execution, sponsor must be both sender and gas owner
    createTx.setSender(sponsorAddress);
    createTx.setGasOwner(sponsorAddress);
    createTx.setGasBudget(100_000_000);

    try {
      // Execute transaction with sponsor signature
      const createResult = await suiClient.signAndExecuteTransaction({
        transaction: createTx,
        signer: sponsorKeypair,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      console.log('Kiosk creation result:', createResult.digest);
      console.log('Object changes:', JSON.stringify(createResult.objectChanges, null, 2));
      
      // Extract kiosk and owner cap from standard kiosk creation
      let kioskId = 'Unknown';
      let ownerCapId = 'Unknown';
      let createdObjects: any[] = [];

      if (createResult.objectChanges) {
        createResult.objectChanges.forEach((change: any) => {
          console.log('Processing change:', change);
          if (change.type === 'created') {
            createdObjects.push({
              objectId: change.objectId,
              objectType: change.objectType,
              sender: change.sender,
              owner: change.owner
            });
            
            console.log('Created object:', {
              id: change.objectId,
              type: change.objectType,
              owner: change.owner
            });

            if (change.objectType === '0x2::kiosk::Kiosk') {
              kioskId = change.objectId;
              console.log('Found Kiosk ID:', kioskId);
            } else if (change.objectType === '0x2::kiosk::KioskOwnerCap') {
              ownerCapId = change.objectId;
              console.log('Found Owner Cap ID:', ownerCapId);
            }
          }
        });
      }

      // Check if ownership was properly set to user
      let ownershipCorrect = false;
      if (ownerCapId !== 'Unknown') {
        try {
          console.log('Verifying ownership...');
          const capObject = await suiClient.getObject({
            id: ownerCapId,
            options: { showOwner: true }
          });
          
          const currentOwner = (capObject.data as any)?.owner?.AddressOwner;
          ownershipCorrect = currentOwner === userAddress;
          console.log('Current cap owner:', currentOwner);
          console.log('Expected owner:', userAddress);
          console.log('Ownership correct:', ownershipCorrect);
        } catch (verifyError) {
          console.error('Error verifying ownership:', verifyError);
        }
      }

      // Add code to create NFT with user as creator (optional)
      console.log('Adding creator metadata with user address...');

      try {
        // First, check if we can find a suitable NFT project module in the user's package
        // This is an extra step to make the user appear as creator in metadata
        const metadataTx = new Transaction();
        metadataTx.setSender(sponsorAddress);
        metadataTx.setGasOwner(sponsorAddress);
        metadataTx.setGasBudget(50_000_000);
        
        // Record creator information - this creates a record that the user is the creator
        // Note: This depends on your specific NFT contract implementation
        // For a generic example, we're creating a simple object with creator information
        try {
          metadataTx.moveCall({
            target: '0x2::display::update_version',
            arguments: [
              metadataTx.object(kioskId),
              metadataTx.pure.address(userAddress),
              metadataTx.pure.string("Created by user")
            ],
          });
          
          await suiClient.signAndExecuteTransaction({
            transaction: metadataTx,
            signer: sponsorKeypair,
            options: { showEffects: true }
          });
          
          console.log('Added creator metadata successfully');
        } catch (metadataError) {
          // This is optional, so just log the error
          console.log('Could not add creator metadata:', metadataError);
        }
      } catch (nftError) {
        console.log('Optional NFT creation step failed:', nftError);
        // Continue - this step is optional
      }

      return NextResponse.json({
        success: true,
        transactionDigest: createResult.digest,
        kioskId: kioskId,
        ownerCapId: ownerCapId,
        createdObjects: createdObjects,
        sponsorAddress: sponsorAddress,
        userAddress: userAddress,
        userIsSender: false, // Backend execution uses sponsor as sender
        transferSuccess: ownershipCorrect,
        message: 'Kiosk created with sponsored gas',
        note: 'Sponsor created kiosk and transferred ownership to user',
        creatorMetadata: 'Attempted to add user as creator in metadata'
      });

    } catch (executeError) {
      console.error('Error with kiosk creation:', executeError);
      return NextResponse.json({ 
        error: `Failed to create kiosk: ${executeError}` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Unexpected error in kiosk creation:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: `Failed to create kiosk: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET endpoint for debugging
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
      service: 'sponsored-kiosk',
      sponsorAddress,
      coinCount: sponsorCoins.data?.length || 0,
      totalBalance: totalBalance.toString(),
      balanceInSui: Number(totalBalance) / 1_000_000_000,
      needsFunding: totalBalance < BigInt(100_000_000),
      faucetUrl: 'https://faucet.testnet.sui.io/'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}