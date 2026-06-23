# AI PDF Chatbot (RAG)

A full-stack Retrieval-Augmented Generation chatbot that lets users upload PDFs,
ask questions about their content, and receive answers with cited source passages.

## Stack

- **Backend**: Python, FastAPI, LangChain, ChromaDB, OpenAI or Gemini
- **Frontend**: Next.js (React), Tailwind CSS
- **Deployment**: Docker / docker-compose

## Architecture

```
PDF Upload → Text Extraction → Chunking → Embeddings → Vector DB (Chroma)
                                                            ↓
                                              Retriever → LLM → Answer + Sources
```

## Project Structure

```
pdf-rag-chatbot/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload.py        # Upload & manage PDFs
│   │   │   └── chat.py          # Chat endpoint with history
│   │   ├── services/
│   │   │   ├── pdf_loader.py    # Text extraction
│   │   │   ├── chunker.py       # Document chunking
│   │   │   ├── embeddings.py    # Embedding model factory
│   │   │   ├── retriever.py     # Vector retrieval
│   │   │   └── rag_chain.py     # RAG pipeline + LLM
│   │   ├── database/
│   │   │   └── chroma.py        # Chroma vector store wrapper
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── lib/api.js
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## Quick Start (Docker Compose)

1. Configure environment variables:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` and set `OPENAI_API_KEY` (or set `LLM_PROVIDER=gemini` and `GOOGLE_API_KEY`).

2. Build and run:
   ```bash
   docker-compose up --build
   ```

3. Access:
   - Frontend: http://localhost:3000
   - Backend API docs: http://localhost:8000/docs

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then set OPENAI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Visit http://localhost:3000.

## Configuration (backend/.env)

| Variable | Description | Default |
|---|---|---|
| `LLM_PROVIDER` | `openai` or `gemini` | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_CHAT_MODEL` | Chat model | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `GOOGLE_API_KEY` | Gemini API key | - |
| `CHUNK_SIZE` | Characters per chunk | `1000` |
| `CHUNK_OVERLAP` | Overlap between chunks | `200` |
| `RETRIEVER_TOP_K` | Chunks retrieved per query | `4` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:3000` |

## API Endpoints

- `POST /api/upload` — Upload a PDF (multipart/form-data, field `file`)
- `GET /api/upload/sources` — List indexed PDFs and chunk count
- `DELETE /api/upload/sources/{source_name}` — Remove a PDF and its chunks
- `POST /api/chat` — Ask a question (`question`, optional `session_id`, optional `source_filter`)
- `GET /api/chat/history/{session_id}` — Get chat history
- `DELETE /api/chat/history/{session_id}` — Clear chat history

## Notes for Production

- Replace the in-memory chat session store (`app/api/chat.py`) with Redis or a database for multi-instance deployments.
- Persist `data/chroma` and `data/uploads` via volumes (already configured in `docker-compose.yml`).
- Set `ALLOWED_ORIGINS` to your real frontend domain.
- Use a process manager / multiple uvicorn workers (`--workers`) behind a reverse proxy (nginx) for production traffic.
- Scanned/image-only PDFs are not supported by default; add OCR (e.g. `pytesseract`) if needed.
