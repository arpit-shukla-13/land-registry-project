// src/App.jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import abi from "./LandRegistry.json"; 
import './App.css';

// Import your page components
import Register from "./pages/Register"; 
import Home from "./pages/Home";
import Transfer from "./pages/Transfer";
import ViewLand from "./pages/ViewLand"; // <-- Import ViewLand component

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null); 
  const [signer, setSigner] = useState(null);
  

  // --- IMPORTANT: Replace this with your LATEST deployed contract address ---
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

  useEffect(() => {
    const initDapp = async () => {
      if (!window.ethereum) {
        alert("MetaMask not detected. Please install MetaMask to use this dApp.");
        console.error("MetaMask is not installed!");
        return;
      }

      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum, 'any', { ensAddress: null });
        setProvider(newProvider);

        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const newSigner = await newProvider.getSigner(accounts[0]);
          setSigner(newSigner);

          const contractInstance = new ethers.Contract(contractAddress, abi.abi, newSigner);
          setContract(contractInstance);
        } else {
          setAccount(null);
          setSigner(null);
          setContract(null);
        }

        window.ethereum.on("accountsChanged", (newAccounts) => {
          if (newAccounts.length > 0) {
            setAccount(newAccounts[0]);
            newProvider.getSigner(newAccounts[0]).then(setSigner);
          } else {
            setAccount(null);
            setSigner(null);
            setContract(null);
          }
        });

        window.ethereum.on("chainChanged", () => {
          window.location.reload();
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

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };

  }, [contractAddress]);


  return (
    <Router>
      <div className="App">
        <h1>Land Registry System</h1>
        <p><strong>Connected Account:</strong> {account ? account : "Not Connected"}</p>
        
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
          <Link to="/">Home</Link> | 
          <Link to="/register">Register New Land</Link> | 
          <Link to="/transfer">Transfer Ownership</Link> |
          <Link to="/view-land">View Land</Link> 
        </nav>
        <hr />

        <Routes>
          <Route path="/" element={<Home contract={contract} provider={provider} signer={signer} />} />
          <Route path="/register" element={<Register contract={contract} connectedAccount={account} provider={provider} signer={signer} />} />
          <Route path="/transfer" element={<Transfer contract={contract} connectedAccount={account} provider={provider} signer={signer} />} />
          <Route path="/view-land" element={<ViewLand contract={contract} />} /> {/* <-- Naya Route add karein */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;