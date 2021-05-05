import {  DynamoDB } from "aws-sdk";
export class DynamoDb {
    private client: DynamoDB.DocumentClient;
   
    constructor() {
        this.client = new DynamoDB.DocumentClient({region:"eu-west-1", apiVersion:"2012-08-10"})
    }
    
    public async getProductsForOrderRef(id: string, limit: number, nextToken?: string):Promise<ProductConnection> {
        const getOrderQuery: DynamoDB.DocumentClient.QueryInput = {
            TableName: "orders",
            KeyConditionExpression: "id = :id",
            ExpressionAttributeValues:{
                ":id": id
            },
            Limit: limit? limit :10,
            
        }
        if(nextToken){
            getOrderQuery.ExclusiveStartKey = {nextToken};
        }
        const result =  (await this.client.query(getOrderQuery).promise());
        if(!result || !result.Items){
            throw new Error("Failed to get items");
        }
        const {Items, LastEvaluatedKey} = result;
        const products = Items.map(x=>{
            const {sortKey, productName, price}  = x
            return {
                productId: sortKey,
                productName,
                price
            }
        })
        return {items: products, nextToken: LastEvaluatedKey as unknown as string};
       
    }

    public async getCustomerOrders(id: string, limit: number, nextToken?: string):Promise<OrderConnection> {
        const getOrderQuery: DynamoDB.DocumentClient.QueryInput = {
            TableName: "orders",
            KeyConditionExpression: "id = :id",
            ExpressionAttributeValues:{
                ":id": id
            }
            
        }
        const result =  (await this.client.query(getOrderQuery).promise());
        if(!result || !result.Items){
            throw new Error("Failed to get items");
        }
        const {Items} = result;
        const items = Items.map(x=>{
            const {orderRef, id, productIds} = x
            return {productIds, orderRef, customerId: id};
        });
        return {items};
    }

    public async getProduct(productId: Object):Promise<Product> {
        console.info(`getProduct is called ${productId}`);
        const getOrderQuery: DynamoDB.DocumentClient.GetItemInput = {
            TableName: "products",
            Key: {id:productId}
        }
        const result =  (await this.client.get(getOrderQuery).promise());
        if(!result || !result.Item ){
            throw new Error("Failed to get items");
        }
        const {id, price, name,} = result.Item;
        return {productName:name, price, productId:id};
    }
    public async getProducts(productIds: string[]):Promise<Product[]> {
        console.info(`getProduct is called ${productIds}`);
        const t = productIds.map(x=>{
            return {id:x}
        });
        const getOrderQuery: DynamoDB.DocumentClient.BatchGetItemInput = {
            RequestItems:{
                "orders":{
                    Keys: t
                }
            }
        }
        const result =  (await this.client.batchGet(getOrderQuery).promise());
        if(!result || !result.Responses|| !result.Responses.orders){
            throw new Error("Failed to get items");
        }
       const products = result.Responses.products.map(r=>{
            const {id, price, name,} =r;
            return {productName:name, price, productId:id};
        })
        return products;
    }
}