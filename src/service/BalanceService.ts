import { Network, Alchemy, Contract, Utils } from "alchemy-sdk";
import { erc20Abi } from "./abi";
const network = process.env.NETWORK as "ETH_SEPOLIA" | "ETH_MAINNET";
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network[network],
};

const alchemy = new Alchemy(settings);

export const getBalances = async (address: string) => {
  console.log(address);
  const balance = await alchemy.core.getBalance(address);
  console.log(balance);
  const nativeBalance = Utils.formatEther(balance._hex);
  console.log(nativeBalance);
  const tokenBalances = await alchemy.core.getTokenBalances(address);
  const tokens = [];
  const provider = await alchemy.config.getProvider();
  for (const tokenBalance of tokenBalances.tokenBalances) {
    const contract = new Contract(tokenBalance.contractAddress, erc20Abi, provider);
    const name = await contract.name();
    tokens.push({
      contractAddress: tokenBalance.contractAddress,
      amount: Utils.formatUnits(tokenBalance.tokenBalance || "0x00", 18),
      name,
    });
  }

  return { tokens: [{ amount: nativeBalance, isNative: true, name: "ETH" }, ...tokens] };
};
