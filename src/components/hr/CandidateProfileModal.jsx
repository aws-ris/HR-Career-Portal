import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, MapPin, Calendar, GraduationCap, Briefcase, BookOpen, FileText, ExternalLink, Download } from 'lucide-react';

import { API_BASE as API } from '../../api';

export default function CandidateProfileModal({ candidateId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) return;
    // In a real DynamoDB setup, this would be a single fetch. 
    // For now, we simulate with the existing Postgres relations.
    fetch(`${API}/candidates/${candidateId}/full_profile`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => console.error(e));
  }, [candidateId]);

  if (!candidateId) return null;

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
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 }}>{data?.full_name}</h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Dossier · {data?.highest_education} Applicant</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => window.open(`${API}/applications/${candidateId}/resume/download?preview=true`, '_blank')}
              style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', 
              background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', 
              fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
            }}>
              <ExternalLink size={18} /> Preview CV
            </button>
            <button 
              onClick={() => window.open(`${API}/applications/${candidateId}/resume/download`, '_blank')}
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
          padding: '40px',
          background: '#ffffff'
        }}>
          {loading ? (
            <div className="hr-modal-loading">
              <div className="hr-loader"></div>
              <p>Retrieving Full Dossier...</p>
            </div>
          ) : (
            <div className="hr-dossier-layout">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '32px', marginBottom: '40px' }}>
                {/* Column 1: Stacked Contact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                    <Mail size={16} /> {data.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                    <Phone size={16} /> {data.mobile_no}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '14px' }}>
                    <MapPin size={16} /> {data.city ? `${data.city}, ` : ''}{data.state}{data.pincode ? ` - ${data.pincode}` : ''}, India
                  </div>
                </div>

                {/* Column 2: Performance & Demographics */}
                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Operational Intel</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Current Age</span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>{data.age} Yrs</span>
                  </div>
                </div>

                {/* Column 3: CV Action Area */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #f1f5f9, #ffffff)', 
                  borderRadius: '16px', border: '1px solid #e2e8f0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                  <FileText size={28} style={{ color: '#4f46e5' }} />
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase' }}>Review Documents</div>
                </div>
              </div>

              {/* About & Extracurriculars */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>About Candidate</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{data.about || "No statement provided."}</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Extracurricular Activities</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{data.extracurriculars || "No extracurriculars listed."}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
                <div>
                  <h3 className="hr-section-label">Academic Profile</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.doctorate?.map((d, i) => (
                      <div key={i} style={{ padding: '20px', background: '#f5f3ff', borderLeft: '4px solid #7c3aed', borderRadius: '8px' }}>
                        <div style={{ fontWeight: '700', color: '#7c3aed', fontSize: '12px', textTransform: 'uppercase' }}>Doctorate</div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px', margin: '4px 0' }}>{d.university}</div>
                        <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#475569' }}>"{d.thesis_title}"</div>
                      </div>
                    ))}
                    {data.postgraduate?.map((p, i) => (
                      <div key={i} style={{ padding: '20px', background: '#eff6ff', borderLeft: '4px solid #2563eb', borderRadius: '8px' }}>
                        <div style={{ fontWeight: '700', color: '#2563eb', fontSize: '12px', textTransform: 'uppercase' }}>Postgraduate</div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px', margin: '4px 0' }}>{p.degree_name}</div>
                        <div style={{ fontSize: '14px', color: '#475569' }}>{p.university}</div>
                      </div>
                    ))}
                    {data.graduation?.map((g, i) => (
                      <div key={i} style={{ padding: '20px', background: '#ecfdf5', borderLeft: '4px solid #059669', borderRadius: '8px' }}>
                        <div style={{ fontWeight: '700', color: '#059669', fontSize: '12px', textTransform: 'uppercase' }}>Undergraduate</div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '16px', margin: '4px 0' }}>{g.degree_name}</div>
                        <div style={{ fontSize: '14px', color: '#475569' }}>{g.university}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="hr-section-label">Work and Publications</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>Work Experience</h4>
                      {data.work_experiences?.map((w, i) => (
                        <div key={i} style={{ marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{w.role}</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>{w.company_name}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {data.books?.length > 0 && (
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Books</div>
                          {data.books.map((b, i) => <div key={i} style={{ fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>• {b.title}</div>)}
                        </div>
                      )}
                      {data.papers?.length > 0 && (
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Research Papers</div>
                          {data.papers.map((p, i) => <div key={i} style={{ fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>• {p.title}</div>)}
                        </div>
                      )}
                      {data.chapters?.length > 0 && (
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Book Chapters</div>
                          {data.chapters.map((ch, i) => <div key={i} style={{ fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>• {ch.title}</div>)}
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
          gap: '12px',
          background: '#f8fafc'
        }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '600' }}>Close</button>
          <button style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Shortlist Candidate</button>
        </div>
      </div>
    </div>
  );
}
