import { DynamoDb } from "../db/dynamo";

type AppSyncEvent = {
  arguments: { customerId: string; nextToken?: string; limit?: number };
};

export const handler = async (event: AppSyncEvent): Promise<OrderConnection> => {
  console.info(`Event are ${JSON.stringify(event)}`);
  const { customerId: id, nextToken } = event.arguments;
  const limit = event.arguments.limit ? event.arguments.limit : 10; // default to ten
  const response = await new DynamoDb().getCustomerOrders(id, limit, nextToken);
  console.info("response", JSON.stringify(response));
  return response;
};
