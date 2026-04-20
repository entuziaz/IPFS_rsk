import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { uploadFile } from "../services/upload_service";
import { logger } from "../logger";
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

    logger.error("Upload controller error", {
      error: logger.serializeError(err),
    });
    const message = err?.message || "Upload failed";
    const status =
      err instanceof UploadVerificationError
        ? err.status
        : message === "Unsupported or invalid file type."
          ? 400
          : 500;
    res.status(status).json({ error: message });
  }
}

export function handleUploadMiddlewareError(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (!err) {
    next();
    return;
  }

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "File is too large. Maximum size is 2 MB." });
    return;
  }

  if (err instanceof Error && err.message === "Unsupported or invalid file type.") {
    res.status(400).json({ error: err.message });
    return;
  }

  next(err);
}
