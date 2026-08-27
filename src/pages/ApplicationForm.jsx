import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE as API } from '../api';
import { CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const UG_DEGREES = [
  'B.A.', 'B.Sc.', 'B.Com', 'B.Tech', 'B.E.', 'B.B.A.', 'B.C.A.', 'LL.B.', 'MBBS', 'B.Arch', 'B.Ed.',
  'Integrated B.S. - M.S.', 'Integrated B.Sc. - M.Sc.', 'BS-MS (Dual Degree)',
  'B.Tech + M.Tech (Dual Degree)', 'B.Tech + M.B.A. (Dual Degree)', 'B.A. LL.B. (Integrated)', 'B.B.A. LL.B. (Integrated)',
  'Integrated M.Sc.', 'Integrated M.A.', 'Integrated M.Tech'
];

const PG_DEGREES = [
  'M.A.', 'M.Sc.', 'M.Com', 'M.Tech', 'M.E.', 'M.B.A.', 'M.C.A.', 'LL.M.', 'M.Ed.', 'MD', 'MS', 'M.Phil.',
  'Integrated B.S. - M.S.', 'Integrated B.Sc. - M.Sc.',
  'P.G. Diploma (PGD)', 'P.G.D.M.', 'Executive PGD', 'Integrated Ph.D.'
];

const DIPLOMA_TYPES = [
  'Polytechnic Diploma',
  'Post Graduate Diploma (PGD)',
  'PGDM',
  'Executive Diploma',
  'Diploma in Public Policy / Economics',
  'Diploma in Engineering / Tech',
  'Diploma in Languages / Arts',
  'Advanced Diploma',
  'Professional Certificate / Diploma'
];

const PASSING_YEARS = Array.from({ length: 61 }, (_, i) => 2030 - i); // 2030 down to 1970

const COUNTRY_CODES = [
  '+1 (USA/Canada)', '+7 (Russia)', '+20 (Egypt)', '+27 (South Africa)', '+31 (Netherlands)', 
  '+32 (Belgium)', '+33 (France)', '+34 (Spain)', '+39 (Italy)', '+41 (Switzerland)', 
  '+44 (UK)', '+49 (Germany)', '+52 (Mexico)', '+54 (Argentina)', '+55 (Brazil)', 
  '+60 (Malaysia)', '+61 (Australia)', '+62 (Indonesia)', '+63 (Philippines)', '+64 (New Zealand)', 
  '+65 (Singapore)', '+66 (Thailand)', '+81 (Japan)', '+82 (South Korea)', '+84 (Vietnam)', 
  '+86 (China)', '+90 (Turkey)', '+91 (India)', '+92 (Pakistan)', '+94 (Sri Lanka)', 
  '+95 (Myanmar)', '+98 (Iran)', '+234 (Nigeria)', '+254 (Kenya)', '+351 (Portugal)', 
  '+353 (Ireland)', '+971 (UAE)', '+972 (Israel)', '+974 (Qatar)', '+977 (Nepal)'
];

const SearchableDropdown = ({ options, value, onChange, placeholder, className }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        className={className}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value.split(' ')[0]); // Store only +91
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      {showDropdown && filteredOptions.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px',
          maxHeight: '200px', overflowY: 'auto', padding: 0, margin: '4px 0 0 0',
          listStyle: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          {filteredOptions.map(opt => (
            <li 
              key={opt}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
              onMouseDown={() => {
                setInputValue(opt);
                onChange(opt.split(' ')[0]); // Store only the code e.g. +91
                setShowDropdown(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PUBLICATION_CATEGORIES = [
  'Peer-Reviewed Journal Papers',
  'Books Published',
  'Book Chapters',
  'Research Reports',
  'Policy Briefs'
];

const COMMON_SPECIALIZATIONS = [
  // Humanities & Arts
  'History', 'Ancient History', 'Modern History', 'Medieval History', 'Indian History', 'World History',
  'Political Science', 'Sociology', 'Geography', 'Philosophy', 'English', 'English Literature', 
  'Linguistics', 'Psychology', 'Clinical Psychology', 'Anthropology', 'Archaeology', 'Fine Arts', 
  'Visual Arts', 'Music', 'Drama', 'Public Administration', 'International Relations', 'Social Work',
  // Sciences
  'Physics', 'Astrophysics', 'Theoretical Physics', 'Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 
  'Physical Chemistry', 'Analytical Chemistry', 'Biochemistry', 'Biology', 'Microbiology', 'Biotechnology', 
  'Zoology', 'Botany', 'Environmental Science', 'Geology', 'Genetics', 'Mathematics', 'Applied Mathematics', 
  'Statistics', 'Applied Statistics', 'Data Science', 'Actuarial Science',
  // Engineering & Tech
  'Computer Science', 'Computer Engineering', 'Information Technology', 'Software Engineering', 
  'Artificial Intelligence', 'Machine Learning', 'Data Analytics', 'Electrical Engineering', 
  'Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 
  'Aerospace Engineering', 'Biomedical Engineering', 'Metallurgical Engineering',
  // Business, Finance & Economics
  'Economics', 'Development Economics', 'Applied Economics', 'Econometrics', 'Macroeconomics', 
  'Microeconomics', 'Finance', 'Financial Management', 'Business Administration', 'Management', 
  'Marketing', 'Human Resource Management', 'Operations Management', 'Accounting', 'Commerce', 
  'International Business', 'Corporate Finance', 'Investment Banking',
  // Medicine & Healthcare
  'Medicine', 'Surgery', 'Dentistry', 'Pharmacy', 'Nursing', 'Physiotherapy', 'Public Health', 
  'Epidemiology', 'Biomedical Science', 'Pathology', 'Pharmacology',
  // Education & Law
  'Education', 'Special Education', 'Law', 'Corporate Law', 'Constitutional Law', 'International Law', 
  'Criminal Law', 'Intellectual Property Law'
];

const getSuggestion = (inputVal) => {
  if (!inputVal || !inputVal.trim()) return '';
  const match = COMMON_SPECIALIZATIONS.find(s => 
    s.toLowerCase().startsWith(inputVal.toLowerCase()) && 
    s.toLowerCase() !== inputVal.toLowerCase()
  );
  if (match) {
    return match.substring(inputVal.length);
  }
  return '';
};

const SpecializationInput = ({ required, value, onChange, placeholder, className }) => {
  const [suggestion, setSuggestion] = useState('');
  
  useEffect(() => {
    setSuggestion(getSuggestion(value));
  }, [value]);
  
  const handleKeyDown = (e) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion) {
      e.preventDefault();
      onChange(value + suggestion);
    }
  };
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        required={required}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ position: 'relative', zIndex: 1 }}
      />
      {suggestion && (
        <div 
          className={className} 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            pointerEvents: 'none', 
            color: '#94a3b8', 
            background: 'transparent',
            borderColor: 'transparent',
            boxShadow: 'none',
            whiteSpace: 'pre',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            boxSizing: 'border-box',
            zIndex: 2
          }}
        >
          <span style={{ color: 'transparent' }}>{value}</span>
          {suggestion}
        </div>
      )}
    </div>
  );
};


let globalUniversitiesList = [];

const UniversityAutocomplete = ({ required, value, onChange, placeholder, className }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(value && globalUniversitiesList.length > 0 && !globalUniversitiesList.includes(value));

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const [universitiesList, setUniversitiesList] = useState(globalUniversitiesList);

  useEffect(() => {
    if (globalUniversitiesList.length > 0) {
      setUniversitiesList(globalUniversitiesList);
    } else {
      fetch(`${API}/universities`)
        .then(res => res.json())
        .then(data => {
          globalUniversitiesList = data;
          setUniversitiesList(data);
          if (value && !data.includes(value)) {
            setIsCustomMode(true);
          }
        })
        .catch(err => console.error("Error fetching universities list:", err));
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);

    if (isCustomMode) {
      return;
    }

    if (!val.trim()) {
      setSuggestions(universitiesList.concat(["Other (Type custom university name...)"]));
      setShowSuggestions(true);
      return;
    }

    const filtered = universitiesList.filter(u => 
      u.toLowerCase().includes(val.toLowerCase())
    );

    setSuggestions([...filtered, "Other (Type custom university name...)"]);
    setShowSuggestions(true);
  };

  const handleSelect = (univ) => {
    if (univ.startsWith("Other")) {
      setIsCustomMode(true);
      setInputValue('');
      onChange('');
    } else {
      setInputValue(univ);
      onChange(univ);
    }
    setShowSuggestions(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        required={required}
        className={className}
        placeholder={isCustomMode ? "Type custom university name..." : placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          if (!isCustomMode) {
            if (inputValue.trim()) {
              const filtered = universitiesList.filter(u => 
                u.toLowerCase().includes(inputValue.toLowerCase())
              );
              setSuggestions([...filtered, "Other (Type custom university name...)"]);
            } else {
              setSuggestions(universitiesList.concat(["Other (Type custom university name...)"]));
            }
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 200);
        }}
      />
      {isCustomMode && (
        <button 
          type="button" 
          onClick={() => { setIsCustomMode(false); setInputValue(''); onChange(''); }}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#ef4444',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          Reset to List
        </button>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 999,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          marginTop: '4px'
        }}>
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                borderBottom: '1px solid #f1f5f9',
                color: s.startsWith("Other") ? '#ef4444' : '#1e293b',
                fontWeight: s.startsWith("Other") ? '700' : '500',
                backgroundColor: '#ffffff'
              }}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const parseDegree = (degreeName, level) => {
  if (!degreeName) return { type: '', spec: '', custom: '' };
  const match = degreeName.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (match) {
    const type = match[1].trim();
    const spec = match[2].trim();
    const standardList = level === 'Bachelors' ? UG_DEGREES : PG_DEGREES;
    if (standardList.includes(type)) {
      return { type, spec, custom: '' };
    } else {
      return { type: 'Other', spec, custom: type };
    }
  }
  const standardList = level === 'Bachelors' ? UG_DEGREES : PG_DEGREES;
  if (standardList.includes(degreeName.trim())) {
    return { type: degreeName.trim(), spec: '', custom: '' };
  }
  return { type: 'Other', spec: '', custom: degreeName.trim() };
};

const buildDegreeName = (type, spec, custom) => {
  const finalType = type === 'Other' ? (custom || '') : type;
  const finalSpec = (spec || '');
  if (finalType && finalSpec) {
    return `${finalType} (${finalSpec})`;
  }
  return finalType || finalSpec || '';
};


const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 
  'Lakshadweep', 'Puducherry'
];

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

  // Edit states for Step 5 Preview
  const [editPersonal, setEditPersonal] = useState(false);
  const [editEducation, setEditEducation] = useState(false);
  const [editPublications, setEditPublications] = useState(false);
  const [editWork, setEditWork] = useState(false);

  // Step 1
  const [position_applied, setPosition] = useState(() => savedDraft.position_applied || 'Professor');
  const [admin_department, setAdminDept] = useState(() => savedDraft.admin_department || 'IT');
  const [full_name, setFullName] = useState(() => savedDraft.full_name || '');
  const [email, setEmail] = useState(() => savedDraft.email || '');
  const [countryCode, setCountryCode] = useState(() => savedDraft.countryCode || '+91');
  const [mobile_number, setMobile] = useState(() => savedDraft.mobile_number || '');
  const [dob, setDob] = useState(() => savedDraft.dob || '');
  const [gender, setGender] = useState(() => savedDraft.gender || '');
  const [candidateState, setCandidateState] = useState(() => savedDraft.candidateState || '');
  const [city, setCity] = useState(() => savedDraft.city || '');
  const [pincode, setPincode] = useState(() => savedDraft.pincode || '');
  const [dobError, setDobError] = useState('');

  // Step 2
  const [classXSchool, setClassXSchool] = useState(() => savedDraft.classXSchool || '');
  const [classXBoard, setClassXBoard] = useState(() => savedDraft.classXBoard || 'CBSE');
  const [classXBoardState, setClassXBoardState] = useState(() => savedDraft.classXBoardState || '');
  const [classXBoardOther, setClassXBoardOther] = useState(() => savedDraft.classXBoardOther || '');
  const [classXScoreType, setClassXScoreType] = useState(() => savedDraft.classXScoreType || 'Percentage');
  const [classXScoreValue, setClassXScoreValue] = useState(() => savedDraft.classXScoreValue || savedDraft.classX || '');

  const [classXIISchool, setClassXIISchool] = useState(() => savedDraft.classXIISchool || '');
  const [classXIIBoard, setClassXIIBoard] = useState(() => savedDraft.classXIIBoard || 'CBSE');
  const [classXIIBoardState, setClassXIIBoardState] = useState(() => savedDraft.classXIIBoardState || '');
  const [classXIIBoardOther, setClassXIIBoardOther] = useState(() => savedDraft.classXIIBoardOther || '');
  const [classXIIScoreType, setClassXIIScoreType] = useState(() => savedDraft.classXIIScoreType || 'Percentage');
  const [classXIIScoreValue, setClassXIIScoreValue] = useState(() => savedDraft.classXIIScoreValue || savedDraft.classXII || '');
  const [grads, setGrads] = useState(() => {
    const raw = savedDraft.grads || [{ university: '', degree_name: '', score_type: 'Percentage', score_value: '', grad_year: '' }];
    return raw.map(g => {
      if (g.degree_select !== undefined) return g;
      const parsed = parseDegree(g.degree_name || '', 'Bachelors');
      return {
        ...g,
        degree_select: parsed.type,
        degree_custom: parsed.custom,
        degree_spec: parsed.spec
      };
    });
  });
  const [postGrads, setPostGrads] = useState(() => {
    const raw = savedDraft.postGrads || [{ university: '', degree_name: '', score_type: 'Percentage', score_value: '', grad_year: '' }];
    return raw.map(g => {
      if (g.degree_select !== undefined) return g;
      const parsed = parseDegree(g.degree_name || '', 'Masters');
      return {
        ...g,
        degree_select: parsed.type,
        degree_custom: parsed.custom,
        degree_spec: parsed.spec
      };
    });
  });

  const [doctorates, setDoctorates] = useState(() => savedDraft.doctorates || [{ university: '', thesis_title: '', score_type: 'Percentage', score_value: '', grad_year: '', is_pursuing: false }]);
  const [diplomas, setDiplomas] = useState(() => savedDraft.diplomas || [{ university: '', degree_name: '', degree_select: '', degree_custom: '', degree_spec: '', is_pursuing: false, score_type: 'Percentage', score_value: '', grad_year: '' }]);

  const [showPostGrad, setShowPostGrad] = useState(() => savedDraft.postGrads && (savedDraft.postGrads.length > 1 || !!(savedDraft.postGrads[0] && savedDraft.postGrads[0].university)));
  const [showDoctorate, setShowDoctorate] = useState(() => savedDraft.doctorates && (savedDraft.doctorates.length > 1 || !!(savedDraft.doctorates[0] && savedDraft.doctorates[0].university)));
  const [showDiploma, setShowDiploma] = useState(() => savedDraft.diplomas && (savedDraft.diplomas.length > 1 || !!(savedDraft.diplomas[0] && savedDraft.diplomas[0].university)));

  // Step 2 & 3 custom states
  const [classXYear, setClassXYear] = useState(() => savedDraft.classXYear || '');
  const [classXIIYear, setClassXIIYear] = useState(() => savedDraft.classXIIYear || '');
  const [linkedin, setLinkedin] = useState(() => savedDraft.linkedin || '');

  // Step 3 Publication Counts
  const [pubBooks, setPubBooks] = useState(() => savedDraft.pubBooks !== undefined ? savedDraft.pubBooks : 0);
  const [pubPapers, setPubPapers] = useState(() => savedDraft.pubPapers !== undefined ? savedDraft.pubPapers : 0);
  const [pubChapters, setPubChapters] = useState(() => savedDraft.pubChapters !== undefined ? savedDraft.pubChapters : 0);
  const [pubReports, setPubReports] = useState(() => savedDraft.pubReports !== undefined ? savedDraft.pubReports : 0);
  const [pubPolicyBriefs, setPubPolicyBriefs] = useState(() => savedDraft.pubPolicyBriefs !== undefined ? savedDraft.pubPolicyBriefs : 0);

  const [pubEntries, setPubEntries] = useState(() => {
    if (savedDraft.pubEntries && Array.isArray(savedDraft.pubEntries) && savedDraft.pubEntries.length > 0) {
      return savedDraft.pubEntries;
    }
    const list = [];
    if (savedDraft.pubPapers) list.push({ category: 'Peer-Reviewed Journal Papers', count: savedDraft.pubPapers });
    if (savedDraft.pubBooks) list.push({ category: 'Books Published', count: savedDraft.pubBooks });
    if (savedDraft.pubChapters) list.push({ category: 'Book Chapters', count: savedDraft.pubChapters });
    if (savedDraft.pubReports) list.push({ category: 'Research Reports', count: savedDraft.pubReports });
    if (savedDraft.pubPolicyBriefs) list.push({ category: 'Policy Briefs', count: savedDraft.pubPolicyBriefs });
    if (list.length === 0) {
      list.push({ category: 'Peer-Reviewed Journal Papers', count: 0 });
    }
    return list;
  });

  const syncPubCounts = (entries) => {
    let books = 0, papers = 0, chapters = 0, reports = 0, briefs = 0;
    entries.forEach(e => {
      const c = parseInt(e.count, 10) || 0;
      if (e.category === 'Books Published') books += c;
      else if (e.category === 'Peer-Reviewed Journal Papers') papers += c;
      else if (e.category === 'Book Chapters') chapters += c;
      else if (e.category === 'Research Reports') reports += c;
      else if (e.category === 'Policy Briefs') briefs += c;
    });
    setPubBooks(books);
    setPubPapers(papers);
    setPubChapters(chapters);
    setPubReports(reports);
    setPubPolicyBriefs(briefs);
  };

  const updatePubEntry = (idx, field, value) => {
    const fresh = [...pubEntries];
    fresh[idx] = { ...fresh[idx], [field]: value };
    setPubEntries(fresh);
    syncPubCounts(fresh);
  };

  const addPubEntry = () => {
    if (pubEntries.length < 5) {
      const usedCategories = pubEntries.map(e => e.category);
      const available = PUBLICATION_CATEGORIES.find(c => !usedCategories.includes(c)) || PUBLICATION_CATEGORIES[0];
      const fresh = [...pubEntries, { category: available, count: 1 }];
      setPubEntries(fresh);
      syncPubCounts(fresh);
    }
  };

  const removePubEntry = (idx) => {
    const fresh = pubEntries.filter((_, i) => i !== idx);
    setPubEntries(fresh);
    syncPubCounts(fresh);
  };

  const [scholarLink, setScholarLink] = useState(() => savedDraft.scholarLink || '');
  const [expYears, setExpYears] = useState(() => savedDraft.expYears || '');
  const [expMonths, setExpMonths] = useState(() => savedDraft.expMonths || '');
  const [lastSalary, setLastSalary] = useState(() => savedDraft.lastSalary || '');
  const [resumeFile, setResumeFile] = useState(null);

  // Step 4
  const [hasWork, setHasWork] = useState(true);
  const [workExps, setWorkExps] = useState(() => savedDraft.workExps || [{ company_name: '', start_date: '', end_date: '', role: '' }]);

  // Fetch Job details if ID is present
  useEffect(() => {
    document.title = "Apply | RIS Recruitment Portal";
    if (jobId) {
      fetch(`${API}/public/jobs/${jobId}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setJobDetail(data);
            document.title = `Apply: ${data.title} | RIS Careers`;
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
      countryCode,
      mobile_number,
      dob,
      gender,
      candidateState,
      city,
      pincode,
      classXSchool,
      classXBoard,
      classXBoardState,
      classXBoardOther,
      classXScoreType,
      classXScoreValue,
      classXYear,
      classXIISchool,
      classXIIBoard,
      classXIIBoardState,
      classXIIBoardOther,
      classXIIScoreType,
      classXIIScoreValue,
      classXIIYear,
      linkedin,
      pubBooks,
      pubPapers,
      pubChapters,
      pubReports,
      pubPolicyBriefs,
      grads,
      postGrads,
      doctorates,
      scholarLink,
      expYears,
      expMonths,
      hasWork,
      workExps,
      step
    };
    localStorage.setItem('hr_application_draft', JSON.stringify(draft));
  }, [
    position_applied, admin_department, full_name, email, countryCode, mobile_number, dob, gender,
    candidateState, city, pincode, grads, postGrads, doctorates, 
    scholarLink, expYears, expMonths, hasWork, workExps, step, jobId,
    classXSchool, classXBoard, classXBoardState, classXBoardOther, classXScoreType, classXScoreValue, classXYear,
    classXIISchool, classXIIBoard, classXIIBoardState, classXIIBoardOther, classXIIScoreType, classXIIScoreValue, classXIIYear,
    linkedin, pubBooks, pubPapers, pubChapters, pubReports, pubPolicyBriefs
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

  const removeEntry = (setter, state, index) => {
    const fresh = [...state];
    fresh.splice(index, 1);
    setter(fresh);
  };

  const handleToggleEditPersonal = () => {
    if (editPersonal) {
      // Validate Personal Info before saving
      const errors = [];
      if (!full_name.trim()) errors.push("Full Name is required.");
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.push("A valid Email ID is required.");
      if (!mobile_number || !/^\d{4,15}$/.test(mobile_number)) errors.push("Mobile Number must be 4 to 15 digits.");
      if (!dob) {
        errors.push("Date of Birth is required.");
      } else {
        const dobErr = validateDob(dob);
        if (dobErr) errors.push(dobErr);
      }
      if (!gender) errors.push("Gender is required.");
      if (!candidateState) errors.push("State/Union Territory is required.");
      if (!city.trim() || !/^[a-zA-Z\s]{2,100}$/.test(city.trim())) {
        errors.push("City must be at least 2 characters and contain only letters.");
      }
      if (!pincode || !/^\d{6}$/.test(pincode)) errors.push("Pincode must be exactly 6 digits.");


      if (errors.length > 0) {
        alert(errors.join("\n"));
        return; // Stay in edit mode
      }
    }
    setEditPersonal(!editPersonal);
  };

  const handleToggleEditEducation = () => {
    if (editEducation) {
      // Validate education details
      const errors = [];
      if (!classXSchool.trim()) {
        errors.push("Class X School name is required.");
      }
      if (classXBoard === 'State Board' && !classXBoardState) {
        errors.push("Please select the State for your Class X State Board.");
      }
      if (classXBoard === 'Other' && !classXBoardOther.trim()) {
        errors.push("Please specify your Class X Board.");
      }
      const valClassX = parseFloat(classXScoreValue);
      if (isNaN(valClassX) || valClassX < 0) {
        errors.push("Class X score must be a valid positive number.");
      } else if (classXScoreType === 'Percentage' && valClassX > 100) {
        errors.push("Class X Percentage cannot exceed 100.");
      } else if (classXScoreType === 'CGPA (Out of 10)' && valClassX > 10) {
        errors.push("Class X CGPA cannot exceed 10.");
      } else if (classXScoreType === 'CGPA (Out of 4)' && valClassX > 4) {
        errors.push("Class X CGPA cannot exceed 4.");
      }
      if (!classXYear) {
        errors.push("Class X Passing Year is required.");
      }

      if (!classXIISchool.trim()) {
        errors.push("Class XII School name is required.");
      }
      if (classXIIBoard === 'State Board' && !classXIIBoardState) {
        errors.push("Please select the State for your Class XII State Board.");
      }
      if (classXIIBoard === 'Other' && !classXIIBoardOther.trim()) {
        errors.push("Please specify your Class XII Board.");
      }
      const valClassXII = parseFloat(classXIIScoreValue);
      if (isNaN(valClassXII) || valClassXII < 0) {
        errors.push("Class XII score must be a valid positive number.");
      } else if (classXIIScoreType === 'Percentage' && valClassXII > 100) {
        errors.push("Class XII Percentage cannot exceed 100.");
      } else if (classXIIScoreType === 'CGPA (Out of 10)' && valClassXII > 10) {
        errors.push("Class XII CGPA cannot exceed 10.");
      } else if (classXIIScoreType === 'CGPA (Out of 4)' && valClassXII > 4) {
        errors.push("Class XII CGPA cannot exceed 4.");
      }
      if (!classXIIYear) {
        errors.push("Class XII Passing Year is required.");
      }
      grads.forEach((g, i) => {
        if (i === 0 || g.university || g.degree_name || g.score_value || g.grad_year) {
          if (!g.university.trim()) errors.push(`Graduation #${i + 1}: University is required.`);
          if (!g.degree_name.trim()) errors.push(`Graduation #${i + 1}: Degree Name is required.`);
          const score = parseFloat(g.score_value);
          if (isNaN(score) || score < 0) {
            errors.push(`Graduation #${i + 1}: Valid Score is required.`);
          } else if (g.score_type === 'Percentage' && score > 100) {
            errors.push(`Graduation #${i + 1}: Percentage score cannot exceed 100.`);
          } else if (g.score_type === 'CGPA' && score > 10) {
            errors.push(`Graduation #${i + 1}: CGPA score cannot exceed 10.`);
          }
          if (!g.grad_year) {
            errors.push(`Graduation #${i + 1}: Year of Passing is required.`);
          } else {
            const yr = parseInt(g.grad_year, 10);
            if (isNaN(yr) || yr < 1950 || yr > 2030) {
              errors.push(`Graduation #${i + 1}: Year of Passing must be a number between 1950 and 2030.`);
            }
          }
        }
      });
      postGrads.forEach((g, i) => {
        if (g.university || g.degree_name || g.score_value || g.grad_year) {
          if (!g.university.trim()) errors.push(`Post Graduation #${i + 1}: University is required.`);
          if (!g.degree_name.trim()) errors.push(`Post Graduation #${i + 1}: Degree Name is required.`);
          const score = parseFloat(g.score_value);
          if (isNaN(score) || score < 0) {
            errors.push(`Post Graduation #${i + 1}: Valid Score is required.`);
          } else if (g.score_type === 'Percentage' && score > 100) {
            errors.push(`Post Graduation #${i + 1}: Percentage score cannot exceed 100.`);
          } else if (g.score_type === 'CGPA' && score > 10) {
            errors.push(`Post Graduation #${i + 1}: CGPA score cannot exceed 10.`);
          }
          if (!g.grad_year) {
            errors.push(`Post Graduation #${i + 1}: Year of Passing is required.`);
          } else {
            const yr = parseInt(g.grad_year, 10);
            if (isNaN(yr) || yr < 1950 || yr > 2030) {
              errors.push(`Post Graduation #${i + 1}: Year of Passing must be a number between 1950 and 2030.`);
            }
          }
        }
      });
      doctorates.forEach((g, i) => {
        if (g.university || g.thesis_title || g.score_value || g.grad_year) {
          if (!g.university.trim()) errors.push(`Doctorate #${i + 1}: University is required.`);
          if (!g.thesis_title.trim()) errors.push(`Doctorate #${i + 1}: Thesis Title is required.`);
          const score = parseFloat(g.score_value);
          if (isNaN(score) || score < 0) {
            errors.push(`Doctorate #${i + 1}: Valid Score is required.`);
          } else if (g.score_type === 'Percentage' && score > 100) {
            errors.push(`Doctorate #${i + 1}: Percentage score cannot exceed 100.`);
          } else if (g.score_type === 'CGPA' && score > 10) {
            errors.push(`Doctorate #${i + 1}: CGPA score cannot exceed 10.`);
          }
          if (!g.grad_year) {
            errors.push(`Doctorate #${i + 1}: Year of Passing is required.`);
          } else {
            const yr = parseInt(g.grad_year, 10);
            if (isNaN(yr) || yr < 1950 || yr > 2030) {
              errors.push(`Doctorate #${i + 1}: Year of Passing must be a number between 1950 and 2030.`);
            }
          }
        }
      });

      if (errors.length > 0) {
        alert(errors.join("\n"));
        return;
      }
    }
    setEditEducation(!editEducation);
  };

  const handleToggleEditPublications = () => {
    if (editPublications) {
      const errors = [];
      if (pubBooks < 0 || pubPapers < 0 || pubChapters < 0 || pubReports < 0 || pubPolicyBriefs < 0) {
        errors.push("Publication counts cannot be negative.");
      }
      if (scholarLink && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(scholarLink)) {
        errors.push("Google Scholar Link must be a valid URL.");
      }
      if (linkedin && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(linkedin)) {
        errors.push("LinkedIn Link must be a valid URL.");
      }

      if (errors.length > 0) {
        alert(errors.join("\n"));
        return;
      }
    }
    setEditPublications(!editPublications);
  };

  const handleToggleEditWork = () => {
    if (editWork) {
      const errors = [];
      if (!resumeFile) {
        errors.push("Resume (PDF) is required.");
      }
      if (expYears === '' && expMonths === '') {
        errors.push("Professional experience in years and months is required.");
      } else {
        const yrs = parseInt(expYears) || 0;
        const mths = parseInt(expMonths) || 0;
        if (yrs < 0 || mths < 0 || mths > 11) {
          errors.push("Please enter valid Experience Years (>=0) and Months (0-11).");
        }
      }

      if (hasWork) {
        workExps.forEach((w, i) => {
          if (!w.company_name.trim() || !w.role.trim() || !w.start_date) {
            errors.push(`Work Entry #${i + 1}: Organization, Designation, and Start Date are required.`);
          }
          if (w.description && countWords(w.description) > 40) {
            errors.push(`Work Entry #${i + 1}: Description exceeds 40 words.`);
          }
        });
      }

      if (errors.length > 0) {
        alert(errors.join("\n"));
        return;
      }
    }
    setEditWork(!editWork);
  };

  const validateAllFields = () => {
    const errors = [];

    // Personal Info (Step 1)
    if (!full_name.trim()) errors.push("Full Name is required.");
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.push("A valid Email ID is required.");
    if (!mobile_number || !/^\d{4,15}$/.test(mobile_number)) errors.push("Mobile Number must be 4 to 15 digits.");
    if (!dob) {
      errors.push("Date of Birth is required.");
    } else {
      const dobErr = validateDob(dob);
      if (dobErr) errors.push(dobErr);
    }
    if (!gender) errors.push("Gender is required.");
    if (!candidateState) errors.push("State/Union Territory is required.");
    if (!city.trim() || !/^[a-zA-Z\s]{2,100}$/.test(city.trim())) {
      errors.push("City must be at least 2 characters and contain only letters.");
    }
    if (!pincode || !/^\d{6}$/.test(pincode)) errors.push("Pincode must be exactly 6 digits.");


    // Education (Step 2)
    const valClassX = parseFloat(classXScoreValue);
    if (isNaN(valClassX) || valClassX < 0) {
      errors.push("Class X score must be a valid positive number.");
    } else if (classXScoreType === 'Percentage' && valClassX > 100) {
      errors.push("Class X Percentage cannot exceed 100.");
    } else if (classXScoreType === 'CGPA (Out of 10)' && valClassX > 10) {
      errors.push("Class X CGPA cannot exceed 10.");
    } else if (classXScoreType === 'CGPA (Out of 4)' && valClassX > 4) {
      errors.push("Class X CGPA cannot exceed 4.");
    }
    if (!classXYear) {
      errors.push("Class X Passing Year is required.");
    }

    const valClassXII = parseFloat(classXIIScoreValue);
    if (isNaN(valClassXII) || valClassXII < 0) {
      errors.push("Class XII score must be a valid positive number.");
    } else if (classXIIScoreType === 'Percentage' && valClassXII > 100) {
      errors.push("Class XII Percentage cannot exceed 100.");
    } else if (classXIIScoreType === 'CGPA (Out of 10)' && valClassXII > 10) {
      errors.push("Class XII CGPA cannot exceed 10.");
    } else if (classXIIScoreType === 'CGPA (Out of 4)' && valClassXII > 4) {
      errors.push("Class XII CGPA cannot exceed 4.");
    }
    if (!classXIIYear) {
      errors.push("Class XII Passing Year is required.");
    }

    // Graduation
    grads.forEach((g, i) => {
      if (i === 0 || g.university || g.degree_name || g.score_value || g.grad_year) {
        if (!g.university.trim()) errors.push(`Graduation #${i + 1}: University is required.`);
        if (!g.degree_name.trim()) errors.push(`Graduation #${i + 1}: Degree Name is required.`);
        const score = parseFloat(g.score_value);
        if (isNaN(score) || score < 0) {
          errors.push(`Graduation #${i + 1}: Valid Score is required.`);
        } else if (g.score_type === 'Percentage' && score > 100) {
          errors.push(`Graduation #${i + 1}: Percentage score cannot exceed 100.`);
        } else if (g.score_type === 'CGPA' && score > 10) {
          errors.push(`Graduation #${i + 1}: CGPA score cannot exceed 10.`);
        }
        if (!g.grad_year) {
          errors.push(`Graduation #${i + 1}: Year of Passing is required.`);
        } else {
          const yr = parseInt(g.grad_year, 10);
          if (isNaN(yr) || yr < 1950 || yr > 2030) {
            errors.push(`Graduation #${i + 1}: Year of Passing must be a number between 1950 and 2030.`);
          }
        }
      }
    });

    // PG
    postGrads.forEach((g, i) => {
      if (g.university || g.degree_name || g.score_value || g.grad_year) {
        if (!g.university.trim()) errors.push(`Post Graduation #${i + 1}: University is required.`);
        if (!g.degree_name.trim()) errors.push(`Post Graduation #${i + 1}: Degree Name is required.`);
        const score = parseFloat(g.score_value);
        if (isNaN(score) || score < 0) {
          errors.push(`Post Graduation #${i + 1}: Valid Score is required.`);
        } else if (g.score_type === 'Percentage' && score > 100) {
          errors.push(`Post Graduation #${i + 1}: Percentage score cannot exceed 100.`);
        } else if (g.score_type === 'CGPA' && score > 10) {
          errors.push(`Post Graduation #${i + 1}: CGPA score cannot exceed 10.`);
        }
        if (!g.grad_year) {
          errors.push(`Post Graduation #${i + 1}: Year of Passing is required.`);
        } else {
          const yr = parseInt(g.grad_year, 10);
          if (isNaN(yr) || yr < 1950 || yr > 2030) {
            errors.push(`Post Graduation #${i + 1}: Year of Passing must be a number between 1950 and 2030.`);
          }
        }
      }
    });

    // PhD
    doctorates.forEach((g, i) => {
      if (g.university || g.thesis_title || g.score_value || g.grad_year) {
        if (!g.university.trim()) errors.push(`Doctorate #${i + 1}: University is required.`);
        if (!g.thesis_title.trim()) errors.push(`Doctorate #${i + 1}: Thesis Title is required.`);
        const score = parseFloat(g.score_value);
        if (isNaN(score) || score < 0) {
          errors.push(`Doctorate #${i + 1}: Valid Score is required.`);
        } else if (g.score_type === 'Percentage' && score > 100) {
          errors.push(`Doctorate #${i + 1}: Percentage score cannot exceed 100.`);
        } else if (g.score_type === 'CGPA' && score > 10) {
          errors.push(`Doctorate #${i + 1}: CGPA score cannot exceed 10.`);
        }
        if (!g.grad_year) {
          errors.push(`Doctorate #${i + 1}: Year of Passing is required.`);
        } else {
          const yr = parseInt(g.grad_year, 10);
          if (isNaN(yr) || yr < 1950 || yr > 2030) {
            errors.push(`Doctorate #${i + 1}: Year of Passing must be a number between 1950 and 2030.`);
          }
        }
      }
    });

    // Publications (Step 3)
    if (pubBooks < 0 || pubPapers < 0 || pubChapters < 0 || pubReports < 0 || pubPolicyBriefs < 0) {
      errors.push("Publication counts cannot be negative.");
    }
    if (scholarLink && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(scholarLink)) {
      errors.push("Google Scholar Link must be a valid URL.");
    }
    if (linkedin && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(linkedin)) {
      errors.push("LinkedIn Link must be a valid URL.");
    }

    // Work Experience (Step 4)
    if (!resumeFile) {
      errors.push("Resume (PDF) is required.");
    }
    if (expYears === '' && expMonths === '') {
      errors.push("Professional experience in years and months is required.");
    } else {
      const yrs = parseInt(expYears) || 0;
      const mths = parseInt(expMonths) || 0;
      if (yrs < 0 || mths < 0 || mths > 11) {
        errors.push("Please enter valid Experience Years (>=0) and Months (0-11).");
      }
    }

    if (hasWork) {
      workExps.forEach((w, i) => {
        if (w.company_name || w.role || w.start_date || w.description) {
          if (!w.company_name.trim()) errors.push(`Work Entry #${i + 1}: Organization is required.`);
          if (!w.role.trim()) errors.push(`Work Entry #${i + 1}: Designation is required.`);
          if (!w.start_date) errors.push(`Work Entry #${i + 1}: Start Date is required.`);
          if (w.description && countWords(w.description) > 40) {
            errors.push(`Work Entry #${i + 1}: Description exceeds 40 words.`);
          }
        }
      });
    }

    return errors.length > 0 ? errors : null;
  };

  const handleNext = (e) => {
    e.preventDefault();
    setTriedSubmit(true);
    
    // Check required fields for Step 1
    if (step === 1) {
      if (!full_name || !email || !countryCode || !mobile_number || !dob || !gender || !candidateState || !city || !pincode) {
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


    }

    // Step 2 Validation: Schooling is mandatory, and at least ONE post-schooling qualification (UG/PG/PhD/Diploma) must be filled
    if (step === 2) {
      if (!classXSchool.trim() || !classXScoreValue || !classXYear) {
        alert("Please complete mandatory Class X schooling details.");
        return;
      }
      if (!classXIISchool.trim() || !classXIIScoreValue || !classXIIYear) {
        alert("Please complete mandatory Class XII schooling details.");
        return;
      }

      const allEdu = [...grads, ...postGrads, ...doctorates, ...diplomas];
      const hasPostSchooling = allEdu.some(entry => (entry.university && entry.university.trim() !== '') || (entry.degree_name && entry.degree_name.trim() !== '') || (entry.degree_select && entry.degree_select.trim() !== ''));
      if (!hasPostSchooling) {
        alert("Please fill in at least one post-schooling qualification (Graduation, Post-Graduation, Doctorate, or Diploma).");
        return;
      }

      const currentYr = new Date().getFullYear();
      for (let entry of allEdu) {
        if (entry.is_pursuing && entry.grad_year) {
          const yr = parseInt(entry.grad_year, 10);
          if (!isNaN(yr) && yr < currentYr) {
            alert(`Expected completion year for currently pursuing degree (${entry.degree_select || entry.degree_name || 'Degree'}) cannot be less than current year (${currentYr}).`);
            return;
          }
        }
      }
    }

    // Check required fields for Step 3 (Work Experience Details)
    if (step === 3) {
      if (!resumeFile) {
        alert("Please upload your Resume (PDF) first.");
        return;
      }
      if (expYears === '' && expMonths === '') {
        alert("Please specify your professional experience in years/months (enter 0 Years 0 Months if fresher).");
        return;
      }
      const yrs = parseInt(expYears) || 0;
      const mths = parseInt(expMonths) || 0;
      if (yrs < 0 || mths < 0 || mths > 11) {
        alert("Please enter valid Experience Years (>=0) and Months (0-11).");
        return;
      }

      // Only validate detailed work entries if candidate has prior experience or typed work details
      const hasTypedWorkDetails = workExps.some(w => w.company_name && w.company_name.trim() !== '');
      if (yrs > 0 || mths > 0 || hasTypedWorkDetails) {
        for (let i = 0; i < workExps.length; i++) {
          const w = workExps[i];
          if (hasTypedWorkDetails || (i === 0 && (yrs > 0 || mths > 0))) {
            if (!w.company_name || !w.role || !w.start_date) {
              alert(`Please fill in required fields (Organization, Designation, Start Date) for Work Entry #${i + 1}.`);
              return;
            }
          }
        }
      }
    }
    
    setStep(step + 1);
    setTriedSubmit(false);
  };

  const handleProceedToPreview = (e) => {
    e.preventDefault();
    setTriedSubmit(true);
    setStep(5);
    setTriedSubmit(false);
  };

  const executeFinalSubmit = async () => {
    setTriedSubmit(true);
    setSubmitError("");
    
    let educations = [];
    let eduOrder = 1;
    grads.forEach(g => { if(g.university) educations.push({...g, level: 'undergrad', entry_order: eduOrder++}) });
    postGrads.forEach(g => { if(g.university) educations.push({...g, level: 'postgrad', entry_order: eduOrder++}) });
    doctorates.forEach(g => { if(g.university) educations.push({...g, level: 'phd', entry_order: eduOrder++}) });
    diplomas.forEach(g => { if(g.university) educations.push({...g, level: 'diploma', entry_order: eduOrder++}) });

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
      country_code: countryCode,
      mobile_no: mobile_number, 
      about: null,
      google_scholar: scholarLink.trim() || null,
      linkedin: linkedin.trim() || null,
      pub_books: pubBooks,
      pub_papers: pubPapers,
      pub_chapters: pubChapters,
      pub_reports: pubReports,
      pub_policy_briefs: pubPolicyBriefs,
      gender: gender || null,
      state: candidateState || null,
      city: city || null,
      pincode: pincode || null,
      years_of_experience: totalYrs,
      last_salary: lastSalary ? parseFloat(lastSalary) : null,
      position_applied, 
      admin_department: position_applied === 'Admin' ? admin_department : null,
      schooling: {
        class_x_school: classXSchool.trim(),
        class_x_board: classXBoard === 'State Board' 
          ? `State Board - ${classXBoardState}` 
          : classXBoard === 'Other' 
            ? classXBoardOther.trim() 
            : classXBoard,
        class_x_score_type: classXScoreType,
        class_x_score_value: parseFloat(classXScoreValue),
        class_x_year: parseInt(classXYear, 10) || null,
        class_xii_school: classXIISchool.trim(),
        class_xii_board: classXIIBoard === 'State Board'
          ? `State Board - ${classXIIBoardState}`
          : classXIIBoard === 'Other'
            ? classXIIBoardOther.trim()
            : classXIIBoard,
        class_xii_score_type: classXIIScoreType,
        class_xii_score_value: parseFloat(classXIIScoreValue),
        class_xii_year: parseInt(classXIIYear, 10) || null
      },
      higher_education: educations.map(e => ({
        ...e,
        level: e.level === 'Bachelors' ? 'undergrad' : (e.level === 'Masters' ? 'postgrad' : (e.level === 'Doctorate' ? 'phd' : e.level)),
        grad_year: e.grad_year ? parseInt(e.grad_year, 10) : null,
        is_pursuing: !!e.is_pursuing,
        duration_value: e.duration_value ? parseInt(e.duration_value, 10) : null,
        duration_unit: e.duration_unit || null
      })),
      publications: [],
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
          if (Array.isArray(err.detail)) {
            errMessage = err.detail.map(e => `${e.loc ? e.loc.join('.') : 'Field'}: ${e.msg}`).join(' | ');
          } else {
            errMessage = err.detail || JSON.stringify(err);
          }
        } catch {
          errMessage = `Status ${res.status}: ${res.statusText || 'Internal Server Error'}`;
        }
        setSubmitError("Database Rejection: " + errMessage);
      }
    } catch (err) {
      console.error("Submission crash:", err);
      alert("A critical error occurred while submitting: " + err.message);
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setSubmitError("Could not connect to Backend. Ensure uvicorn is running on port 8000.");
      } else {
        setSubmitError("Could not connect to the server. Please check your internet connection or try again later.");
      }
    }
  };

  const handleSaveAsPdf = () => {
    // Close any open edits
    setEditPersonal(false);
    setEditEducation(false);
    setEditPublications(false);
    setEditWork(false);

    // Trigger printing
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleFinalSubmissionClick = () => {
    // Close any open edits first
    setEditPersonal(false);
    setEditEducation(false);
    setEditPublications(false);
    setEditWork(false);

    setTimeout(async () => {
      const errors = validateAllFields();
      if (errors) {
        alert("Cannot submit application because there are errors in your data:\n\n• " + errors.join("\n• "));
        return;
      }

      if (window.confirm("Are you sure you want to submit your application? This action cannot be undone.")) {
        await executeFinalSubmit();
      }
    }, 100);
  };

  const dividerStyle = { border: '0', borderTop: '1px solid var(--border-color)', margin: '2rem 0' };

  return (
    <div className="app-container">
      <header className="app-header">
        <img src="/logo.jpg" alt="RIS Logo" className="header-logo" />
        <h1 className="header-title">Apply to the RIS</h1>
        {jobDetail ? (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
             <p style={{ margin: 0, fontWeight: 700, color: '#1e3a8a' }}>Applying for: {jobDetail.title}</p>
             <p style={{ margin: 0, fontSize: '0.875rem', color: '#1d4ed8' }}>Division: {jobDetail.division}</p>
          </div>
        ) : (
          <p className="header-subtitle">Thank you for showing interest in joining our institution.</p>
        )}
      </header>

      <main className="main-container">
        <div className="stepper-container" style={{ display: step === 0 ? 'none' : 'block' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem', color: '#002147', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Step {step} of 5 — {step === 1 ? 'Personal Information' : (step === 2 ? 'Education & Qualifications' : (step === 3 ? 'Work Experience' : (step === 4 ? 'Publications & Research' : 'Review & Submit')))} ({Math.round(((step - 1) / 4) * 100)}% Completed)
          </div>
          <div className="stepper-wrapper">
            <div className="stepper-track">
              <div 
                className="stepper-progress-fill" 
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />
            </div>
            <div className="stepper-steps">
              {[
                { label: 'Info', num: 1 },
                { label: 'Education', num: 2 },
                { label: 'Work Experience', num: 3 },
                { label: 'Publications', num: 4 },
                { label: 'Review & Submit', num: 5 }
              ].map((s) => {
                const isActive = step >= s.num;
                const isCompleted = step > s.num;
                return (
                  <div key={s.num} className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                    <div className="stepper-circle">
                      {isCompleted ? '✓' : s.num}
                    </div>
                    <span className="stepper-label">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {submitError && <div style={{background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>{submitError}</div>}

        {jobDetail && step === 0 && (
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            
            {/* Appended Job Details & Full Description */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#002147', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {jobDetail.division || 'Research Division'}
                </span>
                {jobDetail.deadline && (
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c62828', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '4px' }}>
                    Last date: {new Date(jobDetail.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.3 }}>{jobDetail.title}</h2>
              
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                Vacancies: <span style={{ color: '#002147', fontWeight: 800 }}>{jobDetail.total_openings || 1}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginBottom: '16px' }}>
                * Number of vacancies may vary.
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#002147', marginBottom: '6px' }}>Job Scope & Description</h3>
                <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{jobDetail.description}</p>
              </div>

              {jobDetail.requirements && (
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#002147', marginBottom: '6px' }}>Requirements & Qualifications</h3>
                  <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{jobDetail.requirements}</p>
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Terms and Conditions</h2>
            <div style={{ 
              maxHeight: '180px', 
              overflowY: 'auto', 
              padding: '16px', 
              background: '#ffffff', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              fontSize: '13px', 
              color: '#334155', 
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0 }}>
                <li>The engagement is purely contractual and does not confer any right to regular appointment to the selected candidate.</li>
                <li>Selected candidates will have to join duty immediately upon receipt of the offer letter.</li>
                <li>Fulfilment of conditions of educational qualification and experience shall not necessarily entitle any applicant to be called for further process of recruitment.</li>
                <li>In case of a large number of applicants, RIS reserves the right to short-list the applications in any manner as may be considered appropriate and no reason for rejection shall be communicated.</li>
                <li>RIS reserves the right to fill or not to fill the post advertised. No correspondence whatsoever will be entertained from the candidates regarding postal delays, the conduct of the result of the interview and the reason for not being called for an interview.</li>
                <li>The decision of the committee w.r.t. shortlisting and selection will be final and binding. No query whatsoever will be dealt w.r.t. the same.</li>
              </ul>
              <p style={{ marginTop: '12px', marginBottom: 0, fontWeight: '700' }}>Interested candidates having the above qualifications and experience should only apply Online.</p>
            </div>
            
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
          </div>
        )}

        {step < 5 && (
          <form onSubmit={step === 4 ? handleProceedToPreview : handleNext} style={{ display: step === 0 ? 'none' : 'block' }}>
          {step === 1 && (
            <>
              {jobDetail ? (
                <div className="form-group">
                  <label className="form-label">Position Applied For</label>
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      {jobDetail.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Post / Role:</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c62828', background: '#fef2f2', border: '1px solid #fecaca', padding: '4px 12px', borderRadius: '6px' }}>
                        {jobDetail.position || position_applied}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Position Applied For</label>
                  <select 
                    className="form-input" 
                    value={position_applied} 
                    onChange={e => setPosition(e.target.value)}
                  >
                    <option>Professor</option>
                    <option>Associate Professor</option>
                    <option>Assistant Professor</option>
                    <option>Consultant</option>
                    <option>Research Assistant</option>
                    <option>Admin</option>
                  </select>
                </div>
              )}

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
                {/* Row 1 */}
                <div className="form-group col-5">
                  <label className="form-label">Full Name</label>
                  <input 
                    required 
                    className={`form-input ${(triedSubmit && !full_name) ? 'faulty-input' : ''}`} 
                    value={full_name} 
                    onChange={e => setFullName(e.target.value)} 
                  />
                </div>
                <div className="form-group col-5">
                  <label className="form-label">Email ID</label>
                  <input 
                    required 
                    type="email" 
                    className={`form-input ${(triedSubmit && !email) ? 'faulty-input' : ''}`} 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
                <div className="form-group col-2">
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

                {/* Row 2 */}
                <div className="form-group col-3">
                  <label className="form-label">Country Code</label>
                  <SearchableDropdown 
                    options={COUNTRY_CODES} 
                    value={countryCode} 
                    onChange={setCountryCode} 
                    placeholder="+91" 
                    className={`form-input ${(triedSubmit && !countryCode) ? 'faulty-input' : ''}`}
                  />
                </div>
                <div className="form-group col-4">
                  <label className="form-label">Mobile Number</label>
                  <input 
                    required 
                    className={`form-input ${(triedSubmit && !mobile_number) ? 'faulty-input' : ''}`} 
                    pattern="^\d{4,15}$" 
                    value={mobile_number} 
                    onChange={e => setMobile(e.target.value)} 
                  />
                </div>
                <div className="form-group col-5">
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
                  {/* Row 3 */}
                  <div className="form-group col-4">
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
                  <div className="form-group col-4">
                    <label className="form-label">City</label>
                  <input 
                    required 
                    className={`form-input ${(triedSubmit && !city) ? 'faulty-input' : ''}`} 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    placeholder="e.g. New Delhi"
                  />
                </div>
                <div className="form-group col-4">
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

              <button type="submit" className="btn-primary" style={{width: '100%'}}>Proceed to Education Options</button>
            </>
          )}

          {step === 2 && (
            <>
              <h3>Secondary Education</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                {/* Class X Details */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: '700' }}>Class X (Secondary)</h4>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">School Name</label>
                    <input required type="text" className="form-input" placeholder="e.g. St. Xavier's High School" value={classXSchool} onChange={e => setClassXSchool(e.target.value)} />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Board</label>
                    <select required className="form-input" value={classXBoard} onChange={e => setClassXBoard(e.target.value)}>
                      <option value="CBSE">CBSE</option>
                      <option value="CISCE">CISCE (ICSE)</option>
                      <option value="NIOS">NIOS</option>
                      <option value="State Board">State Board</option>
                      <option value="International Board">International Board (IB/Cambridge)</option>
                      <option value="Other">Other (Please Specify)</option>
                    </select>
                  </div>

                  {classXBoard === 'State Board' && (
                    <div className="form-group" style={{ marginBottom: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                      <label className="form-label">Select State Board</label>
                      <select required className="form-input" value={classXBoardState} onChange={e => setClassXBoardState(e.target.value)}>
                        <option value="">Select State / UT</option>
                        {INDIAN_STATES.map(s => (
                          <option key={s} value={s}>{s} Board</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {classXBoard === 'Other' && (
                    <div className="form-group" style={{ marginBottom: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                      <label className="form-label">Specify Board Name</label>
                      <input required type="text" className="form-input" placeholder="e.g. CBSE International" value={classXBoardOther} onChange={e => setClassXBoardOther(e.target.value)} />
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Scoring System & Value</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {['Percentage', 'CGPA (Out of 10)', 'CGPA (Out of 4)'].map(t => (
                        <button type="button" key={t} onClick={() => setClassXScoreType(t)} style={{ flex: 1, minWidth: '100px', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid', borderColor: classXScoreType === t ? 'var(--accent-primary, #002147)' : '#cbd5e1', background: classXScoreType === t ? '#eff6ff' : '#ffffff', color: classXScoreType === t ? 'var(--accent-primary, #002147)' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{t}</button>
                      ))}
                    </div>
                    <input required type="number" step="0.01" max={classXScoreType === 'CGPA (Out of 10)' ? '10' : classXScoreType === 'CGPA (Out of 4)' ? '4' : '100'} className="form-input" placeholder={classXScoreType.startsWith('CGPA') ? 'e.g. 3.5' : 'e.g. 95.00'} value={classXScoreValue} onChange={e => setClassXScoreValue(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year of Passing</label>
                    <input required type="number" min="1950" max="2030" placeholder="YYYY" className="form-input" value={classXYear} onChange={e => setClassXYear(e.target.value)} />
                  </div>
                </div>

                {/* Class XII Details */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: '700' }}>Class XII (Senior Secondary)</h4>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">School Name</label>
                    <input required type="text" className="form-input" placeholder="e.g. Bishop Cotton School" value={classXIISchool} onChange={e => setClassXIISchool(e.target.value)} />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Board</label>
                    <select required className="form-input" value={classXIIBoard} onChange={e => setClassXIIBoard(e.target.value)}>
                      <option value="CBSE">CBSE</option>
                      <option value="CISCE">CISCE (ISC)</option>
                      <option value="NIOS">NIOS</option>
                      <option value="State Board">State Board</option>
                      <option value="International Board">International Board (IB/Cambridge)</option>
                      <option value="Other">Other (Please Specify)</option>
                    </select>
                  </div>

                  {classXIIBoard === 'State Board' && (
                    <div className="form-group" style={{ marginBottom: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                      <label className="form-label">Select State Board</label>
                      <select required className="form-input" value={classXIIBoardState} onChange={e => setClassXIIBoardState(e.target.value)}>
                        <option value="">Select State / UT</option>
                        {INDIAN_STATES.map(s => (
                          <option key={s} value={s}>{s} Board</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {classXIIBoard === 'Other' && (
                    <div className="form-group" style={{ marginBottom: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                      <label className="form-label">Specify Board Name</label>
                      <input required type="text" className="form-input" placeholder="e.g. CBSE International" value={classXIIBoardOther} onChange={e => setClassXIIBoardOther(e.target.value)} />
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Scoring System & Value</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {['Percentage', 'CGPA (Out of 10)', 'CGPA (Out of 4)'].map(t => (
                        <button type="button" key={t} onClick={() => setClassXIIScoreType(t)} style={{ flex: 1, minWidth: '100px', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid', borderColor: classXIIScoreType === t ? 'var(--accent-primary, #002147)' : '#cbd5e1', background: classXIIScoreType === t ? '#eff6ff' : '#ffffff', color: classXIIScoreType === t ? 'var(--accent-primary, #002147)' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{t}</button>
                      ))}
                    </div>
                    <input required type="number" step="0.01" max={classXIIScoreType === 'CGPA (Out of 10)' ? '10' : classXIIScoreType === 'CGPA (Out of 4)' ? '4' : '100'} className="form-input" placeholder={classXIIScoreType.startsWith('CGPA') ? 'e.g. 3.5' : 'e.g. 95.00'} value={classXIIScoreValue} onChange={e => setClassXIIScoreValue(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year of Passing</label>
                    <input required type="number" min="1950" max="2030" placeholder="YYYY" className="form-input" value={classXIIYear} onChange={e => setClassXIIYear(e.target.value)} />
                  </div>
                </div>
              </div>

              <hr style={dividerStyle} />

              <h3 style={{marginBottom: '1rem'}}>Graduation Details</h3>
              {grads.map((g, i) => (
                <div className="form-grid" key={i} style={{marginBottom: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative'}}>
                  <div className="col-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#002147' }}>
                      Graduation Qualification #{i + 1}
                    </span>
                    {(grads.length > 1 || g.university || g.degree_name) && (
                      <button 
                        type="button" 
                        onClick={() => {
                          if (grads.length === 1) {
                            setGrads([{ university: '', degree_name: '', degree_select: '', degree_custom: '', degree_spec: '', score_type: 'Percentage', score_value: '', grad_year: '', is_pursuing: false }]);
                          } else {
                            removeEntry(setGrads, grads, i);
                          }
                        }}
                        style={{ 
                          color: '#ef4444', 
                          background: '#fef2f2', 
                          border: '1px solid #fecaca', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.78rem', 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Delete this graduation entry"
                      >
                        <Trash2 size={13} /> Delete Entry
                      </button>
                    )}
                  </div>
                  <div className="form-group col-5"><label className="form-label">University</label><UniversityAutocomplete className="form-input" value={g.university} onChange={val => updateEntry(setGrads, grads, i, 'university', val)} placeholder="Search university..." /></div>
                  <div className="form-group col-4">
                    <label className="form-label">Degree</label>
                    {g.degree_select === 'Other' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input 
                          className="form-input" 
                          placeholder="e.g. B.Sc. Hons" 
                          value={g.degree_custom || ''} 
                          onChange={e => {
                            const newCustom = e.target.value;
                            const newName = buildDegreeName('Other', g.degree_spec, newCustom);
                            const newGrads = [...grads];
                            newGrads[i] = {
                              ...newGrads[i],
                              degree_custom: newCustom,
                              degree_name: newName
                            };
                            setGrads(newGrads);
                          }} 
                        />
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{ whiteSpace: 'nowrap', padding: '0 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => {
                            const newName = buildDegreeName('', g.degree_spec, '');
                            const newGrads = [...grads];
                            newGrads[i] = {
                              ...newGrads[i],
                              degree_select: '',
                              degree_custom: '',
                              degree_name: newName
                            };
                            setGrads(newGrads);
                          }}
                        >
                          Select List
                        </button>
                      </div>
                    ) : (
                      <select 
                        className="form-input" 
                        value={g.degree_select || ''} 
                        onChange={e => {
                          const newSelect = e.target.value;
                          const newName = buildDegreeName(newSelect, g.degree_spec, g.degree_custom);
                          const newGrads = [...grads];
                          newGrads[i] = {
                            ...newGrads[i],
                            degree_select: newSelect,
                            degree_name: newName
                          };
                          setGrads(newGrads);
                        }}
                      >
                        <option value="">-- Select Degree --</option>
                        {UG_DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                        <option value="Other">Other (please specify)</option>
                      </select>
                    )}
                    {(g.degree_select?.includes('Integrated') || g.degree_select?.includes('Dual') || g.degree_select?.includes('BS-MS')) && (
                      <div style={{ marginTop: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                        💡 Integrated / Dual Degree: This qualification awards both Bachelor's and Master's degrees.
                      </div>
                    )}
                  </div>
                  <div className="form-group col-3">
                    <label className="form-label">Specialization / Discipline</label>
                    <SpecializationInput 
                      required={false}
                      className="form-input" 
                      placeholder="e.g. Economics, Mathematics" 
                      value={g.degree_spec || ''} 
                      onChange={newSpec => {
                        const newName = buildDegreeName(g.degree_select, newSpec, g.degree_custom);
                        const newGrads = [...grads];
                        newGrads[i] = {
                          ...newGrads[i],
                          degree_spec: newSpec,
                          degree_name: newName
                        };
                        setGrads(newGrads);
                      }} 
                    />
                  </div>
                  <div className="form-group col-3" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.25rem' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#002147', cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={g.is_pursuing || false} 
                        onChange={e => updateEntry(setGrads, grads, i, 'is_pursuing', e.target.checked)} 
                        style={{ width: '16px', height: '16px', accentColor: '#002147' }}
                      />
                      Currently Pursuing
                    </label>
                  </div>
                  <div className="form-group col-3"><label className="form-label">{g.is_pursuing ? 'Expected Completion Year' : 'Year of Passing'}</label><input required={!g.is_pursuing && (!!g.university || !!g.degree_name || !!g.score_value)} type="number" min={g.is_pursuing ? new Date().getFullYear() : 1950} max="2035" placeholder="YYYY" className="form-input" value={g.grad_year || ''} onChange={e => updateEntry(setGrads, grads, i, 'grad_year', e.target.value)} /></div>
                  <div className="form-group col-3"><label className="form-label">Score Type</label><select className="form-input" value={g.score_type} onChange={e => updateEntry(setGrads, grads, i, 'score_type', e.target.value)}><option>Percentage</option><option>CGPA (Out of 10)</option><option>CGPA (Out of 4)</option></select></div>
                  <div className="form-group col-3"><label className="form-label">{g.is_pursuing ? 'Current Score (Optional)' : `Score (<= ${g.score_type==='Percentage' ? '100' : g.score_type==='CGPA (Out of 4)' ? '4' : '10'})`}</label><input required={!g.is_pursuing && (!!g.university || !!g.degree_name)} type="number" step="0.01" max={g.score_type === 'CGPA (Out of 10)' ? '10' : g.score_type === 'CGPA (Out of 4)' ? '4' : '100'} className="form-input" value={g.score_value} onChange={e => updateEntry(setGrads, grads, i, 'score_value', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn-secondary" disabled={grads.length>=3} onClick={() => addEntry(setGrads, grads, 3, { university: '', degree_name: '', degree_select: '', degree_custom: '', degree_spec: '', score_type: 'Percentage', score_value: '', grad_year: '' })}>
                {grads.length > 0 ? '+ Add Another Graduation Degree' : '+ Add Graduation Degree'}
              </button>


              <hr style={dividerStyle} />

              <div 
                onClick={() => setShowPostGrad(!showPostGrad)} 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}
              >
                <h3 style={{margin: 0}}>Post Graduation Details</h3>
                {showPostGrad ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
              </div>
              
              {showPostGrad && (
                <>
                  {postGrads.map((g, i) => (
                    <div className="form-grid" key={i} style={{marginBottom: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative'}}>
                      <div className="col-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#002147' }}>
                          Post Graduation Qualification #{i + 1}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => removeEntry(setPostGrads, postGrads, i)}
                          style={{ 
                            color: '#ef4444', 
                            background: '#fef2f2', 
                            border: '1px solid #fecaca', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '0.78rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Delete this post graduation entry"
                        >
                          <Trash2 size={13} /> Delete Entry
                        </button>
                      </div>
                      <div className="form-group col-5"><label className="form-label">University</label><UniversityAutocomplete className="form-input" value={g.university} onChange={val => updateEntry(setPostGrads, postGrads, i, 'university', val)} placeholder="Search university..." /></div>
                      <div className="form-group col-4">
                    <label className="form-label">Degree</label>
                    {g.degree_select === 'Other' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input 
                          className="form-input" 
                          placeholder="e.g. M.Sc. Hons" 
                          value={g.degree_custom || ''} 
                          onChange={e => {
                            const newCustom = e.target.value;
                            const newName = buildDegreeName('Other', g.degree_spec, newCustom);
                            const newPostGrads = [...postGrads];
                            newPostGrads[i] = {
                              ...newPostGrads[i],
                              degree_custom: newCustom,
                              degree_name: newName
                            };
                            setPostGrads(newPostGrads);
                          }} 
                        />
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{ whiteSpace: 'nowrap', padding: '0 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => {
                            const newName = buildDegreeName('', g.degree_spec, '');
                            const newPostGrads = [...postGrads];
                            newPostGrads[i] = {
                              ...newPostGrads[i],
                              degree_select: '',
                              degree_custom: '',
                              degree_name: newName
                            };
                            setPostGrads(newPostGrads);
                          }}
                        >
                          Select List
                        </button>
                      </div>
                    ) : (
                      <select 
                        className="form-input" 
                        value={g.degree_select || ''} 
                        onChange={e => {
                          const newSelect = e.target.value;
                          const newName = buildDegreeName(newSelect, g.degree_spec, g.degree_custom);
                          const newPostGrads = [...postGrads];
                          newPostGrads[i] = {
                            ...newPostGrads[i],
                            degree_select: newSelect,
                            degree_name: newName
                          };
                          setPostGrads(newPostGrads);
                        }}
                      >
                        <option value="">-- Select Degree --</option>
                        {PG_DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                        <option value="Other">Other (please specify)</option>
                      </select>
                    )}
                  </div>
                  <div className="form-group col-3">
                    <label className="form-label">Specialization / Discipline</label>
                    <SpecializationInput 
                      required={false}
                      className="form-input" 
                      placeholder="e.g. Economics, Finance" 
                      value={g.degree_spec || ''} 
                      onChange={newSpec => {
                        const newName = buildDegreeName(g.degree_select, newSpec, g.degree_custom);
                        const newPostGrads = [...postGrads];
                        newPostGrads[i] = {
                          ...newPostGrads[i],
                          degree_spec: newSpec,
                          degree_name: newName
                        };
                        setPostGrads(newPostGrads);
                      }} 
                    />
                  </div>
                  <div className="form-group col-3" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.25rem' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#002147', cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={g.is_pursuing || false} 
                        onChange={e => updateEntry(setPostGrads, postGrads, i, 'is_pursuing', e.target.checked)} 
                        style={{ width: '16px', height: '16px', accentColor: '#002147' }}
                      />
                      Currently Pursuing
                    </label>
                  </div>
                  <div className="form-group col-3"><label className="form-label">{g.is_pursuing ? 'Expected Completion Year' : 'Year of Passing'}</label><input required={!g.is_pursuing && (!!g.university || !!g.degree_name || !!g.score_value)} type="number" min={g.is_pursuing ? new Date().getFullYear() : 1950} max="2035" placeholder="YYYY" className="form-input" value={g.grad_year || ''} onChange={e => updateEntry(setPostGrads, postGrads, i, 'grad_year', e.target.value)} /></div>
                  <div className="form-group col-3"><label className="form-label">Score Type</label><select className="form-input" value={g.score_type} onChange={e => updateEntry(setPostGrads, postGrads, i, 'score_type', e.target.value)}><option>Percentage</option><option>CGPA (Out of 10)</option><option>CGPA (Out of 4)</option></select></div>
                  <div className="form-group col-3"><label className="form-label">{g.is_pursuing ? 'Current Score (Optional)' : `Score (<= ${g.score_type==='Percentage' ? '100' : g.score_type==='CGPA (Out of 4)' ? '4' : '10'})`}</label><input type="number" step="0.01" max={g.score_type === 'CGPA (Out of 10)' ? '10' : g.score_type === 'CGPA (Out of 4)' ? '4' : '100'} className="form-input" value={g.score_value} onChange={e => updateEntry(setPostGrads, postGrads, i, 'score_value', e.target.value)} /></div>
                </div>
                  ))}
                  <button type="button" className="btn-secondary" disabled={postGrads.length>=3} onClick={() => addEntry(setPostGrads, postGrads, 3, { university: '', degree_name: '', degree_select: '', degree_custom: '', degree_spec: '', is_pursuing: false, score_type: 'Percentage', score_value: '', grad_year: '' })}>
                    {postGrads.length > 0 ? '+ Add Another Post Graduation Degree' : '+ Add Post Graduation Degree'}
                  </button>
                </>
              )}

              <hr style={dividerStyle} />

              <div 
                onClick={() => setShowDoctorate(!showDoctorate)} 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}
              >
                <h3 style={{margin: 0}}>Doctorate Details</h3>
                {showDoctorate ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
              </div>

              {showDoctorate && (
                <>
                  {doctorates.map((g, i) => (
                    <div className="form-grid" key={i} style={{marginBottom: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative'}}>
                      <div className="col-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#002147' }}>
                          Doctorate / Ph.D. Entry #{i + 1}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => removeEntry(setDoctorates, doctorates, i)}
                          style={{ 
                            color: '#ef4444', 
                            background: '#fef2f2', 
                            border: '1px solid #fecaca', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '0.78rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Delete this doctorate entry"
                        >
                          <Trash2 size={13} /> Delete Entry
                        </button>
                      </div>
                      <div className="form-group col-6"><label className="form-label">University</label><UniversityAutocomplete className="form-input" value={g.university} onChange={val => updateEntry(setDoctorates, doctorates, i, 'university', val)} placeholder="Search university..." /></div>
                      <div className="form-group col-6"><label className="form-label">Thesis Title</label><input className="form-input" value={g.thesis_title} onChange={e => updateEntry(setDoctorates, doctorates, i, 'thesis_title', e.target.value)} /></div>
                      <div className="form-group col-3" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.25rem' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#002147', cursor: 'pointer', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={g.is_pursuing || false} 
                            onChange={e => updateEntry(setDoctorates, doctorates, i, 'is_pursuing', e.target.checked)} 
                            style={{ width: '16px', height: '16px', accentColor: '#002147' }}
                          />
                          Currently Pursuing
                        </label>
                      </div>
                      <div className="form-group col-3"><label className="form-label">{g.is_pursuing ? 'Expected Completion Year' : 'Year of Passing'}</label><input required={!g.is_pursuing && (!!g.university || !!g.thesis_title || !!g.score_value)} type="number" min={g.is_pursuing ? new Date().getFullYear() : 1950} max="2035" placeholder="YYYY" className="form-input" value={g.grad_year || ''} onChange={e => updateEntry(setDoctorates, doctorates, i, 'grad_year', e.target.value)} /></div>
                      <div className="form-group col-3"><label className="form-label">Score Type</label><select className="form-input" value={g.score_type} onChange={e => updateEntry(setDoctorates, doctorates, i, 'score_type', e.target.value)}><option>Percentage</option><option>CGPA (Out of 10)</option><option>CGPA (Out of 4)</option></select></div>
                      <div className="form-group col-3"><label className="form-label">{g.is_pursuing ? 'Current Score (Optional)' : `Score (<= ${g.score_type==='Percentage' ? '100' : g.score_type==='CGPA (Out of 4)' ? '4' : '10'})`}</label><input type="number" step="0.01" max={g.score_type === 'CGPA (Out of 10)' ? '10' : g.score_type === 'CGPA (Out of 4)' ? '4' : '100'} className="form-input" value={g.score_value} onChange={e => updateEntry(setDoctorates, doctorates, i, 'score_value', e.target.value)} /></div>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" disabled={doctorates.length>=3} onClick={() => addEntry(setDoctorates, doctorates, 3, { university: '', thesis_title: '', score_type: 'Percentage', score_value: '', grad_year: '', is_pursuing: false })}>
                    {doctorates.length > 0 ? '+ Add Another Doctorate / Ph.D.' : '+ Add Doctorate / Ph.D.'}
                  </button>
                </>
              )}

              <hr style={dividerStyle} />

              <div 
                onClick={() => setShowDiploma(!showDiploma)} 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}
              >
                <h3 style={{margin: 0}}>Diploma / Certification Details</h3>
                {showDiploma ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
              </div>

              {showDiploma && (
                <>
                  {diplomas.map((g, i) => (
                    <div className="form-grid" key={i} style={{marginBottom: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative'}}>
                      <div className="col-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#002147' }}>
                          Diploma / Certificate Qualification #{i + 1}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => removeEntry(setDiplomas, diplomas, i)}
                          style={{ 
                            color: '#ef4444', 
                            background: '#fef2f2', 
                            border: '1px solid #fecaca', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '0.78rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Delete this diploma entry"
                        >
                          <Trash2 size={13} /> Delete Entry
                        </button>
                      </div>
                      <div className="form-group col-4">
                        <label className="form-label">University / Institute / Board</label>
                        <UniversityAutocomplete className="form-input" value={g.university} onChange={val => updateEntry(setDiplomas, diplomas, i, 'university', val)} placeholder="e.g. Polytechnic / Institute / University" />
                      </div>
                      <div className="form-group col-4">
                        <label className="form-label">Diploma / Certificate Type</label>
                        <select 
                          className="form-input" 
                          value={g.degree_select || ''} 
                          onChange={e => updateEntry(setDiplomas, diplomas, i, 'degree_select', e.target.value)}
                        >
                          <option value="">-- Select Diploma Type --</option>
                          {DIPLOMA_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group col-4">
                        <label className="form-label">Specialization / Subject</label>
                        <input 
                          className="form-input" 
                          placeholder="e.g. Public Policy, Computer Science" 
                          value={g.degree_spec || ''} 
                          onChange={e => updateEntry(setDiplomas, diplomas, i, 'degree_spec', e.target.value)} 
                        />
                      </div>
                      <div className="form-group col-3">
                        <label className="form-label">Diploma Duration</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="number" 
                            min="1" 
                            max="60" 
                            placeholder="Period" 
                            className="form-input" 
                            style={{ flex: 1 }}
                            value={g.duration_value || ''} 
                            onChange={e => updateEntry(setDiplomas, diplomas, i, 'duration_value', e.target.value)} 
                          />
                          <select 
                            className="form-input" 
                            style={{ width: '100px' }}
                            value={g.duration_unit || 'Years'} 
                            onChange={e => updateEntry(setDiplomas, diplomas, i, 'duration_unit', e.target.value)}
                          >
                            <option value="Years">Years</option>
                            <option value="Months">Months</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group col-3" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.25rem' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#002147', cursor: 'pointer', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={g.is_pursuing || false} 
                            onChange={e => updateEntry(setDiplomas, diplomas, i, 'is_pursuing', e.target.checked)} 
                            style={{ width: '16px', height: '16px', accentColor: '#002147' }}
                          />
                          Currently Pursuing
                        </label>
                      </div>
                      <div className="form-group col-2">
                        <label className="form-label">{g.is_pursuing ? 'Expected Year' : 'Year of Passing'}</label>
                        <input type="number" min={g.is_pursuing ? new Date().getFullYear() : 1950} max="2035" placeholder="YYYY" className="form-input" value={g.grad_year || ''} onChange={e => updateEntry(setDiplomas, diplomas, i, 'grad_year', e.target.value)} />
                      </div>
                      <div className="form-group col-2">
                        <label className="form-label">Score Type</label>
                        <select className="form-input" value={g.score_type} onChange={e => updateEntry(setDiplomas, diplomas, i, 'score_type', e.target.value)}>
                          <option>Percentage</option>
                          <option>CGPA (Out of 10)</option>
                          <option>CGPA (Out of 4)</option>
                        </select>
                      </div>
                      <div className="form-group col-2">
                        <label className="form-label">{g.is_pursuing ? 'Current Score' : 'Score'}</label>
                        <input type="number" step="0.01" className="form-input" value={g.score_value} onChange={e => updateEntry(setDiplomas, diplomas, i, 'score_value', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" disabled={diplomas.length>=3} onClick={() => addEntry(setDiplomas, diplomas, 3, { university: '', degree_name: '', degree_select: '', degree_custom: '', degree_spec: '', is_pursuing: false, score_type: 'Percentage', score_value: '', grad_year: '' })}>
                    {diplomas.length > 0 ? '+ Add Another Diploma / Certificate' : '+ Add Diploma / Certificate'}
                  </button>
                </>
              )}

              <div style={{display: 'flex'}}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Proceed to Work Experience</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3>Work Experience Details</h3>
              <p style={{marginBottom: '1rem'}}>Do you have prior work experience?</p>
              <div className="form-group" style={{marginBottom: '2rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <label className="form-label" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  Upload Resume (PDF)
                </label>
                <div 
                  onDragOver={e => e.preventDefault()} 
                  onDrop={e => {
                    e.preventDefault();
                    if(e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      if(file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
                        setResumeFile(file);
                      } else {
                        alert("Please drop a valid PDF file.");
                      }
                    }
                  }}
                  style={{
                    border: '2px dashed',
                    borderRadius: '8px',
                    padding: '32px',
                    textAlign: 'center',
                    background: (triedSubmit && !resumeFile) ? '#fef2f2' : '#ffffff',
                    borderColor: (triedSubmit && !resumeFile) ? '#ef4444' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => document.getElementById('resume-upload-input').click()}
                >
                  <input 
                    id="resume-upload-input"
                    type="file" 
                    accept="application/pdf" 
                    style={{ display: 'none' }} 
                    onChange={e => {
                      if(e.target.files && e.target.files[0]) setResumeFile(e.target.files[0]);
                    }} 
                  />
                  {resumeFile ? (
                    <div style={{ color: '#16a34a', fontWeight: '700' }}>
                      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ margin: '0 auto 8px auto', display: 'block' }}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      {resumeFile.name} (Selected)
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>Click or drag a new file to replace.</p>
                    </div>
                  ) : (
                    <div style={{ color: '#64748b' }}>
                      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ margin: '0 auto 8px auto', display: 'block', color: '#94a3b8' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <strong style={{ display: 'block', color: '#1e293b', marginBottom: '4px' }}>Click to Browse or Drag & Drop PDF here</strong>
                      <span style={{ fontSize: '12px' }}>Max size: 10MB.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Total Professional Experience</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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

                <div className="form-group">
                  <label className="form-label">Last / Current Salary (in ₹ INR Per Annum / LPA)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    className="form-input" 
                    placeholder="e.g. 6.5 (for ₹6.5 Lakhs per annum)" 
                    value={lastSalary} 
                    onChange={e => setLastSalary(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{marginBottom: '2rem'}}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Work Experience Entries</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>Freshers / candidates without prior work experience may leave this section blank.</p>
                {workExps.map((w, i) => (
                  <div key={i} style={{marginBottom: '1.25rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#002147' }}>
                        Experience Entry #{i + 1}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeEntry(setWorkExps, workExps, i)}
                        style={{ 
                          color: '#ef4444', 
                          background: '#fef2f2', 
                          border: '1px solid #fecaca', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.78rem', 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Delete this work experience entry"
                      >
                        <Trash2 size={13} /> Delete Entry
                      </button>
                    </div>
                    <div className="form-grid">
                      <div className="form-group col-4">
                        <label className="form-label">Organization / Employer</label>
                        <input className="form-input" value={w.company_name} onChange={e => updateEntry(setWorkExps, workExps, i, 'company_name', e.target.value)} placeholder="e.g. Research Institute / Company" />
                      </div>
                      <div className="form-group col-4">
                        <label className="form-label">Designation / Role</label>
                        <input className="form-input" value={w.role} onChange={e => updateEntry(setWorkExps, workExps, i, 'role', e.target.value)} placeholder="e.g. Research Associate / Analyst" />
                      </div>
                      <div className="form-group col-2">
                        <label className="form-label">Start Date</label>
                        <input type="date" className="form-input" value={w.start_date} onChange={e => updateEntry(setWorkExps, workExps, i, 'start_date', e.target.value)} />
                      </div>
                      <div className="form-group col-2">
                        <label className="form-label" title="Leave blank if currently working here">End Date <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'normal' }}>(Optional)</span></label>
                        <input type="date" className="form-input" value={w.end_date} onChange={e => updateEntry(setWorkExps, workExps, i, 'end_date', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-secondary" disabled={workExps.length>=3} onClick={() => addEntry(setWorkExps, workExps, 3, { company_name: '', start_date: '', end_date: '', role: '', description: '' })}>
                  {workExps.length > 0 ? '+ Add Another Work Experience' : '+ Add Work Experience'}
                </button>
              </div>

              <div style={{display: 'flex'}}>
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Proceed to Publications</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3>Publications / Works Authored</h3>
              <p style={{marginBottom: '1.5rem', color: 'var(--text-secondary)'}}>
                Select publication categories from the dropdown menu and enter the number of published works under each (leave blank if none):
              </p>

              <div style={{ marginBottom: '2rem' }}>
                {pubEntries.map((pe, idx) => (
                  <div key={idx} style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div className="form-grid" style={{ alignItems: 'center' }}>
                      <div className="form-group col-7" style={{ marginBottom: 0 }}>
                        <label className="form-label">Publication Category</label>
                        <select 
                          className="form-input"
                          value={pe.category}
                          onChange={e => updatePubEntry(idx, 'category', e.target.value)}
                        >
                          {PUBLICATION_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group col-3" style={{ marginBottom: 0 }}>
                        <label className="form-label">Number of Publications</label>
                        <input 
                          type="number" 
                          min="0"
                          max="200"
                          className="form-input" 
                          value={pe.count}
                          onChange={e => updatePubEntry(idx, 'count', Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="e.g. 3"
                        />
                      </div>

                      <div className="form-group col-2" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end', paddingTop: '1.5rem' }}>
                        <button 
                          type="button" 
                          onClick={() => removePubEntry(idx)}
                          style={{ 
                            color: '#ef4444', 
                            background: '#fef2f2', 
                            border: '1px solid #fecaca', 
                            padding: '0.65rem 0.9rem', 
                            borderRadius: '8px', 
                            fontSize: '0.82rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: '100%',
                            justifyContent: 'center'
                          }}
                          title="Remove category"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {pubEntries.length < 5 && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={addPubEntry}
                  >
                    + Add Publication Category
                  </button>
                )}
              </div>

              <hr style={dividerStyle} />
              
              <div className="form-grid" style={{ marginBottom: '2rem' }}>
                <div className="form-group col-6">
                  <label className="form-label">Google Scholar Link (Optional)</label>
                  <input type="url" className="form-input" value={scholarLink} onChange={e => setScholarLink(e.target.value)} placeholder="e.g. https://scholar.google.com/citations?user=..." />
                </div>
                <div className="form-group col-6">
                  <label className="form-label">LinkedIn Profile Link (Optional)</label>
                  <input type="url" className="form-input" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="e.g. https://linkedin.com/in/..." />
                </div>
              </div>

              <div style={{display: 'flex'}}>
                <button type="button" className="btn-secondary" onClick={() => setStep(3)}>Back</button>
                <button type="submit" className="btn-primary" style={{flex: 1, backgroundColor: 'var(--brand-accent)', color: '#000'}}>Proceed to Preview</button>
              </div>
            </>
          )}
        </form>
        )}

        {step === 5 && (
          <div className="resume-preview-container">
            <div className="resume-preview-card">
              {/* Resume Header */}
              <div className="resume-header">
                {editPersonal ? (
                  <div className="resume-inline-grid-edit">
                    <div className="resume-inline-group">
                      <label className="resume-inline-label">Full Name</label>
                      <input 
                        className="resume-inline-input"
                        value={full_name}
                        onChange={e => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="resume-inline-group">
                      <label className="resume-inline-label">Position Applied</label>
                      <select 
                        className="resume-inline-input"
                        value={position_applied}
                        onChange={e => setPosition(e.target.value)}
                        disabled={!!jobId}
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
                      <div className="resume-inline-group">
                        <label className="resume-inline-label">Department</label>
                        <select 
                          className="resume-inline-input"
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
                    <div className="resume-inline-group">
                      <label className="resume-inline-label">Email ID</label>
                      <input 
                        type="email"
                        className="resume-inline-input"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="resume-inline-group">
                      <label className="resume-inline-label">Mobile Number</label>
                      <input 
                        className="resume-inline-input"
                        value={mobile_number}
                        onChange={e => setMobile(e.target.value)}
                      />
                    </div>
                    <div className="resume-inline-group">
                      <label className="resume-inline-label">Date of Birth</label>
                      <input 
                        className="resume-inline-input"
                        value={dob}
                        onChange={handleDobChange}
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                    <div className="resume-inline-group">
                      <label className="resume-inline-label">Gender</label>
                      <select 
                        className="resume-inline-input"
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
                    <div className="resume-inline-group">
                      <label className="resume-inline-label">State / UT</label>
                      <select 
                        className="resume-inline-input"
                        value={candidateState}
                        onChange={e => setCandidateState(e.target.value)}
                      >
                        <option value="">Select State / UT</option>
                        {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="resume-inline-group">
                      <label className="resume-inline-label">City</label>
                      <input 
                        className="resume-inline-input"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                      />
                    </div>
                    <div className="resume-inline-group">
                      <label className="resume-inline-label">Pincode</label>
                      <input 
                        className="resume-inline-input"
                        value={pincode}
                        onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="resume-title">{full_name || "Candidate Name"}</h2>
                    <div className="resume-subtitle">
                      {position_applied} {position_applied === 'Admin' ? `(${admin_department} Department)` : ''}
                    </div>
                    <div className="resume-contact-info">
                      <span className="resume-contact-item">📧 {email}</span>
                      <span className="resume-contact-item">📱 {countryCode} {mobile_number}</span>
                      <span className="resume-contact-item">📍 {city}, {candidateState} - {pincode}</span>
                      <span className="resume-contact-item">🎂 {dob}</span>
                      <span className="resume-contact-item">👤 {gender}</span>

                    </div>
                  </>
                )}
                
                <div className="resume-section-actions no-print" style={{ marginTop: '1rem', borderTop: 'none' }}>
                  <button 
                    type="button" 
                    className="section-edit-btn" 
                    onClick={handleToggleEditPersonal}
                  >
                    {editPersonal ? "Save Personal Info" : "Edit Personal Info"}
                  </button>
                </div>
              </div>


              {/* Education Section */}
              <div className="resume-section">
                <div className="resume-section-title-container">
                  <h3 className="resume-section-title">Education</h3>
                  <button 
                    type="button" 
                    className="section-edit-btn no-print" 
                    onClick={handleToggleEditEducation}
                  >
                    {editEducation ? "Save Education" : "Edit Education"}
                  </button>
                </div>

                {editEducation ? (
                  <div>
                    <h4 style={{ marginBottom: '0.5rem' }}>Secondary Education</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                      {/* Class X Edit */}
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '11px', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Class X Details</div>
                        <div className="resume-inline-group" style={{ marginBottom: '0.5rem' }}>
                          <label className="resume-inline-label">School Name</label>
                          <input type="text" className="resume-inline-input" value={classXSchool} onChange={e => setClassXSchool(e.target.value)} />
                        </div>
                        <div className="resume-inline-group" style={{ marginBottom: '0.5rem' }}>
                          <label className="resume-inline-label">Board</label>
                          <select className="resume-inline-input" value={classXBoard} onChange={e => setClassXBoard(e.target.value)}>
                            <option value="CBSE">CBSE</option>
                            <option value="CISCE">CISCE (ICSE)</option>
                            <option value="NIOS">NIOS</option>
                            <option value="State Board">State Board</option>
                            <option value="International Board">International Board</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        {classXBoard === 'State Board' && (
                          <div className="resume-inline-group" style={{ marginBottom: '0.5rem' }}>
                            <label className="resume-inline-label">State</label>
                            <select className="resume-inline-input" value={classXBoardState} onChange={e => setClassXBoardState(e.target.value)}>
                              <option value="">Select State</option>
                              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}
                        {classXBoard === 'Other' && (
                          <div className="resume-inline-group" style={{ marginBottom: '0.5rem' }}>
                            <label className="resume-inline-label">Specify Board</label>
                            <input type="text" className="resume-inline-input" value={classXBoardOther} onChange={e => setClassXBoardOther(e.target.value)} />
                          </div>
                        )}
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Score</label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <select className="resume-inline-input" style={{ width: '80px', flexShrink: 0 }} value={classXScoreType} onChange={e => setClassXScoreType(e.target.value)}>
                              <option value="Percentage">%</option>
                              <option value="CGPA (Out of 10)">CGPA (10)</option>
                              <option value="CGPA (Out of 4)">CGPA (4)</option>
                            </select>
                            <input type="number" step="0.01" max={classXScoreType === 'CGPA (Out of 10)' ? '10' : classXScoreType === 'CGPA (Out of 4)' ? '4' : '100'} className="resume-inline-input" value={classXScoreValue} onChange={e => setClassXScoreValue(e.target.value)} />
                          </div>
                        </div>
                        <div className="resume-inline-group" style={{ marginTop: '0.5rem' }}>
                          <label className="resume-inline-label">Year of Passing</label>
                          <input type="number" min="1950" max="2030" placeholder="YYYY" className="resume-inline-input" value={classXYear} onChange={e => setClassXYear(e.target.value)} />
                        </div>
                      </div>

                      {/* Class XII Edit */}
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '11px', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Class XII Details</div>
                        <div className="resume-inline-group" style={{ marginBottom: '0.5rem' }}>
                          <label className="resume-inline-label">School Name</label>
                          <input type="text" className="resume-inline-input" value={classXIISchool} onChange={e => setClassXIISchool(e.target.value)} />
                        </div>
                        <div className="resume-inline-group" style={{ marginBottom: '0.5rem' }}>
                          <label className="resume-inline-label">Board</label>
                          <select className="resume-inline-input" value={classXIIBoard} onChange={e => setClassXIIBoard(e.target.value)}>
                            <option value="CBSE">CBSE</option>
                            <option value="CISCE">CISCE (ISC)</option>
                            <option value="NIOS">NIOS</option>
                            <option value="State Board">State Board</option>
                            <option value="International Board">International Board</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        {classXIIBoard === 'State Board' && (
                          <div className="resume-inline-group" style={{ marginBottom: '0.5rem' }}>
                            <label className="resume-inline-label">State</label>
                            <select className="resume-inline-input" value={classXIIBoardState} onChange={e => setClassXIIBoardState(e.target.value)}>
                              <option value="">Select State</option>
                              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}
                        {classXIIBoard === 'Other' && (
                          <div className="resume-inline-group" style={{ marginBottom: '0.5rem' }}>
                            <label className="resume-inline-label">Specify Board</label>
                            <input type="text" className="resume-inline-input" value={classXIIBoardOther} onChange={e => setClassXIIBoardOther(e.target.value)} />
                          </div>
                        )}
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Score</label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <select className="resume-inline-input" style={{ width: '80px', flexShrink: 0 }} value={classXIIScoreType} onChange={e => setClassXIIScoreType(e.target.value)}>
                              <option value="Percentage">%</option>
                              <option value="CGPA (Out of 10)">CGPA (10)</option>
                              <option value="CGPA (Out of 4)">CGPA (4)</option>
                            </select>
                            <input type="number" step="0.01" max={classXIIScoreType === 'CGPA (Out of 10)' ? '10' : classXIIScoreType === 'CGPA (Out of 4)' ? '4' : '100'} className="resume-inline-input" value={classXIIScoreValue} onChange={e => setClassXIIScoreValue(e.target.value)} />
                          </div>
                        </div>
                        <div className="resume-inline-group" style={{ marginTop: '0.5rem' }}>
                          <label className="resume-inline-label">Year of Passing</label>
                          <input type="number" min="1950" max="2030" placeholder="YYYY" className="resume-inline-input" value={classXIIYear} onChange={e => setClassXIIYear(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <h4 style={{ marginBottom: '0.5rem' }}>Graduation Details (Min 1 required)</h4>
                    {grads.map((g, i) => (
                      <div className="resume-inline-grid-edit" key={i} style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">University</label>
                          <UniversityAutocomplete className="resume-inline-input" value={g.university} onChange={val => updateEntry(setGrads, grads, i, 'university', val)} placeholder="Search university..." />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Degree</label>
                          {g.degree_select === 'Other' ? (
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                              <input 
                                className="resume-inline-input" 
                                placeholder="e.g. B.Sc. Hons" 
                                value={g.degree_custom || ''} 
                                onChange={e => {
                                  const newCustom = e.target.value;
                                  const newName = buildDegreeName('Other', g.degree_spec, newCustom);
                                  const newGrads = [...grads];
                                  newGrads[i] = {
                                    ...newGrads[i],
                                    degree_custom: newCustom,
                                    degree_name: newName
                                  };
                                  setGrads(newGrads);
                                }} 
                              />
                              <button 
                                type="button" 
                                className="btn-secondary" 
                                style={{ whiteSpace: 'nowrap', padding: '0 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => {
                                  const newName = buildDegreeName('', g.degree_spec, '');
                                  const newGrads = [...grads];
                                  newGrads[i] = {
                                    ...newGrads[i],
                                    degree_select: '',
                                    degree_custom: '',
                                    degree_name: newName
                                  };
                                  setGrads(newGrads);
                                }}
                              >
                                List
                              </button>
                            </div>
                          ) : (
                            <select 
                              className="resume-inline-input" 
                              value={g.degree_select || ''} 
                              onChange={e => {
                                const newSelect = e.target.value;
                                const newName = buildDegreeName(newSelect, g.degree_spec, g.degree_custom);
                                const newGrads = [...grads];
                                newGrads[i] = {
                                  ...newGrads[i],
                                  degree_select: newSelect,
                                  degree_name: newName
                                };
                                setGrads(newGrads);
                              }}
                            >
                              <option value="">-- Select Degree --</option>
                              {UG_DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                              <option value="Other">Other (please specify)</option>
                            </select>
                          )}
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Specialization / Discipline</label>
                          <SpecializationInput 
                            required={false}
                            className="resume-inline-input" 
                            placeholder="e.g. Economics, Physics" 
                            value={g.degree_spec || ''} 
                            onChange={newSpec => {
                              const newName = buildDegreeName(g.degree_select, newSpec, g.degree_custom);
                              const newGrads = [...grads];
                              newGrads[i] = {
                                ...newGrads[i],
                                degree_spec: newSpec,
                                degree_name: newName
                              };
                              setGrads(newGrads);
                            }} 
                          />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Score Type</label>
                          <select className="resume-inline-input" value={g.score_type} onChange={e => updateEntry(setGrads, grads, i, 'score_type', e.target.value)}>
                            <option>Percentage</option>
                            <option>CGPA</option>
                          </select>
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Score</label>
                          <input type="number" step="0.01" className="resume-inline-input" value={g.score_value} onChange={e => updateEntry(setGrads, grads, i, 'score_value', e.target.value)} />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Year of Passing</label>
                          <input type="number" min="1950" max="2030" className="resume-inline-input" value={g.grad_year || ''} onChange={e => updateEntry(setGrads, grads, i, 'grad_year', e.target.value)} />
                        </div>
                        {grads.length > 1 && (
                          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="resume-delete-btn" onClick={() => removeEntry(setGrads, grads, i)}>❌ Remove Entry</button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn-secondary" style={{ marginTop: '0', marginBottom: '1.5rem' }} disabled={grads.length>=3} onClick={() => addEntry(setGrads, grads, 3, { university: '', degree_name: '', degree_select: '', degree_custom: '', degree_spec: '', score_type: 'Percentage', score_value: '', grad_year: '' })}>+ Add Graduation Detail</button>

                    <h4 style={{ marginBottom: '0.5rem' }}>Post Graduation Details</h4>
                    {postGrads.map((g, i) => (
                      <div className="resume-inline-grid-edit" key={i} style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">University</label>
                          <UniversityAutocomplete className="resume-inline-input" value={g.university} onChange={val => updateEntry(setPostGrads, postGrads, i, 'university', val)} placeholder="Search university..." />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Degree</label>
                          {g.degree_select === 'Other' ? (
                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                              <input 
                                className="resume-inline-input" 
                                placeholder="e.g. M.Sc. Hons" 
                                value={g.degree_custom || ''} 
                                onChange={e => {
                                  const newCustom = e.target.value;
                                  const newName = buildDegreeName('Other', g.degree_spec, newCustom);
                                  const newPostGrads = [...postGrads];
                                  newPostGrads[i] = {
                                    ...newPostGrads[i],
                                    degree_custom: newCustom,
                                    degree_name: newName
                                  };
                                  setPostGrads(newPostGrads);
                                }} 
                              />
                              <button 
                                type="button" 
                                className="btn-secondary" 
                                style={{ whiteSpace: 'nowrap', padding: '0 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => {
                                  const newName = buildDegreeName('', g.degree_spec, '');
                                  const newPostGrads = [...postGrads];
                                  newPostGrads[i] = {
                                    ...newPostGrads[i],
                                    degree_select: '',
                                    degree_custom: '',
                                    degree_name: newName
                                  };
                                  setPostGrads(newPostGrads);
                                }}
                              >
                                List
                              </button>
                            </div>
                          ) : (
                            <select 
                              className="resume-inline-input" 
                              value={g.degree_select || ''} 
                              onChange={e => {
                                const newSelect = e.target.value;
                                const newName = buildDegreeName(newSelect, g.degree_spec, g.degree_custom);
                                const newPostGrads = [...postGrads];
                                newPostGrads[i] = {
                                  ...newPostGrads[i],
                                  degree_select: newSelect,
                                  degree_name: newName
                                };
                                setPostGrads(newPostGrads);
                              }}
                            >
                              <option value="">-- Select Degree --</option>
                              {PG_DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                              <option value="Other">Other (please specify)</option>
                            </select>
                          )}
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Specialization / Discipline</label>
                          <SpecializationInput 
                            required={false}
                            className="resume-inline-input" 
                            placeholder="e.g. Economics, Finance" 
                            value={g.degree_spec || ''} 
                            onChange={newSpec => {
                              const newName = buildDegreeName(g.degree_select, newSpec, g.degree_custom);
                              const newPostGrads = [...postGrads];
                              newPostGrads[i] = {
                                ...newPostGrads[i],
                                degree_spec: newSpec,
                                degree_name: newName
                              };
                              setPostGrads(newPostGrads);
                            }} 
                          />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Score Type</label>
                          <select className="resume-inline-input" value={g.score_type} onChange={e => updateEntry(setPostGrads, postGrads, i, 'score_type', e.target.value)}>
                            <option>Percentage</option>
                            <option>CGPA</option>
                          </select>
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Score</label>
                          <input type="number" step="0.01" className="resume-inline-input" value={g.score_value} onChange={e => updateEntry(setPostGrads, postGrads, i, 'score_value', e.target.value)} />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Year of Passing</label>
                          <input type="number" min="1950" max="2030" className="resume-inline-input" value={g.grad_year || ''} onChange={e => updateEntry(setPostGrads, postGrads, i, 'grad_year', e.target.value)} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="button" className="resume-delete-btn" onClick={() => removeEntry(setPostGrads, postGrads, i)}>❌ Remove Entry</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn-secondary" style={{ marginTop: '0', marginBottom: '1.5rem' }} disabled={postGrads.length>=3} onClick={() => addEntry(setPostGrads, postGrads, 3, { university: '', degree_name: '', degree_select: '', degree_custom: '', degree_spec: '', score_type: 'Percentage', score_value: '', grad_year: '' })}>+ Add Post Graduation</button>

                    <h4 style={{ marginBottom: '0.5rem' }}>Doctorate Details</h4>
                    {doctorates.map((g, i) => (
                      <div className="resume-inline-grid-edit" key={i} style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">University</label>
                          <UniversityAutocomplete className="resume-inline-input" value={g.university} onChange={val => updateEntry(setDoctorates, doctorates, i, 'university', val)} placeholder="Search university..." />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Thesis Title</label>
                          <input className="resume-inline-input" value={g.thesis_title} onChange={e => updateEntry(setDoctorates, doctorates, i, 'thesis_title', e.target.value)} />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Score Type</label>
                          <select className="resume-inline-input" value={g.score_type} onChange={e => updateEntry(setDoctorates, doctorates, i, 'score_type', e.target.value)}>
                            <option>Percentage</option>
                            <option>CGPA</option>
                          </select>
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Score</label>
                          <input type="number" step="0.01" className="resume-inline-input" value={g.score_value} onChange={e => updateEntry(setDoctorates, doctorates, i, 'score_value', e.target.value)} />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Year of Passing</label>
                          <input type="number" min="1950" max="2030" className="resume-inline-input" value={g.grad_year || ''} onChange={e => updateEntry(setDoctorates, doctorates, i, 'grad_year', e.target.value)} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="button" className="resume-delete-btn" onClick={() => removeEntry(setDoctorates, doctorates, i)}>❌ Remove Entry</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn-secondary" style={{ marginTop: '0' }} disabled={doctorates.length>=3} onClick={() => addEntry(setDoctorates, doctorates, 3, { university: '', thesis_title: '', score_type: 'Percentage', score_value: '', grad_year: '' })}>+ Add Doctorate</button>
                  </div>
                ) : (
                  <table className="resume-table">
                    <thead>
                      <tr>
                        <th>Level / Degree</th>
                        <th>School / University</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <span className="resume-item-title">Class X {classXYear && `(${classXYear})`}</span>
                          <div className="resume-item-subtitle">{classXBoard === 'State Board' ? `State Board - ${classXBoardState}` : classXBoard === 'Other' ? classXBoardOther : classXBoard}</div>
                        </td>
                        <td>{classXSchool || 'Secondary Schooling'}</td>
                        <td>{classXScoreValue}{classXScoreType === 'Percentage' ? '%' : ' CGPA'}</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="resume-item-title">Class XII {classXIIYear && `(${classXIIYear})`}</span>
                          <div className="resume-item-subtitle">{classXIIBoard === 'State Board' ? `State Board - ${classXIIBoardState}` : classXIIBoard === 'Other' ? classXIIBoardOther : classXIIBoard}</div>
                        </td>
                        <td>{classXIISchool || 'Senior Secondary Schooling'}</td>
                        <td>{classXIIScoreValue}{classXIIScoreType === 'Percentage' ? '%' : ' CGPA'}</td>
                      </tr>
                      {grads.map((g, i) => g.university && (
                        <tr key={`g-${i}`}>
                          <td>
                            <span className="resume-item-title">Bachelors Degree {g.grad_year && `(${g.grad_year})`}</span>
                            <div className="resume-item-subtitle">{g.degree_name}</div>
                          </td>
                          <td>{g.university}</td>
                          <td>{g.score_value} ({g.score_type === 'Percentage' ? '%' : 'CGPA'})</td>
                        </tr>
                      ))}
                      {postGrads.map((g, i) => g.university && (
                        <tr key={`pg-${i}`}>
                          <td>
                            <span className="resume-item-title">Masters Degree {g.grad_year && `(${g.grad_year})`}</span>
                            <div className="resume-item-subtitle">{g.degree_name}</div>
                          </td>
                          <td>{g.university}</td>
                          <td>{g.score_value} ({g.score_type === 'Percentage' ? '%' : 'CGPA'})</td>
                        </tr>
                      ))}
                      {doctorates.map((g, i) => g.university && (
                        <tr key={`phd-${i}`}>
                          <td>
                            <span className="resume-item-title">Doctorate Degree (Ph.D) {g.grad_year && `(${g.grad_year})`}</span>
                            <div className="resume-item-subtitle">Thesis: {g.thesis_title}</div>
                          </td>
                          <td>{g.university}</td>
                          <td>{g.score_value} ({g.score_type === 'Percentage' ? '%' : 'CGPA'})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Work Experience Section */}
              <div className="resume-section">
                <div className="resume-section-title-container">
                  <h3 className="resume-section-title">Professional Experience</h3>
                  <button 
                    type="button" 
                    className="section-edit-btn no-print" 
                    onClick={handleToggleEditWork}
                  >
                    {editWork ? "Save Experience" : "Edit Experience"}
                  </button>
                </div>

                {editWork ? (
                  <div>
                    <div className="resume-inline-grid-edit" style={{ marginBottom: '1rem' }}>
                      <div className="resume-inline-group">
                        <label className="resume-inline-label">Total Exp Years</label>
                        <input 
                          type="number" min="0" className="resume-inline-input"
                          value={expYears} onChange={e => setExpYears(e.target.value)}
                        />
                      </div>
                      <div className="resume-inline-group">
                        <label className="resume-inline-label">Total Exp Months</label>
                        <input 
                          type="number" min="0" max="11" className="resume-inline-input"
                          value={expMonths} onChange={e => setExpMonths(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="resume-inline-group" style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                      <label className="resume-inline-label" style={{ fontWeight: '700' }}>Uploaded Resume (PDF)</label>
                      <div 
                        onDragOver={e => e.preventDefault()} 
                        onDrop={e => {
                          e.preventDefault();
                          if(e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            if(file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
                              setResumeFile(file);
                            } else {
                              alert("Please drop a valid PDF file.");
                            }
                          }
                        }}
                        style={{
                          border: '2px dashed #cbd5e1',
                          borderRadius: '8px',
                          padding: '24px',
                          textAlign: 'center',
                          background: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          marginTop: '8px'
                        }}
                        onClick={() => document.getElementById('resume-upload-input-review').click()}
                      >
                        <input 
                          id="resume-upload-input-review"
                          type="file" 
                          accept="application/pdf" 
                          style={{ display: 'none' }} 
                          onChange={e => {
                            if(e.target.files && e.target.files[0]) setResumeFile(e.target.files[0]);
                          }} 
                        />
                        {resumeFile ? (
                          <div style={{ color: '#16a34a', fontWeight: '700' }}>
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ margin: '0 auto 4px auto', display: 'block' }}>
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            {resumeFile.name} (Selected)
                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>Click or drag to replace.</p>
                          </div>
                        ) : (
                          <div style={{ color: '#64748b' }}>
                            <strong style={{ display: 'block', color: '#1e293b', marginBottom: '2px' }}>Click or Drag PDF here</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="resume-inline-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="resume-inline-label">Do you want to add specific detailed work entries?</label>
                      <div style={{ display: 'flex', gap: '2rem', marginTop: '0.25rem' }}>
                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="radio" name="resume_has_work" checked={hasWork} onChange={() => setHasWork(true)} /> Yes</label>
                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="radio" name="resume_has_work" checked={!hasWork} onChange={() => setHasWork(false)} /> No</label>
                      </div>
                    </div>

                    {hasWork && (
                      <div>
                        {workExps.map((w, i) => (
                          <div key={i} style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                            <div className="resume-inline-grid-edit">
                              <div className="resume-inline-group">
                                <label className="resume-inline-label">Organization</label>
                                <input className="resume-inline-input" value={w.company_name} onChange={e => updateEntry(setWorkExps, workExps, i, 'company_name', e.target.value)} />
                              </div>
                              <div className="resume-inline-group">
                                <label className="resume-inline-label">Designation</label>
                                <input className="resume-inline-input" value={w.role} onChange={e => updateEntry(setWorkExps, workExps, i, 'role', e.target.value)} />
                              </div>
                              <div className="resume-inline-group">
                                <label className="resume-inline-label">Start Date</label>
                                <input type="date" className="resume-inline-input" value={w.start_date} onChange={e => updateEntry(setWorkExps, workExps, i, 'start_date', e.target.value)} />
                              </div>
                              <div className="resume-inline-group">
                                <label className="resume-inline-label">End Date (Leave blank if present)</label>
                                <input type="date" className="resume-inline-input" value={w.end_date} onChange={e => updateEntry(setWorkExps, workExps, i, 'end_date', e.target.value)} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                              <button type="button" className="resume-delete-btn" onClick={() => removeEntry(setWorkExps, workExps, i)}>❌ Remove Work Entry</button>
                            </div>
                          </div>
                        ))}
                        <button type="button" className="btn-secondary" style={{ marginTop: '0' }} disabled={workExps.length>=3} onClick={() => addEntry(setWorkExps, workExps, 3, { company_name: '', start_date: '', end_date: '', role: '' })}>+ Add Work Experience</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>
                      💼 <strong>Total Experience:</strong> {expYears || 0} Years, {expMonths || 0} Months
                      {resumeFile && <span style={{ marginLeft: '1.5rem', color: 'var(--brand-primary)', fontWeight: '600' }}>📄 Attachment: {resumeFile.name}</span>}
                    </p>

                    {!hasWork ? (
                      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No detailed timeline entries added.</p>
                    ) : (
                      <div>
                        {workExps.map((w, i) => w.company_name && (
                          <div className="resume-timeline-item" key={`w-${i}`}>
                            <div className="resume-timeline-header">
                              <div>
                                <span className="resume-item-title">{w.role}</span>
                                <span style={{ color: 'var(--text-secondary)' }}> at </span>
                                <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{w.company_name}</span>
                              </div>
                              <span className="resume-timeline-date">
                                {w.start_date ? new Date(w.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - {w.end_date ? new Date(w.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Publications Section */}
              <div className="resume-section" style={{ marginBottom: '0' }}>
                <div className="resume-section-title-container">
                  <h3 className="resume-section-title">Publications & Works</h3>
                  <button 
                    type="button" 
                    className="section-edit-btn no-print" 
                    onClick={handleToggleEditPublications}
                  >
                    {editPublications ? "Save Publications" : "Edit Publications"}
                  </button>
                </div>

                {editPublications ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="resume-inline-group">
                        <label className="resume-inline-label">Books Published</label>
                        <input type="number" min="0" className="resume-inline-input" value={pubBooks} onChange={e => setPubBooks(Math.max(0, parseInt(e.target.value) || 0))} />
                      </div>
                      <div className="resume-inline-group">
                        <label className="resume-inline-label">Peer-Reviewed Papers</label>
                        <input type="number" min="0" className="resume-inline-input" value={pubPapers} onChange={e => setPubPapers(Math.max(0, parseInt(e.target.value) || 0))} />
                      </div>
                      <div className="resume-inline-group">
                        <label className="resume-inline-label">Book Chapters</label>
                        <input type="number" min="0" className="resume-inline-input" value={pubChapters} onChange={e => setPubChapters(Math.max(0, parseInt(e.target.value) || 0))} />
                      </div>
                      <div className="resume-inline-group">
                        <label className="resume-inline-label">Research Reports</label>
                        <input type="number" min="0" className="resume-inline-input" value={pubReports} onChange={e => setPubReports(Math.max(0, parseInt(e.target.value) || 0))} />
                      </div>
                      <div className="resume-inline-group" style={{ gridColumn: 'span 2' }}>
                        <label className="resume-inline-label">Policy Briefs</label>
                        <input type="number" min="0" className="resume-inline-input" value={pubPolicyBriefs} onChange={e => setPubPolicyBriefs(Math.max(0, parseInt(e.target.value) || 0))} />
                      </div>
                    </div>

                    <div className="resume-inline-group" style={{ marginTop: '1rem' }}>
                      <label className="resume-inline-label">Google Scholar Link (Optional)</label>
                      <input type="url" className="resume-inline-input" value={scholarLink} onChange={e => setScholarLink(e.target.value)} placeholder="e.g. https://scholar.google.com/citations?user=..." />
                    </div>
                    <div className="resume-inline-group" style={{ marginTop: '0.5rem' }}>
                      <label className="resume-inline-label">LinkedIn Profile Link (Optional)</label>
                      <input type="url" className="resume-inline-input" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="e.g. https://linkedin.com/in/..." />
                    </div>
                  </div>
                ) : (
                  <div>
                    {scholarLink && (
                      <p style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                        🌐 <strong>Google Scholar:</strong> <a href={scholarLink} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-secondary)', textDecoration: 'underline' }}>{scholarLink}</a>
                      </p>
                    )}
                    {linkedin && (
                      <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                        🔗 <strong>LinkedIn:</strong> <a href={linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-secondary)', textDecoration: 'underline' }}>{linkedin}</a>
                      </p>
                    )}

                    {(pubBooks > 0 || pubPapers > 0 || pubChapters > 0 || pubReports > 0 || pubPolicyBriefs > 0) ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', fontSize: '0.95rem', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        {pubBooks > 0 && <div>📚 <strong>Books Published:</strong> {pubBooks}</div>}
                        {pubPapers > 0 && <div>📝 <strong>Peer-Reviewed Papers:</strong> {pubPapers}</div>}
                        {pubChapters > 0 && <div>📖 <strong>Book Chapters:</strong> {pubChapters}</div>}
                        {pubReports > 0 && <div>📊 <strong>Research Reports:</strong> {pubReports}</div>}
                        {pubPolicyBriefs > 0 && <div>💡 <strong>Policy Briefs:</strong> {pubPolicyBriefs}</div>}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No publications declared.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="resume-actions-container no-print">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setStep(4)}
                style={{ margin: 0 }}
              >
                Back to Form
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleSaveAsPdf}
                style={{ margin: 0, backgroundColor: 'var(--brand-secondary)', color: 'white' }}
              >
                Save as PDF
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleFinalSubmissionClick}
                style={{ margin: 0, backgroundColor: 'var(--brand-accent)', color: '#000' }}
              >
                Submit Application
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
