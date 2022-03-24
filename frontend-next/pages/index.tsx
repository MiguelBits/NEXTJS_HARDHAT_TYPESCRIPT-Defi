import React from 'react';
import { toast } from 'react-toastify';

declare let window: any

class ConnectWallet extends React.Component {
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
        }
    }
    
    handleNetworkSwitch = async () => {
        toast("❄ Changing to Avalanche Network")
        try {
            if (!window.ethereum) throw new Error("No crypto wallet found");
            let txn = await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [this.state.network["avalancheFuji"]]
            });
            await txn.wait();
            toast("Welcome to Avalanche Fuji Testnet")
          } catch (err) {
              toast(err)
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
    redirectToHome(){
        window.location.href='/App'
    }
    componentDidMount = () => {
        toast.configure()
        this.checkWalletIsConnected();
    };
    render() {
      return (
        <div id="home-page">
            <div className='container-wallet_defi'>
                <button onClick={this.connectWalletHandler} class='one-wallet_defi'>Trade some <b>shitcoins</b> connect your wallet</button>
                <button onClick={this.redirectToHome} class='two-wallet_defi'> Use <b>Dapp</b> here</button>
                <button onClick={this.handleNetworkSwitch} class='five-wallet_defi'>Switch to the <b>Avalanche</b> network</button>
            </div>
        </div>

      );
    }
}

export default ConnectWallet;