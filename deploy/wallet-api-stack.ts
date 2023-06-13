import * as cdk from "@aws-cdk/core";
import * as appsync from "@aws-cdk/aws-appsync";
import * as lambda from "@aws-cdk/aws-lambda";
import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";

export class WalletApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, "Api", {
      name: "wallet-api",
      schema: appsync.Schema.fromAsset("schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)),
          },
        },
      },
      xrayEnabled: true,
    });

    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || "",
    });

    new cdk.CfnOutput(this, "Stack Region", {
      value: this.region,
    });

    const walletTable = new Table(this, "orders", {
      tableName: "wallet",
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sortKey",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const createWalletLambda: any = new lambda.Function(this, "ordersHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/createWallet.handler",
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
    });

    const recoverWalletLambda: any = new lambda.Function(this, "recoverHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/recoverWallet.handler",
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
    });

    walletTable.grantFullAccess(createWalletLambda);
    walletTable.grantFullAccess(recoverWalletLambda);
    // ordersTable.grantReadData(productsLambda);
    // ordersTable.grantReadData(customersLambda);

    // Set the new Lambda function as a data source for the AppSync API
    const createWalletDataSource = api.addLambdaDataSource("createWalletDataSource", createWalletLambda as any);

    createWalletDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "createWallet",
    });

    const recoverWalletDataSource = api.addLambdaDataSource("recoverWalletDataSource", recoverWalletLambda as any);

    recoverWalletDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "recoverWallet",
    });
  }
}
