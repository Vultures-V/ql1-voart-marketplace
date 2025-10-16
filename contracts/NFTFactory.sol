// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OrigamiNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NFTFactory
 * @dev Production-ready factory for deploying NFT collections with enhanced security
 * Each creator can deploy their own ERC721 contract with custom name/symbol
 * Includes validation, limits, and emergency controls
 * Collection Creation: FREE (no fees)
 */
contract NFTFactory is Ownable, Pausable {
    uint256 public constant MAX_NAME_LENGTH = 64;
    uint256 public constant MAX_SYMBOL_LENGTH = 32;
    uint256 public constant MAX_COLLECTIONS_PER_CREATOR = 100;
    
    
    address[] public allCollections;
    mapping(address => address[]) public creatorCollections;
    mapping(address => bool) public isValidCollection;
    
    struct CollectionInfo {
        address collectionAddress;
        address creator;
        string name;
        string symbol;
        uint256 createdAt;
    }
    
    mapping(address => CollectionInfo) public collectionInfo;
    
    event CollectionCreated(
        address indexed collectionAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 createdAt
    );
    
    event CollectionDisabled(
        address indexed collectionAddress,
        address indexed creator
    );
    
    constructor() Ownable(msg.sender) Pausable() {}
    
    function createCollection(
        string memory name,
        string memory symbol
    ) external whenNotPaused returns (address) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(name).length <= MAX_NAME_LENGTH, "Name too long");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(bytes(symbol).length <= MAX_SYMBOL_LENGTH, "Symbol too long");
        
        require(
            creatorCollections[msg.sender].length < MAX_COLLECTIONS_PER_CREATOR,
            "Max collections per creator reached"
        );
        
        
        OrigamiNFT newCollection = new OrigamiNFT(name, symbol);
        address collectionAddress = address(newCollection);
        
        require(collectionAddress != address(0), "Collection deployment failed");
        
        newCollection.addMinter(msg.sender);
        
        newCollection.transferOwnership(msg.sender);
        
        require(newCollection.owner() == msg.sender, "Ownership transfer failed");
        
        collectionInfo[collectionAddress] = CollectionInfo({
            collectionAddress: collectionAddress,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            createdAt: block.timestamp
        });
        
        allCollections.push(collectionAddress);
        creatorCollections[msg.sender].push(collectionAddress);
        isValidCollection[collectionAddress] = true;
        
        emit CollectionCreated(
            collectionAddress,
            msg.sender,
            name,
            symbol,
            block.timestamp
        );
        
        return collectionAddress;
    }
    
    function disableCollection(address collectionAddress) external {
        require(
            msg.sender == collectionInfo[collectionAddress].creator,
            "Only creator can disable"
        );
        require(isValidCollection[collectionAddress], "Already disabled");
        
        isValidCollection[collectionAddress] = false;
        
        emit CollectionDisabled(collectionAddress, msg.sender);
    }
    
    function isValidOrigamiNFT(address collectionAddress) public view returns (bool) {
        return isValidCollection[collectionAddress];
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function getCreatorCollections(address creator) external view returns (address[] memory) {
        return creatorCollections[creator];
    }
    
    function getTotalCollections() external view returns (uint256) {
        return allCollections.length;
    }
    
    function getCollectionInfo(address collectionAddress) 
        external 
        view 
        returns (CollectionInfo memory) 
    {
        require(isValidCollection[collectionAddress], "Invalid collection");
        return collectionInfo[collectionAddress];
    }
    
    function getAllCollections(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory) 
    {
        require(offset < allCollections.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > allCollections.length) {
            end = allCollections.length;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allCollections[i];
        }
        
        return result;
    }
}
