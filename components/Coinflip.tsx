import React, { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { calculateFee } from '../lib/fee'; // adjust path if your file is elsewhere

export function Coinflip() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [betAmount, setBetAmount] = useState<string>('0.1');
  const [isFlipping, setIsFlipping] = useState(false);
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);

  // Optional: derive a user-friendly tip or placeholder
  const potentialWin = (() => {
    const amt = parseFloat(betAmount);
    if (Number.isFinite(amt) && amt > 0) {
      return (amt * 2).toFixed(2);
    }
    return '0.00';
  })();

  // Replace this with your real VRF/provable randomness call in production
  const getRandomOutcome = useCallback(async (): Promise<boolean> => {
    // Simulated 50/50 outcome
    return new Promise((resolve) => {
      setTimeout(() => resolve(Math.random() < 0.5), 300);
    });
  }, []);

  const flipCoin = useCallback(
    async (userChoice: 'heads' | 'tails') => {
      // Ensure a wallet is connected (sender)
      if (!publicKey) {
        toast.error('Please connect your wallet first!');
        return;
      }

      // UI: indicate the chosen side and start flipping
      setChoice(userChoice);
      setIsFlipping(true);

      try {
        // Validate bet amount
        const amount = parseFloat(betAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
          toast.error('Please enter a valid bet amount');
          setIsFlipping(false);
          return;
        }

        // Balance check (SOL)
        const balance = await connection.getBalance(publicKey);
        const balanceInSol = balance / LAMPORTS_PER_SOL;
        if (balanceInSol < amount) {
          toast.error(`Insufficient balance! You have ${balanceInSol.toFixed(4)} SOL`);
          setIsFlipping(false);
          return;
        }

        // Resolve recipient from environment variable
        const envBetReceiver = process.env.NEXT_PUBLIC_BET_RECEIVER;
        if (!envBetReceiver) {
          console.error('NEXT_PUBLIC_BET_RECEIVER is not set.');
          toast.error('Bet recipient not configured. Please set NEXT_PUBLIC_BET_RECEIVER in your .env.local.');
          setIsFlipping(false);
          return;
        }
        let recipientPubkey: PublicKey;
        try {
          recipientPubkey = new PublicKey(envBetReceiver);
        } catch (e) {
          console.error('Invalid NEXT_PUBLIC_BET_RECEIVER public key:', envBetReceiver, e);
          toast.error('Bet recipient public key is invalid.');
          setIsFlipping(false);
          return;
        }

        // Do not allow sending to self
        if (recipientPubkey.equals(publicKey)) {
          toast.error('Recipient cannot be the same as sender.');
          setIsFlipping(false);
          return;
        }

        // Build a transfer instruction (lamports)
        // NOTE: In this UI, the bet amount would be held by the contract or treasury;
        // Here we simulate a transfer just to demonstrate the flow.
        const lamports = Math.round(amount * LAMPORTS_PER_SOL);

        const transferIx = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports,
        });

        // Build and send the transaction
        const tx = new Transaction().add(transferIx);
        tx.feePayer = publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;

        // Send via wallet (triggers the on-device approval UI)
        const signature = await sendTransaction(tx, connection);

        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');

        // On-chain transfer succeeded, determine outcome (demo)
        const outcomeWin = await getRandomOutcome();
        const { fee, payoutAfterFee } = calculateFee(Math.round(amount));
        const payoutToUser = outcomeWin ? payoutAfterFee : 0;

        if (outcomeWin) {
          toast.success(
            <div>
              <strong>🎉 You won!</strong>
              <br />
              The coin landed on {userChoice}
              <br />
              Payout: {payoutToUser.toFixed(4)} SOL (after {fee} fee)
            </div>
          );
        } else {
          toast.error(
            <div>
              <strong>😔 You lost!</strong>
              <br />
              The coin landed on {outcomeWin ? userChoice : userChoice === 'heads' ? 'tails' : 'heads'}
              <br />
              Fee collected: {fee} SOL
            </div>
          );
        }

        // Optional: reset or update UI with actual payout flow
      } catch (error: any) {
        console.error('Flip error:', error);

        // Normalize error messaging
        const message = error?.message ?? 'Something went wrong while processing the transaction!';
        toast.error(message);
      } finally {
        setIsFlipping(false);
        setChoice(null);
      }
    },
    // dependencies
    [publicKey, connection, betAmount, sendTransaction]
  );

  return (
    <div className="game-container">
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {publicKey ? '🎯 Ready to Play!' : '🔗 Connect Wallet to Start'}
      </h2>

      <div className="coin-display" aria-label="coin">
        <div className={`coin ${isFlipping ? 'spinning' : ''}`}>
          {isFlipping ? '🪙' : choice === 'heads' ? '👑 Heads' : choice === 'tails' ? '🦅 Tails' : '🪙'}
        </div>
      </div>

      <div className="input-group" style={{ marginTop: '1rem' }}>
        <label htmlFor="bet-amount">Bet Amount (SOL)</label>
        <input
          id="bet-amount"
          type="number"
          step="0.1"
          min="0.01"
          max="100"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          disabled={!publicKey || isFlipping}
          placeholder="0.1"
        />
        <span className="win-amount">
          Potential win: {potentialWin} SOL
        </span>
      </div>

      <div className="button-group" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        <button
          onClick={() => flipCoin('heads')}
          disabled={!publicKey || isFlipping}
        >
          {isFlipping && choice === 'heads' ? 'Flipping...' : '👑 Heads'}
        </button>
        <button
          onClick={() => flipCoin('tails')}
          disabled={!publicKey || isFlipping}
        >
          {isFlipping && choice === 'tails' ? 'Flipping...' : '🦅 Tails'}
        </button>
      </div>

      {!publicKey && (
        <p className="warning" style={{ textAlign: 'center', marginTop: '1rem' }}>
          ⚠️ Connect your wallet to start playing!
        </p>
      )}
      
      {publicKey && (
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.8, textAlign: 'center' }}>
          <p>📍 Connected to Devnet</p>
          <p>💡 This is a demo — no real SOL is used</p>
        </div>
      )}
    </div>
  );
}