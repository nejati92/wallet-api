# Projet
- This project is aimed at to create an Ethereum based wallets under an HD Wallet that you can see your balanaces, transactions, send and receive transactions. Currently only Ethereum is supported. There is no erc20 token support but this will be added in the future.
- The private key of your wallet is stored in AWS secrets manager,allowing the user to safeguard their private key and removing the need  


# Code Structure
- The code is written in TypeScript.
- It consist the src directory which has the:
  - Lambda code
  - DynamoDb code
  - Types
- It also has the deploy directory
  - This has the AWS infrastructure code using the `CDK` which will deploy the Graphql,DynamoDb and the 3 lambdas to AWS code.
- In order to run the project you will need to do `npm run build`. This will create a zip file in `dist` directory which will be used late to deploy the lambda code.
- Once run this step, you can execute `npm run deploy` to deploy the infrastructure to AWS.(You will need AWS cli installed and setup your credentials).

- In order  to deploy you will need to have an AWS account with your AWS credentails set up as well as Alchemy is used to contact to the ethereum blockchain.
`
export ACCOUNT_ID=""
export ALCHEMY_API_KEY=""
export REGION=""
`

