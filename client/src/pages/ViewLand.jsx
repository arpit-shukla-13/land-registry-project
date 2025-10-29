// client/src/pages/ViewLand.jsx (UPDATED for correct history display)

import React, { useState } from 'react';
import { ethers } from 'ethers';

const ViewLand = ({ contract }) => {
    const [landIdInput, setLandIdInput] = useState("");
    const [landOwnerHistory, setLandOwnerHistory] = useState([]); // Will store the full history from MongoDB
    const [selectedLandDetails, setSelectedLandDetails] = useState(null); // Full details for the right panel
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeOwnerWallet, setActiveOwnerWallet] = useState(null); // To highlight the clicked owner card

    // Helper function to fetch off-chain data for a given onChainId
    const fetchOffChainDetails = async (onChainId) => {
        try {
            const response = await fetch(`http://localhost:5000/land-by-onchain-id/${onChainId}`);
            const data = await response.json();
            if (response.ok && data.data) {
                return data.data;
            }
            return null; // Off-chain record not found
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

            const currentOnChainOwnerAddress = onChainLandData[1];
            const onChainDataHash = onChainLandData[2];
            const onChainPropertyAddress = onChainLandData[3];
            const onChainLandArea = onChainLandData[4];

            // 2. Fetch off-chain details for current land, including the ownershipHistory array
            let offChainDetails = await fetchOffChainDetails(currentLandId);

            // If no off-chain details are found, provide a basic view
            if (!offChainDetails) {
                const basicDetails = {
                    id: currentLandId,
                    ownerWalletAddress: currentOnChainOwnerAddress,
                    dataHash: onChainDataHash,
                    propertyAddress: onChainPropertyAddress,
                    landArea: onChainLandArea,
                    ownerName: "N/A (Off-chain missing)",
                    khasraNo: "N/A",
                    propertyValue: "N/A",
                    offChainMongoId: "N/A",
                    isCurrentOwner: true,
                    transferDate: new Date()
                };
                setLandOwnerHistory([basicDetails]);
                setSelectedLandDetails(basicDetails);
                setActiveOwnerWallet(currentOnChainOwnerAddress);
                setError(`Warning: On-chain data found for Land ID ${currentLandId}, but off-chain record could not be fetched fully.`);
                setLoading(false);
                return;
            }

            // Construct the full history list from MongoDB's ownershipHistory and current owner details
            let fullTimeline = [];

            // Add all previous owners from MongoDB's ownershipHistory array
            // They are already in chronological order (oldest first) due to backend push
            offChainDetails.ownershipHistory.forEach(record => {
                fullTimeline.push({
                    ownerWalletAddress: record.ownerWalletAddress,
                    ownerName: record.ownerName,
                    transferDate: new Date(record.transferDate), // Ensure it's a Date object
                    isCurrentOwner: false,
                    type: 'Previous'
                });
            });

            // Add the CURRENT owner's info (from the main fields of the MongoDB record)
            // This will be the very last entry in our chronological history
            fullTimeline.push({
                ownerWalletAddress: offChainDetails.ownerWalletAddress,
                ownerName: offChainDetails.ownerName,
                transferDate: offChainDetails.registrationDate ? new Date(offChainDetails.registrationDate) : new Date(), // Use registrationDate or current date
                isCurrentOwner: true,
                type: 'Current'
            });

            // Ensure the active owner for highlighting and display is the *actual* current owner
            const currentOwnerDetailsForDisplay = {
                id: currentLandId,
                ownerWalletAddress: offChainDetails.ownerWalletAddress, // Use current owner from off-chain
                dataHash: onChainDataHash, // On-chain data hash
                propertyAddress: offChainDetails.propertyAddress, // Use current property address from off-chain
                landArea: offChainDetails.landArea,
                ownerName: offChainDetails.ownerName,
                khasraNo: offChainDetails.khasraNo,
                propertyValue: offChainDetails.propertyValue,
                offChainMongoId: offChainDetails._id,
                isCurrentOwner: true,
                transferDate: offChainDetails.registrationDate ? new Date(offChainDetails.registrationDate) : new Date()
            };

            setLandOwnerHistory(fullTimeline);
            setSelectedLandDetails(currentOwnerDetailsForDisplay);
            setActiveOwnerWallet(offChainDetails.ownerWalletAddress); // Set active to current owner by default

        } catch (err) {
            console.error("Error fetching land details:", err);
            setError(`Failed to fetch land details: ${err.message || err.toString()}`);
            setLandOwnerHistory([]);
            setSelectedLandDetails(null);
        } finally {
            setLoading(false);
        }
    };

    // Function to handle clicking on an owner card
    const handleOwnerCardClick = (owner) => {
        // When clicking on a historical owner, update the right panel to show their name/address
        // while retaining other land-specific details (khasra, address, value) as they are now.
        setSelectedLandDetails(prevDetails => ({
            ...prevDetails, // Keep the *current* state of the land's fixed details
            ownerName: owner.ownerName, // Override with selected owner's name
            ownerWalletAddress: owner.ownerWalletAddress, // Override with selected owner's address
            isCurrentOwner: owner.isCurrentOwner,
            transferDate: owner.transferDate // Display transfer date of the selected owner
        }));
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
                    {/* Left Panel: Owner Timeline */}
                    <div className="owner-timeline-section">
                        <h3>Ownership History</h3>
                        <div className="owner-card-wrapper">
                            {landOwnerHistory.map((owner, index) => (
                                <div
                                    key={`${owner.ownerWalletAddress}-${new Date(owner.transferDate).getTime()}-${index}`} // Unique key
                                    className={`owner-card ${activeOwnerWallet === owner.ownerWalletAddress && owner.isCurrentOwner ? 'active' : ''}`}
                                    onClick={() => handleOwnerCardClick(owner)}
                                >
                                    <p className="owner-card-title">
                                        {owner.isCurrentOwner ? "Current Owner" : `Owner #${index + 1}`}
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

                    {/* Right Panel: Full Details of Selected Land */}
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