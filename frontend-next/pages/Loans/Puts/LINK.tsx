import React from 'react';
import BoxWindowLoans from '../../../components/BoxWindowLoans';

declare let window: any

class LINK extends React.Component {
    render() {

      const tokenNo:number = 1
      const tokenLabel:string = "LINK"
      const option:string = "Puts"

      return (
        <BoxWindowLoans token={tokenNo} tokenLabel={tokenLabel} option={option}></BoxWindowLoans>
      );
    }
}

export default LINK;