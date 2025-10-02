import { useState, useEffect } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';

// REPLACE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS
const MODULE_ADDRESS = "0x6efe0654546367eb84ca823a08b1e33be57f892f9b66d7853b7100ed5c158185";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

function App() {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [balance, setBalance] = useState(null);

  const getBalance = async () => {
    if (account && account.address) {
      try {
        const accountAddress = typeof account.address === 'string' 
          ? account.address 
          : account.address.toString();
        
        const resources = await aptos.getAccountCoinsData({ accountAddress });
        const aptBalance = resources.find(coin => coin.asset_type.includes('AptosCoin'));
        setBalance(aptBalance ? (aptBalance.amount / 100000000).toFixed(2) : '0');
      } catch (error) {
        console.error('Balance fetch error:', error);
      }
    }
  };

  useEffect(() => {
    if (connected && account) {
      getBalance();
    }
  }, [connected, account]);

  const playGame = async () => {
    if (!connected || !account) {
      alert('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const accountAddress = typeof account.address === 'string' 
        ? account.address 
        : account.address.toString();

      const response = await signAndSubmitTransaction({
        sender: accountAddress,
        data: {
          function: `${MODULE_ADDRESS}::dice_game::play`,
          typeArguments: [],
          functionArguments: [],
        },
      });

      console.log('Transaction submitted:', response.hash);

      // Wait for transaction with better error handling
      try {
        await aptos.waitForTransaction({ 
          transactionHash: response.hash,
          options: {
            timeoutSecs: 30,
            checkSuccess: true
          }
        });
      } catch (waitError) {
        console.log('Wait error, but transaction may still succeed:', waitError);
      }

      // Wait a bit for blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate dice roll result (in production, read from blockchain events)
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      const won = diceRoll === 6;
      
      setResult({
        dice: diceRoll,
        won: won,
        message: won ? '🎉 YOU WON 2 APT!' : `😢 You rolled ${diceRoll}. Try again!`,
        txHash: response.hash
      });

      // Refresh balance after delay
      setTimeout(() => getBalance(), 3000);
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Transaction failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 10px 0', color: '#333' }}>
          🎲 Aptos Dice Game
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Roll a 6 to win 2 APT!
        </p>

        {/* Wallet Connection */}
        <div style={{ marginBottom: '30px' }}>
          <WalletSelector />
        </div>

        {connected && account && (
          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              Connected Address
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#333', 
              wordBreak: 'break-all',
              marginBottom: '10px'
            }}>
              {typeof account.address === 'string' 
                ? account.address 
                : account.address.toString()}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Your Balance</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
              {balance ? `${balance} APT` : 'Loading...'}
            </div>
          </div>
        )}

        <div style={{
          background: '#fff3cd',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '2px solid #ffc107'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            💰 Entry Fee: 1 APT
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
            🏆 Win: 2 APT (if you roll 6)
          </div>
        </div>

        {result && (
          <div style={{
            background: result.won ? '#d4edda' : '#f8d7da',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: `2px solid ${result.won ? '#28a745' : '#dc3545'}`
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>
              🎲 {result.dice}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
              {result.message}
            </div>
            <a 
              href={`https://explorer.aptoslabs.com/txn/${result.txHash}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: '#667eea',
                textDecoration: 'underline'
              }}
            >
              View on Explorer
            </a>
          </div>
        )}

        <button
          onClick={playGame}
          disabled={!connected || loading}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            background: connected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
            border: 'none',
            borderRadius: '10px',
            cursor: connected ? 'pointer' : 'not-allowed',
            transition: 'transform 0.2s',
            opacity: loading ? 0.7 : 1
          }}
          onMouseOver={(e) => connected && !loading && (e.target.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          {loading ? '🎲 Rolling...' : connected ? '🎲 ROLL DICE (1 APT)' : '⚠️ Connect Wallet First'}
        </button>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: '#e3f2fd',
          borderRadius: '10px',
          fontSize: '14px',
          color: '#1976d2'
        }}>
          <strong>How to Play:</strong>
          <ol style={{ textAlign: 'left', marginTop: '10px', paddingLeft: '20px' }}>
            <li>Install Petra Wallet extension</li>
            <li>Connect your wallet above</li>
            <li>Get testnet APT from <a href="https://aptoslabs.com/testnet-faucet" target="_blank" rel="noopener noreferrer">faucet</a></li>
            <li>Click "ROLL DICE" to play (costs 1 APT)</li>
            <li>Roll a 6 to win 2 APT! 🎉</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;