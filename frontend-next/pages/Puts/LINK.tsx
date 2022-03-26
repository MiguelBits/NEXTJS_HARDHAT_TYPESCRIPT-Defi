import React from 'react';
import BoxWindow from "../../components/BoxWindow"

declare let window: any

class LINK extends React.Component {
  render() {

    const tokenNo:number = 1
    const tokenLabel:string = "LINK"
    const option:string = "Puts"

    return (
      <BoxWindow token={tokenNo} tokenLabel={tokenLabel} option={option}></BoxWindow>
    );
  }
}

export default LINK;