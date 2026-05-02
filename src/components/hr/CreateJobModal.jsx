import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { API_BASE as API } from '../../api';

const POSITIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Research Assistant', 'Consultant', 'Admin'];
const DIVISIONS = ['RIS', 'CMEC', 'FITM', 'DAKSHIN', 'AIC'];

const EMPTY = {
  title: '',
  position: 'Professor',
  division: 'RIS',
  description: '',
  requirements: '',
  deadline: '',
  total_openings: 1,
};

export default function CreateJobModal({ job, onClose, onSave }) {
  const isEdit = !!job;
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      setForm({
        title:          job.title || '',
        position:       job.position || 'Professor',
        division:       job.division || 'RIS',
        description:    job.description || '',
        requirements:   job.requirements || '',
        deadline:       job.deadline ? job.deadline.substring(0, 10) : '',
        total_openings: job.total_openings || 1,
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

    const payload = {
      title:          form.title.trim(),
      position:       form.position,
      division:       form.division,
      description:    form.description.trim(),
      requirements:   form.requirements.trim() || null,
      deadline:       form.deadline || null,
      total_openings: parseInt(form.total_openings) || 1,
      status:         publishNow ? 'open' : 'draft',
    };

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
        const err = await res.json();
        setError(JSON.stringify(err.detail || err));
        return;
      }

      // If edit + publishNow → also hit the publish endpoint
      if (isEdit && publishNow) {
        await fetch(`${API}/jobs/${job.id}/publish`, { method: 'PATCH' });
      }

      onSave();
    } catch (e) {
      setError('Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-modal-overlay" onClick={onClose}>
      <div className="hr-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="hr-modal-header">
          <h2 className="hr-modal-title">{isEdit ? 'Edit Job Posting' : 'Create New Posting'}</h2>
          <button className="hr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="hr-modal-body">
          {/* Title */}
          <div className="hr-form-group">
            <label className="hr-form-label">Job Title <span className="hr-required">*</span></label>
            <input
              className="hr-form-input"
              placeholder="e.g. Professor – Computer Science"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          {/* Position + Division */}
          <div className="hr-form-row">
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

          {/* Description */}
          <div className="hr-form-group">
            <label className="hr-form-label">Description <span className="hr-required">*</span></label>
            <p className="hr-form-hint">Public-facing — visible to candidates</p>
            <textarea
              className="hr-form-input hr-textarea"
              placeholder="Describe the role, responsibilities, and what you are looking for..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Requirements */}
          <div className="hr-form-group">
            <label className="hr-form-label">Requirements</label>
            <p className="hr-form-hint">Internal only — used for AI keyword matching</p>
            <textarea
              className="hr-form-input hr-textarea"
              placeholder="Minimum qualifications, experience, preferred skills..."
              value={form.requirements}
              onChange={e => set('requirements', e.target.value)}
            />
          </div>

          {/* Deadline + Openings */}
          <div className="hr-form-row">
            <div className="hr-form-group">
              <label className="hr-form-label">Deadline</label>
              <input
                type="date"
                className="hr-form-input"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
              />
            </div>
            <div className="hr-form-group">
              <label className="hr-form-label">Total Openings</label>
              <input
                type="number"
                min="1"
                className="hr-form-input"
                value={form.total_openings}
                onChange={e => set('total_openings', e.target.value)}
              />
            </div>
          </div>

          <p className="hr-modal-location-note">📍 Location: RIS, New Delhi (fixed for all postings)</p>

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
