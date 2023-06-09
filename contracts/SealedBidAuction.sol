// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./ZsToken.sol";

contract SealedBidAuction {
    /**
     * Address of the seller deploying the contract
     */
    address public seller;

    /**
     * The highest bid submitted
     */
    uint256 public highestBid;

    /**
     * Address of the bidder with the highest bid
     */
    address public highestBidder;

    /**
     * Minimum price for the token given by the seller
     */
    uint256 public reservePrice;

    /**
     * Duration of the bidding phase given by the seller
     */
    uint256 public biddingDuration;

    /**
     * Duration of the revealing phase given by the seller
     */
    uint256 public revealingDuration;

    /**
     * Ending time of the auction calculated from the starting time, the biddig duration and the revealing duration
     */
    uint256 public auctionEndTime;

    /**
     * The address of the token in auction
     */
    ZsToken public token;

    /**
     * Amount of tokens the seller is offering
     */
    uint256 public tokenAmount;

    /**
     * Data structure for the bids specifying:
     *  - The hashed form of the bid, submitted in the bidding stage
     *  - The value paid by the bidder in the bidding stage
     *  - The value actually bid by the bidder in the revealing stage
     *  - A bool variable representing the state of the bid
     */
    struct Bid {
        bytes32 hashedBid;
        uint256 valuePaid;
        uint256 value;
        bool revealed;
    }
    /**
     * Mapping between the bidder addresses and their bids
     */
    mapping(address => Bid) public bids;

    /**
     * Event emitted when the auction has started specifying:
     *  - The seller address
     *  - The minimum price of the token in auction
     *  - Duration of the bidding phase
     *  - Duration of the revealing phase
     *  - Address of the ERC20 tokens smart contract
     *  - The block.timestamp when the event has happened
     */
    event AuctionStarted(
        address indexed seller,
        uint256 reservePrice,
        uint256 biddingDuration,
        uint256 revealingDuration,
        address indexed token,
        uint256 tokenAmount,
        uint256 time
    );

    /**
     * Event emitted when a bid has been placed specifying:
     *  - The address of the bidder
     *  - The hashed bid
     *  - The block.timestamp when the event has happened
     */
    event BidPlaced(address indexed bidder, bytes32 hashedBid, uint256 time);

    /**
     * Event emitted when a bid has been revealed specifying:
     *  - The address of the bidder
     *  - The bid value
     *  - The block.timestamp when the event has happened
     */
    event BidRevealed(address indexed bidder, uint256 value, uint256 time);

    /**
     * Event emitted when teh auctiion has ended specifying:
     *  - The address of the winner
     *  - The value of the highest bid
     *  - The block.timestamp when the event has happened
     */
    event AuctionEnded(
        address indexed highestBidder,
        uint256 highestBid,
        uint256 time
    );

    /**
     * Modifier for functions callable only by the seller
     */
    modifier onlySeller() {
        require(
            msg.sender == seller,
            "Only the seller can perform this action"
        );
        _;
    }

    /**
     * Modifier for functions callable only before the auction has started
     */
    modifier onlyBeforeAuctionStarted() {
        require(auctionEndTime == 0, "Auction has already started");
        _;
    }

    /**
     * Modifier for functions callable only during the bidding phase
     */
    modifier onlyDuringBiddingPhase() {
        require(
            block.timestamp < auctionEndTime - revealingDuration,
            string(abi.encodePacked("Bidding phase has ended", block.timestamp))
        );
        _;
    }

    /**
     * Modifier for functions callable only during the revelation phase
     */
    modifier onlyDuringRevealingPhase() {
        require(
            block.timestamp >= auctionEndTime - revealingDuration &&
                block.timestamp < auctionEndTime,
            string(
                abi.encodePacked("Revealing phase has ended", block.timestamp)
            )
        );
        _;
    }

    /**
     * Modifier for functions callable only after the auction has ended
     */
    modifier onlyAfterAuctionEnded() {
        require(
            block.timestamp >= auctionEndTime,
            string(
                abi.encodePacked("Auction has not ended yet", block.timestamp)
            )
        );
        _;
    }

    /**
     * Constructor of the contract called at deployment specifying:
     *  - The address of the token in auction
     *  - The minimum price of the token in auction
     *  - Duration of the bidding phase
     *  - Duration of the revealing phase
     *  - The amount of tokens in auction
     */
    constructor(
        address _token,
        uint256 _reservePrice,
        uint256 _biddingDuration,
        uint256 _revealingDuration,
        uint256 _tokenAmount
    ) {
        seller = msg.sender;
        reservePrice = _reservePrice;
        biddingDuration = _biddingDuration;
        revealingDuration = _revealingDuration;
        token = ZsToken(_token);
        tokenAmount = _tokenAmount;
    }

    /**
     * Function starting the auction callable only by the seller before the auction has started
     *
     * Emits AuctionStarted event
     */
    function startAuction() public onlySeller onlyBeforeAuctionStarted {
        require(
            tokenAmount <= getTokenBalance(),
            "Not enough tokens to start the auction"
        );
        auctionEndTime = block.timestamp + biddingDuration + revealingDuration;
        emit AuctionStarted(
            seller,
            reservePrice,
            biddingDuration,
            revealingDuration,
            address(token),
            tokenAmount,
            block.timestamp
        );
    }

    /**
     * Funcion callable by the bidders to place their bids during the bidding phase
     * _hashedBid has to be the bidders bid and their nonce hashed by the keccak256 algorithm
     * It is recommended for the transferred value to be bigger than the exact value of the bid to hide reserving the secrecy of the auction
     *
     * A bidder can only place one bid
     * The paid value has to be greater than or equal to the reservePrice
     *
     * The Bid added to the mapping will have the hashedBid specified as parameter, and the valuePaid specified by the transferred value
     *
     * Emits BidPlaced event
     */
    function placeBid(
        bytes32 _hashedBid
    ) public payable onlyDuringBiddingPhase {
        require(
            msg.value >= reservePrice,
            "Bid amount must be equal to or higher than the reserve price"
        );
        require(
            bids[msg.sender].hashedBid == bytes32(0),
            "Bidder has already placed a bid"
        );

        bids[msg.sender] = Bid({
            hashedBid: _hashedBid,
            // nonce: 0,
            value: 0,
            valuePaid: msg.value,
            revealed: false
        });

        emit BidPlaced(msg.sender, _hashedBid, block.timestamp);
    }

    /**
     * Function callable by the bidders to reveal their bids during the revelation phase
     * _value is the exact value of the bid
     * _nonce is the exact nonce of the bid
     *
     * valuePaid earlier has to be greater than or equal to the exact value of the bid
     * The value of the bid is specified as parameter
     * The bids state changes to reaveled
     *
     * Emits BidRevealed event
     */
    function revealBid(
        uint256 _value,
        uint256 _nonce
    ) public onlyDuringRevealingPhase {
        require(
            bids[msg.sender].hashedBid != bytes32(0),
            "Bidder has not placed a bid"
        );
        require(!bids[msg.sender].revealed, "Bid has already been revealed");
        require(
            bids[msg.sender].valuePaid >= _value,
            "The bids value is not payable from balance placed"
        );

        bytes32 newHash = keccak256(abi.encodePacked(_value, _nonce));
        require(newHash == bids[msg.sender].hashedBid, "Hashes do not match");

        bids[msg.sender].value = _value;
        // bids[msg.sender].nonce = _nonce;
        bids[msg.sender].revealed = true;

        if (_value > highestBid) {
            highestBid = _value;
            highestBidder = msg.sender;
        }

        emit BidRevealed(msg.sender, _value, block.timestamp);
    }

    /**
     * Function callable by the bidders to check if the contract has the amount of tokens specified in the auction
     */
    function getTokenBalance() public view returns (uint256) {
        uint256 tokenBalance = token.balanceOf(address(this));
        return tokenBalance;
    }

    /**
     * Function callable by the winner after the auction has ended
     * Transfers the amount of tokens specified in the auction
     * Refunds any excess funds to the winner above the exact value of their bid
     *
     * Emits AuctionEnded event
     */
    function claimToken() public onlyAfterAuctionEnded {
        require(
            msg.sender == highestBidder,
            "Only the highest bidder can claim the token"
        );

        uint256 tokenBalance = token.balanceOf(address(this));
        require(tokenBalance > 0, "Tokens already claimed");

        token.transfer(msg.sender, tokenBalance);

        emit AuctionEnded(highestBidder, highestBid, block.timestamp);

        // Refund any excess funds
        uint256 excessFunds = bids[msg.sender].valuePaid -
            bids[msg.sender].value;
        if (excessFunds > 0) {
            payable(msg.sender).transfer(excessFunds);
        }
    }

    /**
     * Function callable by the losing bidders
     * Transfers the paid value of the losing bidders back to them
     */
    function withdrawExcessFunds() public onlyAfterAuctionEnded {
        require(
            msg.sender != highestBidder,
            "The highest bidder cannot withdraw excess funds"
        );

        payable(msg.sender).transfer(bids[msg.sender].valuePaid);
    }
}
