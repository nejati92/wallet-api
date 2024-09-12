import { Alchemy, Contract, Utils } from "alchemy-sdk";
import { erc20Abi } from "./abi";

export const getBalances = async (address: string, alchemy: Alchemy) => {
  const [balance, tokenBalances, provider] = await Promise.all([
    alchemy.core.getBalance(address),
    alchemy.core.getTokenBalances(address),
    alchemy.config.getProvider(),
  ]);
  const nativeBalance = Utils.formatEther(balance._hex);
  const tokens = [];
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
