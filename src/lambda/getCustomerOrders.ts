import { DynamoDb } from "../db/dynamo";


type AppSyncEvent = {
    arguments: { customerId: string, nextToken: string };
}

export const handler = async (event: AppSyncEvent):Promise<OrderConnection> => {
    console.info(`Event are ${JSON.stringify(event)}`);
    const {customerId:id, nextToken} = event.arguments;
    const order = await new DynamoDb().getCustomerOrders(id, 10)
    console.info("order", JSON.stringify(order))
    return order
}