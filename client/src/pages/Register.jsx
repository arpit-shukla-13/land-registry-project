import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// LandRegistryABI is not directly needed here if 'contract' prop is a full contract instance
// import LandRegistryABI from '../LandRegistry.json'; 

// Only receive 'contract' and 'connectedAccount' props
const Register = ({ contract, connectedAccount }) => { 
    const [ownerName, setOwnerName] = useState("");
    const [khasraNo, setKhasraNo] = useState("");
    const [ownerWalletAddress, setOwnerWalletAddress] = useState(""); 
    const [propertyAddress, setPropertyAddress] = useState("");
    const [landArea, setLandArea] = useState("");
    const [propertyValue, setPropertyValue] = useState("");
    const [previousOwnerName, setPreviousOwnerName] = useState("");
    const [loading, setLoading] = useState(false);

    // This ensures ownerWalletAddress is pre-filled with the connected account
    useEffect(() => {
        if (connectedAccount) {
            setOwnerWalletAddress(connectedAccount);
        } else {
            setOwnerWalletAddress(""); // Clear if disconnected
        }
    }, [connectedAccount]);

    const handleRegisterLand = async (e) => {
        e.preventDefault();
        // --- Validation check 'contract' prop par ---
        if (!contract) { 
            alert("Blockchain contract is not ready.");
            console.error("handleRegisterLand: contract prop is null.");
            return;
        }

        // --- Frontend specific validation for Government Authority ---
        // (Assuming you have `governmentAuthorityAddress` state or can fetch it here)
        // Agar aap chahte hain ki sirf GA hi register kar sake, to yahan fetch karein ya App.jsx se pass karein
        // Temporary, for testing, assume connectedAccount is GA
        // Yahan aapko governmentAuthorityAddress state ki zaroorat padegi
        // Agar App.jsx se governmentAuthorityAddress pass kiya ja raha hai, to usko use karein
        // Else, contract se fetch karein (but that could also trigger RPC error)

        // For now, let's proceed assuming the connectedAccount is authorized to call registerLand
        // (registerLand function has onlyGovernment modifier)

        setLoading(true);

        try {
            // Step 1: Save data to MongoDB off-chain
            console.log("Saving data to off-chain database...");
            const offChainResponse = await fetch('http://localhost:5000/register-land', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ownerName, khasraNo, ownerWalletAddress, propertyAddress, 
                    landArea, propertyValue: Number(propertyValue), previousOwnerName 
                })
            });

            const offChainData = await offChainResponse.json();
            if (!offChainResponse.ok) {
                throw new Error(offChainData.message || "Failed to save off-chain data.");
            }
            const mongoRecordId = offChainData.data._id;
            console.log("Off-chain data saved. MongoDB ID:", mongoRecordId);

            // Step 2: Calculate data hash for on-chain proof
            const dataToHash = `${ownerName}-${khasraNo}-${propertyValue}-${previousOwnerName}`;
            const dataHash = ethers.keccak256(ethers.toUtf8Bytes(dataToHash));
            console.log("Data Hash generated:", dataHash);

            // Step 3: Register land on-chain
            console.log("Registering land on-chain...");
            // Use the 'contract' prop directly
            const transaction = await contract.registerLand(
                ownerWalletAddress,
                dataHash,
                propertyAddress,
                landArea
            );
            const receipt = await transaction.wait(); // Wait for the transaction to be mined

            // Find the LandRegistered event to get the onChainId
            const registerEvent = receipt.logs.find(log => log.eventName === 'LandRegistered');
            if (!registerEvent) {
                throw new Error("LandRegistered event not found. Land may not have been registered on-chain.");
            }
            const onChainId = registerEvent.args.landId;
            console.log(`On-chain registration successful! Land ID: ${Number(onChainId)}`);

            // Step 4: Update MongoDB with onChainId
            console.log("Updating off-chain record with on-chain ID...");
            const updateResponse = await fetch(`http://localhost:5000/update-onchain-id/${mongoRecordId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onChainId: Number(onChainId) })
            });

            if (!updateResponse.ok) {
                throw new Error("Failed to link on-chain ID to off-chain record.");
            }
            console.log("On-chain ID linked to MongoDB record.");

            alert("Process Complete! Land registered and linked.");
            // Clear form fields
            setOwnerName(""); setKhasraNo(""); setOwnerWalletAddress("");
            setPropertyAddress(""); setLandArea(""); setPropertyValue("");
            setPreviousOwnerName("");

        } catch (error) {
            console.error("Land registration failed:", error);
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