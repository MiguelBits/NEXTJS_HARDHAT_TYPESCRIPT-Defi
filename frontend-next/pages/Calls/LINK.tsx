import React from 'react';
import TopBar from '../../components/TopBar';
import styles from "../../styles/Options.module.css"
import Head from 'next/head'
import { BigNumber, ethers } from 'ethers';
import {token2Address, factoryAddress, factoryABI, erc20ABI} from "../contracts_abi"

declare let window: any

class LINK extends React.Component {
    state = {
      optionTab: "Buy",
      strikePriceOption: [],
      strikeDeadlineOption: [],
      selectedPrice: "",
      selectedDeadline: "",
      amountOptions: "",
      balanceOptions: "",
      fee: "100000000000000000",

    }
    
    componentDidMount = () => {
        this.getStrikes()
        this.getBalanceOptions()
        
    };
    getStrikes = async () =>{
        const { ethereum } = window;
        if (ethereum) {
          
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
    
          let strikePriceOptions:any = []
          let strikeDeadlineOptions:any = []

          const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
          await factoryContract.getOptionStrikePrices(token2Address).then((result:any ) =>{
            strikePriceOptions.push(ethers.utils.formatEther(result).slice(0,6))
          })
    
          this.setState({strikePriceOption:strikePriceOptions});

          await factoryContract.getOptionStrikeDeadline(token2Address).then((result:any ) =>{
            strikeDeadlineOptions.push(ethers.utils.formatEther(result).slice(0,6))
          })
    
          this.setState({strikeDeadlineOption:strikeDeadlineOptions});

    
        }else{
          console.log("Ethereum object does not exist");
        }
    }
    getBalanceOptions = async () => {
      const { ethereum } = window;
        if (ethereum) {
          
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const accounts = await provider.listAccounts();

          const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
          await factoryContract.getAmountOptions(token2Address,accounts[0]).then((result:any ) =>{
            this.setState({balanceOptions:ethers.utils.formatEther(result).slice(0,6)});
          })
        }else{
          console.log("Ethereum object does not exist");
        }
    }
    buyOption = async () => {
      const { ethereum } = window;
      if (ethereum) {
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
        const payFee = BigNumber.from(this.state.fee).mul(this.state.amountOptions)
        await factoryContract.buyOptions(token2Address,ethers.utils.parseEther(this.state.amountOptions),{ value: payFee })
      }else{
        console.log("Ethereum object does not exist");
      }
    }
    sellOption = async () => {
      const { ethereum } = window;
      if (ethereum) {
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
        await factoryContract.exerciseOption(token2Address,this.state.amountOptions)
      }else{
        console.log("Ethereum object does not exist");
      }
    }
    approveToken = async() => {
      const { ethereum } = window;
        if (ethereum) {
          
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();

          const tokenContract = new ethers.Contract(token2Address, erc20ABI, signer);
          await tokenContract.approve(factoryAddress,this.state.amountOptions)
        }else{
          console.log("Ethereum object does not exist");
        }
    }
    approveSellToken = async() => {
      const { ethereum } = window;
        if (ethereum) {
          
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          let address = "";
          const factoryContract = new ethers.Contract(factoryAddress,factoryABI,signer);
          await factoryContract.getOptionAddress(token2Address).then( (result:any) => {
            address = result
          })
          const tokenContract = new ethers.Contract(address, erc20ABI, signer);
          await tokenContract.approve(factoryAddress,this.state.amountOptions)

        }else{
          console.log("Ethereum object does not exist");
        }
    }
    parseDate = (result:any) => {
      var a = new Date(result * 1000);
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var year = a.getFullYear();
      var month = months[a.getMonth()];
      var date = a.getDate();
      var hour = a.getHours();
      var min = a.getMinutes();
      var sec = a.getSeconds();
      var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
      return time;
    }
    render() {
      return (
        <div className={styles.container}>
          <Head>
            <title>LINK Calls DApp</title>
            <meta name="description" content="Generated by create next app" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <TopBar></TopBar>
            <main className={styles.main}>
              
              {
              this.state.optionTab === "Buy" ? 
                <div>
                  <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
                    <li className="mr-2">
                        <a onClick={() => this.setState({optionTab:"Buy"})} aria-current="page" className="inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500">Buy Option</a>
                    </li>
                    <li className="mr-2">
                        <a onClick={() => this.setState({optionTab:"Sell"})} className="inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300">Sell Option</a>
                    </li>
                  </ul>
                
                  <div className="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
                    <a href="#">
                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Buy LINK Options<span className=" bg-green-100 text-green-800 text-xs font-semibold ml-24 px-2.5 py-0.5 rounded dark:bg-green-200 dark:text-green-900">CALLS</span>  </h5>
                    </a>
                    <br></br>
                    {/* Price Dropdown menu */}
                    <h2>Strike Prices:</h2>
                    <fieldset>
                      {this.state.strikePriceOption.map(item => {
                        return(
                        <div className="flex items-center mb-4">
                          <input onClick={() => this.setState({selectedPrice:item})} id="country-option-2" type="radio" name="prices" value={item} className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:focus:bg-blue-600 dark:bg-gray-700 dark:border-gray-600" aria-labelledby="country-option-2" aria-describedby="country-option-2"/>
                          <label htmlFor="country-option-2" className="block ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            {item}
                          </label>
                        </div>
                        )
                      })}
                    </fieldset>
                    {/* Deadline Dropdown menu */}
                    <h2>Strike Deadlines:</h2>
                    <fieldset>
                      {this.state.strikeDeadlineOption.map(item => {
                        return(
                        <div className="flex items-center mb-4">
                          <input onClick={() => this.setState({selectedDeadline:item})} id="country-option-2" type="radio" name="deadline" value={item} className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:focus:bg-blue-600 dark:bg-gray-700 dark:border-gray-600" aria-labelledby="country-option-2" aria-describedby="country-option-2"/>
                          <label htmlFor="country-option-2" className="block ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            {this.parseDate(item)}
                          </label>
                        </div>
                        )
                      })}
                    </fieldset>
                    <br></br>
                    {/* Input Amount */}
                    <div className="flex justify-center">
                      <div className="mb-3 xl:w-96">
                        <label htmlFor="exampleText0" className="form-label inline-block mb-2 text-gray-700">How much?</label>
                        <input
                          type="text"
                          className="
                            form-control
                            block
                            w-full
                            px-3
                            py-1.5
                            text-base
                            font-normal
                            text-gray-700
                            bg-white bg-clip-padding
                            border border-solid border-gray-300
                            rounded
                            transition
                            ease-in-out
                            m-0
                            focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
                          "
                          id="exampleText0"
                          placeholder="Amount of Options to Buy"
                          onChange={(e)=>this.setState({amountOptions:e.target.value})}
                        />
                      </div>
                    </div>
                    <br></br>
                    <a onClick={this.buyOption} className="inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                        Buy Option
                        <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </a>
                    <button type="button" onClick={() => this.approveToken()} className="ml-24 inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out">Approve</button>

                  </div>
                </div>
                :
                <div>
                  <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
                    <li className="mr-2">
                        <a onClick={() => this.setState({optionTab:"Buy"})} aria-current="page" className="inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300">Buy Option</a>
                    </li>
                    <li className="mr-2">
                        <a onClick={() => this.setState({optionTab:"Sell"})} className="inline-block p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500">Sell Option</a>
                    </li>
                  </ul>
                  <div className="p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
                    <a href="#">
                        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Sell LINK Options<span className=" bg-green-100 text-green-800 text-xs font-semibold ml-24 px-2.5 py-0.5 rounded dark:bg-green-200 dark:text-green-900">CALLS</span></h5>
                    </a>
                    <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">Balance: {this.state.balanceOptions}</p>
                    {/* Input Amount */}
                    <div className="flex justify-center">
                      <div className="mb-3 xl:w-96">
                        <label htmlFor="exampleText0" className="form-label inline-block mb-2 text-gray-700">How much?</label>
                        <input
                          type="text"
                          className="
                            form-control
                            block
                            w-full
                            px-3
                            py-1.5
                            text-base
                            font-normal
                            text-gray-700
                            bg-white bg-clip-padding
                            border border-solid border-gray-300
                            rounded
                            transition
                            ease-in-out
                            m-0
                            focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
                          "
                          id="exampleText0"
                          placeholder="Amount of Options to Sell"
                          onChange={(e)=>this.setState({amountOptions:e.target.value})}
                        />
                      </div>
                    </div>
                    <br></br>
                    <a onClick={this.sellOption} className="inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                        Sell Option
                        <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    </a>
                    <button type="button" onClick={() => this.approveSellToken()} className="ml-24 inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out">Approve</button>

                  </div>
                </div>
              }
            
            </main>
        </div>

      );
    }
}

export default LINK;