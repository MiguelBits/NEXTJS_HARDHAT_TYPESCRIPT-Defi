import React from 'react'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../../styles/Home.module.css'
import { ethers } from 'ethers';
import {tokenAddress, token2Address, tokenABI, factoryAddress, factoryABI, erc20ABI} from "./../contracts_abi"
import { toast } from 'react-toastify';
import { FaEthereum } from "react-icons/fa";
import { AiOutlineMenuUnfold } from "react-icons/ai";

declare let window: any

export default class Home extends React.Component {
  state = {
    currentAccount: null,
    network: {
      avalancheFuji: {
          chainId: `0x${Number(43113).toString(16)}`,
          chainName: "Avalanche Fuji Testnet",
          nativeCurrency: {
              name: "AVAX",
              symbol: "AVAX",
              decimals: 18
          },
          rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
          blockExplorerUrls: ["https://testnet.snowtrace.io/"]
      }
    },

    tokens: ["BTC", "LINK"],
    balance: [],
    prices: [],
    strikesDeadline: ["0","0"],
    
    btc_calls: 0,
    link_calls: 0,
  }

  componentDidMount = () => {
    this.balanceToken()
    this.priceToken()
    //this.getDeadline()
  }

  handleNetworkSwitch = async () => {
    try {
        if (!window.ethereum) throw new Error("No crypto wallet found");
        let txn = await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [this.state.network["avalancheFuji"]]
        });
        await txn.wait();
      } catch (err) {
        console.log(err)
      }
  };
  checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
        console.log("Make sure you have Metamask installed!");
        return;
    } else {
        console.log("Wallet exists! We're ready to go!")
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        this.setState({currentAccount: account});
    } else {
        console.log("No authorized account found");
    }
      
  }

  connectWalletHandler = async () => {
      const { ethereum } = window;

      if (!ethereum) {
          toast.error("Please install Metamask!");
      }


      try {
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          toast.success("Found an account! Address: "+ accounts[0].slice(0,6) + "..."+accounts[0].slice(38,43));
          this.setState({accounts:accounts[0]});
      } catch (err) {
          console.log(err)
      }
      
  }
  balanceToken = async () =>{
    const { ethereum } = window;
      if (ethereum) {
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const accounts = await provider.listAccounts();

        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
        tokenContract.balanceOf(accounts[0]).then((balance:any) =>{
          console.log(ethers.utils.formatEther(balance))
          this.setState({balance:ethers.utils.formatEther(balance)})
        })
      }else{
        console.log("Ethereum object does not exist");
      }
  }
  mintToken = async (item:any) =>{
    const { ethereum } = window;
      if (ethereum) {
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        let tokenContract;

        if(item === "BTC"){
          tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
        }
        else{
          tokenContract = new ethers.Contract(token2Address, tokenABI, signer);
        }

        tokenContract.saveThatMoney().then((balance: Promise<String>) =>{
          return(balance.toString())
        })
      }else{
        console.log("Ethereum object does not exist");
      }
  }
  priceToken = async () =>{
    const { ethereum } = window;
    if (ethereum) {
      
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      let prices:any = []

      const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
      await factoryContract.getLatestPrice(tokenAddress).then((price:any ) =>{
        console.log("Price: "+ethers.utils.formatEther(price).slice(0,6))
        this.setState({prices:[ethers.utils.formatEther(price).slice(0,6)]})
      })
      
    }else{
      console.log("Ethereum object does not exist");
    }
  }
  getDeadline = async () => {
    const { ethereum } = window;
    if (ethereum) {
      
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      let deadlines:any = []

      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      await tokenContract.getStrikeDeadline().then((strike:any ) =>{
        this.setState({deadlines:[ethers.utils.formatEther(strike).slice(0,6)]})
      })
      
    }else{
      console.log("Ethereum object does not exist");
    }
  }
  render(): React.ReactNode {
    return (
      <div className={styles.container}>

        <Head>
          <title>Loan & Options DApp</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <main className={styles.main}>

          <h1 className={styles.title}>
            Welcome to <a href="https://nextjs.org">Dopex!</a>
          </h1>

          <div className={styles.pricesContainer} >
            {this.state.tokens.map((item,i) => {
              return(
                <div key={i} className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800" onClick={(item) => {this.mintToken(item)}}>
                  <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md ">
                    {item} {this.state.prices[i]} / <FaEthereum className='inline'/>
                  </span>
                </div>)
            })}
            <div className={styles.changeNetwork}>
              <button className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800">
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                    Connect to Avalanche
                </span>
              </button>          
            </div>
            <button>
              <a href="/"> <AiOutlineMenuUnfold ></AiOutlineMenuUnfold> </a>
            </button>
          </div>

          <div className={styles.balance}>
            <p>Balance: {this.state.balance}</p>
          </div>
  
          <div className={styles.grid}>
            {this.state.tokens.map( (item,i) => {
              return(
                <a className={styles.card}>
                  <h2>{item}
                    <span className=" bg-green-100 text-green-800 text-xs font-semibold ml-24 px-2.5 py-0.5 rounded dark:bg-green-200 dark:text-green-900">Calls</span>  
                  </h2>
                  <ul className='ml-5 flex flex-wrap font-medium text-center text-gray-500'>
                    <li className='mr-2'>
                      <a className="inline-block p-4 text-blue-600 bg-gray-100 rounded-md active dark:bg-gray-800 dark:text-blue-500">
                        TVL:
                      </a>
                    </li>
                    <li className="mr-2">
                        <a className="inline-block p-4 text-blue-600 bg-gray-100 rounded-md active dark:bg-gray-800 dark:text-blue-500">Deposits:</a>
                    </li>
                  </ul>
                  <p className={styles.epoch}>Epoch: {this.state.strikesDeadline[i]}</p>
                  <button className='mt-5 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'>
                    <a href={"/"+item}>Manage</a>
                  </button>
                </a>
              )
            } )}
  
          </div>
        </main>
        
        <footer className={styles.footer}>
          <a
            href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by{' '}
            <span className={styles.logo}>
              <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
            </span>
          </a>
        </footer>
      </div>
    )
  }
  
}
