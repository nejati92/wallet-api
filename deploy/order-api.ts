#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { OrderApiStack } from './order-api-stack';
const app = new cdk.App();
new OrderApiStack(app, 'OrderApiStack', {
    env: {
        region: 'eu-west-1',
        account: '979784506039'
    }
});
