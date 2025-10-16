// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title OrigamiNFT
 * @dev Production-ready ERC721 NFT contract for Origami Marketplace on QL1 Chain
 * Features: Minting with royalties (max 5%), metadata storage, access control, emergency pause
 * Minting: FREE (no fees)
 */
contract OrigamiNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable, Pausable, AccessControl {
    uint256 private _tokenIds;
    
    uint256 public constant MAX_NFT_SUPPLY = 10000;
    
    uint96 public constant MIN_ROYALTY_PERCENTAGE = 10; // 0.1%
    uint96 public constant MAX_ROYALTY_PERCENTAGE = 500; // 5%
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct NFTMetadata {
        string name;
        string description;
        string category;
        string rarity;
        address creator;
        uint256 createdAt;
    }

    mapping(uint256 => NFTMetadata) public nftMetadata;

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed to,
        string uri,
        string name,
        string description,
        string category,
        string rarity,
        uint96 royaltyPercentage
    );

    event NFTBurned(uint256 indexed tokenId, address indexed owner);
    
    event RoyaltyUpdated(
        uint256 indexed tokenId,
        address indexed receiver,
        uint96 royaltyPercentage
    );

    event MetadataUpdated(
        uint256 indexed tokenId,
        string name,
        string description,
        string category,
        string rarity
    );

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mintNFT(
        address to,
        string memory uri,
        string memory name,
        string memory description,
        string memory category,
        string memory rarity,
        address royaltyReceiver,
        uint96 royaltyPercentage
    ) public onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(_tokenIds < MAX_NFT_SUPPLY, "Max NFT supply reached");
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(uri).length > 0, "URI cannot be empty");
        
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");
        require(bytes(rarity).length > 0, "Rarity cannot be empty");
        
        require(royaltyPercentage >= MIN_ROYALTY_PERCENTAGE, "Royalty must be at least 0.1%");
        require(royaltyPercentage <= MAX_ROYALTY_PERCENTAGE, "Royalty exceeds 5%");
        require(royaltyReceiver != address(0), "Invalid royalty receiver");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);
        _setTokenRoyalty(newTokenId, royaltyReceiver, royaltyPercentage);

        nftMetadata[newTokenId] = NFTMetadata({
            name: name,
            description: description,
            category: category,
            rarity: rarity,
            creator: msg.sender,
            createdAt: block.timestamp
        });

        emit NFTMinted(
            newTokenId,
            msg.sender,
            to,
            uri,
            name,
            description,
            category,
            rarity,
            royaltyPercentage
        );

        return newTokenId;
    }

    function mintBatch(
        address to,
        string[] memory uris,
        string[] memory names,
        string[] memory descriptions,
        string[] memory categories,
        string[] memory rarities,
        address royaltyReceiver,
        uint96 royaltyPercentage
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256[] memory) {
        require(uris.length > 0, "Empty batch");
        require(
            uris.length == names.length &&
            uris.length == descriptions.length &&
            uris.length == categories.length &&
            uris.length == rarities.length,
            "Array length mismatch"
        );
        require(_tokenIds + uris.length <= MAX_NFT_SUPPLY, "Exceeds max supply");

        uint256[] memory tokenIds = new uint256[](uris.length);

        for (uint256 i = 0; i < uris.length; i++) {
            tokenIds[i] = mintNFT(
                to,
                uris[i],
                names[i],
                descriptions[i],
                categories[i],
                rarities[i],
                royaltyReceiver,
                royaltyPercentage
            );
        }

        return tokenIds;
    }

    function updateMetadata(
        uint256 tokenId,
        string memory name,
        string memory description,
        string memory category,
        string memory rarity
    ) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(
            msg.sender == nftMetadata[tokenId].creator || 
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");
        require(bytes(rarity).length > 0, "Rarity cannot be empty");

        nftMetadata[tokenId].name = name;
        nftMetadata[tokenId].description = description;
        nftMetadata[tokenId].category = category;
        nftMetadata[tokenId].rarity = rarity;

        emit MetadataUpdated(tokenId, name, description, category, rarity);
    }

    function burnNFT(uint256 tokenId) external {
        require(_ownerOf(tokenId) == msg.sender, "Not the owner");
        
        _burn(tokenId);
        
        emit NFTBurned(tokenId, msg.sender);
    }

    function addMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, minter);
    }

    function removeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, minter);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function getNFTMetadata(uint256 tokenId) external view returns (NFTMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return nftMetadata[tokenId];
    }

    function getTotalSupply() external view returns (uint256) {
        return _tokenIds;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Royalty, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721)
    {
        super._increaseBalance(account, value);
    }
}
