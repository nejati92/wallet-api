export interface Wallet {
  address: string;
}
export interface Transaction {
  fromAddress: string;
  toAddress: string;
  txHash: string;
  status: "PENDING" | "SENT_TO_BLOCKCHAIN" | "PROCESSED";
  nonce: number;
  gasPrice: string;
  gasLimit: string;
  txFee?: string;
  data?: string;
  blockNumber?: number;
  value: string;
}

export interface PartialTransactionEvent {
  fromAddress: string;
  txHash: string;
}

export interface CustomError {
  type: string;
  message: string;
}
