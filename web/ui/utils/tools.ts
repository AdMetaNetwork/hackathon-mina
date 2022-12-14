import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  fetchAccount,
} from 'snarkyjs';

export const formatAddress = (address: string): string => {
  const str_1 = address.substring(0, 4);
  const str_2 = address.substring(address.length - 4);
  return `${str_1}......${str_2}`;
};

interface ToString {
  toString: () => string;
}

type FetchedAccountResponse = Awaited<ReturnType<typeof fetchAccount>>
type FetchedAccount =  NonNullable<FetchedAccountResponse["account"]>

export const makeAndSendTransaction = async <State extends ToString>({
  feePayerPrivateKey,
  zkAppPublicKey,
  mutateZkApp,
  transactionFee,
  getState,
  statesEqual,
}: {
  feePayerPrivateKey: PrivateKey;
  zkAppPublicKey: PublicKey;
  mutateZkApp: () => void;
  transactionFee: number;
  getState: () => State;
  statesEqual: (state1: State, state2: State) => boolean;
}) => {
  const initialState = getState();

  // Why this line? It increments internal feePayer account variables, such as
  // nonce, necessary for successfully sending a transaction
  // await fetchAccount({ publicKey: feePayerPrivateKey.toPublicKey() });

  let transaction = await Mina.transaction(
    { feePayerKey: feePayerPrivateKey, fee: transactionFee },
    () => {
      mutateZkApp();
    }
  );

  // fill in the proof - this can take a while...
  console.log('Creating an execution proof...');
  const time0 = Date.now();
  await transaction.prove();
  const time1 = Date.now();
  console.log('creating proof took', (time1 - time0) / 1e3, 'seconds');
  console.log('Sending the transaction...');
  const res = await transaction.send();
  const hash = await res.hash(); // This will change in a future version of SnarkyJS
  if (hash == null) {
    console.log('error sending transaction (see above)');
  } else {
    console.log(
      'See transaction at',
      'https://berkeley.minaexplorer.com/transaction/' + hash
    );
  }

  let state = getState();

  let stateChanged = false;
  while (!stateChanged) {
    console.log(
      'waiting for zkApp state to change... (current state: ',
      state.toString() + ')'
    );
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await fetchAccount({ publicKey: zkAppPublicKey });
    state = await getState();
    stateChanged = !statesEqual(initialState, state);
  }
};
