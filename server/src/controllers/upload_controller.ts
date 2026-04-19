import { Request, Response } from "express";
import { uploadFile } from "../services/upload_service";
import {
  UploadVerificationError,
  consumeReservedPayment,
  releaseReservedPayment,
  reserveUploadPayment,
} from "../services/payment_verification_service";

export async function handleUpload(req: Request, res: Response) {
  let reservedPayment:
    | { payer: string; txHash: string; uploadId: string }
    | undefined;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadId = typeof req.body?.uploadId === "string" ? req.body.uploadId : "";
    const txHash = typeof req.body?.txHash === "string" ? req.body.txHash : "";
    const walletAddress =
      typeof req.body?.walletAddress === "string" ? req.body.walletAddress : "";
    const signature =
      typeof req.body?.signature === "string" ? req.body.signature : "";

    reservedPayment = await reserveUploadPayment({
      uploadId,
      txHash,
      walletAddress,
      signature,
    });

    const result = await uploadFile(req.file);
    await consumeReservedPayment(reservedPayment);
    res.json(result);
  } catch (err: any) {
    if (reservedPayment) {
      await releaseReservedPayment(reservedPayment);
    }

    console.error("Upload controller error:", err);
    const message = err?.message || "Upload failed";
    const status =
      err instanceof UploadVerificationError
        ? err.status
        : message === "Unsupported file type."
          ? 400
          : 500;
    res.status(status).json({ error: message });
  }
}
