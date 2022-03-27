import React from 'react';
import styles from '../styles/Home.module.css'
import { ethers, BigNumber } from 'ethers';
import {tokenAddress, tokenABI, factoryAddress, factoryABI, erc20ABI} from "./../pages/contracts_abi"
import { FaEthereum } from "react-icons/fa";
import TopBar from './TopBar';
import Head from 'next/head'

type Props = {
    token:number;
    tokenLabel:string;
    option:string;
}

declare let window: any
class BoxWindow extends React.Component<Props> {
    constructor(props: Props){
        super(props)
    }
    state = {
      token: this.props.token,
      option: this.props.option,
      tokenLabel: this.props.tokenLabel,
      
      optionTab: "Buy",
      strikePriceOption: [],
      strikeDeadlineOption: [],
      selectedPrice: "",
      selectedDeadline: "",
      amountOptions: "",
      balanceOptions: [],
      fee: "100000000000000000",
      howmany: 0,
      orderNo: 0,
      needApproveToken: true,
      needApproveExerciseToken: true,

    }
    
    componentDidMount = () => {

            this.getHowManyOptions()   
            this.getStrikes()
            this.getBalanceOptions()  
  
        
    };
    getHowManyOptions = async () => {
      const { ethereum } = window;
      if (ethereum) {
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
  
        const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
        
        await factoryContract.getHowManyOptions(tokenAddress[this.state.token]).then((result:any) => {
          this.setState({howmany:parseInt(result.toString())})
        })
  
      }else{
        console.log("Ethereum object does not exist");
      }
    }
    getStrikes = async () =>{
        const { ethereum } = window;
        if (ethereum) {
          
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
    
          let strikePriceOptions:any = []
          let strikeDeadlineOptions:any = []

          const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
          //console.log("this many: "+this.state.howmany)
          for(let i = 0; i<=this.state.howmany; i++){
            await factoryContract.getOptionStrikePrices(tokenAddress[this.state.token],i).then((result:any ) =>{
              strikePriceOptions.push(ethers.utils.formatEther(result).slice(0,6))
              //console.log("fking shit "+ethers.utils.formatEther(result).slice(0,6))
            })
            await factoryContract.getOptionStrikeDeadline(tokenAddress[this.state.token],i).then((result:any ) =>{
              strikeDeadlineOptions.push(result.toString())
            })
                      
            this.setState({strikePriceOption:strikePriceOptions});
      
            this.setState({strikeDeadlineOption:strikeDeadlineOptions});
          }
    
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

          let balances:any = [];

          const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
          for(let i = 0; i<=this.state.howmany; i++){
            try{
              await factoryContract.getAmountOptions(tokenAddress[this.state.token],accounts[0],i).then((result:any ) =>{
                //console.log(result)
                balances.push(ethers.utils.formatEther(result).slice(0,6));
              })
            }catch{
              balances.push("0")
            }
            
          }
          this.setState({balanceOptions:balances})
        }else{
          console.log("Ethereum object does not exist");
        }
    }
    buyOption = async (orderNo:any) => {
      const { ethereum } = window;
      if (ethereum) {
        //console.log(this.state.strikePriceOption)
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
        const payFee = (BigNumber.from(this.state.fee).mul(this.state.amountOptions)).toString()
        await factoryContract.buyOptions(tokenAddress[this.state.token],ethers.utils.parseEther(this.state.amountOptions), this.state.orderNo,{ value: payFee })
      }else{
        console.log("Ethereum object does not exist");
      }
    }
    ExerciseOption = async (orderNo:any) => {
      const { ethereum } = window;
      if (ethereum) {
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
        await factoryContract.exerciseOption(tokenAddress[this.state.token],ethers.utils.parseEther(this.state.amountOptions), this.state.orderNo)
      }else{
        console.log("Ethereum object does not exist");
      }
    }
    approveToken = async() => {
      const { ethereum } = window;
        if (ethereum) {
          
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();

          const tokenContract = new ethers.Contract(tokenAddress[this.state.token], erc20ABI, signer);
          await tokenContract.approve(factoryAddress,ethers.utils.parseEther(this.state.amountOptions))
        }else{
          console.log("Ethereum object does not exist");
        }
    }
    approveExerciseToken = async() => {
      const { ethereum } = window;
        if (ethereum) {
          
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          let address = "";
          const factoryContract = new ethers.Contract(factoryAddress,factoryABI,signer);
          await factoryContract.getOptionAddress(tokenAddress[this.state.token]).then( (result:any) => {
            address = result
          })
          const tokenContract = new ethers.Contract(address, erc20ABI, signer);
          await tokenContract.approve(factoryAddress,this.state.amountOptions)

        }else{
          console.log("Ethereum object does not exist");
        }
    }
      needApproveToken = async () =>{
        const { ethereum } = window;
        if (ethereum) {
          
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const accounts = await provider.listAccounts();
          
          const tokenContract = new ethers.Contract(tokenAddress[this.state.token], erc20ABI, signer);
          tokenContract.allowance(accounts[0],factoryAddress).then((result:any)=>{
            if(ethers.utils.formatEther(result.toString()) >= this.state.amountOptions){
              return false
            }
            else{
              return true
            }
          })
        }else{
          console.log("Ethereum object does not exist");
        }
      }
      needApproveExerciseToken = async() => {
        const { ethereum } = window;
          if (ethereum) {
            
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const accounts = await provider.listAccounts();

            let address = "";
            const factoryContract = new ethers.Contract(factoryAddress,factoryABI,signer);
            await factoryContract.getOptionAddress(tokenAddress[this.state.token]).then( (result:any) => {
              address = result
            })
            const tokenContract = new ethers.Contract(address, erc20ABI, signer);
            await tokenContract.allowance(accounts[0],factoryAddress).then((result:any)=>{
              if(ethers.utils.formatEther(result.toString()) >= this.state.amountOptions){
                return false
              }
              else{
                return true
              }
            })
  
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
    setStrikes = (item:any, i:any) =>{
      this.setState({selectedPrice:item})
      this.setState({selectedDeadline:this.state.strikeDeadlineOption[i]})
      this.setState({orderNo:i})
    }
    changeAmounts = (value:any) => {
      this.setState({amountOptions:value})
      this.setState({needApproveToken:this.needApproveToken()})
    }
    checkCallOrPut =() => {
        if(this.props.option == "Calls"){
            return("bg-green-100 text-green-800 text-xs font-semibold ml-24 px-2.5 py-0.5 rounded dark:bg-green-200 dark:text-green-900")
        }
        else{
            return("bg-red-100 text-red-800 text-xs font-semibold ml-24 px-2.5 py-0.5 rounded dark:bg-red-200 dark:text-red-900")
        }
    }
    render() {
        const optionClassName = this.checkCallOrPut()
      return (
        <div className={styles.container}>
          <Head>
            <title>{this.props.tokenLabel} {this.props.option} DApp</title>
            <meta name="description" content="Generated by create next app" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <TopBar></TopBar>
            <main className={styles.main}>
              <div className='bg-blue-900 rounded-lg '>
                {
                this.state.optionTab === "Buy" ? 
                  <div>
                    <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
                      <li className="">
                          <a onClick={() => this.setState({optionTab:"Buy"})} aria-current="page" className="inline-block cursor-pointer p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500">Buy Option</a>
                      </li>
                      <li className="ml-9">
                          <a onClick={() => this.setState({optionTab:"Exercise"})} className="inline-block cursor-pointer p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300">Exercise Option</a>
                      </li>

                    </ul>
                  
                    <div className="p-6 w-auto bg-white border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
                      <a href="#">
                          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Buy {this.props.tokenLabel} Options<span className={optionClassName}>{this.props.option.toUpperCase()}</span>  </h5>
                      </a>
                      <br></br>
                      {/* Price Dropdown menu */}
                      <br></br>
                      {this.state.strikePriceOption.map((item,i) => {
                        return(
                          <fieldset>
                              <div>
                                <div className="flex items-center justify-center mb-4">
                                  <input onClick={() => this.setStrikes(item,i)} id="country-option-2" type="radio" name="prices" value={item} className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:focus:bg-blue-600 dark:bg-gray-700 dark:border-gray-600" aria-labelledby="country-option-2" aria-describedby="country-option-2"/>
                                  <div className="w-35 text-center text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <ul>
                                      <li className="w-full px-4 py-2 border-b border-gray-200 rounded-t-lg dark:border-gray-600">
                                        Strike Price: 
                                        <br></br>
                                        {item}Ξ
                                      </li>
                                      <li className="w-full px-4 py-2 rounded-b-lg">
                                        Strike Deadline: 
                                        <br></br>
                                        {this.parseDate(this.state.strikeDeadlineOption[i])}
                                      </li>
                                    </ul>
                                  </div>
                                  
                                </div>
                              </div>
                          </fieldset>
                        )})}
                      
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
                            onChange={(e)=>this.changeAmounts(e.target.value)}
                          />
                        </div>
                      </div>
                      <br></br>
                      <a onClick={this.buyOption} className="cursor-pointer inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          Buy Option
                          <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                      </a>
                      <button type="button" onClick={() => this.approveToken()} className={this.state.needApproveToken ?
                        "ml-48 inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
                        :
                        "ml-48 inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out"}>
                        {this.state.needApproveToken ? "Approve":"Approved"}
                      </button>
                    </div>
                  </div>
                  :
                  <div>
                    <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
                      <li className="mr-2">
                          <a onClick={() => this.setState({optionTab:"Buy"})} aria-current="page" className="inline-block cursor-pointer p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300">Buy Option</a>
                      </li>
                      <li className="mr-2">
                          <a onClick={() => this.setState({optionTab:"Exercise"})} className="inline-block cursor-pointer p-4 text-blue-600 bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500">Exercise Option</a>
                      </li>

                    </ul>
                  
                    <div className="p-6 w-auto bg-white border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
                      <a href="#">
                          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Buy {this.props.tokenLabel} Options<span className=" bg-green-100 text-green-800 text-xs font-semibold ml-24 px-2.5 py-0.5 rounded dark:bg-green-200 dark:text-green-900">{this.props.option.toUpperCase()}</span>  </h5>
                      </a>
                      <br></br>
                      {/* Price Dropdown menu */}
                      <br></br>
                      {this.state.strikePriceOption.map((item,i) => {
                        return(
                          <fieldset>
                              <div>
                                <div className="flex items-center justify-center mb-4">
                                  <input onClick={() => this.setStrikes(item,i)} id="country-option-2" type="radio" name="prices" value={item} className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:focus:bg-blue-600 dark:bg-gray-700 dark:border-gray-600" aria-labelledby="country-option-2" aria-describedby="country-option-2"/>
                                  <div className="w-35 text-center text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <ul>
                                      <li className="w-full px-4 py-2 border-b border-gray-200 rounded-t-lg dark:border-gray-600">
                                        Balance: {this.state.balanceOptions[i]}Ξ
                                      </li>
                                      <li className="w-full px-4 py-2 border-b border-gray-200 dark:border-gray-600">Strike Price: <br></br>
                                        {item}Ξ</li>
                                      <li className="w-full px-4 py-2 rounded-b-lg">
                                        Strike Deadline: <br></br>
                                        {this.parseDate(this.state.strikeDeadlineOption[i])}
                                      </li>
                                    </ul>
                                  </div>
                                  
                                </div>
                              </div>
                          </fieldset>
                        )})}
                      
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
                            placeholder="Amount of Options to Exercise"
                            onChange={(e)=>this.changeAmounts(e.target.value)}
                          />
                        </div>
                      </div>
                      <br></br>
                      <a onClick={this.ExerciseOption} className="inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          Exercise Option
                          <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                      </a>
                      <button type="button" onClick={() => this.approveExerciseToken()} className={this.state.needApproveExerciseToken ?
                        "ml-48 inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
                        :
                        "ml-48 inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out"}>
                        {this.state.needApproveExerciseToken ? "Approve":"Approved"}
                      </button>

                    </div>
                  </div>
                }
              </div>
            
            </main>
        </div>

      );
    }
}

export default BoxWindow;