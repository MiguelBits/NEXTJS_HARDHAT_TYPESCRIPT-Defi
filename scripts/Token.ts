import { ethers,waffle } from "hardhat"
import { UnderlyingToken__factory, OptionsFactory__factory } from "../typechain"

const main = async(): Promise<any> => {
  
  const strikePrice = "300000000000000"
  const supplyOptions = "5000000000000000000"
  const supplyOptions2 = "8000000000000000000"
  const fee = ethers.utils.parseEther("0.1").toString()
  const priceOracle = "0x378E78509a907B1Ec5c24d9f0243BD39f7A7b007"
  const priceOracle2 = "0xf4060f80f295b34e0C2471461ba43745Aeb186d6"

  const provider = waffle.provider;
  const signers = await ethers.getSigners()

  // CREATE FACTORY AND UNDERLYING TOKENS
  const optionsFactory = await new OptionsFactory__factory(signers[0]).deploy()
  console.log("Factory at address: "+optionsFactory.address+"\n")

  const tokenizer = await new UnderlyingToken__factory(signers[0]).deploy("BTC","BTC",optionsFactory.address)

  console.log("Coin deployed at: "+tokenizer.address)
  console.log("Account: "+signers[0].address)

    //check balances in admin
  let balance = await tokenizer.balanceOf(signers[0].address)

  console.log("Token Balance is: "+balance.toString())

  const tokenizer2 = await new UnderlyingToken__factory(signers[0]).deploy("BTC","BTC",optionsFactory.address)

  console.log("Coin2 deployed at: "+tokenizer2.address)
  console.log("Account: "+signers[0].address)

  let balance2 = await tokenizer2.balanceOf(signers[0].address)

  console.log("Token Balance is: "+balance2.toString())


  //CREATE OPTION AND ANTI OPTION IN FACTORY

  //token1 options
  var timestamp = Math.round(new Date().getTime() / 1000); //get timestamp for now
  timestamp += 3600*24; //now + 24h
  const apy_ratio = 20;
  console.log("Approving Token... to fund factory...")
  await tokenizer.approve(optionsFactory.address,supplyOptions)//5 ether
  console.log("Approved")
  await optionsFactory.createOptionsToken(tokenizer.address, priceOracle)
  await optionsFactory.activateOption(tokenizer.address,strikePrice,timestamp,supplyOptions, apy_ratio)//strike price 3ether, fund with 5ether, 20%ratio
  await optionsFactory.activateAntiOption(tokenizer.address,strikePrice,timestamp,supplyOptions, apy_ratio-5)//strike price 3ether, fund with 5ether, 15%ratio

  //check balances in every actor
  balance = await tokenizer.balanceOf(signers[0].address)

  let optionBalance = await optionsFactory.getAmountOptions(tokenizer.address,optionsFactory.address)
  let antiOptionBalance = await optionsFactory.getAmountAntiOptions(tokenizer.address,optionsFactory.address)
  let factoryTokenBalance = await optionsFactory.getTokenBalance(tokenizer.address);

  console.log("After New Balance: "+balance.toString())
  console.log("Factory => Option Balance: "+optionBalance.toString())
  console.log("Factory => Anti Option Balance: "+antiOptionBalance.toString())
  console.log("Factory => Underlying Token Balance " + factoryTokenBalance.toString())

  //token2 options
  var timestamp2 = Math.round(new Date().getTime() / 1000); //get timestamp for now
  timestamp2 += 3600*24; //now + 24h
  const apy_ratio2 = 40;
  console.log("Approving Token2... to fund factory...")
  console.log("Approved")
  await tokenizer2.approve(optionsFactory.address,supplyOptions2)//5 ether

  await optionsFactory.createOptionsToken(tokenizer2.address, priceOracle2)
  await optionsFactory.activateOption(tokenizer2.address,strikePrice,timestamp2,supplyOptions2, apy_ratio2)//strike price 3ether, fund with 5ether, 40%ratio
  await optionsFactory.activateAntiOption(tokenizer2.address,strikePrice,timestamp2,supplyOptions2, apy_ratio2-15)//strike price 3ether, fund with 5ether, 25%ratio

  //check balances in every actor
  balance2 = await tokenizer2.balanceOf(signers[0].address)

  let optionBalance2 = await optionsFactory.getAmountOptions(tokenizer2.address,optionsFactory.address)
  let antiOptionBalance2 = await optionsFactory.getAmountAntiOptions(tokenizer2.address,optionsFactory.address)
  let factoryTokenBalance2 = await optionsFactory.getTokenBalance(tokenizer2.address);

  console.log("After New Balance: "+balance2.toString())
  console.log("Factory => Option Balance: "+optionBalance2.toString())
  console.log("Factory => Anti Option Balance: "+antiOptionBalance2.toString())
  console.log("Factory => Underlying Token Balance " + factoryTokenBalance2.toString())

  console.log("\nWill now buy options from factory\n")
  //Buy Option Simulation
  /*
  console.log("Sending ether to pay premium on buy Option...")
  await optionsFactory.buyOptions(tokenizer.address,"1000000000000000000", { value: fee }) //buyOptions 1ether + pay premium
  optionBalance = await optionsFactory.getAmountOptions(tokenizer.address,optionsFactory.address)
  console.log("Factory => Option Balance: "+optionBalance.toString())

  console.log("Approving Token... to buy Anti-Option")
  await tokenizer.approve(optionsFactory.address,"2000000000000000000")//2 ether

  await optionsFactory.buyAntiOptions(tokenizer.address,"2000000000000000000", { value: ethers.utils.parseEther("0.2") }) //buyAntiOptions 2ether + pay premium
  antiOptionBalance = await optionsFactory.getAmountAntiOptions(tokenizer.address,optionsFactory.address)
  console.log("Factory => Anti Option Balance: "+antiOptionBalance.toString())

  let MyOptions = await optionsFactory.getAmountOptions(tokenizer.address,signers[0].address)
  let MyAntiOptions = await optionsFactory.getAmountAntiOptions(tokenizer.address,signers[0].address)

  console.log("My Option Balance: "+MyOptions.toString())
  console.log("My Anti-Option Balance: "+MyAntiOptions.toString())

  let MyTokenPrice = await optionsFactory.getLatestPrice(tokenizer.address);
  console.log("The Token is valued at: "+ MyTokenPrice.toString())
*/
/*
  console.log("\nWill now Exercise Options\n")
  //exercise Option
  await optionsFactory.exerciseOption(tokenizer.address,"500000000000000000", { value: strikePrice }) // exercise 0.5ether of token, send ether value to pay it
  
  MyOptions = await optionsFactory.getAmountOptions(tokenizer.address,signers[0].address)
  console.log("My Option Balance: "+MyOptions.toString())
  optionBalance = await optionsFactory.getAmountOptions(tokenizer.address,optionsFactory.address)
  console.log("Factory => Option Balance: "+optionBalance.toString())

  //exercise Anti Option
  //let error = await optionsFactory.exerciseAntiOption(tokenizer.address,"500000000000000000") // exercise 0.5ether of token

  await optionsFactory.withdrawFees()
  const ether_factoryBalance = await provider.getBalance(optionsFactory.address);
  console.log("Factory => Underlying Token Balance " + ether_factoryBalance.toString())
  let finalBalance = await tokenizer.balanceOf(signers[0].address)
  console.log("My Final Token Balance: "+ ethers.utils.parseEther(finalBalance.toString()).toString())
*/
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error)
  process.exit(1)
})