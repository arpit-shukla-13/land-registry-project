import React, { useState } from 'react';
import { ethers } from 'ethers';

const ViewLand = ({ contract }) => {
    const [landIdInput, setLandIdInput] = useState("");
    const [landHistory, setLandHistory] = useState([]); // To store a list of owner objects for timeline
    const [selectedLandDetails, setSelectedLandDetails] = useState(null); // Full details for the right panel
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeOwnerId, setActiveOwnerId] = useState(null); // To highlight the clicked owner card

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
        setLandHistory([]);
        setSelectedLandDetails(null);
        setActiveOwnerId(null);

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
            const onChainLandData = await contract.landRecords(Number(landIdInput));

            if (onChainLandData && onChainLandData[1] === ethers.ZeroAddress) {
                setError(`Land with ID ${landIdInput} does not exist on-chain.`);
                setLoading(false);
                return;
            }

            const currentOnChainId = Number(onChainLandData[0]);
            const currentOwnerAddress = onChainLandData[1];
            const currentDataHash = onChainLandData[2];
            const currentPropertyAddress = onChainLandData[3];
            const currentLandArea = onChainLandData[4];

            let offChainDetails = await fetchOffChainDetails(currentOnChainId);

            // Construct current owner's details
            const currentOwnerDetails = {
                id: currentOnChainId,
                ownerWalletAddress: currentOwnerAddress,
                dataHash: currentDataHash,
                propertyAddress: currentPropertyAddress,
                landArea: currentLandArea,
                ownerName: offChainDetails?.ownerName || "N/A (Off-chain missing)",
                khasraNo: offChainDetails?.khasraNo || "N/A (Off-chain missing)",
                propertyValue: offChainDetails?.propertyValue || "N/A (Off-chain missing)",
                previousOwnerName: offChainDetails?.previousOwnerName || "N/A (Off-chain missing)",
                offChainMongoId: offChainDetails?._id || "N/A (Off-chain missing)",
                isCurrentOwner: true
            };

            const history = [currentOwnerDetails];

            // For simplicity, we assume previous owners are stored in the `previousOwnerName` field
            // In a real advanced system, you would parse historical events or have a more complex off-chain history
            if (offChainDetails && offChainDetails.previousOwnerName && offChainDetails.previousOwnerName !== "N/A") {
                // This is a simplified approach. Ideally, you'd have a chain of previous owners' wallet addresses
                // and names stored in a more structured way, perhaps through events or an array in MongoDB.
                // For now, we'll just show the immediate previous owner.
                history.push({
                    id: currentOnChainId, // Still linked to the same land ID
                    ownerName: offChainDetails.previousOwnerName,
                    ownerWalletAddress: "N/A (Historical - Address not stored directly)",
                    propertyAddress: currentPropertyAddress, // Property address remains same
                    landArea: currentLandArea,
                    isCurrentOwner: false
                });
            }
            // You can extend this logic if your MongoDB stores a full history array of owners.

            setLandHistory(history);
            // Initially select the current owner's details to show
            setSelectedLandDetails(currentOwnerDetails);
            setActiveOwnerId(currentOnChainId); // Highlight current owner by default

            if (!offChainDetails) {
                setError(`Warning: On-chain data found for Land ID ${landIdInput}, but off-chain record could not be fetched fully.`);
            }

        } catch (err) {
            console.error("Error fetching land details:", err);
            setError(`Failed to fetch land details: ${err.message || err.toString()}`);
            setLandHistory([]);
            setSelectedLandDetails(null);
        } finally {
            setLoading(false);
        }
    };

    // Function to handle clicking on an owner card
    const handleOwnerCardClick = (ownerDetails) => {
        setSelectedLandDetails(ownerDetails);
        setActiveOwnerId(ownerDetails.id); // Set active ID for highlighting
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

            {landHistory.length > 0 && (
                <div className="view-land-layout">
                    {/* Left Panel: Owner Timeline */}
                    <div className="owner-timeline-section">
                        <h3>Ownership History</h3>
                        <div className="owner-card-wrapper">
                            {landHistory.map((owner, index) => (
                                <div 
                                    key={index} 
                                    className={`owner-card ${activeOwnerId === owner.id && owner.isCurrentOwner ? 'active' : ''}`}
                                    onClick={() => handleOwnerCardClick(owner)}
                                >
                                    <p className="owner-card-title">{owner.isCurrentOwner ? "Current Owner" : "Previous Owner"}</p>
                                    <p className="owner-card-info">
                                        Name: <span className="highlight-text">{owner.ownerName}</span>
                                    </p>
                                    {owner.ownerWalletAddress && owner.ownerWalletAddress !== "N/A (Historical - Address not stored directly)" && (
                                        <p className="owner-card-info">
                                            Address: <span className="highlight-address">{owner.ownerWalletAddress}</span>
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Full Details of Selected Owner */}
                    <div className="full-details-section">
                        {selectedLandDetails ? (
                            <div className="full-details-card">
                                <h3>Land ID: {selectedLandDetails.id}</h3>
                                <p><strong>Owner Status:</strong> {selectedLandDetails.isCurrentOwner ? "Current" : "Previous"}</p>
                                <p><strong>Owner Name:</strong> <span className="highlight-text">{selectedLandDetails.ownerName}</span></p>
                                <p><strong>Owner Wallet Address:</strong> <span className="highlight-address">{selectedLandDetails.ownerWalletAddress}</span></p>
                                <p><strong>Khasra Number:</strong> {selectedLandDetails.khasraNo}</p>
                                <p><strong>Property Address:</strong> {selectedLandDetails.propertyAddress}</p>
                                <p><strong>Land Area:</strong> {selectedLandDetails.landArea}</p>
                                <p><strong>Property Value:</strong> {selectedLandDetails.propertyValue} INR</p>
                                <p><strong>Previous Owner Name:</strong> {selectedLandDetails.previousOwnerName}</p>
                                <p><strong>Data Hash (On-chain proof):</strong> <span className="highlight-hash">{selectedLandDetails.dataHash}</span></p>
                                <p><strong>MongoDB Record ID:</strong> {selectedLandDetails.offChainMongoId}</p>
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