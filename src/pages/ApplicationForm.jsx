import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE as API } from '../api';
import { CheckCircle2 } from 'lucide-react';

export default function ApplicationForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  // Load draft safely from localStorage (Error prevention / Autosave)
  const savedDraft = (() => {
    try {
      const draft = JSON.parse(localStorage.getItem('hr_application_draft') || '{}');
      if (draft.jobId === jobId) {
        return draft;
      }
    } catch (e) {
      console.error("Error loading application draft:", e);
    }
    return {};
  })();

  const [step, setStep] = useState(() => savedDraft.step !== undefined ? savedDraft.step : (jobId ? 0 : 1));
  const [submitError, setSubmitError] = useState('');
  const [jobDetail, setJobDetail] = useState(null);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Step 1
  const [position_applied, setPosition] = useState(() => savedDraft.position_applied || 'Professor');
  const [admin_department, setAdminDept] = useState(() => savedDraft.admin_department || 'IT');
  const [full_name, setFullName] = useState(() => savedDraft.full_name || '');
  const [email, setEmail] = useState(() => savedDraft.email || '');
  const [mobile_number, setMobile] = useState(() => savedDraft.mobile_number || '');
  const [dob, setDob] = useState(() => savedDraft.dob || '');
  const [gender, setGender] = useState(() => savedDraft.gender || '');
  const [candidateState, setCandidateState] = useState(() => savedDraft.candidateState || '');
  const [city, setCity] = useState(() => savedDraft.city || '');
  const [pincode, setPincode] = useState(() => savedDraft.pincode || '');
  const [extracurriculars, setExtracurriculars] = useState(() => savedDraft.extracurriculars || '');
  const [dobError, setDobError] = useState('');

  // Step 2
  const [classX, setClassX] = useState(() => savedDraft.classX || '');
  const [classXII, setClassXII] = useState(() => savedDraft.classXII || '');
  const [grads, setGrads] = useState(() => savedDraft.grads || [{ university: '', degree_name: '', score_type: 'Percentage', score_value: '' }]);
  const [postGrads, setPostGrads] = useState(() => savedDraft.postGrads || [{ university: '', degree_name: '', score_type: 'Percentage', score_value: '' }]);
  const [doctorates, setDoctorates] = useState(() => savedDraft.doctorates || [{ university: '', thesis_title: '', score_type: 'Percentage', score_value: '' }]);

  // Step 3
  const [pubTypes, setPubTypes] = useState(() => savedDraft.pubTypes || { none: true, books: false, chapters: false, papers: false });
  const [books, setBooks] = useState(() => savedDraft.books || [{ title: '' }]);
  const [chapters, setChapters] = useState(() => savedDraft.chapters || [{ title: '', parent_title: '' }]);
  const [papers, setPapers] = useState(() => savedDraft.papers || [{ title: '' }]);
  const [scholarLink, setScholarLink] = useState(() => savedDraft.scholarLink || '');
  const [expYears, setExpYears] = useState(() => savedDraft.expYears || '');
  const [expMonths, setExpMonths] = useState(() => savedDraft.expMonths || '');
  const [resumeFile, setResumeFile] = useState(null);

  // Step 4
  const [hasWork, setHasWork] = useState(() => savedDraft.hasWork || false);
  const [workExps, setWorkExps] = useState(() => savedDraft.workExps || [{ company_name: '', start_date: '', end_date: '', role: '', description: '' }]);

  // Fetch Job details if ID is present
  useEffect(() => {
    if (jobId) {
      fetch(`${API}/public/jobs/${jobId}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setJobDetail(data);
            if (savedDraft.position_applied === undefined) {
              setPosition(data.position);
            }
          }
        })
        .catch(err => console.error("Error fetching job:", err));
    }
  }, [jobId]);

  // Sync to localStorage
  useEffect(() => {
    const draft = {
      jobId,
      position_applied,
      admin_department,
      full_name,
      email,
      mobile_number,
      dob,
      gender,
      candidateState,
      city,
      pincode,
      extracurriculars,
      classX,
      classXII,
      grads,
      postGrads,
      doctorates,
      pubTypes,
      books,
      chapters,
      papers,
      scholarLink,
      expYears,
      expMonths,
      hasWork,
      workExps,
      step
    };
    localStorage.setItem('hr_application_draft', JSON.stringify(draft));
  }, [
    position_applied, admin_department, full_name, email, mobile_number, dob, gender,
    candidateState, city, pincode, extracurriculars, classX, classXII, grads,
    postGrads, doctorates, pubTypes, books, chapters, papers, scholarLink,
    expYears, expMonths, hasWork, workExps, step, jobId
  ]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const validateDob = (val) => {
    if (!val) return '';
    const parts = val.split('/');
    
    // Day validation
    if (parts[0]) {
      const dayStr = parts[0];
      if (dayStr.length === 2) {
        const d = parseInt(dayStr, 10);
        if (isNaN(d) || d < 1 || d > 31) {
          return 'Day (DD) must be between 01 and 31.';
        }
      }
    }
    
    // Month validation
    if (parts[1]) {
      const monthStr = parts[1];
      if (monthStr.length === 2) {
        const m = parseInt(monthStr, 10);
        if (isNaN(m) || m < 1 || m > 12) {
          return 'Month (MM) must be between 01 and 12.';
        }
      }
    }
    
    // Year validation
    if (parts[2]) {
      const yearStr = parts[2];
      if (yearStr.length === 4) {
        const y = parseInt(yearStr, 10);
        const currentYear = new Date().getFullYear();
        if (isNaN(y) || y < 1900) {
          return 'Year (YYYY) must be 1900 or later.';
        }
        if (y > currentYear) {
          return `Year (YYYY) cannot be greater than the current year (${currentYear}).`;
        }
        
        // Calendar date validation
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const maxDays = new Date(y, m, 0).getDate();
        if (d > maxDays) {
          return `Invalid date: ${parts[0]} is not a valid day for month ${parts[1]} in ${y}.`;
        }
        
        // Future date check
        const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (new Date(formatted) > new Date()) {
          return 'Date of Birth cannot be in the future.';
        }
      }
    }
    
    if (val.length === 10) {
      if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
        return 'Please enter Date of Birth in DD/MM/YYYY format.';
      }
    }
    
    return '';
  };

  // Date of Birth auto-formatting typing mask
  const handleDobChange = (e) => {
    const val = e.target.value;
    const isDeleting = val.length < dob.length;
    
    if (isDeleting) {
      if (dob.endsWith('/') && val.length === dob.length - 1) {
        const nextVal = val.slice(0, -1);
        setDob(nextVal);
        setDobError(validateDob(nextVal));
      } else {
        setDob(val);
        setDobError(validateDob(val));
      }
      return;
    }
    
    let cleaned = val.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length === 2) {
      formatted = cleaned + '/';
    } else if (cleaned.length > 2 && cleaned.length < 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    } else if (cleaned.length === 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/';
    } else if (cleaned.length > 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    }
    
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }
    setDob(formatted);
    setDobError(validateDob(formatted));
  };



  const addEntry = (setter, state, max, template) => {
    if (state.length < max) setter([...state, { ...template }]);
  };

  const updateEntry = (setter, state, index, field, value) => {
    const fresh = [...state];
    fresh[index][field] = value;
    setter(fresh);
  };

  const countWords = (str) => str.trim().split(/\s+/).filter(Boolean).length;

  const handleNext = (e) => {
    e.preventDefault();
    setTriedSubmit(true);
    
    // Check required fields for Step 1 (extracurriculars is optional)
    if (step === 1) {
      if (!full_name || !email || !mobile_number || !dob || !gender || !candidateState || !city || !pincode) {
         return; // Let CSS handle the red borders
      }
      
      // DOB Validation
      const dobParts = dob.split('/');
      if (dobParts.length !== 3 || dobParts[0].length !== 2 || dobParts[1].length !== 2 || dobParts[2].length !== 4) {
        return alert("Please enter Date of Birth in DD/MM/YYYY format.");
      }
      const dobErr = validateDob(dob);
      if (dobErr) {
        setDobError(dobErr);
        return alert(dobErr);
      }
      const day = parseInt(dobParts[0], 10);
      const month = parseInt(dobParts[1], 10);
      const year = parseInt(dobParts[2], 10);
      
      if (isNaN(day) || day < 1 || day > 31) {
        return alert("Day (DD) must be between 01 and 31.");
      }
      if (isNaN(month) || month < 1 || month > 12) {
        return alert("Month (MM) must be between 01 and 12.");
      }
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        return alert(`Year (YYYY) must be between 1900 and ${currentYear}.`);
      }
      const maxDays = new Date(year, month, 0).getDate();
      if (day > maxDays) {
        return alert("Please enter a valid Date of Birth for the given month.");
      }
      const formattedDob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (new Date(formattedDob) > new Date()) {
        return alert("Date of Birth cannot be in the future.");
      }

      // Pincode validation
      if (!/^\d{6}$/.test(pincode)) {
        return alert("Pincode must be exactly 6 digits.");
      }

      // City validation (min 2 chars, letters and spaces only)
      if (!/^[a-zA-Z\s]{2,100}$/.test(city.trim())) {
        return alert("City must be at least 2 characters and contain only letters.");
      }

      if (extracurriculars && countWords(extracurriculars) > 100) {
        return alert("Extracurriculars must not exceed 100 words.");
      }
    }
    
    setStep(step + 1);
    setTriedSubmit(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTriedSubmit(true);
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

    // Convert Years/Months to Float
    const totalYrs = (parseFloat(expYears) || 0) + ((parseFloat(expMonths) || 0) / 12);

    // Convert DD/MM/YYYY to YYYY-MM-DD
    const dobParts = dob.split('/');
    const formattedDob = `${dobParts[2]}-${dobParts[1].padStart(2, '0')}-${dobParts[0].padStart(2, '0')}`;

    const payload = {
      job_id: jobId || null,
      full_name, 
      dob: formattedDob, 
      email, 
      mobile_no: mobile_number, 
      about: null,
      extracurriculars: extracurriculars.trim() || null,
      gender: gender || null,
      state: candidateState || null,
      city: city || null,
      pincode: pincode || null,
      years_of_experience: totalYrs,
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
        pub_type: p.type.toLowerCase(),
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
        if (resumeFile && data.id) {
          const formData = new FormData();
          formData.append("file", resumeFile);
          try {
            await fetch(`${API}/applications/${data.id}/resume`, {
              method: 'POST',
              body: formData
            });
          } catch(err) { console.error("Resume upload failed:", err); }
        }
        alert("Application Successfully Submitted!");
        localStorage.removeItem('hr_application_draft');
        navigate("/");
      } else {
        let errMessage = "Unknown Error";
        try {
          const err = await res.json();
          errMessage = err.detail || JSON.stringify(err);
        } catch (jsonErr) {
          errMessage = `Status ${res.status}: ${res.statusText || 'Internal Server Error'}`;
        }
        setSubmitError("Database Rejection: " + errMessage);
      }
    } catch (err) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setSubmitError("Could not connect to Backend. Ensure uvicorn is running on port 8000.");
      } else {
        setSubmitError("Could not connect to the server. Please check your internet connection or try again later.");
      }
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
        <div className="step-indicator" style={{ display: step === 0 ? 'none' : 'flex' }}>
          <span className={`step-pill ${step >= 1 ? 'active' : ''}`}>1. Info</span>
          <span className={`step-pill ${step >= 2 ? 'active' : ''}`}>2. Education</span>
          <span className={`step-pill ${step >= 3 ? 'active' : ''}`}>3. Publications</span>
          <span className={`step-pill ${step >= 4 ? 'active' : ''}`}>4. Work & Submit</span>
        </div>

        {submitError && <div style={{background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>{submitError}</div>}

        {jobDetail && (step === 0 || step >= 1) && (
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Terms & Conditions of Employment</h2>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
              Please review the specific constraints and offerings for the <strong>{jobDetail.title}</strong> position:
            </p>
            <ul style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <li><strong>Remuneration (Pay Band):</strong> ₹{(jobDetail.min_pay || 20000).toLocaleString()} to ₹{(jobDetail.max_pay || 40000).toLocaleString()} per month.</li>
              <li><strong>Required Experience:</strong> {jobDetail.min_experience || 0} to {jobDetail.max_experience || 2} years of experience.</li>
              <li><strong>Contract Duration:</strong> {jobDetail.contract_period || 1} {jobDetail.contract_period === 1 ? 'year' : 'years'}</li>
              <li><strong>Job Mode:</strong> Offline</li>
            </ul>
            
            {step === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#0f172a', cursor: 'pointer' }}>
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0f172a' }} />
                  <strong>I have read and accept these terms and conditions.</strong>
                </label>
                <button 
                  onClick={() => setStep(1)} 
                  disabled={!termsAccepted}
                  style={{ background: termsAccepted ? '#0f172a' : '#cbd5e1', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: termsAccepted ? 'pointer' : 'not-allowed', alignSelf: 'flex-start' }}
                >
                  Proceed to Application
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> Terms Accepted
              </div>
            )}
          </div>
        )}

        <form onSubmit={step === 4 ? handleSubmit : handleNext} style={{ display: step === 0 ? 'none' : 'block' }}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Position Applied For {jobId && <span style={{fontSize: '10px', color: '#6366f1'}}>(Locked for this Job Link)</span>}</label>
                <select 
                  className="form-input" 
                  value={position_applied} 
                  onChange={e => setPosition(e.target.value)}
                  disabled={!!jobId}
                  style={jobId ? { backgroundColor: '#f8fafc', cursor: 'not-allowed' } : {}}
                >
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
                  <select 
                    className="form-input" 
                    value={admin_department} 
                    onChange={e => setAdminDept(e.target.value)}
                    disabled={!!jobId}
                  >
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
                  <input 
                    required 
                    className={`form-input ${(triedSubmit && !full_name) ? 'faulty-input' : ''}`} 
                    value={full_name} 
                    onChange={e => setFullName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID</label>
                  <input 
                    required 
                    type="email" 
                    className={`form-input ${(triedSubmit && !email) ? 'faulty-input' : ''}`} 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number (10 Digits)</label>
                  <input 
                    required 
                    className={`form-input ${(triedSubmit && !mobile_number) ? 'faulty-input' : ''}`} 
                    pattern="^\d{10}$" 
                    value={mobile_number} 
                    onChange={e => setMobile(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth (DD/MM/YYYY)</label>
                  <input 
                    required 
                    placeholder="DD/MM/YYYY"
                    className={`form-input ${(triedSubmit && (!dob || dobError)) ? 'faulty-input' : ''}`} 
                    value={dob} 
                    onChange={handleDobChange} 
                  />
                  {dobError && <div className="error-text">{dobError}</div>}
                </div>
              </div>
 
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    required 
                    className={`form-input ${(triedSubmit && !gender) ? 'faulty-input' : ''}`} 
                    value={gender} 
                    onChange={e => setGender(e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">State / Union Territory</label>
                  <select 
                    required 
                    className={`form-input ${(triedSubmit && !candidateState) ? 'faulty-input' : ''}`} 
                    value={candidateState} 
                    onChange={e => setCandidateState(e.target.value)}
                  >
                    <option value="">Select State / UT</option>
                    {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input 
                    required 
                    className={`form-input ${(triedSubmit && !city) ? 'faulty-input' : ''}`} 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    placeholder="e.g. New Delhi"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode (6 Digits)</label>
                  <input 
                    required 
                    className={`form-input ${(triedSubmit && !pincode) ? 'faulty-input' : ''}`} 
                    value={pincode} 
                    onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    placeholder="e.g. 110001"
                  />
                </div>
              </div>
 
              <div className="form-group">
                <label className="form-label">Extracurriculars (if any)</label>
                <textarea 
                  className="form-input" 
                  value={extracurriculars} 
                  onChange={e => setExtracurriculars(e.target.value)} 
                  placeholder="Tell us about your hobbies, sports, volunteering, or other interests..."
                />
                <div className="error-text">Current Word Count: {countWords(extracurriculars)}/100</div>
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
              <button type="button" className="btn-secondary" disabled={grads.length>=3} onClick={() => addEntry(setGrads, grads, 3, { university: '', degree_name: '', score_type: 'Percentage', score_value: '' })}>+ Add Graduation Detail</button>

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
              <button type="button" className="btn-secondary" disabled={postGrads.length>=3} onClick={() => addEntry(setPostGrads, postGrads, 3, { university: '', degree_name: '', score_type: 'Percentage', score_value: '' })}>+ Add Post Graduation</button>

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
              <button type="button" className="btn-secondary" disabled={doctorates.length>=3} onClick={() => addEntry(setDoctorates, doctorates, 3, { university: '', thesis_title: '', score_type: 'Percentage', score_value: '' })}>+ Add Doctorate</button>

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
                  <button type="button" className="btn-secondary" disabled={books.length>=3} onClick={() => addEntry(setBooks, books, 3, { title: '' })}>+ Add Book</button>
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
                  <button type="button" className="btn-secondary" disabled={chapters.length>=3} onClick={() => addEntry(setChapters, chapters, 3, { title: '', parent_title: '' })}>+ Add Chapter</button>
                </div>
              )}

              {pubTypes.papers && (
                <div style={{marginBottom: '2rem'}}>
                  <h4>Papers</h4>
                  {papers.map((p, i) => (
                    <div className="form-group" key={i}><input className="form-input" placeholder="Paper Title" value={p.title} onChange={e => updateEntry(setPapers, papers, i, 'title', e.target.value)} /></div>
                  ))}
                  <button type="button" className="btn-secondary" disabled={papers.length>=3} onClick={() => addEntry(setPapers, papers, 3, { title: '' })}>+ Add Paper</button>
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
                  Upload Resume (PDF)
                </label>
                <input required type="file" accept=".pdf" className={`form-input ${(triedSubmit && !resumeFile) ? 'faulty-input' : ''}`} onChange={e => setResumeFile(e.target.files[0])} />
              </div>

              <div className="form-group">
                <label className="form-label">Total Professional Experience</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      className={`form-input ${(triedSubmit && !expYears && !expMonths) ? 'faulty-input' : ''}`} 
                      placeholder="Years" 
                      value={expYears} 
                      onChange={e => setExpYears(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      max="11" 
                      className={`form-input ${(triedSubmit && !expYears && !expMonths) ? 'faulty-input' : ''}`} 
                      placeholder="Months" 
                      value={expMonths} 
                      onChange={e => setExpMonths(e.target.value)} 
                    />
                  </div>
                </div>
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
                  <button type="button" className="btn-secondary" disabled={workExps.length>=3} onClick={() => addEntry(setWorkExps, workExps, 3, { company_name: '', start_date: '', end_date: '', role: '', description: '' })}>+ Add Recent Work Experience</button>
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
