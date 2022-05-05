//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ACDMToken is ERC20 {

    uint8 _decimals = 6;

    constructor(uint256 _initialSupply) ERC20("AcademToken", "ACDM") {
        _mint(msg.sender, _initialSupply);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function burn(address _account, uint256 _amount) external {
        _burn(_account, _amount);
    }
}