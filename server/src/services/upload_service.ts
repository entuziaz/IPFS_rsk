import multer from "multer";
import { PinataSDK } from "pinata";
import dotenv from "dotenv";

dotenv.config();

export const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

export async function uploadFile(file: Express.Multer.File) {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Unsupported file type.");
  }

  const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });

  const result = await pinata.upload.public.file(blob as unknown as File, {
    metadata: { name: file.originalname },
  });

  return {
    cid: result.cid,
    name: result.name,
    size: result.size,
    type: result.mime_type,
    url: `https://${process.env.PINATA_GATEWAY}/ipfs/${result.cid}`,
  };
}