import { getWallets } from "../service/WalletService";

export const handler = async (event: any): Promise<Wallet[] | undefined> => {
  console.info(`Event are ${JSON.stringify(event)}`);
  const response = await getWallets(event.identity.sub);
  console.info("getProduct.ts", JSON.stringify(response));
  return response;
};
