import {
  fetchAccount,
  PublicKey,
  PrivateKey,
  Field,
  Bool,
  Signature,
} from 'snarkyjs';

import { MerkleWitness8 } from 'experimental-zkapp-offchain-storage';

import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from './zk-worker';

export default class ZkWorkerClient {
  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL('./zk-worker.ts', import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }

  loadSnarkyJS() {
    return this._call('loadSnarkyJS', {});
  }

  setActiveInstanceToBerkeley() {
    return this._call('setActiveInstanceToBerkeley', {});
  }

  loadContract() {
    return this._call('loadContract', {});
  }

  compileContract() {
    return this._call('compileContract', {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call('fetchAccount', {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call('initZkappInstance', {
      publicKey58: publicKey.toBase58(),
    });
  }

  async getTagList(): Promise<Field> {
    const result = await this._call('getTagList', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getWhiteList(): Promise<Field> {
    const result = await this._call('getWhiteList', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getTreeRoot(): Promise<Field> {
    const result = await this._call('getTreeRoot', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  createDeployContract(zkAppPrivateKey: PrivateKey) {
    return this._call('createDeployContract', { zkAppPrivateKey });
  }

  createUpdateTagListTransaction(tagList: Field, signature: Signature, publicKey: PublicKey) {
    return this._call('createUpdateTagListTransaction', { tagList, signature, publicKey });
  }

  createUpdateWhiteListTransaction() {
    return this._call('createUpdateWhiteListTransaction', {});
  }

  createUpdateTreeRootTransaction(
    leafIsEmpty: Bool,
    oldInfo: Field,
    info: Field,
    path: MerkleWitness8,
    storedNewRootNumber: Field,
    storedNewRootSignature: Signature
  ) {
    console.log(leafIsEmpty)
    return this._call('createUpdateTreeRootTransaction', {
      leafIsEmpty,
      oldInfo,
      info,
      path,
      storedNewRootNumber,
      storedNewRootSignature,
    });
  }

  createInitStateTransaction(
    storageServerPublicKey: PublicKey,
    tagList: Field,
    whiteList: Field
  ) {
    console.log(storageServerPublicKey, tagList, '000098');
    return this._call('createInitStateTransaction', {
      storageServerPublicKey,
      tagList,
      whiteList,
    });
  }

  proveUpdateTransaction() {
    return this._call('proveUpdateTransaction', {});
  }

  async getTransactionJSON() {
    const result = await this._call('getTransactionJSON', {});
    return result;
  }
}
