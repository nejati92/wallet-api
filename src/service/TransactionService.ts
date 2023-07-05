import { Alchemy, Utils, Wallet } from "alchemy-sdk";
import { SQS, SecretsManager } from "aws-sdk";
import { PartialTransactionEvent, Transaction } from "../types/types";
import { TransactionDb } from "../db/transactionsDb";
import { getEnvironmentVariable } from "../utils";
export const createEthereumTransaction = async (
  amount: string,
  toAddress: string,
  fromAddress: string,
  userId: string,
  alchemy: Alchemy,
  transactionDb: TransactionDb,
) => {
  console.log(
    `createEthereumTransaction called with amount: ${amount}, address:${toAddress}, fromAddress:${fromAddress}`,
  );
  const secret = await new SecretsManager().getSecretValue({ SecretId: userId + fromAddress }).promise();
  if (!secret.SecretString) throw new Error("Failed to retrieve the PK");
  const privateKey = secret.SecretString;
  const value = Utils.parseEther(amount);
  const nonce = await alchemy.core.getTransactionCount(fromAddress);
  const blockNumber = await alchemy.core.getBlockNumber();
  const gasLimit = Utils.hexValue(250000); // TODO: make this config base
  const chainId = parseInt(getEnvironmentVariable(process.env.CHAIN_ID, "CHAIN_ID"));
  const gasPrice = await alchemy.core.getGasPrice();
  const tx = {
    nonce,
    gasLimit,
    gasPrice,
    to: toAddress,
    value,
    chainId,
    from: fromAddress,
  };
  console.log("Constructed transaction", tx);
  const rawTx = await new Wallet(privateKey).signTransaction(tx);
  const sentTransaction = await alchemy.core.sendTransaction(rawTx);
  console.log("Sent transaction", sentTransaction);
  const transaction: Transaction = {
    nonce,
    gasPrice: gasPrice.toString(),
    gasLimit: sentTransaction?.gasLimit?.toString(),
    value: sentTransaction?.value.toString(),
    txHash: sentTransaction.hash,
    fromAddress,
    toAddress,
    status: "PENDING",
    blockNumber: blockNumber + 1,
  };
  await transactionDb.saveTransaction(fromAddress, toAddress, sentTransaction.hash, transaction);
  await new SQS()
    .sendMessage({
      QueueUrl: getEnvironmentVariable(process.env.TRANSACTION_QUEUE_URL, "TRANSACTION_QUEUE_URL"),
      MessageBody: JSON.stringify(transaction),
    })
    .promise();
  return sentTransaction.hash;
};

export const monitorTransaction = async (
  partialTx: PartialTransactionEvent,
  alchemy: Alchemy,
  transactionDb: TransactionDb,
) => {
  try {
    console.log(`monitorTransaction called with :${partialTx.txHash}`);
    const tx = await alchemy.core.getTransaction(partialTx.txHash);
    if (tx?.confirmations && tx?.gasPrice && tx.value && tx.from && tx.to && tx.hash) {
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

      await transactionDb.saveTransaction(
        transaction.fromAddress,
        transaction.toAddress,
        transaction.txHash,
        transaction,
      );
      console.log("Transaction has been processed by the blockchain");
    } else {
      console.log("Transaction has not been processed by the blockchain");
      throw new Error("Transaction has not been processed by the blockchain");
    }
  } catch (e) {
    console.error(`Error:${e}`);
    throw e;
  }
};
