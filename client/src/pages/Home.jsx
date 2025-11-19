import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // Make sure ethers is imported
import LandRegistryABI from '../LandRegistry.json'; // Import ABI

const Home = ({ contract, provider }) => { // Signer ko yahan se remove kar sakte hain, ya sirf ignore kar sakte hain. We'll use 'provider'.
    const [registeredLands, setRegisteredLands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllLands = async () => {
            // Check only for provider and contract object
            if (provider && contract && contract.target) { 
                try {
                    setLoading(true);

                    // FIX: Create a contract instance using the read-only 'provider'
                    const contractInstance = new ethers.Contract(
                        contract.target, // Use the contract address
                        LandRegistryABI.abi,
                        provider // Use the provider for read-only (view/pure) calls
                    );

                    // landCount() is a public state variable, so it has a getter function
                    const countBigInt = await contractInstance.landCount(); 
                    const count = Number(countBigInt); // Convert BigInt to Number for iteration

                    const lands = [];
                    for (let i = 1; i <= count; i++) {
                        // landRecords(i) is also a public mapping getter, so use provider instance
                        const landData = await contractInstance.landRecords(i);

                        lands.push({
                            landId: Number(landData[0]), // Convert BigInt to Number
                            owner: landData[1],
                            dataHash: landData[2],
                            propertyAddress: landData[3],
                            landArea: landData[4]
                        });
                    }
                    setRegisteredLands(lands.reverse()); 
                } catch (error) {
                    console.error("Error fetching lands:", error);
                    // Display a user-friendly error if the contract call failed
                    if (error.message.includes("could not decode result data")) {
                        alert("Error: Contract communication failed. Please ensure Hardhat is running and the address in App.jsx is correct.");
                    }
                } finally {
                    setLoading(false);
                }
            } else if (!provider || !contract || !contract.target) {
                // If provider or contract is not ready, stop loading quickly
                setLoading(false);
            }
        };

        fetchAllLands();
        // Dependency array updated to react only when provider or contract changes
    }, [provider, contract]); 

    if (loading) {
        return <h2 className="loading-text">Loading On-Chain Data...</h2>;
    }

    return (
        <div className="lands-container">
            <h2>Registered Properties</h2>
            {registeredLands.length === 0 ? (
                <p className="no-data-text">No properties registered yet.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data Hash (Digital Fingerprint)</th>
                            <th>Owner Wallet</th>
                            <th>Property Address</th>
                            <th>Area</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registeredLands.map((land) => (
                            <tr key={land.landId}>
                                <td>{land.landId}</td>
                                <td className="font-mono text-xs">{land.dataHash}</td>
                                <td className="font-mono text-xs">{land.owner}</td>
                                <td>{land.propertyAddress}</td>
                                <td>{land.landArea}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Home;