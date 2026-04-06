import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload_route";
import dotenv from 'dotenv'

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));

app.use(express.json());
app.use("/upload", uploadRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})

export default app;