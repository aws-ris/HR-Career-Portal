import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE as API } from '../api';
import { CheckCircle2 } from 'lucide-react';

const UG_DEGREES = ['B.A.', 'B.Sc.', 'B.Com', 'B.Tech', 'B.E.', 'B.B.A.', 'B.C.A.', 'LL.B.', 'MBBS', 'B.Arch', 'B.Ed.'];
const PG_DEGREES = ['M.A.', 'M.Sc.', 'M.Com', 'M.Tech', 'M.E.', 'M.B.A.', 'M.C.A.', 'LL.M.', 'M.Ed.', 'MD', 'MS'];

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
  const [mobile_number, setMobile] = useState(() => savedDraft.mobile_number || '');
  const [dob, setDob] = useState(() => savedDraft.dob || '');
  const [gender, setGender] = useState(() => savedDraft.gender || '');
  const [candidateState, setCandidateState] = useState(() => savedDraft.candidateState || '');
  const [city, setCity] = useState(() => savedDraft.city || '');
  const [pincode, setPincode] = useState(() => savedDraft.pincode || '');
  const [extracurriculars, setExtracurriculars] = useState(() => savedDraft.extracurriculars || '');
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

  const [doctorates, setDoctorates] = useState(() => savedDraft.doctorates || [{ university: '', thesis_title: '', score_type: 'Percentage', score_value: '', grad_year: '' }]);

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
      classXSchool,
      classXBoard,
      classXBoardState,
      classXBoardOther,
      classXScoreType,
      classXScoreValue,
      classXIISchool,
      classXIIBoard,
      classXIIBoardState,
      classXIIBoardOther,
      classXIIScoreType,
      classXIIScoreValue,
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
    candidateState, city, pincode, extracurriculars, grads, postGrads, doctorates, 
    pubTypes, books, chapters, papers, scholarLink, expYears, expMonths, hasWork, workExps, step, jobId,
    classXSchool, classXBoard, classXBoardState, classXBoardOther, classXScoreType, classXScoreValue,
    classXIISchool, classXIIBoard, classXIIBoardState, classXIIBoardOther, classXIIScoreType, classXIIScoreValue
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
      if (!mobile_number || !/^\d{10}$/.test(mobile_number)) errors.push("Mobile Number must be exactly 10 digits.");
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
      if (extracurriculars && countWords(extracurriculars) > 100) {
        errors.push("Extracurriculars must not exceed 100 words.");
      }

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
      } else if (classXScoreType === 'CGPA' && valClassX > 10) {
        errors.push("Class X CGPA cannot exceed 10.");
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
      } else if (classXIIScoreType === 'CGPA' && valClassXII > 10) {
        errors.push("Class XII CGPA cannot exceed 10.");
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
      if (!pubTypes.none) {
        if (pubTypes.books) {
          books.forEach((b, i) => {
            if (b.title && !b.title.trim()) errors.push(`Book #${i + 1}: Title cannot be blank.`);
          });
        }
        if (pubTypes.chapters) {
          chapters.forEach((c, i) => {
            if ((c.title || c.parent_title) && (!c.title.trim() || !c.parent_title.trim())) {
              errors.push(`Chapter #${i + 1}: Both Chapter Name and Corresponding Book are required.`);
            }
          });
        }
        if (pubTypes.papers) {
          papers.forEach((p, i) => {
            if (p.title && !p.title.trim()) errors.push(`Paper #${i + 1}: Title cannot be blank.`);
          });
        }
      }
      if (scholarLink && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(scholarLink)) {
        errors.push("Google Scholar Link must be a valid URL.");
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
    if (!mobile_number || !/^\d{10}$/.test(mobile_number)) errors.push("Mobile Number must be exactly 10 digits.");
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
    if (extracurriculars && countWords(extracurriculars) > 100) {
      errors.push("Extracurriculars must not exceed 100 words.");
    }

    // Education (Step 2)
    const valClassX = parseFloat(classX);
    if (isNaN(valClassX) || valClassX < 0 || valClassX > 100) {
      errors.push("Class X Percentage must be a number between 0 and 100.");
    }
    const valClassXII = parseFloat(classXII);
    if (isNaN(valClassXII) || valClassXII < 0 || valClassXII > 100) {
      errors.push("Class XII Percentage must be a number between 0 and 100.");
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
    if (!pubTypes.none) {
      if (pubTypes.books) {
        books.forEach((b, i) => {
          if (b.title && !b.title.trim()) errors.push(`Book #${i + 1}: Title cannot be blank.`);
        });
      }
      if (pubTypes.chapters) {
        chapters.forEach((c, i) => {
          if ((c.title || c.parent_title) && (!c.title.trim() || !c.parent_title.trim())) {
            errors.push(`Chapter #${i + 1}: Both Chapter Name and Corresponding Book are required.`);
          }
        });
      }
      if (pubTypes.papers) {
        papers.forEach((p, i) => {
          if (p.title && !p.title.trim()) errors.push(`Paper #${i + 1}: Title cannot be blank.`);
        });
      }
    }
    if (scholarLink && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(scholarLink)) {
      errors.push("Google Scholar Link must be a valid URL.");
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

    // Check required fields for Step 3 (Work Experience Details)
    if (step === 3) {
      if (!resumeFile) {
        alert("Please upload your Resume (PDF) first.");
        return;
      }
      if (expYears === '' && expMonths === '') {
        alert("Please specify your professional experience in years/months.");
        return;
      }
      const yrs = parseInt(expYears) || 0;
      const mths = parseInt(expMonths) || 0;
      if (yrs < 0 || mths < 0 || mths > 11) {
        alert("Please enter valid Experience Years (>=0) and Months (0-11).");
        return;
      }

      if (hasWork) {
        for (let i = 0; i < workExps.length; i++) {
          const w = workExps[i];
          if (!w.company_name || !w.role || !w.start_date) {
            alert(`Please fill in all required fields (Organization, Designation, Start Date) for Work Entry #${i + 1}.`);
            return;
          }
          if (w.description && countWords(w.description) > 40) {
            alert(`Description for Work Entry #${i + 1} exceeds 40 words.`);
            return;
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
        class_x_school: classXSchool.trim(),
        class_x_board: classXBoard === 'State Board' 
          ? `State Board - ${classXBoardState}` 
          : classXBoard === 'Other' 
            ? classXBoardOther.trim() 
            : classXBoard,
        class_x_score_type: classXScoreType,
        class_x_score_value: parseFloat(classXScoreValue),
        class_xii_school: classXIISchool.trim(),
        class_xii_board: classXIIBoard === 'State Board'
          ? `State Board - ${classXIIBoardState}`
          : classXIIBoard === 'Other'
            ? classXIIBoardOther.trim()
            : classXIIBoard,
        class_xii_score_type: classXIIScoreType,
        class_xii_score_value: parseFloat(classXIIScoreValue)
      },
      higher_education: educations.map(e => ({
        ...e,
        level: e.level === 'Bachelors' ? 'undergrad' : (e.level === 'Masters' ? 'postgrad' : 'phd'),
        grad_year: e.grad_year ? parseInt(e.grad_year, 10) : null
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
        } catch {
          errMessage = `Status ${res.status}: ${res.statusText || 'Internal Server Error'}`;
        }
        setSubmitError("Database Rejection: " + errMessage);
      }
    } catch {
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
          <span className={`step-pill ${step >= 3 ? 'active' : ''}`}>3. Work Experience</span>
          <span className={`step-pill ${step >= 4 ? 'active' : ''}`}>4. Publications</span>
          <span className={`step-pill ${step >= 5 ? 'active' : ''}`}>5. Review & Submit</span>
        </div>

        {submitError && <div style={{background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>{submitError}</div>}

        {jobDetail && (step === 0 || step === 1) && (
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

        {step < 5 && (
          <form onSubmit={step === 4 ? handleProceedToPreview : handleNext} style={{ display: step === 0 ? 'none' : 'block' }}>
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
 

              <button type="submit" className="btn-primary" style={{width: '100%'}}>Proceed to Education Options</button>
            </>
          )}

          {step === 2 && (
            <>
              <h3>Basic Schooling</h3>
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

                  <div className="form-group">
                    <label className="form-label">Scoring System & Value</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {['Percentage', 'CGPA'].map(t => (
                        <button type="button" key={t} onClick={() => setClassXScoreType(t)} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid', borderColor: classXScoreType === t ? 'var(--accent-primary, #1e3a8a)' : '#cbd5e1', background: classXScoreType === t ? '#eff6ff' : '#ffffff', color: classXScoreType === t ? 'var(--accent-primary, #1e3a8a)' : '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>{t}</button>
                      ))}
                    </div>
                    <input required type="number" step="0.01" max={classXScoreType === 'CGPA' ? '10' : '100'} className="form-input" placeholder={classXScoreType === 'CGPA' ? 'e.g. 9.5' : 'e.g. 95.00'} value={classXScoreValue} onChange={e => setClassXScoreValue(e.target.value)} />
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

                  <div className="form-group">
                    <label className="form-label">Scoring System & Value</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {['Percentage', 'CGPA'].map(t => (
                        <button type="button" key={t} onClick={() => setClassXIIScoreType(t)} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid', borderColor: classXIIScoreType === t ? 'var(--accent-primary, #1e3a8a)' : '#cbd5e1', background: classXIIScoreType === t ? '#eff6ff' : '#ffffff', color: classXIIScoreType === t ? 'var(--accent-primary, #1e3a8a)' : '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>{t}</button>
                      ))}
                    </div>
                    <input required type="number" step="0.01" max={classXIIScoreType === 'CGPA' ? '10' : '100'} className="form-input" placeholder={classXIIScoreType === 'CGPA' ? 'e.g. 9.5' : 'e.g. 95.00'} value={classXIIScoreValue} onChange={e => setClassXIIScoreValue(e.target.value)} />
                  </div>
                </div>
              </div>

              <hr style={dividerStyle} />

              <h3 style={{marginBottom: '1rem'}}>Graduation Details</h3>
              {grads.map((g, i) => (
                <div className="form-grid" key={i} style={{marginBottom: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px'}}>
                  <div className="form-group"><label className="form-label">University</label><input required className="form-input" value={g.university} onChange={e => updateEntry(setGrads, grads, i, 'university', e.target.value)} /></div>
                  <div className="form-group">
                    <label className="form-label">Degree Type</label>
                    {g.degree_select === 'Other' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input 
                          required 
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
                        required 
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
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specialization / Discipline</label>
                    <SpecializationInput 
                      required={true}
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
                  <div className="form-group"><label className="form-label">Score Type</label><select className="form-input" value={g.score_type} onChange={e => updateEntry(setGrads, grads, i, 'score_type', e.target.value)}><option>Percentage</option><option>CGPA</option></select></div>
                  <div className="form-group"><label className="form-label">Score (&lt;= {g.score_type==='Percentage' ? '100' : '10'})</label><input required type="number" step="0.01" className="form-input" value={g.score_value} onChange={e => updateEntry(setGrads, grads, i, 'score_value', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Year of Passing (1950 - 2030)</label><input required={i === 0 || !!g.university || !!g.degree_name || !!g.score_value} type="number" min="1950" max="2030" placeholder="YYYY" className="form-input" value={g.grad_year || ''} onChange={e => updateEntry(setGrads, grads, i, 'grad_year', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn-secondary" disabled={grads.length>=3} onClick={() => addEntry(setGrads, grads, 3, { university: '', degree_name: '', degree_select: '', degree_custom: '', degree_spec: '', score_type: 'Percentage', score_value: '', grad_year: '' })}>+ Add Graduation Detail</button>


              <hr style={dividerStyle} />

              <h3 style={{marginBottom: '1rem'}}>Post Graduation Details</h3>
              {postGrads.map((g, i) => (
                <div className="form-grid" key={i} style={{marginBottom: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px'}}>
                  <div className="form-group"><label className="form-label">University</label><input className="form-input" value={g.university} onChange={e => updateEntry(setPostGrads, postGrads, i, 'university', e.target.value)} /></div>
                  <div className="form-group">
                    <label className="form-label">Degree Type</label>
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
                  <div className="form-group">
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
                  <div className="form-group"><label className="form-label">Score Type</label><select className="form-input" value={g.score_type} onChange={e => updateEntry(setPostGrads, postGrads, i, 'score_type', e.target.value)}><option>Percentage</option><option>CGPA</option></select></div>
                  <div className="form-group"><label className="form-label">Score</label><input type="number" step="0.01" className="form-input" value={g.score_value} onChange={e => updateEntry(setPostGrads, postGrads, i, 'score_value', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Year of Passing (1950 - 2030)</label><input required={!!g.university || !!g.degree_name || !!g.score_value} type="number" min="1950" max="2030" placeholder="YYYY" className="form-input" value={g.grad_year || ''} onChange={e => updateEntry(setPostGrads, postGrads, i, 'grad_year', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn-secondary" disabled={postGrads.length>=3} onClick={() => addEntry(setPostGrads, postGrads, 3, { university: '', degree_name: '', degree_select: '', degree_custom: '', degree_spec: '', score_type: 'Percentage', score_value: '', grad_year: '' })}>+ Add Post Graduation</button>


              <hr style={dividerStyle} />

              <h3 style={{marginBottom: '1rem'}}>Doctorate Details</h3>
              {doctorates.map((g, i) => (
                <div className="form-grid" key={i} style={{marginBottom: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px'}}>
                  <div className="form-group"><label className="form-label">University</label><input className="form-input" value={g.university} onChange={e => updateEntry(setDoctorates, doctorates, i, 'university', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Thesis Title</label><input className="form-input" value={g.thesis_title} onChange={e => updateEntry(setDoctorates, doctorates, i, 'thesis_title', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Score Type</label><select className="form-input" value={g.score_type} onChange={e => updateEntry(setDoctorates, doctorates, i, 'score_type', e.target.value)}><option>Percentage</option><option>CGPA</option></select></div>
                  <div className="form-group"><label className="form-label">Score</label><input type="number" step="0.01" className="form-input" value={g.score_value} onChange={e => updateEntry(setDoctorates, doctorates, i, 'score_value', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Year of Passing (1950 - 2030)</label><input required={!!g.university || !!g.thesis_title || !!g.score_value} type="number" min="1950" max="2030" placeholder="YYYY" className="form-input" value={g.grad_year || ''} onChange={e => updateEntry(setDoctorates, doctorates, i, 'grad_year', e.target.value)} /></div>
                </div>
              ))}
              <button type="button" className="btn-secondary" disabled={doctorates.length>=3} onClick={() => addEntry(setDoctorates, doctorates, 3, { university: '', thesis_title: '', score_type: 'Percentage', score_value: '', grad_year: '' })}>+ Add Doctorate</button>

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
                        <div className="form-group"><label className="form-label">Organization</label><input required className="form-input" value={w.company_name} onChange={e => updateEntry(setWorkExps, workExps, i, 'company_name', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Designation</label><input required className="form-input" value={w.role} onChange={e => updateEntry(setWorkExps, workExps, i, 'role', e.target.value)} /></div>
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
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Proceed to Publications</button>
              </div>
            </>
          )}

          {step === 4 && (
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
                      <span className="resume-contact-item">📞 {mobile_number}</span>
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
                    <h4 style={{ marginBottom: '0.5rem' }}>Basic Schooling</h4>
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
                              <option value="CGPA">CGPA</option>
                            </select>
                            <input type="number" step="0.01" max={classXScoreType === 'CGPA' ? '10' : '100'} className="resume-inline-input" value={classXScoreValue} onChange={e => setClassXScoreValue(e.target.value)} />
                          </div>
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
                              <option value="CGPA">CGPA</option>
                            </select>
                            <input type="number" step="0.01" max={classXIIScoreType === 'CGPA' ? '10' : '100'} className="resume-inline-input" value={classXIIScoreValue} onChange={e => setClassXIIScoreValue(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <h4 style={{ marginBottom: '0.5rem' }}>Graduation Details (Min 1 required)</h4>
                    {grads.map((g, i) => (
                      <div className="resume-inline-grid-edit" key={i} style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">University</label>
                          <input className="resume-inline-input" value={g.university} onChange={e => updateEntry(setGrads, grads, i, 'university', e.target.value)} />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Degree Type</label>
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
                          <input className="resume-inline-input" value={g.university} onChange={e => updateEntry(setPostGrads, postGrads, i, 'university', e.target.value)} />
                        </div>
                        <div className="resume-inline-group">
                          <label className="resume-inline-label">Degree Type</label>
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
                          <input className="resume-inline-input" value={g.university} onChange={e => updateEntry(setDoctorates, doctorates, i, 'university', e.target.value)} />
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
                          <span className="resume-item-title">Class X</span>
                          <div className="resume-item-subtitle">{classXBoard === 'State Board' ? `State Board - ${classXBoardState}` : classXBoard === 'Other' ? classXBoardOther : classXBoard}</div>
                        </td>
                        <td>{classXSchool || 'Secondary Schooling'}</td>
                        <td>{classXScoreValue}{classXScoreType === 'Percentage' ? '%' : ' CGPA'}</td>
                      </tr>
                      <tr>
                        <td>
                          <span className="resume-item-title">Class XII</span>
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
                      {resumeFile && <div style={{ fontSize: '0.85rem', color: '#16a34a', marginBottom: '0.5rem', fontWeight: '600' }}>✓ Current file: {resumeFile.name}</div>}
                      <input type="file" accept=".pdf" className="resume-inline-input" onChange={e => setResumeFile(e.target.files[0])} />
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
                              <div className="resume-inline-group" style={{ gridColumn: 'span 2' }}>
                                <label className="resume-inline-label">Description (Max 40 Words)</label>
                                <textarea className="resume-inline-input resume-inline-textarea" value={w.description} onChange={e => updateEntry(setWorkExps, workExps, i, 'description', e.target.value)} />
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Current word count: {countWords(w.description)}/40</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                              <button type="button" className="resume-delete-btn" onClick={() => removeEntry(setWorkExps, workExps, i)}>❌ Remove Work Entry</button>
                            </div>
                          </div>
                        ))}
                        <button type="button" className="btn-secondary" style={{ marginTop: '0' }} disabled={workExps.length>=3} onClick={() => addEntry(setWorkExps, workExps, 3, { company_name: '', start_date: '', end_date: '', role: '', description: '' })}>+ Add Work Experience</button>
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
                            {w.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.5' }}>{w.description}</p>}
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
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                      <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" checked={pubTypes.none} onChange={e => setPubTypes({...pubTypes, none: e.target.checked, books: false, chapters: false, papers: false})} /> None</label>
                      <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" checked={pubTypes.books} onChange={e => setPubTypes({...pubTypes, books: e.target.checked, none: false})} /> Books</label>
                      <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" checked={pubTypes.chapters} onChange={e => setPubTypes({...pubTypes, chapters: e.target.checked, none: false})} /> Chapters</label>
                      <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><input type="checkbox" checked={pubTypes.papers} onChange={e => setPubTypes({...pubTypes, papers: e.target.checked, none: false})} /> Papers</label>
                    </div>

                    {pubTypes.books && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Books Authored</h4>
                        {books.map((b, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input className="resume-inline-input" placeholder="Book Title" value={b.title} onChange={e => updateEntry(setBooks, books, i, 'title', e.target.value)} />
                            <button type="button" className="resume-delete-btn" onClick={() => removeEntry(setBooks, books, i)}>❌</button>
                          </div>
                        ))}
                        <button type="button" className="btn-secondary" style={{ marginTop: '0' }} disabled={books.length>=3} onClick={() => addEntry(setBooks, books, 3, { title: '' })}>+ Add Book</button>
                      </div>
                    )}

                    {pubTypes.chapters && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Chapters in Books</h4>
                        {chapters.map((c, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px' }}>
                            <input className="resume-inline-input" placeholder="Chapter Name" value={c.title} onChange={e => updateEntry(setChapters, chapters, i, 'title', e.target.value)} />
                            <input className="resume-inline-input" placeholder="Corresponding Book" value={c.parent_title} onChange={e => updateEntry(setChapters, chapters, i, 'parent_title', e.target.value)} />
                            <button type="button" className="resume-delete-btn" onClick={() => removeEntry(setChapters, chapters, i)}>❌</button>
                          </div>
                        ))}
                        <button type="button" className="btn-secondary" style={{ marginTop: '0' }} disabled={chapters.length>=3} onClick={() => addEntry(setChapters, chapters, 3, { title: '', parent_title: '' })}>+ Add Chapter</button>
                      </div>
                    )}

                    {pubTypes.papers && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Research Papers</h4>
                        {papers.map((p, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input className="resume-inline-input" placeholder="Paper Title" value={p.title} onChange={e => updateEntry(setPapers, papers, i, 'title', e.target.value)} />
                            <button type="button" className="resume-delete-btn" onClick={() => removeEntry(setPapers, papers, i)}>❌</button>
                          </div>
                        ))}
                        <button type="button" className="btn-secondary" style={{ marginTop: '0' }} disabled={papers.length>=3} onClick={() => addEntry(setPapers, papers, 3, { title: '' })}>+ Add Paper</button>
                      </div>
                    )}

                    <div className="resume-inline-group" style={{ marginTop: '1rem' }}>
                      <label className="resume-inline-label">Google Scholar Link (Optional)</label>
                      <input type="url" className="resume-inline-input" value={scholarLink} onChange={e => setScholarLink(e.target.value)} placeholder="e.g. https://scholar.google.com/citations?user=..." />
                    </div>
                  </div>
                ) : (
                  <div>
                    {scholarLink && (
                      <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                        🌐 <strong>Google Scholar:</strong> <a href={scholarLink} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-secondary)', textDecoration: 'underline' }}>{scholarLink}</a>
                      </p>
                    )}

                    {pubTypes.none && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No publications or authored works declared.</p>}

                    {!pubTypes.none && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pubTypes.books && books.some(b => b.title) && (
                          <div>
                            <h4 className="resume-item-subtitle" style={{ fontSize: '0.95rem', borderBottom: '1px dotted var(--border-color)', paddingBottom: '0.2rem', marginBottom: '0.4rem' }}>Books</h4>
                            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
                              {books.map((b, i) => b.title && <li key={`b-${i}`} style={{ marginBottom: '0.25rem' }}><span className="resume-item-title">"{b.title}"</span></li>)}
                            </ul>
                          </div>
                        )}
                        
                        {pubTypes.chapters && chapters.some(c => c.title) && (
                          <div>
                            <h4 className="resume-item-subtitle" style={{ fontSize: '0.95rem', borderBottom: '1px dotted var(--border-color)', paddingBottom: '0.2rem', marginBottom: '0.4rem' }}>Book Chapters</h4>
                            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
                              {chapters.map((c, i) => c.title && <li key={`c-${i}`} style={{ marginBottom: '0.25rem' }}>Chapter <span className="resume-item-title">"{c.title}"</span> in book <em>"{c.parent_title}"</em></li>)}
                            </ul>
                          </div>
                        )}

                        {pubTypes.papers && papers.some(p => p.title) && (
                          <div>
                            <h4 className="resume-item-subtitle" style={{ fontSize: '0.95rem', borderBottom: '1px dotted var(--border-color)', paddingBottom: '0.2rem', marginBottom: '0.4rem' }}>Papers</h4>
                            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
                              {papers.map((p, i) => p.title && <li key={`p-${i}`} style={{ marginBottom: '0.25rem' }}><span className="resume-item-title">"{p.title}"</span></li>)}
                            </ul>
                          </div>
                        )}
                      </div>
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
