import { getBalances } from "../service/BalanceService";

export const handler = async (event: any) => {
  console.info(`Event are ${JSON.stringify(event)}`);
  return await getBalances(event.source.address);
};
