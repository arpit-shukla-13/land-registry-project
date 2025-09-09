import React, { useState } from 'react';
import { ethers } from 'ethers';

const Register = ({ contract }) => {
    // Form state variables
    const [ownerName, setOwnerName] = useState("");
    const [khasraNo, setKhasraNo] = useState("");
    const [ownerWalletAddress, setOwnerWalletAddress] = useState("");
    const [propertyAddress, setPropertyAddress] = useState("");
    const [landArea, setLandArea] = useState("");
    const [propertyValue, setPropertyValue] = useState("");
    const [previousOwnerName, setPreviousOwnerName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegisterLand = async (e) => {
        e.preventDefault();
        if (!contract) {
            alert("Blockchain contract is not connected yet. Please wait or refresh the page.");
            return;
        }
        setLoading(true);

        let mongoRecordId = null; // Variable to store the ID from MongoDB

        try {
            // === Step 1: Save full details to the Off-Chain Database (MongoDB) ===
            const landDetails = { 
                ownerName, 
                khasraNo, 
                ownerWalletAddress, 
                propertyAddress, 
                landArea, 
                propertyValue, 
                previousOwnerName 
            };
            
            console.log("Step 1: Sending data to off-chain server...", landDetails);
            const offChainResponse = await fetch("http://localhost:5000/register-land", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(landDetails)
            });
            
            const offChainData = await offChainResponse.json();
            if (!offChainResponse.ok) {
                throw new Error(offChainData.message || "Failed to save data to MongoDB.");
            }
            mongoRecordId = offChainData.data._id; // Get the unique ID of the new record from MongoDB
            console.log("Step 1 Success: Data saved to MongoDB with ID:", mongoRecordId);

            // === Step 2: Register a proof (Hash) on the On-Chain Smart Contract ===
            console.log("Step 2: Creating hash and sending to blockchain...");
            const dataToHash = `${ownerName},${khasraNo},${propertyAddress},${landArea}`;
            const dataHash = ethers.keccak256(ethers.toUtf8Bytes(dataToHash));
            
            const transaction = await contract.registerLand(ownerWalletAddress, dataHash, propertyAddress, landArea);
            const receipt = await transaction.wait(); // Wait for the transaction to be mined
            
            // Find the event in the transaction receipt to get the new landId
            const registeredEvent = receipt.logs.find(log => log.eventName === 'LandRegistered');
            const onChainId = registeredEvent.args.landId;
            console.log("Step 2 Success: Proof registered on-chain with ID:", Number(onChainId));

            // === Step 3: Link the On-Chain ID back to the Off-Chain Database ===
            console.log("Step 3: Linking on-chain ID back to MongoDB record...");
            const updateResponse = await fetch(`http://localhost:5000/update-onchain-id/${mongoRecordId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onChainId: Number(onChainId) })
            });
            if (!updateResponse.ok) {
                throw new Error("Failed to link on-chain ID in MongoDB.");
            }
            console.log("Step 3 Success: On-chain ID linked in MongoDB!");

            alert("Process Complete! Land data saved and linked with on-chain proof successfully!");

        } catch (error) {
            console.error("The entire registration process failed:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Register Land Details</h2>
            <form onSubmit={handleRegisterLand}>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner's Full Name" required />
                <input type="text" value={khasraNo} onChange={(e) => setKhasraNo(e.target.value)} placeholder="Khasra Number (e.g., KH-123)" required />
                <input type="text" value={ownerWalletAddress} onChange={(e) => setOwnerWalletAddress(e.target.value)} placeholder="Owner's Wallet Address" required />
                <input type="text" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} placeholder="Physical Property Address" required />
                <input type="text" value={landArea} onChange={(e) => setLandArea(e.target.value)} placeholder="Land Area (e.g., 2000 sqft)" required />
                <input type="number" value={propertyValue} onChange={(e) => setPropertyValue(e.target.value)} placeholder="Property Value (in INR)" required />
                <input type="text" value={previousOwnerName} onChange={(e) => setPreviousOwnerName(e.target.value)} placeholder="Previous Owner's Name (if any)" />
                <button type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Register Land (Complete Process)"}
                </button>
            </form>
        </div>
    );
};

export default Register;