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
                PK: fromAddress,
                SK: toAddress,
                ...transaction,
              },
            },
          },

          // {
          //   PutRequest: {
          //     Item: {
          //       PK: transactionHash,
          //       SK: transaction.blockNumber?.toString(),
          //       ...transaction,
          //     },
          //   },
          // },
        ],
      },
    };
    await this.client.batchWrite(saveQuery).promise();
    return;
  }

  public async saveTx(fromAddress: string, toAddress: string, transaction: Transaction): Promise<void> {
    const saveQuery: DynamoDB.DocumentClient.PutItemInput = {
      TableName: process.env.TRANSACTION_TABLE!,
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
