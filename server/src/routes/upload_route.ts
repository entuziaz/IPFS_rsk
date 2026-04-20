import express from "express";
import { upload } from "../services/upload_service";
import {
  handleUpload,
  handleUploadMiddlewareError,
} from "../controllers/upload_controller";

const router = express.Router();

router.post("/", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      handleUploadMiddlewareError(err, req, res, next);
      return;
    }

    void handleUpload(req, res);
  });
});

export default router;
