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

// --- DARK THEME ADVANCED STYLES ---
    const styles = {
        wrapper: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            minHeight: '80vh'
        },
        card: {
            width: '100%',
            maxWidth: '650px',
            backgroundColor: 'var(--background-medium)',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
        },
        title: {
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '10px',
            color: 'white',
            textAlign: 'center',
            letterSpacing: '-0.5px'
        },
        subtitle: {
            textAlign: 'center',
            color: 'var(--text-color-light)',
            marginBottom: '30px',
            fontSize: '14px'
        },
        authBadge: {
            backgroundColor: 'rgba(0, 184, 148, 0.1)',
            border: '1px solid var(--secondary-color)',
            color: 'var(--secondary-color)',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '25px',
            textAlign: 'center',
            fontFamily: 'Roboto Mono, monospace'
        },
        inputRow: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
        },
        fieldGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '20px'
        },
        label: {
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--text-color-light)',
            marginLeft: '4px'
        },
        submitBtn: {
            width: '100%',
            padding: '15px',
            marginTop: '10px',
            fontWeight: '600',
            fontSize: '16px',
            letterSpacing: '0.5px',
            boxShadow: '0 4px 15px rgba(108, 92, 231, 0.3)'
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <h2 style={styles.title}>Register Land</h2>
                <p style={styles.subtitle}>Fill in the details to mint land record on blockchain</p>

                {governmentAuthorityAddress && (
                    <div style={styles.authBadge}>
                        <strong>✓ GOVT AUTHORITY CONNECTED:</strong> {governmentAuthorityAddress}
                    </div>
                )}

                <form onSubmit={handleRegisterLand}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Owner Full Name</label>
                        <input type="text" className='text-white  placeholder-red-100' value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Rahul Kumar" required />
                    </div>

                    <div style={styles.inputRow}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <label style={styles.label}>Khasra Number</label>
                            <input type="text" value={khasraNo} onChange={(e) => setKhasraNo(e.target.value)} placeholder="KH-456" required />
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <label style={styles.label}>Land Area</label>
                            <input type="text" value={landArea} onChange={(e) => setLandArea(e.target.value)} placeholder="1500 sqft" required />
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>New Owner's Wallet Address</label>
                        <input style={{fontFamily: 'Roboto Mono'}} type="text" value={ownerWalletAddress} onChange={(e) => setOwnerWalletAddress(e.target.value)} placeholder="0x..." required />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Physical Property Address</label>
                        <textarea 
                            style={{backgroundColor: 'var(--background-lightest)', color: 'white', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', minHeight: '80px'}}
                            value={propertyAddress} 
                            onChange={(e) => setPropertyAddress(e.target.value)} 
                            placeholder="Enter full physical location details..." 
                            required 
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Property Market Value (INR)</label>
                        <input type="number" value={propertyValue} onChange={(e) => setPropertyValue(e.target.value)} placeholder="₹ Amount" required />
                    </div>

                    <button type="submit" style={styles.submitBtn} disabled={loading}>
                        {loading ? "⚙️ Processing Transaction..." : "Complete Registration"}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default Register;