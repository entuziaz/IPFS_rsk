import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ cid: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (size: number) =>
    size < 1024 * 1024
      ? (size / 1024).toFixed(2) + " KB"
      : (size / (1024 * 1024)).toFixed(2) + " MB";

  const API_URL = import.meta.env.VITE_API_URL;

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

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

      <div className="card">
        <button onClick={handleUpload} disabled={!file || file.size > 2 * 1024 * 1024 || uploading}>
          {uploading ? "Uploading..." : "Upload"}
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
