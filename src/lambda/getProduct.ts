import { DynamoDb } from "../db/dynamo";


type AppSyncEvent = {
    arguments: { productId: string};
}

export const handler = async (event: AppSyncEvent): Promise<Product> => {
    console.info(`Event are ${JSON.stringify(event)}`);
    const {productId} = event.arguments;
    const product = await new DynamoDb().getProduct(productId);
    console.info("getProduct.ts", JSON.stringify(product))
    return product;
}