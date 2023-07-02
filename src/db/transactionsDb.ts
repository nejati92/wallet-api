import { DynamoDB } from "aws-sdk";
import { Transaction } from "../types/types";
export class TransactionDb {
  private client: DynamoDB.DocumentClient;

  constructor() {
    this.client = new DynamoDB.DocumentClient({ region: process.env.REGION, apiVersion: "2012-08-10" });
  }

  public async saveTransaction(
    fromAddress: string,
    toAddress: string,
    transactionHash: string,
    transaction: Transaction,
  ): Promise<void> {
    const tableName = process.env.TRANSACTION_TABLE!;
    const saveQuery: DynamoDB.DocumentClient.BatchWriteItemInput = {
      RequestItems: {
        [tableName]: [
          {
            PutRequest: {
              Item: {
                PK: "ADDRESS#"+fromAddress,
                SK: transaction.blockNumber?.toString(),
                ...transaction,
              },
            },
          },
          {
            PutRequest: {
              Item: {
                PK: "ADDRESS#"+toAddress,
                SK: transaction.blockNumber?.toString(),
                ...transaction,
              },
            },
          },

          {
            PutRequest: {
              Item: {
                PK: "HASH#"+transactionHash,
                SK: transaction.blockNumber?.toString(),
                ...transaction,
              },
            },
          },
        ],
      },
    };
    await this.client.batchWrite(saveQuery).promise();
    return;
  }
}
