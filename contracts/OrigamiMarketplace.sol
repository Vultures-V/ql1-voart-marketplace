// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title OrigamiMarketplace
 * @dev Production-ready NFT Marketplace for QL1 Chain
 * Commission: 3% from buyer + 3% from seller = 6% total platform fee
 * Platform Donation: 1% of sale price from royalty
 * Creator Royalty: 0.1-5% (validated on-chain)
 * Whitelist: Admin-controlled access for listing and buying
 */
contract OrigamiMarketplace is ReentrancyGuard, Ownable, Pausable {
    IERC20 public immutable qomToken;
    address public adminBudgetAddress;
    address public nftFactory;

    uint256 public constant BUYER_COMMISSION = 300;  // 3%
    uint256 public constant SELLER_COMMISSION = 300; // 3%
    uint256 public constant PLATFORM_DONATION = 100; // 1% platform donation from royalty
    uint256 public constant MAX_ROYALTY = 500;       // 5%
    uint256 private constant BASIS_POINTS = 10000;
    
    uint256 public constant MINIMUM_PRICE = 1 ether; // 1 QOM minimum
    uint256 public constant LISTING_DURATION = 30 days;

    mapping(address => bool) public whitelist;
    bool public whitelistEnabled;
    uint256 public whitelistCount;

    struct Listing {
        uint256 tokenId;
        address nftContract;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
        uint256 expiresAt; // Added expiration time
    }

    struct Offer {
        address buyer;
        address seller;
        uint256 offerAmount;
        uint256 expiresAt;
        bool isActive;
    }

    mapping(bytes32 => Listing) public listings;
    mapping(bytes32 => Offer[]) public offers;

    event ItemListed(
        bytes32 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        uint256 expiresAt
    );

    event ItemSold(
        bytes32 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price,
        uint256 platformFee,
        uint256 royaltyAmount
    );

    event ItemDelisted(bytes32 indexed listingId);

    event OfferMade(
        bytes32 indexed offerId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address buyer,
        uint256 offerAmount,
        uint256 expiresAt
    );

    event OfferAccepted(
        bytes32 indexed offerId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address buyer,
        uint256 offerAmount
    );

    event OfferCancelled(bytes32 indexed offerId, uint256 offerIndex);
    
    event OfferRejected(bytes32 indexed offerId, uint256 offerIndex);
    
    event RoyaltyCapped(address indexed nftContract, uint256 indexed tokenId, uint256 cappedRoyalty);

    event WhitelistEnabled(bool enabled);
    event AddressWhitelisted(address indexed account, address indexed admin);
    event AddressRemovedFromWhitelist(address indexed account, address indexed admin);

    constructor(address _qomToken, address _adminBudgetAddress, address _nftFactory) Ownable(msg.sender) {
        require(_qomToken != address(0), "Invalid QOM token address");
        require(_adminBudgetAddress != address(0), "Invalid admin address");
        require(_nftFactory != address(0), "Invalid factory address");
        
        qomToken = IERC20(_qomToken);
        adminBudgetAddress = _adminBudgetAddress;
        nftFactory = _nftFactory;
        whitelistEnabled = false;
    }

    modifier onlyWhitelisted() {
        if (whitelistEnabled) {
            require(whitelist[msg.sender] || msg.sender == owner(), "Not whitelisted");
        }
        _;
    }

    /**
     * @dev List an NFT for sale
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT to list
     * @param price Sale price in QOM tokens (must be >= MINIMUM_PRICE)
     */
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant onlyWhitelisted whenNotPaused {
        require(price >= MINIMUM_PRICE, "Price below minimum");
        
        require(_isValidCollection(nftContract), "Invalid NFT collection");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        bytes32 listingId = keccak256(abi.encodePacked(nftContract, tokenId, msg.sender));
        require(!listings[listingId].isActive, "Already listed");

        uint256 expiresAt = block.timestamp + LISTING_DURATION;

        listings[listingId] = Listing({
            tokenId: tokenId,
            nftContract: nftContract,
            seller: msg.sender,
            price: price,
            isActive: true,
            listedAt: block.timestamp,
            expiresAt: expiresAt
        });

        emit ItemListed(listingId, nftContract, tokenId, msg.sender, price, expiresAt);
    }

    /**
     * @dev Buy a listed NFT
     * Buyer pays: price + 3% buyer commission
     * Seller receives: price - 3% seller commission - royalty
     * Platform receives: 6% total (3% from buyer + 3% from seller) + 1% donation from sale
     */
    function buyItem(bytes32 listingId) external nonReentrant onlyWhitelisted whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.isActive && block.timestamp <= listing.expiresAt, "Listing expired or not active");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        IERC721 nft = IERC721(listing.nftContract);
        require(
            nft.isApprovedForAll(listing.seller, address(this)) || 
            nft.getApproved(listing.tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 price = listing.price;
        address seller = listing.seller;
        address buyer = msg.sender;

        uint256 buyerCommission = (price * BUYER_COMMISSION) / BASIS_POINTS; // 3%
        uint256 sellerCommission = (price * SELLER_COMMISSION) / BASIS_POINTS; // 3%

        // Get and validate royalty
        (address royaltyReceiver, uint256 royaltyAmount) = _getRoyaltyInfo(
            listing.nftContract,
            listing.tokenId,
            price
        );

        uint256 platformDonation = (price * PLATFORM_DONATION) / BASIS_POINTS;
        uint256 actualPlatformDonation = royaltyAmount >= platformDonation ? platformDonation : royaltyAmount;
        uint256 creatorRoyalty = royaltyAmount;
        uint256 totalPlatformFee = buyerCommission + sellerCommission + actualPlatformDonation;

        // Calculate payments
        uint256 totalBuyerPayment = price + buyerCommission;
        uint256 sellerNetAmount = price - sellerCommission - royaltyAmount;

        // Transfer QOM from buyer to contract
        require(
            qomToken.transferFrom(buyer, address(this), totalBuyerPayment),
            "Payment failed"
        );

        if (creatorRoyalty > 0 && royaltyReceiver != address(0)) {
            require(
                qomToken.transfer(royaltyReceiver, creatorRoyalty),
                "Royalty payment failed"
            );
        }

        // Pay seller
        require(
            qomToken.transfer(seller, sellerNetAmount),
            "Seller payment failed"
        );

        require(
            qomToken.transfer(adminBudgetAddress, totalPlatformFee),
            "Platform fee payment failed"
        );

        // Transfer NFT to buyer
        nft.safeTransferFrom(seller, buyer, listing.tokenId);

        // Deactivate listing
        listing.isActive = false;

        emit ItemSold(
            listingId,
            listing.nftContract,
            listing.tokenId,
            seller,
            buyer,
            price,
            totalPlatformFee,
            royaltyAmount
        );
    }

    /**
     * @dev Delist an NFT
     */
    function delistItem(bytes32 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing not active");

        listing.isActive = false;

        emit ItemDelisted(listingId);
    }

    /**
     * @dev Make an offer on an NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT
     * @param seller Address of the NFT owner
     * @param offerAmount Offer amount in QOM tokens (must be >= MINIMUM_PRICE)
     * @param expiryDays Number of days until offer expires (1-30)
     */
    function makeOffer(
        address nftContract,
        uint256 tokenId,
        address seller,
        uint256 offerAmount,
        uint256 expiryDays
    ) external nonReentrant onlyWhitelisted whenNotPaused {
        require(offerAmount >= MINIMUM_PRICE, "Offer below minimum");
        require(expiryDays > 0 && expiryDays <= 30, "Invalid expiry (1-30 days)");
        require(seller != msg.sender, "Cannot offer to yourself");

        require(_isValidCollection(nftContract), "Invalid NFT collection");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == seller, "Seller not owner");

        bytes32 offerId = keccak256(
            abi.encodePacked(nftContract, tokenId, msg.sender, block.timestamp)
        );

        uint256 expiresAt = block.timestamp + (expiryDays * 1 days);

        offers[offerId].push(Offer({
            buyer: msg.sender,
            seller: seller,
            offerAmount: offerAmount,
            expiresAt: expiresAt,
            isActive: true
        }));

        emit OfferMade(offerId, nftContract, tokenId, msg.sender, offerAmount, expiresAt);
    }

    /**
     * @dev Accept an offer
     */
    function acceptOffer(
        bytes32 offerId,
        uint256 offerIndex,
        address nftContract,
        uint256 tokenId
    ) external nonReentrant onlyWhitelisted whenNotPaused { // Added whitelist and pause checks
        Offer storage offer = offers[offerId][offerIndex];
        require(offer.isActive, "Offer not active");
        require(offer.seller == msg.sender, "Not the seller");
        require(block.timestamp <= offer.expiresAt, "Offer expired");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 offerAmount = offer.offerAmount;
        address buyer = offer.buyer;
        address seller = msg.sender;

        uint256 buyerCommission = (offerAmount * BUYER_COMMISSION) / BASIS_POINTS; // 3%
        uint256 sellerCommission = (offerAmount * SELLER_COMMISSION) / BASIS_POINTS; // 3%

        // Get and validate royalty
        (address royaltyReceiver, uint256 royaltyAmount) = _getRoyaltyInfo(
            nftContract,
            tokenId,
            offerAmount
        );

        uint256 platformDonation = (offerAmount * PLATFORM_DONATION) / BASIS_POINTS;
        uint256 actualPlatformDonation = royaltyAmount >= platformDonation ? platformDonation : royaltyAmount;
        uint256 creatorRoyalty = royaltyAmount;
        uint256 totalPlatformFee = buyerCommission + sellerCommission + actualPlatformDonation;

        // Calculate payments
        uint256 totalBuyerPayment = offerAmount + buyerCommission;
        uint256 sellerNetAmount = offerAmount - sellerCommission - royaltyAmount;

        // Transfer QOM from buyer
        require(
            qomToken.transferFrom(buyer, address(this), totalBuyerPayment),
            "Payment failed"
        );

        if (creatorRoyalty > 0 && royaltyReceiver != address(0)) {
            require(
                qomToken.transfer(royaltyReceiver, creatorRoyalty),
                "Royalty payment failed"
            );
        }

        // Pay seller
        require(
            qomToken.transfer(seller, sellerNetAmount),
            "Seller payment failed"
        );

        require(
            qomToken.transfer(adminBudgetAddress, totalPlatformFee),
            "Platform fee payment failed"
        );

        // Transfer NFT
        nft.safeTransferFrom(seller, buyer, tokenId);

        // Deactivate offer
        offer.isActive = false;

        emit OfferAccepted(offerId, nftContract, tokenId, buyer, offerAmount);
    }

    /**
     * @dev Cancel an offer (buyer only)
     */
    function cancelOffer(bytes32 offerId, uint256 offerIndex) external onlyWhitelisted { // Added whitelist check
        Offer storage offer = offers[offerId][offerIndex];
        require(offer.buyer == msg.sender, "Not the buyer");
        require(offer.isActive, "Offer not active");

        offer.isActive = false;

        emit OfferCancelled(offerId, offerIndex);
    }

    /**
     * @dev Reject an offer (seller only)
     */
    function rejectOffer(bytes32 offerId, uint256 offerIndex) external onlyWhitelisted {
        Offer storage offer = offers[offerId][offerIndex];
        require(offer.seller == msg.sender, "Not the seller");
        require(offer.isActive, "Offer not active");

        offer.isActive = false;

        emit OfferRejected(offerId, offerIndex);
    }

    /**
     * @dev Clean expired offers to optimize gas
     */
    function cleanExpiredOffers(bytes32 offerId) external {
        Offer[] storage offerList = offers[offerId];
        for (uint256 i = 0; i < offerList.length; i++) {
            if (offerList[i].isActive && block.timestamp > offerList[i].expiresAt) {
                offerList[i].isActive = false;
                emit OfferCancelled(offerId, i);
            }
        }
    }

    /**
     * @dev Pause marketplace (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Enable or disable whitelist requirement
     */
    function setWhitelistEnabled(bool _enabled) external onlyOwner {
        whitelistEnabled = _enabled;
        emit WhitelistEnabled(_enabled);
    }

    /**
     * @dev Add address to whitelist
     */
    function addToWhitelist(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(!whitelist[account], "Already whitelisted");
        
        whitelist[account] = true;
        whitelistCount++;
        
        emit AddressWhitelisted(account, msg.sender);
    }

    /**
     * @dev Add multiple addresses to whitelist
     */
    function addToWhitelistBatch(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];
            if (account != address(0) && !whitelist[account]) {
                whitelist[account] = true;
                whitelistCount++;
                emit AddressWhitelisted(account, msg.sender);
            }
        }
    }

    /**
     * @dev Remove address from whitelist
     */
    function removeFromWhitelist(address account) external onlyOwner {
        require(whitelist[account], "Not whitelisted");
        
        whitelist[account] = false;
        whitelistCount--;
        
        emit AddressRemovedFromWhitelist(account, msg.sender);
    }

    /**
     * @dev Check if address is whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        return whitelist[account] || account == owner();
    }

    /**
     * @dev Get royalty info and validate it's within limits
     */
    function _getRoyaltyInfo(
        address nftContract,
        uint256 tokenId,
        uint256 salePrice
    ) private view returns (address receiver, uint256 royaltyAmount) {
        try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (
            address _receiver,
            uint256 _royaltyAmount
        ) {
            uint256 maxRoyalty = (salePrice * MAX_ROYALTY) / BASIS_POINTS;
            if (_royaltyAmount > maxRoyalty) {
                emit RoyaltyCapped(nftContract, tokenId, maxRoyalty);
                return (_receiver, maxRoyalty);
            }
            return (_receiver, _royaltyAmount);
        } catch {
            return (address(0), 0);
        }
    }

    /**
     * @dev Update admin budget address (owner only)
     */
    function updateAdminBudgetAddress(address _adminBudgetAddress) external onlyOwner {
        require(_adminBudgetAddress != address(0), "Invalid address");
        adminBudgetAddress = _adminBudgetAddress;
    }

    /**
     * @dev Update NFT Factory address (owner only)
     */
    function updateNFTFactory(address _nftFactory) external onlyOwner {
        require(_nftFactory != address(0), "Invalid factory address");
        nftFactory = _nftFactory;
    }

    /**
     * @dev Get listing details
     */
    function getListing(bytes32 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get all offers for a listing
     */
    function getOffers(bytes32 offerId) external view returns (Offer[] memory) {
        return offers[offerId];
    }

    /**
     * @dev Check if NFT collection is valid (created by factory)
     */
    function _isValidCollection(address nftContract) private view returns (bool) {
        try INFTFactory(nftFactory).isValidOrigamiNFT(nftContract) returns (bool isValid) {
            return isValid;
        } catch {
            return false;
        }
    }
}

interface INFTFactory {
    function isValidOrigamiNFT(address collectionAddress) external view returns (bool);
}
