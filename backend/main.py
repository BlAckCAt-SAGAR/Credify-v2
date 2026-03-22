from parser import extract_text_from_pdf
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
load_dotenv()
from llm import summarize_document, extract_financials, extract_borrower_profile
from scorer import calculate_score
from researcher import research_company
from report_generator import generate_cam_report
from pathlib import Path
import httpx
import os
import gc  # garbage collector

# --- HELPER FUNCTIONS ---
def clear_state(app):
    """Free all stored data from memory"""
    import gc
    for attr in ["extracted_text", "company_name", "summary", "financials", "score_result", "research", "borrower_profile"]:
        if hasattr(app.state, attr):
            delattr(app.state, attr)
    gc.collect()

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"GLOBAL ERROR: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Credly backend running"}

from typing import List

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Clear any previous session data before loading new one
    clear_state(app)

    all_text = ""
    filenames = []
    total_size = 0

    for file in files:
        if not file.filename.endswith(".pdf"):
            continue

        file_bytes = await file.read()
        total_size += len(file_bytes)
        
        # Reject if extremely massive (say combined above 100MB)
        if total_size > 100_000_000:
            raise HTTPException(status_code=413, detail="Total files size too large. Max 100MB.")

        text = extract_text_from_pdf(file_bytes)
        all_text += f"\n--- DOCUMENT: {file.filename} ---\n{text}\n"
        filenames.append(file.filename)
        
        del file_bytes
        gc.collect()

    if not all_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from any valid PDF.")

    # Store only the text
    app.state.extracted_text = all_text

    # AUTO-EXTRACT ENTITY (Engine 1 - Data Ingestor)
    try:
        profile = extract_borrower_profile(all_text)
        
        # Validate that a real company was found
        if not profile.get("company_name") or profile["company_name"].lower() in ["unknown company", "null", "none"]:
             raise HTTPException(status_code=400, detail="No company found. Please insert valid documents.")
             
        app.state.borrower_profile = profile
        app.state.company_name = profile.get("company_name", "Unknown Company")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Extraction error: {str(e)}")
        raise HTTPException(status_code=400, detail="No company found. Please insert valid documents.")

    return {
        "filenames": filenames,
        "borrower_profile": profile,
        "characters_extracted": len(all_text),
        "preview": all_text[:500]
    }

@app.post("/analyze")
async def analyze(officer_notes: str = Form(None)):
    if not hasattr(app.state, "extracted_text") or not hasattr(app.state, "borrower_profile"):
        raise HTTPException(status_code=400, detail="No document uploaded yet. Upload a PDF first.")

    company_name = app.state.company_name
    
    # Enrich the text with officer notes if provided
    analysis_text = app.state.extracted_text
    if officer_notes:
        analysis_text += f"\n\n--- OFFICER NOTES ---\n{officer_notes}"

    summary = summarize_document(analysis_text, company_name)
    financials = extract_financials(app.state.extracted_text, company_name)

    app.state.summary = summary["analysis"]
    app.state.financials = financials

    # Free raw text after analysis — no longer needed
    del app.state.extracted_text
    gc.collect()

    return {
        "company": company_name,
        "borrower_profile": app.state.borrower_profile,
        "analysis": summary["analysis"],
        "financials": financials,
        "tokens_used": summary["tokens_used"]
    }

@app.post("/score")
async def score():
    if not hasattr(app.state, "summary"):
        raise HTTPException(status_code=400, detail="Run /analyze first")
    result = calculate_score(app.state.financials, app.state.summary)
    app.state.score_result = result
    return result

@app.post("/research")
async def research():
    if not hasattr(app.state, "company_name"):
        raise HTTPException(status_code=400, detail="Run /analyze first")
    result = research_company(app.state.company_name)
    app.state.research = result
    if hasattr(app.state, "score_result"):
        if result["risk_level"] == "CRITICAL":
            app.state.score_result["score"] = max(0, app.state.score_result["score"] - 30)
            app.state.score_result["red_flags"].append("CRITICAL risk found in web research")
        elif result["risk_level"] == "HIGH":
            app.state.score_result["score"] = max(0, app.state.score_result["score"] - 15)
            app.state.score_result["red_flags"].append("HIGH risk found in web research")
    return result

@app.post("/generate-cam")
async def generate_cam():
    if not hasattr(app.state, "research"):
        raise HTTPException(status_code=400, detail="Run /research first")
    filepath = generate_cam_report(
        app.state.company_name,
        app.state.summary,
        app.state.financials,
        app.state.score_result,
        app.state.research
    )
    # Clear all state after CAM is generated — full session done
    response = FileResponse(
        path=filepath,
        filename=Path(filepath).name,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    clear_state(app)
    return response

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)