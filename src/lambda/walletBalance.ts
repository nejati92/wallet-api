import { getBalances } from "../service/BalanceService";

export const handler = async (event: any) => {
  try{
  console.info(`Event are ${JSON.stringify(event)}`);
  return await getBalances(event.source.address);
  }catch(error){
    console.log(error);
    return {
      message: error.message,
      type: "GET_BALANCE_FAILED",
    };
  }
};
