// client/src/pages/Transfer.jsx (UPDATED FOR NEW THEME)

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Transfer = ({ contract, connectedAccount }) => { 
    const [landId, setLandId] = useState("");
    const [newOwnerAddress, setNewOwnerAddress] = useState("");
    const [newOwnerName, setNewOwnerName] = useState(""); 
    const [loading, setLoading] = useState(false);
    const [currentOwner, setCurrentOwner] = useState(""); 
    const [offChainMongoId, setOffChainMongoId] = useState(""); 
    const [governmentAuthorityAddress, setGovernmentAuthorityAddress] = useState(null);
    const [currentOwnerName, setCurrentOwnerName] = useState(""); 

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
                            setCurrentOwnerName(data.data.ownerName); 
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
                    newOwnerName: newOwnerName 
                })
            });

            const offChainData = await offChainResponse.json();
            if (!offChainResponse.ok) {
                throw new Error(offChainData.message || "Failed to update off-chain land owner.");
            }
            console.log("Off-chain update successful:", offChainData.message);

            alert("✅ Ownership Transfer Complete! Both on-chain and off-chain records updated.");
            
            // Reset form and states
            setLandId(""); 
            setNewOwnerAddress("");
            setNewOwnerName(""); 
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', animation: 'fadeIn 0.5s ease-in' }}>
            <div className="form-container" style={{ maxWidth: '600px', width: '100%' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: '0 0 10px 0', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Transfer Ownership
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                        Transfer property rights securely on the blockchain.
                    </p>
                </div>

                {governmentAuthorityAddress && (
                    <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                        border: '1px solid var(--success-color)', 
                        color: 'var(--success-color)',
                        padding: '12px', 
                        borderRadius: '10px', 
                        fontSize: '13px', 
                        marginBottom: '30px',
                        textAlign: 'center', 
                        fontFamily: "'Fira Code', monospace",
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <strong>Govt Authority:</strong> {governmentAuthorityAddress}
                    </div>
                )}

                <form onSubmit={handleTransferOwnership}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Asset Token ID
                        </label>
                        <input
                            type="number"
                            className="input-field"
                            value={landId}
                            onChange={(e) => setLandId(e.target.value)}
                            placeholder="Enter Land ID (e.g., 1)"
                            required
                        />
                    </div>

                    {/* --- CURRENT OWNER INFO STATUS BOX --- */}
                    <div style={{ minHeight: '80px', marginBottom: '20px' }}>
                        {landId && currentOwner && currentOwner !== "Not Found" && currentOwner !== "Error" && (
                            <div style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                padding: '15px',
                                borderRadius: '10px',
                                animation: 'fadeIn 0.3s ease-in'
                            }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    Current Owner: <span className="highlight-text" style={{ fontSize: '16px' }}>{currentOwnerName}</span>
                                </p>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Wallet: <span className="highlight-address" style={{ fontSize: '12px' }}>{currentOwner}</span>
                                </p>
                            </div>
                        )}
                        {landId && currentOwner === "Not Found" && (
                            <p className="error-text" style={{ margin: 0 }}>❌ No land found with this ID on the network.</p>
                        )}
                        {landId && currentOwner === "Error" && (
                            <p className="error-text" style={{ margin: 0 }}>❌ Error fetching owner details.</p>
                        )}
                    </div>
                    {/* ----------------------------------- */}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            New Owner Wallet Address
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            style={{ fontFamily: "'Fira Code', monospace" }}
                            value={newOwnerAddress}
                            onChange={(e) => setNewOwnerAddress(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            New Owner Full Name
                        </label>
                        <input 
                            type="text"
                            className="input-field"
                            value={newOwnerName}
                            onChange={(e) => setNewOwnerName(e.target.value)}
                            placeholder="Enter New Owner's Name"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ width: '100%', padding: '16px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                        disabled={loading || currentOwner === "Not Found" || currentOwner === "Error" || !currentOwner}
                    >
                        {loading ? "⚙️ Processing Transfer..." : "Transfer Asset"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Transfer;