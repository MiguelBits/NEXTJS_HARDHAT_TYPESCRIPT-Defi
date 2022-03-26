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
    mapping(address => OptionToken[]) public allAntiOptionTokens;
    mapping(address => address) public priceFeedOracle;     //price Oracle address of underlyingtokens address

    event createOptions(address indexed _underlyingToken);
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

        OptionToken optionTokens = new OptionToken(address(this),_underlyingToken);
        OptionToken antiOptionTokens = new OptionToken(address(this),_underlyingToken);

        //allTokens[_underlyingToken][0] => TOKEN 
        allTokens[_underlyingToken].push(underlyingToken(_underlyingToken));

        allOptionTokens[_underlyingToken].push(optionTokens);

        allAntiOptionTokens[_underlyingToken].push(antiOptionTokens);

        priceFeedOracle[_underlyingToken] = _priceFeed;

        emit createOptions(_underlyingToken);
    }
    //create option not for the first time
    function addOptionsToken(address _underlyingToken) onlyAdmin() public{
        require(allTokens[_underlyingToken].length > 0, "Token does not exist in Factory");

        OptionToken optionTokens = new OptionToken(address(this),_underlyingToken);
        OptionToken antiOptionTokens = new OptionToken(address(this),_underlyingToken);

        allOptionTokens[_underlyingToken].push(optionTokens);

        allAntiOptionTokens[_underlyingToken].push(antiOptionTokens);

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
    function activateAntiOption(address _underlyingToken, uint _strikePrice, uint _strikeDeadline, uint _amount, uint256 apy_ratio, uint _orderNumber) public onlyAdmin(){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");
        //get tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];

        OptionToken antiOption = allAntiOptionTokens[_underlyingToken][_orderNumber];
        //factory funding and set strikes
        my_underlyingToken.transferFrom(msg.sender, address(this), _amount);
        require(my_underlyingToken.balanceOf(address(this)) > 0, "Option does not have any amount of this Token");
        
        //set option strikes active
        antiOption.setOption(_strikePrice, _strikeDeadline, apy_ratio);

        //mint Option Token
        antiOption.mintOption(address(this), _amount);

    }
    function deleteOption(address _underlyingToken, uint _orderNo) external onlyAdmin(){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");
        //get tokens
        delete allOptionTokens[_underlyingToken][_orderNo];
    }
    function deleteAntiOption(address _underlyingToken, uint _orderNo) external onlyAdmin(){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");
        //get tokens
        delete allAntiOptionTokens[_underlyingToken][_orderNo];
    }
    //fund existing options with already defined strikes
    function fundOptions(address _underlyingToken, uint _amount, uint _orderNumber) public onlyAdmin(){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken option = allOptionTokens[_underlyingToken][_orderNumber];
        OptionToken antiOption = allAntiOptionTokens[_underlyingToken][_orderNumber];

        //factory funding and set strikes
        my_underlyingToken.transferFrom(msg.sender, address(this), _amount);
        require(my_underlyingToken.balanceOf(address(this)) > 0, "AntiOption does not have any amount of this Token");

        //mint Option Token
        option.mintOption(address(this), _amount);
        antiOption.mintOption(address(this), _amount);
    }
    //buy options and anti-option token
    function buyOptions(address _underlyingToken, uint _amount, uint _orderNumber) public payable{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //pay premium fee
        uint fee = _amount.div(1e18).mul(_feePolicy);
        //console.log(fee);

        require(msg.value >= fee, "You did not pay minimum premium fee!");

        //get Tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken option = allOptionTokens[_underlyingToken][_orderNumber];

        //approve
        option.approve(msg.sender,_amount);
        require(option.allowance(address(this), msg.sender) == _amount, "Factory did not approve tokens");

        //check factory underlyingToken balance
        require(my_underlyingToken.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");
        require(option.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");

        //send desired amount of options
        option.transfer(msg.sender, _amount);

        emit buyOption(msg.sender, _amount);
    }
    function buyAntiOptions(address _underlyingToken, uint _amount, uint _orderNumber) public payable{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");
        //pay premium fee
        uint fee = _amount.div(1e18).mul(_feePolicy);
        require(msg.value >= fee,"You did not pay minimum premium fee!");

        //get Tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken antiOption = allAntiOptionTokens[_underlyingToken][_orderNumber];

        //check factory underlyingToken balance
        require(my_underlyingToken.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");
        require(antiOption.balanceOf(address(this)) >= _amount, "Not enough balance in Factory");

        //pay token == to amount locked
        my_underlyingToken.transferFrom(msg.sender, address(this), _amount);

        //approve to send to sender
        antiOption.approve(msg.sender,_amount);
        require(antiOption.allowance(address(this), msg.sender) == _amount, "Factory did not approve tokens");

        //send desired amount of options
        antiOption.transfer(msg.sender, _amount);
        
        emit buyAntiOption(msg.sender, _amount);
    }

    //exercise options
    function exerciseOption(address _underlyingToken, uint _amount, uint _orderNumber) public payable{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken option = allOptionTokens[_underlyingToken][_orderNumber];

        require(option.balanceOf(msg.sender) >= _amount, "You do not have enough Option Tokens");

        //get Strikes
        uint strikePrice = option.getStrikePrice();
        uint strikeDeadline = option.getStrikeDeadline();
        //price calculus
        uint priceNow = uint(getLatestPrice(_underlyingToken));

        require(priceNow >= strikePrice, "Restricted from exercising losing position in Option!");

        require(strikeDeadline.sub(3600) <= block.timestamp &&  block.timestamp <=  strikeDeadline, "Time Options: Not in exercise window!");
        require(msg.value >= _amount.div(10e18).mul(priceNow), "Did not send Ether equal to strike price!");


        //approve token
        my_underlyingToken.approve(msg.sender, _amount);

        //transfer token exercised
        option.burnOption(msg.sender, _amount);
        my_underlyingToken.transfer(msg.sender, _amount);

        //uint ratio = option.getApyRatio();
        //uint amount_w_ratio = _amount.div(ratio);
        //mint win ratio of price
        //my_underlyingToken.printMoney(msg.sender, amount_w_ratio);

        emit exercisedOption(_underlyingToken, _amount);
    }
    function exerciseAntiOption(address _underlyingToken, uint _amount, uint _orderNumber) public{
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        underlyingToken my_underlyingToken = allTokens[_underlyingToken][0];
        OptionToken antiOption = allAntiOptionTokens[_underlyingToken][_orderNumber];

        require(antiOption.balanceOf(msg.sender) >= _amount, "You do not have enough Anti Option Tokens");
        //get Strikes
        uint strikePrice = antiOption.getStrikePrice();
        uint strikeDeadline = antiOption.getStrikeDeadline();

        require(strikeDeadline <= block.timestamp, "Time Options: NOT EXPIRED");
        
        //price calculus
        uint priceNow = uint(getLatestPrice(_underlyingToken));
        
        require(priceNow <= strikePrice, "Restricted from exercising losing position in Option!");

        //approve token
        my_underlyingToken.approve(msg.sender, _amount);

        //transfer token exercised
        antiOption.burnOption(msg.sender, _amount);

        my_underlyingToken.transfer(msg.sender, _amount.div(10e18).mul(priceNow));

        uint ratio = antiOption.getApyRatio();
        uint amount_w_ratio = _amount.div(ratio);
        //mint win ratio of price
        my_underlyingToken.printMoney(msg.sender, amount_w_ratio);

        emit exercisedAntiOption(_underlyingToken, _amount);
    }
    //Getters
    function getAmountOptions(address _underlyingToken, address _who, uint _orderNumber) public view returns(uint){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        OptionToken option = allOptionTokens[_underlyingToken][_orderNumber];
        
        return option.balanceOf(_who);
    }
    function getAmountAntiOptions(address _underlyingToken, address _who, uint _orderNumber) public view returns(uint){
        require(allTokens[_underlyingToken].length > 0,"There are no options for this token");

        //get Tokens
        OptionToken antiOption = allAntiOptionTokens[_underlyingToken][_orderNumber];
        
        return antiOption.balanceOf(_who);
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
    function getAntiOptionApy(address _token, uint _orderNumber) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken antiOption = allAntiOptionTokens[_token][_orderNumber];
        return antiOption.getApyRatio();
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
    function getAntiOptionStrikePrices(address _token, uint _orderNumber) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken antiOption = allAntiOptionTokens[_token][_orderNumber];
        return antiOption.getStrikePrice();
    }
    function getOptionStrikeDeadline(address _token, uint _orderNumber) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken option = allOptionTokens[_token][_orderNumber];
        return option.getStrikeDeadline();
    }
    function getAntiOptionStrikeDeadline(address _token, uint _orderNumber) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken antiOption = allAntiOptionTokens[_token][_orderNumber];
        return antiOption.getStrikeDeadline();
    }
    function getOptionAddress(address _token, uint _orderNumber) public view returns(address){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken option = allOptionTokens[_token][_orderNumber];
        return address(option);
    }
    function getAntiOptionAddress(address _token, uint _orderNumber) public view returns(address){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        OptionToken antiOption = allAntiOptionTokens[_token][_orderNumber];
        return address(antiOption);
    }
    function getHowManyOptions(address _token) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        uint option = allOptionTokens[_token].length;
        return option;
    }
    function getHowManyAntiOptions(address _token) public view returns(uint){
        require(allTokens[_token].length > 0,"There are no options for this token");
        //get Tokens
        uint antiOption = allAntiOptionTokens[_token].length;
        return antiOption;
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