# 🚨 Dear Recruiter 🚨

# ⚠️ To prevent copy and malpractice, **only the project architecture is public**.  
# The **entire codebase is kept private**.  and also shared with the company in ZIP

# 👉 To view the full project:  
# - 📺 [Watch on YouTube](https://youtu.be/eqwOkB9NeG4)  
# - 📩 Or **request access** directly from me. Tap on picture and watch it 

# [![Watch Demo](https://raw.githubusercontent.com/07Sushant/dump/main/P1%20-%20frame%20at%200m15s.jpg)](https://youtu.be/eqwOkB9NeG4)

---


# Quest.io — AI Multi‑Agent Based Project

## What is Quest.io?
Quest.io is a futuristic, AI‑powered search and creation interface that orchestrates multiple specialized agents to help users research, understand, and create. It blends grounded web search, conversational AI, vision understanding, image generation, art transformation, and speech synthesis into a single, cohesive experience with a focus on zero‑cost or free‑tier usage wherever possible.

---

# Problem Statement
- **Core problem**: People spend too much time switching tools to research information, summarize findings, understand images/screenshots, and produce creative assets (images, voice). This context switching increases friction and costs.
- **Why AI agents**: These tasks differ in modality and workflow (text, web, images, speech). Specialized agents excel at narrow capabilities; coordinating them yields better overall outcomes.
- **Why multi‑agent collaboration**: 
  - **Decomposition**: Split a complex objective (e.g., “research X and produce a visual summary with narration”) into tasks handled by different agents.
  - **Parallelism**: Some agents operate independently (e.g., search + summarization) and then merge results.
  - **Orchestration**: A lightweight router orchestrates agents based on user intent (selected mode), saving cost and improving reliability.

---

# Project Description
Quest.io provides a single search box with multiple modes. Each mode triggers one or more agents, with the UI acting as an **Orchestrator/Router** that decides which agent(s) to invoke. The system is built to operate with free/open services whenever possible, with graceful fallbacks that keep the app usable without paid keys.

## Key Features (implemented)
- **AI Quest Assistant (Chat)**: Natural conversation for research and brainstorming with a streaming/standard response pipeline.
- **Deep Web Search**: Grounded search with URL citations and AI summarization of results.
- **Vision Understanding**: Analyze up to 4 images and answer questions about them.
- **Image Generation**: Create images from text prompts, with prompt enhancement.
- **Art Transform**: Upload an image and a prompt to transform it into a new style/content.
- **Speech Synthesis**: Convert text to audio for voice previews or narration.
- **STEM (Coming Soon)**: A long‑context reasoning agent leveraging a free/open model class suitable for complex STEM problem solving (e.g., Fathom R1‑14B). The UI already exposes a user‑facing notice when selected.

## Agent Roles and Interactions
- **Orchestrator/Router (Frontend handleSearch)**
  - Reads the selected mode: `ai | web | vision | image | art | speech | voice (live) | STEM`.
  - Invokes the appropriate backend route(s) and combines results into a unified message thread.
  - Caches recent responses client‑side to reduce calls.

- **Research/Search Agent (Backend)**
  - Endpoint: `/api/web-search/search`
  - Performs grounded web search via a free‑tier provider when available; otherwise returns structured mock results so the UX remains zero‑cost.
  - Returns normalized results with titles, URLs, snippets, related searches, and an insight summary string.

- **Insight/Summarization Agent (Frontend + Backend)**
  - After search, a summarizer composes a concise answer over the search results to reduce cognitive load.
  - Costs are minimized by batching and keeping token budgets small, or by using free‑tier text inference where available.

- **Vision Agent (Backend)**
  - Endpoint: `/api/vision/analyze`
  - Accepts up to 4 images (uploads or URLs). First creates short objective descriptions per image, then composes a final answer to the user’s question.
  - Built to use a free/public text inference endpoint by default; no paid keys required for basic operation.

- **Image Generation Agent (Backend)**
  - Endpoint: `/api/image-enhanced/generate`
  - Enhances prompts and returns a generated image URL from a free/open model or hosted inference that provides a free tier.

- **Art Transform Agent (Backend)**
  - Endpoint: `/api/art/transform`
  - Accepts one image + a prompt and returns a transformed image. Designed to run on free/open endpoints when configured.

- **Speech Synthesis Agent (Backend)**
  - Endpoint: `/api/speech/text-to-speech`
  - Uses a free/public TTS provider to return audio as base64; no paid account required for basic usage.

- **Voice (Live) Bridge (Backend, optional)**
  - WebSocket: `/ws/gemini-voice`
  - Bridges live audio dialogs to a free‑tier compatible provider when a key is present; connection is optional. The UI gracefully degrades when omitted.

- **STEM Reasoning Agent (Planned)**
  - Mode: `STEM` (toast appears on selection)
  - Long‑context mathematical and scientific reasoning (coming soon) using a free/open model class, e.g., Fathom R1 14B hosted on a free tier.

### Typical Interaction Flows
- **Web Research**
  1. User selects Web mode and submits a query.
  2. Research Agent fetches results (free tier if key is present; mock data otherwise).
  3. Insight Agent produces a concise summary of results.
  4. Orchestrator renders sources + summary in chat‑like UI.

- **Vision Q&A**
  1. User provides up to 4 images + a question.
  2. Vision Agent produces per‑image descriptions (JSON) and then a final synthesized answer.
  3. Orchestrator shows a preview and the final message.

- **Create Image / Art Transform**
  1. User enters a prompt (and optionally an input image for Art).
  2. Image Generation or Art Transform Agent returns an image URL.
  3. Orchestrator displays image and related metadata.

- **Speech**
  1. User inputs text in Speech mode.
  2. Speech Agent returns base64 audio and content‑type.
  3. Orchestrator plays audio with a visual playing indicator.

---

# Technologies Used
- **Frontend**
  - **Next.js (App Router) + React + TypeScript**
  - **Tailwind CSS** for design system and theming
  - **Framer Motion** for animations

- **Backend**
  - **Node.js + Express** for REST API
  - **ws** for optional live voice WebSocket bridge
  - **multer** for multi‑image upload handling (vision)
  - **axios** for robust HTTP calls

- **AI/ML (Zero‑cost first)**
  - Free/public hosted inference endpoints where available (text, vision composition, image generation, TTS)
  - Optional free‑tier keys to enable grounded search and live voice
  - Open‑source model strategy: Whisper‑class ASR, Llama/Mixtral‑class chat models, Fathom R1‑class STEM models, etc. (selected per task)

- **Other**
  - **CORS + security headers** configured in Express
  - **Client‑side cache** in the frontend to reduce repeated calls

---

# LLM Selection
- **Ideal (for best quality if cost were not a constraint)**
  - **Gemini 1.5 Pro/Flash**, **GPT‑4o**, **Claude 3.5** families for reasoning, summarization, and tool use.

- **Free‑tier / zero‑cost options (used/targeted)**
  - **Open‑source chat models** via hosted inference (e.g., Llama 3.1 8B/70B, Mixtral 8x7B) for general dialogue and summarization.
  - **Whisper‑class models** for ASR (transcription), either locally or via free community endpoints.
  - **Fathom R1 14B‑class** models for STEM reasoning (planned) — excellent trade‑off of performance and availability on free tiers.
  - **Public text‑to‑speech endpoints** offering free usage for basic audio generation.

- **Justification**
  - The system tasks are modular. We can pick small, efficient, free or open models for each agent while maintaining utility:
    - Summarization + search insight: compact chat models are sufficient.
    - Vision Q&A: lightweight text composition over structured image descriptions.
    - Image generation: free/open endpoints for fast prototyping.
    - TTS: public endpoints for demo‑level synthesis.
    - STEM: long‑context model with math/science capabilities as an optional, on‑demand pathway.

---

# Architecture Overview
- **Frontend (Next.js)** orchestrates flows and renders chat‑like messages. Mode selection acts as an explicit planner.
- **Backend (Express)** exposes modular endpoints for each agent and cleanly isolates concerns:
  - `/api/health` — API status
  - `/api/web-search/search` — search with citations and insights (free‑tier optional; mock fallback)
  - `/api/vision/analyze` — multi‑image understanding and Q&A
  - `/api/image-enhanced/generate` — text‑to‑image with prompt enhancement
  - `/api/art/transform` — image+prompt -> transformed image
  - `/api/speech/text-to-speech` — text‑to‑speech
  - `/api/voice-enhanced/transcribe` — transcription (free/open ASR model target)
  - `ws://<server>/ws/gemini-voice` — optional live voice dialog bridge

- **Cost Controls**
  - Graceful fallback to mock data when keys are absent (keeps demos free and predictable)
  - Client‑side caching to avoid repeated requests
  - Task‑based routing to small models/endpoints

---

# Setup and Run Instructions

## Prerequisites
- Node.js 18+
- npm (or pnpm/yarn)

## 1) Clone
1. `git clone <your-repo-url>`
2. `cd Search Engine`

## 2) Backend (Express API)
1. `cd BACK`
2. Create a `.env` file:
   - **PORT**=3001 (default)
   - **GEMINI_API_KEY**= (optional; enables grounded web search + live voice bridge)
   - **SPEECH_API_TOKEN**= (optional; enables free TTS provider)
   - You can run without keys — the app uses fallbacks/mocks where possible to stay zero‑cost.
3. Install deps: `npm install`
4. Start dev server: `npm run dev`
5. API runs at `http://localhost:3001`

## 3) Frontend (Next.js)
1. `cd FRONT`
2. Install deps: `npm install`
3. Start dev server: `npm run dev`
4. Open `http://localhost:3000`

## 4) Using the App
- Choose a mode from the header (e.g., Web, Vision, Image, Art, Speech, AI Chat, STEM).
- For Vision and Art, attach images directly.
- For Speech, enter text and play the audio.
- For STEM, you’ll see a bottom‑right toast indicating an upcoming free/open STEM model plan; it auto‑dismisses.

---

# Repository Structure (high level)
- **FRONT/** — Next.js app (App Router)
  - `app/` pages and layout
  - `src/components/` UI, navigation, search box, modals
  - `src/lib/` client APIs, utilities, audio helpers
- **BACK/** — Express server
  - `server.js` main server + optional WebSocket bridge
  - `routes/` modular endpoints (search, vision, image, art, speech, voice)
- **vercel.json** — Frontend deployment config

---

# Deployment
- **Frontend**: Vercel (free tier) — zero server management; uses relative `/api` in production.
- **Backend**: Any free Node hosting (e.g., Render/On‑demand) with Node 18+. Provide `.env` and expose `PORT`.
- **CORS** is already configured on the server for localhost and Vercel domains.

---

# Notes on Zero‑Cost Strategy
- Prefers free/public inference endpoints where possible.
- Optional keys unlock grounded search and live voice but are not required.
- Mock/fallback paths maintain functionality without paid services.
- Small/batch prompts and client‑side caching reduce token usage.
