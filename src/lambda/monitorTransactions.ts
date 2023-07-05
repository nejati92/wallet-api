import { SQSEvent } from "aws-lambda";
import { monitorTransaction } from "../service/TransactionService";
import { getAlchemyClient, getTransactionDbClient } from "../utils";
const alchemy = getAlchemyClient();
const transactionDb = getTransactionDbClient();
export const handler = async (event: SQSEvent) => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    await Promise.all(
      event.Records.map((record) => {
        console.log(JSON.parse(record.body));
        return monitorTransaction(JSON.parse(record.body), alchemy, transactionDb);
      }),
    );
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
