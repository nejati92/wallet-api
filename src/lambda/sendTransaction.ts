import { createEthereumTransaction } from "../service/TransactionService";

export const handler = async (event: any) => {
  console.info(`Event are ${JSON.stringify(event)}`);
  return await createEthereumTransaction(
    event.arguments.amount,
    event.arguments.address,
    event.arguments.fromAddress,
    event.identity.sub,
  );
};
