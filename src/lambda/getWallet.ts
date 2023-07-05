import { getWallets } from "../service/WalletService";
import { CustomError, Wallet } from "../types/types";
import { getWalletDbClient } from "../utils";
const walletDbClient = getWalletDbClient();
export const handler = async (event: any): Promise<Wallet[] | CustomError> => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    const response = await getWallets(event.identity.sub, walletDbClient);
    console.info("getWallet.ts", JSON.stringify(response));
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
