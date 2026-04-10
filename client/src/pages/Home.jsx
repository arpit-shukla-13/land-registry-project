// client/src/pages/Home.jsx (UPDATED FOR DASHBOARD LOOK)

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import LandRegistryABI from '../LandRegistry.json';

const Home = ({ contract, provider }) => {
    const [registeredLands, setRegisteredLands] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleClearDatabase = async () => {
        const isConfirmed = window.confirm("⚠️ WARNING: This will delete all off-chain data from MongoDB. Blockchain data cannot be deleted. Are you sure?");
        
        if (isConfirmed) {
            try {
                const response = await fetch('http://localhost:5000/clear-all-lands', {
                    method: 'DELETE',
                });
                
                if (response.ok) {
                    alert("Database cleared successfully!");
                    window.location.reload(); 
                } else {
                    alert("Failed to clear database.");
                }
            } catch (error) {
                console.error("Error clearing DB:", error);
                alert("Error connecting to server to clear DB.");
            }
        }
    };

    useEffect(() => {
        const fetchAllLands = async () => {
            if (provider && contract && contract.target) { 
                try {
                    setLoading(true);

                    const contractInstance = new ethers.Contract(
                        contract.target, 
                        LandRegistryABI.abi,
                        provider 
                    );

                    const countBigInt = await contractInstance.landCount(); 
                    const count = Number(countBigInt); 

                    const lands = [];
                    for (let i = 1; i <= count; i++) {
                        const landData = await contractInstance.landRecords(i);

                        lands.push({
                            landId: Number(landData[0]), 
                            owner: landData[1],
                            dataHash: landData[2],
                            propertyAddress: landData[3],
                            landArea: landData[4]
                        });
                    }
                    setRegisteredLands(lands.reverse()); 
                } catch (error) {
                    console.error("Error fetching lands:", error);
                    if (error.message.includes("could not decode result data")) {
                        alert("Error: Contract communication failed. Please ensure Hardhat is running and the address in App.jsx is correct.");
                    }
                } finally {
                    setLoading(false);
                }
            } else if (!provider || !contract || !contract.target) {
                setLoading(false);
            }
        };

        fetchAllLands();
    }, [provider, contract]); 

    // Helper function to truncate long hashes/addresses
    const shortenHash = (hash) => {
        if (!hash) return "";
        return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⏳</div>
                <h2 className="loading-text">Syncing with Blockchain...</h2>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-in', padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Dashboard Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '32px', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Platform Dashboard
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
                        Overview of all registered real estate assets on the network.
                    </p>
                </div>
                
                <button 
                    onClick={handleClearDatabase} 
                    className="btn-danger"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Wipe Database
                </button>
            </div>

            {/* Top Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '36px', background: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>🌍</div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Assets on Chain</p>
                        <h3 style={{ margin: 0, fontSize: '28px', color: 'var(--text-main)' }}>{registeredLands.length}</h3>
                    </div>
                </div>
                
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '36px', background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>🔒</div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Network Status</p>
                        <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--success-color)' }}>Secure & Active</h3>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                {registeredLands.length === 0 ? (
                    <div className="no-data-text" style={{ border: 'none', background: 'transparent' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '15px'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <br />
                        No property records found on the network.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ margin: 0, border: 'none', borderRadius: 0 }}>
                            <thead>
                                <tr>
                                    <th>Token ID</th>
                                    <th>Data Hash (Proof)</th>
                                    <th>Current Owner</th>
                                    <th>Physical Address</th>
                                    <th>Area</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registeredLands.map((land) => (
                                    <tr key={land.landId}>
                                        <td>
                                            <span style={{ 
                                                background: 'rgba(59, 130, 246, 0.1)', 
                                                padding: '6px 12px', 
                                                borderRadius: '8px',
                                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                                fontWeight: 'bold',
                                                color: 'var(--primary-color)'
                                            }}>
                                                #{land.landId}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="highlight-hash" title={land.dataHash}>
                                                {shortenHash(land.dataHash)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="highlight-address" title={land.owner}>
                                                {shortenHash(land.owner)}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-dark)' }}>{land.propertyAddress}</td>
                                        <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>{land.landArea}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;