import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from "./abi/PayForUpload.json";
import './App.css';

function App() {

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ cid: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
  const UPLOAD_PRICE = import.meta.env.VITE_UPLOAD_PRICE; // price in RBTC 

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length > 0) {
        console.warn("Wallet was already authorized — ignoring until user clicks Connect");
      }
    });

    const handleAccountsChanged = () => {
      setAddress(null);
      setSigner(null);
      setProvider(null);
      setBalance(null);
      setChainId(null);
      setPaymentConfirmed(false);
      setTxHash(null);
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const formatFileSize = (size: number) =>
    size < 1024 * 1024
      ? (size / 1024).toFixed(2) + " KB"
      : (size / (1024 * 1024)).toFixed(2) + " MB";

  function generateUploadId() {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return "0x" + Array.from(randomBytes, b => b.toString(16).padStart(2, "0")).join("");
  }

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("MetaMask not detected");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No account selected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const address = accounts[0];
      const network = await provider.getNetwork();
      const balanceWei = await provider.getBalance(address);

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setChainId(network.chainId);
      setBalance(ethers.formatEther(balanceWei));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Wallet connection failed");
    }
  };
  
  const handlePayment = async () => {
    try {
      if (!signer || !provider) {
        throw new Error("Please connect wallet first");
      }

      if (!CONTRACT_ADDRESS) {
        throw new Error("Contract address not configured");
      }

      if (chainId !== 31n) {
        throw new Error("Please switch MetaMask to Rootstock Testnet");
      }

      setError(null);
      setPaying(true);
      setPaymentConfirmed(false);
      setResult(null);

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
      formData.append("uploadId", uploadId);

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
  <div className="app-container">
    <h1>IPFS File Uploader</h1>

    {/* Wallet */}
    <div className="wallet-card">
      {!address ? (
        <button className="primary" onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <>
          <p><strong>Address:</strong> {address.slice(0, 6)}…{address.slice(-4)}</p>
          <p>
            <strong>Network:</strong>{" "}
            {chainId === 31n ? "Rootstock Testnet" : `Wrong network (${chainId})`}
          </p>
          <p><strong>Balance:</strong> {balance} RBTC</p>
        </>
      )}
    </div>

    {/* File Input */}
    <input
      type="file"
      onChange={(event) => setFile(event.target.files?.[0] || null)}
    />

    <p className="info">Max file size: 2MB</p>
    <p className="info">Upload price: {UPLOAD_PRICE} RBTC</p>

    {file && (
      <div className="info">
        <p>Filename: {file.name}</p>
        <p>File size: {formatFileSize(file.size)}</p>
        <p>File type: {file.type}</p>
      </div>
    )}

    {/* Pay */}
    <div className="section">
      <button
        className="primary"
        onClick={handlePayment}
        disabled={!file || !address || paying || paymentConfirmed || file.size > 2 * 1024 * 1024}
      >
        {paying ? "Waiting for confirmation..." : paymentConfirmed ? "Paid" : "Pay"}
      </button>
    </div>

    {/* Tx */}
    {txHash && (
      <div className="tx-link">
        <a
          href={`https://explorer.testnet.rsk.co/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View Transaction
        </a>
      </div>
    )}

    {/* Upload */}
    <div className="section">
      <button
        className="secondary"
        onClick={handleUpload}
        disabled={!paymentConfirmed || uploading}
      >
        {!paymentConfirmed ? "Pay first" : uploading ? "Uploading..." : "Upload to IPFS"}
      </button>
    </div>

    {error && <div className="error">{error}</div>}

    {result && (
      <div className="success">
        {/* <p>CID: {result.cid}</p> */}
        <a href={result.url} target="_blank" rel="noopener noreferrer">
          View on IPFS
        </a>
      </div>
    )}
  </div>
  );

}

export default App;
