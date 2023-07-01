import { DynamoDB } from "aws-sdk";
import { Transaction } from "../types/types";
export class TransactionDb {
  private client: DynamoDB.DocumentClient;

  constructor() {
    this.client = new DynamoDB.DocumentClient({ region: "eu-west-1", apiVersion: "2012-08-10" });
  }

  public async saveTransaction(
    fromAddress: string,
    toAddress: string,
    transactionHash: string,
    transaction: Transaction,
  ): Promise<void> {
    const saveQuery: DynamoDB.DocumentClient.BatchWriteItemInput = {
      RequestItems: {
        transactionTable: [
          {
            PutRequest: {
              Item: {
                PK: fromAddress,
                SK: toAddress,
                ...transaction,
              },
            },
          },

          {
            PutRequest: {
              Item: {
                PK: transactionHash,
                SK: transaction.blockNumber,
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

  public async saveTx(
    fromAddress: string,
    toAddress: string,
    transaction: Transaction,
  ): Promise<void> {
    const saveQuery: DynamoDB.DocumentClient.PutItemInput = {
      TableName: "transactionTable",
      Item: {
        PK: fromAddress,
        SK: toAddress,
        ...transaction,
      },
    };
    await this.client.put(saveQuery).promise();
    return;
  }
}
