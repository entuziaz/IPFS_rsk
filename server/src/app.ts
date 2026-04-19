import express from "express";
import cors from "cors";
import helmet from "helmet";
import uploadRoutes from "./routes/upload_route";
import dotenv from 'dotenv'
import { uploadRateLimit } from "./middleware/upload_rate_limit";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const TRUST_PROXY = process.env.TRUST_PROXY || "loopback";

app.set("trust proxy", TRUST_PROXY);

app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));

app.use(express.json());
app.use("/upload", uploadRateLimit, uploadRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})

export default app;
