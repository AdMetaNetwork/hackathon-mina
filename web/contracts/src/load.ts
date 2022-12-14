import { Analysis } from './Analysis';

import {
  isReady,
  Mina,
  PrivateKey,
  AccountUpdate,
  shutdown,
  Signature,
  Field,
  MerkleTree,
  MerkleWitness,
  Poseidon,
  Bool,
  Encoding,
} from 'snarkyjs';
import {
  OffChainStorage,
  MerkleWitness8,
} from 'experimental-zkapp-offchain-storage';
import XMLHttpRequestTs from 'xmlhttprequest-ts';

(async function main() {
  await isReady;
  // generate account
  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  const deployerAccount = Local.testAccounts[0].privateKey;

  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();

  const storageServerAddress = 'http://localhost:3001';
  const NodeXMLHttpRequest =
    XMLHttpRequestTs.XMLHttpRequest as any as typeof XMLHttpRequest;
  const serverPublicKey = await OffChainStorage.getPublicKey(
    storageServerAddress,
    NodeXMLHttpRequest
  );

  const tagList = Poseidon.hash([Field('101'), Field('102')]);
  const whiteList = Poseidon.hash([Field('201'), Field('202')]);

  const contract = new Analysis(zkAppAddress);
  // deploy
  const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    contract.deploy({ zkappKey: zkAppPrivateKey });
    contract.initState(serverPublicKey, tagList, whiteList);
    contract.sign(zkAppPrivateKey);
  });
  await deployTxn.send();
  const w = contract.whiteList.get();
  console.log('state after init:', w.toString(), w);

  const newList = Poseidon.hash([Field(101), Field(102), Field(103)]);
  const signature = Signature.create(zkAppPrivateKey, newList.toFields());

  const txn1 = await Mina.transaction(deployerAccount, () => {
    contract.updateTagList(newList, signature, zkAppPrivateKey.toPublicKey());
    contract.sign(zkAppPrivateKey);
  });
  await txn1.send();

  const t = contract.tagList.get();
  console.log('state after txn1: taglist', t.toString());

  // update merkle tree
  const index = 5n;
  const treeRoot1 = await contract.storageTreeRoot.get();
  const treeHeight = 8;
  const pub = PrivateKey.fromBase58(
    'EKDjbx8B4upP8q2d5T8wZQaeMqi9SrDELfhPZcpe9JHAcdDwoBvB'
  ).toPublicKey();
  const idx2fields = await OffChainStorage.get(
    storageServerAddress,
    pub,
    treeHeight,
    treeRoot1,
    NodeXMLHttpRequest
  );

  const tree1 = OffChainStorage.mapToTree(treeHeight, idx2fields);
  const leafWitness = new MerkleWitness8(tree1.getWitness(BigInt(index)));

  const priorLeafIsEmpty = !idx2fields.has(index);
  console.log(priorLeafIsEmpty, 'priorLeafIsEmpty--->>>>');
  let priorLeafNumber: Field;
  let newLeafNumber: Field;
  if (!priorLeafIsEmpty) {
    priorLeafNumber = idx2fields.get(index)![0];
    newLeafNumber = Field(9);
  } else {
    priorLeafNumber = Field(9);
    newLeafNumber = Field('234');
  }


  // update the leaf, and save it in the storage server
  try {
    idx2fields.set(index, Field('234').toFields());
  } catch (error) {
    console.log(error, 'ssss---ooo');
  }

  const [storedNewStorageNumber, storedNewStorageSignature] =
    await OffChainStorage.requestStore(
      storageServerAddress,
      pub,
      treeHeight,
      idx2fields,
      NodeXMLHttpRequest
    );

  console.log(
    'changing index',
    index,
    'from',
    priorLeafNumber.toString(),
    'to',
    newLeafNumber.toString()
  );

  // update the smart contract

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
  console.log('state after txn1:', u.toString(), '---%---', treeRoot1.toString());

  shutdown();
})();
