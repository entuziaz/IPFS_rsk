import express from "express";
import { upload } from "../services/upload_service";
import { handleUpload } from "../controllers/upload_controller";

const router = express.Router();

router.post("/", upload.single("file"), handleUpload);

export default router;