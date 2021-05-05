import { DynamoDb } from "../db/dynamo";


type AppSyncEvent = {
    source: { productIds: string[], nextToken: string };
}

export const handler = async (event: AppSyncEvent):Promise<Product[]> => {
    console.info(`Events are ${JSON.stringify(event)}`);
    const {productIds} = event.source;
    const product = await new DynamoDb().getProducts(productIds);
    console.info("getProduct", JSON.stringify(product))
    return product;
}