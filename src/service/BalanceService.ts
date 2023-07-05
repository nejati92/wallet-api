import { Alchemy, Contract, Utils } from "alchemy-sdk";
import { erc20Abi } from "./abi";

export const getBalances = async (address: string, alchemy: Alchemy) => {
  const balance = await alchemy.core.getBalance(address);
  const nativeBalance = Utils.formatEther(balance._hex);
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
