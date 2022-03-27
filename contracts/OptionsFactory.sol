// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./optionToken.sol";
import "./underlyingToken.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract OptionsFactory {
    using SafeMath for uint;

    mapping(address => underlyingToken[]) public allTokens;    //all option tokens of underlyingtokens address
    mapping(address => OptionToken[]) public allOptionTokens;
    mapping(address => address) public priceFeedOracle;     //price Oracle address of underlyingtokens address

    event createOptions(address indexed _underlyingToken);
    event buyOption(address indexed _underlyingToken, uint amount, uint _orderNo);
    event exercisedOption(address indexed _underlyingToken, uint _amount, uint _orderNo);

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

        OptionToken optionTokens = new OptionToken(address(this),_underlyingToken);

        //allTokens[_underlyingToken][0] => TOKEN 
        allTokens[_underlyingToken].push(underlyingToken(_underlyingToken));

        allOptionTokens[_underlyingToken].push(optionTokens);

        priceFeedOracle[_underlyingToken] = _priceFeed;

        emit createOptions(_underlyingToken);
    }
    //create option not for the first time
    function addOptionsToken(address _underlyingToken) onlyAdmin() public{
        require(allTokens[_underlyingToken].length > 0, "Token does not exist in Factory");

        OptionToken optionTokens = new OptionToken(address(this),_underlyingToken);

        allOptionTokens[_underlyingToken].push(optionTokens);

        emit createOptions(_underlyingToken);
    }
    //fund existing options and set strikes
    function activateOption(address _underlyingToken, uint _strikePrice, uint _strikeDeadline, uint _amount, uint256 apy_ratio, uint _orderNumber) public onlyAdmin(){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");
        //get tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken option = allOptionTokens[_underlyingToken][_orderNumber];
        
        //factory funding and set strikes
        my_underlyingToken.transferFrom(msg.sender, address(this), _amount);
        require(my_underlyingToken.balanceOf(address(this)) > 0, "Option does not have any amount of this Token");
        
        //set option strikes active
        option.setOption(_strikePrice, _strikeDeadline, apy_ratio);

        //mint Option Token
        option.mintOption(address(this), _amount);
    }
    
    function deleteOption(address _underlyingToken, uint _orderNo) external onlyAdmin(){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");
        //get tokens
        delete allOptionTokens[_underlyingToken][_orderNo];
    }

    //fund existing options with already defined strikes
    function fundOptions(address _underlyingToken, uint _amount, uint _orderNumber) public onlyAdmin(){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken option = allOptionTokens[_underlyingToken][_orderNumber];

        //factory funding and set strikes
        my_underlyingToken.transferFrom(msg.sender, address(this), _amount);
        require(my_underlyingToken.balanceOf(address(this)) > 0, "Option does not have any amount of this Token");

        //mint Option Token
        option.mintOption(address(this), _amount);
    }
    //buy options
    function buyOptions(address _underlyingToken, uint _amount, uint _orderNumber) public payable{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");
        //pay premium fee
        uint fee = _amount.div(1e18).mul(_feePolicy);
        require(msg.value >= fee,"You did not pay minimum premium fee!");

        //get Tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken Option = allOptionTokens[_underlyingToken][_orderNumber];

        //check factory underlyingToken balance
        require(my_underlyingToken.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");
        require(Option.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");

        //pay token => to amount locked
        my_underlyingToken.transferFrom(msg.sender, address(this), _amount);

        //approve to send to sender
        Option.approve(msg.sender,_amount);
        require(Option.allowance(address(this), msg.sender) == _amount, "Factory did not approve tokens");

        //send desired amount of options
        Option.transfer(msg.sender, _amount);
        
        emit buyOption(_underlyingToken, _amount, _orderNumber);
    }

    //exercise options
    function exerciseOption(address _underlyingToken, uint _amount, uint _orderNumber) public{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken Option = allOptionTokens[_underlyingToken][_orderNumber];

        require(Option.balanceOf(msg.sender) >= _amount, "You do not have enough Anti Option Tokens");
        //get Strikes
        uint strikePrice = Option.getStrikePrice();
        uint strikeDeadline = Option.getStrikeDeadline();

        require(strikeDeadline.sub(3600) <= block.timestamp &&  block.timestamp <=  strikeDeadline, "Time Options: Not in exercise window!");        
        //price calculus
        uint priceNow = uint(getLatestPrice(_underlyingToken));
        
        require(priceNow >= strikePrice, "Restricted from exercising losing position in Option!");

        //transfer token exercised
        Option.burnOption(msg.sender, _amount);
        uint priceRatio = (priceNow.sub(strikePrice).mul(100)).div(priceNow); // percentage difference
        uint totalAmount = (_amount.div(100).mul(priceRatio)).add(_amount);    //add the difference
        my_underlyingToken.transfer(msg.sender, totalAmount);


        emit exercisedOption(_underlyingToken, _amount, _orderNumber);
    }

    function NotExerciseOption(address _underlyingToken, uint _amount, uint _orderNumber) public{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken Option = allOptionTokens[_underlyingToken][_orderNumber];

        //transfer token not exercised
        Option.burnOption(msg.sender, _amount);

        my_underlyingToken.transfer(msg.sender, _amount);
    }

    //Getters
    function getAmountOptions(address _underlyingToken, address _who, uint _orderNumber) public view returns(uint){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        OptionToken option = allOptionTokens[_underlyingToken][_orderNumber];
        
        return option.balanceOf(_who);
    }
    
    function getTokenBalance(address _token) public view returns(uint){
        return underlyingToken(_token).balanceOf(address(this));
    }
    function getOptionApy(address _token, uint _orderNumber) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken option = allOptionTokens[_token][_orderNumber];
        return option.getApyRatio();
    }
    
    function getTVL(address _token) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        underlyingToken my_underlyingToken = allTokens[_token][0];
        return my_underlyingToken.balanceOf(address(this));
    }
    function getOptionStrikePrices(address _token, uint _orderNumber) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken option = allOptionTokens[_token][_orderNumber];
        return option.getStrikePrice();
    }

    function getOptionStrikeDeadline(address _token, uint _orderNumber) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken option = allOptionTokens[_token][_orderNumber];
        return option.getStrikeDeadline();
    }
    
    function getOptionAddress(address _token, uint _orderNumber) public view returns(address){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken option = allOptionTokens[_token][_orderNumber];
        return address(option);
    }
    
    function getHowManyOptions(address _token) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        uint option = allOptionTokens[_token].length;
        return option;
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