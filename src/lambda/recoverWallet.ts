import { recoverWallet } from "../service/WalletService";
import { CustomError, Wallet } from "../types/types";
import { getWalletDbClient } from "../utils";
const walletDbClient = getWalletDbClient();
export const handler = async (event: any): Promise<Wallet | CustomError> => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    const response = await recoverWallet(event.arguments.mnemonic, event.identity.sub, walletDbClient);
    console.info("recoverWallet", JSON.stringify(response));
    return response;
  } catch (error) {
    console.log(error);
    throw error
  }
};
