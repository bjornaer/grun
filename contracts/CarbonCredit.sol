// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CarbonCredit is ERC1155, AccessControl, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct CreditMetadata {
        string projectName;
        string verifier;
        uint256 issuanceDate;
        uint256 expiryDate;
        uint256 totalCredits;
        address owner;
        bool isRetired;
        string metadataURI; // IPFS hash for additional data
    }

    mapping(uint256 => CreditMetadata) public credits;
    mapping(address => bool) public verifiedSellers;

    event CreditMinted(
        uint256 indexed tokenId,
        string projectName,
        address indexed owner,
        uint256 amount
    );
    event CreditRetired(uint256 indexed tokenId, uint256 amount);
    event SellerVerified(address indexed seller, bool status);

    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function setURI(string memory newuri) public onlyRole(ADMIN_ROLE) {
        _setURI(newuri);
    }

    function verifyOrUnverifySeller(address seller, bool status)
        public
        onlyRole(ADMIN_ROLE)
    {
        verifiedSellers[seller] = status;
        emit SellerVerified(seller, status);
    }

    function mintCredit(
        string memory projectName,
        string memory verifier,
        uint256 expiryDate,
        uint256 amount,
        string memory metadataURI
    ) public whenNotPaused returns (uint256) {
        require(
            hasRole(MINTER_ROLE, msg.sender) || verifiedSellers[msg.sender],
            "Must be minter or verified seller"
        );
        require(amount > 0, "Amount must be greater than 0");
        require(expiryDate > block.timestamp, "Invalid expiry date");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(msg.sender, newTokenId, amount, "");

        credits[newTokenId] = CreditMetadata({
            projectName: projectName,
            verifier: verifier,
            issuanceDate: block.timestamp,
            expiryDate: expiryDate,
            totalCredits: amount,
            owner: msg.sender,
            isRetired: false,
            metadataURI: metadataURI
        });

        emit CreditMinted(newTokenId, projectName, msg.sender, amount);
        return newTokenId;
    }

    function retireCredits(uint256 tokenId, uint256 amount) public whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(
            balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient credits to retire"
        );
        require(!credits[tokenId].isRetired, "Credits already retired");

        _burn(msg.sender, tokenId, amount);
        
        if (balanceOf(msg.sender, tokenId) == 0) {
            credits[tokenId].isRetired = true;
        }

        emit CreditRetired(tokenId, amount);
    }

    function getCreditMetadata(uint256 tokenId)
        public
        view
        returns (CreditMetadata memory)
    {
        return credits[tokenId];
    }

    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 