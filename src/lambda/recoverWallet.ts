import { recoverWallet } from "../service/WalletService";

export const handler = async (event: any): Promise<Wallet> => {
  console.info(`Event are ${JSON.stringify(event)}`);
  const response = await recoverWallet(event.arguments.address, event.arguments.mnemonic);
  console.info("getProduct.ts", JSON.stringify(response));
  return response;
};
