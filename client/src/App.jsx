// src/App.jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import abi from "./LandRegistry.json";
import './App.css';
import Register from "./pages/Register"; 
import Home from "./pages/Home";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const connectWallet = async () => {
      // *** Yahan apna LATEST contract address daalein ***
      const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
      const contractABI = abi.abi;
      try {
        const { ethereum } = window;
        if (ethereum) {
          const accounts = await ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
          const provider = new ethers.BrowserProvider(ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contract);
        }
      } catch (error) { console.error("Error connecting wallet:", error); }
    };
    connectWallet();
  }, []);

  return (
    <Router>
      <div className="App">
        <h1>Land Registry System</h1>
        <p><strong>Connected Account:</strong> {account || "Not Connected"}</p>
        <nav>
          <Link to="/">Home</Link> | <Link to="/register">Register New Land</Link>
        </nav>
        <hr />

        <Routes>
          <Route path="/" element={<Home contract={contract} />} />
          <Route path="/register" element={<Register contract={contract} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;