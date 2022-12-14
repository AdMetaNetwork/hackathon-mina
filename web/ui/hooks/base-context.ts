
import { createContext } from 'react'
import {
  Mina,
  PublicKey,
  PrivateKey,
  AccountUpdate,
  isReady,
} from 'snarkyjs';

interface BaseData {
  address?: PublicKey,
  setAddress?: (v: PublicKey) => void,
}

export const initialState: BaseData = {}



const BaseCtx = createContext(initialState);

export default BaseCtx;
