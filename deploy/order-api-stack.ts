import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from '@aws-cdk/aws-lambda';
import {AttributeType, BillingMode, Table} from '@aws-cdk/aws-dynamodb';

export class OrderApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'order-api',
      schema: appsync.Schema.fromAsset('schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        },
      },
      xrayEnabled: true,
    });

    
    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl
    });
  
    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || ''
    });

    new cdk.CfnOutput(this, "Stack Region", {
      value: this.region
    });

     const ordersTable = new Table(this, "orders", {
      tableName:"orders",
      partitionKey:{
        name: "id",
        type: AttributeType.STRING,
      },
      sortKey:{
        name: "sortKey",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST
    })
 
    const ordersLambda: any = new lambda.Function(this, 'ordersHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'src/lambda/getOrders.handler',
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
    });

    const productsLambda: any = new lambda.Function(this, 'productsHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'src/lambda/getProduct.handler',
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
    });

    const customersLambda: any = new lambda.Function(this, 'customersHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'src/lambda/getCustomerOrders.handler',
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
    });

    

    ordersTable.grantReadData(ordersLambda);
    ordersTable.grantReadData(productsLambda);
    ordersTable.grantReadData(customersLambda);

    // Set the new Lambda function as a data source for the AppSync API
    const getOrderDataSource = api.addLambdaDataSource('getOrderDataSource', ordersLambda as any);
    const getProductDataSource = api.addLambdaDataSource('getProductDataSource', productsLambda as any);
    const getCustomerDataSource = api.addLambdaDataSource('getCustomerDataSource', customersLambda as any);
    
    getOrderDataSource.createResolver({
      typeName: "Query",
      fieldName: "getAllProductsForOrder"
    });

    getProductDataSource.createResolver({
      typeName: "Query",
      fieldName: "getProduct"
    });

    getCustomerDataSource.createResolver({
      typeName: "Query",
      fieldName: "getAllOrdersForCustomer"
    });
  }
}

