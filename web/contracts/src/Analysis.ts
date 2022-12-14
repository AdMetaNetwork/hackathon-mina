import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  MerkleTree,
  Bool,
  DeployArgs,
  Permissions,
  Signature,
} from 'snarkyjs';
import {
  OffChainStorage,
  MerkleWitness8,
} from 'experimental-zkapp-offchain-storage';

export class Analysis extends SmartContract {
  @state(PublicKey) storageServerPublicKey = State<PublicKey>();
  @state(Field) storageTreeRoot = State<Field>();
  @state(Field) tagList = State<Field>();
  @state(Field) whiteList = State<Field>();
  @state(Field) storageNumber = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  /**
   *
   * @param storageServerPublicKey
   *
   */

  @method initState(
    storageServerPublicKey: PublicKey,
    tagList: Field,
    whiteList: Field
  ) {
    this.storageServerPublicKey.set(storageServerPublicKey);

    const emptyTreeRoot = new MerkleTree(8).getRoot();
    this.storageTreeRoot.set(emptyTreeRoot);
    this.storageNumber.set(Field(0));

    this.tagList.set(tagList);

    this.whiteList.set(whiteList);
  }

  /**
   *
   * @param newList
   * @param signature
   * @param publicKey
   */
  @method updateTagList(
    newList: Field,
    signature: Signature,
    publicKey: PublicKey
  ) {
    // when I deploy to Berkeley verify signature not work
    // const verified = signature.verify(publicKey, newList.toFields());
    // verified.assertTrue();
    console.log(signature, publicKey);
    const currentTagList = this.tagList.get();
    this.tagList.assertEquals(currentTagList);

    this.tagList.set(newList);
  }

  /**
   *
   * @param newList
   * @param signature
   * @param publicKey
   */
  @method updateWhiteList(
    newList: Field,
    signature: Signature,
    publicKey: PublicKey
  ) {
    // verify signature
    const verified = signature.verify(publicKey, newList.toFields());
    verified.assertTrue();

    const currentWhiteList = this.whiteList.get();
    this.whiteList.assertEquals(currentWhiteList);

    this.whiteList.set(newList);
  }

  // /**
  //  *
  //  * @param oldInfo
  //  * @param info
  //  * @param path
  //  * @param leafIsEmpty
  //  * @param storedNewRootNumber
  //  * @param storedNewRootSignature
  //  */
  @method updataMerkleRoot(
    leafIsEmpty: Bool,
    oldInfo: Field,
    info: Field,
    path: MerkleWitness8,
    storedNewRootNumber: Field,
    storedNewRootSignature: Signature
  ) {
    const storedRoot = this.storageTreeRoot.get();
    this.storageTreeRoot.assertEquals(storedRoot);

    let storedNumber = this.storageNumber.get();
    this.storageNumber.assertEquals(storedNumber);

    let storageServerPublicKey = this.storageServerPublicKey.get();
    this.storageServerPublicKey.assertEquals(storageServerPublicKey);

    let leaf = [oldInfo];
    let newLeaf = [info];
    // leaf[0].assertEquals(newLeaf[0]);

    const updates = [
      {
        leaf,
        leafIsEmpty,
        newLeaf,
        newLeafIsEmpty: Bool(false),
        leafWitness: path,
      },
    ];

    const storedNewRoot = OffChainStorage.assertRootUpdateValid(
      storageServerPublicKey,
      storedNumber,
      storedRoot,
      updates,
      storedNewRootNumber,
      storedNewRootSignature
    );

    this.storageTreeRoot.set(storedNewRoot);
    this.storageNumber.set(storedNewRootNumber);
  }
}
