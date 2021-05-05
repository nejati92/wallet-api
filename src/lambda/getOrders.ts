import { DynamoDb } from "../db/dynamo";


type AppSyncEvent = {
    arguments: { orderRef: string, nextToken: string };
}

export const handler = async (event: AppSyncEvent):Promise<ProductConnection> => {
    console.info(`Event are ${JSON.stringify(event)}`);
    const {orderRef:id, nextToken} = event.arguments;
    const order = await new DynamoDb().getProductsForOrderRef(id, 10)
    console.info("order", JSON.stringify(order))
    return order
}