#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { WalletApiStack } from "./wallet-api-stack";
const app = new cdk.App();
new WalletApiStack(app, "WalletApiStack", {
  env: {
    region: process.env.REGION!,
    account: process.env.ACCOUNT!,
  },
});
