// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./underlyingToken.sol";

contract BasicLoan{
    using SafeMath for uint;

    enum LoanState{Created, Funded, Taken}
    
    struct Terms{
        uint loanAmount;
        uint feeAmount;
        uint ethCollateralAmount;
        address underlyingToken;
        uint orderNo;
    }

    Terms public terms;
    LoanState public state;
    address payable public lender;
    address payable public borrower;
    address factoryAddress;


    modifier onlyInState(LoanState expectedState){
        require(state == expectedState, "Not allowed in this state");
        _;
    }


    constructor(Terms memory _terms, address _factoryAddress){
        terms = _terms;
        state = LoanState.Created;
        factoryAddress = _factoryAddress;
    }

    function fundLoan() public onlyInState(LoanState.Created){
        state = LoanState.Funded;
    }

    function takeLoan() public onlyInState(LoanState.Funded){
        state = LoanState.Taken;
    }

    function Repay() public onlyInState(LoanState.Taken){
        selfdestruct(borrower);
    }
    function Liquidate() public onlyInState(LoanState.Taken){
        selfdestruct(lender);
    }

    function getTerms() public view returns(uint256 _loanAmount,uint256 _feeAmount,uint256 _ethCollateralAmount,address _underlyingToken,uint256 _orderNo){
        return (terms.loanAmount, terms.feeAmount, terms.ethCollateralAmount, terms.underlyingToken, terms.orderNo);
    }
}