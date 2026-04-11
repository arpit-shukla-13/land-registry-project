// client/src/pages/ViewLand.jsx (UPDATED FOR MODERN THEME & FIXED MAP)

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
                    setDisplayedCards(data.data); 
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
            setDisplayedCards(allOffChainLands); 
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = allOffChainLands.filter(land => 
            (land.propertyAddress && land.propertyAddress.toLowerCase().includes(lowerQuery)) ||
            (land.khasraNo && land.khasraNo.toLowerCase().includes(lowerQuery)) ||
            (land.ownerName && land.ownerName.toLowerCase().includes(lowerQuery)) ||
            (land.onChainId && land.onChainId.toString().includes(lowerQuery))
        );

        setSuggestions(filtered.slice(0, 5)); 
        setDisplayedCards(filtered); 
    };

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
        setViewMode('detail'); 

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
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
            height: '200px',
            border: 'none',
            pointerEvents: 'none', 
            filter: 'invert(90%) hue-rotate(180deg) brightness(80%) contrast(120%)'
        },
        cardContent: {
            padding: '25px',
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
                        onBlur={() => setTimeout(() => setSuggestions([]), 200)} 
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
                            <div style={{ fontSize: '40px', marginBottom: '15px' }}>🏚️</div>
                            <h3>No properties found matching your search.</h3>
                        </div>
                    ) : (
                        displayedCards.map((land) => (
                            <div 
                                key={`card-${land._id}`} 
                                style={styles.card}
                                onClick={() => openPropertyDetails(land)}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                            >
                                {/* Mini Map Thumbnail (FIXED URL) */}
                                {land.latitude && land.longitude ? (
                                    <iframe
                                        style={styles.cardMap}
                                        // Standard embed URL with marker at given coordinates
                                        src={`https://maps.google.com/maps?q=${land.latitude},${land.longitude}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                        title={`Map-${land.khasraNo}`}
                                        tabIndex="-1"
                                    ></iframe>
                                ) : (
                                    <div style={{...styles.cardMap, backgroundColor: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px'}}>
                                        🗺️
                                    </div>
                                )}
                                
                                {/* Card Info */}
                                <div style={styles.cardContent}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                            Token #{land.onChainId || 'Pending'}
                                        </span>
                                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                            VERIFIED
                                        </span>
                                    </div>
                                    
                                    <h4 style={{ margin: '0 0 15px 0', fontSize: '18px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {land.propertyAddress}
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                                        <span style={{ display: 'flex', justifyContent: 'space-between' }}><span>Khasra:</span> <strong style={{ color: 'var(--text-dark)' }}>{land.khasraNo}</strong></span>
                                        <span style={{ display: 'flex', justifyContent: 'space-between' }}><span>Owner:</span> <strong style={{ color: 'var(--text-dark)' }}>{land.ownerName}</strong></span>
                                        <span style={{ display: 'flex', justifyContent: 'space-between' }}><span>Area:</span> <strong style={{ color: 'var(--text-dark)' }}>{land.landArea}</strong></span>
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)', fontSize: '22px', fontWeight: '800', color: 'var(--success-color)' }}>
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
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-input)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
                ← Back to Search Results
            </button>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px', animation: 'spin 2s linear infinite' }}>⚙️</div>
                    <h2 className="loading-text">Fetching Cryptographic Proofs...</h2>
                </div>
            ) : error ? (
                <div className="error-text" style={{ padding: '30px', fontSize: '1.2em' }}>{error}</div>
            ) : (
                landOwnerHistory.length > 0 && (
                    <div className="view-land-layout">
                        
                        {/* Left Panel: Owner Timeline */}
                        <div className="owner-timeline-section">
                            <h3 style={{ fontSize: '1.3em', paddingBottom: '20px' }}><span style={{ marginRight: '10px' }}>📜</span> Ownership Timeline</h3>
                            <div className="owner-card-wrapper">
                                {landOwnerHistory.map((owner, index) => (
                                    <div
                                        key={`${owner.ownerWalletAddress}-${new Date(owner.transferDate).getTime()}-${index}`}
                                        className={`owner-card ${activeOwnerWallet === owner.ownerWalletAddress && owner.isCurrentOwner ? 'active' : ''}`}
                                        onClick={() => handleOwnerCardClick(owner)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <p className="owner-card-title" style={{ margin: 0, fontSize: '1em' }}>
                                                {owner.isCurrentOwner ? "👑 Current Owner" : `🕰️ Owner #${index + 1}`}
                                            </p>
                                            <span style={{ fontSize: '0.8em', color: owner.isCurrentOwner ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                                                {new Date(owner.transferDate).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                        <p className="owner-card-info" style={{ marginBottom: '8px' }}>
                                            <strong style={{color: 'inherit'}}>Name:</strong> <span className="highlight-text">{owner.ownerName}</span>
                                        </p>
                                        <p className="owner-card-info" style={{ overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '30px' }}>
                                        <h3 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0, fontSize: '2em' }}>
                                            Asset Token <span style={{ color: 'var(--primary-color)' }}>#{selectedLandDetails.id}</span>
                                        </h3>
                                        <span style={{ 
                                            background: selectedLandDetails.isCurrentOwner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                                            color: selectedLandDetails.isCurrentOwner ? 'var(--success-color)' : 'var(--warning)', 
                                            padding: '8px 16px', borderRadius: '8px', fontSize: '0.85em', fontWeight: 'bold', textTransform: 'uppercase'
                                        }}>
                                            {selectedLandDetails.isCurrentOwner ? "Current Record" : "Historical Record"}
                                        </span>
                                    </div>

                                    {/* Dashboard Data Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                                        
                                        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner Name</p>
                                            <p style={{ margin: 0, fontSize: '1.2em', fontWeight: '600', color: 'var(--text-main)' }}>{selectedLandDetails.ownerName}</p>
                                        </div>

                                        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Khasra Number</p>
                                            <p style={{ margin: 0, fontSize: '1.2em', fontWeight: '600', color: 'var(--text-main)' }}>{selectedLandDetails.khasraNo}</p>
                                        </div>

                                        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Land Area</p>
                                            <p style={{ margin: 0, fontSize: '1.2em', fontWeight: '600', color: 'var(--text-main)' }}>{selectedLandDetails.landArea}</p>
                                        </div>

                                        <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market Value</p>
                                            <p style={{ margin: 0, fontSize: '1.2em', fontWeight: '600', color: 'var(--success-color)' }}>{formatCurrency(selectedLandDetails.propertyValue)}</p>
                                        </div>

                                        <div style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner Wallet Address</p>
                                            <p style={{ margin: 0, fontSize: '1.1em', color: 'var(--secondary-color)', fontFamily: "'Fira Code', monospace", wordBreak: 'break-all' }}>{selectedLandDetails.ownerWalletAddress}</p>
                                        </div>

                                        <div style={{ gridColumn: '1 / -1', background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Physical Property Address</p>
                                            <p style={{ margin: 0, fontSize: '1.1em', color: 'var(--text-main)' }}>{selectedLandDetails.propertyAddress}</p>
                                        </div>

                                        <div style={{ gridColumn: '1 / -1', background: 'rgba(59, 130, 246, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>On-Chain Data Hash (Cryptographic Proof)</p>
                                            <p className="highlight-hash" style={{ margin: 0, width: '100%', fontSize: '1em' }}>{selectedLandDetails.dataHash}</p>
                                        </div>
                                    </div>

                                    {/* --- GOOGLE MAPS IFRAME SECTION (FIXED URL) --- */}
                                    {selectedLandDetails.latitude && selectedLandDetails.longitude && (
                                        <div style={{ borderRadius: '15px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                                            <div style={{ padding: '15px 25px', backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.4em' }}>📍</span>
                                                <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2em' }}>Geolocation Map</h4>
                                            </div>
                                            <iframe
                                                width="100%"
                                                height="400"
                                                style={{ border: 0, display: 'block', filter: 'invert(90%) hue-rotate(180deg) brightness(80%) contrast(120%)' }}
                                                loading="lazy"
                                                allowFullScreen
                                                referrerPolicy="no-referrer-when-downgrade"
                                                // Standard embed URL with marker at given coordinates
                                                src={`https://maps.google.com/maps?q=${selectedLandDetails.latitude},${selectedLandDetails.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                            ></iframe>
                                        </div>
                                    )}
                                    {/* ---------------------------------- */}

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