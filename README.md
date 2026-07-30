# RAG-Based Semantic Search System

A Retrieval-Augmented Generation (RAG) pipeline that combines vector search with NLP-based schema mapping to make large, inconsistent datasets searchable through natural language.

Built during a Data Engineer internship at SRF Limited (Jul–Sep 2025).

## What it does
- Embeds records using **BGE-M3** and indexes them with **FAISS** for fast vector similarity search
- Retrieves relevant context for a query, then generates a grounded answer via the **Gemini API**
- Applies NLP-based schema mapping to clean, validate, and reconcile inconsistent records before retrieval
- Processed 50+ datasets, achieving 90% data-match accuracy in the reconciliation step

## Tech stack
`Python` · `FAISS` · `BGE-M3 embeddings` · `Google Gemini API` · `Pandas`

## How it works
1. **Ingest** — raw datasets are loaded and normalized
2. **Reconcile** — NLP-based schema mapping aligns inconsistent fields/column names across sources
3. **Embed & Index** — records are embedded with BGE-M3 and stored in a FAISS index
4. **Retrieve** — a query is embedded and matched against the index for top-k relevant records
5. **Generate** — retrieved context is passed to Gemini to produce a grounded answer

## Setup
```bash
git clone https://github.com/sarthak-singh672/RAG_internship-project.git
cd RAG_internship-project
pip install -r requirements.txt
```
Add to a `.env` file:
