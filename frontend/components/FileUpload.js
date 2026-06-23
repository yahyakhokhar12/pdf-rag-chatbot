import { useRef, useState } from "react";
import { uploadPdf } from "../lib/api";

export default function FileUpload({ onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadPdf(file);
      onUploadSuccess(result);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to upload PDF.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        id="pdf-upload-input"
      />
      <label
        htmlFor="pdf-upload-input"
        className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50"
      >
        {isUploading ? "Uploading & Processing..." : "Upload PDF"}
      </label>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <p className="text-gray-400 text-xs mt-2">
        PDF text will be extracted, chunked, embedded, and stored for chat.
      </p>
    </div>
  );
}
