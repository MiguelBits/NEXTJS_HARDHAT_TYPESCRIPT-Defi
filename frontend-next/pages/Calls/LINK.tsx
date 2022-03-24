import React from 'react';
import { toast } from 'react-toastify';
import TopBar from '../../components/TopBar';

declare let window: any

class LINK extends React.Component {
    state = {
        
    }
    
    componentDidMount = () => {
        toast.configure()
        
    };
    render() {
      return (
        <div>
            <TopBar></TopBar>
            <div className=''>
                Hello
            </div>
        </div>

      );
    }
}

export default LINK;