import { getWallets } from "../service/WalletService";
import { CustomError, Wallet } from "../types/types";

export const handler = async (event: any): Promise<Wallet[] | CustomError> => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    const response = await getWallets(event.identity.sub);
    console.info("getWallet.ts", JSON.stringify(response));
    return response;
  } catch (error) {
    console.error(error);
    return {
      message: error.message,
      type: "GET_WALLET_FAILED",
    };
  }
};
