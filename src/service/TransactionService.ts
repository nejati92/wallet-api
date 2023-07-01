import { Network, Alchemy, Utils, Wallet } from "alchemy-sdk";
import { getWalletDetails } from "./WalletService";
import { SQS, SecretsManager } from "aws-sdk";
import { PartialTransactionEvent, Transaction } from "../types/types";
import { TransactionDb } from "../db/transactionsDb";

const settings = {
  apiKey: "cNcZA1o48rlzvX3zntDD4Pva_U9VSar8",
  network: Network.ETH_SEPOLIA,
};
const alchemy = new Alchemy(settings);
export const createEthereumTransaction = async (
  amount: string,
  toAddress: string,
  fromAddress: string,
  userId: string,
) => {
  console.log(`amount: ${amount}, address:${toAddress}, fromAddress:${fromAddress}`);
  const secret = await new SecretsManager().getSecretValue({ SecretId: userId }).promise();
  if (!secret.SecretString) throw new Error("Failed to retrive the PK");
  const privateKey = secret.SecretString;
  const value = Utils.parseEther(amount);
  const nonce = await alchemy.core.getTransactionCount(fromAddress);
  const blockNumber = await alchemy.core.getBlockNumber();
  const gasLimit = Utils.hexValue(250000);
  const chainId = 11155111;
  const gasPrice = Utils.parseEther("0.0000000129");
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
  const transaction: Transaction = {
    nonce,
    gasPrice: sentTranaction?.gasPrice?.toString() ||"",
    gasLimit: sentTranaction?.gasLimit?.toString(),
    value: sentTranaction?.value.toNumber().toString(),
    txHash: sentTranaction.hash,
    fromAddress,
    toAddress,
    status: "PENDING",
    blockNumber: blockNumber + 1,
  };
  await new TransactionDb().saveTx(fromAddress, toAddress, transaction);
  await new SQS()
    .sendMessage({
      QueueUrl: "https://sqs.eu-west-1.amazonaws.com/781619103453/TransactionQueue",
      MessageBody: JSON.stringify(transaction),
    })
    .promise();
  return sentTranaction.hash;
};

export const monitorTransaction = async (partialTx: PartialTransactionEvent) => {
  const tx = await alchemy.core.getTransaction(partialTx.txHash);
  console.log(tx);
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
};
