import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, User, GraduationCap, Briefcase, BookOpen, X, SlidersHorizontal, CheckCircle2, Circle, Filter, Sparkles, Brain } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
];

export default function FilterCenter({ job_id, onFilterChange }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [options, setOptions] = useState({ states: [], universities: [], genders: [] });
  const [stateSearch, setStateSearch] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [filters, setFilters] = useState({
    states: [],
    genders: [],
    ug_uni: '',
    min_ug_score: null,
    ug_score_type: 'Percentage',
    pg_uni: '',
    pg_min_score: null,
    pg_score_type: 'Percentage',
    phd_uni: '',
    phd_thesis: '',
    phd_min_score: null,
    phd_score_type: 'Percentage',
    min_experience_years: 0,
    min_papers: 0,
    min_books: 0,
    min_chapters: 0,
    min_age: 18,
    max_age: 65,
    min_x_score: null,
    min_xii_score: null,
    role_keyword: '',
    company_keyword: '',
    publication_keyword: '',
    semantic_query: ''
  });
  const API_HOST = window.location.hostname;
  const API_BASE = `http://${API_HOST}:8000/api/v1`;

  useEffect(() => {
    if (job_id) {
      fetch(`${API_BASE}/jobs/${job_id}/filter-options`)
        .then(res => res.json())
        .then(data => setOptions(prev => ({ ...prev, ...data })))
        .catch(err => console.error("Error fetching options:", err));
    }
  }, [job_id]);

  const fetchSuggestions = useCallback((field, query) => {
    if (!job_id || query.length < 1) { setSuggestions(prev => ({...prev, [field]: []})); return; }
    fetch(`${API_BASE}/jobs/${job_id}/suggest?field=${field}&q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => setSuggestions(prev => ({...prev, [field]: data})))
      .catch(() => {});
  }, [job_id, API_BASE]);

  const getActiveCount = (catId) => {
    switch(catId) {
      case 'bio': return filters.states.length + filters.genders.length + (filters.min_age > 18 || filters.max_age < 65 ? 1 : 0);
      case 'schooling': return (filters.min_x_score ? 1 : 0) + (filters.min_xii_score ? 1 : 0);
      case 'higher_edu': return (filters.ug_uni ? 1 : 0) + (filters.min_ug_score ? 1 : 0) + (filters.pg_uni ? 1 : 0) + (filters.pg_min_score ? 1 : 0) + (filters.phd_uni ? 1 : 0) + (filters.phd_min_score ? 1 : 0);
      case 'professional': return (filters.min_experience_years > 0 ? 1 : 0) + (filters.role_keyword ? 1 : 0) + (filters.company_keyword ? 1 : 0);
      case 'scholarly': return (filters.min_papers > 0 ? 1 : 0) + (filters.min_books > 0 ? 1 : 0) + (filters.publication_keyword ? 1 : 0);
      default: return 0;
    }
  };

  const categories = [
    { id: 'ai_match', label: 'AI Semantic Match', icon: Brain, color: '#8b5cf6' },
    { id: 'bio', label: 'Biographical', icon: User, color: '#f59e0b' },
    { id: 'schooling', label: 'Early Academics', icon: GraduationCap, color: '#10b981' },
    { id: 'higher_edu', label: 'Higher Education', icon: GraduationCap, color: '#3b82f6' },
    { id: 'professional', label: 'Work History', icon: Briefcase, color: '#f43f5e' },
    { id: 'scholarly', label: 'Research & Pubs', icon: BookOpen, color: '#6366f1' },
  ];

  const updateFilter = (key, value) => {
    let finalValue = value;
    if (['min_ug_score', 'min_experience_years', 'min_age', 'max_age', 'min_x_score', 'min_xii_score', 'pg_min_score', 'phd_min_score', 'ai_match_threshold'].includes(key)) {
      if (value === '' || value === null) finalValue = null;
      else finalValue = parseFloat(value);
    }
    setFilters(prev => ({ ...prev, [key]: finalValue }));
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const toggleCategory = (id) => {
    setActiveCategory(activeCategory === id ? null : id);
  };

  return (
    <div style={{ 
      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px', marginBottom: '32px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #0f172a, #334155)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Filter size={18} /> DATA EXTRACTION CONSOLE
          </h3>
          <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Schema-Aware Filtering Engine v4.0</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => {
             const reset = { states: [], genders: [], ug_uni: '', min_ug_score: null, pg_uni: '', pg_min_score: null, phd_uni: '', phd_thesis: '', phd_min_score: null, min_experience_years: 0, min_papers: 0, min_books: 0, min_chapters: 0, min_age: 18, max_age: 65, min_x_score: null, min_xii_score: null, role_keyword: '', company_keyword: '', publication_keyword: '', semantic_query: '', ai_match_threshold: 0.0 };
             setFilters(reset);
             onFilterChange(reset);
          }} style={{ fontSize: '12px', color: '#94a3b8', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
            Clear Filters
          </button>
          <button 
            onClick={handleApply}
            style={{ 
              background: '#0f172a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '12px', 
              fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = getActiveCount(cat.id);
          return (
            <button 
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px',
                padding: '16px', background: isActive ? '#f8fafc' : '#ffffff',
                border: '2px solid', borderColor: isActive ? cat.color : '#f1f5f9',
                borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
            >
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '10px', 
                background: isActive ? cat.color : '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isActive ? 'white' : cat.color, transition: 'all 0.3s'
              }}>
                <Icon size={18} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: '800', fontSize: '11px', color: '#0f172a', display: 'block' }}>{cat.label}</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: count > 0 ? cat.color : '#cbd5e1' }}>
                  {count > 0 ? `${count} Active` : 'Filter'}
                </span>
              </div>
              {count > 0 && (
                <div style={{ 
                  position: 'absolute', top: '12px', right: '12px', width: '6px', height: '6px', 
                  borderRadius: '50%', background: cat.color, boxShadow: `0 0 8px ${cat.color}`
                }} />
              )}
            </button>
          );
        })}
      </div>

      {activeCategory && (
        <div style={{ 
          marginTop: '20px', padding: '24px', background: '#f1f5f9', border: '1.5px solid #e2e8f0', 
          borderRadius: '12px', animation: 'fadeIn 0.2s ease-out'
        }}>
          {activeCategory === 'ai_match' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Semantic Profile Match (AI)</label>
                  <input type="text" placeholder="Type any skills or domain e.g. 'Supply Chain Logistics'..." value={filters.semantic_query} onChange={(e) => updateFilter('semantic_query', e.target.value)}
                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} />
                  <div style={{fontSize: '10px', color: '#94a3b8', marginTop: '10px'}}>Candidates will be automatically sorted by AI Match Score if a query is entered.</div>
                </div>
              </div>
            </div>
          )}
          {activeCategory === 'bio' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase' }}>State / UT Filter {filters.states.length > 0 && <span style={{color: '#0f172a'}}>({filters.states.length} selected)</span>}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text" placeholder="Search states..." value={stateSearch}
                    onChange={e => { setStateSearch(e.target.value); setStateDropdownOpen(true); }}
                    onFocus={() => setStateDropdownOpen(true)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' }}
                  />
                  {stateDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {INDIAN_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map(s => (
                        <div key={s} onClick={() => {
                          updateFilter('states', filters.states.includes(s) ? filters.states.filter(x => x !== s) : [...filters.states, s]);
                        }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: filters.states.includes(s) ? '#f1f5f9' : 'white' }}>
                          <span style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid', borderColor: filters.states.includes(s) ? '#0f172a' : '#cbd5e1', background: filters.states.includes(s) ? '#0f172a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>{filters.states.includes(s) ? '✓' : ''}</span>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {filters.states.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {filters.states.map(s => (
                      <span key={s} onClick={() => updateFilter('states', filters.states.filter(x => x !== s))} style={{ padding: '3px 8px', background: '#0f172a', color: 'white', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>{s} ×</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Age Bracket: {filters.min_age} - {filters.max_age}</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="range" min="18" max="65" value={filters.min_age} onChange={(e) => updateFilter('min_age', e.target.value)} style={{ width: '100%', accentColor: '#0f172a' }} />
                    <input type="range" min="18" max="65" value={filters.max_age} onChange={(e) => updateFilter('max_age', e.target.value)} style={{ width: '100%', accentColor: '#0f172a' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Gender</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['Male', 'Female', 'Other'].map(g => (
                      <button key={g} onClick={() => updateFilter('genders', filters.genders.includes(g) ? filters.genders.filter(x => x !== g) : [...filters.genders, g])}
                        style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', border: '1.5px solid', borderColor: filters.genders.includes(g) ? '#0f172a' : '#e2e8f0', background: filters.genders.includes(g) ? '#f1f5f9' : 'white', color: '#0f172a' }}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'schooling' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Min Class X (%)</label>
                <input type="number" placeholder="e.g. 80" value={filters.min_x_score || ''} onChange={(e) => updateFilter('min_x_score', e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Min Class XII (%)</label>
                <input type="number" placeholder="e.g. 80" value={filters.min_xii_score || ''} onChange={(e) => updateFilter('min_xii_score', e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
            </div>
          )}

          {activeCategory === 'higher_edu' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#10b981', marginBottom: '10px', textTransform: 'uppercase' }}>Bachelors</div>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <input type="text" placeholder="University..." value={filters.ug_uni} onChange={(e) => { updateFilter('ug_uni', e.target.value); fetchSuggestions('university', e.target.value); }} onFocus={() => fetchSuggestions('university', filters.ug_uni)} onBlur={() => setTimeout(() => setSuggestions(p => ({...p, university: []})), 200)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '12px' }} />
                  {suggestions.university?.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 50, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                      {suggestions.university.map((s, i) => <div key={i} onMouseDown={() => { updateFilter('ug_uni', s); setSuggestions(p => ({...p, university: []})); }} style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '11px' }}>{s}</div>)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  {['Percentage', 'CGPA'].map(t => <button key={t} onClick={() => updateFilter('ug_score_type', t)} style={{ flex: 1, padding: '4px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', border: '1px solid', borderColor: filters.ug_score_type === t ? '#10b981' : '#e2e8f0', background: filters.ug_score_type === t ? '#ecfdf5' : 'white', color: filters.ug_score_type === t ? '#059669' : '#94a3b8', cursor: 'pointer' }}>{t}</button>)}
                </div>
                <input type="number" placeholder={`Min Score (${filters.ug_score_type === 'CGPA' ? '≤10' : '≤100'})`} value={filters.min_ug_score || ''} onChange={(e) => updateFilter('min_ug_score', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '12px' }} />
              </div>
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#3b82f6', marginBottom: '10px', textTransform: 'uppercase' }}>Masters</div>
                <input type="text" placeholder="University..." value={filters.pg_uni} onChange={(e) => { updateFilter('pg_uni', e.target.value); fetchSuggestions('university', e.target.value); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', marginBottom: '10px', fontSize: '12px' }} />
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  {['Percentage', 'CGPA'].map(t => <button key={t} onClick={() => updateFilter('pg_score_type', t)} style={{ flex: 1, padding: '4px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', border: '1px solid', borderColor: filters.pg_score_type === t ? '#3b82f6' : '#e2e8f0', background: filters.pg_score_type === t ? '#eff6ff' : 'white', color: filters.pg_score_type === t ? '#2563eb' : '#94a3b8', cursor: 'pointer' }}>{t}</button>)}
                </div>
                <input type="number" placeholder={`Min Score (${filters.pg_score_type === 'CGPA' ? '≤10' : '≤100'})`} value={filters.pg_min_score || ''} onChange={(e) => updateFilter('pg_min_score', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '12px' }} />
              </div>
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#8b5cf6', marginBottom: '10px', textTransform: 'uppercase' }}>Doctorate</div>
                <input type="text" placeholder="University..." value={filters.phd_uni} onChange={(e) => { updateFilter('phd_uni', e.target.value); fetchSuggestions('university', e.target.value); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', marginBottom: '10px', fontSize: '12px' }} />
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  {['Percentage', 'CGPA'].map(t => <button key={t} onClick={() => updateFilter('phd_score_type', t)} style={{ flex: 1, padding: '4px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', border: '1px solid', borderColor: filters.phd_score_type === t ? '#8b5cf6' : '#e2e8f0', background: filters.phd_score_type === t ? '#f5f3ff' : 'white', color: filters.phd_score_type === t ? '#7c3aed' : '#94a3b8', cursor: 'pointer' }}>{t}</button>)}
                </div>
                <input type="number" placeholder={`Min Score (${filters.phd_score_type === 'CGPA' ? '≤10' : '≤100'})`} value={filters.phd_min_score || ''} onChange={(e) => updateFilter('phd_min_score', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '12px' }} />
              </div>
            </div>
          )}

          {activeCategory === 'professional' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Role Keyword</label>
                  <input type="text" placeholder="Search 'Professor', 'Lead', 'Scientist'..." value={filters.role_keyword} onChange={(e) => { updateFilter('role_keyword', e.target.value); fetchSuggestions('role', e.target.value); }} onFocus={() => fetchSuggestions('role', filters.role_keyword)} onBlur={() => setTimeout(() => setSuggestions(p => ({...p, role: []})), 200)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  {suggestions.role?.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 50, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                      {suggestions.role.map((s, i) => <div key={i} onMouseDown={() => { updateFilter('role_keyword', s); setSuggestions(p => ({...p, role: []})); }} style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '11px' }}>{s}</div>)}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Company/Inst. Keyword</label>
                  <input type="text" placeholder="Search 'IIT', 'ISRO', 'Google'..." value={filters.company_keyword} onChange={(e) => { updateFilter('company_keyword', e.target.value); fetchSuggestions('company', e.target.value); }} onFocus={() => fetchSuggestions('company', filters.company_keyword)} onBlur={() => setTimeout(() => setSuggestions(p => ({...p, company: []})), 200)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  {suggestions.company?.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 50, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                      {suggestions.company.map((s, i) => <div key={i} onMouseDown={() => { updateFilter('company_keyword', s); setSuggestions(p => ({...p, company: []})); }} style={{ padding: '8px 10px', cursor: 'pointer', fontSize: '11px' }}>{s}</div>)}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '15px', textTransform: 'uppercase' }}>Min Experience: {filters.min_experience_years} Yrs</label>
                <input type="range" min="0" max="25" value={filters.min_experience_years} onChange={(e) => updateFilter('min_experience_years', e.target.value)} style={{ width: '100%', accentColor: '#f43f5e' }} />
              </div>
            </div>
          )}

          {activeCategory === 'scholarly' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Publication Title Keyword</label>
                <input type="text" placeholder="Search 'AI', 'Quantum', 'Policy' in titles..." value={filters.publication_keyword} onChange={(e) => updateFilter('publication_keyword', e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                   <span style={{ fontSize: '12px', fontWeight: '700' }}>Min Papers</span>
                   <div style={{ display: 'flex', gap: '8px' }}>
                     <button onClick={() => updateFilter('min_papers', Math.max(0, filters.min_papers - 1))} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>-</button>
                     <span style={{ width: '20px', textAlign: 'center', fontWeight: '800' }}>{filters.min_papers}</span>
                     <button onClick={() => updateFilter('min_papers', filters.min_papers + 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #0f172a', background: '#0f172a', color: 'white' }}>+</button>
                   </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                   <span style={{ fontSize: '12px', fontWeight: '700' }}>Min Books</span>
                   <div style={{ display: 'flex', gap: '8px' }}>
                     <button onClick={() => updateFilter('min_books', Math.max(0, filters.min_books - 1))} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>-</button>
                     <span style={{ width: '20px', textAlign: 'center', fontWeight: '800' }}>{filters.min_books}</span>
                     <button onClick={() => updateFilter('min_books', filters.min_books + 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #0f172a', background: '#0f172a', color: 'white' }}>+</button>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : (v && v !== 0)) && (
        <div style={{ 
          marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {filters.states.map(s => <span key={s} style={{ padding: '4px 10px', background: '#fff7ed', color: '#c2410c', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>{s}</span>)}
            {filters.ug_uni && <span style={{ padding: '4px 10px', background: '#ecfdf5', color: '#047857', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>UG: {filters.ug_uni}</span>}
            {filters.pg_uni && <span style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>PG: {filters.pg_uni}</span>}
            {filters.phd_uni && <span style={{ padding: '4px 10px', background: '#f5f3ff', color: '#6d28d9', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>PhD: {filters.phd_uni}</span>}
            {filters.min_experience_years > 0 && <span style={{ padding: '4px 10px', background: '#fff1f2', color: '#be123c', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>{filters.min_experience_years}+ Yrs Exp</span>}
          </div>
        </div>
      )}
    </div>
  );
}
