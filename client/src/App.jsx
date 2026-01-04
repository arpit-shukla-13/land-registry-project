// src/App.jsx
import { useState, useEffect } from "react";

import { ethers } from "ethers"; 
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import abi from "./LandRegistry.json"; 
import './App.css'; 


import Register from "./pages/Register"; 
import Home from "./pages/Home";
import Transfer from "./pages/Transfer";
import ViewLand from "./pages/ViewLand";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null); 
  const [signer, setSigner] = useState(null);
  

 
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

  useEffect(() => {
    const initDapp = async () => {
      if (!window.ethereum) {
        console.error("MetaMask is not installed!"); 
        return;
      }

      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum, 'any', { ensAddress: null });
        setProvider(newProvider);

        
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        
        if (accounts.length > 0) {
          const currentAccount = accounts[0];
          setAccount(currentAccount);
          
        
          const newSigner = await newProvider.getSigner(currentAccount);
          setSigner(newSigner);

          const contractInstance = new ethers.Contract(contractAddress, abi.abi, newSigner);
          setContract(contractInstance);
        } else {
          setAccount(null);
          setSigner(null);
          
          const readOnlyContract = new ethers.Contract(contractAddress, abi.abi, newProvider);
          setContract(readOnlyContract);
        }

        // Event listeners for account and chain changes
        window.ethereum.on("accountsChanged", (newAccounts) => {
          window.location.reload(); // Simple reload for state management
        });

        window.ethereum.on("chainChanged", () => {
          window.location.reload(); // Simple reload for state management
        });

      } catch (error) { 
        console.error("Error initializing DApp:", error); 
        setAccount(null);
        setSigner(null);
        setContract(null);
      }
    };

    initDapp();

    return () => {
      // Cleanup listeners
      if (window.ethereum && window.ethereum.removeListener) {
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
          <Route path="/view-land" element={<ViewLand contract={contract} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;


// D:\LandAssetWeb3>cd backend

// D:\LandAssetWeb3\backend>npx hardhat node

// D:\LandAssetWeb3\backend>npx hardhat run scripts/deploy.js --network localhost