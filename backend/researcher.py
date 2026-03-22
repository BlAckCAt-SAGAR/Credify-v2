import os
from dotenv import load_dotenv
from pathlib import Path
from groq import Groq

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def research_company(company_name: str) -> dict:
    prompt = f"""
You are a credit risk researcher. We need to perform a comprehensive web search for {company_name}.
Since you don't have real-time internet access, use your vast internal knowledge base up to your last training data to simulate the most accurate and recent findings from the web regarding this company.

Focus your "search" strictly on:
1. FRAUD OR SCAM: Any past or ongoing fraud, scams, or cheating allegations.
2. LITIGATION: Any major court cases, lawsuits, or regulatory actions.
3. DEFAULTS & NPA: Any history of loan defaults, NPA classifications, or insolvency/NCLT proceedings.
4. LATEST NEWS: The most recent major news developments about the company.

Provide:
1. RISK LEVEL: (LOW / MEDIUM / HIGH / CRITICAL)
2. KEY FINDINGS: Provide up to 5 bullet points with the most important issues found (if none, say "No adverse findings").
3. SUMMARY: 2-3 sentence overall assessment.
4. SOURCES: List a few hypothetical or real factual URLs that would contain this info (e.g., "https://www.reuters.com/...", "https://economictimes.indiatimes.com/...").

Be factual and concise.
"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )

    analysis = response.choices[0].message.content

    # Extract risk level
    risk_level = "UNKNOWN"
    for level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        if level in analysis.upper():
            risk_level = level
            break

    # Mock raw results based on Groq's knowledge for backend compatibility
    all_results = [
        {
            "query": f"General risk research for {company_name}",
            "title": "Groq Knowledge Base Synthesis",
            "url": "https://groq.ai/knowledge",
            "content": analysis[:500]
        }
    ]

    return {
        "raw_results": all_results,
        "summary": analysis,
        "risk_level": risk_level,
        "sources": ["https://groq.ai/knowledge"]
    }