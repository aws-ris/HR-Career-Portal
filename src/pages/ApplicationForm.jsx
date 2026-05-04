import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE as API } from '../api';

export default function ApplicationForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState('');
  const [jobDetail, setJobDetail] = useState(null);

  // Fetch Job details if ID is present
  useEffect(() => {
    if (jobId) {
      fetch(`${API}/public/jobs/${jobId}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setJobDetail(data);
            setPosition(data.position); // Lock to the job's position
          }
        })
        .catch(err => console.error("Error fetching job:", err));
    }
  }, [jobId]);
  // Step 1
  const [position_applied, setPosition] = useState('Professor');
  const [admin_department, setAdminDept] = useState('IT');
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile_number, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [candidateState, setCandidateState] = useState('');
  const [description, setDesc] = useState('');

  // Step 2
  const [classX, setClassX] = useState('');
  const [classXII, setClassXII] = useState('');
  
  const [grads, setGrads] = useState([{ university: '', degree_name: '', score_type: 'Percentage', score_value: '' }]);
  const [postGrads, setPostGrads] = useState([{ university: '', degree_name: '', score_type: 'Percentage', score_value: '' }]);
  const [doctorates, setDoctorates] = useState([{ university: '', thesis_title: '', score_type: 'Percentage', score_value: '' }]);

  // Step 3
  const [pubTypes, setPubTypes] = useState({ none: true, books: false, chapters: false, papers: false });
  const [books, setBooks] = useState([{ title: '' }]);
  const [chapters, setChapters] = useState([{ title: '', parent_title: '' }]);
  const [papers, setPapers] = useState([{ title: '' }]);
  const [scholarLink, setScholarLink] = useState('');
  const [totalExperienceYears, setTotalExperienceYears] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  // Step 4
  const [hasWork, setHasWork] = useState(false);
  const [workExps, setWorkExps] = useState([{ company_name: '', start_date: '', end_date: '', role: '', description: '' }]);

  const addEntry = (setter, state, max) => {
    if (state.length < max) setter([...state, { ...state[0] }]);
  };

  const updateEntry = (setter, state, index, field, value) => {
    const fresh = [...state];
    fresh[index][field] = value;
    setter(fresh);
  };

  const countWords = (str) => str.trim().split(/\s+/).filter(Boolean).length;

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1 && countWords(description) > 100) return alert("Description must not exceed 100 words.");
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    
    let educations = [];
    let eduOrder = 1;
    grads.forEach(g => { if(g.university) educations.push({...g, level: 'Bachelors', entry_order: eduOrder++}) });
    postGrads.forEach(g => { if(g.university) educations.push({...g, level: 'Masters', entry_order: eduOrder++}) });
    doctorates.forEach(g => { if(g.university) educations.push({...g, level: 'Doctorate', entry_order: eduOrder++}) });

    let publications = [];
    let pubOrder = 1;
    if (!pubTypes.none) {
      if(pubTypes.books) books.forEach(b => { if(b.title) publications.push({ type: 'Book', title: b.title, entry_order: pubOrder++ }) });
      if(pubTypes.chapters) chapters.forEach(c => { if(c.title) publications.push({ type: 'Chapter', title: c.title, parent_title: c.parent_title, entry_order: pubOrder++ }) });
      if(pubTypes.papers) papers.forEach(p => { if(p.title) publications.push({ type: 'Paper', title: p.title, entry_order: pubOrder++ }) });
    }

    let works = [];
    let workOrder = 1;
    if (hasWork) {
      workExps.forEach(w => { if(w.company_name) works.push({...w, entry_order: workOrder++}) });
    }

    const payload = {
      job_id: jobId || null,
      full_name, 
      dob, 
      email, 
      mobile_no: mobile_number, // Backend expects mobile_no
      about: description,       // Backend expects about
      gender: gender || null,
      state: candidateState || null,
      years_of_experience: totalExperienceYears ? parseFloat(totalExperienceYears) : 0,
      position_applied, 
      admin_department: position_applied === 'Admin' ? admin_department : null,
      schooling: {
        class_x_percentage: parseFloat(classX), 
        class_xii_percentage: parseFloat(classXII)
      },
      higher_education: educations.map(e => ({
        ...e,
        level: e.level === 'Bachelors' ? 'undergrad' : (e.level === 'Masters' ? 'postgrad' : 'phd')
      })),
      publications: publications.map(p => ({
        pub_type: p.type.toLowerCase(), // Backend expects enum values
        title: p.title,
        parent_book: p.parent_title || null,
        entry_order: p.entry_order
      })),
      work_experiences: works.map(w => ({
        ...w,
        start_date: w.start_date,
        end_date: w.end_date || null
      }))
    };

    try {
      const res = await fetch(`${API}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        const data = await res.json();
        
        // Upload resume if selected
        if (resumeFile && data.id) {
          const formData = new FormData();
          formData.append("file", resumeFile);
          
          try {
            await fetch(`${API}/applications/${data.id}/resume`, {
              method: 'POST',
              body: formData
            });
          } catch(err) {
            console.error("Resume upload failed:", err);
          }
        }
        
        alert("Application Successfully Submitted!");
        window.location.reload();
      } else {
        const err = await res.json();
        setSubmitError("Database Rejection: " + JSON.stringify(err));
      }
    } catch (err) {
      setSubmitError("Could not connect to Backend. Ensure uvicorn is running on port 8000.");
    }
  };

  const dividerStyle = { border: '0', borderTop: '1px solid var(--border-color)', margin: '2rem 0' };

  return (
    <div className="app-container">
      <header className="app-header">
        <img src="/logo.jpg" alt="RIS Logo" className="header-logo" />
        <h1 className="header-title">Apply to the RIS</h1>
        {jobDetail ? (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
             <p style={{ margin: 0, fontWeight: 700, color: '#0369a1' }}>Applying for: {jobDetail.title}</p>
             <p style={{ margin: 0, fontSize: '0.875rem', color: '#0c4a6e' }}>Division: {jobDetail.division}</p>
          </div>
        ) : (
          <p className="header-subtitle">Thank you for showing interest in joining our institution.</p>
        )}
      </header>

      <main className="main-container">
        <div className="step-indicator">
          <span className={`step-pill ${step >= 1 ? 'active' : ''}`}>1. Info</span>
          <span className={`step-pill ${step >= 2 ? 'active' : ''}`}>2. Education</span>
          <span className={`step-pill ${step >= 3 ? 'active' : ''}`}>3. Publications</span>
          <span className={`step-pill ${step >= 4 ? 'active' : ''}`}>4. Work & Submit</span>
        </div>

        {submitError && <div style={{background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>{submitError}</div>}

        <form onSubmit={step === 4 ? handleSubmit : handleNext}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Position Applied For</label>
                <select className="form-input" value={position_applied} onChange={e => setPosition(e.target.value)}>
                  <option>Professor</option>
                  <option>Associate Professor</option>
                  <option>Assistant Professor</option>
                  <option>Consultant</option>
                  <option>Research Assistant</option>
                  <option>Admin</option>
                </select>
              </div>

              {position_applied === 'Admin' && (
                <div className="form-group" style={{marginTop: '-0.5rem'}}>
                  <label className="form-label">Department</label>
                  <select className="form-input" value={admin_department} onChange={e => setAdminDept(e.target.value)}>
                    <option>IT</option>
                    <option>HR</option>
                    <option>Finance</option>
                    <option>Library</option>
                    <option>Other</option>
                  </select>
                </div>
              )}

              <hr style={dividerStyle} />

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input required className="form-input" value={full_name} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID</label>
                  <input required type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number (10 Digits)</label>
                  <input required className="form-input" pattern="^\d{10}$" value={mobile_number} onChange={e => setMobile(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input required type="date" className="form-input" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select required className="form-input" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">State / Union Territory</label>
                  <select required className="form-input" value={candidateState} onChange={e => setCandidateState(e.target.value)}>
                    <option value="">Select State / UT</option>
                    {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tell Us About Yourself (Max 100 Words)</label>
                <textarea required className="form-input" value={description} onChange={e => setDesc(e.target.value)} />
                <div className="error-text">Current Word Count: {countWords(description)}/100</div>
              </div>

              <button type="submit" className="btn-primary" style={{width: '100%'}}>Proceed to Education Options</button>
            </>
          )}

          {step === 2 && (
            <>
              <h3>Basic Schooling</h3>
              <div className="form-grid" style={{marginTop: '1rem'}}>
                <div className="form-group">
                  <label className="form-label">Secondary School / Class X Percentage</label>
                  <input required type="number" step="0.01" max="100" className="form-input" value={classX} onChange={e => setClassX(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Senior Secondary / Class XII Percentage</label>
                  <input required type="number" step="0.01" max="100" className="form-input" value={classXII} onChange={e => setClassXII(e.target.value)} />
                </div>
              </div>

              <hr style={dividerStyle} />

              <h3 style={{marginBottom: '1rem'}}>Graduation Details</h3>
              {grads.map((g, i) => (
                <div className="form-grid" key={i} style={{marginBottom: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px'}}>
                  <div className="form-group"><label className="form-label">University</label><input required className="form-input" value={g.university} onChange={e => updateEntry(setGrads, grads, i, 'university', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Degree Name</label><input required className="form-input" value={g.degree_name} onChange={e => updateEntry(setGrads, grads, i, 'degree_name', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Score Type</label><select className="form-input" value={g.score_type} onChange={e => updateEntry(setGrads, grads, i, 'score_type', e.target.value)}><option>Percentage</option><option>CGPA</option></select></div>
                  <div className="form-group"><label className="form-label">Score (&lt;= {g.score_type==='Percentage' ? '100' : '10'})</label><input required type="number" step="0.01" className="form-input" value={g.score_value} onChange={e => updateEntry(setGrads, grads, i, 'score_value', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn-secondary" disabled={grads.length>=3} onClick={() => addEntry(setGrads, grads, 3)}>+ Add Graduation Detail</button>

              <hr style={dividerStyle} />

              <h3 style={{marginBottom: '1rem'}}>Post Graduation Details</h3>
              {postGrads.map((g, i) => (
                <div className="form-grid" key={i} style={{marginBottom: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px'}}>
                  <div className="form-group"><label className="form-label">University</label><input className="form-input" value={g.university} onChange={e => updateEntry(setPostGrads, postGrads, i, 'university', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Degree Name</label><input className="form-input" value={g.degree_name} onChange={e => updateEntry(setPostGrads, postGrads, i, 'degree_name', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Score Type</label><select className="form-input" value={g.score_type} onChange={e => updateEntry(setPostGrads, postGrads, i, 'score_type', e.target.value)}><option>Percentage</option><option>CGPA</option></select></div>
                  <div className="form-group"><label className="form-label">Score</label><input type="number" step="0.01" className="form-input" value={g.score_value} onChange={e => updateEntry(setPostGrads, postGrads, i, 'score_value', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn-secondary" disabled={postGrads.length>=3} onClick={() => addEntry(setPostGrads, postGrads, 3)}>+ Add Post Graduation</button>

              <hr style={dividerStyle} />

              <h3 style={{marginBottom: '1rem'}}>Doctorate Details</h3>
              {doctorates.map((g, i) => (
                <div className="form-grid" key={i} style={{marginBottom: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px'}}>
                  <div className="form-group"><label className="form-label">University</label><input className="form-input" value={g.university} onChange={e => updateEntry(setDoctorates, doctorates, i, 'university', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Thesis Title</label><input className="form-input" value={g.thesis_title} onChange={e => updateEntry(setDoctorates, doctorates, i, 'thesis_title', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Score Type</label><select className="form-input" value={g.score_type} onChange={e => updateEntry(setDoctorates, doctorates, i, 'score_type', e.target.value)}><option>Percentage</option><option>CGPA</option></select></div>
                  <div className="form-group"><label className="form-label">Score</label><input type="number" step="0.01" className="form-input" value={g.score_value} onChange={e => updateEntry(setDoctorates, doctorates, i, 'score_value', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn-secondary" disabled={doctorates.length>=3} onClick={() => addEntry(setDoctorates, doctorates, 3)}>+ Add Doctorate</button>

              <div style={{display: 'flex'}}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Proceed to Publications</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3>Publications / Works Authored</h3>
              <p style={{marginBottom: '1rem', color: 'var(--text-secondary)'}}>Select all that apply:</p>
              <div style={{display: 'flex', gap: '2rem', marginBottom: '2rem'}}>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" checked={pubTypes.none} onChange={e => setPubTypes({...pubTypes, none: e.target.checked, books: false, chapters: false, papers: false})} /> None</label>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" checked={pubTypes.books} onChange={e => setPubTypes({...pubTypes, books: e.target.checked, none: false})} /> Books</label>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" checked={pubTypes.chapters} onChange={e => setPubTypes({...pubTypes, chapters: e.target.checked, none: false})} /> Chapters in Books</label>
                <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" checked={pubTypes.papers} onChange={e => setPubTypes({...pubTypes, papers: e.target.checked, none: false})} /> Papers</label>
              </div>

              {pubTypes.books && (
                <div style={{marginBottom: '2rem'}}>
                  <h4>Books Authored</h4>
                  {books.map((b, i) => (
                    <div className="form-group" key={i}><input className="form-input" placeholder="Book Title" value={b.title} onChange={e => updateEntry(setBooks, books, i, 'title', e.target.value)} /></div>
                  ))}
                  <button type="button" className="btn-secondary" disabled={books.length>=3} onClick={() => addEntry(setBooks, books, 3)}>+ Add Book</button>
                </div>
              )}

              {pubTypes.chapters && (
                <div style={{marginBottom: '2rem'}}>
                  <h4>Chapters in Books</h4>
                  {chapters.map((c, i) => (
                    <div className="form-grid" key={i}>
                      <div className="form-group"><input className="form-input" placeholder="Chapter Name" value={c.title} onChange={e => updateEntry(setChapters, chapters, i, 'title', e.target.value)} /></div>
                      <div className="form-group"><input className="form-input" placeholder="Corresponding Book" value={c.parent_title} onChange={e => updateEntry(setChapters, chapters, i, 'parent_title', e.target.value)} /></div>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" disabled={chapters.length>=3} onClick={() => addEntry(setChapters, chapters, 3)}>+ Add Chapter</button>
                </div>
              )}

              {pubTypes.papers && (
                <div style={{marginBottom: '2rem'}}>
                  <h4>Papers</h4>
                  {papers.map((p, i) => (
                    <div className="form-group" key={i}><input className="form-input" placeholder="Paper Title" value={p.title} onChange={e => updateEntry(setPapers, papers, i, 'title', e.target.value)} /></div>
                  ))}
                  <button type="button" className="btn-secondary" disabled={papers.length>=3} onClick={() => addEntry(setPapers, papers, 3)}>+ Add Paper</button>
                </div>
              )}

              <hr style={dividerStyle} />
              <div className="form-group">
                <label className="form-label">Google Scholar Link (Optional)</label>
                <input type="url" className="form-input" value={scholarLink} onChange={e => setScholarLink(e.target.value)} />
              </div>

              <div style={{display: 'flex'}}>
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Proceed to Work Experience</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3>Work Experience Details</h3>
              <p style={{marginBottom: '1rem'}}>Do you have prior work experience?</p>
              <div className="form-group" style={{marginBottom: '2rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
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
              </div>

              {hasWork && (
                <div style={{marginBottom: '2rem'}}>
                  {workExps.map((w, i) => (
                    <div key={i} style={{marginBottom: '1.5rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px'}}>
                      <div className="form-grid">
                        <div className="form-group"><label className="form-label">Company Name</label><input required className="form-input" value={w.company_name} onChange={e => updateEntry(setWorkExps, workExps, i, 'company_name', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Position Held</label><input required className="form-input" value={w.role} onChange={e => updateEntry(setWorkExps, workExps, i, 'role', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Start Date</label><input required type="date" className="form-input" value={w.start_date} onChange={e => updateEntry(setWorkExps, workExps, i, 'start_date', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">End Date (Leave blank if present)</label><input type="date" className="form-input" value={w.end_date} onChange={e => updateEntry(setWorkExps, workExps, i, 'end_date', e.target.value)} /></div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Brief about work done there (Max 40 Words)</label>
                        <textarea required className="form-input" value={w.description} onChange={e => updateEntry(setWorkExps, workExps, i, 'description', e.target.value)} />
                        <div className="error-text">Current: {countWords(w.description)}/40</div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" disabled={workExps.length>=3} onClick={() => addEntry(setWorkExps, workExps, 3)}>+ Add Recent Work Experience</button>
                </div>
              )}

              <hr style={dividerStyle} />
              <div style={{display: 'flex'}}>
                <button type="button" className="btn-secondary" onClick={() => setStep(3)}>Back</button>
                <button type="submit" className="btn-primary" style={{flex: 1, backgroundColor: 'var(--brand-accent)', color: '#000'}}>Final Submit Form</button>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
