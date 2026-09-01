import React from 'react';
import { X, Calendar, MapPin, Users, Briefcase } from 'lucide-react';
import FormattedText from '../../utils/formatText';

function Info({ icon: Icon, label, value }) {
  return (
    <div className="hr-view-info">
      <Icon size={16} className="hr-view-info-icon" />
      <div>
        <div className="hr-view-info-label">{label}</div>
        <div className="hr-view-info-value">{value}</div>
      </div>
    </div>
  );
}

export default function JobViewModal({ job, onClose }) {
  return (
    <div className="hr-modal-overlay" onClick={onClose}>
      <div className="hr-modal hr-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="hr-modal-header">
          <div className="hr-view-header-main">
            <span className="hr-status-badge open">Active Posting</span>
            <h2 className="hr-modal-title">{job.title}</h2>
          </div>
          <button className="hr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="hr-modal-body hr-view-body">
          <div className="hr-view-meta-row">
            <Info icon={Briefcase} label="Position" value={job.position} />
            <Info icon={MapPin} label="Location" value="RIS, New Delhi" />
            <Info icon={Calendar} label="Deadline" value={new Date(job.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
            <Info icon={Users} label="Applicants" value={job.application_count} />
          </div>

          <div className="hr-divider" />

          <div className="hr-view-content-grid">
            {job.key_terms && (
              <section style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <h3 className="hr-view-section-title" style={{ color: '#002147', marginBottom: '8px' }}>Key Terms & Eligibility</h3>
                <FormattedText text={job.key_terms} className="hr-view-text" />
              </section>
            )}

            <section>
              <h3 className="hr-view-section-title">Job Description</h3>
              <FormattedText text={job.description} className="hr-view-text" />
            </section>
            
            <section>
              <h3 className="hr-view-section-title">Internal Requirements</h3>
              <FormattedText text={job.requirements || 'No specific requirements listed.'} className="hr-view-text" />
            </section>
          </div>
        </div>

        <div className="hr-modal-footer">
          <button className="hr-btn-outline" onClick={onClose}>Close</button>
          <button className="hr-btn-primary" onClick={() => window.location.href = `/hr/jobs/${job.id}/analytics`}>
            Go to Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
