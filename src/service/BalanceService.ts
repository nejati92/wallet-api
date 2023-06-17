import { Network, Alchemy, Contract } from "alchemy-sdk";
import { formatUnits, formatEther } from "ethers";
import { erc20Abi } from "./abi";
const settings = {
  apiKey: "C_C45Hn6XmvDCUaUCU09TShw8VcR_T21",
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);

export const getBalances = async (address: string) => {
  console.log(address);
  const totalAmount = "100.00";
  const balance = await alchemy.core.getBalance(address);
  console.log(balance);
  const nativeBalance = formatEther(balance._hex);
  console.log(nativeBalance);
  const tokenBalances = await alchemy.core.getTokenBalances(address);
  const t = [];
  const provider = await alchemy.config.getProvider();
  for (const tokenBalance of tokenBalances.tokenBalances) {
    const contract = new Contract(tokenBalance.contractAddress, erc20Abi, provider);
    const name = await contract.name();
    t.push({
      contractAddress: tokenBalance.contractAddress,
      amount: formatUnits(tokenBalance.tokenBalance || "0x00", 18),
      name,
    });
  }

  return { totalAmount, tokens: [{ amount: nativeBalance, isNative: true, name: "ETH" }, ...t] };
};
