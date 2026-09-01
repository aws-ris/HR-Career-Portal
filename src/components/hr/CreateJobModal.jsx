import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

import { API_BASE as API } from '../../api';

const POSITIONS = [
  'Professor', 
  'Associate Professor', 
  'Assistant Professor', 
  'Research Assistant', 
  'Consultant', 
  'Assistant', 
  'Director', 
  'Officer', 
  'Multi Tasking Staff', 
  'Associate'
];

const DIVISIONS = [
  'RIS', 
  'CMEC', 
  'FITM', 
  'DAKSHIN', 
  'AIC', 
  'Admin - HR', 
  'Admin - IT', 
  'Admin - Finance', 
  'Admin - Publication', 
  'Admin - MTS',
  'Admin - Library',
  'General Admin'
];

const PAY_BANDS = [
  '5200-20200',
  '9300-34800',
  '15600-39100',
  '37400-67000',
  '67000-79000',
  '75500-80000',
  '80000',
  '90000'
];

const PAY_LEVELS = [
  'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5',
  'Level 6', 'Level 7', 'Level 8', 'Level 9',
  'Level 10', 'Level 11', 'Level 12',
  'Level 13', 'Level 13A', 'Level 14',
  'Level 15', 'Level 16', 'Level 17', 'Level 18'
];

const PAY_BAND_DEFAULT_LEVELS = {
  '5200-20200': 'Level 1',
  '9300-34800': 'Level 6',
  '15600-39100': 'Level 10',
  '37400-67000': 'Level 13',
  '67000-79000': 'Level 15',
  '75500-80000': 'Level 16',
  '80000': 'Level 17',
  '90000': 'Level 18'
};

const EMPTY = {
  title: '',
  position: 'Professor',
  division: 'RIS',
  key_terms: '',
  description: '',
  requirements: '',
  deadline: '',
  total_openings: 1,
  pay_band: '15600-39100',
  pay_level: 'Level 10',
  min_experience: 0,
  contract_period: 1,
  employment_type: 'Regular',
  job_mode: 'Offline',
};

export default function CreateJobModal({ job, onClose, onSave }) {
  const isEdit = !!job;
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      const isContractual = (job.contract_period && job.contract_period > 0) || job.job_mode === 'Contractual';
      
      // Parse Pay Band and Level if present in job
      let pb = '15600-39100';
      let lvl = 'Level 10';
      if (job.job_mode && job.job_mode.includes('Pay Band')) {
        const parts = job.job_mode.split('|').map(s => s.trim());
        if (parts[1]) pb = parts[1].replace('Pay Band', '').trim();
        if (parts[2]) lvl = parts[2].trim();
      }

      setForm({
        title:          job.title || '',
        position:       job.position || 'Professor',
        division:       job.division || 'RIS',
        key_terms:      job.key_terms || '',
        description:    job.description || '',
        requirements:   job.requirements || '',
        deadline:       job.deadline ? job.deadline.substring(0, 10) : '',
        total_openings: job.total_openings || 1,
        pay_band:       pb,
        pay_level:      lvl,
        min_experience: job.min_experience !== null ? job.min_experience : 0,
        contract_period:job.contract_period || 1,
        employment_type:isContractual ? 'Contractual' : 'Regular',
        job_mode:       job.job_mode || 'Offline',
      });
    } else {
      setForm(EMPTY);
    }
  }, [job]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const submit = async (publishNow = false) => {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and Description are required.');
      return;
    }
    setLoading(true);
    setError('');

    const isContractual = form.employment_type === 'Contractual';

    const payload = {
      title:          form.title.trim(),
      position:       form.position,
      division:       form.division,
      key_terms:      form.key_terms ? form.key_terms.trim() : null,
      description:    form.description.trim(),
      requirements:   form.requirements ? form.requirements.trim() : null,
      deadline:       form.deadline || null,
      total_openings: parseInt(form.total_openings) || 1,
      status:         publishNow ? 'open' : 'draft',
      min_pay:        null,
      max_pay:        null,
      min_experience: parseInt(form.min_experience) || 0,
      max_experience: null,
      contract_period:isContractual ? (parseInt(form.contract_period) || 1) : null,
      job_mode:       isContractual ? 'Contractual' : `Regular | Pay Band ${form.pay_band} | ${form.pay_level}`,
      pay_band:       isContractual ? null : form.pay_band,
      pay_level:      isContractual ? null : form.pay_level,
    };

    if (isEdit && job) {
      if (job.status === 'closed' && payload.deadline) {
        const dlDate = new Date(payload.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dlDate >= today) {
          payload.status = 'open';
        } else {
          payload.status = 'closed';
        }
      } else if (job.status === 'open' || job.status === 'closed' || job.status === 'archived') {
        payload.status = job.status;
      }
    }

    try {
      let res;
      if (isEdit) {
        res = await fetch(`${API}/jobs/${job.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API}/jobs`, {

          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        let errMessage = "Unknown Error";
        try {
          const err = await res.json();
          if (typeof err.detail === 'string') {
            errMessage = err.detail;
          } else if (Array.isArray(err.detail)) {
            errMessage = err.detail.map(d => {
              const field = d.loc ? d.loc.filter(x => x !== 'body').join('.') : '';
              return field ? `${field}: ${d.msg}` : (d.msg || JSON.stringify(d));
            }).join(' | ');
          } else if (typeof err.detail === 'object' && err.detail !== null) {
            errMessage = JSON.stringify(err.detail);
          } else {
            errMessage = JSON.stringify(err);
          }
        } catch (jsonErr) {
          errMessage = `Status ${res.status}: ${res.statusText || 'Internal Server Error'}`;
        }
        setError("Error: " + errMessage);
        return;
      }

      // If edit + publishNow → also hit the publish endpoint
      if (isEdit && publishNow) {
        await fetch(`${API}/jobs/${job.id}/publish`, { method: 'PATCH' });
      }

      onSave();
    } catch (e) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setError('Could not connect to backend. Ensure uvicorn is running on port 8000.');
      } else {
        setError('Could not connect to the server. Please check your internet connection or try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-modal-overlay" onClick={onClose}>
      <div className="hr-modal hr-modal-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="hr-modal-header">
          <div>
            <h2 className="hr-modal-title">{isEdit ? 'Edit Job Posting' : 'Create New Posting'}</h2>
            <p className="hr-form-hint" style={{ marginTop: '2px' }}>Fill in position details, description, qualifications, and employment terms.</p>
          </div>
          <button className="hr-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="hr-modal-body">
          {/* Top Primary Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.25rem' }}>
            <div className="hr-form-group">
              <label className="hr-form-label">Job Title <span className="hr-required">*</span></label>
              <input
                className="hr-form-input"
                placeholder="e.g. Professor – Computer Science"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>
            <div className="hr-form-group">
              <label className="hr-form-label">Position <span className="hr-required">*</span></label>
              <select className="hr-form-input" value={form.position} onChange={e => set('position', e.target.value)}>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="hr-form-group">
              <label className="hr-form-label">Division <span className="hr-required">*</span></label>
              <select className="hr-form-input" value={form.division} onChange={e => set('division', e.target.value)}>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* 0. Key Terms (Free Text Box for Age, Emoluments, Tenure) */}
          <div className="hr-form-group">
            <label className="hr-form-label">Key Terms</label>
            <RichTextEditor
              minHeight="110px"
              placeholder="Specify key appointment terms, age limit, tenure, and remuneration details..."
              value={form.key_terms}
              onChange={val => set('key_terms', val)}
            />
          </div>

          {/* 1. Job Description (Visual In-Place Rich Text Box) */}
          <div className="hr-form-group">
            <label className="hr-form-label">Job Description <span className="hr-required">*</span></label>
            <RichTextEditor
              minHeight="220px"
              placeholder="Paste or write full job description here... (Highlight text & press Ctrl+B to embolden)"
              value={form.description}
              onChange={val => set('description', val)}
            />
          </div>

          {/* 2. Requirements and Qualification Box */}
          <div className="hr-form-group">
            <label className="hr-form-label">Requirements and Qualification</label>
            <RichTextEditor
              minHeight="160px"
              placeholder="Specify degree requirements, mandatory technical skills, certifications, and prerequisites... (Highlight text & press Ctrl+B to embolden)"
              value={form.requirements}
              onChange={val => set('requirements', val)}
            />
          </div>

          {/* Secondary Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="hr-form-group">
              <label className="hr-form-label">Last Date to Apply</label>
              <input
                type="date"
                className="hr-form-input"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
              />
            </div>
            <div className="hr-form-group">
              <label className="hr-form-label">Vacancies</label>
              <input
                type="number"
                min="1"
                className="hr-form-input"
                value={form.total_openings}
                onChange={e => set('total_openings', e.target.value)}
              />
            </div>
          </div>

          {/* 3. Contract & Compensation Parameters Section with Toggle */}
          <div style={{ marginTop: '0.5rem', padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#002147', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                💼 Employment Terms & Compensation Parameters
              </h4>
              
              {/* Employment Type Toggle (Regular vs Contractual) */}
              <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
                <button
                  type="button"
                  onClick={() => set('employment_type', 'Regular')}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: form.employment_type === 'Regular' ? '#002147' : 'transparent',
                    color: form.employment_type === 'Regular' ? '#ffffff' : '#475569',
                    boxShadow: form.employment_type === 'Regular' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Regular
                </button>
                <button
                  type="button"
                  onClick={() => set('employment_type', 'Contractual')}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: form.employment_type === 'Contractual' ? '#002147' : 'transparent',
                    color: form.employment_type === 'Contractual' ? '#ffffff' : '#475569',
                    boxShadow: form.employment_type === 'Contractual' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  Contractual
                </button>
              </div>
            </div>

            {form.employment_type === 'Regular' ? (
              /* REGULAR POSITION PARAMETERS (7th CPC Pay Band & Level) */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                <div className="hr-form-group">
                  <label className="hr-form-label">Pay Band</label>
                  <select 
                    className="hr-form-input" 
                    value={form.pay_band} 
                    onChange={e => {
                      const pb = e.target.value;
                      setForm(f => ({
                        ...f,
                        pay_band: pb,
                        pay_level: PAY_BAND_DEFAULT_LEVELS[pb] || f.pay_level
                      }));
                    }}
                  >
                    {PAY_BANDS.map(pb => (
                      <option key={pb} value={pb}>{pb}</option>
                    ))}
                  </select>
                </div>
                <div className="hr-form-group">
                  <label className="hr-form-label">Level</label>
                  <select className="hr-form-input" value={form.pay_level} onChange={e => set('pay_level', e.target.value)}>
                    {PAY_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
                <div className="hr-form-group">
                  <label className="hr-form-label">Min Experience (Years)</label>
                  <input type="number" min="0" className="hr-form-input" value={form.min_experience} onChange={e => set('min_experience', e.target.value)} />
                </div>
              </div>
            ) : (
              /* CONTRACTUAL POSITION PARAMETERS */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                <div className="hr-form-group">
                  <label className="hr-form-label">Min Experience (Years)</label>
                  <input type="number" min="0" className="hr-form-input" value={form.min_experience} onChange={e => set('min_experience', e.target.value)} />
                </div>
                <div className="hr-form-group">
                  <label className="hr-form-label">Contract Period (Years)</label>
                  <select className="hr-form-input" value={form.contract_period} onChange={e => set('contract_period', e.target.value)}>
                    {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} Year{y > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && <div className="hr-modal-error">{error}</div>}
        </div>

        {/* Footer */}
        <div className="hr-modal-footer">
          <button className="hr-btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="hr-btn-ghost" onClick={() => submit(false)} disabled={loading}>
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button className="hr-btn-primary" onClick={() => submit(true)} disabled={loading}>
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
