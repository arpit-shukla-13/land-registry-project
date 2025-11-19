// client/src/pages/Register.jsx (UPDATED for CORRECT argument order)

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Register = ({ contract, connectedAccount }) => {
    const [ownerName, setOwnerName] = useState("");
    const [khasraNo, setKhasraNo] = useState("");
    const [ownerWalletAddress, setOwnerWalletAddress] = useState("");
    const [propertyAddress, setPropertyAddress] = useState("");
    const [landArea, setLandArea] = useState("");
    const [propertyValue, setPropertyValue] = useState("");
    const [governmentAuthorityAddress, setGovernmentAuthorityAddress] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const handleRegisterLand = async (e) => {
        e.preventDefault();

        if (!contract) {
            console.error("Blockchain contract is not ready.");
            return;
        }
        if (!connectedAccount) {
            console.error("Please connect your wallet.");
            return;
        }
        if (governmentAuthorityAddress && connectedAccount.toLowerCase() !== governmentAuthorityAddress.toLowerCase()) {
            console.error("Only the Government Authority can register new land.");
            return;
        }
        if (!ethers.isAddress(ownerWalletAddress) || ownerWalletAddress === ethers.ZeroAddress) {
            console.error("Please enter a valid owner wallet address.");
            return;
        }

        setLoading(true);

        try {
            // 1. Generate data hash for on-chain
            const dataToHash = `${ownerName}-${khasraNo}-${ownerWalletAddress}-${propertyAddress}-${landArea}-${propertyValue}`;
            const dataHash = ethers.keccak256(ethers.toUtf8Bytes(dataToHash));
            console.log("Generated Data Hash:", dataHash);

            // 2. Register land on-chain (FIX: Corrected Argument Order to match LandRegistry.sol)
            // Signature: (address _owner, bytes32 _dataHash, string _propertyAddress, string _landArea)
            const transaction = await contract.registerLand(
                ownerWalletAddress, // Argument 1: address
                dataHash,           // Argument 2: bytes32 (Hash)
                propertyAddress,    // Argument 3: string (Address)
                landArea            // Argument 4: string (Area)
            );
            const receipt = await transaction.wait();

            // Get the Land ID from the event
            const registerEvent = receipt.logs.find(log => log.eventName === 'LandRegistered');
            if (!registerEvent) {
                throw new Error("LandRegistered event not found. Registration may have failed.");
            }
            const onChainId = Number(registerEvent.args.landId);
            console.log(`Land registered on-chain with ID: ${onChainId}`);

            // 3. Register land off-chain (MongoDB)
            console.log("Saving land data to off-chain database...");
            const offChainResponse = await fetch('http://localhost:5000/register-land', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerName,
                    khasraNo,
                    ownerWalletAddress,
                    propertyAddress,
                    landArea,
                    propertyValue: Number(propertyValue)
                })
            });

            const offChainData = await offChainResponse.json();
            if (!offChainResponse.ok) {
                throw new Error(offChainData.message || "Failed to save off-chain land data.");
            }
            const mongoRecordId = offChainData.data._id;
            console.log(`Land data saved off-chain with MongoDB ID: ${mongoRecordId}`);

            // 4. Update off-chain record with on-chain ID
            console.log(`Updating off-chain record ${mongoRecordId} with on-chain ID ${onChainId}...`);
            const updateResponse = await fetch(`http://localhost:5000/update-onchain-id/${mongoRecordId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onChainId: onChainId })
            });

            const updateData = await updateResponse.json();
            if (!updateResponse.ok) {
                throw new Error(updateData.message || "Failed to link on-chain ID to off-chain record.");
            }
            console.log("On-chain ID linked to off-chain record successfully.");

            console.log("Land Registration Complete! Both on-chain and off-chain records created and linked.");
            // Reset form
            setOwnerName("");
            setKhasraNo("");
            setOwnerWalletAddress("");
            setPropertyAddress("");
            setLandArea("");
            setPropertyValue("");
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
                <button type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Register Land (Complete Process)"}
                </button>
            </form>
        </div>
    );
};

export default Register;