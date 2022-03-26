import { ethers,waffle } from "hardhat"
import { UnderlyingToken__factory, LoanFactory__factory } from "../typechain"

const main = async(): Promise<any> => {

    const factoryAddress = "0xb9603AC67Db2bC1D7014c19306CaDA31EFa99Da5"
    const underlyingToken1 = "0xf51EFc18844A07ab2fC97BB2E74191A4d0BFd3Be"
    const underlyingToken2 = "0x89B2413521615d7044EE19Bec0066aFE0C03dcbE"


    const provider = waffle.provider;
    const signers = await ethers.getSigners()


    let txn;
    // CREATE FACTORY AND UNDERLYING TOKENS
    let orderNo = 0
    let amount = "1.1" //ether

    const loanFactory = await new LoanFactory__factory(signers[0]).deploy(factoryAddress)
    console.log("\nFactory at address: "+loanFactory.address+"\n")

    txn = await loanFactory.createBasicLoan(underlyingToken1, orderNo, true, {value: ethers.utils.parseEther(amount)}) // call option
    txn.wait()
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error)
  process.exit(1)
})    