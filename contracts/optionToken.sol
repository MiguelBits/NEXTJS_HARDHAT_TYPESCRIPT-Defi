// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract optionToken is ERC20 {
    
    bool internal isActive;
    uint internal strikePrice;
    uint internal strikeDeadline;
    ERC20 internal tokenSupplied;
    address internal tokenSuppliedAddress;
    address private poolAdmin;

    constructor(address _poolAdmin, address _tokenSupplied) ERC20("BullOptions","OPT") {
        isActive = false;
        poolAdmin = _poolAdmin;
        tokenSuppliedAddress = _tokenSupplied;

    }
    //modifiers
    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, "Time Options: EXPIRED");
        _;
    }
    modifier isOptionActive(){
        require(isActive,"Your option has no strikes set!");
        _;
    }
    modifier isOptionNotActive(){
        require(!isActive,"Your option has already strikes set!");
        _;
    }
    modifier isPoolAdmin(){
        require(msg.sender == poolAdmin,"You are not pool Admin!");
        _;
    }
    //Setters
    function setOption(uint _strikePrice, uint _strikeDeadline) isOptionNotActive() isPoolAdmin() external{
        _setOption(_strikePrice, _strikeDeadline);
    }

    function _setOption(uint _strikePrice, uint _strikeDeadline) ensure(_strikeDeadline) isOptionNotActive() private{
        strikeDeadline = _strikeDeadline;
        strikePrice = _strikePrice;
        isActive = true;
    }
    //Getters
    function getStrikePrice() public view isOptionActive() returns(uint _strikePrice){
        return strikePrice;
    }
    function getStrikeDeadline() public view isOptionActive() returns(uint _strikeDeadline){
        return strikeDeadline;
    }

    //mint
    function mintOption(address _sender, uint _amount) external isPoolAdmin() isOptionActive(){
        _mint(_sender, _amount);
    }
    //burn
    function burnOption(address _sender, uint _amount) external isPoolAdmin() isOptionActive(){
        _burn(_sender,_amount);
    }
}