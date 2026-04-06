import { Request, Response } from "express";
import { uploadFile } from "../services/upload_service";

export async function handleUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await uploadFile(req.file);
    res.json(result);
  } catch (err: any) {
    console.error("Upload controller error:", err);
    const message = err?.message || "Upload failed";
    const status = message === "Unsupported file type." ? 400 : 500;
    res.status(status).json({ error: message });
  }
}
