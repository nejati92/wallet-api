import { DynamoDb } from "../db/dynamo";

type AppSyncEvent = {
  arguments: { orderRef: string; nextToken?: string; limit?: number };
};

export const handler = async (event: AppSyncEvent): Promise<ProductConnection> => {
  console.info(`Event are ${JSON.stringify(event)}`);
  const { orderRef: id, nextToken } = event.arguments;
  const limit = event.arguments.limit ? event.arguments.limit : 10; // default to ten
  const response = await new DynamoDb().getProductsForOrderRef(id, limit, nextToken);
  console.info("response", JSON.stringify(response));
  return response;
};
