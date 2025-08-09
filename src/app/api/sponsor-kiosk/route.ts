// Replace your entire route.ts with this backend-only execution approach:
import { NextRequest, NextResponse } from 'next/server';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('Gas sponsorship API called - BACKEND EXECUTION');

    if (!sponsorPrivateKey) {
      return NextResponse.json({ 
        error: 'Gas sponsorship not available' 
      }, { status: 500 });
    }

    const requestBody = await request.json();
    const { userAddress } = requestBody;

    if (!userAddress) {
      return NextResponse.json({ 
        error: 'Missing userAddress' 
      }, { status: 400 });
    }

    console.log('Creating sponsored kiosk for user:', userAddress);

    // Create sponsor keypair
    let sponsorKeypair;
    try {
      if (sponsorPrivateKey.startsWith('suiprivkey1')) {
        sponsorKeypair = Ed25519Keypair.fromSecretKey(sponsorPrivateKey);
      } else {
        const privateKeyBytes = fromBase64(sponsorPrivateKey);
        sponsorKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
      }
    } catch (keyError) {
      return NextResponse.json({ 
        error: `Invalid sponsor private key: ${keyError}` 
      }, { status: 500 });
    }

    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    console.log('Sponsor address:', sponsorAddress);

    // Check sponsor balance
    const sponsorCoins = await suiClient.getCoins({
      owner: sponsorAddress,
      coinType: '0x2::sui::SUI'
    });

    if (!sponsorCoins.data || sponsorCoins.data.length === 0) {
      return NextResponse.json({ 
        error: `Sponsor wallet needs funding: ${sponsorAddress}` 
      }, { status: 500 });
    }

    // Step 1: Create kiosk (sponsor pays and executes)
    console.log('Step 1: Creating kiosk...');
    const createTx = new Transaction();
    
    createTx.moveCall({
      target: `0x4257be6ae1a26a4bc491ca2d4db672678c3c50bee810efa8e6c34cf3cfa135c3::nft_rental::new_kiosk`,
      arguments: [],
    });

    // Sponsor executes the kiosk creation
    createTx.setSender(sponsorAddress);
    createTx.setGasOwner(sponsorAddress);
    createTx.setGasBudget(100_000_000);

    try {
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

      // Extract kiosk and owner cap IDs
      let kioskId = 'Unknown';
      let ownerCapId = 'Unknown';

      if (createResult.objectChanges) {
        createResult.objectChanges.forEach((change: any) => {
          if (change.type === 'created') {
            if (change.objectType?.includes('kiosk::Kiosk')) {
              kioskId = change.objectId;
              console.log('Found Kiosk ID:', kioskId);
            } else if (change.objectType?.includes('kiosk::KioskOwnerCap')) {
              ownerCapId = change.objectId;
              console.log('Found Owner Cap ID:', ownerCapId);
            }
          }
        });
      }

      // Step 2: Transfer ownership cap to user (if found)
      if (ownerCapId !== 'Unknown') {
        console.log('Step 2: Transferring ownership to user...');
        try {
          const transferTx = new Transaction();
          transferTx.transferObjects([transferTx.object(ownerCapId)], transferTx.pure.address(userAddress));
          transferTx.setSender(sponsorAddress);
          transferTx.setGasOwner(sponsorAddress);
          transferTx.setGasBudget(50_000_000);
          
          const transferResult = await suiClient.signAndExecuteTransaction({
            transaction: transferTx,
            signer: sponsorKeypair,
          });
          
          console.log('Ownership transfer result:', transferResult.digest);
        } catch (transferError) {
          console.error('Failed to transfer ownership:', transferError);
          // Continue even if transfer fails - user can still use the kiosk
        }
      }

      return NextResponse.json({
        success: true,
        transactionDigest: createResult.digest,
        kioskId: kioskId,
        ownerCapId: ownerCapId,
        sponsorAddress: sponsorAddress,
        message: 'Kiosk created with full gas sponsorship',
        note: ownerCapId !== 'Unknown' ? 'Ownership transferred to user' : 'Manual ownership transfer may be needed'
      });

    } catch (executeError) {
      console.error('Error executing kiosk creation:', executeError);
      return NextResponse.json({ 
        error: `Failed to create kiosk: ${executeError}` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: `Failed: ${error.message}` 
    }, { status: 500 });
  }
}