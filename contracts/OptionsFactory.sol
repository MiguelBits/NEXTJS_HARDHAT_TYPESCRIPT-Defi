// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./optionToken.sol";
import "./antiOptionToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract OptionsFactory {
    using SafeMath for uint;

    mapping(address =>ERC20[]) public allTokens;
    mapping(address => optionToken) public allOptionTokens;
    mapping(address => antiOptionToken) public allAntiOptionTokens;
    mapping(address => address) public priceFeedOracle;

    event createOptions(address indexed underlyingToken);
    event buyOption(address indexed buyer, uint amount);
    event buyAntiOption(address indexed buyer, uint amount);
    event exercisedOption(address indexed _underlyingToken, uint _amount);
    event exercisedAntiOption(address indexed _underlyingToken, uint _amount);

    uint private _feePolicy;

    address private _Admin;

    modifier onlyAdmin(){
        require(msg.sender == _Admin,"You are not Admin!");
        _;
    }

    constructor(){
        _Admin = msg.sender;
        _feePolicy = 100000000000000000;//0.1ether
    }

    //create option for the first time
    function createOptionsToken(address _underlyingToken, address _priceFeed) onlyAdmin() public{
        require(allTokens[_underlyingToken].length == 0, "Token already exists in Factory");

        optionToken optionTokens = new optionToken(address(this),_underlyingToken);
        antiOptionToken antiOptionTokens = new antiOptionToken(address(this),_underlyingToken);

        //allTokens[_underlyingToken][0] => TOKEN 
        allTokens[_underlyingToken].push(ERC20(_underlyingToken));

        //allTokens[_underlyingToken][1] => OPTION 
        allTokens[_underlyingToken].push(optionTokens);
        allOptionTokens[_underlyingToken] = optionTokens;

        //allTokens[_underlyingToken][2] => ANTI-OPTION
        allTokens[_underlyingToken].push(antiOptionTokens);
        allAntiOptionTokens[_underlyingToken] = antiOptionTokens;

        priceFeedOracle[_underlyingToken] = _priceFeed;

        emit createOptions(_underlyingToken);
    }

    //fund existing options and set strikes
    function activateOption(address _underlyingToken, uint _strikePrice, uint _strikeDeadline, uint _amount) public onlyAdmin(){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");
        //get tokens
        ERC20 underlyingToken = allTokens[_underlyingToken][0];
        optionToken option = allOptionTokens[_underlyingToken];
        antiOptionToken antiOption = allAntiOptionTokens[_underlyingToken];

        //factory funding and set strikes
        underlyingToken.transferFrom(msg.sender, address(this), _amount);
        require(underlyingToken.balanceOf(address(this)) > 0, "AntiOption does not have any amount of this Token");

        //set option strikes active
        option.setOption(_strikePrice, _strikeDeadline);
        antiOption.setAntiOption(_strikePrice, _strikeDeadline);

        //mint Option Token
        option.mintOption(address(this), _amount);
        antiOption.mintAntiOption(address(this), _amount);
    }
    //fund existing options with already defined strikes
    function fundOptions(address _underlyingToken, uint _amount) public onlyAdmin(){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get tokens
        ERC20 underlyingToken = allTokens[_underlyingToken][0];
        optionToken option = allOptionTokens[_underlyingToken];
        antiOptionToken antiOption = allAntiOptionTokens[_underlyingToken];

        //factory funding and set strikes
        underlyingToken.transferFrom(msg.sender, address(this), _amount);
        require(underlyingToken.balanceOf(address(this)) > 0, "AntiOption does not have any amount of this Token");

        //mint Option Token
        option.mintOption(address(this), _amount);
        antiOption.mintAntiOption(address(this), _amount);
    }
    //buy options and anti-option token
    function buyOptions(address _underlyingToken, uint _amount) public payable{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //pay premium fee
        uint fee = _amount.div(1e18).mul(_feePolicy);
        //console.log(fee);

        require(msg.value >= fee, "You did not pay minimum premium fee!");

        //get Tokens
        ERC20 underlyingToken = allTokens[_underlyingToken][0];
        optionToken option = allOptionTokens[_underlyingToken];

        //approve
        option.approve(msg.sender,_amount);
        require(option.allowance(address(this), msg.sender) == _amount, "Factory did not approve tokens");

        //check factory underlyingToken balance
        require(underlyingToken.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");
        require(option.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");
        
        //send desired amount of options
        option.transfer(msg.sender, _amount);

        emit buyOption(msg.sender, _amount);
    }
    function buyAntiOptions(address _underlyingToken, uint _amount) public payable{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //pay premium fee
        uint fee = _amount.div(1e18).mul(_feePolicy);
        //console.log(fee);

        require(msg.value >= fee,"You did not pay minimum premium fee!");

        //get Tokens
        ERC20 underlyingToken = allTokens[_underlyingToken][0];
        antiOptionToken antiOption = allAntiOptionTokens[_underlyingToken];

        //check factory underlyingToken balance
        require(underlyingToken.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");
        require(antiOption.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");
        
        //pay token == to amount locked
        underlyingToken.transferFrom(msg.sender, address(this), _amount);

        //approve to send to sender
        antiOption.approve(msg.sender,_amount);
        require(antiOption.allowance(address(this), msg.sender) == _amount, "Factory did not approve tokens");
        //send desired amount of options
        antiOption.transfer(msg.sender, _amount);
        
        emit buyAntiOption(msg.sender, _amount);
    }

    //exercise options
    function exerciseOption(address _underlyingToken, uint _amount) public payable{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        ERC20 underlyingToken = allTokens[_underlyingToken][0];
        optionToken option = allOptionTokens[_underlyingToken];

        require(option.balanceOf(msg.sender) >= _amount, "You do not have enough Option Tokens");

        //get Strikes
        uint strikePrice = option.getStrikePrice();
        uint strikeDeadline = option.getStrikeDeadline();

        require(strikeDeadline.sub(3600) <= block.timestamp &&  block.timestamp <=  strikeDeadline, "Time Options: Not in exercise window!");
        require(msg.value >= strikePrice, "Did not send Ether equal to strike price!");
        require(strikePrice >= getTokenBalance(_underlyingToken), "Cannot exercise option with bigger strike price than current price");
        //approve token
        underlyingToken.approve(msg.sender, _amount);

        //transfer token exercised
        option.burnOption(msg.sender, _amount);
        underlyingToken.transfer(msg.sender, _amount);

        emit exercisedOption(_underlyingToken, _amount);
    }
    function exerciseAntiOption(address _underlyingToken, uint _amount) public{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        ERC20 underlyingToken = allTokens[_underlyingToken][0];
        antiOptionToken antiOption = allAntiOptionTokens[_underlyingToken];

        require(antiOption.balanceOf(msg.sender) >= _amount, "You do not have enough Anti Option Tokens");
        //get Strikes
        uint strikeDeadline = antiOption.getStrikeDeadline();

        require(strikeDeadline <= block.timestamp, "Time Options: NOT EXPIRED");
        
        //approve token
        underlyingToken.approve(msg.sender, _amount);

        //transfer token exercised
        antiOption.burnAntiOption(msg.sender, _amount);

        underlyingToken.transfer(msg.sender, _amount);

        emit exercisedAntiOption(_underlyingToken, _amount);
    }
    //Getters
    function getAmountOptions(address _underlyingToken, address _who) public view returns(uint){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        optionToken option = allOptionTokens[_underlyingToken];
        
        return option.balanceOf(_who);
    }
    function getAmountAntiOptions(address _underlyingToken, address _who) public view returns(uint){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        antiOptionToken antiOption = allAntiOptionTokens[_underlyingToken];
        
        return antiOption.balanceOf(_who);
    }
    function getTokenBalance(address _token) public view returns(uint){
        return ERC20(_token).balanceOf(address(this));
    }
    
    //withdraw all fees of ether
    function withdrawFees() public onlyAdmin(){
        payable(msg.sender).transfer(address(this).balance);
    }

    function getLatestPrice(address _underlyingToken) public view returns (int) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedOracle[_underlyingToken]);
        (
            uint80 roundID,
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        return price;
    }
}