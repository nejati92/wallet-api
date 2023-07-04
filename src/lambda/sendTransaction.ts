import { createEthereumTransaction } from "../service/TransactionService";
import { CustomError } from "../types/types";

export const handler = async (event: any):Promise<string|CustomError> => {
  try{
  console.info(`Event are ${JSON.stringify(event)}`);
  return await createEthereumTransaction(
    event.arguments.amount,
    event.arguments.address,
    event.arguments.fromAddress,
    event.identity.sub,
  );}
  catch(error){
    console.log(error);
    return {
      message: error.message,
      type: "SEND_TRANSACTION_FAILED",
    };
  }
};
