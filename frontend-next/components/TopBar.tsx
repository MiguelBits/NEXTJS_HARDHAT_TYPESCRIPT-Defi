import React from 'react';
import { toast } from 'react-toastify';
import styles from '../styles/Home.module.css'
import { ethers } from 'ethers';
import {tokenAddress, token2Address, tokenABI, factoryAddress, factoryABI, erc20ABI} from "./../pages/contracts_abi"
import { FaEthereum } from "react-icons/fa";

declare let window: any

export default class TopBar extends React.Component {
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
    }
    
    componentDidMount = () => {
        toast.configure()
        this.checkWalletIsConnected()
        this.balanceToken()
        this.priceToken()
        
    };
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
            toast.warning("Make sure you have Metamask installed!");
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
    render() {
      return (
        <div>
            
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
            <button onClick={this.connectWalletHandler} className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800">
              <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">Connect Wallet</span>
            </button>
          </div>

          <div className={styles.home_icon}>
            <a href="/App" className='font-black dark:text-white'>Home</a>
          </div>
        </div>

      );
    }
}
