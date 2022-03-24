// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract antiOptionToken is ERC20 {
    
    bool internal isActive;
    uint internal strikePrice;
    uint internal strikeDeadline;
    ERC20 internal tokenSupplied;
    address internal tokenSuppliedAddress;
    address private poolAdmin;

    constructor(address _poolAdmin, address _tokenSupplied) ERC20("BullAntiOptions","AOPT") {
        isActive = false;
        poolAdmin = _poolAdmin;
        tokenSuppliedAddress = _tokenSupplied;
    }
    //modifiers
    modifier ensure(uint deadline) {
        //ensure deadline has not expired
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
    function _setAntiOption(uint _strikePrice, uint _strikeDeadline) ensure(_strikeDeadline) isOptionNotActive() internal{
        strikeDeadline = _strikeDeadline;
        strikePrice = _strikePrice;
        isActive = true;
    }
    function setAntiOption(uint _strikePrice, uint _strikeDeadline) isOptionNotActive() isPoolAdmin() external{
        _setAntiOption(_strikePrice, _strikeDeadline);
    }
    //Getters
    function getStrikePrice() public view isOptionActive() returns(uint _strikePrice){
        return strikePrice;
    }
    function getStrikeDeadline() public view isOptionActive() returns(uint _strikeDeadline){
        return strikeDeadline;
    }
    function getUnderlyingToken() public view returns(address){
        return tokenSuppliedAddress;
    }

    //mint
    function mintAntiOption(address _sender, uint _amount) external isPoolAdmin(){
        _mint(_sender, _amount);
    }
    //burn
    function burnAntiOption(address _sender, uint _amount) external isPoolAdmin() isOptionActive(){
        _burn(_sender,_amount);
    }
}