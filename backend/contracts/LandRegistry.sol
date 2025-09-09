// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LandRegistry
 * @dev A smart contract for managing and transferring land assets using an on-chain/off-chain hybrid model.
 */
contract LandRegistry {

    // The Land struct now stores a hash of the sensitive off-chain data
    // instead of the data itself, saving cost and preserving privacy.
    struct Land {
        uint landId;            // Unique ID for the land (on-chain)
        address owner;          // The current owner's wallet address (on-chain)
        bytes32 dataHash;       // A secure hash (digital fingerprint) of the off-chain data (on-chain)
        string propertyAddress; // Non-sensitive data that can be stored on-chain for quick reference
        string landArea;        // Non-sensitive data
        bool isForSale;         // Status for future features
        uint price;             // Price for future features
    }

    address public governmentAuthority;
    mapping(uint => Land) public landRecords;
    uint public landCount;

    // Event to notify the frontend/listeners that a new land has been registered.
    // This is more efficient than manually querying for changes.
    event LandRegistered(uint indexed landId, address indexed owner, bytes32 dataHash);

    // The constructor sets the deployer of the contract as the government authority.
    constructor() {
        governmentAuthority = msg.sender;
    }

    // A security modifier to ensure only the government authority can call certain functions.
    modifier onlyGovernment() {
        require(msg.sender == governmentAuthority, "Only government authority can perform this action");
        _;
    }

    /**
     * @dev Registers a new land parcel by storing its proof (hash) on the blockchain.
     * @param _owner The wallet address of the new property owner.
     * @param _dataHash The Keccak256 hash of the sensitive, off-chain property details.
     * @param _propertyAddress The physical address of the property (public data).
     * @param _landArea The area of the land (public data).
     */
    function registerLand(
        address _owner,
        bytes32 _dataHash,
        string memory _propertyAddress,
        string memory _landArea
    ) public onlyGovernment {
        landCount++; // Increment the land counter to generate a new unique ID

        // Store the on-chain proof
        landRecords[landCount] = Land({
            landId: landCount,
            owner: _owner,
            dataHash: _dataHash,
            propertyAddress: _propertyAddress,
            landArea: _landArea,
            isForSale: false,
            price: 0
        });

        // Emit the event to notify the application that a registration occurred
        emit LandRegistered(landCount, _owner, _dataHash);
    }
}