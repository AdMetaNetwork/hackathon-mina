import { FC, ReactNode, useMemo, useState, useContext } from "react";
import Head from 'next/head';
import * as U from '../../utils'
import LogoSvg from '../svg/logo'
import BaseCtx from '../../hooks/base-context';
import Jazzicon from 'react-jazzicon'
import {
  PublicKey
} from 'snarkyjs'

interface Props {
  tdk: U.TDK,
  children: ReactNode
}

const Base: FC<Props> = ({ tdk, children }) => {
  const [address, setAddress] = useState<PublicKey>()
  const generateAvator = useMemo(() => {
    return address && <Jazzicon diameter={40} seed={Math.round(Math.random() * 10000000)} />
  }, [address])

  return (
    <>
      <Head>
        <title>{tdk.title}</title>
        <meta name="keywords" content={tdk.keywords} />
        <meta name="description" content={tdk.description} />
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BaseCtx.Provider value={{ address, setAddress }}>
        <header className="h-20 bg-black sticky inset-x-0 top-0 flex justify-between items-center pl-8 pr-8">
          <div className="flex">
            <LogoSvg />
            <div className="text-white font-semibold text-2xl ml-8">Admeta & Mina zero-knowledge proof</div>
          </div>
          <div className="flex justify-center items-center">
            {
              address
              &&
              <div className="flex items-center">
                {generateAvator}
                <div className="text-white font-semibold text-base ml-4">{U.formatAddress(address.toBase58())}</div>
              </div>
            }
          </div>
        </header>
        <main className="bg-black">
          {children}
        </main>
        <footer className="fixed inset-x-0 bottom-0 h-16 flex justify-center items-center">
          <div className="text-white">Power by AdMeta</div>
        </footer>
      </BaseCtx.Provider>
    </>
  )
}

export default Base;