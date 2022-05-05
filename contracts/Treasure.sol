//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./ACDMToken.sol";


contract Treasure is AccessControl {

    address payable owner;
    address[] pairAddresses;
    ACDMToken public acdmToken;
    address routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address WETHAddress = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
    address acdmTokenAddress;
    bytes32 public constant DAORole = keccak256(abi.encodePacked("DAO"));


    constructor(address _daoContract, address _acdmContract) {
        owner = payable(msg.sender);
        acdmTokenAddress = _acdmContract;
        acdmToken = ACDMToken(_acdmContract);
        _grantRole(DAORole, _daoContract);
    }

    function swapETHToACDMTokensANDBurn(uint256 _amountOutMin, uint256 _deadline) external onlyRole(DAORole) {
        require(address(this).balance > 0, "There is no ETH to swap");
        pairAddresses[0]= WETHAddress;  
        pairAddresses[1] = acdmTokenAddress;
        uint256[] memory routerAmountResponse;
        uint256 amount = address(this).balance;
        routerAmountResponse = IUniswapV2Router02(routerAddress).swapExactETHForTokens{value: amount}(_amountOutMin, pairAddresses, address(this), _deadline);
        uint256 amountOfTokensToBurn = routerAmountResponse[0];
        acdmToken.burn(address(this), amountOfTokensToBurn);
    } 

    function sendToOwner() external onlyRole(DAORole) {
        require(address(this).balance > 0, "There is no ETH to send");
        owner.transfer(address(this).balance);
    } 
} 