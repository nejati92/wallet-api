import * as ethereumjs from "ethereumjs-wallet";
import * as bip39 from "bip39";
import { WalletDb } from "../db/walletDb";
import { SecretsManager } from "aws-sdk";
import { Wallet } from "../types/types";
const dbClient = new WalletDb();
export const createWallet = async (userId: string): Promise<Wallet[] | undefined> => {
  const { path, mnemonic } = await dbClient.getWalletPath(userId);
  if (!path) {
    const mnemonic = bip39.generateMnemonic(128);
    const { address, path, privateKey } = await getWalletDetails(mnemonic);
    await new SecretsManager().createSecret({ Name: address, SecretString: privateKey }).promise();
    await dbClient.saveWallet(userId, address, path, mnemonic);
    const response = await dbClient.getWallets(userId);
    return response;
  }
  const index = parseInt(path.substring(15, path.length), 0);
  const newpath = path.substring(0, 15) + `${index + 1}`;
  const { address, privateKey } = await getWalletDetails(mnemonic, newpath);
  await new SecretsManager().createSecret({ Name: address, SecretString: privateKey }).promise();
  await dbClient.saveWallet(userId, address, newpath, mnemonic);
  const response = await dbClient.getWallets(userId);

  return response;
};

export const getWallets = async (userId: string): Promise<Wallet[] | undefined> => {
  const response = await dbClient.getWallets(userId);
  return response;
};

export const recoverWallet = async (mnemonic: string, userId: string) => {
  const { address, privateKey, publicKey, path } = await getWalletDetails(mnemonic);
  await dbClient.saveWallet(userId, address, path, mnemonic);
  return { mnemonic, address, privateKey, publicKey };
};

export const getWalletDetails = async (mnemonic: string, path = "m/44'/60'/0'/0/0") => {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdWallet = ethereumjs.hdkey.fromMasterSeed(seed);
  const wallet = hdWallet.derivePath(path).getWallet();
  const address = wallet.getChecksumAddressString();
  const privateKey = wallet.getPrivateKeyString();
  const publicKey = wallet.getPublicKeyString();
  console.log(`mnemonic: ${mnemonic}`);
  console.log(`address: ${address}`);
  console.log(`privateKey: ${privateKey}`);
  console.log(`publicKey: ${publicKey}`);
  return { mnemonic, address, privateKey, publicKey, path };
};
