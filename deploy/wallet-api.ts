#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { WalletApiStack } from "./wallet-api-stack";
const app = new cdk.App();
new WalletApiStack(app, "WalletApiStack", {
  env: {
    region: "eu-west-1",
    account: "781619103453",
  },
});
