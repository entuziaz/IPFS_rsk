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
  const ROOTSTOCK_TESTNET_CHAIN_ID = 31n;

  useEffect(() => {
    if (!window.ethereum) return;

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

  const switchToRootstock = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1f" }],
      });

      if (provider && address) {
        const network = await provider.getNetwork();
        const balanceWei = await provider.getBalance(address);

        setChainId(network.chainId);
        setBalance(ethers.formatEther(balanceWei));
        setError(null);
      }
    } catch (err: any) {
      console.error("Switch network error:", err);

      if (err?.code === 4902) {
        setError("Rootstock Testnet is not added to MetaMask.");
      } else {
        setError("Network switch failed.");
      }
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

      if (!chainId) {
        throw new Error("Unable to detect network. Please reconnect wallet.");
      }

      if (chainId !== ROOTSTOCK_TESTNET_CHAIN_ID) {
        throw new Error(
          `Wrong network detected. Please switch MetaMask to Rootstock Testnet (chainId 31).`
        );
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
      setError(normalizeError(err));
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

  const normalizeError = (err: any): string => {
    const msg = err?.message?.toLowerCase() || "";

    if (msg.includes("insufficient funds")) {
      return "Insufficient RBTC balance to pay for this transaction.";
    }

    if (msg.includes("rejected")) {
      return "Transaction rejected in MetaMask.";
    }

    if (msg.includes("wrong network")) {
      return "Please switch to Rootstock Testnet.";
    }

    return "Transaction failed. Please try again.";
  };


  return (
  <div className="app-container">
    <h1 className="app-title">
      <span className="title-accent">Rootstock</span> IPFS Uploader
    </h1>

    <div className="wallet-card">
      {!address ? (
        <button className="primary" onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <>
          <div className="wallet-row">
            <span className="label">Address</span>
            <span className="value">{address.slice(0, 6)}…{address.slice(-4)}</span>
          </div>

          <div className="wallet-row">
            <span className="label">Network</span>
            <span className={`value ${chainId === ROOTSTOCK_TESTNET_CHAIN_ID ? "ok" : "bad"}`}>
              {chainId === ROOTSTOCK_TESTNET_CHAIN_ID ? "Rootstock Testnet" : "Wrong Network"}
            </span>
          </div>

          {chainId !== ROOTSTOCK_TESTNET_CHAIN_ID && (
            <button className="secondary" onClick={switchToRootstock}>
              Switch to Rootstock Testnet
            </button>
          )}

          <div className="wallet-row">
            <span className="label">Balance</span>
            <span className="value">{balance} RBTC</span>
          </div>
        </>
      )}
    </div>

    {/* File Input */}
    <label className="file-input">
      <span>Choose file</span>
      <input
        type="file"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
      />
    </label>


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
        disabled={
          !file ||
          !address ||
          !chainId ||
          chainId !== ROOTSTOCK_TESTNET_CHAIN_ID ||
          paying ||
          paymentConfirmed ||
          file.size > 2 * 1024 * 1024
        }
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
