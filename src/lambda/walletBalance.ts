import { getBalances } from "../service/BalanceService";
import { getAlchemyClient } from "../utils";
const alchemy = getAlchemyClient();
export const handler = async (event: any) => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    return await getBalances(event.source.address, alchemy);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
