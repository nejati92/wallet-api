import { createWallet } from "../service/WalletService";

export const handler = async (event: any): Promise<Wallet> => {
  console.info(`Event are ${JSON.stringify(event)}`);
  const response = await createWallet();
  console.info("getProduct.ts", JSON.stringify(response));
  return response;
};
