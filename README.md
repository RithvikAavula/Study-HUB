# StudyHub — Academic Resource Sharing Platform

> A modern, student-focused platform to **share, discover, and study** academic resources powered by AI. Built for engineering colleges with department-wise organization, community collaboration, and an intelligent AI study assistant.

---

## Table of Contents

- [Overview](#overview)
- [Live Features](#live-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

StudyHub (also known as Academia Stack) is a full-stack web application that lets students upload, browse, and interact with academic materials — notes, PDFs, previous exam papers, assignments, and images — organized by department, year, section, and subject. On top of that, it ships a full **RAG-powered AI Study Assistant** that can answer questions directly from your uploaded PDFs, generate quizzes, flashcards, summaries, and exam-style questions.

---

## Live Features

### Authentication & User Management
- **Sign Up / Sign In** via Supabase Auth (email + password)
- **Forgot Password** flow — sends a secure reset link to the user's email
- **Reset Password** page — restores the recovery session from the email link and updates the password, then redirects to Sign In
- Auth guard on all protected pages — unauthenticated users are redirected to `/auth`

### Resource Library
- **Browse all resources** uploaded by the community across all departments
- **Filter** by department (CSE, ECE, EEE, MECH, CIVIL, IT, AI&DS, BIOTECH, CHEM, AEROSPACE), year (1st–4th), resource type (Notes, Previous Papers, Assignments, PDFs, Images, Others), and subject
- **Search** by keyword across titles and descriptions
- **Sort** resources by: Most Recent, Most Liked, Highest Rated, Most Downloaded
- **Clear All Filters** resets every filter and search field at once
- **Skeleton loading cards** shown while data is being fetched
- **Pull-to-Refresh** on mobile — swipe down to reload the resource list
- **Empty state** illustration shown when no results match the current filters

### Resource Cards
Each resource card displays:
- Title, description, department, year, subject, resource type badge
- Like count, download count, star rating
- Upload date and uploader info
- **Preview button** — opens a modal to preview the file (PDF viewer or image viewer) without downloading
- **Download button** — triggers a direct file download and increments the download counter
- **Like button** — toggles like/unlike; updates the like count in real time
- **Star Rating** — users can rate resources 1–5 stars; average rating is displayed

### Resource Upload
- Upload form with fields: title, description, department, year, section, subject, resource type
- **File picker** supporting PDF, DOC, DOCX, TXT, JPG, PNG (max 20 MB)
- Drag-and-drop style file area with file name and size preview
- File type and size validation with user-friendly error toasts
- On successful upload, the file is stored in **Supabase Storage** and metadata is saved to the database
- **Auto AI indexing** — if the uploaded file is a PDF, it is automatically sent to the backend for RAG indexing in the background so it becomes immediately available in the AI Assistant

### Resource Edit & Management
- Resource owners can **edit** their resource metadata (title, description, type, etc.) via an edit dialog
- Edit dialog pre-fills all existing values for convenience

### Dashboard
- Personal dashboard showing the user's uploaded resources
- Same filter and sort controls as the main Resources page
- Quick stats overview

### User Profile
- **Profile card** with avatar, full name, department, year, section, email, phone, and bio
- **Avatar upload** — click the camera icon in edit mode to upload a new profile picture (max 2 MB, stored in Supabase Storage)
- **Edit Profile** — inline editing of full name, phone, and bio; save or cancel with a single click
- **Academic Information** panel showing department, year, and section (read-only)
- **Stats panel** — total uploads, total likes received, total downloads, and average rating across all uploads
- **My Uploads tab** — grid of all resources the user has uploaded, with type-colored cards
- **Liked Resources tab** — grid of all resources the user has liked, for quick re-access

---

### AI Study Assistant

The AI Assistant is the most powerful feature of StudyHub. It is backed by a dedicated **Python/FastAPI backend** with a full **RAG (Retrieval-Augmented Generation)** pipeline.

#### How it works
1. When a user selects a PDF from the right panel, the backend **parses the PDF** (via `pdfplumber` / `PyMuPDF`), **chunks the text** (LangChain text splitter, 700-token chunks with 100-token overlap), and **generates embeddings** (BAAI/bge-small-en-v1.5 model).
2. Embeddings are stored in **Chroma Cloud** (vector database) and chunk metadata is saved in Supabase.
3. When the user asks a question, the backend **retrieves the top-K most relevant chunks** from Chroma, builds a context-aware prompt, and streams the answer from **Google Gemini 2.5 Flash** via OpenRouter.
4. The response is streamed token-by-token to the frontend using **Server-Sent Events (SSE)**.

#### Chat Interface
- **Three-panel layout**: conversation history sidebar (left), chat area (center), documents + tools panel (right)
- **Streaming responses** — the AI answer appears word-by-word as it is generated
- **Stop button** — cancel a streaming response mid-generation
- **Conversation history** — all past chats are saved and listed in the left sidebar; click any to reload it
- **New Chat** button — starts a fresh conversation
- **Delete conversation** — hover over any conversation to reveal a delete button
- **Collapsible sidebar** — toggle the left panel open/closed with a single button
- **Citations** — every AI answer includes clickable source citations that open the exact page of the PDF in a built-in PDF viewer
- **Suggested questions** — context-aware question suggestions are shown on the empty state and as a scrollable strip below the chat; clicking one sends it instantly
- **Indexing status banner** — shows a live progress bar while the selected PDF is being indexed, and a "Ready to chat!" confirmation when done

#### AI Tools (one-click, no typing required)
| Tool | What it does |
|---|---|
| Generate Summary | Produces a structured summary with overview, key concepts, and exam tips |
| Flashcards | Generates up to 15 front/back flashcards from the document |
| Generate Quiz | Creates 10 MCQ + True/False questions at medium difficulty |
| 5-Mark Questions | Generates 5 exam-style 5-mark questions with answer hints |
| 10-Mark Questions | Generates 5 exam-style 10-mark questions with answer hints |

Each tool result is displayed both in the chat and in a dedicated interactive modal viewer:
- **Summary Viewer** — structured card with overview, key concepts list, and exam tips
- **Flashcard Viewer** — flip-card UI; navigate forward/backward through the deck
- **Quiz Viewer** — interactive quiz with answer reveal and score tracking
- **PDF Viewer** — in-app PDF viewer that opens to the exact cited page number

---

### Communities

Department-wise study groups where students can collaborate privately or publicly.

#### Community Discovery
- **Communities listing page** with a responsive card grid
- Each card shows the community name, department badge (with department-specific icon and color), description, member count, and creation date
- **Search** communities by name or description
- **Filter** by department
- Live member count aggregated across all communities

#### Creating a Community
- Inline slide-in creation form (no page navigation needed)
- Fields: community name, department, description, and public/private toggle
- Creator automatically becomes the **admin** of the community

#### Inside a Community
- **Community header** with avatar (first letter of name), department, privacy badge, and member count
- **Three navigation cards** for quick access to Messages, Members, and (admin-only) Join Requests
- **Shared Resources section** — displays all resources shared into the community
- **Share Existing Resource** — members can share any of their own uploaded resources into the community
- **Upload Private Resource** — members can upload files exclusively to the community (stored in a separate `community-resources` Supabase Storage bucket with signed URLs for access control)
- **Resource preview and download** work the same as the main library

#### Community Messages
- Real-time-style group chat for community members
- Messages show sender name (resolved from profiles) and timestamp
- Send with Enter key or the send button

#### Community Members
- Full member list with roles (admin / member)
- Admin can remove members

#### Join Requests (Admin only)
- Dedicated page listing all pending join requests
- Admin can **approve** or **reject** each request
- Private communities require admin approval before a user can access content

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.5 | Type safety |
| Vite | 5.4 | Build tool and dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui + Radix UI | latest | Accessible component library |
| React Router v6 | 6.26 | Client-side routing |
| Lucide React | 0.462 | Icon library |
| react-pdf | 10.4 | In-app PDF rendering |
| react-markdown | 10.1 | Markdown rendering for AI responses |
| rehype-highlight | 7.0 | Syntax highlighting in AI responses |
| remark-gfm | 4.0 | GitHub Flavored Markdown support |
| TanStack Query | 5.56 | Server state management |
| Sonner | 1.5 | Toast notifications |
| next-themes | 0.3 | Theme management |

### Backend (AI Service)
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | 0.115 | REST API framework |
| Uvicorn | 0.32 | ASGI server |
| Supabase Python SDK | 2.10 | Database and storage access |
| pdfplumber | 0.11 | PDF text extraction |
| PyMuPDF (fitz) | 1.25 | PDF parsing fallback |
| LangChain Text Splitters | 0.3 | Document chunking |
| ChromaDB | 1.0 | Vector database client (Chroma Cloud) |
| OpenAI SDK | 1.57 | OpenRouter-compatible LLM client |
| structlog | 24.4 | Structured logging |
| tenacity | 9.0 | Retry logic |

### Infrastructure & Services
| Service | Purpose |
|---|---|
| Supabase Auth | User authentication and session management |
| Supabase Database (PostgreSQL) | All application data |
| Supabase Storage | File storage for resources and avatars |
| Chroma Cloud | Vector embeddings storage for RAG |
| OpenRouter | LLM API gateway (Google Gemini 2.5 Flash) |
| BAAI/bge-small-en-v1.5 | Embedding model for semantic search |
| Vercel | Frontend hosting |
| Render | Backend (FastAPI) hosting |

---

## Project Structure

```
Study-HUB/
├── src/                          # Frontend source
│   ├── pages/
│   │   ├── Index.tsx             # Landing page with hero stats
│   │   ├── Auth.tsx              # Sign in / Sign up / Forgot password
│   │   ├── ResetPassword.tsx     # Password reset (from email link)
│   │   ├── Resources.tsx         # Main resource library
│   │   ├── Dashboard.tsx         # Personal dashboard
│   │   ├── Upload.tsx            # Resource upload form
│   │   ├── Profile.tsx           # User profile & activity
│   │   ├── AIAssistant.tsx       # AI chat + tools
│   │   ├── Communities.tsx       # Community listing & creation
│   │   ├── Community.tsx         # Individual community page
│   │   ├── CommunityMessages.tsx # Group chat
│   │   ├── CommunityMembers.tsx  # Member management
│   │   ├── CommunityRequests.tsx # Join request management (admin)
│   │   └── NotFound.tsx          # 404 page
│   ├── components/
│   │   ├── ai/
│   │   │   ├── ChatMessage.tsx   # Renders a single chat message with citations
│   │   │   ├── PDFViewer.tsx     # In-app PDF viewer modal
│   │   │   ├── FlashcardViewer.tsx # Flip-card flashcard UI
│   │   │   ├── QuizViewer.tsx    # Interactive quiz modal
│   │   │   └── SummaryViewer.tsx # Structured summary modal
│   │   ├── ui/                   # shadcn/ui component library (40+ components)
│   │   ├── Header.tsx            # Navigation bar
│   │   ├── HeroSection.tsx       # Landing page hero with live stats
│   │   ├── FilterSection.tsx     # Filter + sort controls
│   │   ├── ResourceCard.tsx      # Resource card with like/download/preview
│   │   ├── ResourcePreview.tsx   # File preview modal
│   │   ├── ResourceEditDialog.tsx# Edit resource metadata dialog
│   │   ├── SkeletonCard.tsx      # Loading placeholder card
│   │   ├── EmptyState.tsx        # Empty results illustration
│   │   ├── LoadingSpinner.tsx    # Spinner component
│   │   └── PullToRefresh.tsx     # Mobile pull-to-refresh wrapper
│   ├── hooks/
│   │   ├── useAuth.tsx           # Auth state and helpers
│   │   ├── useTheme.tsx          # Dark/light theme toggle
│   │   ├── usePullToRefresh.tsx  # Pull-to-refresh logic
│   │   └── use-toast.ts          # Toast notification hook
│   ├── lib/
│   │   ├── aiApi.ts              # All AI backend API calls (chat, tools, conversations)
│   │   └── utils.ts              # Utility functions
│   └── integrations/supabase/
│       ├── client.ts             # Supabase client instance
│       └── types.ts              # Generated database types
│
├── backend/                      # Python AI backend
│   ├── app/
│   │   ├── api/ai_router.py      # All AI API endpoints
│   │   ├── config/settings.py    # Environment config (Pydantic Settings)
│   │   ├── database/connection.py# Supabase client setup
│   │   ├── middleware/auth_middleware.py # JWT auth validation
│   │   ├── models/               # Pydantic request/response schemas
│   │   ├── prompts/system_prompts.py # LLM system prompts
│   │   ├── rag/
│   │   │   ├── pdf_parser.py     # PDF text extraction
│   │   │   ├── chunker.py        # Text chunking
│   │   │   ├── embeddings.py     # Embedding generation
│   │   │   ├── vector_store.py   # Chroma Cloud operations
│   │   │   └── llm_client.py     # OpenRouter LLM client
│   │   ├── services/
│   │   │   ├── rag_service.py    # RAG query + document indexing
│   │   │   ├── ai_tools_service.py # Summary, quiz, flashcards, questions
│   │   │   ├── conversation_service.py # Chat history persistence
│   │   │   └── storage_service.py # Supabase Storage helpers
│   │   └── main.py               # FastAPI app entry point
│   ├── requirements.txt
│   └── .env                      # Backend environment variables
│
├── supabase/migrations/          # All database migration SQL files
├── public/                       # Static assets (favicon, robots.txt)
├── vercel.json                   # Vercel SPA routing config
├── render.yaml                   # Render backend deployment config
└── .env.example                  # Frontend environment variable template
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- A Supabase project
- A Chroma Cloud account
- An OpenRouter API key

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Study-HUB
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

---

## Environment Variables

### Frontend (`.env` in project root)
```env
VITE_PUBLIC_SITE_URL=http://localhost:5173        # or your production domain
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AI_BACKEND_URL=http://localhost:8000         # FastAPI backend URL
```

### Backend (`backend/.env`)
```env
# OpenRouter (LLM)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemini-2.5-flash

# Chroma Cloud (Vector DB)
CHROMA_HOST=api.trychroma.com
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT=your_chroma_tenant_id
CHROMA_DATABASE=your_chroma_database_name
CHROMA_COLLECTION=study_hub_embeddings

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_STORAGE_BUCKET=academic-resources

# Embedding Model
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5

# App
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
FRONTEND_URL=http://localhost:5173

# RAG Settings
CHUNK_SIZE=700
CHUNK_OVERLAP=100
TOP_K_RESULTS=5
MAX_PDF_SIZE_MB=50
```

### Supabase Auth URL Configuration
In your Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: same as `VITE_PUBLIC_SITE_URL`
- **Additional Redirect URLs**: add `http://localhost:5173` and your production domain

### Running locally

**Frontend:**
```bash
npm run dev
# App available at http://localhost:5173
```

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# API available at http://localhost:8000
```

---

## Database Schema

| Table | Key Columns | Purpose |
|---|---|---|
| `profiles` | user_id, full_name, department, year, section, avatar_url, bio, phone | User profile data |
| `resources` | id, title, description, resource_type, department, year, section, subject, file_url, file_type, uploaded_by, likes_count, download_count | Academic resources |
| `likes` | resource_id, user_id | Tracks which users liked which resources |
| `ratings` | resource_id, user_id, rating | 1–5 star ratings per resource |
| `communities` | id, name, department, description, created_by, is_private | Study communities |
| `community_members` | community_id, user_id, role | Community membership and roles |
| `community_messages` | community_id, user_id, content | Group chat messages |
| `community_resources` | community_id, resource_id | Links shared resources to communities |
| `community_custom_resources` | community_id, uploaded_by, title, file_path, file_type, file_size | Private community-only uploads |
| `membership_requests` | community_id, user_id, status | Pending join requests for private communities |
| `documents` | id, resource_id, index_status | Tracks AI indexing status per PDF |
| `document_chunks` | id, document_id, content, chunk_index | Stores chunked text for RAG |
| `conversations` | id, user_id, title | AI chat conversation sessions |
| `messages` | id, conversation_id, role, content, citations | Individual chat messages with citations |

All tables are protected by **Row Level Security (RLS)** policies in Supabase.

---

## Deployment

### Frontend — Vercel
1. Push your code to a Git repository
2. Import the project in Vercel
3. Set the following environment variables in Vercel → Settings → Environment Variables:
   - `VITE_PUBLIC_SITE_URL` (your Vercel domain, e.g. `https://your-app.vercel.app`)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_AI_BACKEND_URL` (your Render backend URL)
4. Vercel will automatically run `npm run build` and serve the `dist/` folder
5. The included `vercel.json` handles SPA routing (all paths serve `index.html`) and sets cache headers for static assets

### Backend — Render
1. Connect your repository to Render
2. Create a new **Web Service** pointing to the `backend/` directory
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all backend environment variables in Render's environment settings
6. The included `render.yaml` can be used for infrastructure-as-code deployment

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Favicon not updating | Hard-refresh with Ctrl/Cmd+Shift+R or clear site data in DevTools |
| Reset password shows "auth session missing" | Make sure you opened the email link in the same browser; Supabase Site URL must match `VITE_PUBLIC_SITE_URL` |
| Filters not returning results | Verify that department/year/type values in your DB match exactly (e.g., `IT`, `MECH`, `1`) |
| Supabase CORS or auth errors | Confirm Site URL and Redirect URLs in Supabase Dashboard match your env vars |
| AI chat returns no results | The PDF may still be indexing — wait for the "Ready to chat!" banner before asking questions |
| AI tools disabled / grayed out | Select a PDF from the right panel first; tools require an active document context |
| Chroma collection empty after redeploy | The backend auto-detects an empty Chroma collection on startup and resets Supabase document records so all PDFs get re-indexed when selected |
| Community resources not visible | Ensure the user is a member of the community; private resources use signed URLs that expire after 1 hour |

---

## License

MIT — free to use, modify, and distribute.
