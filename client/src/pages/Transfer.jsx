import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Transfer = ({ contract, connectedAccount }) => { 
    const [landId, setLandId] = useState("");
    const [newOwnerAddress, setNewOwnerAddress] = useState("");
    const [newOwnerName, setNewOwnerName] = useState(""); // <-- Naya state
    const [loading, setLoading] = useState(false);
    const [currentOwner, setCurrentOwner] = useState(""); 
    const [offChainMongoId, setOffChainMongoId] = useState(""); 
    const [governmentAuthorityAddress, setGovernmentAuthorityAddress] = useState(null);
    const [currentOwnerName, setCurrentOwnerName] = useState(""); // <-- Current owner ka naam display karne ke liye

    // Effect to fetch the Government Authority address from the 'contract' prop
    useEffect(() => {
        const fetchGovernmentAuthority = async () => {
            if (contract) { 
                try {
                    const govAddress = await contract.governmentAuthority(); 
                    setGovernmentAuthorityAddress(govAddress);
                    console.log("Government Authority fetched (via contract prop):", govAddress);
                } catch (error) {
                    console.error("Error fetching government authority from contract prop:", error);
                }
            }
        };
        fetchGovernmentAuthority();
    }, [contract]); 

    // Effect to fetch current owner details (address and name) and MongoDB ID based on landId
    useEffect(() => {
        const fetchLandDetails = async () => {
            if (landId && contract) { 
                try {
                    // Fetch on-chain details
                    const landData = await contract.landRecords(landId); 
                    if (landData && landData[1] !== ethers.ZeroAddress) { 
                        setCurrentOwner(landData[1]); 
                        
                        // Fetch off-chain details
                        const response = await fetch(`http://localhost:5000/land-by-onchain-id/${Number(landData[0])}`);
                        const data = await response.json();
                        if (response.ok && data.data && data.data._id) {
                            setOffChainMongoId(data.data._id);
                            setCurrentOwnerName(data.data.ownerName); // <-- Off-chain se current owner ka naam set karein
                        } else {
                            setOffChainMongoId(""); 
                            setCurrentOwnerName("N/A (Off-chain data missing)");
                        }

                    } else {
                        setCurrentOwner("Not Found");
                        setCurrentOwnerName("Not Found");
                        setOffChainMongoId("");
                    }
                } catch (error) {
                    console.error("Error fetching land details for transfer (via contract prop):", error);
                    setCurrentOwner("Error");
                    setCurrentOwnerName("Error");
                    setOffChainMongoId("");
                }
            } else {
                setCurrentOwner("");
                setCurrentOwnerName("");
                setOffChainMongoId("");
            }
        };
        fetchLandDetails();
    }, [landId, contract]);

    const handleTransferOwnership = async (e) => {
        e.preventDefault();
        
        if (!contract) { 
            alert("Blockchain contract is not ready.");
            console.error("handleTransferOwnership: contract prop is null.");
            return;
        }
        if (!connectedAccount) {
            alert("Please connect your wallet.");
            return;
        }
        if (!governmentAuthorityAddress) {
            alert("Government authority address not loaded yet. Please wait.");
            return;
        }

        if (connectedAccount.toLowerCase() !== governmentAuthorityAddress.toLowerCase()) {
            alert("Only the Government Authority can transfer land ownership.");
            return;
        }

        if (!offChainMongoId) {
            alert("Could not find off-chain record for this land. Cannot proceed with transfer.");
            return;
        }
        if (!ethers.isAddress(newOwnerAddress) || newOwnerAddress === ethers.ZeroAddress) {
            alert("Please enter a valid new owner address.");
            return;
        }
        if (newOwnerAddress.toLowerCase() === currentOwner.toLowerCase()) { 
            alert("New owner cannot be the current owner.");
            return;
        }
        // Naye owner ke naam ke liye validation add karein
        if (!newOwnerName.trim()) {
            alert("Please enter the new owner's name.");
            return;
        }

        setLoading(true);

        try {
            console.log(`Attempting to transfer land ID ${landId} from ${currentOwner} to ${newOwnerAddress}`);
            const transaction = await contract.transferOwnership(landId, newOwnerAddress); 
            const receipt = await transaction.wait(); 

            const transferEvent = receipt.logs.find(log => log.eventName === 'LandTransferred');
            if (!transferEvent) {
                throw new Error("LandTransferred event not found. Transfer may have failed.");
            }
            const transferredLandId = transferEvent.args.landId;
            const prevOwner = transferEvent.args.previousOwner;
            const newOwn = transferEvent.args.newOwner;

            console.log(`On-chain transfer successful! Land ID: ${Number(transferredLandId)}, From: ${prevOwner}, To: ${newOwn}`);

            console.log(`Updating off-chain record (MongoDB ID: ${offChainMongoId}) with new owner details...`);
            const offChainResponse = await fetch(`http://localhost:5000/update-land-owner/${offChainMongoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    newOwnerWalletAddress: newOwnerAddress,
                    newOwnerName: newOwnerName // <-- Naya naam yahan pass ho raha hai
                })
            });

            const offChainData = await offChainResponse.json();
            if (!offChainResponse.ok) {
                throw new Error(offChainData.message || "Failed to update off-chain land owner.");
            }
            console.log("Off-chain update successful:", offChainData.message);

            alert("Ownership Transfer Complete! Both on-chain and off-chain records updated.");
            // Reset form and states
            setLandId(""); 
            setNewOwnerAddress("");
            setNewOwnerName(""); // <-- Naya state reset karein
            setCurrentOwner("");
            setCurrentOwnerName("");
            setOffChainMongoId("");

        } catch (error) {
            console.error("Ownership transfer failed:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Transfer Land Ownership</h2>
            {governmentAuthorityAddress && (
                <p className="info-text">
                    Government Authority: <span className="highlight-address">{governmentAuthorityAddress}</span>
                </p>
            )}
            <form onSubmit={handleTransferOwnership}>
                <input
                    type="number"
                    value={landId}
                    onChange={(e) => setLandId(e.target.value)}
                    placeholder="Land ID to Transfer (e.g., 1)"
                    required
                />
                {landId && currentOwner && currentOwner !== "Not Found" && currentOwner !== "Error" && (
                    <>
                        <p className="info-text">Current Owner Address: <span className="highlight-address">{currentOwner}</span></p>
                        <p className="info-text">Current Owner Name: <span className="highlight-text">{currentOwnerName}</span></p> {/* <-- Current owner ka naam */}
                    </>
                )}
                {landId && currentOwner === "Not Found" && (
                    <p className="error-text">No land found with this ID.</p>
                )}
                {landId && currentOwner === "Error" && (
                    <p className="error-text">Error fetching owner.</p>
                )}

                <input
                    type="text"
                    value={newOwnerAddress}
                    onChange={(e) => setNewOwnerAddress(e.target.value)}
                    placeholder="New Owner's Wallet Address"
                    required
                />
                
                <input // <-- Naya input field for new owner's name
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="New Owner's Full Name"
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Processing Transfer..." : "Transfer Ownership"}
                </button>
            </form>
        </div>
    );
};

export default Transfer;