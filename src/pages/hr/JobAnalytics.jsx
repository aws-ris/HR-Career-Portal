
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Globe, GraduationCap, ChevronLeft, Search, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import CandidateProfileModal from '../../components/hr/CandidateProfileModal';
import FilterCenter from '../../components/hr/FilterCenter';

import { API_BASE as API } from '../../api';
const COLORS = {
  edu: { 'PhD': '#C8102E', 'Masters': '#002147', 'Bachelors': '#0072B2' },
  gender: { 'Male': '#002147', 'Female': '#C8102E', 'Other': '#5E35B1' },
  states: ['#5E35B1', '#009E73', '#002147', '#C8102E', '#0072B2']
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="hr-chart-tooltip">
        <p className="hr-tooltip-label">{label || data.name}</p>
        <p className="hr-tooltip-value">
          <span className="hr-tooltip-count">{payload[0].value}</span>
          <span className="hr-tooltip-unit"> Applicants</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function JobAnalytics() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [search, setSearch] = useState('');
  const [currentFilters, setCurrentFilters] = useState({});
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    if (!exportDropdownOpen) return;
    const closeDropdown = (e) => {
      if (e.target.closest('.export-dropdown-container')) return;
      setExportDropdownOpen(false);
    };
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [exportDropdownOpen]);

  // Dynamic Column Logic: 
  // Core columns are always visible. 
  // Specialized ones appear if they have any filter applied or are "active" in the filter center logic.
  const activeCols = useMemo(() => {
    const cols = ['contact', 'highest_edu'];
    if (currentFilters.ug_uni || currentFilters.min_ug_score) cols.push('grad');
    if (currentFilters.pg_uni) cols.push('pg');
    if (currentFilters.phd_uni || currentFilters.phd_thesis) cols.push('phd');
    if (currentFilters.min_experience_years > 0) cols.push('work');
    if (currentFilters.min_papers > 0 || currentFilters.min_books > 0 || currentFilters.min_chapters > 0 || currentFilters.min_reports > 0 || currentFilters.min_policy_briefs > 0) {
      cols.push('books', 'papers', 'chapters', 'reports', 'policy_briefs');
    }
    // Also check if they are manually toggled? (User asked to remove manual toggles, so we stick to dynamic)
    return cols;
  }, [currentFilters]);

  const [debugStatus, setDebugStatus] = useState("");

  const fetchCandidates = async (filters = {}) => {
    setFiltering(true);
    setDebugStatus("Contacting Command Center...");
    setCurrentFilters(filters);
    const sanitizedId = String(id).trim();
    try {
      const res = await fetch(`${API}/jobs/${sanitizedId}/candidates/filter?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      
      setDebugStatus(`Server Responded: ${res.status}`);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Filter API Error ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      setDebugStatus(`Data Received: ${data.length} candidates found.`);
      setCandidates([...data]);
      
    } catch (e) {
      console.error("Fetch Error:", e);
      setDebugStatus(`Error: ${e.message}`);
    } finally {
      setFiltering(false);
      setLoading(false);
    }
  };

  const handleExport = async (format, reportType = 'detailed') => {
    setDebugStatus(`Generating ${format.toUpperCase()}...`);
    try {
      const res = await fetch(`${API}/jobs/${id}/candidates/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: currentFilters,
          format: format,
          columns: activeCols,
          report_type: reportType
        })
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applicants_${job.title.replace(/\s+/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDebugStatus("Export Complete.");
    } catch (e) {
      console.error("Export error:", e);
      setDebugStatus("Export Failed.");
      alert("Failed to generate export file.");
    }
  };

  useEffect(() => {
    document.title = "Job Analytics | RIS HR Portal";
    const t = new Date().getTime();
    fetch(`${API}/jobs/${id}?t=${t}`)
      .then(res => res.json())
      .then(j => {
        setJob(j);
        if (j && j.title) {
          document.title = `${j.title} Analytics | RIS HR Portal`;
        }
      })
      .catch(e => console.error("Job fetch error:", e));

    fetch(`${API}/jobs/${id}/analytics?t=${t}`)
      .then(res => res.json())
      .then(s => setStats(s))
      .catch(e => console.error("Stats fetch error:", e));
      
    // Initial load - Fetch ALL
    fetch(`${API}/jobs/${id}/candidates?t=${t}`)
      .then(res => res.json())
      .then(data => {
        setCandidates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => {
        console.error("Initial fetch error:", e);
        setLoading(false);
      });
  }, [id]);

  const tableRows = useMemo(() => {
    const rows = [];
    const filtered = candidates.filter(c => 
      c.full_name.toLowerCase().includes(search.toLowerCase()) || 
      c.email.toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'score') {
        const valA = a.profile_score ?? 0;
        const valB = b.profile_score ?? 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else {
        const valA = a.full_name ?? '';
        const valB = b.full_name ?? '';
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    });

    sorted.forEach((c, cIdx) => {
      let maxSubRows = 1;
      if (activeCols.includes('grad')) maxSubRows = Math.max(maxSubRows, c.graduation?.length || 1);
      if (activeCols.includes('pg')) maxSubRows = Math.max(maxSubRows, c.postgraduate?.length || 1);
      if (activeCols.includes('phd')) maxSubRows = Math.max(maxSubRows, c.doctorate?.length || 1);
      if (activeCols.includes('work')) maxSubRows = Math.max(maxSubRows, c.work_experiences?.length || 1);

      for (let i = 0; i < maxSubRows; i++) {
        rows.push({
          candidate: c,
          subIdx: i,
          isFirst: i === 0,
          groupColor: cIdx % 2 === 0 ? 'white' : '#f8fafc' 
        });
      }
    });
    return rows;
  }, [candidates, search, activeCols, sortBy, sortOrder]);

  if (loading || !job || !stats) return (
    <div className="hr-loading-container">
      <div className="hr-loader"></div>
      <p>Loading Intelligence Dashboard...</p>
    </div>
  );

  return (
    <div className="hr-page">
      <div className="hr-page-header">
        <div>
          <Link to="/hr" className="hr-back-link">
            <ChevronLeft size={16} /> Back to Job Postings
          </Link>
          <h1 className="hr-page-title">{job.title}</h1>
          <p className="hr-page-subtitle">{job.division} · {job.position}</p>
        </div>
      </div>

      <div className="hr-analytics-grid hr-job-stats-grid">
        <div className="hr-analytics-card">
          <div className="hr-analytics-card-header"><Users size={16} /> <span>Gender Mix</span></div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.gender} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                  {stats.gender.map((entry, index) => <Cell key={`c-${index}`} fill={COLORS.gender[entry.name] || '#cbd5e1'} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="hr-analytics-card">
          <div className="hr-analytics-card-header"><Globe size={16} /> <span>Geo Distribution</span></div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.states} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={70} axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                  {stats.states.map((entry, index) => <Cell key={`s-${index}`} fill={COLORS.states[index % COLORS.states.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="hr-analytics-card">
          <div className="hr-analytics-card-header"><GraduationCap size={16} /> <span>Highest Education</span></div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.education}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px' }} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                  {stats.education.map((entry, index) => <Cell key={`e-${index}`} fill={COLORS.edu[entry.name]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="hr-divider" />

      {/* Mega Control Center - No manual toggles passed as per user feedback */}
      <FilterCenter 
        job_id={id} 
        onFilterChange={fetchCandidates} 
      />

      <div className="hr-toolbar">
        <div>
          <h2 className="hr-section-title">Applicants List</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p className="hr-page-subtitle">{candidates.length} candidates found</p>
            {debugStatus && (
              <span style={{ 
                padding: '2px 8px', background: '#eef2ff', color: '#4338ca', 
                borderRadius: '12px', fontSize: '10px', fontWeight: '800', border: '1px solid #c7d2fe' 
              }}>
                {debugStatus}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="hr-search">
            <Search size={16} className="hr-search-icon" />
            <input 
              type="text" placeholder="Search by name or email..." 
              className="hr-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="export-dropdown-container">
            <button 
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="hr-btn-refresh" 
              title="Download applicants data"
              style={{ fontSize: '12px', fontWeight: '700', padding: '0.6rem 1rem', gap: '6px', display: 'flex', alignItems: 'center', color: '#002147', borderColor: '#00214722' }}
            >
              📥 Export Candidates
            </button>
            {exportDropdownOpen && (
              <div className="export-dropdown-menu">
                <button
                  onClick={() => { handleExport('xlsx', 'detailed'); setExportDropdownOpen(false); }}
                  className="export-dropdown-item"
                >
                  <span className="export-dropdown-item-title xlsx-detailed">Detailed Excel (.xlsx)</span>
                  <span className="export-dropdown-item-desc">Grouped candidate rows with merged metadata</span>
                </button>
                <button
                  onClick={() => { handleExport('xlsx', 'standardized'); setExportDropdownOpen(false); }}
                  className="export-dropdown-item"
                >
                  <span className="export-dropdown-item-title xlsx-standard">Standardized Summary (.xlsx)</span>
                  <span className="export-dropdown-item-desc">Standard roster of scores & work history</span>
                </button>
                <button
                  onClick={() => { handleExport('csv', 'detailed'); setExportDropdownOpen(false); }}
                  className="export-dropdown-item"
                >
                  <span className="export-dropdown-item-title csv">Flat CSV (.csv)</span>
                  <span className="export-dropdown-item-desc">Raw candidate data sheet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hr-table-scroll-container">
        <div className="hr-table-wrap">
          <table className="hr-table dynamic-zebra">
            <thead>
              <tr>
                <th 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => {
                    if (sortBy === 'name') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('name');
                      setSortOrder('asc');
                    }
                  }}
                >
                  Applicant {sortBy === 'name' ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
                {activeCols.includes('contact') && <th>Contact Info</th>}
                {activeCols.includes('highest_edu') && <th>Top Qual.</th>}
                {activeCols.includes('status') && <th>Status</th>}
                {activeCols.includes('grad') && <th>Graduation</th>}
                {activeCols.includes('pg') && <th>Postgrad</th>}
                {activeCols.includes('phd') && <th>Doctorate</th>}
                {activeCols.includes('work') && <th>Work Exp</th>}
                {activeCols.includes('books') && <th>Books</th>}
                {activeCols.includes('papers') && <th>Papers</th>}
                {activeCols.includes('chapters') && <th>Chapters</th>}
                {activeCols.includes('reports') && <th>Reports</th>}
                {activeCols.includes('policy_briefs') && <th>Policy Briefs</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtering && (
                <tr>
                  <td colSpan="100%" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="hr-loader" style={{ margin: '0 auto 10px' }}></div>
                    <div style={{ fontWeight: '700', color: '#002147' }}>Refining Results...</div>
                  </td>
                </tr>
              )}
              {!filtering && candidates.length === 0 && (
                <tr>
                  <td colSpan="100%" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    No candidates match the current filters.
                  </td>
                </tr>
              )}
              {!filtering && tableRows.map((row, idx) => {
                const { candidate: c, subIdx, isFirst, groupColor } = row;
                return (
                  <tr key={`${c.id}-${subIdx}`} style={{ background: groupColor }}>
                    <td>
                      {isFirst ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="hr-c-name" style={{ fontWeight: '800', color: '#0f172a', fontSize: '13px' }}>{c.full_name}</div>
                          </div>
                          <div className="hr-c-meta" style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                            {c.gender || ''}{c.age ? ` • ${c.age} Yrs` : ''}{c.state ? ` • ${c.state}` : ''}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '600' }}>↳ Additional Entry</div>
                      )}
                    </td>
                    {activeCols.includes('contact') && <td>{isFirst ? c.email : null}</td>}
                    {activeCols.includes('highest_edu') && <td>{isFirst ? <span className="hr-state-chip">{c.highest_education}</span> : null}</td>}
                    {activeCols.includes('status') && (
                      <td>{isFirst ? <span className="hr-status-pill" data-status={c.current_status}>{c.current_status.replace('_', ' ')}</span> : null}</td>
                    )}
                    {activeCols.includes('grad') && <td>{c.graduation?.[subIdx] ? `${c.graduation[subIdx].degree_name} (${c.graduation[subIdx].score})` : ''}</td>}
                    {activeCols.includes('pg') && <td>{c.postgraduate?.[subIdx] ? `${c.postgraduate[subIdx].degree_name} (${c.postgraduate[subIdx].score})` : ''}</td>}
                    {activeCols.includes('phd') && <td className="hr-phd-cell">{c.doctorate?.[subIdx] ? c.doctorate[subIdx].university : ''}</td>}
                    {activeCols.includes('work') && <td>{c.work_experiences?.[subIdx] ? `${c.work_experiences[subIdx].role} @ ${c.work_experiences[subIdx].company_name}` : ''}</td>}
                    {activeCols.includes('books') && <td>{isFirst ? (c.links_about?.pub_books || 0) : null}</td>}
                    {activeCols.includes('papers') && <td>{isFirst ? (c.links_about?.pub_papers || 0) : null}</td>}
                    {activeCols.includes('chapters') && <td>{isFirst ? (c.links_about?.pub_chapters || 0) : null}</td>}
                    {activeCols.includes('reports') && <td>{isFirst ? (c.links_about?.pub_reports || 0) : null}</td>}
                    {activeCols.includes('policy_briefs') && <td>{isFirst ? (c.links_about?.pub_policy_briefs || 0) : null}</td>}
                    <td>
                      {isFirst && (
                        <button className="hr-btn-view-profile" onClick={() => setSelectedCandidate(c.id)}>Dossier</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CandidateProfileModal candidateId={selectedCandidate} jobId={id} onClose={() => setSelectedCandidate(null)} />
    </div>
  );
}
