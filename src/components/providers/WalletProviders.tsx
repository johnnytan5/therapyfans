'use client';

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterEnokiWallet } from '@/components/register/RegisterEnokiWallet';
import { ClientAuthProvider } from '@/components/providers/ClientAuthProvider';

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
	localnet: { url: getFullnodeUrl('localnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
	devnet: { url: getFullnodeUrl('devnet') },
});

const queryClient = new QueryClient();

interface WalletProvidersProps {
	children: React.ReactNode;
}

export function WalletProviders({ children }: WalletProvidersProps) {
	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
				<RegisterEnokiWallet />
				<WalletProvider>
					<ClientAuthProvider>
						{children}
					</ClientAuthProvider>
				</WalletProvider>
			</SuiClientProvider>
		</QueryClientProvider>
	);
}