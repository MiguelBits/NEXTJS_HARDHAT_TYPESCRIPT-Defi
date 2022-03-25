// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract underlyingToken is ERC20 {
    address factory;
    modifier onlyFactory(){
        require(factory == msg.sender);
        _;
    }
    constructor(string memory _name, string memory _ticker, address _factory) ERC20(_name,_ticker){
        _mint(msg.sender,100000000000000000000);//100ether
        factory = _factory;
    }
    function printMoney(address _who, uint _howmuch) external onlyFactory(){
        _mint(_who, _howmuch);//10ether
    }
}