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
    
    uint256 public MINIMUM_PRICE = 1 ether; // 1 QOM minimum (adjustable)
    uint256 public constant LISTING_DURATION = 30 days;


    struct Listing {
        uint256 tokenId;
        address nftContract;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
        uint256 expiresAt;
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


    event RoyaltyInfoFailed(address indexed nftContract, uint256 indexed tokenId);

    event MinimumPriceUpdated(uint256 oldPrice, uint256 newPrice);

    event InvalidCollectionError(address indexed nftContract, string reason);

    constructor(address _qomToken, address _adminBudgetAddress, address _nftFactory) Ownable(msg.sender) {
        require(_qomToken != address(0), "Invalid QOM token address");
        require(_adminBudgetAddress != address(0), "Invalid admin address");
        require(_nftFactory != address(0), "Invalid factory address");
        
        qomToken = IERC20(_qomToken);
        adminBudgetAddress = _adminBudgetAddress;
        nftFactory = _nftFactory;
    }


    /**
     * @dev List an NFT for sale
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT to list
     * @param price Sale price in QOM tokens (must be >= MINIMUM_PRICE)
     * @notice Anyone can list their NFTs without whitelist requirement
     */
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant whenNotPaused { // Removed onlyWhitelisted modifier
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
     * @param listingId The identifier of the listing
     * @notice Buyer pays: price + 3% buyer commission
     * @notice Seller receives: price - 3% seller commission - royalty
     * @notice Platform receives: 6% total (3% from buyer + 3% from seller) + 1% donation from sale
     */
    function buyItem(bytes32 listingId) external nonReentrant whenNotPaused { // Removed onlyWhitelisted modifier
        Listing storage listing = listings[listingId];
        require(listing.isActive && block.timestamp <= listing.expiresAt, "Listing expired or not active");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        IERC721 nft = IERC721(listing.nftContract);
        require(
            nft.isApprovedForAll(listing.seller, address(this)) || 
            nft.getApproved(listing.tokenId) == address(this),
            "Marketplace approval revoked"
        );

        uint256 price = listing.price;
        address seller = listing.seller;
        address buyer = msg.sender;

        uint256 buyerCommission = (price * BUYER_COMMISSION) / BASIS_POINTS;
        uint256 sellerCommission = (price * SELLER_COMMISSION) / BASIS_POINTS;

        (address royaltyReceiver, uint256 royaltyAmount) = _getRoyaltyInfo(
            listing.nftContract,
            listing.tokenId,
            price
        );

        uint256 platformDonation = (price * PLATFORM_DONATION) / BASIS_POINTS;
        uint256 actualPlatformDonation = royaltyAmount >= platformDonation ? platformDonation : royaltyAmount;
        uint256 creatorRoyalty = royaltyAmount;
        uint256 totalPlatformFee = buyerCommission + sellerCommission + actualPlatformDonation;

        uint256 totalBuyerPayment = price + buyerCommission;
        uint256 sellerNetAmount = price - sellerCommission - royaltyAmount;

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

        require(
            qomToken.transfer(seller, sellerNetAmount),
            "Seller payment failed"
        );

        require(
            qomToken.transfer(adminBudgetAddress, totalPlatformFee),
            "Platform fee payment failed"
        );

        nft.safeTransferFrom(seller, buyer, listing.tokenId);

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
     * @param listingId The identifier of the listing
     */
    function delistItem(bytes32 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing not active");
        require(block.timestamp <= listing.expiresAt, "Listing already expired");

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
     * @notice Anyone can make offers without whitelist requirement
     */
    function makeOffer(
        address nftContract,
        uint256 tokenId,
        address seller,
        uint256 offerAmount,
        uint256 expiryDays
    ) external nonReentrant whenNotPaused { // Removed onlyWhitelisted modifier
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
     * @param offerId The identifier of the offer
     * @param offerIndex Index of the offer in the offers array
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT
     * @notice Seller accepts buyer's offer and completes the sale
     */
    function acceptOffer(
        bytes32 offerId,
        uint256 offerIndex,
        address nftContract,
        uint256 tokenId
    ) external nonReentrant whenNotPaused { // Removed onlyWhitelisted modifier
        Offer storage offer = offers[offerId][offerIndex];
        require(offer.isActive, "Offer not active");
        require(offer.seller == msg.sender, "Not the seller");
        require(block.timestamp <= offer.expiresAt, "Offer expired");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(tokenId) == address(this),
            "Marketplace approval revoked"
        );

        uint256 offerAmount = offer.offerAmount;
        address buyer = offer.buyer;
        address seller = msg.sender;

        uint256 buyerCommission = (offerAmount * BUYER_COMMISSION) / BASIS_POINTS;
        uint256 sellerCommission = (offerAmount * SELLER_COMMISSION) / BASIS_POINTS;

        (address royaltyReceiver, uint256 royaltyAmount) = _getRoyaltyInfo(
            nftContract,
            tokenId,
            offerAmount
        );

        uint256 platformDonation = (offerAmount * PLATFORM_DONATION) / BASIS_POINTS;
        uint256 actualPlatformDonation = royaltyAmount >= platformDonation ? platformDonation : royaltyAmount;
        uint256 creatorRoyalty = royaltyAmount;
        uint256 totalPlatformFee = buyerCommission + sellerCommission + actualPlatformDonation;

        uint256 totalBuyerPayment = offerAmount + buyerCommission;
        uint256 sellerNetAmount = offerAmount - sellerCommission - royaltyAmount;

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

        require(
            qomToken.transfer(seller, sellerNetAmount),
            "Seller payment failed"
        );

        require(
            qomToken.transfer(adminBudgetAddress, totalPlatformFee),
            "Platform fee payment failed"
        );

        nft.safeTransferFrom(seller, buyer, tokenId);

        offer.isActive = false;

        emit OfferAccepted(offerId, nftContract, tokenId, buyer, offerAmount);
    }

    /**
     * @dev Cancel an offer (buyer only)
     * @param offerId The identifier of the offer
     * @param offerIndex Index of the offer in the offers array
     */
    function cancelOffer(bytes32 offerId, uint256 offerIndex) external {
        Offer storage offer = offers[offerId][offerIndex];
        require(offer.buyer == msg.sender, "Not the buyer");
        require(offer.isActive, "Offer not active");

        offer.isActive = false;

        emit OfferCancelled(offerId, offerIndex);
    }

    /**
     * @dev Reject an offer (seller only)
     * @param offerId The identifier of the offer
     * @param offerIndex Index of the offer in the offers array
     */
    function rejectOffer(bytes32 offerId, uint256 offerIndex) external { // Removed onlyWhitelisted modifier
        Offer storage offer = offers[offerId][offerIndex];
        require(offer.seller == msg.sender, "Not the seller");
        require(offer.isActive, "Offer not active");

        offer.isActive = false;

        emit OfferRejected(offerId, offerIndex);
    }

    /**
     * @dev Clean expired offers to optimize gas
     * @param offerId The identifier of the offer group
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
     * @dev Clean expired listings to optimize storage
     * @param listingId The identifier of the listing to be cleaned
     * @notice Automatically deactivates listings that have passed their expiration time
     */
    function cleanExpiredListings(bytes32 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.isActive && block.timestamp > listing.expiresAt, "Listing not expired or already inactive");
        listing.isActive = false;
        emit ItemDelisted(listingId);
    }

    /**
     * @dev Clean multiple expired listings in a single transaction
     * @param listingIds Array of listing identifiers to be cleaned
     * @notice Gas-efficient batch cleanup for multiple expired listings
     */
    function cleanExpiredListingsBatch(bytes32[] calldata listingIds) external {
        for (uint256 i = 0; i < listingIds.length; i++) {
            Listing storage listing = listings[listingIds[i]];
            if (listing.isActive && block.timestamp > listing.expiresAt) {
                listing.isActive = false;
                emit ItemDelisted(listingIds[i]);
            }
        }
    }

    /**
     * @dev Update minimum price for listings and offers
     * @param _newMinimumPrice New minimum price in QOM tokens (must be > 0)
     * @notice Only owner can update the minimum price to adapt to QOM token value changes
     */
    function setMinimumPrice(uint256 _newMinimumPrice) external onlyOwner {
        require(_newMinimumPrice > 0, "Invalid minimum price");
        uint256 oldPrice = MINIMUM_PRICE;
        MINIMUM_PRICE = _newMinimumPrice;
        emit MinimumPriceUpdated(oldPrice, _newMinimumPrice);
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
     * @dev Get royalty info and validate it's within limits
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT
     * @param salePrice Sale price to calculate royalty from
     * @return receiver Address to receive royalty payment
     * @return royaltyAmount Amount of royalty to pay (capped at MAX_ROYALTY)
     * @notice Emits RoyaltyInfoFailed event if royaltyInfo call fails
     */
    function _getRoyaltyInfo(
        address nftContract,
        uint256 tokenId,
        uint256 salePrice
    ) private returns (address receiver, uint256 royaltyAmount) {
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
            emit RoyaltyInfoFailed(nftContract, tokenId);
            return (address(0), 0);
        }
    }

    /**
     * @dev Check if NFT collection is valid (created by factory)
     * @param nftContract Address of the NFT contract to validate
     * @return bool True if collection is valid, reverts otherwise
     * @notice Reverts with detailed error message if validation fails
     * @notice Emits InvalidCollectionError event on validation failure
     */
    function _isValidCollection(address nftContract) private returns (bool) { // Changed from view to non-view to emit event
        try INFTFactory(nftFactory).isValidOrigamiNFT(nftContract) returns (bool isValid) {
            require(isValid, "NFT collection not created by factory");
            return true;
        } catch {
            emit InvalidCollectionError(nftContract, "Factory call failed");
            revert("Invalid NFT collection or factory error");
        }
    }
}

interface INFTFactory {
    function isValidOrigamiNFT(address collectionAddress) external view returns (bool);
}
