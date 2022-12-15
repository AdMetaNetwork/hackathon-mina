import { FC, useContext, useState } from 'react'
import BaseCtx from '../../hooks/base-context';
import {
  Mina,
  PublicKey,
  PrivateKey,
  AccountUpdate,
  isReady,
  Field,
  Poseidon,
  Bool,
  Signature
} from 'snarkyjs';
import Messager from "../../utils/messager";
import { message, Spin } from 'antd';
import * as U from '../../utils'
import axios from 'axios'
import {
  OffChainStorage,
  MerkleWitness8,
} from 'experimental-zkapp-offchain-storage';
// import XMLHttpRequestTs from 'xmlhttprequest-ts';

const transactionFee = 0.1;

const Home: FC = () => {

  const { address, setAddress } = useContext(BaseCtx)
  const [soul, setSoul] = useState<any>([])
  const [spinning, setSpinning] = useState<boolean>(false)
  const [zkWorkerClient, setZkWorkerClient] = useState(null as null | U.ZkWorkerClient)
  const [useLocal, setUseLocal] = useState<boolean>(true)

  const getTag = async () => {
    let { data } = await axios.get(`${U.API}/score/check/${address?.toBase58()}`)
    if (!data.length) {
      return
    }
    const arr: any[] = []
    Object.keys(data[0]).forEach((key) => {
      if (key !== 'address' && key !== 'id') {
        arr.push({ name: key, score: data[0][key] })
      }
    })

    arr.sort((a, b) => {
      return b.score - a.score;
    })

    setSoul([...arr])

  }

  const loadLocalMina = async () => {
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const deployerAccount = Local.testAccounts[0].privateKey;

    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();

    const { Analysis } = await import('../../../contracts/build/src/Analysis.js');
    const contract = new Analysis(zkAppAddress);
    const deployTxn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      contract.deploy({ zkappKey: zkAppPrivateKey });
      contract.sign(zkAppPrivateKey);
    });
    await deployTxn.send();
    const tagList = await contract.tagList.get();
    console.log('state after init:', tagList.toString(), tagList);
    setSpinning(false)
  }

  const loadBerkeleyMina = async (address: PublicKey) => {
    const zkWorkerClient = new U.ZkWorkerClient();
    console.log('Loading SnarkyJS...');
    await zkWorkerClient.loadSnarkyJS();
    console.log('done');

    await zkWorkerClient.setActiveInstanceToBerkeley();

    const mina = (window as any).mina;
    if (!mina) {
      console.log('Please install mina extension!')
      return
    }

    console.log('using key', address);

    console.log('checking if account exists...', address);
    await zkWorkerClient.fetchAccount({ publicKey: address! });


    await zkWorkerClient.loadContract();

    console.log('compiling zkApp');
    await zkWorkerClient.compileContract();
    console.log('zkApp compiled');

    const zkappPublicKey = PublicKey.fromBase58('B62qjNhg958yqDDjznuZKHxFthfQKf1Jo15d6MtEswHp7iQBiThhccm');

    await zkWorkerClient.initZkappInstance(zkappPublicKey);
    await zkWorkerClient.fetchAccount({ publicKey: zkappPublicKey })


    setZkWorkerClient(zkWorkerClient)
    const tagList = await zkWorkerClient.getTagList();
    console.log('state after init:', tagList.toString(), tagList);
    setSpinning(false)
  }

  const loadMina = async (address: PublicKey) => {
    await isReady;
    if (useLocal) {
      loadLocalMina()
    } else {
      loadBerkeleyMina(address)
    }

  }

  const initState = async () => {
    const storageServerAddress = 'http://localhost:3030';
    const XMLHttpRequestTs = await import('xmlhttprequest-ts')
    const NodeXMLHttpRequest = XMLHttpRequestTs.XMLHttpRequest as any as typeof XMLHttpRequest;
    const serverPublicKey = await OffChainStorage.getPublicKey(
      storageServerAddress,
      NodeXMLHttpRequest
    )

    console.log('sending a transaction...', serverPublicKey.toBase58());

    await zkWorkerClient!.fetchAccount({ publicKey: address! });

    await zkWorkerClient!.createInitStateTransaction(serverPublicKey, Field('99'), Field('22'));

    console.log('creating proof...');
    await zkWorkerClient!.proveUpdateTransaction();

    console.log('getting Transaction JSON...');
    const transactionJSON = await zkWorkerClient!.getTransactionJSON()

    console.log('requesting send transaction...', transactionJSON);
    try {
      const { hash } = await (window as any).mina.sendTransaction({
        transaction: transactionJSON,
        feePayer: {
          fee: transactionFee,
          memo: '',
        },
      });

      console.log(
        'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
      );


    } catch (error) {
      console.log(error)
    }
  }

  const updateMerkeTreeBerkeley = async () => {
    const storageServerAddress = 'http://localhost:3030';
    const XMLHttpRequestTs = await import('xmlhttprequest-ts')
    const NodeXMLHttpRequest = XMLHttpRequestTs.XMLHttpRequest as any as typeof XMLHttpRequest;
    const serverPublicKey = await OffChainStorage.getPublicKey(
      storageServerAddress,
      NodeXMLHttpRequest
    )

    let { data } = await axios.get(`${U.API}/score/check/${address?.toBase58()}`)
    if (!data.length) {
      return
    }

    const arr: any[] = []
    Object.keys(data[0]).forEach((key) => {
      if (key !== 'address' && key !== 'id') {
        arr.push({ name: key, score: data[0][key] })
      }
    })

    arr.sort((a, b) => {
      return b.score - a.score;
    })

    const flag: any = {
      DeFi: 101,
      GameFi: 102,
      Metaverse: 103,
      NFT: 104,
      OnChainData: 105,
    }

    let a = ''
    arr.forEach((item, index) => {
      if (index <= 2) {
        a += flag[item.name]
      }
    })
    let d = `${data[0].id}${a}`

    const index = BigInt(data[0].id)
    console.log(index)
    const treeRoot = await zkWorkerClient!.getTreeRoot();
    console.log('treeRoot', treeRoot.toString())
    const treeHeight = 8;
    const pub = PrivateKey.fromBase58(
      'EKDjbx8B4upP8q2d5T8wZQaeMqi9SrDELfhPZcpe9JHAcdDwoBvB'
    ).toPublicKey();

    const idx2fields = await OffChainStorage.get(
      storageServerAddress,
      pub,
      treeHeight,
      treeRoot,
      NodeXMLHttpRequest
    );

    const tree = OffChainStorage.mapToTree(treeHeight, idx2fields);
    // return
    const leafWitness = new MerkleWitness8(tree.getWitness(index));

    const priorLeafIsEmpty = !idx2fields.has(index);
    console.log(priorLeafIsEmpty, 'priorLeafIsEmpty--->>>>');
    let priorLeafNumber: Field;
    let newLeafNumber: Field;
    if (!priorLeafIsEmpty) {
      priorLeafNumber = idx2fields.get(index)![0];
      newLeafNumber = Field(d);
    } else {
      priorLeafNumber = Field(0);
      newLeafNumber = Field(1);
    }

    idx2fields.set(index, [newLeafNumber]);

    const [storedNewStorageNumber, storedNewStorageSignature] =
      await OffChainStorage.requestStore(
        storageServerAddress,
        pub,
        treeHeight,
        idx2fields,
        NodeXMLHttpRequest
      );

    console.log('sending a transaction...', storedNewStorageNumber.toString());
    console.log(tree.getRoot().toString(), 'sss--99')

    console.log('fetch account...');

    await zkWorkerClient!.fetchAccount({ publicKey: address! });

    /* Update the root of the merkle tree, the local test is ok, but the deployment contract test reports an   error [A.isConstant is not a function]
    */
    await zkWorkerClient!.createUpdateTreeRootTransaction(
      Bool(!priorLeafIsEmpty),
      priorLeafNumber,
      newLeafNumber,
      leafWitness,
      storedNewStorageNumber,
      storedNewStorageSignature
    );

    console.log('creating proof...');
    await zkWorkerClient!.proveUpdateTransaction();

    console.log('getting Transaction JSON...');
    const transactionJSON = await zkWorkerClient!.getTransactionJSON()

    console.log('requesting send transaction...', transactionJSON);
    try {
      const { hash } = await (window as any).mina.sendTransaction({
        transaction: transactionJSON,
        feePayer: {
          fee: transactionFee,
          memo: '',
        },
      });

      console.log(
        'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
      );


    } catch (error) {
      console.log(error)
    }
  }

  const updateMerkeTreeLocal = async () => {
    await isReady;
    const storageServerAddress = 'http://localhost:3030';
    const XMLHttpRequestTs = await import('xmlhttprequest-ts')
    const NodeXMLHttpRequest = XMLHttpRequestTs.XMLHttpRequest as any as typeof XMLHttpRequest;
    const serverPublicKey = await OffChainStorage.getPublicKey(
      storageServerAddress,
      NodeXMLHttpRequest
    )

    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const deployerAccount = Local.testAccounts[0].privateKey;

    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();
    const { Analysis } = await import('../../../contracts/build/src/Analysis.js');
    const contract = new Analysis(zkAppAddress);

    // deploy
    const deployTxn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      contract.deploy({ zkappKey: zkAppPrivateKey });
      contract.initState(serverPublicKey, Field('99'), Field('22'))
      contract.sign(zkAppPrivateKey);
    });
    await deployTxn.send();

    let { data } = await axios.get(`${U.API}/score/check/${address?.toBase58()}`)
    if (!data.length) {
      return
    }

    const arr: any[] = []
    Object.keys(data[0]).forEach((key) => {
      if (key !== 'address' && key !== 'id') {
        arr.push({ name: key, score: data[0][key] })
      }
    })

    arr.sort((a, b) => {
      return b.score - a.score;
    })

    const index = BigInt(data[0].id)

    const treeRoot = await contract.storageTreeRoot.get();
    const treeHeight = 8;
    const pub = PrivateKey.fromBase58(
      'EKDjbx8B4upP8q2d5T8wZQaeMqi9SrDELfhPZcpe9JHAcdDwoBvB'
    ).toPublicKey();

    console.log(index)
    console.log('treeRoot', treeRoot.toString())

    const idx2fields = await OffChainStorage.get(
      storageServerAddress,
      pub,
      treeHeight,
      treeRoot,
      NodeXMLHttpRequest
    );

    const tree = OffChainStorage.mapToTree(treeHeight, idx2fields);
    // return
    const flag: any = {
      DeFi: 101,
      GameFi: 102,
      Metaverse: 103,
      NFT: 104,
      OnChainData: 105,
    }

    let a = ''
    arr.forEach((item, index) => {
      if (index <= 2) {
        a += flag[item.name]
      }
    })
    let d = `${data[0].id}${a}`

    const leafWitness = new MerkleWitness8(tree.getWitness(index));
    const priorLeafIsEmpty = !idx2fields.has(index);
    console.log(priorLeafIsEmpty, 'priorLeafIsEmpty--->>>>');
    let priorLeafNumber: Field;
    let newLeafNumber: Field;
    if (!priorLeafIsEmpty) {
      priorLeafNumber = idx2fields.get(index)![0];
      newLeafNumber = Field(d);
    } else {
      priorLeafNumber = Field(0);
      newLeafNumber = Field(1);
    }

    idx2fields.set(index, [newLeafNumber]);

    const [storedNewStorageNumber, storedNewStorageSignature] =
      await OffChainStorage.requestStore(
        storageServerAddress,
        pub,
        treeHeight,
        idx2fields,
        NodeXMLHttpRequest
      );

    console.log('sending a transaction...', storedNewStorageNumber.toString());
    console.log(tree.getRoot().toString(), 'sss--99')

    console.log('fetch account...');

    const txn2 = await Mina.transaction(deployerAccount, () => {
      contract.updataMerkleRoot(
        Bool(priorLeafIsEmpty),
        priorLeafNumber,
        newLeafNumber,
        leafWitness,
        storedNewStorageNumber,
        storedNewStorageSignature
      );
      contract.sign(zkAppPrivateKey);
    });
    await txn2.send();

    const u = contract.storageTreeRoot.get();
    console.log('state after storageTreeRoot:', u.toString());
  }


  return (
    <Spin tip="Load Mina..." size="large" spinning={spinning}>
      <div className='pl-8 pr-8'>
        <div className='mb-10 mt-10'>
          <div
            className='text-white text-xl font-medium mb-4'
            onClick={() => {
              updateMerkeTreeLocal()
            }}
          >Introduction:</div>
          <div className='text-white text-base'>In the Web3 world, advertising is also a very important part. Admeta is an advertising platform that focuses on Web3. Through this project, after the user authorizes the browser to access the white list, we endow the user with a soul label by analyzing the user&apos;s behavior , with this label, users can be accurately placed with advertisements and get rewards after completing the advertisements.</div>
        </div>
        <div className='mb-10'>
          <div className='text-white text-xl font-medium mb-4'>Use Mina:</div>
          <div className='text-white text-base'>
            For user privacy data, we use Mina&apos;s zero-knowledge proof to achieve the purpose of safely protecting user data.
          </div>
        </div>
        <div className='mb-20'>
          <div className='text-white text-xl font-medium mb-4'>Case Explanation:</div>
          <div className='text-white text-base'>
            1. When a user visits a domain name in the whitelist, such as uniswap.com, we provide Chrome Extension for analysis and label the user as SWAP.{<br />}
            2. Every certain period, such as once a day, analyze data, and count the top three tags of user behavior as soul behavior.{<br />}
            3. Accurately place advertisements through the user&apos;s soul behavior.
          </div>
        </div>
        <div className='flex justify-center items-center flex-col'>
          {
            address
              ?
              <div
                className='pl-6 pr-6 pt-2 pb-2 bg-blue-900 text-white text-base font-semibold rounded mb-10 cursor-pointer hover:bg-blue-800'
                onClick={() => {
                  getTag()
                }}
              >Get/Update Your Soul Web3 Behavior</div>
              :
              <div
                className='pl-6 pr-6 pt-2 pb-2 bg-blue-900 text-white text-base font-semibold rounded mb-10 cursor-pointer hover:bg-blue-800'
                onClick={async () => {
                  // await isReady;
                  const mina = (window as any).mina;
                  if (!mina) {
                    message.error('Please install mina wallet extension!').then(() => {
                      window.open('https://www.aurowallet.com/', '_target')
                    })
                    return
                  }

                  const publicKeyBase58: string = (await mina.requestAccounts())[0];
                  const publicKey = PublicKey.fromBase58(publicKeyBase58);
                  setAddress!(publicKey)
                  Messager.sendMessageToContent(U.HACKATHON_ADMETA_MSG_ACCOUNT, { address: publicKey.toBase58() })
                  setSpinning(true)
                  loadMina(publicKey)
                }}
              >Connect wallet</div>
          }
          {
            address
            &&
            <>
              <div className='text-white text-xl font-medium mb-4'>Your Soul Web3 Labels</div>
              <div className='flex justify-center items-center'>
                {
                  soul.map((item: any, index: number) => {
                    if (index <= 2) {
                      return (<div
                        className='text-white pl-4 pr-4 pt-1 pb-1 bg-blue-900 text-white text-sm rounded mr-4'
                        key={index}
                      >{item.name}</div>)
                    }
                  })
                }
              </div>
            </>
          }

        </div>
      </div>
    </Spin>
  )
}

export default Home;