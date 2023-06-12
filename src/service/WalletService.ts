import * as crypto from "crypto";
import * as ethereumjs from "ethereumjs-wallet";
import * as bip39 from "bip39";
import { DynamoDb } from "../db/dynamo";
export const createWallet = async () => {
  const mnemonic = bip39.generateMnemonic(128);
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdWallet = ethereumjs.hdkey.fromMasterSeed(seed);
  const path = "m/44'/60'/0'/0/0";
  const wallet = hdWallet.derivePath(path).getWallet();
  const address = wallet.getChecksumAddressString();
  const privateKey = wallet.getPrivateKeyString();
  const publicKey = wallet.getPublicKeyString();
  const salt = "asdoror3414"
  const digest= crypto.createHmac('sha512', mnemonic).update(salt).digest("base64")
  await new DynamoDb().saveWallet(address, digest);
  console.log(`mnemonic: ${mnemonic}`);
  console.log(`address: ${address}`);
  console.log(`privateKey: ${privateKey}`);
  console.log(`publicKey: ${publicKey}`);
  return { mnemonic, address, privateKey, publicKey };
};
