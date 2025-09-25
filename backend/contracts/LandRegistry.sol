// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LandRegistry
 * @dev A smart contract for managing and transferring land assets using an on-chain/off-chain hybrid model.
 */
contract LandRegistry {

    struct Land {
        uint landId;            // Unique ID for the land (on-chain)
        address owner;          // The current owner's wallet address (on-chain)
        bytes32 dataHash;       // A secure hash (digital fingerprint) of the off-chain data (on-chain)
        string propertyAddress; // Non-sensitive data that can be stored on-chain for quick reference
        string landArea;        // Non-sensitive data
        bool isForSale;         // Status for future features (e.g., marketplace)
        uint price;             // Price for future features
    }

    address public governmentAuthority;
    mapping(uint => Land) public landRecords;
    uint public landCount;

    // Event to notify the frontend/listeners that a new land has been registered.
    event LandRegistered(uint indexed landId, address indexed owner, bytes32 dataHash);

    // --- NEW: Event to notify when land ownership is transferred ---
    event LandTransferred(
        uint indexed landId,
        address indexed previousOwner,
        address indexed newOwner
    );

    // The constructor sets the deployer of the contract as the government authority.
    constructor() {
        governmentAuthority = msg.sender;
    }

    // A security modifier to ensure only the government authority can call certain functions.
    modifier onlyGovernment() {
        require(msg.sender == governmentAuthority, "Only government authority can perform this action");
        _;
    }

    // --- NEW: A modifier to ensure only the current owner of the land can perform certain actions ---
    modifier onlyLandOwner(uint _landId) {
        require(landRecords[_landId].owner != address(0), "Land does not exist.");
        require(landRecords[_landId].owner == msg.sender, "Only the current owner can perform this action.");
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

    /**
     * @dev Transfers ownership of a registered land parcel.
     * Only the current owner of the land can initiate the transfer.
     * @param _landId The unique ID of the land parcel to transfer.
     * @param _newOwner The wallet address of the new owner.
     */
    function transferOwnership(uint _landId, address _newOwner)
        public
        onlyLandOwner(_landId) // Only current owner can call this
    {
        require(_newOwner != address(0), "New owner address cannot be zero.");
        require(_newOwner != landRecords[_landId].owner, "New owner cannot be the current owner.");

        address previousOwner = landRecords[_landId].owner;
        landRecords[_landId].owner = _newOwner; // Update the owner

        // Emit the event to record the transfer
        emit LandTransferred(_landId, previousOwner, _newOwner);
    }
}