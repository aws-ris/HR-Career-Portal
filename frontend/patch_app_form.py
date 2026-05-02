import sys

with open(r'c:\Users\Viraal\Desktop\HRForm\frontend\src\pages\ApplicationForm.jsx', 'r') as f:
    content = f.read()

# Add State variables
state_target = "  const [scholarLink, setScholarLink] = useState('');"
state_replace = """  const [scholarLink, setScholarLink] = useState('');
  const [totalExperienceYears, setTotalExperienceYears] = useState('');
  const [resumeFile, setResumeFile] = useState(null);"""
content = content.replace(state_target, state_replace, 1)

# Add to payload
payload_target = """      google_scholar_link: scholarLink || null,"""
payload_replace = """      google_scholar_link: scholarLink || null,
      total_experience_years: totalExperienceYears ? parseFloat(totalExperienceYears) : null,"""
content = content.replace(payload_target, payload_replace, 1)

# Handle submit to upload resume
submit_target = """      if(res.ok) {
        alert("Application Successfully Submitted!");
        window.location.reload();
      } else {"""
submit_replace = """      if(res.ok) {
        const data = await res.json();
        
        // Upload resume if selected
        if (resumeFile && data.id) {
          const formData = new FormData();
          formData.append("file", resumeFile);
          
          try {
            await fetch(`http://localhost:8000/api/v1/applications/${data.id}/resume`, {
              method: 'POST',
              body: formData
            });
          } catch(err) {
            console.error("Resume upload failed:", err);
          }
        }
        
        alert("Application Successfully Submitted!");
        window.location.reload();
      } else {"""
content = content.replace(submit_target, submit_replace, 1)

# Add UI fields in Step 4
ui_target = """              <div style={{display: 'flex', gap: '2rem', marginBottom: '2rem'}}>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="radio" name="has_work" checked={hasWork} onChange={() => setHasWork(true)} /> Yes</label>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="radio" name="has_work" checked={!hasWork} onChange={() => setHasWork(false)} /> No</label>
              </div>"""
ui_replace = """              <div className="form-group" style={{marginBottom: '2rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <label className="form-label" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  Upload Resume (PDF) - REQUIRED FOR AI MATCHING
                </label>
                <input required type="file" accept=".pdf" className="form-input" onChange={e => setResumeFile(e.target.files[0])} />
                <div style={{fontSize: '12px', color: '#64748b', marginTop: '4px'}}>Your resume will be parsed by our AI system for semantic matching.</div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Years of Experience</label>
                <input required type="number" step="0.5" min="0" className="form-input" placeholder="e.g. 5.5" value={totalExperienceYears} onChange={e => setTotalExperienceYears(e.target.value)} />
              </div>

              <p style={{marginBottom: '1rem'}}>Do you want to add specific detailed work entries below?</p>
              <div style={{display: 'flex', gap: '2rem', marginBottom: '2rem'}}>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="radio" name="has_work" checked={hasWork} onChange={() => setHasWork(true)} /> Yes</label>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="radio" name="has_work" checked={!hasWork} onChange={() => setHasWork(false)} /> No</label>
              </div>"""
content = content.replace(ui_target, ui_replace, 1)

with open(r'c:\Users\Viraal\Desktop\HRForm\frontend\src\pages\ApplicationForm.jsx', 'w') as f:
    f.write(content)
print("ApplicationForm.jsx patched successfully.")
