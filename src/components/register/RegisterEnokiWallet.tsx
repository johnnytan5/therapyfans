'use client';

import { useEffect } from 'react';
import { registerEnokiWallets } from '@mysten/enoki';
import { SuiClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';

export function RegisterEnokiWallet() {
	useEffect(() => {
		const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });

		registerEnokiWallets({
			client: suiClient,
			network: 'devnet',
			apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
			providers: {
				google: {
					clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
				},
				facebook: {
					clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID!,
				},
				twitch: {
					clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!,
				},
			},
		});
	}, []);

	return null;
}