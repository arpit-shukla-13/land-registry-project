import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // For ethers.ZeroAddress check

const ViewLand = ({ contract }) => { // Sirf 'contract' prop ki zaroorat hai
    const [landIdInput, setLandIdInput] = useState("");
    const [landDetails, setLandDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLandDetails = async () => {
        setError(null); // Clear previous errors
        setLandDetails(null); // Clear previous details

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
            // 1. Fetch On-chain details
            const onChainLandData = await contract.landRecords(Number(landIdInput));

            // Check if land exists on-chain (owner address is not zero address)
            if (onChainLandData && onChainLandData[1] === ethers.ZeroAddress) {
                setError(`Land with ID ${landIdInput} does not exist on-chain.`);
                setLoading(false);
                return;
            }

            // Extract relevant on-chain data
            const onChainOwnerAddress = onChainLandData[1];
            const onChainDataHash = onChainLandData[2];
            const onChainPropertyAddress = onChainLandData[3];
            const onChainLandArea = onChainLandData[4];
            const onChainId = Number(onChainLandData[0]); // landId

            // 2. Fetch Off-chain details using onChainId
            const offChainResponse = await fetch(`http://localhost:5000/land-by-onchain-id/${onChainId}`);
            const offChainData = await offChainResponse.json();

            if (!offChainResponse.ok || !offChainData.data) {
                // If off-chain record is not found, it's a soft error; we still show on-chain data
                setLandDetails({
                    // On-chain details
                    id: onChainId,
                    ownerWalletAddress: onChainOwnerAddress,
                    dataHash: onChainDataHash,
                    propertyAddress: onChainPropertyAddress,
                    landArea: onChainLandArea,
                    // Off-chain details (marked as missing)
                    ownerName: "N/A (Off-chain record missing)",
                    khasraNo: "N/A (Off-chain record missing)",
                    propertyValue: "N/A (Off-chain record missing)",
                    previousOwnerName: "N/A (Off-chain record missing)",
                    offChainMongoId: "N/A (Off-chain record missing)"
                });
                setError(`Warning: On-chain data found for Land ID ${landIdInput}, but off-chain record could not be fetched.`);
            } else {
                // Combine both on-chain and off-chain data
                setLandDetails({
                    // On-chain details
                    id: onChainId,
                    ownerWalletAddress: onChainOwnerAddress,
                    dataHash: onChainDataHash,
                    propertyAddress: onChainPropertyAddress,
                    landArea: onChainLandArea,
                    // Off-chain details
                    ownerName: offChainData.data.ownerName,
                    khasraNo: offChainData.data.khasraNo,
                    propertyValue: offChainData.data.propertyValue,
                    previousOwnerName: offChainData.data.previousOwnerName,
                    offChainMongoId: offChainData.data._id
                });
            }

        } catch (err) {
            console.error("Error fetching land details:", err);
            setError(`Failed to fetch land details: ${err.message || err.toString()}`);
            setLandDetails(null);
        } finally {
            setLoading(false);
        }
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

            {landDetails && (
                <div className="land-details-card">
                    <h3>Land ID: {landDetails.id}</h3>
                    <p><strong>Owner Wallet Address:</strong> <span className="highlight-address">{landDetails.ownerWalletAddress}</span></p>
                    <p><strong>Owner Name:</strong> {landDetails.ownerName}</p>
                    <p><strong>Khasra Number:</strong> {landDetails.khasraNo}</p>
                    <p><strong>Property Address:</strong> {landDetails.propertyAddress}</p>
                    <p><strong>Land Area:</strong> {landDetails.landArea}</p>
                    <p><strong>Property Value:</strong> {landDetails.propertyValue} INR</p>
                    <p><strong>Previous Owner Name:</strong> {landDetails.previousOwnerName}</p>
                    <p><strong>Data Hash (On-chain proof):</strong> <span className="highlight-hash">{landDetails.dataHash}</span></p>
                    <p><strong>MongoDB Record ID:</strong> {landDetails.offChainMongoId}</p>
                </div>
            )}
        </div>
    );
};

export default ViewLand;