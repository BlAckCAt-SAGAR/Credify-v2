from fpdf import FPDF
import os

class TestPDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 12)
        self.cell(0, 10, 'CREDLY TEST DATA', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_doc(path, title, sections):
    pdf = TestPDF()
    pdf.add_page()
    
    # Title
    pdf.set_font('Helvetica', 'B', 16)
    pdf.cell(0, 10, title, 0, 1, 'L')
    pdf.ln(5)
    
    for section_title, content in sections:
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, section_title, 0, 1, 'L')
        pdf.set_font('Helvetica', '', 10)
        # Use a safe margin for multi_cell
        pdf.multi_cell(190, 7, content)
        pdf.ln(5)
    
    os.makedirs(os.path.dirname(path), exist_ok=True)
    pdf.output(path)

# --- GREEN-CORP SOLUTIONS (GOOD) ---
good_dir = "/Users/Krishna/Documents/GitHub/Credly/test_data/green_corp"
generate_doc(
    f"{good_dir}/annual_report.pdf", 
    "Annual Report FY 2023-24 - Green-Corp Solutions",
    [
        ("Entity Details", "Company Name: Green-Corp Solutions Pvt Ltd\nCIN: U72900MH2018PTC123456\nPromoters: Ramesh Shah, Anjali Shah\nSector: Renewable Energy / Solar Components\nLocation: Mumbai, Maharashtra"),
        ("Financial Summary (in Crores)", "Revenue: 125.40\nEBITDA: 24.50\nProfit After Tax (PAT): 16.20\nTotal Debt: 12.00\nNet Worth: 85.00\nTotal Assets: 120.00"),
        ("Auditor Note", "The company maintains a healthy Current Ratio of 1.8. Revenue grew by 35% compared to previous year. No defaults reported.")
    ]
)

gst_rows = "Month | Outward Supplies (Cr)\n" + "\n".join([f"{m} | {9.5 + (i*0.2):.2f}" for i, m in enumerate(["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"])])
generate_doc(
    f"{good_dir}/gst_filings.pdf",
    "GSTR-3B Summary - Green-Corp Solutions",
    [
        ("GSTIN Details", "GSTIN: 27AAACG1234A1Z5\nLegal Name: Green-Corp Solutions Pvt Ltd"),
        ("12-Month Sales Log", gst_rows),
        ("Compliance", "All returns filed within due dates. 100% matching with GSTR-2A.")
    ]
)

generate_doc(
    f"{good_dir}/bank_statement.pdf",
    "HDFC Bank - Current Account Statement",
    [
        ("Account Info", "Holder: Green-Corp Solutions Pvt Ltd\nA/C No: 50100887766554\nBranch: BKC, Mumbai"),
        ("Monthly Trends", "Consistent credits averaging 10.5 Cr monthly.\nZero cheque bounces.\nAverage Balance: 15.40 Cr.\nNo hits on Cash Withdrawal limits."),
        ("OD/CC Limit", "Sanctioned: 20 Cr. Peak Utilization: 15% (3 Cr).")
    ]
)

# --- RED-LINES TRADING (BAD) ---
bad_dir = "/Users/Krishna/Documents/GitHub/Credly/test_data/red_lines"
generate_doc(
    f"{bad_dir}/annual_report.pdf", 
    "Annual Report FY 2023-24 - Red-Lines Trading Ltd",
    [
        ("Entity Details", "Company Name: Red-Lines Trading Limited\nCIN: L12345KA2010PLC098765\nPromoters: Sunil Gupta, Mohan Das\nSector: Retail Trading\nLocation: Bangalore, Karnataka"),
        ("Financial Summary (in Crores)", "Revenue: 12.00 (Down from 45.00 last year)\nEBITDA: -2.50\nProfit After Tax (PAT): -8.40\nTotal Debt: 55.00\nNet Worth: -5.00 (Eroded)\nTotal Assets: 60.00"),
        ("Risk Factors", "Significant doubt about the ability of the company to continue as a going concern. High leverage with Debt/Equity ratio beyond industry norms.")
    ]
)

gst_bad_rows = "Month | Outward Supplies (Cr)\nApr | 4.50\nMay | 3.20\nJun | 1.10\nJul | 0.00 (Delayed)\nAug | 0.00 (Delayed)\nSep | 0.50\nOct-Mar | Negligible activity"
generate_doc(
    f"{bad_dir}/gst_filings.pdf",
    "GSTR-3B Summary - Red-Lines Trading",
    [
        ("GSTIN Details", "GSTIN: 29AAACR0987R1Z2\nLegal Name: Red-Lines Trading Limited"),
        ("12-Month Sales Log", gst_bad_rows),
        ("Compliance Mismatch", "GSTR-1 filing shows zero turnover for 6 consecutive months despite bank credits found in earlier quarters.")
    ]
)

generate_doc(
    f"{bad_dir}/bank_statement.pdf",
    "ICICI Bank - OD Account Statement",
    [
        ("Account Info", "Holder: Red-Lines Trading Limited\nA/C No: 001105009988\nBranch: MG Road, Bangalore"),
        ("Irregularities", "Total 15 Cheque Bounces (Technical & Insufficient Funds) in last 6 months.\nNotice received from NCLT dated Dec 12, 2023.\nFrequent circular trading seen with 'Gupta & Sons' - a sister concern."),
        ("Liquidity Crisis", "Peak Utilization: 99.8%. Account is in overdrawn state for 22 days in Feb.")
    ]
)

print(f"Test data generated in /Users/Krishna/Documents/GitHub/Credly/test_data/")
