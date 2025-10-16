// Contract ABIs for Origami NFT Marketplace

export const ORIGAMI_NFT_ABI = [
  // Read functions
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getNFTMetadata(uint256 tokenId) view returns (tuple(string name, string description, string category, string rarity, address creator, uint256 createdAt))",
  "function totalSupply() view returns (uint256)",
  "function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)",
  "function paused() view returns (bool)",
  "function MAX_NFT_SUPPLY() view returns (uint256)",
  "function MIN_ROYALTY_PERCENTAGE() view returns (uint96)",
  "function MAX_ROYALTY_PERCENTAGE() view returns (uint96)",
  "function hasRole(bytes32 role, address account) view returns (bool)",

  // Write functions
  "function mintNFT(address to, string uri, string name, string description, string category, string rarity, address royaltyReceiver, uint96 royaltyPercentage) returns (uint256)",
  "function batchMintNFT(address[] to, string[] uris, string[] names, string[] descriptions, string[] categories, string[] rarities, address[] royaltyReceivers, uint96[] royaltyPercentages) returns (uint256[])",
  "function updateNFTMetadata(uint256 tokenId, string name, string description, string category, string rarity)",
  "function setRoyalty(uint256 tokenId, address receiver, uint96 royaltyPercentage)",
  "function burnNFT(uint256 tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",

  "function addMinter(address account)",
  "function removeMinter(address account)",

  "function pause()",
  "function unpause()",

  // Events
  "event NFTMinted(uint256 indexed tokenId, address indexed creator, address indexed to, string uri, string name, string description, string category, string rarity, uint96 royaltyPercentage)",
  "event NFTBurned(uint256 indexed tokenId, address indexed owner)",
  "event RoyaltyUpdated(uint256 indexed tokenId, address indexed receiver, uint96 royaltyPercentage)",
  "event MetadataUpdated(uint256 indexed tokenId, string name, string description, string category, string rarity)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Paused(address account)",
  "event Unpaused(address account)",
] as const

export const ORIGAMI_MARKETPLACE_ABI = [
  // Read functions
  "function listings(bytes32 listingId) view returns (uint256 tokenId, address nftContract, address seller, uint256 price, bool isActive, uint256 listedAt)",
  "function offers(bytes32 offerId, uint256 index) view returns (uint256 tokenId, address nftContract, address buyer, address seller, uint256 offerAmount, uint256 expiresAt, bool isActive, uint256 createdAt)",
  "function calculateCommissions(uint256 price, address buyer, address seller) view returns (uint256 platformFee, uint256 buyerCommission, uint256 sellerCommission, uint256 totalBuyerPayment, uint256 sellerNetEarnings)",
  "function getRoyaltyInfo(address nftContract, uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)",
  "function buyerCommissionRate() view returns (uint256)",
  "function sellerCommissionRate() view returns (uint256)",
  "function qomToken() view returns (address)",
  "function nftFactory() view returns (address)",
  "function isValidCollection(address nftContract) view returns (bool)",
  "function minimumPrice() view returns (uint256)",
  "function paused() view returns (bool)",
  "function isCollectionDisabled(address collection) view returns (bool)",
  "function whitelistEnabled() view returns (bool)",
  "function isWhitelisted(address account) view returns (bool)",

  // Write functions
  "function listItem(address nftContract, uint256 tokenId, uint256 price, uint256 expiryDays)",
  "function buyItem(bytes32 listingId)",
  "function delistItem(bytes32 listingId)",
  "function makeOffer(address nftContract, uint256 tokenId, address seller, uint256 offerAmount, uint256 expiryDays)",
  "function acceptOffer(bytes32 offerId, uint256 offerIndex)",
  "function cancelOffer(bytes32 offerId, uint256 offerIndex)",
  "function rejectOffer(bytes32 offerId, uint256 offerIndex)",

  // Admin functions
  "function setNFTFactory(address _nftFactory)",
  "function setMinimumPrice(uint256 _minimumPrice)",
  "function cleanExpiredOffers(bytes32 offerId)",
  "function pause()",
  "function unpause()",
  "function disableCollection(address collection)",
  "function enableCollection(address collection)",
  "function setWhitelistEnabled(bool enabled)",
  "function addToWhitelist(address account)",
  "function removeFromWhitelist(address account)",

  // Events
  "event ItemListed(bytes32 indexed listingId, uint256 indexed tokenId, address indexed nftContract, address seller, uint256 price, uint256 expiresAt)",
  "event ItemSold(bytes32 indexed listingId, uint256 indexed tokenId, address indexed nftContract, address seller, address buyer, uint256 price, uint256 platformFee, uint256 royaltyAmount)",
  "event ItemDelisted(bytes32 indexed listingId, uint256 indexed tokenId, address indexed nftContract)",
  "event OfferMade(bytes32 indexed offerId, uint256 indexed tokenId, address indexed nftContract, address buyer, address seller, uint256 offerAmount, uint256 expiresAt)",
  "event OfferAccepted(bytes32 indexed offerId, uint256 indexed tokenId, address indexed nftContract, address buyer, address seller, uint256 offerAmount)",
  "event OfferCancelled(bytes32 indexed offerId, uint256 indexed tokenId, address indexed nftContract)",
  "event OfferRejected(bytes32 indexed offerId, uint256 indexed tokenId, address indexed nftContract, address seller)",
  "event CollectionDisabled(address indexed collection, uint256 timestamp)",
  "event CollectionEnabled(address indexed collection, uint256 timestamp)",
  "event NFTFactoryUpdated(address indexed oldFactory, address indexed newFactory)",
  "event MinimumPriceUpdated(uint256 oldPrice, uint256 newPrice)",
  "event RoyaltyCapped(uint256 indexed tokenId, address indexed nftContract, uint256 requestedRoyalty, uint256 cappedRoyalty)",
  "event Paused(address account)",
  "event Unpaused(address account)",
] as const

export const NFT_FACTORY_ABI = [
  // Read functions
  "function allCollections(uint256 index) view returns (address)",
  "function creatorCollections(address creator, uint256 index) view returns (address)",
  "function getCreatorCollectionCount(address creator) view returns (uint256)",
  "function getTotalCollections() view returns (uint256)",
  "function isValidOrigamiNFT(address nftContract) view returns (bool)",
  "function isCollectionDisabled(address collection) view returns (bool)",
  "function paused() view returns (bool)",
  "function MAX_COLLECTIONS_PER_CREATOR() view returns (uint256)",

  // Write functions
  "function createCollection(string name, string symbol) returns (address)",

  // Admin functions
  "function pause()",
  "function unpause()",
  "function disableCollection(address collection)",
  "function enableCollection(address collection)",
] as const

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const

// Contract addresses (from environment variables)
export const CONTRACTS = {
  NFT: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "",
  MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || "",
  NFT_FACTORY: process.env.NEXT_PUBLIC_NFT_FACTORY_CONTRACT_ADDRESS || "",
  QOM_TOKEN: "0xa26dfBF98Dd1A32FAe56A3D2B2D60A8a41b0bDF0", // QOM token on QL1 chain
} as const
