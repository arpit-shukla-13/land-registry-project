import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// LandRegistryABI is not directly needed here if 'contract' prop is a full contract instance
// import LandRegistryABI from '../LandRegistry.json'; 

// Ab props mein se 'contractAddress', 'provider', 'signer' ki jagah
// 'contract' object ko direct use karenge jo App.jsx se aayega.
const Transfer = ({ contract, connectedAccount }) => { // Sirf 'contract' aur 'connectedAccount' ki zaroorat hai
    const [landId, setLandId] = useState("");
    const [newOwnerAddress, setNewOwnerAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentOwner, setCurrentOwner] = useState(""); 
    const [offChainMongoId, setOffChainMongoId] = useState(""); 
    const [governmentAuthorityAddress, setGovernmentAuthorityAddress] = useState(null);

    // Effect to fetch the Government Authority address from the 'contract' prop
    useEffect(() => {
        const fetchGovernmentAuthority = async () => {
            // 'contract' prop ready ho tabhi fetch karein
            if (contract) { 
                try {
                    const govAddress = await contract.governmentAuthority(); // Direct call on 'contract' prop
                    setGovernmentAuthorityAddress(govAddress);
                    console.log("Government Authority fetched (via contract prop):", govAddress);
                } catch (error) {
                    console.error("Error fetching government authority from contract prop:", error);
                    // Agar yahan bhi ENS error aaye to, provider ka issue hai, jo App.jsx se aana chahiye
                }
            }
        };
        fetchGovernmentAuthority();
    }, [contract]); // Dependency 'contract' prop hai

    // Effect to fetch current owner and MongoDB ID based on landId
    useEffect(() => {
        const fetchLandDetails = async () => {
            // 'contract' prop aur landId ready hon tabhi fetch karein
            if (landId && contract) { 
                try {
                    const landData = await contract.landRecords(landId); // Direct call on 'contract' prop
                    if (landData && landData[1] !== ethers.ZeroAddress) { 
                        setCurrentOwner(landData[1]); 
                        
                        const response = await fetch(`http://localhost:5000/land-by-onchain-id/${Number(landData[0])}`);
                        const data = await response.json();
                        if (response.ok && data.data && data.data._id) {
                            setOffChainMongoId(data.data._id);
                        } else {
                            setOffChainMongoId(""); 
                        }

                    } else {
                        setCurrentOwner("Not Found");
                        setOffChainMongoId("");
                    }
                } catch (error) {
                    console.error("Error fetching land details for transfer (via contract prop):", error);
                    setCurrentOwner("Error");
                    setOffChainMongoId("");
                    // Agar yahan bhi ENS error aaye to, provider ka issue hai
                }
            } else {
                setCurrentOwner("");
                setOffChainMongoId("");
            }
        };
        fetchLandDetails();
    }, [landId, contract]); // Dependency 'contract' prop hai

    const handleTransferOwnership = async (e) => {
        e.preventDefault();
        
        // --- Validation check 'contract' prop par ---
        if (!contract) { // 'contract' prop ready ho tabhi aage badhein
            alert("Blockchain contract is not ready.");
            console.error("handleTransferOwnership: contract prop is null.");
            return;
        }
        // ... baaki validations as before ...

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
        if (newOwnerAddress.toLowerCase() === connectedAccount.toLowerCase()) {
            // Updated: New owner cannot be the government authority's address if it's NOT the current owner.
            // Agar GA khud ki zameen transfer kar raha hai to allow hoga.
            // Is validation ko currentOwner ke context mein samjhna hoga.
            // Filhaal, agar GA ek random zameen (jiska currentOwner koi aur hai) ko khud ko transfer kar raha hai,
            // toh woh valid ho sakta hai. Yeh alert tab trigger hota hai jab newOwner GA ka address ho
            // aur woh GA connectedAccount bhi ho.
            // Hum isko thoda loose rakhenge, kyunki GA ko flexibility honi chahiye.
            // Agar aap chahate hain ki GA khud ko kabhi naya owner na bana paye (even from another owner), to ye validation theek hai.
            // Abhi ke liye, hum maanenge ki agar new owner GA ka address hai, aur current owner GA nahin hai, to allow kar sakte hain.
            // Agar currentOwner === connectedAccount (GA), aur newOwner === connectedAccount (GA), to upar wala currentOwner check handle kar lega.
            // Isko remove karte hain for flexibility ya fir specific condition ke saath rakhte hain.
            // Temporary comment out:
            // alert("New owner cannot be the government authority's address if it's not the current owner.");
            // return;
        }


        setLoading(true);

        try {
            console.log(`Attempting to transfer land ID ${landId} from ${currentOwner} to ${newOwnerAddress}`);
            const transaction = await contract.transferOwnership(landId, newOwnerAddress); // Direct call on 'contract' prop
            const receipt = await transaction.wait(); 

            const transferEvent = receipt.logs.find(log => log.eventName === 'LandTransferred');
            if (!transferEvent) {
                throw new Error("LandTransferred event not found. Transfer may have failed.");
            }
            const transferredLandId = transferEvent.args.landId;
            const prevOwner = transferEvent.args.previousOwner;
            const newOwn = transferEvent.args.newOwner;

            console.log(`On-chain transfer successful! Land ID: ${Number(transferredLandId)}, From: ${prevOwner}, To: ${newOwn}`);

            console.log(`Updating off-chain record (MongoDB ID: ${offChainMongoId}) with new owner...`);
            const offChainResponse = await fetch(`http://localhost:5000/update-land-owner/${offChainMongoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newOwnerWalletAddress: newOwnerAddress })
            });

            const offChainData = await offChainResponse.json();
            if (!offChainResponse.ok) {
                throw new Error(offChainData.message || "Failed to update off-chain land owner.");
            }
            console.log("Off-chain update successful:", offChainData.message);

            alert("Ownership Transfer Complete! Both on-chain and off-chain records updated.");
            // Reset form and states
            setLandId(""); 
            setNewOwnerAddress("");
            setCurrentOwner("");
            setOffChainMongoId("");

        } catch (error) {
            console.error("Ownership transfer failed:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Transfer Land Ownership</h2>
            {governmentAuthorityAddress && (
                <p className="info-text">
                    Government Authority: <span className="highlight-address">{governmentAuthorityAddress}</span>
                </p>
            )}
            <form onSubmit={handleTransferOwnership}>
                <input
                    type="number"
                    value={landId}
                    onChange={(e) => setLandId(e.target.value)}
                    placeholder="Land ID to Transfer (e.g., 1)"
                    required
                />
                {landId && currentOwner && currentOwner !== "Not Found" && currentOwner !== "Error" && (
                    <p className="info-text">Current Owner: <span className="highlight-address">{currentOwner}</span></p>
                )}
                {landId && currentOwner === "Not Found" && (
                    <p className ="error-text">No land found with this ID.</p>
                )}
                {landId && currentOwner === "Error" && (
                    <p className="error-text">Error fetching owner.</p>
                )}

                <input
                    type="text"
                    value={newOwnerAddress}
                    onChange={(e) => setNewOwnerAddress(e.target.value)}
                    placeholder="New Owner's Wallet Address"
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Processing Transfer..." : "Transfer Ownership"}
                </button>
            </form>
        </div>
    );
};

export default Transfer;