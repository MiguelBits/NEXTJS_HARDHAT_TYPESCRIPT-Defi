// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OptionsFactory.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./BasicLoan.sol";
import "./optionToken.sol";

contract LoanFactory {
    using SafeMath for uint;

    address admin;
    address optionsFactory;
    mapping(address => BasicLoan[]) userLoans;


    event CreatedBasicLoan(address indexed borrower);
    event FundedBasicLoan(address indexed borrower);
    event TakenBasicLoan(address indexed borrower);
    event RepaidBasicLoan(address indexed borrower, uint loanNo);
    event Liquidated(address indexed borrower, uint loanNo);

    modifier onlyAdmin(){
        require(msg.sender == admin,"You are not admin!");
        _;
    }

    constructor(address _optionsFactory){
        admin = msg.sender;
        optionsFactory = _optionsFactory;
    }
    //true if Calls, false if Puts
    function createBasicLoan(address _underlyingToken, uint _orderNo, bool isCallOrPut) public payable{
        require(msg.value >= 1.1 ether, "Minimum buy 1 ether + 0.1ether fee per Ether");
        uint feeOfMsg = msg.value.div(10e18).mul(100000000000000000); //fee of how many ethers * 0.1ether
        uint percentLoan = msg.value.div(5).mul(4); //80% of value sent is loaned
        BasicLoan.Terms memory terms = BasicLoan.Terms(percentLoan,feeOfMsg,msg.value,_underlyingToken,_orderNo);

        BasicLoan loan = new BasicLoan(terms, address(this));
        userLoans[_underlyingToken].push(loan);

        emit CreatedBasicLoan(msg.sender);

        _fundLoanFactory(terms, isCallOrPut, msg.sender);

        loan.fundLoan();

        _takeLoanFactory(terms, isCallOrPut, msg.sender);

        loan.takeLoan();
    }
    function _fundLoanFactory(BasicLoan.Terms memory _terms, bool isCallOrPut, address _sender) internal{
        OptionsFactory optFactory = OptionsFactory(optionsFactory);

        payable(address(optFactory)).transfer(_terms.feeAmount);
        if(isCallOrPut){
            optFactory.buyOptions(_terms.underlyingToken, _terms.loanAmount, _terms.orderNo);
        }
        else{
            optFactory.buyAntiOptions(_terms.underlyingToken, _terms.loanAmount, _terms.orderNo);
        }

        emit FundedBasicLoan(_sender);
    }

    function _takeLoanFactory(BasicLoan.Terms memory _terms, bool isCallOrPut, address _sender) internal{
        OptionsFactory optFactory = OptionsFactory(optionsFactory);
        OptionToken optToken;

        if(isCallOrPut){
            address optionToken = optFactory.getOptionAddress(_terms.underlyingToken, _terms.orderNo);
            optToken = OptionToken(optionToken);

        }
        else{
            address antiOptionToken = optFactory.getAntiOptionAddress(_terms.underlyingToken, _terms.orderNo);
            optToken = OptionToken(antiOptionToken);
        }

        optToken.approve(_sender, _terms.loanAmount);
        optToken.transfer(_sender, _terms.loanAmount);

        emit TakenBasicLoan(_sender);
    }

    function repayLoan(bool isCallOrPut, uint _loanNo) public{
        require(userLoans[msg.sender].length > 0, "You do not have any loans");

        OptionsFactory optFactory = OptionsFactory(optionsFactory);

        BasicLoan loan = userLoans[msg.sender][_loanNo];

        OptionToken optToken;
        (uint256 _loanAmount,uint256 _feeAmount,uint256 _ethCollateralAmount,address _underlyingToken,uint256 _orderNo) = loan.getTerms();

        if(isCallOrPut){
            address optionToken = optFactory.getOptionAddress(_underlyingToken, _orderNo);
            optToken = OptionToken(optionToken);
        }
        else{
            address antiOptionToken = optFactory.getAntiOptionAddress(_underlyingToken, _orderNo);
            optToken = OptionToken(antiOptionToken);
        }

        require(optToken.balanceOf(msg.sender) >= _loanAmount, "You do not have enough Option Tokens");

        optToken.transferFrom(msg.sender, address(this), _loanAmount);

        if(isCallOrPut){
            optFactory.exerciseOption(_underlyingToken, _loanAmount, _orderNo);
        }
        else{
            optFactory.exerciseAntiOption(_underlyingToken, _loanAmount, _orderNo);
        }
        
        payable(msg.sender).transfer(_ethCollateralAmount);

        emit RepaidBasicLoan(msg.sender,_loanNo);

        loan.Repay();
    }
    function Liquidate(address _who, uint _loanNo) public onlyAdmin(){
        require(userLoans[_who].length > 0, "User does not have any loans");
        BasicLoan loan = userLoans[_who][_loanNo];
        loan.Liquidate();
        (uint256 _loanAmount,uint256 _feeAmount,uint256 _ethCollateralAmount,address _underlyingToken,uint256 _orderNo) = loan.getTerms();

        payable(optionsFactory).transfer(_ethCollateralAmount);

        emit Liquidated(_who, _loanNo);
    }
}