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

function startsWithBytes(buffer: Buffer, signature: number[]) {
  if (buffer.length < signature.length) {
    return false;
  }

  return signature.every((byte, index) => buffer[index] === byte);
}

function detectFileType(buffer: Buffer) {
  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }

  return null;
}

export async function uploadFile(file: Express.Multer.File) {
  const detectedMimeType = detectFileType(file.buffer);

  if (!detectedMimeType) {
    throw new Error("Unsupported or invalid file type.");
  }

  const blob = new Blob([new Uint8Array(file.buffer)], { type: detectedMimeType });
  let result;

  try {
    result = await pinata.upload.public.file(blob as unknown as File, {
      metadata: { name: file.originalname },
    });
  } catch (err: any) {
    const statusCode = err?.statusCode;
    const details = err?.details;

    console.error("Pinata upload failed", {
      statusCode,
      details,
      fileName: file.originalname,
      mimeType: file.mimetype,
      detectedMimeType,
      gatewayConfigured: Boolean(process.env.PINATA_GATEWAY),
      jwtConfigured: Boolean(process.env.PINATA_JWT),
    });

    if (!statusCode) {
      throw new Error(
        "Pinata upload failed before receiving a response. Check internet access and verify PINATA_JWT and PINATA_GATEWAY in server/.env."
      );
    }

    throw new Error(`Pinata upload failed (${statusCode}). Check server configuration.`);
  }

  return {
    cid: result.cid,
    name: result.name,
    size: result.size,
    type: result.mime_type,
    url: `https://${process.env.PINATA_GATEWAY}/ipfs/${result.cid}`,
  };
}
