import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, ArrowRight, Search, Shield, ExternalLink, Filter, CheckCircle, Clock } from 'lucide-react';
import { API_BASE as API } from '../api';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
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

  // Extract unique division categories from jobs list
  const divisions = ['ALL', ...Array.from(new Set(jobs.map(j => j.division).filter(Boolean)))];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.division && job.division.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (job.position && job.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDivision = selectedDivision === 'ALL' || job.division === selectedDivision;
    return matchesSearch && matchesDivision;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* ── Standalone Portal Navigation Header ── */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 5%', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/logo.jpg" 
              alt="RIS Seal Logo" 
              style={{ height: '75px', maxHeight: '80px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          </div>

          {/* Action Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Back to main website in a new tab */}
            <a 
              href="https://www.ris.org.in" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                color: '#002147',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              ← Back to Main Website (ris.org.in) <ExternalLink size={14} />
            </a>

            {/* HR Login Button */}
            <button 
              onClick={() => navigate('/hr')}
              style={{
                fontSize: '0.85rem',
                color: 'white',
                background: '#002147',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,33,71,0.15)'
              }}
            >
              HR Login
            </button>
          </div>

        </div>
      </nav>

      {/* ── Cohesive Hero Banner ── */}
      <header style={{ background: 'linear-gradient(135deg, #002147 0%, #001630 100%)', padding: '56px 5% 48px 5%', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          {/* Social Media Handles */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Follow RIS:</span>
            <a href="https://x.com/RIS_NewDelhi" target="_blank" rel="noopener noreferrer" title="Follow on X" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>𝕏</a>
            <a href="https://www.facebook.com/RISNewDelhi" target="_blank" rel="noopener noreferrer" title="Follow on Facebook" style={{ background: '#1877f2', color: 'white', width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>f</a>
            <a href="https://www.linkedin.com/company/research-and-information-system-for-developing-countries" target="_blank" rel="noopener noreferrer" title="Follow on LinkedIn" style={{ background: '#0a66c2', color: 'white', width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>in</a>
            <a href="https://www.youtube.com/user/RISNewDelhi" target="_blank" rel="noopener noreferrer" title="Subscribe on YouTube" style={{ background: '#ff0000', color: 'white', width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>▶</a>
            <a href="https://www.instagram.com/ris_newdelhi" target="_blank" rel="noopener noreferrer" title="Follow on Instagram" style={{ background: '#e4405f', color: 'white', width: '30px', height: '30px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}>📷</a>
          </div>

          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            RIS Careers
          </h2>
          
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '32px', lineHeight: 1.7, maxWidth: '900px', margin: '0 auto 32px auto', textAlign: 'justify' }}>
            RIS is a premier policy research institution providing analytical support and policy advice to developing countries and institutional networking in the field of international economic issues. It has built up considerable expertise in policy analysis from a development perspective on global economic and trade governance, regional economic integration in Asia, South-South cooperation, new technologies and development, and strategic policy responses to globalization, among other issues. It also conducts capacity building programmes in these areas for officials and researchers from developing countries. Set up in 1984 in New Delhi, it is an autonomous institution funded by the Government of India. More information on the work of RIS may be obtained from its website.
          </p>
          
          {/* Search Bar Container */}
          <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
            <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
            <input 
              type="text" 
              placeholder="Search positions by title, role, or division..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px 16px 54px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '0.98rem',
                color: '#0f172a',
                outline: 'none',
                boxShadow: '0 12px 30px -5px rgba(0,0,0,0.35)'
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main style={{ padding: '40px 5% 80px 5%', maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#002147', margin: 0 }}>
              Current Vacancies & Openings
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              Select an open vacancy below to read requirements and submit your application online.
            </p>
          </div>
          
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#002147', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 14px', borderRadius: '20px' }}>
            {filteredJobs.length} Positions Available
          </div>
        </div>

        {/* ── Job Cards List Grid ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading open vacancies...</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
            <Briefcase size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
            <h4 style={{ fontSize: '1.15rem', color: '#334155', margin: '0 0 8px 0' }}>No active positions match your query</h4>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Try clearing your search term.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
            {filteredJobs.map(job => (
              <div 
                key={job.id}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                
                {/* Card Top Meta (Last date only) */}
                {job.deadline && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c62828', fontSize: '0.75rem', fontWeight: 700, background: '#fef2f2', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px' }}>
                      <Calendar size={13} />
                      Last date: {new Date(job.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )}

                {/* Job Title & Position */}
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', lineHeight: 1.3 }}>
                  {job.title}
                </h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: 600 }}>
                    <Briefcase size={15} /> {job.position || 'Open Role'}
                  </span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#002147', fontWeight: 700 }}>
                    Vacancies: {job.total_openings || 1}
                  </span>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={15} /> {job.location || 'New Delhi, India'}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginBottom: '16px' }}>
                  * Number of vacancies may vary.
                </div>

                {/* Description Preview */}
                <div style={{ flex: 1, marginBottom: '20px' }}>
                  <p style={{ fontSize: '0.88rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6, margin: 0 }}>
                    {job.description}
                  </p>
                </div>

                {/* Action Button: Apply Now only */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button 
                    onClick={() => navigate(`/apply/${job.id}`)}
                    style={{ width: '100%', padding: '12px', background: '#c62828', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(198,40,40,0.2)' }}
                  >
                    Apply Now <ArrowRight size={16} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* ── Portal Footer ── */}
      <footer style={{ background: '#002147', color: 'white', padding: '40px 5%', marginTop: '60px', borderTop: '4px solid #c62828' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700 }}>© {new Date().getFullYear()} Research and Information System for Developing Countries (RIS)</p>
            <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: '0.8rem' }}>Core IV-B, Fourth Floor, India Habitat Centre, Lodhi Road, New Delhi-110 003, India</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', color: '#cbd5e1' }}>
            <a href="https://www.ris.org.in" target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Official Website</a>
            <span>|</span>
            <span>Privacy Policy</span>
            <span>|</span>
            <span>Technical Support</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
