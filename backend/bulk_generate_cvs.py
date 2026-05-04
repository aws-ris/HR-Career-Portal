
import os
import random
from datetime import date, timedelta
try:
    from fpdf import FPDF
except ImportError:
    os.system('pip install fpdf2')
    from fpdf import FPDF

# --- DATA POOLS ---
DOMAINS = [
    {
        "name": "International Trade & G20 Policy", 
        "summary": "Specialist in South-South cooperation and global value chains with extensive experience in policy advisory.",
        "skills": ["STATA", "Econometrics", "Trade Policy", "WTO Law"],
        "thesis": ["Digital Transformation in GVCs", "Trade-Tech Interface in G20", "Regional Trade Architecture"]
    },
    {
        "name": "Blue Economy & CMEC", 
        "summary": "Maritime policy expert focusing on sustainable fisheries and maritime security in the Indo-Pacific.",
        "skills": ["Marine Policy", "GIS", "Maritime Security", "IORA Framework"],
        "thesis": ["Sustainable Blue Economy Models", "Maritime Connectivity in IORA", "Integrated Coastal Management"]
    },
    {
        "name": "Traditional Medicine (FITM)", 
        "summary": "Public health researcher documenting global health protocols and the integration of AYUSH systems.",
        "skills": ["Public Health", "AYUSH", "Ethnobotany", "Policy Research"],
        "thesis": ["AYUSH in Primary Healthcare", "Standardization of Traditional Medicine", "Global Health Sovereignty"]
    },
    {
        "name": "ASEAN-India (AIC)", 
        "summary": "Regional integration specialist monitoring trade agreements and connectivity corridors in SE Asia.",
        "skills": ["Regional Integration", "Diplomacy", "Geopolitics", "ASEAN Treaties"],
        "thesis": ["ASEAN-India Connectivity Corridors", "Regional Value Chains in SE Asia", "Soft Power in ASEAN Diplomacy"]
    },
    {
        "name": "Development Finance (DAKSHIN)", 
        "summary": "Quantitative economist analyzing debt sustainability and multilateral financing for LDCs.",
        "skills": ["Debt Sustainability", "Macro-modeling", "IMF Data", "Project Finance"],
        "thesis": ["Debt Resilience in Global South", "Multilateral Finance Architecture", "SDG Funding Gaps in LDCs"]
    }
]

UNIS = ["Jawaharlal Nehru University", "Delhi School of Economics", "IIT Delhi", "IIT Bombay", "Madras School of Economics", "TISS Mumbai", "LSE (London)", "National University of Singapore"]
NAMES = ["Aditya", "Priya", "Vikram", "Ananya", "Rohan", "Sanya", "Arjun", "Ishani", "Kabir", "Meera", "Siddharth", "Nisha", "Karan", "Tanvi", "Rahul", "Ayesha", "Deepak", "Riya", "Sanjay", "Nehal"]
SURNAMES = ["Sharma", "Iyer", "Kapoor", "Nair", "Gupta", "Chatterjee", "Reddy", "Verma", "Malhotra", "Joshi", "Singhal", "Mehta"]

# --- PDF CLASS ---
class CV(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 22)
        self.set_text_color(15, 23, 42)
        self.cell(0, 10, self.candidate_name.upper(), new_x="LMARGIN", new_y="NEXT")
        self.set_font('helvetica', '', 10)
        self.set_text_color(100, 116, 139)
        self.cell(0, 5, f"{self.role} | {self.domain['name']}", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 5, f"Email: {self.email} | Mobile: {self.phone}", new_x="LMARGIN", new_y="NEXT")
        self.ln(8)

    def section_title(self, title):
        self.set_font('helvetica', 'B', 13)
        self.set_text_color(30, 41, 59)
        self.set_fill_color(241, 245, 249)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT", fill=True)
        self.ln(4)

    def entry(self, title, subtitle, date, description=""):
        self.set_font('helvetica', 'B', 11)
        self.set_text_color(15, 23, 42)
        self.cell(0, 6, title, new_x="LMARGIN", new_y="NEXT")
        self.set_font('helvetica', 'I', 10)
        self.set_text_color(71, 85, 105)
        self.cell(140, 5, subtitle, new_x="RIGHT", new_y="TOP")
        self.set_font('helvetica', '', 10)
        self.cell(0, 5, date, new_x="LMARGIN", new_y="NEXT", align='R')
        if description:
            self.set_font('helvetica', '', 10)
            self.set_text_color(51, 65, 85)
            self.multi_cell(190, 5, description)
        self.ln(4)

# --- GENERATOR ---
def generate_bulk(count=40):
    output_dir = os.path.join(os.path.dirname(__file__), 'test_resumes')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Generating {count} High-Fidelity CVs...")

    for i in range(count):
        domain = random.choice(DOMAINS)
        first_name = random.choice(NAMES)
        last_name = random.choice(SURNAMES)
        name = f"{first_name} {last_name}"
        email = f"{first_name.lower()}.{last_name.lower()}{random.randint(10,99)}@policy-res.in"
        phone = f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}"
        
        # Decide Hierarchy
        tier = random.choice(['PhD', 'PhD', 'Masters', 'Masters', 'Bachelors'])
        role = "Senior Researcher" if tier == 'PhD' else ("Research Associate" if tier == 'Masters' else "Research Assistant")

        pdf = CV()
        pdf.candidate_name = name
        pdf.domain = domain
        pdf.email = email
        pdf.phone = phone
        pdf.role = role
        pdf.add_page()

        # Summary
        pdf.section_title('PROFESSIONAL SUMMARY')
        pdf.set_font('helvetica', '', 10)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(190, 6, f"{domain['summary']} Proven track record in {', '.join(domain['skills'][:2])} within high-pressure policy environments.")
        pdf.ln(5)

        # Education
        pdf.section_title('EDUCATION')
        if tier == 'PhD':
            pdf.entry('Ph.D. in Research', random.choice(UNIS), '2017 - 2021', f'Thesis: "{random.choice(domain["thesis"])}". Awarded Institutional Fellowship.')
        
        if tier in ['PhD', 'Masters']:
            pdf.entry('Master of Arts/Science', random.choice(UNIS), '2014 - 2016', f'Focus on {domain["name"]} and Quantitative Analysis.')
            
        pdf.entry('Bachelor of Arts/Science', random.choice(UNIS), '2011 - 2014', 'Graduated with Honors. Specialized in Social Sciences.')

        # Experience
        pdf.section_title('PROFESSIONAL EXPERIENCE')
        pdf.entry('Policy Analyst / Consultant', 'National Policy Think Tank', '2021 - Present' if tier == 'PhD' else '2018 - 2021',
                  f'Leading research on {domain["name"]}. Published multiple policy briefs for government stakeholders.')
        if tier != 'Bachelors':
            pdf.entry('Research Intern', 'Regional Cooperation Agency', '2016 - 2017', 
                      'Assisted in data aggregation and regional trend mapping.')

        # Publications
        pdf.section_title('SELECTED PUBLICATIONS')
        pdf.set_font('helvetica', '', 10)
        pub_count = random.randint(1, 4)
        for p_idx in range(pub_count):
            type_p = "Book" if random.random() > 0.85 else "Journal Paper"
            pdf.multi_cell(190, 6, f"{p_idx+1}. [{type_p}] Critical Analysis of {domain['name']} in 21st Century (202{random.randint(0,4)}).")

        # Skills
        pdf.section_title('TECHNICAL SKILLS')
        pdf.set_font('helvetica', 'B', 10)
        pdf.cell(40, 6, 'Analytical Tools:')
        pdf.set_font('helvetica', '', 10)
        pdf.cell(0, 6, ", ".join(domain['skills']), new_x="LMARGIN", new_y="NEXT")
        
        filename = f"CV_{i+1}_{name.replace(' ', '_')}.pdf"
        pdf.output(os.path.join(output_dir, filename))
        if (i+1) % 10 == 0:
            print(f"Generated {i+1}/40...")

    print(f"\nCompleted! 40 Detailed, High-Fidelity CVs generated in: {output_dir}")

if __name__ == "__main__":
    generate_bulk(40)
