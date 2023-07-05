import { DynamoDB } from "aws-sdk";
import { getEnvironmentVariable } from "../utils";
export class WalletDb {
  private client: DynamoDB.DocumentClient;

  constructor() {
    this.client = new DynamoDB.DocumentClient({
      region: getEnvironmentVariable(process.env.REGION, "REGION"),
      apiVersion: "2012-08-10",
    });
  }

  public async saveWallet(userId: string, address: string, index: number): Promise<void> {
    const tableName = getEnvironmentVariable(process.env.WALLET_TABLE, "WALLET_TABLE");
    const batchWrite: DynamoDB.DocumentClient.BatchWriteItemInput = {
      RequestItems: {
        [tableName]: [
          {
            PutRequest: {
              Item: {
                id: "WALLET#" + userId,
                sortKey: address,
                index,
              },
            },
          },
          {
            PutRequest: {
              Item: {
                id: userId,
                sortKey: userId,
                index,
              },
            },
          },
        ],
      },
    };
    await this.client.batchWrite(batchWrite).promise();
    return;
  }

  public async getWallets(id: string): Promise<
    {
      address: string;
    }[]
  > {
    const getQuery: DynamoDB.DocumentClient.QueryInput = {
      TableName: getEnvironmentVariable(process.env.WALLET_TABLE, "WALLET_TABLE"),
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": "WALLET#" + id,
      },
    };
    const response = await this.client.query(getQuery).promise();
    return (
      response.Items?.map((x) => {
        return { address: x?.sortKey as string };
      }) || []
    );
  }

  public async getWalletIndex(userId: string): Promise<number | undefined> {
    const getQuery: DynamoDB.DocumentClient.GetItemInput = {
      TableName: getEnvironmentVariable(process.env.WALLET_TABLE!, "WALLET_TABLE"),
      Key: {
        id: userId,
        sortKey: userId,
      },
    };
    const response = await this.client.get(getQuery).promise();
    return response.Item?.index;
  }
}
