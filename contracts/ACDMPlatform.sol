//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "./ACDMToken.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ACDMPlatform is AccessControl {

    using SafeERC20 for ACDMToken;

    uint8 public firstRefRoyaltyInSaleRound;
    uint8 public secondRefRoyaltyInSaleRound;
    uint8 public royaltyInTradeRound;
    uint256 public roundTime;
    uint256 changeRoundTimeStamp;
    uint256 acdmTokenPrice = 1e13 wei;
    uint256 public amountOfTokensToSaleInRound = 100000;
    uint256 amountOfETHFilledInTradeRound;
    uint256 orderID;
    uint256 roundCounter;
    address acdmTokenAddress;
    address payable treasureContracAddress;
    ACDMToken public acdmToken;

    bytes32 public constant ownable = keccak256(abi.encodePacked("ownable"));


    constructor (
        address _acdmTokenAddress, 
        address _daoContract, 
        address payable _treasureContractAddress, 
        uint256 _roundTime,
        uint8 _firstRefRoyaltyInSaleRound,
        uint8 _secondRefRoyaltyInSaleRound,
        uint8 _royaltyInTradeRound) {
        acdmToken = ACDMToken(_acdmTokenAddress);
        _grantRole(DAORole, _daoContract);
        acdmTokenAddress = _acdmTokenAddress;
        treasureContracAddress = _treasureContractAddress;
        roundTime = _roundTime;
        firstRefRoyaltyInSaleRound = _firstRefRoyaltyInSaleRound;
        secondRefRoyaltyInSaleRound = _secondRefRoyaltyInSaleRound;
        royaltyInTradeRound = _royaltyInTradeRound;
        referals[msg.sender] = payable(msg.sender);
    }

    struct Order {
        uint256 priceInEth;
        uint256 actualAmount;
        address payable owner;
    }

    mapping (uint256 => Order) public ordersList;

    mapping(address => address payable) public referals; // account to his referal

    enum Round { Trade, Sale }
    Round public round;

    function register(address payable _referal) public {
        require(referals[msg.sender] == address(0), "You are already registered on the platform");
        require(referals[_referal] != address(0), "Referal should be already registered on the platform");
        referals[msg.sender] = _referal;
    }

    function startSaleRound() public onlyTradeRound() {
        require(block.timestamp > changeRoundTimeStamp + roundTime, "Trade round is not finished yet");
        roundCounter ++;
        if(roundCounter != 1) {
            amountOfTokensToSaleInRound = amountOfETHFilledInTradeRound / acdmTokenPrice;
        }
        round = Round.Sale;
        changeRoundTimeStamp = block.timestamp;
    }

    function startTradeRound() public onlySaleRound() {
        require(block.timestamp > changeRoundTimeStamp + roundTime || amountOfTokensToSaleInRound == 0, "Sale round is not finished yet");
        acdmToken.burn(address(this), amountOfTokensToSaleInRound);
        round = Round.Trade;
        changeRoundTimeStamp = block.timestamp;
        acdmTokenPrice = (acdmTokenPrice * 103 / 100) + 14e11 wei;
    }

    function buyACDM() public payable onlySaleRound() {
        uint256 amountOfTokens = msg.value / acdmTokenPrice;
        require(amountOfTokensToSaleInRound >= amountOfTokens, "Unsufficient token balance on contract");
        amountOfTokensToSaleInRound -= amountOfTokens;
        if(referals[msg.sender] != address(0)) {
            referals[msg.sender].transfer(msg.value * firstRefRoyaltyInSaleRound / 100); // send royalty to first referal
            if(referals[referals[msg.sender]] != address(0)) {
                referals[referals[msg.sender]].transfer(msg.value * secondRefRoyaltyInSaleRound / 100); // send royalty to second referal
            }
        }
        acdmToken.safeTransfer(msg.sender, amountOfTokens);
    }

    function addOrder(uint256 _amount, uint256 _tokenPriceInEth) public onlyTradeRound() {
        require(acdmToken.balanceOf(msg.sender) >= _amount, "You don't have required amount of tokens");
        ordersList[orderID].priceInEth = _tokenPriceInEth;
        ordersList[orderID].actualAmount = _amount;
        ordersList[orderID].owner = payable(msg.sender);
        orderID ++;
        acdmToken.safeTransferFrom(msg.sender, address(this), _amount);
    }

    function removeOrder(uint256 _orderID) public { 
        require(msg.sender == ordersList[_orderID].owner, "Only owner can remove order");
        acdmToken.safeTransfer(msg.sender, ordersList[_orderID].actualAmount);
        delete ordersList[_orderID];
    }

    function fillOrder(uint256 _orderID) public payable onlyTradeRound() {
        require(ordersList[_orderID].owner != address(0), "This order does not exist");
        uint256 amountOfTokens = msg.value / ordersList[_orderID].priceInEth;
        //require(amountOfTokens <= ordersList[_orderID].actualAmount, "Insufficient funds on order");
        amountOfETHFilledInTradeRound += msg.value;
        ordersList[_orderID].actualAmount -= amountOfTokens;
        if(referals[ordersList[_orderID].owner] != address(0)) {
            referals[ordersList[_orderID].owner].transfer(msg.value * royaltyInTradeRound / 2 / 100); // send royalty to first refer
            if(referals[referals[ordersList[_orderID].owner]] != address(0)) {
                referals[referals[ordersList[_orderID].owner]].transfer(msg.value * royaltyInTradeRound / 2 / 100); // send royalty to second refer
            } else {
                treasureContracAddress.transfer(msg.value * royaltyInTradeRound / 2 / 100);
            }
        } else {
            treasureContracAddress.transfer(msg.value * royaltyInTradeRound / 100);
        }
        ordersList[_orderID].owner.transfer(msg.value * (100 - royaltyInTradeRound) / 100); 
        if(ordersList[_orderID].actualAmount == 0) {
            delete ordersList[_orderID];
        }
        acdmToken.safeTransfer(msg.sender, amountOfTokens);
    } 

    // DAO functions

    function changeSaleRoundRoyalties(uint8 _firstRefRoyalty, uint8 _secondRefRoyalty) external onlyRole(ownable) {
        firstRefRoyaltyInSaleRound = _firstRefRoyalty;
        secondRefRoyaltyInSaleRound = _secondRefRoyalty;
    }

    function changeTradeRoundRoyalties(uint8 _refRoyalty) external onlyRole(ownable) {
        royaltyInTradeRound = _refRoyalty;
    }

    // modifiers

    modifier onlySaleRound() {
        require(round == Round.Sale, "Current round is not for sale");
        _;
    }

    modifier onlyTradeRound() {
        require(round == Round.Trade, "Current round is not for trade");
        _;
    }
}