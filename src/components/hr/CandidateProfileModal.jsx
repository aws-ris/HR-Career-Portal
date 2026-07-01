import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase, BookOpen, FileText, ExternalLink, Download, ArrowUpRight, Award } from 'lucide-react';

import { API_BASE as API } from '../../api';

export default function CandidateProfileModal({ candidateId, jobId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    const url = jobId 
      ? `${API}/candidates/${candidateId}/full_profile?job_id=${jobId}`
      : `${API}/candidates/${candidateId}/full_profile`;
    fetch(url)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [candidateId, jobId]);

  if (!candidateId) return null;

  if (!loading && !data) {
    return (
      <div className="hr-modal-overlay" style={{ 
        background: 'rgba(15, 23, 42, 0.8)', 
        backdropFilter: 'blur(8px)',
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        zIndex: 9999
      }}>
        <div style={{ 
          background: '#ffffff', 
          width: '100%', 
          maxWidth: '500px', 
          borderRadius: '24px', 
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          position: 'relative'
        }}>
          <p style={{ color: '#ef4444', fontWeight: '800', fontSize: '18px', margin: '0 0 20px 0' }}>Failed to retrieve dossier.</p>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 30px 0' }}>The candidate details could not be loaded. Please ensure the backend server is running.</p>
          <button 
            onClick={onClose} 
            style={{ 
              padding: '10px 24px', 
              background: '#1e293b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '700' 
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const books = data?.publications?.filter(p => p.pub_type?.toLowerCase() === 'book') || [];
  const papers = data?.publications?.filter(p => p.pub_type?.toLowerCase() === 'paper') || [];
  const chapters = data?.publications?.filter(p => p.pub_type?.toLowerCase() === 'chapter') || [];

  const highestEducationText = (() => {
    if (data?.doctorate && data.doctorate.length > 0) return "Doctorate (Ph.D)";
    if (data?.postgraduate && data.postgraduate.length > 0) return "Postgraduate";
    if (data?.graduation && data.graduation.length > 0) return "Undergraduate";
    return "Applicant";
  })();

  const formattedExperience = (() => {
    const total = parseFloat(data?.years_of_experience) || 0;
    const yrs = Math.floor(total);
    const mths = Math.round((total - yrs) * 12);
    if (yrs === 0 && mths === 0) return "Fresh Graduate";
    let parts = [];
    if (yrs > 0) parts.push(`${yrs} Yr${yrs > 1 ? 's' : ''}`);
    if (mths > 0) parts.push(`${mths} Mo${mths > 1 ? 's' : ''}`);
    return parts.join(" ");
  })();

  const academicHighlights = (() => {
    const parts = [];
    if (data?.graduation?.[0]?.score_value) {
      parts.push(`UG: ${data.graduation[0].score_value}${data.graduation[0].score_type === 'Percentage' ? '%' : ''}`);
    }
    if (data?.postgraduate?.[0]?.score_value) {
      parts.push(`PG: ${data.postgraduate[0].score_value}${data.postgraduate[0].score_type === 'Percentage' ? '%' : ''}`);
    }
    if (data?.schooling?.class_xii_score_value) {
      parts.push(`XII: ${data.schooling.class_xii_score_value}${data.schooling.class_xii_score_type === 'Percentage' ? '%' : ' CGPA'}`);
    }
    return parts.length > 0 ? parts.join(" | ") : "N/A";
  })();

  const pubText = (() => {
    const booksCount = books.length;
    const papersCount = papers.length;
    const chaptersCount = chapters.length;
    const parts = [
      booksCount > 0 ? `${booksCount} Book${booksCount > 1 ? 's' : ''}` : null,
      papersCount > 0 ? `${papersCount} Paper${papersCount > 1 ? 's' : ''}` : null,
      chaptersCount > 0 ? `${chaptersCount} Chapter${chaptersCount > 1 ? 's' : ''}` : null
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" | ") : "0 Works";
  })();

  const latestApplication = (() => {
    if (data?.applications && data.applications.length > 0) {
      const sorted = [...data.applications].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
      return sorted[0];
    }
    return null;
  })();

  const statusBadge = (() => {
    const status = latestApplication?.current_status?.toLowerCase() || 'received';
    if (status === 'shortlisted') return { bg: '#dcfce7', color: '#15803d', label: 'Shortlisted' };
    if (status === 'rejected') return { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected' };
    return { bg: '#eff6ff', color: '#1d4ed8', label: 'Applied' };
  })();

  const formatWorkDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="hr-modal-overlay" style={{ 
      background: 'rgba(15, 23, 42, 0.8)', 
      backdropFilter: 'blur(8px)',
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      zIndex: 9999
    }}>
      <div style={{ 
        background: '#ffffff', 
        width: '100%', 
        maxWidth: '1000px', 
        height: '90vh', 
        borderRadius: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px 32px', 
          borderBottom: '1px solid #f1f5f9', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '48px', height: '48px', 
              background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: '800', fontSize: '20px'
            }}>
              {data?.full_name?.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{data?.full_name}</h2>
                {data && (
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    padding: '2px 8px', 
                    borderRadius: '999px',
                    backgroundColor: statusBadge.bg,
                    color: statusBadge.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {statusBadge.label}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Dossier · {data ? highestEducationText : 'Applicant'}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => window.open(`${API}/applications/${candidateId}/resume/download?preview=true&token=${localStorage.getItem('hr_token') || ''}`, '_blank')}
              style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', 
              background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', 
              fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <ExternalLink size={18} /> Preview CV
            </button>
            <button 
              onClick={() => window.open(`${API}/applications/${candidateId}/resume/download?token=${localStorage.getItem('hr_token') || ''}`, '_blank')}
              style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', 
              background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', 
              fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <Download size={18} /> Download CV
            </button>
            <button 
              onClick={onClose}
              style={{ 
                padding: '8px', borderRadius: '50%', border: 'none', background: '#f1f5f9', 
                cursor: 'pointer', color: '#64748b' 
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="hr-modal-body scrollable" style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '32px',
          background: '#ffffff'
        }}>
          {loading ? (
            <div className="hr-modal-loading">
              <div className="hr-loader"></div>
              <p>Retrieving Full Dossier...</p>
            </div>
          ) : (
            <div className="hr-dossier-layout">
              {/* Executive Rundown Panels (Top row) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                {/* Panel 0: Profile Score */}
                <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: '16px', padding: '16px 20px', border: '1px solid #10b98133', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={13} style={{ color: '#059669' }} /> Profile Score
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#064e3b' }}>
                    {(data?.profile_score !== undefined && data?.profile_score !== null) ? `${Number(data.profile_score).toFixed(1)} / 85` : 'N/A'}
                  </div>
                </div>

                {/* Panel 1: Experience */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={12} style={{ color: '#4f46e5' }} /> Total Experience
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{formattedExperience}</div>
                </div>

                {/* Panel 2: Academic Highlights */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GraduationCap size={13} style={{ color: '#0891b2' }} /> Academic Rollup
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{academicHighlights}</div>
                </div>

                {/* Panel 3: Publications */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={12} style={{ color: '#059669' }} /> Published Works
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{pubText}</div>
                </div>

                {/* Panel 4: Review Documents Button */}
                <div 
                  onClick={() => window.open(`${API}/applications/${candidateId}/resume/download?preview=true&token=${localStorage.getItem('hr_token') || ''}`, '_blank')}
                  style={{ 
                    background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', 
                    borderRadius: '16px', 
                    padding: '16px 20px', 
                    border: '1px solid #bae6fd', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
                >
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={12} /> Review Documents
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View PDF CV <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>

              {/* Profile Score Detailed Breakdown Panel */}
              {data?.profile_score_breakdown && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '16px', 
                  padding: '20px 24px', 
                  marginBottom: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={14} style={{ color: '#059669' }} /> Profile Evaluation Rubric Breakdown (out of 85)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '4px' }}>
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Schooling (X/XII)</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{data.profile_score_breakdown.schooling?.toFixed(1) || '0.0'} <span style={{fontSize: '11px', color: '#94a3b8'}}>/ 10</span></span>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>X: {data.profile_score_breakdown.school_x?.toFixed(1) || '0.0'} | XII: {data.profile_score_breakdown.school_xii?.toFixed(1) || '0.0'}</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Essential Qual (EQ)</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{data.profile_score_breakdown.eq?.toFixed(1) || '0.0'} <span style={{fontSize: '11px', color: '#94a3b8'}}>/ 30</span></span>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>0.3 pts per %</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Desirable Qual (DQ)</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{data.profile_score_breakdown.dq?.toFixed(1) || '0.0'} <span style={{fontSize: '11px', color: '#94a3b8'}}>/ 10</span></span>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>0.1 pts per %</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Univ Brand Tier</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{data.profile_score_breakdown.brand?.toFixed(1) || '0.0'} <span style={{fontSize: '11px', color: '#94a3b8'}}>/ 10</span></span>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={data.profile_score_breakdown.brand_classification}>{data.profile_score_breakdown.brand_classification || 'Other'}</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Domain Experience</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{data.profile_score_breakdown.experience?.toFixed(1) || '0.0'} <span style={{fontSize: '11px', color: '#94a3b8'}}>/ 25</span></span>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={data.profile_score_breakdown.experience_desc}>{data.years_of_experience || 0} Yrs (Req {data.profile_score_breakdown.min_exp_req || 1} Yrs)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stacked Contact Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                  <Mail size={16} style={{ color: '#6366f1' }} /> <strong>Email:</strong> {data.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                  <Phone size={16} style={{ color: '#10b981' }} /> <strong>Mobile:</strong> {data.mobile_no}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                  <MapPin size={16} style={{ color: '#ef4444' }} /> <strong>Location:</strong> {data.city ? `${data.city}, ` : ''}{data.state}{data.pincode ? ` - ${data.pincode}` : ''}
                </div>
              </div>

              {/* Extracurriculars */}
              {data.extracurriculars && (
                <div style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Summary & Interests</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6', fontStyle: 'italic' }}>"{data.extracurriculars}"</p>
                </div>
              )}

              {/* Education & Experience Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '40px' }}>
                {/* Academic Profile */}
                <div>
                  <h3 className="hr-section-label" style={{ fontSize: '15px', fontWeight: '800', borderBottom: '2px solid #cbd5e1', paddingBottom: '6px', marginBottom: '20px' }}>Academic Profile</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* PhD */}
                    {data.doctorate?.map((d, i) => (
                      <div key={`phd-${i}`} style={{ padding: '20px', background: '#f5f3ff', borderLeft: '4px solid #7c3aed', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: '800', color: '#7c3aed', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Doctorate (Ph.D)</span>
                          {d.grad_year && <span style={{ fontSize: '12px', fontWeight: '600', color: '#7c3aed', background: '#e9e3ff', padding: '2px 8px', borderRadius: '4px' }}>Graduated {d.grad_year}</span>}
                        </div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px', margin: '6px 0' }}>{d.university}</div>
                        <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#475569', marginBottom: '8px' }}>Thesis: "{d.thesis_title}"</div>
                        {d.score_value && (
                          <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#7c3aed', background: '#f3f0ff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d8ccff' }}>
                            Score: {d.score_value} {d.score_type}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Postgraduate */}
                    {data.postgraduate?.map((p, i) => (
                      <div key={`pg-${i}`} style={{ padding: '20px', background: '#eff6ff', borderLeft: '4px solid #2563eb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: '800', color: '#2563eb', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Postgraduate</span>
                          {p.grad_year && <span style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px' }}>Graduated {p.grad_year}</span>}
                        </div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px', margin: '6px 0' }}>{p.degree_name}</div>
                        <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>{p.university}</div>
                        {p.score_value && (
                          <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                            Score: {p.score_value} {p.score_type === 'Percentage' ? '%' : p.score_type}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Undergraduate */}
                    {data.graduation?.map((g, i) => (
                      <div key={`ug-${i}`} style={{ padding: '20px', background: '#ecfdf5', borderLeft: '4px solid #059669', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: '800', color: '#059669', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Undergraduate</span>
                          {g.grad_year && <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '4px' }}>Graduated {g.grad_year}</span>}
                        </div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px', margin: '6px 0' }}>{g.degree_name}</div>
                        <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>{g.university}</div>
                        {g.score_value && (
                          <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                            Score: {g.score_value} {g.score_type === 'Percentage' ? '%' : g.score_type}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Schooling Details Rollup */}
                    {data.schooling && (
                      <div style={{ padding: '20px', background: '#f8fafc', borderLeft: '4px solid #64748b', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ fontWeight: '800', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schooling (Class X & XII)</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Senior Secondary (XII)</span>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
                              {data.schooling.class_xii_score_value}{data.schooling.class_xii_score_type === 'Percentage' ? '%' : ' CGPA'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600', marginTop: '2px' }}>
                              {data.schooling.class_xii_school}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                              Board: {data.schooling.class_xii_board}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Secondary (Class X)</span>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
                              {data.schooling.class_x_score_value}{data.schooling.class_x_score_type === 'Percentage' ? '%' : ' CGPA'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600', marginTop: '2px' }}>
                              {data.schooling.class_x_school}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                              Board: {data.schooling.class_x_board}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experience & Publications */}
                <div>
                  <h3 className="hr-section-label" style={{ fontSize: '15px', fontWeight: '800', borderBottom: '2px solid #cbd5e1', paddingBottom: '6px', marginBottom: '20px' }}>Work & Publications</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Work Timeline */}
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professional Timeline</h4>
                      
                      {(!data.work_experiences || data.work_experiences.length === 0) ? (
                        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No work experience listed.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                          {data.work_experiences.map((w, i) => (
                            <div key={`work-${i}`} style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid #cbd5e1' }}>
                              <div style={{ position: 'absolute', left: '-5px', top: '5px', width: '8px', height: '8px', borderRadius: '50%', background: w.is_current ? '#2563eb' : '#94a3b8' }}></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>{w.role}</span>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                  {formatWorkDate(w.start_date)} - {w.is_current ? 'Present' : formatWorkDate(w.end_date)}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: '#475569' }}>{w.company_name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Authored Works */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {data.google_scholar && (
                        <a 
                          href={data.google_scholar} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            padding: '10px 16px', 
                            background: '#f8fafc', 
                            borderRadius: '8px', 
                            border: '1px solid #cbd5e1', 
                            fontSize: '13px', 
                            color: '#4f46e5', 
                            fontWeight: '700', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            textDecoration: 'none'
                          }}
                        >
                          <span>🎓 Open Google Scholar Profile</span>
                          <ArrowUpRight size={16} />
                        </a>
                      )}

                      {books.length > 0 && (
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Books Published ({books.length})</div>
                          {books.map((b, i) => <div key={i} style={{ fontSize: '13px', color: '#1e293b', marginBottom: '6px', fontWeight: '600' }}>• "{b.title}"</div>)}
                        </div>
                      )}

                      {papers.length > 0 && (
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Research Papers ({papers.length})</div>
                          {papers.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#1e293b', marginBottom: '6px', fontWeight: '600' }}>• "{p.title}"</div>)}
                        </div>
                      )}

                      {chapters.length > 0 && (
                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Book Chapters ({chapters.length})</div>
                          {chapters.map((ch, i) => <div key={i} style={{ fontSize: '13px', color: '#1e293b', marginBottom: '6px', fontWeight: '600' }}>• "{ch.title}" in <em>{ch.parent_book || 'Book'}</em></div>)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 32px', 
          borderTop: '1px solid #f1f5f9', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          background: '#f8fafc'
        }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: '600' }}>OK</button>
        </div>
      </div>
    </div>
  );
}
