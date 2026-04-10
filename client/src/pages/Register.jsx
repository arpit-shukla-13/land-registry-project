// client/src/pages/Register.jsx (UPDATED FOR NEW THEME)

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// --- DUMMY DATA TEMPLATES ---
const dummyTemplates = [
    {
        id: 1,
        title: "🏢 City Commercial Plot",
        ownerName: "Rohan Mehta",
        khasraNo: "KH-CP-402",
        propertyAddress: "Connaught Place, Block A, New Delhi",
        landArea: "2500 sqft",
        propertyValue: "15000000",
        latitude: "28.6328",
        longitude: "77.2197"
    },
    {
        id: 2,
        title: "🌾 Outskirts Farm Land",
        ownerName: "Suresh Yadav",
        khasraNo: "KH-GHZ-1055",
        propertyAddress: "Near Adhyatmik Nagar, NH-24, Ghaziabad",
        landArea: "1.5 Hectare",
        propertyValue: "4500000",
        latitude: "28.6753",
        longitude: "77.5021"
    },
    {
        id: 3,
        title: "🏡 Residential Villa",
        ownerName: "Priya Sharma",
        khasraNo: "KH-BLR-899",
        propertyAddress: "Whitefield Sector 3, Bangalore",
        landArea: "4000 sqft",
        propertyValue: "25000000",
        latitude: "12.9698",
        longitude: "77.7499"
    }
];

const Register = ({ contract, connectedAccount }) => {
    const [ownerName, setOwnerName] = useState("");
    const [khasraNo, setKhasraNo] = useState("");
    const [ownerWalletAddress, setOwnerWalletAddress] = useState("");
    const [propertyAddress, setPropertyAddress] = useState("");
    const [landArea, setLandArea] = useState("");
    const [propertyValue, setPropertyValue] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

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

    // --- AUTO FILL FUNCTION ---
    const handleAutoFill = (data) => {
        setOwnerName(data.ownerName);
        setKhasraNo(data.khasraNo);
        setPropertyAddress(data.propertyAddress);
        setLandArea(data.landArea);
        setPropertyValue(data.propertyValue);
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        // Wallet Address intentionally left blank so you can paste your current MetaMask address
    };

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
            alert("Only the Government Authority can register new land.");
            return;
        }
        if (!ethers.isAddress(ownerWalletAddress) || ownerWalletAddress === ethers.ZeroAddress) {
            alert("Please enter a valid owner wallet address.");
            return;
        }

        setLoading(true);

        try {
            const dataToHash = `${ownerName}-${khasraNo}-${ownerWalletAddress}-${propertyAddress}-${landArea}-${propertyValue}`;
            const dataHash = ethers.keccak256(ethers.toUtf8Bytes(dataToHash));
            
            const transaction = await contract.registerLand(
                ownerWalletAddress, 
                dataHash,           
                propertyAddress,    
                landArea            
            );
            const receipt = await transaction.wait();

            const registerEvent = receipt.logs.find(log => log.eventName === 'LandRegistered');
            if (!registerEvent) {
                throw new Error("LandRegistered event not found. Registration may have failed.");
            }
            const onChainId = Number(registerEvent.args.landId);

            const offChainResponse = await fetch('http://localhost:5000/register-land', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerName, khasraNo, ownerWalletAddress, propertyAddress, landArea, propertyValue: Number(propertyValue), latitude, longitude
                })
            });

            const offChainData = await offChainResponse.json();
            if (!offChainResponse.ok) {
                throw new Error(offChainData.message || "Failed to save off-chain land data.");
            }
            const mongoRecordId = offChainData.data._id;

            const updateResponse = await fetch(`http://localhost:5000/update-onchain-id/${mongoRecordId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ onChainId: onChainId })
            });

            const updateData = await updateResponse.json();
            if (!updateResponse.ok) {
                throw new Error(updateData.message || "Failed to link on-chain ID.");
            }

            alert("✅ Land Registration Complete!");
            
            // Reset form
            setOwnerName(""); setKhasraNo(""); setOwnerWalletAddress(""); setPropertyAddress("");
            setLandArea(""); setPropertyValue(""); setLatitude(""); setLongitude(""); 

        } catch (error) {
            console.error("Land registration failed:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- CLEAN & MODERN THEME STYLES ---
    const styles = {
        pageLayout: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '30px',
            flexWrap: 'wrap',
            animation: 'fadeIn 0.5s ease-in'
        },
        sidebar: {
            flex: '0 0 320px',
            backgroundColor: 'var(--bg-card)',
            padding: '25px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-main)'
        },
        sidebarTitle: {
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '15px',
            color: 'var(--text-main)',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        templateCard: {
            backgroundColor: 'var(--bg-input)',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '15px',
            cursor: 'pointer',
            border: '1px solid var(--border-color)',
            transition: 'all 0.3s ease'
        },
        templateText: { margin: '0 0 5px 0', fontSize: '13px', color: 'var(--text-muted)' },
        card: {
            flex: '1',
            maxWidth: '700px',
            backgroundColor: 'var(--bg-card)',
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-main)'
        },
        headerContainer: { textAlign: 'center', marginBottom: '30px' },
        title: { 
            fontSize: '28px', 
            fontWeight: '800', 
            margin: '0 0 8px 0', 
            background: 'var(--primary-gradient)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
        },
        subtitle: { color: 'var(--text-muted)', fontSize: '15px', margin: 0 },
        authBadge: {
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
        },
        inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
        fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
        label: { fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
    };

    return (
        <div style={styles.pageLayout}>
            
            {/* SIDEBAR FOR DUMMY DATA */}
            <div style={styles.sidebar}>
                <div style={styles.sidebarTitle}>
                    <span style={{ fontSize: '20px' }}>⚡</span> Quick Fill Templates
                </div>
                <p style={{fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5'}}>
                    Click a template below to auto-fill the form. (Wallet address must be entered manually).
                </p>
                
                {dummyTemplates.map((template) => (
                    <div 
                        key={template.id} 
                        style={styles.templateCard} 
                        onClick={() => handleAutoFill(template)}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <h4 style={{margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '15px'}}>{template.title}</h4>
                        <p style={styles.templateText}><strong>Name:</strong> <span style={{color: 'var(--text-dark)'}}>{template.ownerName}</span></p>
                        <p style={styles.templateText}><strong>Khasra:</strong> <span style={{color: 'var(--text-dark)'}}>{template.khasraNo}</span></p>
                        <p style={styles.templateText}><strong>Area:</strong> <span style={{color: 'var(--text-dark)'}}>{template.landArea}</span></p>
                    </div>
                ))}
            </div>

            {/* MAIN FORM */}
            <div style={styles.card}>
                <div style={styles.headerContainer}>
                    <h2 style={styles.title}>Register New Asset</h2>
                    <p style={styles.subtitle}>Securely mint property records on the blockchain</p>
                </div>

                {governmentAuthorityAddress && (
                    <div style={styles.authBadge}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <strong>Govt Authority:</strong> {governmentAuthorityAddress}
                    </div>
                )}

                <form onSubmit={handleRegisterLand}>
                    <div style={styles.inputRow}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Owner Full Name</label>
                            <input type="text" className="input-field" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Rahul Kumar" required />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Web3 Wallet Address</label>
                            <input type="text" className="input-field" style={{fontFamily: "'Fira Code', monospace"}} value={ownerWalletAddress} onChange={(e) => setOwnerWalletAddress(e.target.value)} placeholder="0x..." required />
                        </div>
                    </div>

                    <div style={styles.inputRow}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Khasra Number</label>
                            <input type="text" className="input-field" value={khasraNo} onChange={(e) => setKhasraNo(e.target.value)} placeholder="KH-456" required />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Land Area</label>
                            <input type="text" className="input-field" value={landArea} onChange={(e) => setLandArea(e.target.value)} placeholder="1500 sqft" required />
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Physical Property Address</label>
                        <textarea 
                            className="input-field"
                            style={{ minHeight: '80px', resize: 'vertical' }}
                            value={propertyAddress} 
                            onChange={(e) => setPropertyAddress(e.target.value)} 
                            placeholder="Enter full physical location details..." 
                            required 
                        />
                    </div>

                    <div style={styles.inputRow}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Latitude</label>
                            <input type="text" className="input-field" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="28.6139" required />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Longitude</label>
                            <input type="text" className="input-field" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="77.2090" required />
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Property Market Value (INR)</label>
                        <input type="number" className="input-field" value={propertyValue} onChange={(e) => setPropertyValue(e.target.value)} placeholder="₹ Amount" required />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '10px' }}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Complete Registration"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;