// src/App.jsx

import { useState, useEffect } from "react";
import { ethers } from "ethers"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import abi from "./LandRegistry.json"; 
import './App.css'; 

// --- Naye Components Jo Humne Banaye Hain ---
// (Make sure tumne 'src/components' folder me ye banaye hain)
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// --- Pages ---
import LandingPage from "./pages/LandingPage"; // Naya Hero Section wala page
import Home from "./pages/Home"; // Tumhara purana Home.jsx jo ab Dashboard ka kaam karega
import Register from "./pages/Register"; 
import Transfer from "./pages/Transfer";
import ViewLand from "./pages/ViewLand";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null); 
  const [signer, setSigner] = useState(null);
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

  // --- Navbar ke liye Wallet Connect Function ---
  const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setAccount(accounts[0]);
        } catch (error) {
            console.error("Wallet connection failed:", error);
        }
    } else {
        alert("MetaMask is not installed!");
    }
  };

  useEffect(() => {
    const initDapp = async () => {
      if (!window.ethereum) {
        console.error("MetaMask is not installed!"); 
        return;
      }

      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum, 'any', { ensAddress: null });
        setProvider(newProvider);

        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        
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
        window.ethereum.on("accountsChanged", () => {
          window.location.reload(); 
        });

        window.ethereum.on("chainChanged", () => {
          window.location.reload(); 
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
      {/* Pura app ab ek column flexbox me hai taaki Footer hamesha neeche rahe */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* NAYA NAVBAR */}
        <Navbar account={account} connectWallet={connectWallet} />

        {/* MAIN CONTENT AREA */}
        <main style={{ flex: 1, padding: '20px 0' }}>
          <Routes>
            {/* Landing Page ab Default Route (/) hai */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Purana Home ab /dashboard pe khulega */}
            <Route path="/dashboard" element={<Home contract={contract} provider={provider} />} />
            
            <Route path="/register" element={<Register contract={contract} connectedAccount={account} />} />
            <Route path="/transfer" element={<Transfer contract={contract} connectedAccount={account} />} />
            <Route path="/view-land" element={<ViewLand contract={contract} />} />
          </Routes>
        </main>

        {/* NAYA FOOTER */}
        <Footer />
        
      </div>
    </Router>
  );
}

export default App;

//cd backend
//npx hardhat node
//cd backend
// npx hardhat run scripts/deploy.js --network localhost
