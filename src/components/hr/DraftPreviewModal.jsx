import React from 'react';
import { X, Edit2, Send } from 'lucide-react';
import FormattedText from '../../utils/formatText';

function fmt(dateStr) {
  if (!dateStr) return 'Not set';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function Field({ label, value }) {
  return (
    <div className="hr-contract-field">
      <p className="hr-contract-label">{label}</p>
      {typeof value === 'string' ? (
        <FormattedText text={value || '—'} className="hr-contract-value" />
      ) : (
        <p className="hr-contract-value">{value || '—'}</p>
      )}
    </div>
  );
}

export default function DraftPreviewModal({ job, onClose, onEdit, onPublish }) {
  return (
    <div className="hr-modal-overlay" onClick={onClose}>
      <div className="hr-modal hr-modal-contract" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="hr-modal-header">
          <div>
            <span className="hr-draft-pill">Draft Preview</span>
          </div>
          <button className="hr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="hr-modal-body hr-contract-body">
          <Field label="JOB TITLE"     value={job.title} />
          <Field label="POSITION"      value={job.position} />
          <Field label="DIVISION"      value={job.division} />
          <div className="hr-contract-divider" />
          <Field label="DESCRIPTION"   value={job.description} />
          <Field label="REQUIREMENTS"  value={job.requirements} />
          <div className="hr-contract-divider" />
          <div className="hr-contract-row">
            <Field label="DEADLINE"        value={fmt(job.deadline)} />
            <Field label="VACANCIES" value={job.total_openings} />
          </div>
          <Field label="LOCATION" value="RIS, New Delhi" />
        </div>

        <div className="hr-modal-footer">
          <button className="hr-btn-outline" onClick={onClose}>Close</button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="hr-btn-ghost" onClick={onEdit}>
              <Edit2 size={14} /> Edit
            </button>
            <button className="hr-btn-primary" onClick={onPublish}>
              <Send size={14} /> Publish Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
