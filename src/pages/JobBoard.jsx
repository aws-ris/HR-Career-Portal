
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, ArrowRight, Search, Globe, Shield } from 'lucide-react';
import { API_BASE as API } from '../api';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "RIS Careers · Recruitment Portal";
    fetch(`${API}/public/jobs`)
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch jobs:", err);
        setLoading(false);
      });
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.division.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      {/* Institutional Navbar */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.jpg" alt="RIS Logo" style={{ height: '45px' }} />
          <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '12px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>RIS</h1>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recruitment Portal</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/hr')}
          style={{ fontSize: '0.875rem', color: '#64748b', background: 'none', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
        >
          HR Login
        </button>
      </nav>

      {/* Hero Section */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '80px 5%', textAlign: 'center', color: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px', lineHeight: 1.1 }}>Shape Global Policy with RIS.</h2>
          <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '40px' }}>
            Join a premier institution dedicated to research, intelligence, and strategic policy development.
          </p>
          
          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
            <input 
              type="text" 
              placeholder="Search by title or department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '18px 20px 18px 55px', borderRadius: '12px', border: 'none', fontSize: '1rem', color: '#0f172a', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '60px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Open Positions</h3>
            <p style={{ color: '#64748b' }}>Explore current research and administrative opportunities.</p>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', background: '#e2e8f0', padding: '6px 12px', borderRadius: '20px' }}>
            {filteredJobs.length} Results
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div className="loader" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #0f172a', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <Briefcase size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
            <h4 style={{ fontSize: '1.125rem', color: '#475569' }}>No positions found match your search.</h4>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {filteredJobs.map(job => (
              <div 
                key={job.id} 
                style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0,0,0,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', background: '#f0f9ff', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                    {job.division}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Calendar size={14} />
                    Due: {job.deadline ? new Date(job.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                  </div>
                </div>

                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', lineHeight: 1.3 }}>{job.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.875rem', marginBottom: '20px' }}>
                  <Briefcase size={16} />
                  <span>{job.position}</span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <MapPin size={16} />
                  <span>{job.location || 'New Delhi, India'}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '8px', lineHeight: 1.6 }}>
                    {job.description}
                  </p>
                  <button 
                    onClick={() => setSelectedJob(job)}
                    style={{ background: 'none', border: 'none', color: '#0369a1', fontSize: '0.875rem', fontWeight: 600, padding: 0, cursor: 'pointer', marginBottom: '24px' }}
                  >
                    Read Full Description
                  </button>
                </div>

                <button 
                  onClick={() => navigate(`/apply/${job.id}`)}
                  style={{ width: '100%', padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#0f172a'}
                >
                  Apply Now <ArrowRight size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Job Description Modal */}
      {selectedJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedJob(null)}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedJob(null)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem' }}
            >
              ×
            </button>
            
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', background: '#f0f9ff', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                {selectedJob.division}
              </span>
            </div>
            
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>{selectedJob.title}</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.875rem' }}>
                <Briefcase size={16} /> <span>{selectedJob.position}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.875rem' }}>
                <MapPin size={16} /> <span>{selectedJob.location || 'New Delhi, India'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
                <Calendar size={16} /> <span>Due: {selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Job Description</h3>
              <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selectedJob.description}</p>
            </div>
            
            {selectedJob.requirements && (
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Requirements</h3>
                <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selectedJob.requirements}</p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => navigate(`/apply/${selectedJob.id}`)}
                style={{ flex: 1, padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#0f172a'}
              >
                Apply Now <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => setSelectedJob(null)}
                style={{ padding: '14px 24px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: 'white', borderTop: '1px solid #e2e8f0', padding: '60px 5%', marginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          <div>
            <img src="/logo.jpg" alt="RIS Logo" style={{ height: '40px', marginBottom: '20px' }} />
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
              Research and Information System for Developing Countries (RIS) is a New Delhi-based autonomous policy research institute.
            </p>
          </div>
          <div>
            <h5 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Legal</h5>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem', color: '#64748b' }}>
              <li style={{ marginBottom: '10px' }}>Privacy Policy</li>
              <li style={{ marginBottom: '10px' }}>Terms of Service</li>
              <li style={{ marginBottom: '10px' }}>Equal Opportunity</li>
            </ul>
          </div>
          <div>
            <h5 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Support</h5>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem', color: '#64748b' }}>
              <li style={{ marginBottom: '10px' }}>Help Center</li>
              <li style={{ marginBottom: '10px' }}>Application FAQ</li>
              <li style={{ marginBottom: '10px' }}>Contact IT</li>
            </ul>
          </div>
          <div>
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 600, marginBottom: '8px' }}>
                <Shield size={18} /> Secure Portal
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                Your data is protected by industry-standard encryption and processed solely for recruitment.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
