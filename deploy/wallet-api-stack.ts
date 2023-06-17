import * as cdk from "@aws-cdk/core";
import * as appsync from "@aws-cdk/aws-appsync";
import * as lambda from "@aws-cdk/aws-lambda";
import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";
import * as cognito from "@aws-cdk/aws-cognito";
import * as iam from "@aws-cdk/aws-iam";
export class WalletApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.CfnUserPool(this, "UserPool", {
      userPoolName: "walletUserPool",
      autoVerifiedAttributes: ["email"],
      mfaConfiguration: "OFF",
      schema: [
        {
          attributeDataType: "String",
          mutable: false,
          name: "email",
          required: true,
        },
      ],
    });
    const userPoolClient = new cognito.CfnUserPoolClient(this, "UserPoolClient", {
      clientName: "walletUserPoolClient",
      generateSecret: false,
      userPoolId: userPool.ref,
    });

    const api = new appsync.CfnGraphQLApi(this, "Api", {
      name: "wallet-api-2",
      authenticationType: "AMAZON_COGNITO_USER_POOLS",
      userPoolConfig: {
        userPoolId: userPool.ref,
        awsRegion: "eu-west-1",
        defaultAction: "ALLOW",
      },
    });

    new appsync.CfnGraphQLSchema(this, "schema", {
      apiId: api.attrApiId,
      definition: appsync.Schema.fromAsset("./schema.graphql").definition,
    });

    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.attrGraphQlUrl,
    });

    new cdk.CfnOutput(this, "UserPoolOutput", {
      value: userPool.ref || "",
    });
    new cdk.CfnOutput(this, "UserPoolClientOutput", {
      value: userPoolClient.ref || "",
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

    const createWalletLambda = new lambda.Function(this, "ordersHandler", {
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

    const balanceLambda: any = new lambda.Function(this, "balanceHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/walletBalance.handler",
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
    });

    const getWalletLambda: any = new lambda.Function(this, "getWalletHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/getWallet.handler",
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
    });

    const invokeRole = new iam.Role(this, "LambdaRole", {
      roleName: "LambdaRole",
      assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
    });
    const policy = new iam.Policy(this, "LambdaPolicy", {
      policyName: "LambdaPolicy",
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["lambda:InvokeFunction"],
          resources: [
            createWalletLambda.functionArn,
            recoverWalletLambda.functionArn,
            balanceLambda.functionArn,
            getWalletLambda.functionArn,
          ],
        }),
      ],
    });

    invokeRole.attachInlinePolicy(policy);

    walletTable.grantFullAccess(createWalletLambda);
     walletTable.grantFullAccess(getWalletLambda);
    walletTable.grantFullAccess(recoverWalletLambda);

    //Set the new Lambda function as a data source for the AppSync API
    const createWalletDataSource = new appsync.CfnDataSource(this, "createWalletDataSource", {
      apiId: api.attrApiId,
      name: "createWalletDataSource",
      lambdaConfig: {
        lambdaFunctionArn: createWalletLambda.functionArn,
      },
      type: "AWS_LAMBDA",
      serviceRoleArn: invokeRole.roleArn,
    });

    new appsync.CfnResolver(this, "createWalletDataSourceResolver", {
      apiId: api.attrApiId,
      typeName: "Mutation",
      fieldName: "createWallet",
      dataSourceName: createWalletDataSource.name,
    }).addDependsOn(createWalletDataSource);

    const recoverWalletDataSource = new appsync.CfnDataSource(this, "recoverWalletDataSource", {
      apiId: api.attrApiId,
      name: "recoverWalletDataSource",
      lambdaConfig: {
        lambdaFunctionArn: recoverWalletLambda.functionArn,
      },
      type: "AWS_LAMBDA",
      serviceRoleArn: invokeRole.roleArn,
    });

    new appsync.CfnResolver(this, "recoverWalletDataSourceResolver", {
      apiId: api.attrApiId,
      typeName: "Mutation",
      fieldName: "recoverWallet",
      dataSourceName: recoverWalletDataSource.name,
    }).addDependsOn(recoverWalletDataSource);

    const balanceWalletDataSource = new appsync.CfnDataSource(this, "balanceWalletDataSource", {
      apiId: api.attrApiId,
      name: "balanceWalletDataSource",
      lambdaConfig: {
        lambdaFunctionArn: balanceLambda.functionArn,
      },
      type: "AWS_LAMBDA",
      serviceRoleArn: invokeRole.roleArn,
    });

    new appsync.CfnResolver(this, "balanceWalletDataSourceResolver", {
      apiId: api.attrApiId,
      typeName: "Wallet",
      fieldName: "balance",
      dataSourceName: balanceWalletDataSource.name,
    }).addDependsOn(balanceWalletDataSource);

    const getWalletDataSource = new appsync.CfnDataSource(this, "getWalletDataSource", {
      apiId: api.attrApiId,
      name: "getWalletDataSource",
      lambdaConfig: {
        lambdaFunctionArn: getWalletLambda.functionArn,
      },
      type: "AWS_LAMBDA",
      serviceRoleArn: invokeRole.roleArn,
    });

    new appsync.CfnResolver(this, "getWalletDataSourceResolver", {
      apiId: api.attrApiId,
      typeName: "Query",
      fieldName: "getWalletDetails",
      dataSourceName: getWalletDataSource.name,
    }).addDependsOn(getWalletDataSource);
  }
}
