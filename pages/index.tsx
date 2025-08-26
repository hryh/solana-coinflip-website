import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useEffect, useState } from 'react';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const Coinflip = dynamic(
  () => import('../components/Coinflip').then((mod) => mod.Coinflip),
  { ssr: false }
);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>Solana Coinflip</title>
        <meta name="description" content="Double or nothing on Solana" />
      </Head>

      <main className="main-container">
        <div className="header">
          <h1>🎲 Solana Coinflip</h1>
          {mounted && <WalletMultiButton />}
        </div>

        <div className="game-wrapper">
          {mounted && <Coinflip />}
        </div>

        <div className="instructions">
          <h3>How to Play:</h3>
          <ol>
            <li>Connect your wallet (Devnet)</li>
            <li>Enter bet amount</li>
            <li>Choose Heads or Tails</li>
            <li>Approve transaction</li>
            <li>Win double or lose!</li>
          </ol>
        </div>
      </main>
    </>
  );
}
