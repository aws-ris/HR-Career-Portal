import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { API_BASE as API } from '../../api';
import CandidateProfileModal from '../../components/hr/CandidateProfileModal';

export default function CandidateLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    document.title = "Candidate Lookup | RIS HR Portal";
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query || !query.trim()) return;

    setLoading(true);
    setSearched(true);
    const token = localStorage.getItem('hr_token');

    try {
      const res = await fetch(`${API}/hr/candidates/lookup?q=${encodeURIComponent(query.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (idText) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="hr-page">
      {/* ── Page Header ── */}
      <div className="hr-page-header">
        <div>
          <h1 className="hr-page-title">Candidate Lookup</h1>
          <p className="hr-page-subtitle">Search candidates by Reference ID (UUID), Email, Name, or Mobile Number</p>
        </div>
      </div>

      {/* ── Search Bar Card ── */}
      <div style={{ 
        background: '#ffffff', 
        borderRadius: '12px', 
        padding: '24px', 
        boxShadow: '0 4px 20px rgba(0, 33, 71, 0.06)', 
        border: '1px solid #e2e8f0',
        marginBottom: '28px'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text"
              placeholder="Paste Reference ID (e.g. 829bfa89...), Email, Name, or Mobile No..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                fontSize: '0.95rem',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#002147'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '14px 28px',
              background: '#002147',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 33, 71, 0.2)'
            }}
          >
            {loading ? <div className="hr-loader" style={{ width: 18, height: 18, borderWidth: 2 }}></div> : <Search size={18} />}
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* ── Search Results Section ── */}
      {searched && (
        <div>
          <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
            {loading ? "Searching..." : `Found ${results.length} candidate${results.length === 1 ? '' : 's'}`}
          </div>

          {results.length === 0 && !loading && (
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '12px', 
              padding: '48px 24px', 
              textAlign: 'center', 
              border: '1px solid #e2e8f0' 
            }}>
              <User size={48} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
              <h3 style={{ color: '#0f172a', margin: '0 0 4px 0', fontSize: '1.1rem' }}>No Candidate Found</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                No candidate matched query <strong>"{query}"</strong>. Double check the Reference ID or Email address.
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(560px, 1fr))', gap: '24px' }}>
            {results.map((c) => (
              <div 
                key={c.candidate_id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 15px rgba(0, 33, 71, 0.04)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Card Header */}
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '16px 20px', 
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#002147', fontSize: '1.05rem', fontWeight: 700 }}>
                      {c.full_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Ref ID:</span>
                      <code style={{ 
                        background: '#e2e8f0', 
                        color: '#002147', 
                        fontSize: '0.75rem', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontWeight: 700
                      }}>
                        {c.application_id || c.candidate_id}
                      </code>
                      <button 
                        onClick={() => handleCopy(c.application_id || c.candidate_id)}
                        title="Copy Reference ID"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedId === (c.application_id || c.candidate_id) ? '#16a34a' : '#64748b',
                          padding: '2px'
                        }}
                      >
                        {copiedId === (c.application_id || c.candidate_id) ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {c.worked_at_ris && (
                    <span style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      ★ Prior RIS
                    </span>
                  )}
                </div>

                {/* Card Body Metadata */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Position Applied */}
                  <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                      Position Applied
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#002147', marginTop: '2px' }}>
                      {c.job_title}
                    </div>
                    {c.admin_department && (
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                        Dept: {c.admin_department}
                      </div>
                    )}
                  </div>

                  {/* Timestamps & Location */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <Calendar size={14} style={{ color: '#002147', shrink: 0 }} />
                      <span><strong>Submitted:</strong> {c.submitted_at || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <MapPin size={14} style={{ color: '#002147', shrink: 0 }} />
                      <span><strong>Location:</strong> {c.city_state || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', overflow: 'hidden' }}>
                      <Mail size={14} style={{ color: '#002147', shrink: 0 }} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={c.email}>
                        {c.email}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <Phone size={14} style={{ color: '#002147', shrink: 0 }} />
                      <span>{c.mobile_no}</span>
                    </div>
                  </div>

                  {/* Education & Experience */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <GraduationCap size={14} style={{ color: '#002147', shrink: 0 }} />
                      <span>{c.top_edu || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                      <Briefcase size={14} style={{ color: '#002147', shrink: 0 }} />
                      <span><strong>Exp:</strong> {c.total_exp}</span>
                    </div>
                  </div>

                </div>

                {/* Card Footer Actions */}
                <div style={{ padding: '14px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
                  <button 
                    onClick={() => setSelectedCandidate({ candidateId: c.candidate_id, jobId: c.job_id })}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: '#002147',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#001630'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#002147'}
                  >
                    <span>View Full Candidate Dossier</span>
                    <ExternalLink size={14} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Candidate Profile Modal Launcher ── */}
      {selectedCandidate && (
        <CandidateProfileModal 
          candidateId={selectedCandidate.candidateId} 
          jobId={selectedCandidate.jobId} 
          onClose={() => setSelectedCandidate(null)} 
        />
      )}
    </div>
  );
}
