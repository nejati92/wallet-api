import { DynamoDB } from "aws-sdk";
export class DynamoDb {
  private client: DynamoDB.DocumentClient;

  constructor() {
    this.client = new DynamoDB.DocumentClient({ region: "eu-west-1", apiVersion: "2012-08-10" });
  }

  public async saveWallet(userId: string, address: string, path: string, mnemonic: string): Promise<void> {
    const saveQuery: DynamoDB.DocumentClient.PutItemInput = {
      TableName: "wallet",
      Item: {
        id: userId,
        sortKey: address,
        path,
      },
    };
    await this.client.put(saveQuery).promise();
    const saveQuery2: DynamoDB.DocumentClient.PutItemInput = {
      TableName: "wallet",
      Item: {
        id: userId,
        sortKey: userId,
        path,
        mnemonic,
      },
    };
    await this.client.put(saveQuery2).promise();
    return;
  }

  public async getWallet(address: string, salt: string): Promise<any | undefined> {
    const getQuery: DynamoDB.DocumentClient.GetItemInput = {
      TableName: "wallet",
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
      TableName: "wallet",
      KeyConditionExpression: "id = :id",
      FilterExpression: "attribute_not_exists(mnemonic)",
      ExpressionAttributeValues: {
        ":id": id,
      },
    };
    const response = await this.client.query(getQuery).promise();
    return (
      response.Items?.map((x) => {
        return { address: x.sortKey };
      }) || undefined
    );
  }

  public async getWalletPath(userId: string): Promise<any | undefined> {
    const getQuery: DynamoDB.DocumentClient.GetItemInput = {
      TableName: "wallet",
      Key: {
        id: userId,
        sortKey: userId,
      },
    };
    const response: any = await this.client.get(getQuery).promise();
    return { path: response.Item?.path, mnemonic: response.Item?.mnemonic } || undefined;
  }
}
