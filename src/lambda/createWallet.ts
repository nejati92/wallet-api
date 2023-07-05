import { createWallet } from "../service/WalletService";
import { CustomError, Wallet } from "../types/types";
import { getWalletDbClient } from "../utils";
import { AppSyncIdentityCognito, AppSyncResolverEvent } from "aws-lambda";
const walletDbClient = getWalletDbClient();
export const handler = async (event: AppSyncResolverEvent<{}>): Promise<Wallet[] | CustomError> => {
  try {
    console.info(`Events are ${JSON.stringify(event)}`);
    const response = await createWallet((event.identity as AppSyncIdentityCognito).sub, walletDbClient);
    console.info("createWallet.ts", JSON.stringify(response));
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
