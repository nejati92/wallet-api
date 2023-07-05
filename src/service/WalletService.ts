import * as ethereumjs from "ethereumjs-wallet";
import * as bip39 from "bip39";
import { WalletDb } from "../db/walletDb";
import { SecretsManager } from "aws-sdk";
import { Wallet } from "../types/types";

export const createWallet = async (userId: string, walletDbClient: WalletDb): Promise<Wallet[]> => {
  let index = await walletDbClient.getWalletIndex(userId);
  if (!index && index !== 0) {
    const mnemonic = bip39.generateMnemonic(128);
    await new SecretsManager().createSecret({ Name: userId, SecretString: mnemonic }).promise();
    return saveAndGetAllWallets(userId, mnemonic, walletDbClient);
  }
  index = index + 1;
  const secret = await new SecretsManager().getSecretValue({ SecretId: userId }).promise();
  if (!secret.SecretString) throw new Error("Failed to create wallet");
  const mnemonic = secret.SecretString;
  return saveAndGetAllWallets(userId, mnemonic, walletDbClient, index);
};

export const saveAndGetAllWallets = async (userId: string, mnemonic: string, walletDbClient: WalletDb, index = 0) => {
  const { address, privateKey } = await getWalletDetails(mnemonic, index);
  await new SecretsManager().createSecret({ Name: userId + address, SecretString: privateKey }).promise();
  await walletDbClient.saveWallet(userId, address, index);
  const wallets = await getWallets(userId, walletDbClient);
  if (!wallets || wallets?.length === 0) {
    throw new Error("Failed to retrieve wallets");
  }
  return wallets;
};

export const getWallets = async (userId: string, walletDbClient: WalletDb): Promise<Wallet[]> => {
  const wallets = await walletDbClient.getWallets(userId);
  return wallets;
};

export const recoverWallet = async (mnemonic: string, userId: string, walletDbClient: WalletDb) => {
  await new SecretsManager().createSecret({ Name: userId, SecretString: mnemonic }).promise();
  const { address, privateKey } = await getWalletDetails(mnemonic);
  await new SecretsManager().createSecret({ Name: userId + address, SecretString: privateKey }).promise();
  await walletDbClient.saveWallet(userId, address, 0);
  return { address };
};

export const getWalletDetails = async (mnemonic: string, index = 0) => {
  const walletPath = "m/44'/60'/0'/0/" + index.toString();
  console.log(`index:${index}`);
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const hdWallet = ethereumjs.hdkey.fromMasterSeed(seed);
  const wallet = hdWallet.derivePath(walletPath).getWallet();
  const address = wallet.getChecksumAddressString();
  const privateKey = wallet.getPrivateKeyString();
  const publicKey = wallet.getPublicKeyString();
  return { mnemonic, address, privateKey, publicKey };
};
