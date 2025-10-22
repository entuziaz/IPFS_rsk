import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from "multer";
import dotenv from "dotenv";
import { PinataSDK } from 'pinata';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const upload = multer({
    limits: { fileSize: 2 * 1024 * 1024 },
});

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: process.env.PINATA_GATEWAY!,
});

app.get('/', (req: Request, res: Response) => {
    res.send("IPFS_RSK backend 🚀");
});

app.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
        const file = req.file;

        if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
        }

        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });

        const result = await pinata.upload.public.file(
            blob as unknown as File,
            {
                metadata: {
                name: file.originalname,
                },
            }
        );

        res.json({
            cid: result.cid,
            name: result.name,
            size: result.size,
            type: result.mime_type,
            url: `https://${process.env.PINATA_GATEWAY}/ipfs/${result.cid}`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "File upload failed" });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
