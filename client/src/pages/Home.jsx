import React, { useState, useEffect } from 'react';

const Home = ({ contract }) => {
    const [registeredLands, setRegisteredLands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllLands = async () => {
            if (contract) {
                try {
                    setLoading(true);
                    const count = await contract.landCount();
                    const lands = [];
                    for (let i = 1; i <= count; i++) {
                        const landData = await contract.landRecords(i);

                        // --- FINAL FIX: Accessing struct members by their index from the contract ---
                        // Based on the Land struct in LandRegistry.sol:
                        // 0: landId
                        // 1: owner
                        // 2: dataHash
                        // 3: propertyAddress
                        // 4: landArea
                        // (Indices 5 and 6 are for isForSale and price, which we don't display here)

                        lands.push({
                            landId: landData[0],          // uint landId
                            owner: landData[1],           // address owner
                            dataHash: landData[2],        // bytes32 dataHash
                            propertyAddress: landData[3], // string propertyAddress
                            landArea: landData[4]         // string landArea
                        });
                    }
                    setRegisteredLands(lands.reverse()); 
                } catch (error) {
                    console.error("Error fetching lands:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchAllLands();
    }, [contract]);

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