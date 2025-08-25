import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

// IMPORTANT: Replace this with your deployed program ID
const PROGRAM_ID = new PublicKey('9mqmA36UoZpPocB5dwkNkhtWz35TjvBQMBeGQSDsJGm7');

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState('0.01');
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<string>('');
  const [lastResult, setLastResult] = useState<'win' | 'lose' | null>(null);
  const [houseBalance, setHouseBalance] = useState(0);
  const [stats, setStats] = useState({ totalGames: 0, totalVolume: 0 });

  // Derive PDAs
  const [housePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('house')],
    PROGRAM_ID
  );

  const [gameAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('game_account')],
    PROGRAM_ID
  );

  useEffect(() => {
    if (publicKey) {
      updateBalance();
    }
    updateHouseBalance();
  }, [publicKey, connection]);

  const updateBalance = async () => {
    if (publicKey) {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    }
  };

  const updateHouseBalance = async () => {
    try {
      const bal = await connection.getBalance(housePDA);
      setHouseBalance(bal / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching house balance:', error);
    }
  };

  const initializeGame = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      setResult('Initializing game...');
      
      // This would normally use Anchor, but for simplicity we'll do a basic transaction
      const transaction = new Transaction();
      
      // You would add the actual instruction here using Anchor
      // For now, we'll just show the UI
      
      setResult('Game initialized! (In production, this would create the on-chain account)');
    } catch (error) {
      console.error('Error initializing game:', error);
      setResult('Failed to initialize game');
    }
  };

  const fundHouse = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      setResult('Funding house wallet...');
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: housePDA,
          lamports: 0.5 * LAMPORTS_PER_SOL, // Fund with 0.5 SOL
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      setResult('House funded successfully!');
      updateHouseBalance();
      updateBalance();
    } catch (error) {
      console.error('Error funding house:', error);
      setResult('Failed to fund house');
    }
  };

  const flipCoin = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first!');
      return;
    }

    const bet = parseFloat(betAmount);
    if (bet <= 0 || bet > balance) {
      alert('Invalid bet amount!');
      return;
    }

    setIsFlipping(true);
    setResult('');
    setLastResult(null);

    try {
      // Create coinflip animation
      setResult('Flipping coin...');
      
      // Simulate the flip (in production, this would call your program)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll do a simple client-side random
      // In production, this MUST be done on-chain
      const randomOutcome = Math.random() < 0.5 ? 'heads' : 'tails';
      const won = randomOutcome === choice;
      
      if (won) {
        setLastResult('win');
        setResult(`🎉 You WON! The coin landed on ${randomOutcome}. You won ${bet} SOL!`);
      } else {
        setLastResult('lose');
        setResult(`😢 You lost! The coin landed on ${randomOutcome}. Better luck next time!`);
      }
      
      // Update balances
      await updateBalance();
      await updateHouseBalance();
      
      // Update stats
      setStats(prev => ({
        totalGames: prev.totalGames + 1,
        totalVolume: prev.totalVolume + bet
      }));
      
    } catch (error) {
      console.error('Error flipping coin:', error);
      setResult('Transaction failed. Please try again.');
    } finally {
      setIsFlipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            🪙 Solana Coinflip
          </h1>
          <p className="text-xl text-gray-300">
            Double or nothing - Test your luck on Solana!
          </p>
        </div>

        {/* Wallet Button */}
        <div className="flex justify-center mb-8">
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        </div>

        {/* Main Game Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
            
            {publicKey ? (
              <>
                {/* Balance Display */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-gray-400 text-sm mb-1">Your Balance</p>
                    <p className="text-2xl font-bold text-white">{balance.toFixed(4)} SOL</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-gray-400 text-sm mb-1">House Balance</p>
                    <p className="text-2xl font-bold text-white">{houseBalance.toFixed(4)} SOL</p>
                  </div>
                </div>

                {/* Game Stats */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Total Games</p>
                      <p className="text-xl font-semibold text-white">{stats.totalGames}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Volume</p>
                      <p className="text-xl font-semibold text-white">{stats.totalVolume.toFixed(4)} SOL</p>
                    </div>
                  </div>
                </div>

                {/* Bet Amount Input */}
                <div className="mb-6">
                  <label className="block text-white mb-2 font-semibold">
                    Bet Amount (SOL)
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    step="0.01"
                    min="0.01"
                    max={balance.toString()}
                    disabled={isFlipping}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter bet amount..."
                  />
                </div>

                {/* Choice Selection */}
                <div className="mb-8">
                  <label className="block text-white mb-2 font-semibold">
                    Your Choice
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setChoice('heads')}
                      disabled={isFlipping}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        choice === 'heads'
                          ? 'bg-purple-600 text-white shadow-lg scale-105'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      } ${isFlipping ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      👑 HEADS
                    </button>
                    <button
                      onClick={() => setChoice('tails')}
                      disabled={isFlipping}
                      className={`p-4 rounded-xl font-bold transition-all ${
                        choice === 'tails'
                          ? 'bg-purple-600 text-white shadow-lg scale-105'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      } ${isFlipping ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      🪙 TAILS
                    </button>
                  </div>
                </div>

                {/* Coin Animation */}
                <div className="flex justify-center mb-8">
                  <div className={`w-32 h-32 relative ${isFlipping ? 'animate-spin' : ''}`}>
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-2xl flex items-center justify-center text-6xl">
                      {isFlipping ? '?' : choice === 'heads' ? '👑' : '🪙'}
                    </div>
                  </div>
                </div>

                {/* Flip Button */}
                <button
                  onClick={flipCoin}
                  disabled={isFlipping || parseFloat(betAmount) <= 0}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    isFlipping || parseFloat(betAmount) <= 0
                      ? 'bg-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg'
                  } text-white`}
                >
                  {isFlipping ? 'Flipping...' : 'FLIP COIN'}
                </button>

                {/* Admin Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <button
                    onClick={initializeGame}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Initialize Game
                  </button>
                  <button
                    onClick={fundHouse}
                    className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Fund House (0.5 SOL)
                  </button>
                </div>

                {/* Result Display */}
                {result && (
                  <div className={`mt-6 p-4 rounded-xl text-center font-semibold ${
                    lastResult === 'win' 
                      ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                      : lastResult === 'lose'
                      ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                      : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                  }`}>
                    {result}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-2xl text-white mb-4">
                  Connect your wallet to start playing!
                </p>
                <p className="text-gray-400">
                  Make sure you have some SOL in your wallet for betting
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
            <ol className="text-gray-300 space-y-2">
              <li>1. Connect your Solana wallet</li>
              <li>2. Choose your bet amount</li>
              <li>3. Select Heads or Tails</li>
              <li>4. Click "FLIP COIN" and wait for the result</li>
              <li>5. Win = 2x your bet, Lose = lose your bet</li>
            </ol>
            <p className="mt-4 text-yellow-400 text-sm">
              ⚠️ This is on Devnet - use test SOL only!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}