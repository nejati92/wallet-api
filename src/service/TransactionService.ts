import { Network, Alchemy, Utils, Wallet } from "alchemy-sdk";
import { getWalletDetails } from "./WalletService";
import { SQS, SecretsManager } from "aws-sdk";
import { PartialTransactionEvent, Transaction } from "../types/types";
import { TransactionDb } from "../db/transactionsDb";
const network = process.env.NETWORK as "ETH_SEPOLIA" | "ETH_MAINNET";
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network[network],
};
const alchemy = new Alchemy(settings);
export const createEthereumTransaction = async (
  amount: string,
  toAddress: string,
  fromAddress: string,
  userId: string,
) => {
  console.log(`amount: ${amount}, address:${toAddress}, fromAddress:${fromAddress}`);
  const secret = await new SecretsManager().getSecretValue({ SecretId: userId + fromAddress }).promise();
  if (!secret.SecretString) throw new Error("Failed to retrive the PK");
  const privateKey = secret.SecretString;
  const value = Utils.parseEther(amount);
  const nonce = await alchemy.core.getTransactionCount(fromAddress);
  const blockNumber = await alchemy.core.getBlockNumber();
  const gasLimit = Utils.hexValue(250000);
  const chainId = parseInt(process.env.CHAIN_ID!);
  const gasPrice = Utils.parseEther("0.0000000129"); // TODO get gas estimate
  const tx = {
    nonce,
    gasLimit,
    gasPrice,
    to: toAddress,
    value,
    chainId,
    from: fromAddress,
  };
  console.log("Sent transaction", tx);
  const rawTx = await new Wallet(privateKey).signTransaction(tx);
  const sentTranaction = await alchemy.core.sendTransaction(rawTx);
  console.log("Sent transaction", sentTranaction);
  const transaction: Transaction = {
    nonce,
    gasPrice: sentTranaction?.gasPrice?.toString() || "",
    gasLimit: sentTranaction?.gasLimit?.toString(),
    value: sentTranaction?.value.toString(),
    txHash: sentTranaction.hash,
    fromAddress,
    toAddress,
    status: "PENDING",
    blockNumber: blockNumber + 1,
  };
  await new TransactionDb().saveTransaction(fromAddress, toAddress, sentTranaction.hash,transaction);
  await new SQS()
    .sendMessage({
      QueueUrl: process.env.TRANSACTION_QUEUE_URL!,
      MessageBody: JSON.stringify(transaction),
    })
    .promise();
  return sentTranaction.hash;
};

export const monitorTransaction = async (partialTx: PartialTransactionEvent) => {
  try{
  console.log(partialTx.txHash)
  const tx = await alchemy.core.getTransaction(partialTx.txHash);
  console.log(`TX:${tx}`);
  if (tx?.confirmations && tx?.confirmations > 0 && tx?.gasPrice && tx.value && tx.from && tx.to && tx.hash) {
    const transaction: Transaction = {
      nonce: tx?.nonce,
      gasPrice: tx?.gasPrice?.toString(),
      gasLimit: tx?.gasLimit?.toString(),
      value: tx?.value.toNumber().toString(),
      txHash: tx?.hash,
      fromAddress: tx?.from,
      toAddress: tx?.to,
      status: "PROCESSED",
      blockNumber: tx?.blockNumber,
    };

    await new TransactionDb().saveTransaction(
      transaction.fromAddress,
      transaction.toAddress,
      transaction.txHash,
      transaction,
    );
    console.log("passed");
  } else {
    console.log("Failed");
    throw new Error("Bad Tx");
  }
  }catch(e){
    console.error(`Error:${e}`)
    throw e
  }
  
};
