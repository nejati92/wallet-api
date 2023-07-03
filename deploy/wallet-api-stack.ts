import * as cdk from "@aws-cdk/core";
import * as appsync from "@aws-cdk/aws-appsync";
import * as lambda from "@aws-cdk/aws-lambda";
import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";
import * as cognito from "@aws-cdk/aws-cognito";
import * as iam from "@aws-cdk/aws-iam";
import * as sqs from "@aws-cdk/aws-sqs";
import * as lambdaEventSources from "@aws-cdk/aws-lambda-event-sources";
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

    // TABLES
    const walletTable = new Table(this, "order", {
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

    const transactionsTable = new Table(this, "transactionTable", {
      tableName: "transactionTable",
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    transactionsTable.addLocalSecondaryIndex({
      indexName: "blockNumber",
      sortKey: { name: "blockNumber", type: AttributeType.NUMBER },
    });

    // TRANSACTION PROCESSOR

    const transactionDLQ = new sqs.Queue(this, "transactionDLQ", {
      queueName: "TransactionDLQ",
    });
    const transactionQueue = new sqs.Queue(this, "transactionQueue", {
      queueName: "TransactionQueue",
      deliveryDelay: cdk.Duration.seconds(60),
      visibilityTimeout: cdk.Duration.seconds(60),
      deadLetterQueue: {
        maxReceiveCount: 10,
        queue: transactionDLQ,
      },
    });

    // CREATE WALLET  LAMBDA
    const environment = {
      WALLET_TABLE: walletTable.tableName,
      TRANSACTION_TABLE: transactionsTable.tableName,
      REGION: process.env.REGION!,
      ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY!,
      NETWORK: "ETH_SEPOLIA",
      CHAIN_ID: "11155111",
      TRANSACTION_QUEUE_URL: transactionQueue.queueUrl,
    };
    const processTransactions: any = new lambda.Function(this, "processTransactions", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/processTransactions.handler",
      code: lambda.Code.asset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
      environment,
    });
    const eventSource = new lambdaEventSources.SqsEventSource(transactionQueue as any);

    processTransactions.addEventSource(eventSource);

    const createWalletLambda: any = new lambda.Function(this, "ordersHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/createWallet.handler",
      code: lambda.Code.asset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
      environment,
    });

    createWalletLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:CreateSecret", "secretsmanager:GetSecretValue"],
        resources: ["*"],
      }),
    );

    createWalletLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query"],
        resources: [walletTable.tableArn],
      }),
    );

    // RECOVER WALLET LAMBDA

    const recoverWalletLambda: any = new lambda.Function(this, "recoverHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/recoverWallet.handler",
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
      environment,
    });

    recoverWalletLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:CreateSecret"],
        resources: ["*"],
      }),
    );
    recoverWalletLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:PutItem", "dynamodb:GetItem"],
        resources: [walletTable.tableArn],
      }),
    );

    // BALANCE LAMBDA

    const balanceLambda: any = new lambda.Function(this, "balanceHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/walletBalance.handler",
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
      environment,
    });

    // GET WALLET LAMBDA

    const getWalletLambda: any = new lambda.Function(this, "getWalletHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/getWallet.handler",
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
      environment,
    });

    getWalletLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:GetItem", "dynamodb:Query"],
        resources: [walletTable.tableArn],
      }),
    );

    // SEND TRANSACTION LAMBDA

    const sendTransaction: any = new lambda.Function(this, "sendTxHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "src/lambda/sendTransaction.handler",
      code: lambda.Code.fromAsset("./dist/lambda.zip"),
      memorySize: 512,
      description: `Generated on: ${new Date().toISOString()}`,
      environment,
    });

    sendTransaction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: ["*"],
      }),
    );

    sendTransaction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sqs:SendMessage"],
        resources: [transactionQueue.queueArn],
      }),
    );
    sendTransaction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:BatchWriteItem"],
        resources: [transactionsTable.tableArn],
      }),
    );

    processTransactions.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:BatchWriteItem"],
        resources: [transactionsTable.tableArn],
      }),
    );

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
            sendTransaction.functionArn,
          ],
        }),
      ],
    });

    const invokeDynamoRole = new iam.Role(this, "invokeDynamoRole", {
      roleName: "invokeDynamoRole",
      assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
    });
    const invokeDynamoPolicy = new iam.Policy(this, "invokeDynamoPolicy", {
      policyName: "invokeDynamoPolicy",
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["dynamodb:Query"],
          resources: [transactionsTable.tableArn],
        }),
      ],
    });

    invokeRole.attachInlinePolicy(policy);
    invokeDynamoRole.attachInlinePolicy(invokeDynamoPolicy);
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

    const sendTransactionSource = new appsync.CfnDataSource(this, "sendTransactionSource", {
      apiId: api.attrApiId,
      name: "sendTransactionSource",
      lambdaConfig: {
        lambdaFunctionArn: sendTransaction.functionArn,
      },
      type: "AWS_LAMBDA",
      serviceRoleArn: invokeRole.roleArn,
    });

    new appsync.CfnResolver(this, "sendTransactionSourceResolver", {
      apiId: api.attrApiId,
      typeName: "Mutation",
      fieldName: "sendTransaction",
      dataSourceName: sendTransactionSource.name,
    }).addDependsOn(sendTransactionSource);

    // GEt Transactions
    const getTransactionSource = new appsync.CfnDataSource(this, "getTransactionSource", {
      apiId: api.attrApiId,
      name: "getTransactionSource",
      dynamoDbConfig: {
        awsRegion: process.env.REGION!,
        tableName: transactionsTable.tableName,
      },

      type: "AMAZON_DYNAMODB",
      serviceRoleArn: invokeDynamoRole.roleArn,
    });

    new appsync.CfnResolver(this, "getWalletTransactions", {
      apiId: api.attrApiId,
      typeName: "Wallet",
      fieldName: "transactions",
      dataSourceName: getTransactionSource.name,
      requestMappingTemplate: `
      #set($prefix = "ADDRESS#")
      #set($address= $ctx.source.address)
      #set($newLabel = $prefix + $address)
      {
        "version": "2017-02-28",
        "operation": "Query",
        "query": {
          "expression": "#PK = :address",
          "expressionNames": {
            "#PK": "PK"
          },
          "expressionValues": {
            ":address": $util.dynamodb.toDynamoDBJson($newLabel)
          }
        }
      }`,
      responseMappingTemplate: `$util.toJson($context.result.items)`,
    }).addDependsOn(getTransactionSource);

    new appsync.CfnResolver(this, "getTransactions", {
      apiId: api.attrApiId,
      typeName: "Query",
      fieldName: "getTransactions",
      dataSourceName: getTransactionSource.name,
      requestMappingTemplate: `
      #set($prefix = "ADDRESS#")
      #set($address= $ctx.arguments.address)
      #set($newLabel = $prefix + $address)
      {
        "version": "2017-02-28",
        "operation": "Query",
        "query": {
          "expression": "#PK = :address",
          "expressionNames": {
            "#PK": "PK"
          },
          "expressionValues": {
            ":address": $util.dynamodb.toDynamoDBJson($newLabel)
          }
        }
      }`,
      responseMappingTemplate: `$util.toJson($context.result.items)`,
    }).addDependsOn(getTransactionSource);
  }
}
