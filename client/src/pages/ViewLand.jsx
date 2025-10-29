// client/src/pages/ViewLand.jsx (Modified to be more robust without MongoDB history field)

import React, { useState } from 'react';
import { ethers } from 'ethers';

const ViewLand = ({ contract }) => {
    const [landIdInput, setLandIdInput] = useState("");
    const [landOwnerHistory, setLandOwnerHistory] = useState([]); // Will store history from blockchain events
    const [selectedLandDetails, setSelectedLandDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeOwnerWallet, setActiveOwnerWallet] = useState(null);

    // Helper to fetch off-chain current details (khasra, value, CURRENT ownerName etc.)
    const fetchOffChainDetails = async (onChainId) => {
        try {
            const response = await fetch(`http://localhost:5000/land-by-onchain-id/${onChainId}`);
            const data = await response.json();
            if (response.ok && data.data) {
                return data.data;
            }
            return null;
        } catch (err) {
            console.error(`Error fetching off-chain details for onChainId ${onChainId}:`, err);
            return null;
        }
    };

    const fetchLandDetails = async () => {
        setError(null);
        setLandOwnerHistory([]);
        setSelectedLandDetails(null);
        setActiveOwnerWallet(null);

        if (!landIdInput) {
            setError("Please enter a Land ID.");
            return;
        }
        if (!contract) {
            setError("Blockchain contract is not ready. Please connect your wallet and refresh.");
            return;
        }

        setLoading(true);
        try {
            const currentLandId = Number(landIdInput);

            // 1. Fetch current on-chain details
            const onChainLandData = await contract.landRecords(currentLandId);

            if (onChainLandData && onChainLandData[1] === ethers.ZeroAddress) {
                setError(`Land with ID ${currentLandId} does not exist on-chain.`);
                setLoading(false);
                return;
            }

            const currentOwnerAddress = onChainLandData[1];
            const onChainDataHash = onChainLandData[2];
            const onChainPropertyAddress = onChainLandData[3];
            const onChainLandArea = onChainLandData[4];

            // 2. Fetch off-chain details for current land (khasra, value, CURRENT ownerName)
            let offChainDetails = await fetchOffChainDetails(currentLandId);

            // Construct current land's full details (combining on-chain & off-chain)
            const fullCurrentLandDetails = {
                id: currentLandId,
                ownerWalletAddress: currentOwnerAddress,
                dataHash: onChainDataHash,
                propertyAddress: onChainPropertyAddress,
                landArea: onChainLandArea,
                ownerName: offChainDetails?.ownerName || "Unknown Current Owner", // Fallback for name
                khasraNo: offChainDetails?.khasraNo || "N/A",
                propertyValue: offChainDetails?.propertyValue || "N/A",
                offChainMongoId: offChainDetails?._id || "N/A",
                isCurrentOwner: true,
                transferDate: offChainDetails?.registrationDate || new Date() // Fallback to current date
            };
            setSelectedLandDetails(fullCurrentLandDetails); // Set current details to right panel
            setActiveOwnerWallet(currentOwnerAddress); // Highlight current owner

            // 3. Fetch ownership history from blockchain events
            const registeredEvents = await contract.queryFilter(
                contract.filters.LandRegistered(currentLandId),
                0,
                "latest"
            );

            const transferredEvents = await contract.queryFilter(
                contract.filters.LandTransferred(currentLandId),
                0,
                "latest"
            );

            let history = [];

            // Add initial registration event
            if (registeredEvents.length > 0) {
                const regEvent = registeredEvents[0];
                const block = await regEvent.getBlock();
                history.push({
                    ownerWalletAddress: regEvent.args.owner,
                    transferDate: new Date(Number(block.timestamp) * 1000),
                    type: 'Registered',
                    ownerName: (regEvent.args.owner.toLowerCase() === currentOwnerAddress.toLowerCase() && offChainDetails?.ownerName) ? offChainDetails.ownerName : "Registered Owner" // Try to get current owner's name
                });
            }

            // Add transfer events
            for (const event of transferredEvents) {
                const block = await event.getBlock();
                history.push({
                    ownerWalletAddress: event.args.newOwner,
                    transferDate: new Date(Number(block.timestamp) * 1000),
                    type: 'Transferred',
                    ownerName: "Transferred Owner" // Can't get historical name easily
                });
            }

            // Sort history by date (oldest first)
            history.sort((a, b) => a.transferDate.getTime() - b.transferDate.getTime());

            // Assign current/previous status and refine names
            const finalHistory = history.map((entry, index) => {
                let ownerNameDisplay = entry.ownerName;
                if (entry.ownerWalletAddress.toLowerCase() === currentOwnerAddress.toLowerCase()) {
                    ownerNameDisplay = offChainDetails?.ownerName || "Current Owner"; // Use current off-chain name if available
                } else if (entry.type === 'Registered' && index === 0 && offChainDetails?.ownerName) {
                    ownerNameDisplay = offChainDetails.ownerName; // For the very first owner, assume it's the name in DB initially
                } else {
                    ownerNameDisplay = "Previous Owner"; // Default for all other historical owners
                }

                return {
                    ...entry,
                    ownerName: ownerNameDisplay,
                    isCurrentOwner: (entry.ownerWalletAddress.toLowerCase() === currentOwnerAddress.toLowerCase()) && (index === history.length - 1)
                };
            });

            // If the last entry in history is not the true current owner, add it
            if (finalHistory.length === 0 || finalHistory[finalHistory.length - 1].ownerWalletAddress.toLowerCase() !== currentOwnerAddress.toLowerCase()) {
                finalHistory.push({
                    ownerWalletAddress: currentOwnerAddress,
                    transferDate: new Date(), // Current date
                    type: 'Current',
                    ownerName: offChainDetails?.ownerName || "Current Owner",
                    isCurrentOwner: true
                });
            }
            
            setLandOwnerHistory(finalHistory);

            if (!offChainDetails) {
                setError(`Warning: On-chain data found for Land ID ${currentLandId}, but off-chain record could not be fetched fully.`);
            }

        } catch (err) {
            console.error("Error fetching land details from blockchain events:", err);
            setError(`Failed to fetch land details: ${err.message || err.toString()}`);
            setLandOwnerHistory([]);
            setSelectedLandDetails(null);
        } finally {
            setLoading(false);
        }
    };

    const handleOwnerCardClick = (owner) => {
        setSelectedLandDetails({
            ...selectedLandDetails,
            ownerName: owner.ownerName,
            ownerWalletAddress: owner.ownerWalletAddress,
            isCurrentOwner: owner.isCurrentOwner,
            transferDate: owner.transferDate
        });
        setActiveOwnerWallet(owner.ownerWalletAddress);
    };

    return (
        <div className="form-container">
            <h2>View Land Details</h2>
            <div className="input-group">
                <input
                    type="number"
                    value={landIdInput}
                    onChange={(e) => setLandIdInput(e.target.value)}
                    placeholder="Enter Land ID (e.g., 1)"
                    min="1"
                    required
                />
                <button onClick={fetchLandDetails} disabled={loading}>
                    {loading ? "Fetching..." : "Get Details"}
                </button>
            </div>

            {error && <p className="error-text">{error}</p>}

            {landOwnerHistory.length > 0 && (
                <div className="view-land-layout">
                    <div className="owner-timeline-section">
                        <h3>Ownership History (Blockchain)</h3>
                        <div className="owner-card-wrapper">
                            {landOwnerHistory.map((owner, index) => (
                                <div
                                    key={`${owner.ownerWalletAddress}-${index}`}
                                    className={`owner-card ${activeOwnerWallet === owner.ownerWalletAddress ? 'active' : ''}`}
                                    onClick={() => handleOwnerCardClick(owner)}
                                >
                                    <p className="owner-card-title">
                                        {owner.isCurrentOwner ? "Current Owner" : `Owner #${index + 1} (${owner.type})`}
                                    </p>
                                    <p className="owner-card-info">
                                        Name: <span className="highlight-text">{owner.ownerName}</span>
                                    </p>
                                    <p className="owner-card-info">
                                        Address: <span className="highlight-address">{owner.ownerWalletAddress}</span>
                                    </p>
                                    <p className="owner-card-info">
                                        Date: {new Date(owner.transferDate).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="full-details-section">
                        {selectedLandDetails ? (
                            <div className="full-details-card">
                                <h3>Land ID: {selectedLandDetails.id}</h3>
                                <p><strong>Owner Status:</strong> {selectedLandDetails.isCurrentOwner ? "Current" : "Historical"}</p>
                                <p><strong>Owner Name:</strong> <span className="highlight-text">{selectedLandDetails.ownerName}</span></p>
                                <p><strong>Owner Wallet Address:</strong> <span className="highlight-address">{selectedLandDetails.ownerWalletAddress}</span></p>
                                <p><strong>Khasra Number:</strong> {selectedLandDetails.khasraNo}</p>
                                <p><strong>Property Address:</strong> {selectedLandDetails.propertyAddress}</p>
                                <p><strong>Land Area:</strong> {selectedLandDetails.landArea}</p>
                                <p><strong>Property Value:</strong> {selectedLandDetails.propertyValue} INR</p>
                                <p><strong>Data Hash (On-chain proof):</strong> <span className="highlight-hash">{selectedLandDetails.dataHash}</span></p>
                                <p><strong>MongoDB Record ID:</strong> {selectedLandDetails.offChainMongoId}</p>
                                {selectedLandDetails.transferDate && (
                                    <p><strong>Associated Date:</strong> {new Date(selectedLandDetails.transferDate).toLocaleDateString()}</p>
                                )}
                                
                            </div>
                        ) : (
                            <p className="no-details-message">Click on an owner card to view full details.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewLand;