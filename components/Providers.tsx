'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { Toaster } from 'react-hot-toast';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers: FC<ProvidersProps> = ({ children }) => {
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet');
  }, []);

  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};