import ReactDOM from 'react-dom';
import { FC, useEffect, useState } from "react";
import browser from 'webextension-polyfill'
import Header from '../components/header';
import Protocol from '../components/protocol';
import Dashboard from '../components/dashboard';

import './style.css'

const Popup: FC = () => {
  const [agreeProtocol, setAgreeProtocol] = useState(true)
  const [address, setAddress] = useState('')

  useEffect(() => {
    browser.storage.local.get(['agree_protocol', 'address']).then(({ agree_protocol, address }) => {
      setAgreeProtocol(agree_protocol)
      setAddress(address)
    });
  })

  return (
    <div className='w-body-w'>
      <Header />
      {
        !agreeProtocol
        ?
        <Protocol 
          handleAgree={() => {
            setAgreeProtocol(true)
          }}
        />
        :
        <Dashboard
          address={address}
        />
      }
    </div>
  )
}

ReactDOM.render(<Popup />, document.getElementById('popup'));