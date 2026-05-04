
try:
    from fpdf import FPDF
except ImportError:
    import os
    os.system('pip install fpdf2')
    from fpdf import FPDF

class CV(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 24)
        self.set_text_color(15, 23, 42) # Deep Navy
        self.cell(0, 10, 'DR. ARJUN SUBRAMANIAN', ln=True, align='L')
        self.set_font('helvetica', '', 10)
        self.set_text_color(100, 116, 139) # Slate Grey
        self.cell(0, 5, 'Senior Research Fellow | International Trade & G20 Policy', ln=True)
        self.cell(0, 5, 'Email: arjun.subramanian@synthetic-res.in | Mobile: +91 98765 43210', ln=True)
        self.ln(10)

    def section_title(self, title):
        self.set_font('helvetica', 'B', 14)
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
            self.ln(1)
            self.set_font('helvetica', '', 10)
            self.set_text_color(51, 65, 85)
            self.multi_cell(190, 5, description)
        self.ln(4)

def generate_cv():
    pdf = CV()
    pdf.add_page()
    
    pdf.section_title('PROFESSIONAL SUMMARY')
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(190, 6, "A result-oriented researcher with over 12 years of experience in International Trade Policy, South-South Cooperation, and Development Economics. Proven expertise in quantitative modeling and analyzing global value chains (GVCs). Actively involved in policy advisory for G20 frameworks and regional trade agreements.")
    pdf.ln(5)

    pdf.section_title('EDUCATION')
    pdf.entry('Ph.D. in International Economics', 'Jawaharlal Nehru University (JNU), New Delhi', '2012 - 2017', 
              'Thesis: "Impact of Digital Transformation on Global Value Chains in Emerging Economies." Awarded the ICSSR Institutional Fellowship.')
    pdf.entry('M.Phil. in Economics', 'Delhi School of Economics, University of Delhi', '2010 - 2012', 
              'Focus on Econometric Modeling and International Finance.')
    pdf.entry('M.A. in Economics', 'Madras School of Economics', '2008 - 2010', 'Specialization in Trade and Environment.')

    pdf.section_title('PROFESSIONAL EXPERIENCE')
    pdf.entry('Senior Policy Analyst', 'Observer Research Foundation (ORF)', '2018 - Present',
              'Lead researcher for the Trade and Investment track. Published over 15 policy briefs for India\'s G20 Presidency. Specialized in trade-tech interface and digital services trade.')
    pdf.entry('Research Consultant', 'UNESCAP (Regional Office)', '2017 - 2018',
              'Assisted in drafting the "Asia-Pacific Trade and Investment Report." Conducted large-scale data cleaning and structural gravity modeling for ASEAN nations.')

    pdf.section_title('SELECTED PUBLICATIONS')
    pdf.set_font('helvetica', '', 10)
    pdf.multi_cell(190, 6, '1. Subramanian, A. (2022). "The Future of South-South Trade: A Digital Perspective." Journal of International Trade & Economic Development.')
    pdf.multi_cell(190, 6, '2. Subramanian, A. & Gupta, R. (2020). "Global Value Chains and LDCs: Overcoming Infrastructure Gaps." RIS Policy Brief Series.')
    pdf.multi_cell(190, 6, '3. Authored Chapter: "Digital Connectivity in the Bay of Bengal" in Connectivity and Maritime Cooperation (2021).')

    pdf.section_title('SKILLS')
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(40, 6, 'Analytical Tools:')
    pdf.set_font('helvetica', '', 10)
    pdf.cell(0, 6, 'STATA, R, Python (Pandas/NumPy), Tableau', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(40, 6, 'Languages:')
    pdf.set_font('helvetica', '', 10)
    pdf.cell(0, 6, 'English (Native), Hindi, Tamil, Basic French', new_x="LMARGIN", new_y="NEXT")

    output_path = os.path.join(os.path.dirname(__file__), 'sample_resume_arjun.pdf')
    pdf.output(output_path)
    print(f"✅ Professional Synthetic CV generated: {output_path}")

if __name__ == '__main__':
    import os
    generate_cv()
