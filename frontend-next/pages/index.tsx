import React from 'react';
import TopBar from '../components/TopBar';

declare let window: any

class ConnectWallet extends React.Component {

    componentDidMount = () => {

    };

    render() {
      return (
        <div id="home-page">
            <TopBar></TopBar>
            <a href="/App">Go to App</a>
        </div>

      );
    }
}

export default ConnectWallet;