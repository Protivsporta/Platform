//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract XXXToken is ERC20 {

    constructor(uint256 _initialSupply) ERC20("XXXToken", "XXX") {
        _mint(msg.sender, _initialSupply);
    }

}