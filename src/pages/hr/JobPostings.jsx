import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Briefcase, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreateJobModal from '../../components/hr/CreateJobModal';
import DraftPreviewModal from '../../components/hr/DraftPreviewModal';
import JobViewModal from '../../components/hr/JobViewModal';

import { API_BASE as API } from '../../api';

const STATUS_TABS = ['All', 'Open', 'Draft', 'Closed', 'Archived'];

const STATUS_COLORS = {
  open:     { bg: '#dcfce7', color: '#15803d', label: 'Open' },
  draft:    { bg: '#f1f5f9', color: '#475569', label: 'Draft' },
  closed:   { bg: '#fee2e2', color: '#b91c1c', label: 'Closed' },
  archived: { bg: '#e2e8f0', color: '#334155', label: 'Archived' },
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function KPICard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="hr-kpi-card" style={{ '--kpi-accent': accent }}>
      <div className="hr-kpi-icon"><Icon size={20} /></div>
      <div className="hr-kpi-body">
        <div className="hr-kpi-value">{value}</div>
        <div className="hr-kpi-label">{label}</div>
        {sub && <div className="hr-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function JobPostings() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ open_positions: 0, total_applicants_year: 0, closing_soon: 0 });
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingJob, setViewingJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [draftJob, setDraftJob] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, statsRes] = await Promise.all([
        fetch(`${API}/jobs`),
        fetch(`${API}/hr/stats`),
      ]);
      const jobsData = await jobsRes.json();
      const statsData = await statsRes.json();
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Jobs Management | RIS HR Portal";
    load();
  }, [load]);

  const filtered = activeTab === 'All'
    ? jobs
    : jobs.filter(j => j.status === activeTab.toLowerCase());

  const tabCount = (tab) => tab === 'All'
    ? jobs.length
    : jobs.filter(j => j.status === tab.toLowerCase()).length;

  const doAction = async (url, method = 'PATCH') => {
    setActionLoading(url);
    try {
      const res = await fetch(`${API}${url}`, { method });
      if (!res.ok) throw new Error('Action failed');
      await load();
    } catch (e) {
      alert('Action failed. Check backend connection.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingJob(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    load();
  };

  return (
    <div className="hr-page">
      <div className="hr-page-header">
        <div>
          <h1 className="hr-page-title">Job Postings</h1>
          <p className="hr-page-subtitle">Manage all open, draft and archived positions at RIS</p>
        </div>
        <button className="hr-btn-refresh" onClick={load} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="hr-kpi-row">
        <KPICard icon={Briefcase}   label="Open Positions"           value={stats.open_positions}        accent="#002147" />
        <KPICard icon={TrendingUp}  label="Total Applicants This Year" value={stats.total_applicants_year} accent="#009E73" />
        <KPICard icon={AlertCircle} label="Closing Soon"              value={stats.closing_soon}          accent="#C8102E" sub="within 7 days" />
      </div>

      <div className="hr-divider" />

      <div className="hr-toolbar">
        <div className="hr-tabs">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              className={`hr-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              <span className="hr-tab-count">{tabCount(tab)}</span>
            </button>
          ))}
        </div>
        <button className="hr-btn-create" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          Create New Posting
        </button>
      </div>

      <div className="hr-table-wrap">
        {loading ? (
          <div className="hr-table-empty">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="hr-table-empty">No {activeTab === 'All' ? '' : activeTab.toLowerCase()} postings found.</div>
        ) : (
          <table className="hr-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Division</th>
                <th>Applications</th>
                <th>Posted</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => {
                const sc = STATUS_COLORS[job.status] || STATUS_COLORS.draft;
                const busy = actionLoading !== null;
                return (
                  <tr key={job.id}>
                    <td>
                      {job.status === 'draft' ? (
                        <button className="hr-table-title-link" onClick={() => setDraftJob(job)}>
                          {job.title}
                        </button>
                      ) : (
                        <Link to={`/hr/jobs/${job.id}/analytics`} className="hr-table-title-link">
                          {job.title}
                        </Link>
                      )}
                    </td>
                    <td>{job.division}</td>
                    <td className="hr-table-center">{job.application_count}</td>
                    <td>{fmt(job.created_at)}</td>
                    <td>{fmt(job.deadline)}</td>
                    <td>
                      <span className="hr-status-badge" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td>
                      <div className="hr-actions">
                        {job.status === 'open' && (<>
                          <button className="hr-action" disabled={busy} onClick={() => setViewingJob(job)}>View</button>
                          <button className="hr-action" disabled={busy} onClick={() => handleEdit(job)}>Edit</button>
                          <button className="hr-action" disabled={busy} onClick={() => doAction(`/jobs/${job.id}/archive`)}>Archive</button>
                        </>)}
                        {job.status === 'draft' && (<>
                          <button className="hr-action" disabled={busy} onClick={() => handleEdit(job)}>Edit</button>
                          <button className="hr-action primary" disabled={busy} onClick={() => doAction(`/jobs/${job.id}/publish`)}>Publish</button>
                          <button className="hr-action danger" disabled={busy} onClick={() => { if (window.confirm('Delete this draft?')) doAction(`/jobs/${job.id}`, 'DELETE'); }}>Delete</button>
                        </>)}
                        {job.status === 'closed' && (<>
                          <button className="hr-action" disabled={busy} onClick={() => setViewingJob(job)}>View</button>
                          <button className="hr-action" disabled={busy} onClick={() => doAction(`/jobs/${job.id}/archive`)}>Archive</button>
                        </>)}
                        {job.status === 'archived' && (
                          <button className="hr-action" disabled={busy} onClick={() => setViewingJob(job)}>View</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <CreateJobModal job={editingJob} onClose={handleModalClose} onSave={handleModalSave} />
      )}
      {draftJob && (
        <DraftPreviewModal
          job={draftJob}
          onClose={() => setDraftJob(null)}
          onEdit={() => { setDraftJob(null); handleEdit(draftJob); }}
          onPublish={async () => { await doAction(`/jobs/${draftJob.id}/publish`); setDraftJob(null); }}
        />
      )}
      {viewingJob && (
        <JobViewModal job={viewingJob} onClose={() => setViewingJob(null)} />
      )}
    </div>
  );
}
