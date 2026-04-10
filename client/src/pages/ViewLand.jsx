// client/src/pages/ViewLand.jsx (MARKETPLACE & SEARCH UPDATE)

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const ViewLand = ({ contract }) => {
    // Search & Data States
    const [allOffChainLands, setAllOffChainLands] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [displayedCards, setDisplayedCards] = useState([]);
    
    // View Management ('search' for grid, 'detail' for single property)
    const [viewMode, setViewMode] = useState('search');

    // Detail View States
    const [landOwnerHistory, setLandOwnerHistory] = useState([]); 
    const [selectedLandDetails, setSelectedLandDetails] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeOwnerWallet, setActiveOwnerWallet] = useState(null); 

    // 1. Load all properties on mount for the search engine
    useEffect(() => {
        const fetchAllProperties = async () => {
            try {
                const response = await fetch('http://localhost:5000/all-lands');
                const data = await response.json();
                if (response.ok && data.data) {
                    setAllOffChainLands(data.data);
                    setDisplayedCards(data.data); // Show all initially
                }
            } catch (err) {
                console.error("Error fetching all lands for search:", err);
            }
        };
        fetchAllProperties();
    }, []);

    // 2. Handle Search Input & Auto-suggestions
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchInput(query);

        if (query.trim() === "") {
            setSuggestions([]);
            setDisplayedCards(allOffChainLands); // Reset to all if empty
            return;
        }

        // Filter logic: Check Address, City, Khasra, or Owner Name
        const lowerQuery = query.toLowerCase();
        const filtered = allOffChainLands.filter(land => 
            land.propertyAddress.toLowerCase().includes(lowerQuery) ||
            land.khasraNo.toLowerCase().includes(lowerQuery) ||
            land.ownerName.toLowerCase().includes(lowerQuery) ||
            land.onChainId.toString().includes(lowerQuery)
        );

        setSuggestions(filtered.slice(0, 5)); // Show top 5 suggestions
        setDisplayedCards(filtered); // Update main grid
    };

    // Helper to format currency
    const formatCurrency = (value) => {
        if (!value || isNaN(value)) return value;
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
    };

    // 3. Handle Card Click -> Fetch Blockchain Details -> Switch to Detail View
    const openPropertyDetails = async (landRecord) => {
        setError(null);
        setLandOwnerHistory([]);
        setSelectedLandDetails(null);
        setActiveOwnerWallet(null);

        if (!contract) {
            setError("Blockchain contract is not ready. Please connect your wallet.");
            return;
        }

        setLoading(true);
        setViewMode('detail'); // Switch view

        try {
            const currentLandId = landRecord.onChainId;

            // Fetch On-Chain Data
            const onChainLandData = await contract.landRecords(currentLandId);

            if (onChainLandData && onChainLandData[1] === ethers.ZeroAddress) {
                setError(`Land with Token ID #${currentLandId} does not exist on-chain.`);
                setLoading(false);
                return;
            }

            // Fetch Full Off-Chain History
            const response = await fetch(`http://localhost:5000/land-by-onchain-id/${currentLandId}`);
            const data = await response.json();
            const offChainDetails = data.data;

            if (!offChainDetails) throw new Error("Off-chain data not found.");

            let fullTimeline = [];
            offChainDetails.ownershipHistory.forEach(record => {
                fullTimeline.push({
                    ownerWalletAddress: record.ownerWalletAddress,
                    ownerName: record.ownerName,
                    transferDate: new Date(record.transferDate), 
                    isCurrentOwner: false,
                    type: 'Previous'
                });
            });

            fullTimeline.push({
                ownerWalletAddress: offChainDetails.ownerWalletAddress,
                ownerName: offChainDetails.ownerName,
                transferDate: offChainDetails.registrationDate ? new Date(offChainDetails.registrationDate) : new Date(),
                isCurrentOwner: true,
                type: 'Current'
            });

            const currentOwnerDetailsForDisplay = {
                id: currentLandId,
                ownerWalletAddress: offChainDetails.ownerWalletAddress, 
                dataHash: onChainLandData[2], 
                propertyAddress: offChainDetails.propertyAddress, 
                landArea: offChainDetails.landArea,
                ownerName: offChainDetails.ownerName,
                khasraNo: offChainDetails.khasraNo,
                propertyValue: offChainDetails.propertyValue,
                latitude: offChainDetails.latitude,
                longitude: offChainDetails.longitude,
                offChainMongoId: offChainDetails._id,
                isCurrentOwner: true,
                transferDate: offChainDetails.registrationDate ? new Date(offChainDetails.registrationDate) : new Date()
            };

            setLandOwnerHistory(fullTimeline);
            setSelectedLandDetails(currentOwnerDetailsForDisplay);
            setActiveOwnerWallet(offChainDetails.ownerWalletAddress); 

        } catch (err) {
            console.error("Error fetching land details:", err);
            setError(`Failed to fetch secure details: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOwnerCardClick = (owner) => {
        setSelectedLandDetails(prevDetails => ({
            ...prevDetails, 
            ownerName: owner.ownerName, 
            ownerWalletAddress: owner.ownerWalletAddress, 
            isCurrentOwner: owner.isCurrentOwner,
            transferDate: owner.transferDate 
        }));
        setActiveOwnerWallet(owner.ownerWalletAddress);
    };

    // --- STYLES ---
    const styles = {
        searchContainer: {
            position: 'relative',
            maxWidth: '800px',
            margin: '0 auto 40px auto',
            zIndex: 10
        },
        searchInput: {
            width: '100%',
            padding: '20px 25px',
            fontSize: '18px',
            borderRadius: '15px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            color: 'white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            outline: 'none',
        },
        suggestionsBox: {
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            marginTop: '10px',
            overflow: 'hidden',
            boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
        },
        suggestionItem: {
            padding: '15px 20px',
            cursor: 'pointer',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '30px',
            paddingBottom: '50px'
        },
        card: {
            backgroundColor: 'var(--bg-card)',
            borderRadius: '15px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column'
        },
        cardMap: {
            width: '100%',
            height: '180px',
            border: 'none',
            pointerEvents: 'none', // Prevents scrolling map inside the card
            filter: 'invert(90%) hue-rotate(180deg) brightness(80%) contrast(120%)'
        },
        cardContent: {
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
        }
    };

    // ==========================================
    // RENDER: SEARCH & GRID VIEW
    // ==========================================
    if (viewMode === 'search') {
        return (
            <div style={{ animation: 'fadeIn 0.5s ease-in', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '36px', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 10px 0' }}>
                        Explore Real Estate
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Search by City, Location, Khasra Number, or Owner Name</p>
                </div>

                {/* SEARCH BAR */}
                <div style={styles.searchContainer}>
                    <input 
                        type="text" 
                        style={styles.searchInput}
                        placeholder="🔍 Try 'New Delhi', 'KH-402', or 'Rahul'..."
                        value={searchInput}
                        onChange={handleSearchChange}
                        onBlur={() => setTimeout(() => setSuggestions([]), 200)} // Hide suggestions when clicking outside
                    />
                    
                    {/* AUTO-SUGGESTIONS DROPDOWN */}
                    {suggestions.length > 0 && (
                        <div style={styles.suggestionsBox}>
                            {suggestions.map((land) => (
                                <div 
                                    key={`sug-${land._id}`} 
                                    style={styles.suggestionItem}
                                    onMouseDown={() => openPropertyDetails(land)}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-input)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <span style={{ fontSize: '20px' }}>📍</span>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{land.propertyAddress}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Khasra: {land.khasraNo} • Owner: {land.ownerName}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CARDS GRID */}
                <div style={styles.grid}>
                    {displayedCards.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>
                            <h3>No properties found matching your search.</h3>
                        </div>
                    ) : (
                        displayedCards.map((land) => (
                            <div 
                                key={`card-${land._id}`} 
                                style={styles.card}
                                onClick={() => openPropertyDetails(land)}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Mini Map Thumbnail */}
                                {land.latitude && land.longitude ? (
                                    <iframe
                                        style={styles.cardMap}
                                        src={`https://maps.google.com/maps?q=$${land.latitude},${land.longitude}&z=14&output=embed`}
                                        title={`Map-${land.khasraNo}`}
                                        tabIndex="-1"
                                    ></iframe>
                                ) : (
                                    <div style={{...styles.cardMap, backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px'}}>
                                        🗺️
                                    </div>
                                )}
                                
                                {/* Card Info */}
                                <div style={styles.cardContent}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '18px' }}>#{land.onChainId || 'Pending'}</h3>
                                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '4px 8px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>VERIFIED</span>
                                    </div>
                                    
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {land.propertyAddress}
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                                        <span><strong>Khasra:</strong> {land.khasraNo}</span>
                                        <span><strong>Owner:</strong> {land.ownerName}</span>
                                        <span><strong>Area:</strong> {land.landArea}</span>
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid var(--border-color)', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                        {formatCurrency(land.propertyValue)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // ==========================================
    // RENDER: DETAILED VIEW (TIMELINE + FULL MAP)
    // ==========================================
    return (
        <div style={{ animation: 'fadeIn 0.5s ease-in', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            
            <button 
                onClick={() => setViewMode('search')}
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                ← Back to Search Results
            </button>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⏳</div>
                    <h2 className="loading-text">Fetching Cryptographic Proofs...</h2>
                </div>
            ) : error ? (
                <div className="error-text">{error}</div>
            ) : (
                landOwnerHistory.length > 0 && (
                    <div className="view-land-layout">
                        
                        {/* Left Panel: Owner Timeline */}
                        <div className="owner-timeline-section">
                            <h3><span style={{ fontSize: '1.2em', marginRight: '8px' }}>📜</span> Ownership Timeline</h3>
                            <div className="owner-card-wrapper">
                                {landOwnerHistory.map((owner, index) => (
                                    <div
                                        key={`${owner.ownerWalletAddress}-${new Date(owner.transferDate).getTime()}-${index}`}
                                        className={`owner-card ${activeOwnerWallet === owner.ownerWalletAddress && owner.isCurrentOwner ? 'active' : ''}`}
                                        onClick={() => handleOwnerCardClick(owner)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <p className="owner-card-title" style={{ margin: 0 }}>
                                                {owner.isCurrentOwner ? "👑 Current Owner" : `🕰️ Owner #${index + 1}`}
                                            </p>
                                            <span style={{ fontSize: '0.8em', color: owner.isCurrentOwner ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                                                {new Date(owner.transferDate).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                        <p className="owner-card-info">
                                            <strong style={{color: 'inherit'}}>Name:</strong> <span className="highlight-text">{owner.ownerName}</span>
                                        </p>
                                        <p className="owner-card-info" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <strong style={{color: 'inherit'}}>Wallet:</strong> <span className="highlight-address" style={{ fontSize: '0.9em' }}>{owner.ownerWalletAddress}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Full Details */}
                        <div className="full-details-section">
                            {selectedLandDetails && (
                                <div className="full-details-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '25px' }}>
                                        <h3 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>
                                            Asset Token <span style={{ color: 'var(--primary-color)' }}>#{selectedLandDetails.id}</span>
                                        </h3>
                                        <span style={{ 
                                            background: selectedLandDetails.isCurrentOwner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                                            color: selectedLandDetails.isCurrentOwner ? 'var(--success-color)' : 'var(--warning)', 
                                            padding: '5px 12px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold', textTransform: 'uppercase'
                                        }}>
                                            {selectedLandDetails.isCurrentOwner ? "Current Record" : "Historical Record"}
                                        </span>
                                    </div>

                                    {/* Dashboard Data Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                        
                                        <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Owner Name</p>
                                            <p style={{ margin: 0, fontSize: '1.1em', fontWeight: '600', color: 'var(--text-main)' }}>{selectedLandDetails.ownerName}</p>
                                        </div>

                                        <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Khasra Number</p>
                                            <p style={{ margin: 0, fontSize: '1.1em', fontWeight: '600', color: 'var(--text-main)' }}>{selectedLandDetails.khasraNo}</p>
                                        </div>

                                        <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Land Area</p>
                                            <p style={{ margin: 0, fontSize: '1.1em', fontWeight: '600', color: 'var(--text-main)' }}>{selectedLandDetails.landArea}</p>
                                        </div>

                                        <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market Value</p>
                                            <p style={{ margin: 0, fontSize: '1.1em', fontWeight: '600', color: 'var(--success-color)' }}>{formatCurrency(selectedLandDetails.propertyValue)}</p>
                                        </div>

                                        <div style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Owner Wallet Address</p>
                                            <p style={{ margin: 0, fontSize: '1em', color: 'var(--secondary-color)', fontFamily: "'Fira Code', monospace", wordBreak: 'break-all' }}>{selectedLandDetails.ownerWalletAddress}</p>
                                        </div>

                                        <div style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Physical Property Address</p>
                                            <p style={{ margin: 0, fontSize: '1em', color: 'var(--text-main)' }}>{selectedLandDetails.propertyAddress}</p>
                                        </div>

                                        <div style={{ gridColumn: '1 / -1', background: 'rgba(59, 130, 246, 0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>On-Chain Data Hash (Cryptographic Proof)</p>
                                            <p className="highlight-hash" style={{ margin: 0, width: '100%' }}>{selectedLandDetails.dataHash}</p>
                                        </div>
                                    </div>

                                    {/* --- GOOGLE MAPS IFRAME SECTION --- */}
                                    {selectedLandDetails.latitude && selectedLandDetails.longitude && (
                                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                                            <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2em' }}>📍</span>
                                                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1em' }}>Geolocation Map</h4>
                                            </div>
                                            <iframe
                                                width="100%"
                                                height="350"
                                                style={{ border: 0, display: 'block', filter: 'invert(90%) hue-rotate(180deg) brightness(80%) contrast(120%)' }}
                                                loading="lazy"
                                                allowFullScreen
                                                referrerPolicy="no-referrer-when-downgrade"
                                                src={`https://maps.google.com/maps?q=$${selectedLandDetails.latitude},${selectedLandDetails.longitude}&z=16&output=embed`}
                                            ></iframe>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default ViewLand;