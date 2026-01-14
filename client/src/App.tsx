import { useState } from 'react';
import { ethers } from 'ethers';
import abi from "./abi/PayForUpload.json";
import './App.css';

function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ cid: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
  const UPLOAD_PRICE = import.meta.env.VITE_UPLOAD_PRICE; // price in RBTC 

  const formatFileSize = (size: number) =>
    size < 1024 * 1024
      ? (size / 1024).toFixed(2) + " KB"
      : (size / (1024 * 1024)).toFixed(2) + " MB";

  function generateUploadId() {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return "0x" + Array.from(randomBytes, b => b.toString(16).padStart(2, "0")).join("");
  }

  const handlePayment = async () => {
    try {
      if (!window.ethereum) {
        setError("Metamask not detected");
        return;
      }

      if (!CONTRACT_ADDRESS) {
        throw new Error("Contract address not configured");
      }


      setError(null);
      setPaying(true);
      setPaymentConfirmed(false);
      setResult(null);

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Force MetaMask connection
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();

      const network = await provider.getNetwork();

      if (network.chainId !== 31n) {
        throw new Error("Please switch MetaMask to Rootstock Testnet");
      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );

      const newUploadId = generateUploadId();
      setUploadId(newUploadId);

      if (!UPLOAD_PRICE) {
        throw new Error("Upload price not configured");
      }

      const value = ethers.parseEther(UPLOAD_PRICE);

      const tx = await contract.payForUpload(newUploadId, {
        value: value
      });

      setTxHash(tx.hash);

      // Wait for mining confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setPaymentConfirmed(true);
      } else {
        setError("Transaction failed on-chain.");
      }
    } catch (err: any) {
      console.error("Payment error:", err);

      if (err?.message?.toLowerCase().includes("rejected")) {
        setError("Transaction rejected in MetaMask");
      } else {
        setError(err?.message || "Payment failed");
      }
    } finally {
      setPaying(false);
    }
  };



  const handleUpload = async () => {
    if (!file) return;
    if (!paymentConfirmed || !uploadId) {
      setError("Payment required before upload");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadId", uploadId); // send same uploadId to backend later

      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setResult({ cid: data.cid, url: data.url });
    } catch (err) {
      console.error(err);
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div>
        <h1>IPFS File Uploader</h1>
      </div>
      <div>
        <input
          type="file"
          aria-label="Upload file"
          title="File input"
          placeholder="File"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <p>Max file size: 2MB</p>

        {file && (
          <div>
            <p>Filename: {file.name}</p>
            <p>File size: {formatFileSize(file.size)}</p>
            <p>File type: {file.type}</p>

            {file.size > 2 * 1024 * 1024 && (
              <p style={{ color: "red" }}>File too large! Please choose a file under 2 MB.</p>
            )}
          </div>
        )}
      </div>

      <div>
        <p>Upload price: {UPLOAD_PRICE} RBTC</p>
      </div>
      
      {/* -------- PAY BUTTON ---------- */}
      <div className="card">
        <button
          onClick={handlePayment}
          disabled={!file || paying || paymentConfirmed || file.size > 2 * 1024 * 1024}
        >
          {paying ? "Waiting for MetaMask..." : "Pay"}
        </button>
      </div>

      {/* Show tx hash */}
      {txHash && (
        <p>
          Tx: {" "}
          <a 
            href={`https://explorer.testnet.rsk.co/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {txHash}
          </a>
        </p>
      )}


      {/* -------- UPLOAD BUTTON ---------- */}
      <div className="card">
        <button
          onClick={handleUpload}
          disabled={!paymentConfirmed || uploading}
        >
          {!paymentConfirmed ? "Pay first" : uploading ? "Uploading..." : "Upload to IPFS"}
        </button>
      </div>
      
      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div>
          <h3> Uploaded!</h3>
          <p>CID: {result.cid}</p>
          <a href={result.url} target="_blank" rel="noopener noreferrer">
            View on IPFS
          </a>
        </div>
      )}

    </>
  )
}

export default App
