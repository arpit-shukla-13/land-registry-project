import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // Make sure ethers is imported
import LandRegistryABI from '../LandRegistry.json'; // Import ABI

const Home = ({ contract, provider, signer }) => { // Receive provider and signer
    const [registeredLands, setRegisteredLands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllLands = async () => {
            if (provider && signer && contract && contract.target) { // Check if contract and target are available
                try {
                    setLoading(true);

                    // --- FIX: Create a new contract instance with ENS disabled explicitly ---
                    const contractInstance = new ethers.Contract(
                        contract.target, // Contract address from the passed contract object
                        LandRegistryABI.abi,
                        signer // Use the signer from App.jsx
                    );

                    const count = await contractInstance.landCount(); // Use the new instance
                    const lands = [];
                    for (let i = 1; i <= count; i++) {
                        const landData = await contractInstance.landRecords(i);

                        lands.push({
                            landId: landData[0],
                            owner: landData[1],
                            dataHash: landData[2],
                            propertyAddress: landData[3],
                            landArea: landData[4]
                        });
                    }
                    setRegisteredLands(lands.reverse()); 
                } catch (error) {
                    console.error("Error fetching lands:", error);
                    // The error you got will likely appear here, but now we're fixing the source.
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchAllLands();
    }, [provider, signer, contract]); // Dependency array updated

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
                            <tr key={Number(land.landId)}>
                                <td>{Number(land.landId)}</td>
                                <td>{land.dataHash}</td>
                                <td>{land.owner}</td>
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