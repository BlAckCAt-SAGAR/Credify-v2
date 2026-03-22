from groq import Groq
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def summarize_document(text: str, company_name: str) -> dict:
    prompt = f"""
You are a senior Indian credit analyst. Analyze this document for company: {company_name}

DOCUMENT TEXT:
{text[:6000]}

Extract and return the following in a structured way:

1. COMPANY OVERVIEW: What does the company do? If not in text, use your knowledge about {company_name}.
2. KEY FINANCIALS: Revenue, Profit, EBITDA, Debt, Net Worth. If not in text, use your knowledge about {company_name}.
3. RED FLAGS: Any risks, warnings, negative signals you see or know about this company.
4. POSITIVE SIGNALS: Strengths, growth indicators.
5. MISSING INFO: What important data is not present in this document but you had to fill in using your knowledge?

Be specific. Use Indian financial context (Crores, Lakhs). Provide complete information even if the document text is sparse.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    return {
        "analysis": response.choices[0].message.content,
        "tokens_used": response.usage.total_tokens
    }


def extract_financials(text: str, company_name: str = "") -> dict:
    prompt = f"""
You are a financial data extractor. We need key financial metrics for {company_name}.
First, attempt to extract the numbers from the provided TEXT.
If any metric is missing from the TEXT, DO NOT RETURN NULL. Instead, use your internal knowledge about {company_name} to provide the actual values (for the most recent available year, typically 2023 or 2024).

Look for: Revenue, Profit, EBITDA, Total Debt, Net Worth, Total Assets.

TEXT:
{text[:4000]}

Return ONLY a valid JSON object in this exact format, with values containing units like 'Cr' or 'Crores':
{{
  "Revenue": "value",
  "Profit": "value",
  "EBITDA": "value",
  "Total Debt": "value",
  "Net Worth": "value",
  "Total Assets": "value"
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        response_format={ "type": "json_object" }
    )

    raw = response.choices[0].message.content
    
    try:
        financials = json.loads(raw)
    except json.JSONDecodeError:
        financials = {}

    # Ensure all expected keys exist
    expected_keys = ["Revenue", "Profit", "EBITDA", "Total Debt", "Net Worth", "Total Assets"]
    for key in expected_keys:
        if key not in financials or not financials[key] or str(financials[key]).lower() in ["null", "none", "", "n/a", "-"]:
            financials[key] = "Not Found"

    return financials


def extract_borrower_profile(text: str) -> dict:
    prompt = f"""
You are a data extractor for a credit risk platform. From the text below, identify and extract key company details.
If any details are missing, do your best to guess the likely values based on the company's presumed identity, or leave as "null" if completely unknown.

TEXT:
{text[:5000]}

RETURN ONLY A JSON OBJECT with these keys:
{{
  "company_name": "Full legal name (must not be null, infer from text)",
  "cin": "Corporate Identification Number",
  "pan": "Permanent Account Number",
  "promoters": ["Name 1", "Name 2"],
  "sector": "e.g. Textiles, IT, Manufacturing",
  "location": "City, State",
  "doc_type": "The type of document this appears to be"
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        response_format={ "type": "json_object" }
    )

    try:
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        return {}