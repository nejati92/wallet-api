import { createEthereumTransaction } from "../service/TransactionService";
import { CustomError } from "../types/types";
import { getAlchemyClient, getTransactionDbClient } from "../utils";
import { AppSyncResolverEvent, AppSyncIdentityCognito } from "aws-lambda";
const alchemy = getAlchemyClient();
const transactionDb = getTransactionDbClient();
export const handler = async (
  event: AppSyncResolverEvent<{ amount: string; toAddress: string; fromAddress: string }>,
): Promise<string | CustomError> => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    return await createEthereumTransaction(
      event.arguments.amount,
      event.arguments.toAddress,
      event.arguments.fromAddress,
      (event.identity as AppSyncIdentityCognito).sub,
      alchemy,
      transactionDb,
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};
