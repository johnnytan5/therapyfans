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
	testnet: { url: getFullnodeUrl('testnet') },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent refetch on window focus to avoid wallet disconnections
      refetchOnWindowFocus: false,
      // Keep data fresh for longer to prevent unnecessary re-fetches
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache longer
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      // Retry failed requests
      retry: 2,
      // Reduce retry delay
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});

interface WalletProvidersProps {
	children: React.ReactNode;
}

export function WalletProviders({ children }: WalletProvidersProps) {
	return (
		<QueryClientProvider client={queryClient}>
			<SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
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