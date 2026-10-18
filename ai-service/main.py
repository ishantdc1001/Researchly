import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

from vector_store import ConferenceVectorStore
from agent import AgenticResearcher

app = FastAPI(
    title="Researchly.io AI & Agentic Matching Microservice",
    description="FAISS vector store, semantic similarity retrieval, and autonomous LLM agent workflow.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize vector store and autonomous agent
vector_store = ConferenceVectorStore()
agent = AgenticResearcher(vector_store)


class EvaluateAgentRequest(BaseModel):
    user_id: str
    agent_prompt: str
    conferences: List[Dict[str, Any]]


class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Researchly AI Microservice",
        "faiss_enabled": vector_store.index is not None,
        "encoder_ready": vector_store.encoder is not None
    }


@app.post("/evaluate-agent")
def evaluate_agent(payload: EvaluateAgentRequest):
    """
    Primary agentic endpoint called by the Express backend.
    Takes user criteria prompt and catalog of conferences,
    vectorizes them into FAISS, and runs LLM deep evaluation.
    """
    try:
        matches = agent.run_agentic_workflow(
            user_id=payload.user_id,
            agent_prompt=payload.agent_prompt,
            conferences=payload.conferences
        )
        return {
            "success": True,
            "matches_count": len(matches),
            "matches": matches
        }
    except Exception as e:
        print(f"Error in evaluate_agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embed-conferences")
def embed_conferences(conferences: List[Dict[str, Any]]):
    try:
        vector_store.index_conferences(conferences)
        return {
            "success": True,
            "indexed_count": len(conferences)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
def semantic_search(payload: SearchRequest):
    try:
        results = vector_store.search(payload.query, top_k=payload.top_k or 5)
        return {
            "success": True,
            "query": payload.query,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
