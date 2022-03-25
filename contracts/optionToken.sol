// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OptionToken is ERC20 {
    
    bool internal isActive;
    bool internal isSold;
    int256 internal depositedPrice;
    uint256 internal apy_ratio;
    uint internal strikePrice;
    uint internal strikeDeadline;
    ERC20 internal _underlyingToken;
    address internal _underlyingTokenAddress;
    address private poolAdmin;

    constructor(address _poolAdmin, address __underlyingToken) ERC20("BullOptions","BOP") {
        isActive = false;
        poolAdmin = _poolAdmin;
        _underlyingTokenAddress = __underlyingToken;
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
        modifier isOptionSold(){
        require(isSold, "Requires Option to be sold!");
        _;
    }
    modifier isOptionNotSold(){
        require(!isSold, "Requires Option to nnot have been sold!");
        _;
    }

    //Setters
    function _setOption(uint _strikePrice, uint _strikeDeadline, uint256 _apy_ratio) ensure(_strikeDeadline) isOptionNotActive() internal{
        strikeDeadline = _strikeDeadline;
        strikePrice = _strikePrice;
        isActive = true;
        apy_ratio = _apy_ratio;
    }
    function setOption(uint _strikePrice, uint _strikeDeadline, uint256 _apy_ratio) isOptionNotActive() isPoolAdmin() external{
        _setOption(_strikePrice, _strikeDeadline, _apy_ratio);
    }
    function setDepositedPrice(int256 _price) isPoolAdmin() isOptionNotSold() external{
        depositedPrice = _price;
    }
    function setSale(bool status) isPoolAdmin() external{
        isSold = status;
    }   
    //Getters
    function getStrikePrice() public view isOptionActive() returns(uint _strikePrice){
        return strikePrice;
    }
    function getStrikeDeadline() public view isOptionActive() returns(uint _strikeDeadline){
        return strikeDeadline;
    }
    function getUnderlyingToken() public view returns(address){
        return _underlyingTokenAddress;
    }
    function getDepositedPrice() public view isOptionSold() returns(int256 price){
        return depositedPrice;
    }
    function getApyRatio() public view returns(uint256 _apy_ratio){
        return apy_ratio;
    }


    //mint
    function mintOption(address _sender, uint _amount) external isPoolAdmin(){
        _mint(_sender, _amount);
    }
    //burn
    function burnOption(address _sender, uint _amount) external isPoolAdmin() isOptionActive(){
        _burn(_sender,_amount);
    }
}