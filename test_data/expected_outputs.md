# Credly Test Case Scenarios

Detailed expected behavior for the generated test documents.

## 1. Case: GREEN-CORP SOLUTIONS PVT LTD (GOOD)

| Doc Type | Data Segment | Expected AI Action |
|----------|--------------|-------------------|
| **Annual Report** | Revenue 125 Cr / PAT 16 Cr | AI extract healthy profit margins and growth. |
| **GST** | Consistent monthly flow | Identify 100% turnover reconciliation. |
| **Bank** | 15 Cr Avg Balance | Note High Liquidity and zero defaults. |

### Expected Output:
- **Score**: 80 - 95 (GRADE A)
- **Decision**: APPROVE
- **Highlights**: Strong cash flow, 35% growth.
- **Web Research**: Should return news about "Green energy leader", "Solar expansion".

---

## 2. Case: RED-LINES TRADING LIMITED (BAD)

| Doc Type | Data Segment | Expected AI Action |
|----------|--------------|-------------------|
| **Annual Report** | -8 Cr Loss / -5 Cr Net Worth | Extract "Insolvent" and "Negative Net Worth". |
| **GST** | Irregular / Delay in Jul-Aug | Flag "Filings Discontinuity". |
| **Bank** | 15 Cheque Bounces | High-risk signal (Capacity/Character). |

### Expected Output:
- **Score**: 20 - 45 (GRADE D)
- **Decision**: REJECT
- **Reasoning**: NCLT notice, cheque bounces, negative profitability.
- **Web Research**: Likely to pull news on "Red Lines insolvency", "Sunil Gupta defaulting".

---

## Files Created:
1. `test_data/green_corp/annual_report.pdf`
2. `test_data/green_corp/gst_filings.pdf`
3. `test_data/green_corp/bank_statement.pdf`
4. `test_data/red_lines/annual_report.pdf`
5. `test_data/red_lines/gst_filings.pdf`
6. `test_data/red_lines/bank_statement.pdf`
