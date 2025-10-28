import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Register = ({ contract, connectedAccount }) => { 
    const [ownerName, setOwnerName] = useState("");
    const [khasraNo, setKhasraNo] = useState("");
    const [ownerWalletAddress, setOwnerWalletAddress] = useState(""); // This will be the NEW owner's address
    const [propertyAddress, setPropertyAddress] = useState("");
    const [landArea, setLandArea] = useState("");
    const [propertyValue, setPropertyValue] = useState("");
    const [previousOwnerName, setPreviousOwnerName] = useState("");
    const [loading, setLoading] = useState(false);
    const [governmentAuthorityAddress, setGovernmentAuthorityAddress] = useState(null); // New state to hold GA address

    // Fetch government authority address on component mount
    useEffect(() => {
        const fetchGovernmentAuthority = async () => {
            if (contract) {
                try {
                    const govAddress = await contract.governmentAuthority();
                    setGovernmentAuthorityAddress(govAddress);
                } catch (error) {
                    console.error("Error fetching government authority:", error);
                }
            }
        };
        fetchGovernmentAuthority();
    }, [contract]);

    // This useEffect is now REMOVED as we don't want to pre-fill ownerWalletAddress with connectedAccount (GA)
    // useEffect(() => {
    //     if (connectedAccount) {
    //         setOwnerWalletAddress(connectedAccount);
    //     } else {
    //         setOwnerWalletAddress("");
    //     }
    // }, [connectedAccount]);

    const handleRegisterLand = async (e) => {
        e.preventDefault();
        
        if (!contract) { 
            alert("Blockchain contract is not ready.");
            console.error("handleRegisterLand: contract prop is null.");
            return;
        }
        if (!connectedAccount || connectedAccount.toLowerCase() !== governmentAuthorityAddress.toLowerCase()) {
            alert("Only the Government Authority can register new land. Please connect with the Government Authority's wallet.");
            return;
        }
        if (!ethers.isAddress(ownerWalletAddress) || ownerWalletAddress === ethers.ZeroAddress) {
            alert("Please enter a valid wallet address for the new owner.");
            return;
        }

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
                ownerWalletAddress, // <-- Ab yeh field se liya gaya address hai
                dataHash,
                propertyAddress,
                landArea
            );
            const receipt = await transaction.wait(); // Wait for the transaction to be mined

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
            {governmentAuthorityAddress && (
                <p className="info-text">
                    Connected as Government Authority: <span className="highlight-address">{governmentAuthorityAddress}</span>
                </p>
            )}
            <form onSubmit={handleRegisterLand}>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner's Full Name" required />
                <input type="text" value={khasraNo} onChange={(e) => setKhasraNo(e.target.value)} placeholder="Khasra Number (e.g., KH-123)" required />
                
                {/* This input field is now for the actual new owner, NOT the connected account */}
                <input 
                    type="text" 
                    value={ownerWalletAddress} 
                    onChange={(e) => setOwnerWalletAddress(e.target.value)} 
                    placeholder="New Owner's Wallet Address" 
                    required 
                />

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