import { SQSHandler, SQSEvent } from "aws-lambda";
import { monitorTransaction } from "../service/TransactionService";

export const handler = async (event: SQSEvent) => {
  try {
    console.info(`Event are ${JSON.stringify(event)}`);
    await Promise.all(
      event.Records.map((record) => {
        console.log(JSON.parse(record.body));
        return monitorTransaction(JSON.parse(record.body));
      }),
    );
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
