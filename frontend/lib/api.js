import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
});

/**
 * Upload a PDF file to the backend for processing and indexing.
 * @param {File} file
 * @returns {Promise<object>}
 */
export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Fetch the list of currently indexed PDF source documents.
 * @returns {Promise<{sources: string[], total_chunks: number}>}
 */
export async function getSources() {
  const response = await api.get("/api/upload/sources");
  return response.data;
}

/**
 * Delete a source document and all its chunks from the vector database.
 * @param {string} sourceName
 */
export async function deleteSource(sourceName) {
  const response = await api.delete(`/api/upload/sources/${encodeURIComponent(sourceName)}`);
  return response.data;
}

/**
 * Send a chat question to the RAG backend.
 * @param {string} question
 * @param {string|null} sessionId
 * @param {string|null} sourceFilter
 * @returns {Promise<{session_id: string, answer: string, sources: object[]}>}
 */
export async function sendChatMessage(question, sessionId = null, sourceFilter = null) {
  const response = await api.post("/api/chat", {
    question,
    session_id: sessionId,
    source_filter: sourceFilter,
  });
  return response.data;
}

/**
 * Clear chat history for a given session.
 * @param {string} sessionId
 */
export async function clearChatHistory(sessionId) {
  const response = await api.delete(`/api/chat/history/${sessionId}`);
  return response.data;
}
