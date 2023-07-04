import { createWallet } from "../service/WalletService";
import { CustomError, Wallet } from "../types/types";

export const handler = async (event: any): Promise<Wallet[] | CustomError> => {
  try {
    console.info(`Events are ${JSON.stringify(event)}`);
    const response = await createWallet(event.identity.sub);
    console.info("createWallet.ts", JSON.stringify(response));
    return response;
  } catch (error) {
    console.error(error);
    return {
      message: error.message,
      type: "CREATE_WALLET_FAILED",
    };
  }
};
