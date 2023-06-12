import { DynamoDB } from "aws-sdk";
export class DynamoDb {
  private client: DynamoDB.DocumentClient;

  constructor() {
    this.client = new DynamoDB.DocumentClient({ region: "eu-west-1", apiVersion: "2012-08-10" });
  }

  public async saveWallet(address: string, salt: string): Promise<void> {
    const saveQuery: DynamoDB.DocumentClient.PutItemInput = {
      TableName: "wallet",
      Item: {
        id: address,
        sortKey: salt,
      },
    };
    await this.client.put(saveQuery).promise();
    return;
  }
}
