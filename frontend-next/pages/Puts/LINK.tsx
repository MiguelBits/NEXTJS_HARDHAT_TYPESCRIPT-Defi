import React from 'react';
import { toast } from 'react-toastify';

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
            <div className=''>
                Hello
            </div>
        </div>

      );
    }
}

export default LINK;