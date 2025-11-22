import { useState, useEffect } from 'react';
import { SuiClient } from '@onelabs/sui/client';

interface WalletState {
  connected: boolean;
  address: string | null;
  client: SuiClient | null;
}

// OneWallet injection interface (based on Wallet Standard)
interface OneWallet {
  name: string;
  icon: string;
  version: string;
  accounts: {
    address: string;
    publicKey: Uint8Array;
    chains: string[];
  }[];
  features: {
    [key: string]: {
      version: string;
    };
  };
  connect: () => Promise<{ accounts: { address: string }[] }>;
  disconnect: () => Promise<void>;
  signTransaction: (input: { transaction: string }) => Promise<{ signature: string }>;
}

declare global {
  interface Window {
    onechain?: OneWallet;           // ✅ OneWallet injects here!
    onechainWallet?: OneWallet;     // ✅ OneWallet also injects here!
    onewallet?: OneWallet;
    oneWallet?: OneWallet;
    OneWallet?: OneWallet;
    suiWallet?: OneWallet;
  }
}

// Helper to get the wallet instance from window
const getWallet = (): any => {
  if (typeof window === 'undefined') return null;
  
  // Check Wallet Standard (most common for Sui-based wallets)
  if ((window.navigator as any).wallets) {
    const wallets = (window.navigator as any).wallets;
    console.log('Wallet Standard wallets found:', wallets.map((w: any) => w.name));
    
    // Try to find OneWallet by name
    const oneWallet = wallets.find((w: any) => 
      w.name?.toLowerCase().includes('one') || 
      w.name?.toLowerCase().includes('onewallet') ||
      w.name?.toLowerCase().includes('sui')
    );
    if (oneWallet) {
      console.log('Found wallet via Wallet Standard:', oneWallet.name);
      return oneWallet;
    }
    // If no specific match, return first wallet (might be OneWallet)
    if (wallets.length > 0) {
      console.log('Using first available wallet:', wallets[0].name);
      return wallets[0];
    }
  }
  
  // Check multiple possible wallet injection names
  // Based on console logs, OneWallet injects as 'onechain' and 'onechainWallet'
  const checks = [
    (window as any).onechain,           // ✅ Found in console!
    (window as any).onechainWallet,     // ✅ Found in console!
    (window as any).onewallet,
    (window as any).oneWallet,
    (window as any).OneWallet,
    (window as any).suiWallet,
    (window as any).wallet,
    (window as any).__ONE_WALLET__,
    (window as any).__oneWallet__,
  ];
  
  for (const check of checks) {
    if (check) {
      console.log('Found wallet via direct property:', check);
      return check;
    }
  }
  
  return null;
};

// Helper to get the Sui/OneChain provider from the wallet
const getSuiProvider = (wallet: any): any => {
  if (!wallet) return null;
  
  // Check if it's a multi-chain wallet with sui property
  if (wallet.sui) {
    console.log('Found Sui provider in wallet.sui');
    return wallet.sui;
  }
  
  // If wallet itself is the Sui provider, return it
  return wallet;
};

// Storage keys for persisting wallet state
const WALLET_STORAGE_KEY = 'onechain_wallet_connected';
const WALLET_ADDRESS_KEY = 'onechain_wallet_address';

export const useOneWallet = () => {
  // Load persisted state from localStorage
  const loadPersistedState = (): { connected: boolean; address: string | null } => {
    if (typeof window === 'undefined') return { connected: false, address: null };
    
    try {
      const connected = localStorage.getItem(WALLET_STORAGE_KEY) === 'true';
      const address = localStorage.getItem(WALLET_ADDRESS_KEY);
      return { connected, address };
    } catch {
      return { connected: false, address: null };
    }
  };

  const persistedState = loadPersistedState();
  
  const [walletState, setWalletState] = useState<WalletState>({
    connected: persistedState.connected,
    address: persistedState.address,
    client: null,
  });
  const [walletAvailable, setWalletAvailable] = useState(false);

  // Initialize client for OneChain Testnet
  useEffect(() => {
    const client = new SuiClient({
      url: 'https://rpc-testnet.onelabs.cc:443',
    });
    setWalletState((prev) => ({ ...prev, client }));
  }, []);

  // Check for wallet availability and connection
  useEffect(() => {
    const checkWallet = () => {
      const wallet = getWallet();
      
      if (wallet) {
        setWalletAvailable(true);
        console.log('✅ Wallet detected:', wallet);
        
        // Get Sui provider from multi-chain wallet
        const suiProvider = getSuiProvider(wallet);
        
        if (suiProvider) {
          console.log('✅ Sui provider found:', suiProvider);
          console.log('Sui provider keys:', Object.keys(suiProvider));
          
          // Check if already connected (check both wallet.accounts and suiProvider.accounts)
          const accounts = suiProvider.accounts || wallet.accounts;
          if (accounts && accounts.length > 0) {
            const address = accounts[0].address || accounts[0];
            const addressStr = typeof address === 'string' ? address : String(accounts[0]);
            setWalletState((prev) => ({
              ...prev,
              connected: true,
              address: addressStr,
            }));
            // Persist to localStorage
            localStorage.setItem(WALLET_STORAGE_KEY, 'true');
            localStorage.setItem(WALLET_ADDRESS_KEY, addressStr);
            console.log('✅ Wallet already connected:', addressStr);
          } else {
            // Try to get accounts using getAccounts method
            if (typeof suiProvider.getAccounts === 'function') {
              suiProvider.getAccounts()
                .then((accs: any[]) => {
                  if (accs && accs.length > 0) {
                    const address = accs[0].address || accs[0];
                    const addressStr = typeof address === 'string' ? address : String(accs[0]);
                    setWalletState((prev) => ({
                      ...prev,
                      connected: true,
                      address: addressStr,
                    }));
                    // Persist to localStorage
                    localStorage.setItem(WALLET_STORAGE_KEY, 'true');
                    localStorage.setItem(WALLET_ADDRESS_KEY, addressStr);
                    console.log('✅ Wallet connected via getAccounts:', addressStr);
                  }
                })
                .catch((err: any) => {
                  console.log('getAccounts failed:', err);
                });
            }
          }
        } else {
          // Fallback: check wallet.accounts directly
          if (wallet.accounts && wallet.accounts.length > 0) {
            const address = wallet.accounts[0].address || wallet.accounts[0];
            const addressStr = typeof address === 'string' ? address : String(wallet.accounts[0]);
            setWalletState((prev) => ({
              ...prev,
              connected: true,
              address: addressStr,
            }));
            // Persist to localStorage
            localStorage.setItem(WALLET_STORAGE_KEY, 'true');
            localStorage.setItem(WALLET_ADDRESS_KEY, addressStr);
            console.log('✅ Wallet already connected:', addressStr);
          }
        }
      } else {
        setWalletAvailable(false);
        console.log('❌ No wallet detected');
      }
    };

    // Check immediately
    checkWallet();

    // Check on window load (in case wallet injects after page load)
    const handleLoad = () => {
      console.log('Window loaded, checking for wallet...');
      checkWallet();
    };
    window.addEventListener('load', handleLoad);

    // Poll for wallet installation (check every 500ms for first 10 seconds, then every 2 seconds)
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      if (pollCount <= 20) {
        // Check every 500ms for first 10 seconds
        checkWallet();
      } else if (pollCount % 4 === 0) {
        // Then check every 2 seconds
        checkWallet();
      }
    }, 500);

    // Listen for wallet events
    const handleAccountsChanged = () => {
      console.log('Account change event detected, rechecking wallet...');
      const wallet = getWallet();
      const suiProvider = wallet ? getSuiProvider(wallet) : null;
      
      if (suiProvider) {
        // Check accounts on Sui provider
        if (typeof suiProvider.getAccounts === 'function') {
          suiProvider.getAccounts()
            .then((accounts: any[]) => {
              if (accounts && accounts.length > 0) {
                const address = accounts[0].address || accounts[0];
                const addressStr = typeof address === 'string' ? address : String(address);
                setWalletState((prev) => ({
                  ...prev,
                  connected: true,
                  address: addressStr,
                }));
                // Persist to localStorage
                localStorage.setItem(WALLET_STORAGE_KEY, 'true');
                localStorage.setItem(WALLET_ADDRESS_KEY, addressStr);
                console.log('✅ Wallet reconnected:', addressStr);
              } else {
                setWalletState((prev) => ({
                  ...prev,
                  connected: false,
                  address: null,
                }));
                // Clear persisted state
                localStorage.removeItem(WALLET_STORAGE_KEY);
                localStorage.removeItem(WALLET_ADDRESS_KEY);
                console.log('❌ Wallet disconnected');
              }
            })
            .catch((err: any) => {
              console.log('getAccounts in handler failed:', err);
            });
        } else if (suiProvider.accounts && suiProvider.accounts.length > 0) {
          const address = suiProvider.accounts[0].address || suiProvider.accounts[0];
          const addressStr = typeof address === 'string' ? address : String(address);
          setWalletState((prev) => ({
            ...prev,
            connected: true,
            address: addressStr,
          }));
          localStorage.setItem(WALLET_STORAGE_KEY, 'true');
          localStorage.setItem(WALLET_ADDRESS_KEY, addressStr);
        } else {
          setWalletState((prev) => ({
            ...prev,
            connected: false,
            address: null,
          }));
          localStorage.removeItem(WALLET_STORAGE_KEY);
          localStorage.removeItem(WALLET_ADDRESS_KEY);
        }
      } else if (wallet) {
        if (wallet.accounts && wallet.accounts.length > 0) {
          const address = wallet.accounts[0].address || wallet.accounts[0];
          const addressStr = typeof address === 'string' ? address : String(address);
          setWalletState((prev) => ({
            ...prev,
            connected: true,
            address: addressStr,
          }));
          localStorage.setItem(WALLET_STORAGE_KEY, 'true');
          localStorage.setItem(WALLET_ADDRESS_KEY, addressStr);
        } else {
          setWalletState((prev) => ({
            ...prev,
            connected: false,
            address: null,
          }));
          localStorage.removeItem(WALLET_STORAGE_KEY);
          localStorage.removeItem(WALLET_ADDRESS_KEY);
        }
      }
    };

    // Try multiple event names
    window.addEventListener('onewallet#accountsChanged', handleAccountsChanged);
    window.addEventListener('oneWallet#accountsChanged', handleAccountsChanged);
    window.addEventListener('accountsChanged', handleAccountsChanged);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('onewallet#accountsChanged', handleAccountsChanged);
      window.removeEventListener('oneWallet#accountsChanged', handleAccountsChanged);
      window.removeEventListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const installWallet = () => {
    // Open OneWallet installation page
    // Update this URL with the actual OneWallet installation link
    window.open('https://onelabs.cc', '_blank');
  };

  const connect = async () => {
    try {
      const wallet = getWallet();
      
      if (!wallet) {
        console.log('❌ Wallet not found, opening installation page...');
        installWallet();
        return;
      }

      console.log('🔌 Connecting to wallet...', wallet);
      
      // Get Sui provider from multi-chain wallet
      const suiProvider = getSuiProvider(wallet);
      
      if (!suiProvider) {
        console.error('❌ Sui provider not found in wallet');
        alert('Sui/OneChain provider not found in wallet. Please check console for details.');
        return;
      }

      console.log('🔌 Using Sui provider:', suiProvider);
      console.log('Sui provider keys:', Object.keys(suiProvider));
      
      // Log all properties and methods
      const allKeys = Object.keys(suiProvider);
      const methods = allKeys.filter(key => typeof suiProvider[key] === 'function');
      const properties = allKeys.filter(key => typeof suiProvider[key] !== 'function');
      console.log('Available methods:', methods);
      console.log('Available properties:', properties);
      
      // Try different connection patterns on the Sui provider
      let connected = false;
      
      // Pattern 1: connect method on Sui provider
      if (typeof suiProvider.connect === 'function') {
        console.log('Trying suiProvider.connect()...');
        try {
          const result = await suiProvider.connect();
          console.log('Connect result:', result);
          
          // Handle different response formats
          let address = null;
          if (result?.accounts && result.accounts.length > 0) {
            address = result.accounts[0].address || result.accounts[0];
          } else if (result?.address) {
            address = result.address;
          } else if (Array.isArray(result) && result.length > 0) {
            address = result[0].address || result[0];
          }
          
          if (address) {
            const addressStr = typeof address === 'string' ? address : String(address);
            setWalletState((prev) => ({
              ...prev,
              connected: true,
              address: addressStr,
            }));
            // Persist to localStorage
            localStorage.setItem(WALLET_STORAGE_KEY, 'true');
            localStorage.setItem(WALLET_ADDRESS_KEY, addressStr);
            console.log('✅ Wallet connected:', addressStr);
            connected = true;
          }
        } catch (e) {
          console.log('suiProvider.connect() failed:', e);
        }
      }
      
      // Pattern 2: getAccounts (maybe already connected)
      if (!connected && typeof suiProvider.getAccounts === 'function') {
        console.log('Trying suiProvider.getAccounts()...');
        try {
          const accounts = await suiProvider.getAccounts();
          console.log('Accounts:', accounts);
          if (accounts && accounts.length > 0) {
            const address = accounts[0].address || accounts[0];
            const addressStr = typeof address === 'string' ? address : String(address);
            setWalletState((prev) => ({
              ...prev,
              connected: true,
              address: addressStr,
            }));
            // Persist to localStorage
            localStorage.setItem(WALLET_STORAGE_KEY, 'true');
            localStorage.setItem(WALLET_ADDRESS_KEY, addressStr);
            console.log('✅ Wallet already connected:', addressStr);
            connected = true;
          }
        } catch (e) {
          console.log('getAccounts failed:', e);
        }
      }
      
      // Pattern 3: Check if accounts already exist in suiProvider
      if (!connected && suiProvider.accounts && suiProvider.accounts.length > 0) {
        console.log('Sui provider already has accounts, using them...');
        const address = suiProvider.accounts[0].address || suiProvider.accounts[0];
        setWalletState((prev) => ({
          ...prev,
          connected: true,
          address: typeof address === 'string' ? address : String(address),
        }));
        console.log('✅ Wallet already connected:', address);
        connected = true;
      }
      
      // Pattern 4: Wallet Standard on Sui provider
      if (!connected && suiProvider.features && suiProvider.features['standard:connect']) {
        console.log('Trying Wallet Standard connect on Sui provider...');
        try {
          const connectFeature = suiProvider.features['standard:connect'];
          const result = await connectFeature.connect();
          if (result.accounts && result.accounts.length > 0) {
            const address = result.accounts[0].address || result.accounts[0];
            setWalletState((prev) => ({
              ...prev,
              connected: true,
              address: typeof address === 'string' ? address : String(address),
            }));
            console.log('✅ Wallet connected via Wallet Standard:', address);
            connected = true;
          }
        } catch (e) {
          console.log('Wallet Standard connect failed:', e);
        }
      }
      
      if (!connected) {
        console.error('❌ Could not connect wallet. Available methods:', methods);
        console.error('Sui provider object:', suiProvider);
        alert(`Could not connect wallet. Available methods: ${methods.join(', ') || 'none'}. Please check console for details.`);
      }
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const disconnect = async () => {
    try {
      const wallet = getWallet();
      if (!wallet) {
        console.log('No wallet found to disconnect');
        setWalletState((prev) => ({
          ...prev,
          connected: false,
          address: null,
        }));
        return;
      }

      // Get Sui provider from multi-chain wallet
      const suiProvider = getSuiProvider(wallet);
      
      if (suiProvider && typeof suiProvider.disconnect === 'function') {
        console.log('Disconnecting via Sui provider...');
        await suiProvider.disconnect();
        setWalletState((prev) => ({
          ...prev,
          connected: false,
          address: null,
        }));
        // Clear persisted state
        localStorage.removeItem(WALLET_STORAGE_KEY);
        localStorage.removeItem(WALLET_ADDRESS_KEY);
        console.log('✅ Wallet disconnected');
      } else if (typeof wallet.disconnect === 'function') {
        // Fallback: try wallet.disconnect directly
        console.log('Disconnecting via wallet directly...');
        await wallet.disconnect();
        setWalletState((prev) => ({
          ...prev,
          connected: false,
          address: null,
        }));
        // Clear persisted state
        localStorage.removeItem(WALLET_STORAGE_KEY);
        localStorage.removeItem(WALLET_ADDRESS_KEY);
        console.log('✅ Wallet disconnected');
      } else {
        // If no disconnect method, just clear the state
        console.log('No disconnect method available, clearing state...');
        setWalletState((prev) => ({
          ...prev,
          connected: false,
          address: null,
        }));
        // Clear persisted state
        localStorage.removeItem(WALLET_STORAGE_KEY);
        localStorage.removeItem(WALLET_ADDRESS_KEY);
        console.log('✅ Wallet state cleared');
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      // Even if disconnect fails, clear the state
      setWalletState((prev) => ({
        ...prev,
        connected: false,
        address: null,
      }));
    }
  };

  const isWalletInstalled = () => {
    return walletAvailable;
  };

  // Debug function to check what's available on window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const debugWallet = () => {
        console.log('=== OneWallet Detection Debug ===');
        console.log('window.onechain:', (window as any).onechain);           // ✅ Check this!
        console.log('window.onechainWallet:', (window as any).onechainWallet); // ✅ Check this!
        console.log('window.onewallet:', (window as any).onewallet);
        console.log('window.oneWallet:', (window as any).oneWallet);
        console.log('window.OneWallet:', (window as any).OneWallet);
        console.log('window.suiWallet:', (window as any).suiWallet);
        console.log('window.wallet:', (window as any).wallet);
        console.log('window.navigator.wallets:', (window.navigator as any).wallets);
        
        // Check all wallet-related keys
        const walletKeys = Object.keys(window).filter(key => 
          key.toLowerCase().includes('wallet') || 
          key.toLowerCase().includes('one') ||
          key.toLowerCase().includes('sui')
        );
        console.log('Wallet-related window keys:', walletKeys);
        
        // Check Wallet Standard
        if ((window.navigator as any).wallets) {
          console.log('Wallet Standard wallets found:', (window.navigator as any).wallets.map((w: any) => w.name));
        }
        
        const wallet = getWallet();
        console.log('Detected wallet:', wallet);
        console.log('Wallet available:', !!wallet);
        
        // Show all available providers
        if (wallet) {
          console.log('=== Available Blockchain Providers ===');
          const providers = [];
          
          // Check each blockchain provider
          if (wallet.sui) {
            providers.push('Sui/OneChain');
            console.log('✅ Sui/OneChain provider:', wallet.sui);
            console.log('   Methods:', Object.keys(wallet.sui).filter(k => typeof wallet.sui[k] === 'function'));
          }
          if (wallet.cosmos) {
            providers.push('Cosmos');
            console.log('✅ Cosmos provider:', wallet.cosmos);
          }
          if (wallet.ethereum) {
            providers.push('Ethereum');
            console.log('✅ Ethereum provider:', wallet.ethereum);
          }
          if (wallet.bitcoin) {
            providers.push('Bitcoin');
            console.log('✅ Bitcoin provider:', wallet.bitcoin);
          }
          if (wallet.aptos) {
            providers.push('Aptos');
            console.log('✅ Aptos provider:', wallet.aptos);
          }
          if (wallet.iota) {
            providers.push('IOTA');
            console.log('✅ IOTA provider:', wallet.iota);
          }
          if (wallet.common) {
            providers.push('Common');
            console.log('✅ Common provider:', wallet.common);
          }
          
          // Check providers object
          if (wallet.providers) {
            console.log('✅ Additional providers:', Object.keys(wallet.providers));
            providers.push(...Object.keys(wallet.providers));
          }
          
          console.log('📋 All available providers:', providers);
          console.log('Total providers:', providers.length);
        }
        
        return wallet;
      };
      
      // Run debug immediately
      debugWallet();
      
      // Expose debug function globally for manual checking
      (window as any).debugOneWallet = debugWallet;
      (window as any).getWalletProviders = () => {
        const wallet = getWallet();
        if (!wallet) return [];
        
        const providers = [];
        if (wallet.sui) providers.push('Sui/OneChain');
        if (wallet.cosmos) providers.push('Cosmos');
        if (wallet.ethereum) providers.push('Ethereum');
        if (wallet.bitcoin) providers.push('Bitcoin');
        if (wallet.aptos) providers.push('Aptos');
        if (wallet.iota) providers.push('IOTA');
        if (wallet.common) providers.push('Common');
        if (wallet.providers) {
          providers.push(...Object.keys(wallet.providers).map(p => `Provider: ${p}`));
        }
        return providers;
      };
      
      console.log('💡 Tip: Run debugOneWallet() in console to manually check for wallet');
      console.log('💡 Tip: Run getWalletProviders() in console to see all available providers');
    }
  }, []);

  return {
    ...walletState,
    connect,
    disconnect,
    installWallet,
    isWalletInstalled,
  };
};

