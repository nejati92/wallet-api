import { getBalances } from "../service/BalanceService";
import { getAlchemyClient } from "../utils";
import { AppSyncResolverEvent } from "aws-lambda";
const alchemy = getAlchemyClient();
export const handler = async (event: AppSyncResolverEvent<{}, { address: string }>) => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    return await getBalances(event.source.address, alchemy);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
