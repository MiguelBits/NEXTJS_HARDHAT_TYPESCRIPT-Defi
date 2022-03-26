import React from 'react';
import BoxWindow from "../../components/BoxWindow"

declare let window: any

class BTC extends React.Component {
  render() {

    const tokenNo:number = 0
    const tokenLabel:string = "BTC"
    const option:string = "Puts"

    return (
      <BoxWindow token={tokenNo} tokenLabel={tokenLabel} option={option}></BoxWindow>
    );
  }
}

export default BTC;