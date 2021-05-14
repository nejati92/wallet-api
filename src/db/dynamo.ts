import { DynamoDB } from "aws-sdk";
export class DynamoDb {
  private client: DynamoDB.DocumentClient;

  constructor() {
    this.client = new DynamoDB.DocumentClient({ region: "eu-west-1", apiVersion: "2012-08-10" });
  }

  public async getProductsForOrderRef(id: string, limit: number, nextToken?: string): Promise<ProductConnection> {
    const getOrderQuery: DynamoDB.DocumentClient.QueryInput = {
      TableName: "orders",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": id,
      },
      Limit: limit,
    };
    if (nextToken) {
      const token = nextToken.split("-");
      getOrderQuery.ExclusiveStartKey = { id: token[0], sortKey: token[1] };
    }
    const result = await this.client.query(getOrderQuery).promise();
    if (!result || !result.Items) {
      throw new Error("Failed to get items");
    }
    const { Items, LastEvaluatedKey } = result;
    const nToken = LastEvaluatedKey ? LastEvaluatedKey.id + "-" + LastEvaluatedKey.sortKey : undefined;
    const products = Items.map((item) => {
      const { id: productId, sortKey: name, price } = item;
      return {
        productId,
        name,
        price,
      };
    });
    return { items: products, nextToken: nToken };
  }

  public async getCustomerOrders(id: string, limit: number, nextToken?: string): Promise<OrderConnection> {
    const getOrderQuery: DynamoDB.DocumentClient.QueryInput = {
      TableName: "orders",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": id,
      },
      Limit: limit,
    };
    if (nextToken) {
      const token = nextToken.split("-");
      getOrderQuery.ExclusiveStartKey = { id: token[0], sortKey: token[1] };
    }
    const result = await this.client.query(getOrderQuery).promise();
    if (!result || !result.Items) {
      throw new Error("Failed to get items");
    }
    const { Items, LastEvaluatedKey } = result;
    const nToken = LastEvaluatedKey ? LastEvaluatedKey.id + "-" + LastEvaluatedKey.sortKey : undefined;
    const items = Items.map((item) => {
      const { sortKey: orderRef, id, products } = item;
      return { products, orderRef, customerId: id };
    });
    return { items, nextToken: nToken };
  }

  public async getProduct(productId: Object): Promise<Product> {
    console.info(`getProduct is called ${productId}`);
    const getOrderQuery: DynamoDB.DocumentClient.QueryInput = {
      TableName: "orders",
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": productId,
      },
    };
    const result = await this.client.query(getOrderQuery).promise();
    if (!result || !result.Items || !result.Items[0]) {
      throw new Error("Failed to get items");
    }
    const { id, price, sortKey: name } = result.Items[0];
    return { name, price, productId: id };
  }
}
