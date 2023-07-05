import { createEthereumTransaction } from "../service/TransactionService";
import { CustomError } from "../types/types";
import { getAlchemyClient, getTransactionDbClient } from "../utils";
const alchemy = getAlchemyClient();
const transactionDb = getTransactionDbClient();
export const handler = async (event: any): Promise<string | CustomError> => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    return await createEthereumTransaction(
      event.arguments.amount,
      event.arguments.address,
      event.arguments.fromAddress,
      event.identity.sub,
      alchemy,
      transactionDb,
    );
  } catch (error) {
    console.log(error);
    throw error
  }
};
