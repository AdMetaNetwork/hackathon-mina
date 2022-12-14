import {
  Mina,
  isReady,
  PublicKey,
  Field,
  fetchAccount,
  Signature,
  Bool,
  PrivateKey,
} from 'snarkyjs';
import { MerkleWitness8 } from 'experimental-zkapp-offchain-storage';

import type { Analysis } from '../../contracts/src/Analysis';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

const state = {
  Analysis: null as null | typeof Analysis,
  zkapp: null as null | Analysis,
  transaction: null as null | Transaction,
};

const functions = {
  loadSnarkyJS: async (args: {}) => {
    await isReady;
  },
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      'https://proxy.berkeley.minaexplorer.com/graphql'
    );
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { Analysis } = await import('../../contracts/build/src/Analysis.js');
    state.Analysis = Analysis;
  },
  compileContract: async (args: {}) => {
    await state.Analysis!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  createDeployContract: async (args: { zkAppPrivateKey: PrivateKey }) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.deploy({ zkappKey: args.zkAppPrivateKey });
    });
    state.transaction = transaction;
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.Analysis!(publicKey);
  },
  proveUpdateTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
  getTagList: async (args: {}) => {
    const tagList = await state.zkapp!.tagList.get();
    return JSON.stringify(tagList.toJSON());
  },
  getWhiteList: async (args: {}) => {
    const whiteList = await state.zkapp!.whiteList.get();
    return JSON.stringify(whiteList.toJSON());
  },
  createUpdateTagListTransaction: async (args: {
    tagList: Field;
    signature: Signature;
    publicKey: PublicKey;
  }) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.updateTagList(args.tagList, args.signature, args.publicKey);
    });
    state.transaction = transaction;
  },
  createUpdateWhiteListTransaction: async (args: {
    newList: Field;
    signature: Signature;
    publicKey: PublicKey;
  }) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.updateWhiteList(
        args.newList,
        args.signature,
        args.publicKey
      );
    });
    state.transaction = transaction;
  },
  getTreeRoot: async (args: {}) => {
    const treeRoot = await state.zkapp!.storageTreeRoot.get();
    return JSON.stringify(treeRoot.toJSON());
  },
  createUpdateTreeRootTransaction: async (args: {
    leafIsEmpty: Bool;
    oldInfo: Field;
    info: Field;
    path: MerkleWitness8;
    storedNewRootNumber: Field;
    storedNewRootSignature: Signature;
  }) => {
    console.log(args);
    const transaction = await Mina.transaction(() => {
      state.zkapp!.updataMerkleRoot(
        args.leafIsEmpty,
        args.oldInfo,
        args.info,
        args.path,
        args.storedNewRootNumber,
        args.storedNewRootSignature
      );
    });
    state.transaction = transaction;
  },
  createInitStateTransaction: async (args: {
    storageServerPublicKey: PublicKey;
    tagList: Field;
    whiteList: Field;
  }) => {
    console.log(args);
    const transaction = await Mina.transaction(() => {
      state.zkapp!.initState(
        args.storageServerPublicKey,
        args.tagList,
        args.whiteList
      );
    });
    state.transaction = transaction;
  },
};

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};
if (process.browser) {
  addEventListener(
    'message',
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}
