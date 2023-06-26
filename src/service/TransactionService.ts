import { Network, Alchemy, Utils, Wallet } from "alchemy-sdk";
import { getWalletDetails } from "./WalletService";
import { SecretsManager } from "aws-sdk";

const settings = {
  apiKey: "cNcZA1o48rlzvX3zntDD4Pva_U9VSar8",
  network: Network.ETH_SEPOLIA,
};
const alchemy = new Alchemy(settings);
export const createEthereumTransaction = async (amount: string, toAddress: string, fromAddress: string, userId:string) => {
  console.log(`amount: ${amount}, address:${toAddress}, fromAddress:${fromAddress}`);
  const secret = await new SecretsManager().getSecretValue({ SecretId: userId }).promise();
  if (!secret.SecretString) throw new Error("Failed to retrive the PK");
  const privateKey = secret.SecretString;
  const value = Utils.parseEther(amount);
  const nonce = await alchemy.core.getTransactionCount(fromAddress);
  const gasLimit = Utils.hexValue(250000);
  const chainId = 11155111;
  const gasPrice = Utils.parseEther("0.0000000045");
  const tx = {
    nonce,
    gasLimit,
    gasPrice,
    to: toAddress,
    value,
    chainId,
  };
  const rawTx = await new Wallet(privateKey).signTransaction(tx);
  const sentTranaction = await alchemy.core.sendTransaction(rawTx);
  console.log("Sent transaction", sentTranaction);
  return sentTranaction.hash;
};
