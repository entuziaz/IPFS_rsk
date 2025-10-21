import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)

  const formatFileSize = (size) =>
    size < 1024 * 1024
      ? (size / 1024).toFixed(2) + " KB"
      : (size / (1024 * 1024)).toFixed(2) + " MB";

  return (
    <>
      <div>
        <h1>IPFS File Uploader</h1>
      </div>
      <div>
        <input type="file" aria-label="Upload file" title="File input" placeholder="File" onChange={(event => setFile(event.target.files[0]))} />
        <p>Max file size: 2MB</p>

        {file && (
          <div>
            <p>Filename: {file.name}</p>
            <p>File size: {formatFileSize(file.size)}</p>
            <p>File type: {file.type}</p>

            {file && file.size > 2 * 1024 * 1024 && (
              <p style={{ color: "red" }}>
                File too large! Please choose a file under 2 MB.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <button disabled={!file || file.size > 2 * 1024 * 1024}>
          Upload
        </button>
      </div>
    </>
  )
}

export default App
