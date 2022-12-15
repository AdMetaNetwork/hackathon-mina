import { FC } from "react";
import BaseButton from "../ui/base-button";
import browser from 'webextension-polyfill'
import * as U from '../../util'

interface Prop {
  handleAgree: () => void
}

const Protocol: FC<Prop> = ({ handleAgree }) => {
  return (
    <div className="w-full pl-4 pr-4">
      <div className="text-white text-lg font-thin italic mb-3">Welcome, we will collect private access data limited to
        whitelisted domains in order to analyze it, recommend
        you precise ads, and make you rewarded.</div>
      <div className="mb-8">
        <div className="text-white text-lg font-light italic mb-1">The domain whitelist:</div>
        <ul className="list-inside">
          {
            U.WHITE_LIST.products.map((item, index) => (
              <li key={index} className="text-white text-base font-thin italic">{item.domain}</li>
            ))
          }
        </ul>
      </div>
      <div className="flex justify-center mb-10">
        <BaseButton
          label="Agree"
          handleClick={() => {
            browser.storage.local.set({ agree_protocol: true }).then(() => {
              handleAgree()
            })

          }}
        />
      </div>
    </div>
  )
}

export default Protocol;