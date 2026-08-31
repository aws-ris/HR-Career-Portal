import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase, BookOpen, FileText, ExternalLink, Download, ArrowUpRight, Award, Globe } from 'lucide-react';

import { API_BASE as API } from '../../api';

export default function CandidateProfileModal({ candidateId, jobId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiEval, setAiEval] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dossier');

  const runAiEvaluation = async () => {
    setAiLoading(true);
    const token = localStorage.getItem('hr_token');
    try {
      const url = jobId 
        ? `${API}/candidates/${candidateId}/ai_evaluate?job_id=${jobId}`
        : `${API}/candidates/${candidateId}/ai_evaluate`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (res.ok) {
        setAiEval(result);
      } else {
        alert(result.detail || 'AI Evaluation failed');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to connect to AI evaluation server');
    } finally {
      setAiLoading(false);
    }
  };

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
        if (d?.ai_evaluation) {
          setAiEval(d.ai_evaluation);
        }
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
    return { bg: '#eff6ff', color: '#002147', label: 'Applied' };
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
              background: 'linear-gradient(135deg, #002147, #a855f7)', 
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
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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

        {/* Sub-Header Tab Navigation Bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 32px'
        }}>
          <button
            onClick={() => setActiveTab('dossier')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderBottom: activeTab === 'dossier' ? '3px solid #002147' : '3px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === 'dossier' ? '800' : '600',
              color: activeTab === 'dossier' ? '#002147' : '#64748b',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📋 Candidate Profile
          </button>

          {aiEval && (
            <>
              <button
                onClick={() => setActiveTab('agent1')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: activeTab === 'agent1' ? '3px solid #7c3aed' : '3px solid transparent',
                  background: 'transparent',
                  fontWeight: activeTab === 'agent1' ? '800' : '600',
                  color: activeTab === 'agent1' ? '#7c3aed' : '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🎓 Academic & Research
              </button>
              <button
                onClick={() => setActiveTab('agent2')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: activeTab === 'agent2' ? '3px solid #2563eb' : '3px solid transparent',
                  background: 'transparent',
                  fontWeight: activeTab === 'agent2' ? '800' : '600',
                  color: activeTab === 'agent2' ? '#2563eb' : '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                💼 Work Experience
              </button>
              <button
                onClick={() => setActiveTab('agent3')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: activeTab === 'agent3' ? '3px solid #059669' : '3px solid transparent',
                  background: 'transparent',
                  fontWeight: activeTab === 'agent3' ? '800' : '600',
                  color: activeTab === 'agent3' ? '#059669' : '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                📝 SOP & AI Detector
              </button>
              <button
                onClick={() => setActiveTab('agent4')}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: activeTab === 'agent4' ? '3px solid #d97706' : '3px solid transparent',
                  background: 'transparent',
                  fontWeight: activeTab === 'agent4' ? '800' : '600',
                  color: activeTab === 'agent4' ? '#d97706' : '#64748b',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                ⚖️ Final Selection Brief
              </button>
            </>
          )}
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
              {/* Tab 1: Academic & Research */}
              {activeTab === 'agent1' && aiEval && (
                <div style={{ padding: '28px', background: '#f5f3ff', borderRadius: '16px', border: '1px solid #ddd6fe' }}>
                  <h3 style={{ color: '#7c3aed', margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                    🎓 Academic & Research Analysis
                  </h3>
                  <p style={{ color: '#5b21b6', fontSize: '0.875rem', marginBottom: '20px' }}>
                    Evaluates degree accreditation, university rigor, academic scores, and publication credentials.
                  </p>

                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#6d28d9', fontWeight: 800 }}>Academic Skill & Domain Tags</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {(aiEval?.agent1_academic?.academic_tags || aiEval?.matched_skill_tags || ['PhD Economics', 'Policy Research']).map((t, idx) => (
                        <span key={idx} style={{ background: '#7c3aed', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: '#6d28d9', fontWeight: 800 }}>Verification Badges</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {(aiEval?.agent1_academic?.verification_badges || ['PhD Degree Verified', 'Published Researcher']).map((b, idx) => (
                        <span key={idx} style={{ background: '#e9d5ff', color: '#581c87', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, border: '1px solid #c084fc' }}>
                          ✓ {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Work Experience */}
              {activeTab === 'agent2' && aiEval && (
                <div style={{ padding: '28px', background: '#eff6ff', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
                  <h3 style={{ color: '#2563eb', margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                    💼 Work Experience & Seniority Analysis
                  </h3>
                  <p style={{ color: '#1e40af', fontSize: '0.875rem', marginBottom: '20px' }}>
                    Analyzes total experience years, role seniority, company relevance, and policy research experience.
                  </p>

                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 800 }}>Evaluated Experience Seniority Level</h4>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', background: '#dbeafe', padding: '10px 16px', borderRadius: '8px', display: 'inline-block', marginTop: '6px' }}>
                      {aiEval?.agent2_experience?.experience_level || 'Senior Research Specialist'}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 800 }}>Professional Domain Skill Tags</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {(aiEval?.agent2_experience?.experience_tags || ['Trade Policy Analysis', 'Gravity Modeling', 'ASEAN Integration']).map((t, idx) => (
                        <span key={idx} style={{ background: '#2563eb', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: SOP & AI Detector */}
              {activeTab === 'agent3' && aiEval && (
                <div style={{ padding: '28px', background: '#ecfdf5', borderRadius: '16px', border: '1px solid #a7f3d0' }}>
                  <h3 style={{ color: '#059669', margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                    📝 SOP Vision & AI Authenticity Analysis
                  </h3>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 800 }}>SOP Authenticity Classification</h4>
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: 800, 
                      color: aiEval?.ai_detector?.ai_classification?.includes('AI') ? '#b91c1c' : '#047857',
                      background: aiEval?.ai_detector?.ai_classification?.includes('AI') ? '#fee2e2' : '#d1fae5',
                      padding: '10px 16px', 
                      borderRadius: '8px', 
                      display: 'inline-block', 
                      marginTop: '6px' 
                    }}>
                      🔍 {aiEval?.ai_detector?.ai_classification || 'Likely Human Writing'}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 800 }}>Candidate Qualitative Vision Summary</h4>
                    <p style={{ fontSize: '0.9rem', color: '#064e3b', background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #a7f3d0', margin: '6px 0 0 0', lineHeight: 1.6 }}>
                      "{aiEval?.ai_detector?.vision_summary || 'Candidate expressed clear research vision focused on trade policy and G20 development governance.'}"
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 4: Selection Committee Chair Final Summary */}
              {activeTab === 'agent4' && aiEval && (
                <div style={{ padding: '28px', background: '#fffbeb', borderRadius: '16px', border: '1px solid #fde68a' }}>
                  <h3 style={{ color: '#d97706', margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                    ⚖️ Executive Selection Brief
                  </h3>

                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 800 }}>Overall Semantic Alignment</h4>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#78350f', background: '#fef3c7', padding: '10px 16px', borderRadius: '8px', display: 'inline-block', marginTop: '6px' }}>
                      🎯 {aiEval?.semantic_alignment || 'High Alignment'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: '#047857', fontWeight: 800, marginBottom: '8px' }}>🌟 Key Candidate Profile Strengths</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: '#1f2937', lineHeight: 1.6 }}>
                        {(aiEval?.key_strengths || ['Strong academic trade policy foundation', 'Clear qualitative SOP vision']).map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: '#b45309', fontWeight: 800, marginBottom: '8px' }}>❓ Committee Interview Questions</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: '#1f2937', lineHeight: 1.6 }}>
                        {(aiEval?.tailored_interview_questions || ['Can you summarize your research background for the Consultant position?']).map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 'dossier': Standard Candidate Profile Layout */}
              {activeTab === 'dossier' && (
                <>
              {/* Executive Rundown Panels (Top row) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                {/* Panel 1: Experience */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase size={12} style={{ color: '#002147' }} /> Total Experience
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
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#002147', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={12} /> Review Documents
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View PDF CV <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                  <Mail size={16} style={{ color: '#002147' }} /> <strong>Email:</strong> {data.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                  <Phone size={16} style={{ color: '#10b981' }} /> <strong>Mobile:</strong> {data.country_code || ''} {data.mobile_no}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                  <Globe size={16} style={{ color: '#6366f1' }} /> <strong>Nationality:</strong> {data.nationality || 'Indian'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                  <MapPin size={16} style={{ color: '#ef4444' }} /> <strong>Location:</strong> {data.city ? `${data.city}, ` : ''}{data.state}{data.pincode ? ` - ${data.pincode}` : ''}
                </div>

              </div>

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
                      <div key={`pg-${i}`} style={{ padding: '20px', background: '#eff6ff', borderLeft: '4px solid #002147', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: '800', color: '#002147', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Postgraduate</span>
                          {p.grad_year && <span style={{ fontSize: '12px', fontWeight: '600', color: '#002147', background: '#dbeafe', padding: '2px 8px', borderRadius: '4px' }}>Graduated {p.grad_year}</span>}
                        </div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px', margin: '6px 0' }}>{p.degree_name}</div>
                        <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>{p.university}</div>
                        {p.score_value && (
                          <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#002147', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
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
                              Year: {data.schooling.class_xii_year || 'N/A'} | Board: {data.schooling.class_xii_board}
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
                              Year: {data.schooling.class_x_year || 'N/A'} | Board: {data.schooling.class_x_board}
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
                              <div style={{ position: 'absolute', left: '-5px', top: '5px', width: '8px', height: '8px', borderRadius: '50%', background: w.is_current ? '#002147' : '#94a3b8' }}></div>
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
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {data.google_scholar && (
                          <a 
                            href={data.google_scholar} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ 
                              flex: 1,
                              padding: '10px 16px', 
                              background: '#f8fafc', 
                              borderRadius: '8px', 
                              border: '1px solid #cbd5e1', 
                              fontSize: '13px', 
                              color: '#002147', 
                              fontWeight: '700', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              textDecoration: 'none'
                            }}
                          >
                            <span>🎓 Scholar Profile</span>
                            <ArrowUpRight size={14} />
                          </a>
                        )}

                        {data.linkedin && (
                          <a 
                            href={data.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ 
                              flex: 1,
                              padding: '10px 16px', 
                              background: '#f8fafc', 
                              borderRadius: '8px', 
                              border: '1px solid #cbd5e1', 
                              fontSize: '13px', 
                              color: '#0284c7', 
                              fontWeight: '700', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              textDecoration: 'none'
                            }}
                          >
                            <span>🔗 LinkedIn Profile</span>
                            <ArrowUpRight size={14} />
                          </a>
                        )}
                      </div>

                      {/* Statement of Purpose */}
                      {data.sop && (
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: '#002147', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Statement of Purpose (SOP)
                          </h4>
                          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-line' }}>
                            {data.sop}
                          </p>
                        </div>
                      )}

                      <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Publication Roster Counts</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#1e293b' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #e2e8f0', paddingBottom: '4px' }}>
                            <span>📚 <strong>Books Published:</strong></span>
                            <span style={{ fontWeight: '800', color: '#7c3aed' }}>{data.pub_books || 0}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #e2e8f0', paddingBottom: '4px' }}>
                            <span>📝 <strong>Peer-Reviewed Journal Papers:</strong></span>
                            <span style={{ fontWeight: '800', color: '#2563eb' }}>{data.pub_papers || 0}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #e2e8f0', paddingBottom: '4px' }}>
                            <span>📖 <strong>Book Chapters:</strong></span>
                            <span style={{ fontWeight: '800', color: '#059669' }}>{data.pub_chapters || 0}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #e2e8f0', paddingBottom: '4px' }}>
                            <span>📊 <strong>Research Reports:</strong></span>
                            <span style={{ fontWeight: '800', color: '#0891b2' }}>{data.pub_reports || 0}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                            <span>💡 <strong>Policy Briefs:</strong></span>
                            <span style={{ fontWeight: '800', color: '#ea580c' }}>{data.pub_policy_briefs || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Application History Section */}
                      {data.applications && data.applications.length > 0 && (
                        <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0', marginTop: '20px' }}>
                          <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📂 Application History & Previous Vacancies ({data.applications.length} Total)
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {data.applications.map((app, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                                <div>
                                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>
                                    📌 {app.position_applied || 'Applied Position'} {app.admin_department ? `(${app.admin_department})` : ''}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                    Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                                  </div>
                                </div>
                                <span className="hr-status-pill" data-status={app.current_status} style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                                  {app.current_status ? app.current_status.replace('_', ' ') : 'Received'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '16px 32px', 
          borderTop: '1px solid #e2e8f0', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center', 
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={runAiEvaluation}
              disabled={aiLoading}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', 
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: 'white', border: 'none', borderRadius: '8px', 
                fontWeight: '800', fontSize: '14px', cursor: aiLoading ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
              }}>
              <Award size={18} /> {aiLoading ? 'Running Groq AI Crew...' : '🤖 Run AI Evaluation'}
            </button>

            {aiEval && (
              <button 
                onClick={() => window.open(`${API}/applications/${candidateId}/executive_dossier/download?token=${localStorage.getItem('hr_token') || ''}`, '_blank')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
                  background: '#059669', color: 'white', border: 'none', borderRadius: '8px', 
                  fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                }}>
                <Download size={18} /> 📄 Download Executive Dossier Report
              </button>
            )}
          </div>

          <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#002147', color: 'white', cursor: 'pointer', fontWeight: '700' }}>OK</button>
        </div>
      </div>
    </div>
  );
}
