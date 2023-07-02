import { DynamoDB } from "aws-sdk";
export class WalletDb {
  private client: DynamoDB.DocumentClient;

  constructor() {
    this.client = new DynamoDB.DocumentClient({ region: process.env.REGION, apiVersion: "2012-08-10" });
  }

  public async saveWallet(userId: string, address: string, index: number): Promise<void> {
    const saveQuery: DynamoDB.DocumentClient.PutItemInput = {
      TableName: process.env.WALLET_TABLE!,
      Item: {
        id: "WALLET#" + userId,
        sortKey: address,
        index,
      },
    };
    await this.client.put(saveQuery).promise();
    const saveQuery2: DynamoDB.DocumentClient.PutItemInput = {
      TableName: process.env.WALLET_TABLE!,
      Item: {
        id: userId,
        sortKey: userId,
        index,
      },
    };
    await this.client.put(saveQuery2).promise();
    return;
  }

  public async getWallet(address: string, salt: string): Promise<any | undefined> {
    const getQuery: DynamoDB.DocumentClient.GetItemInput = {
      TableName: process.env.WALLET_TABLE!,
      Key: {
        id: address,
        sortKey: salt,
      },
    };
    const response = await this.client.get(getQuery).promise();
    return response.Item || undefined;
  }

  public async getWallets(id: string): Promise<
    | {
        address: any;
      }[]
    | undefined
  > {
    const getQuery: DynamoDB.DocumentClient.QueryInput = {
      TableName: process.env.WALLET_TABLE!,
      KeyConditionExpression: "id = :id",
      FilterExpression: "attribute_not_exists(mnemonic)",
      ExpressionAttributeValues: {
        ":id": "WALLET#" + id,
      },
    };
    const response = await this.client.query(getQuery).promise();
    return (
      response.Items?.map((x) => {
        return { address: x.sortKey };
      }) || undefined
    );
  }

  public async getWalletIndex(userId: string): Promise<number | undefined> {
    const getQuery: DynamoDB.DocumentClient.GetItemInput = {
      TableName: process.env.WALLET_TABLE!,
      Key: {
        id: userId,
        sortKey: userId,
      },
    };
    const response = await this.client.get(getQuery).promise();
    return response.Item?.index;
  }
}
