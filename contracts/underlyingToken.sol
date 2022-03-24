// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract underlyingToken is ERC20 {
    constructor(string memory _name, string memory _ticker) ERC20(_name,_ticker){
        _mint(msg.sender,100000000000000000000);//100ether
    }
    function saveThatMoney() public{
        _mint(msg.sender,10000000000000000000);//10ether
    }
}