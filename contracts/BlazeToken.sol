// SPDX-License-Identifier: MIT
pragma solidity >=0.8.1;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BlazeToken is Ownable, ERC20 {
    constructor(uint256 supply, string memory name, string memory symbol) 
        ERC20(name, symbol) {
            _mint(owner(), supply * 10**decimals());
    }
}
