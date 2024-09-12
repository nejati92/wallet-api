import { recoverWallet } from "../service/WalletService";
import { CustomError, Wallet } from "../types/types";
import { getWalletDbClient } from "../utils";
import { AppSyncIdentityCognito, AppSyncResolverEvent } from "aws-lambda";
const walletDbClient = getWalletDbClient();
export const handler = async (event: AppSyncResolverEvent<{ mnemonic: string }>): Promise<Wallet | CustomError> => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    const response = await recoverWallet(
      event.arguments.mnemonic,
      (event.identity as AppSyncIdentityCognito).sub,
      walletDbClient,
    );
    console.info("recoverWallet", JSON.stringify(response));
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
