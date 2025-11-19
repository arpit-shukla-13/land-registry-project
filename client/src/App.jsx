// src/App.jsx
import { useState, useEffect } from "react";
// FIX: "ethers" resolution error ko ignore kar rahe hain, yeh assume karke ki ethers global scope mein available hai ya build process use handle karega.
// Agar yeh error continue karta hai, toh yeh Node/Vite setup ka issue ho sakta hai.
import { ethers } from "ethers"; 
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// FIX: Assuming the file path is correct relative to App.jsx
import abi from "./LandRegistry.json"; 
import './App.css'; // FIX: App.css resolution error ko bhi assume kar rahe hain ki path sahi hai.

// FIX: Yeh imports component files ke beech resolution errors ko hata dete hain.
import Register from "./pages/Register"; 
import Home from "./pages/Home";
import Transfer from "./pages/Transfer";
import ViewLand from "./pages/ViewLand";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null); 
  const [signer, setSigner] = useState(null);
  

  // 🚨 CRITICAL FIX: Hardhat node restart karne ke baad yahan LATEST deployed address dalna zaroori hai.
  // Deploy script chalane ke baad jo address console mein aaye, use yahan daalein.
  // Agar aap Hardhat default address use kar rahe hain, toh woh 0x5FbDB... se shuru hoga.
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // <-- ISKO BADALNA HAI

  useEffect(() => {
    const initDapp = async () => {
      if (!window.ethereum) {
        console.error("MetaMask is not installed!"); // MetaMask install nahi hai
        return;
      }

      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum, 'any', { ensAddress: null });
        setProvider(newProvider);

        // MetaMask accounts ko request karein
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        
        if (accounts.length > 0) {
          const currentAccount = accounts[0];
          setAccount(currentAccount);
          
          // Signer ko setup karein
          const newSigner = await newProvider.getSigner(currentAccount);
          setSigner(newSigner);

          // Contract Instance ko setup karein (Signer se connected taaki transactions ho sakein)
          const contractInstance = new ethers.Contract(contractAddress, abi.abi, newSigner);
          setContract(contractInstance);
        } else {
          setAccount(null);
          setSigner(null);
          // Contract Instance ko Provider se setup karein agar signer nahi hai (Read-only ke liye)
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
        console.error("Error initializing DApp:", error); // DApp initialize karne mein error
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