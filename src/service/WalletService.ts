import * as ethereumjs from "ethereumjs-wallet";
import * as bip39 from "bip39";
import { WalletDb } from "../db/walletDb";
import { SecretsManager } from "aws-sdk";
import { Wallet } from "../types/types";
const dbClient = new WalletDb();
export const createWallet = async (userId: string): Promise<Wallet[] | undefined> => {
  let index = await dbClient.getWalletIndex(userId);
  console.log(index);
  if (!index && index !== 0) {
    const mnemonic = bip39.generateMnemonic(128);
    await new SecretsManager().createSecret({ Name: userId, SecretString: mnemonic }).promise();
    return saveAndGetAllWallets(userId, mnemonic);
  }
  index = index + 1;
  const secret = await new SecretsManager().getSecretValue({ SecretId: userId }).promise();
  if (!secret.SecretString) throw new Error("Failed to create wallet");
  const mnemonic = secret.SecretString;
  return saveAndGetAllWallets(userId, mnemonic, index);
};

export const saveAndGetAllWallets = async (userId: string, mnemonic: string, index = 0) => {
  const { address, privateKey } = await getWalletDetails(mnemonic, index);
  await new SecretsManager().createSecret({ Name: userId + address, SecretString: privateKey }).promise();
  await dbClient.saveWallet(userId, address, index);
  const response = await dbClient.getWallets(userId);
  return response;
};

export const getWallets = async (userId: string): Promise<Wallet[] | undefined> => {
  const response = await dbClient.getWallets(userId);
  return response;
};

export const recoverWallet = async (mnemonic: string, userId: string) => {
  await new SecretsManager().createSecret({ Name: userId, SecretString: mnemonic }).promise();
  const { address, privateKey } = await getWalletDetails(mnemonic);
  await new SecretsManager().createSecret({ Name: userId + address, SecretString: privateKey }).promise();
  await dbClient.saveWallet(userId, address, 0);
  return { address };
};

export const getWalletDetails = async (mnemonic: string, index = 0) => {
  const wallletPath = "m/44'/60'/0'/0/" + index.toString();
  console.log(`index:${index}`);
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdWallet = ethereumjs.hdkey.fromMasterSeed(seed);
  const wallet = hdWallet.derivePath(wallletPath).getWallet();
  const address = wallet.getChecksumAddressString();
  const privateKey = wallet.getPrivateKeyString();
  const publicKey = wallet.getPublicKeyString();
  return { mnemonic, address, privateKey, publicKey };
};
