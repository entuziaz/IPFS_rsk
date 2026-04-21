import { promises as fs } from "fs";
import path from "path";
import fetch from "node-fetch";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ROOTSTOCK_RPC_URL = process.env.ROOTSTOCK_RPC_URL;
const MIN_CONFIRMATIONS = Number(process.env.MIN_CONFIRMATIONS || "1");
const PAID_EVENT_SIGNATURE =
  "Paid(address,uint256,bytes32,uint256)";
const REDEMPTIONS_FILE = path.resolve(
  process.cwd(),
  "data",
  "redeemed_upload_payments.json"
);

type JsonRpcSuccess<T> = {
  id: number;
  jsonrpc: "2.0";
  result: T;
};

type JsonRpcFailure = {
  id: number;
  jsonrpc: "2.0";
  error: {
    code: number;
    message: string;
  };
};

type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcFailure;

type StoredRedemption = {
  txHash: string;
  uploadId: string;
  payer: string;
  usedAt: string;
};

type ReservedPayment = {
  payer: string;
  txHash: string;
  uploadId: string;
};

const pendingRedemptions = new Set<string>();
let redemptionLock: Promise<void> = Promise.resolve();

export class UploadVerificationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UploadVerificationError";
    this.status = status;
  }
}

function getRequiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new UploadVerificationError(`${name} is not configured on the server.`, 500);
  }

  return value;
}

async function jsonRpc<T>(method: string, params: unknown[]): Promise<T> {
  const rpcUrl = getRequiredEnv("ROOTSTOCK_RPC_URL", ROOTSTOCK_RPC_URL);
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new UploadVerificationError(
      `Rootstock RPC request failed (${response.status}).`,
      502
    );
  }

  const payload = (await response.json()) as JsonRpcResponse<T>;

  if ("error" in payload) {
    throw new UploadVerificationError(
      `Rootstock RPC error: ${payload.error.message}`,
      502
    );
  }

  return payload.result;
}

function buildAuthorizationMessage(uploadId: string, txHash: string) {
  return [
    "Authorize IPFS upload",
    `Upload ID: ${uploadId}`,
    `Transaction Hash: ${txHash}`,
  ].join("\n");
}

function ensureHexString(value: string, length: number, field: string) {
  const normalized = value.trim().toLowerCase();
  const hexPattern = new RegExp(`^0x[a-f0-9]{${length}}$`);

  if (!hexPattern.test(normalized)) {
    throw new UploadVerificationError(`Invalid ${field}.`, 400);
  }

  return normalized;
}

function normalizeAddress(address: string, field: string) {
  try {
    return ethers.getAddress(address);
  } catch {
    throw new UploadVerificationError(`Invalid ${field}.`, 400);
  }
}

async function getReceipt(txHash: string) {
  const receipt = await jsonRpc<{
    status: string;
    blockNumber: string;
    to: string | null;
    logs: Array<{
      address: string;
      topics: string[];
      data: string;
      transactionHash: string;
    }>;
  } | null>("eth_getTransactionReceipt", [txHash]);

  if (!receipt) {
    throw new UploadVerificationError(
      "Payment transaction has not been mined yet.",
      409
    );
  }

  if (receipt.status !== "0x1") {
    throw new UploadVerificationError("Payment transaction failed on-chain.", 402);
  }

  return receipt;
}

async function ensureConfirmations(blockNumberHex: string) {
  const latestBlockHex = await jsonRpc<string>("eth_blockNumber", []);
  const latestBlock = Number.parseInt(latestBlockHex, 16);
  const paymentBlock = Number.parseInt(blockNumberHex, 16);
  const confirmations = latestBlock - paymentBlock + 1;

  if (confirmations < MIN_CONFIRMATIONS) {
    throw new UploadVerificationError(
      `Payment needs ${MIN_CONFIRMATIONS} confirmation(s) before upload.`,
      409
    );
  }
}

async function getUploadFee() {
  const contractAddress = getRequiredEnv("CONTRACT_ADDRESS", CONTRACT_ADDRESS);
  const selector = "0xffd02891";
  const result = await jsonRpc<string>("eth_call", [{ to: contractAddress, data: selector }, "latest"]);
  return BigInt(result);
}

function findPaidLog(
  logs: Array<{ address: string; topics: string[]; data: string }>,
  uploadId: string
) {

  const targetContract = getRequiredEnv("CONTRACT_ADDRESS", CONTRACT_ADDRESS).toLowerCase();
  const paidEventTopic = ethers.id("Paid(address,uint256,bytes32,uint256)").toLowerCase();

  const targetUploadId = ethers.zeroPadValue(uploadId, 32).toLowerCase();

  return logs.find((log) => {
    const logAddress = log.address.toLowerCase();
    const eventSignature = log.topics[0]?.toLowerCase();
    const logUploadId = log.topics[2]?.toLowerCase();

    // Debugging logs (Check your console!)
    console.log(`Checking log from: ${logAddress}`);
    console.log(`Event Sig: ${eventSignature} vs ${paidEventTopic}`);
    console.log(`UploadId: ${logUploadId} vs ${targetUploadId}`);

    return (
      logAddress === targetContract &&
      eventSignature === paidEventTopic &&
      logUploadId === targetUploadId
    );
  });
}

function decodePaidLog(log: { topics: string[]; data: string }) {
  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
    ["uint256", "uint256"],
    log.data
  );

  const payer = normalizeAddress(
    ethers.getAddress(`0x${log.topics[1]!.slice(-40)}`),
    "payer"
  );

  return {
    payer,
    amount: decoded[0] as bigint,
  };
}

async function readRedemptions(): Promise<Record<string, StoredRedemption>> {
  try {
    const raw = await fs.readFile(REDEMPTIONS_FILE, "utf8");
    return JSON.parse(raw) as Record<string, StoredRedemption>;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeRedemptions(redemptions: Record<string, StoredRedemption>) {
  await fs.mkdir(path.dirname(REDEMPTIONS_FILE), { recursive: true });
  await fs.writeFile(REDEMPTIONS_FILE, JSON.stringify(redemptions, null, 2));
}

function getRedemptionKey(txHash: string, uploadId: string) {
  return `${txHash}:${uploadId}`;
}

async function withRedemptionLock<T>(work: () => Promise<T>) {
  const previousLock = redemptionLock;
  let releaseLock: () => void = () => undefined;

  redemptionLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  await previousLock;

  try {
    return await work();
  } finally {
    releaseLock();
  }
}

export async function reserveUploadPayment(params: {
  signature: string;
  txHash: string;
  uploadId: string;
  walletAddress: string;
}): Promise<ReservedPayment> {
  const txHash = ensureHexString(params.txHash, 64, "transaction hash");
  const uploadId = ensureHexString(params.uploadId, 64, "uploadId");
  const signature = params.signature.trim();
  const walletAddress = normalizeAddress(params.walletAddress, "walletAddress");

  if (!signature) {
    throw new UploadVerificationError("Missing signature.", 400);
  }

  const authorizationMessage = buildAuthorizationMessage(uploadId, txHash);
  const recoveredAddress = normalizeAddress(
    ethers.verifyMessage(authorizationMessage, signature),
    "signature signer"
  );

  if (recoveredAddress !== walletAddress) {
    throw new UploadVerificationError(
      "Signature does not match the provided wallet address.",
      401
    );
  }

  const receipt = await getReceipt(txHash);
  await ensureConfirmations(receipt.blockNumber);

  const paidLog = findPaidLog(receipt.logs, uploadId);

  if (!paidLog) {
    throw new UploadVerificationError(
      "No matching on-chain payment was found for this uploadId.",
      402
    );
  }

  const { payer, amount } = decodePaidLog(paidLog);
  const uploadFee = await getUploadFee();

  if (payer !== walletAddress) {
    throw new UploadVerificationError(
      "Paid event payer does not match the authenticated wallet.",
      401
    );
  }

  if (amount < uploadFee) {
    throw new UploadVerificationError(
      "On-chain payment amount is below the required upload fee.",
      402
    );
  }

  await withRedemptionLock(async () => {
    const redemptions = await readRedemptions();
    const key = getRedemptionKey(txHash, uploadId);

    if (redemptions[key] || pendingRedemptions.has(key)) {
      throw new UploadVerificationError("This payment has already been used for an upload.", 409);
    }

    pendingRedemptions.add(key);
  });

  return {
    payer,
    txHash,
    uploadId,
  };
}

export async function consumeReservedPayment(payment: ReservedPayment) {
  await withRedemptionLock(async () => {
    const redemptions = await readRedemptions();
    const key = getRedemptionKey(payment.txHash, payment.uploadId);

    redemptions[key] = {
      txHash: payment.txHash,
      uploadId: payment.uploadId,
      payer: payment.payer,
      usedAt: new Date().toISOString(),
    };

    pendingRedemptions.delete(key);
    await writeRedemptions(redemptions);
  });
}

export async function releaseReservedPayment(payment: ReservedPayment) {
  await withRedemptionLock(async () => {
    pendingRedemptions.delete(getRedemptionKey(payment.txHash, payment.uploadId));
  });
}
