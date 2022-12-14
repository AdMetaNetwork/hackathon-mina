import * as U from '../util'
import browser from 'webextension-polyfill';

class ContentScript {
  constructor() {}

  listenWebPageMessages() {
    window.addEventListener("message", async function (msg) {
      U.Messenger.sendMessageToBackground(msg.data.type, msg.data.data)
    })
  }

  listenForBackgroundMessages() {
    browser.runtime.onMessage.addListener((message, sender) => {
      const { type, data } = message;
      if (type !== U.HACKATHON_ADMETA_MSG_BACK) {
        return
      }
      U.Messenger.sendMessageToWeb(type, data)
    });
  }

  init() {
    this.listenWebPageMessages()
    this.listenForBackgroundMessages()
  }
}

new ContentScript().init()