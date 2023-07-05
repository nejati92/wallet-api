import { Network, Alchemy } from "alchemy-sdk";
import { TransactionDb } from "./db/transactionsDb";
import { WalletDb } from "./db/walletDb";

export const getEnvironmentVariable = (environmentVariable: string | undefined, name: string): string => {
  if (!environmentVariable) {
    throw new Error(`Failed to get environment variable for ${name}`);
  }
  return environmentVariable;
};

export const getAlchemyClient = (): Alchemy => {
  const network = getEnvironmentVariable(process.env.NETWORK, "NETWORK") as "ETH_SEPOLIA" | "ETH_MAINNET";
  const settings = {
    apiKey: getEnvironmentVariable(process.env.ALCHEMY_API_KEY, "ALCHEMY_API_KEY"),
    network: Network[network],
  };

  const alchemy = new Alchemy(settings);
  return alchemy;
};

export const getTransactionDbClient = (): TransactionDb => {
  return new TransactionDb();
};

export const getWalletDbClient = (): WalletDb => {
  return new WalletDb();
};
