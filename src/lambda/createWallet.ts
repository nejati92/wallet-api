import { createWallet } from "../service/WalletService";
import { Wallet } from "../types/types";

export const handler = async (event: any): Promise<Wallet[] | undefined> => {
  console.info(`Event are ${JSON.stringify(event)}`);
  const response = await createWallet(event.identity.sub);
  console.info("getProduct.ts", JSON.stringify(response));
  return response;
};
