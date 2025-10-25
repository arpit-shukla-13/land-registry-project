// src/App.jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Ensure your ABI file is correctly named and located at client/src/LandRegistry.json
import abi from "./LandRegistry.json"; 
import './App.css';

// Import your page components
import Register from "./pages/Register"; 
import Home from "./pages/Home";
import Transfer from "./pages/Transfer";

function App() {
  const [account, setAccount] = useState(null); // This holds the connected account address
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null); 
  const [signer, setSigner] = useState(null);

  // --- IMPORTANT: Replace this with your LATEST deployed contract address ---
  // You get this address from the 'npx hardhat run scripts/deploy.js --network localhost' command
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

  // Load provider, signer, and contract when the component mounts or contractAddress changes
  useEffect(() => {
    const initDapp = async () => {
      if (!window.ethereum) {
        alert("MetaMask not detected. Please install MetaMask to use this dApp.");
        console.error("MetaMask is not installed!");
        return;
      }

      try {
        // Initialize Provider with ENS disabled for local networks
        // 'any' tells ethers.js to accept any network. For a specific local network:
        // { chainId: 31337, name: 'localhost' }
        const newProvider = new ethers.BrowserProvider(window.ethereum, 'any', { ensAddress: null });
        setProvider(newProvider);

        // Request accounts and set the connected account
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const newSigner = await newProvider.getSigner(accounts[0]); // Get signer for the connected account
          setSigner(newSigner);

          // Initialize contract instance
          const contractInstance = new ethers.Contract(contractAddress, abi.abi, newSigner);
          setContract(contractInstance);
        } else {
          setAccount(null);
          setSigner(null);
          setContract(null);
        }

        // Listen for accounts changes
        window.ethereum.on("accountsChanged", (newAccounts) => {
          if (newAccounts.length > 0) {
            setAccount(newAccounts[0]);
            newProvider.getSigner(newAccounts[0]).then(setSigner); // Update signer for new account
          } else {
            setAccount(null);
            setSigner(null);
            setContract(null); // Reset contract if no account is connected
          }
        });

        // Listen for network changes (optional, but good for robustness)
        window.ethereum.on("chainChanged", () => {
          window.location.reload(); // Reload page if network changes
        });

      } catch (error) { 
        console.error("Error initializing DApp:", error); 
        alert("Failed to connect to MetaMask or load contract. Ensure MetaMask is unlocked and refresh.");
        setAccount(null);
        setSigner(null);
        setContract(null);
      }
    };

    initDapp();

    // Cleanup function for event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {}); // Empty function to remove listener
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };

  }, [contractAddress]); // Re-run if contractAddress changes (though it's constant here)


  return (
    <Router>
      <div className="App">
        <h1>Land Registry System</h1>
        {/* Using 'account' state variable for display */}
        <p><strong>Connected Account:</strong> {account ? account : "Not Connected"}</p>
        
        {/* Optional: Add a connect wallet button if not automatically connected */}
        {!account && (
          <button 
            onClick={() => window.ethereum && window.ethereum.request({ method: "eth_requestAccounts" })} 
            className="connect-button"
          >
            Connect Wallet
          </button>
        )}
        
        <hr />

        <nav>
          <Link to="/">Home</Link> | <Link to="/register">Register New Land</Link> | <Link to="/transfer">Transfer Ownership</Link>
        </nav>
        <hr />

        <Routes>
          {/* Pass 'contract' to Home */}
<Route path="/" element={<Home contract={contract} provider={provider} signer={signer} />} />
          <Route path="/register" element={<Register contract={contract} connectedAccount={account} provider={provider} signer={signer} />} />
          <Route path="/transfer" element={<Transfer contract={contract} connectedAccount={account} provider={provider} signer={signer} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;