import React from 'react';
import BoxWindowLoans from '../../../components/BoxWindowLoans';

declare let window: any

class BTC extends React.Component {
    render() {

      const tokenNo:number = 0
      const tokenLabel:string = "BTC"
      const option:string = "Puts"

      return (
        <BoxWindowLoans token={tokenNo} tokenLabel={tokenLabel} option={option}></BoxWindowLoans>
      );
    }
}

export default BTC;