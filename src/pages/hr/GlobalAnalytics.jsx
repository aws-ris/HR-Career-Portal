import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, Globe, GraduationCap, TrendingUp } from 'lucide-react';

import { API_BASE as API } from '../../api';

// Vibrant Multi-color Executive Palette
const COLORS = {
  edu: {
    'PhD': '#C8102E',      // Crimson Red
    'Masters': '#002147',  // Oxford Navy
    'Bachelors': '#0072B2' // Sapphire Blue
  },
  gender: {
    'Male': '#002147',
    'Female': '#C8102E',
    'Other': '#5E35B1'
  },
  states: ['#5E35B1', '#009E73', '#002147', '#C8102E', '#0072B2']
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="hr-chart-tooltip">
        <p className="hr-tooltip-label">{label || data.name}</p>
        <p className="hr-tooltip-value">
          <span className="hr-tooltip-count">{payload[0].value}</span>
          <span className="hr-tooltip-unit"> Applicants</span>
        </p>
        <p className="hr-tooltip-subtext">Highest Qualification Only</p>
      </div>
    );
  }
  return null;
};

function AnalyticsCard({ title, icon: Icon, children }) {
  return (
    <div className="hr-analytics-card">
      <div className="hr-analytics-card-header">
        <div className="hr-analytics-icon-box">
          <Icon size={18} className="hr-analytics-icon" />
        </div>
        <h3 className="hr-analytics-card-title">{title}</h3>
      </div>
      <div className="hr-analytics-card-body">
        {children}
      </div>
    </div>
  );
}

export default function GlobalAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Global Analytics | RIS HR Portal";
    // Add timestamp to bust browser cache
    fetch(`${API}/hr/analytics/global?t=${new Date().getTime()}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => console.error(e));
  }, []);

  if (loading) return (
    <div className="hr-loading-container">
      <div className="hr-loader"></div>
      <p>Gathering Talent Insights...</p>
    </div>
  );

  return (
    <div className="hr-page">
      <div className="hr-page-header">
        <div>
          <h1 className="hr-page-title">Global Command Center</h1>
          <p className="hr-page-subtitle">Real-time talent pool demographics (Highest Qualification Only)</p>
        </div>
      </div>

      <div className="hr-analytics-grid">
        {/* 1. Gender Distribution */}
        <AnalyticsCard title="Gender Diversity" icon={Users}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.gender}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {data.gender.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.gender[entry.name] || '#cbd5e1'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        {/* 2. State Distribution */}
        <AnalyticsCard title="Top Talent Hubs" icon={Globe}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.states} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  axisLine={false} 
                  tickLine={false} 
                  style={{ fontSize: '12px', fontWeight: 600, fill: '#475569' }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.6)'}} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {data.states.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.states[index % COLORS.states.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        {/* 3. Highest Education Level */}
        <AnalyticsCard title="Seniority (Highest Degree)" icon={GraduationCap}>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.education} margin={{ top: 20, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  style={{ fontSize: '12px', fontWeight: 700, fill: '#1e293b' }} 
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.6)'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                  {data.education.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.edu[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        {/* 4. Category Breakdown */}
        {data.categories && (
          <AnalyticsCard title="Category Distribution" icon={TrendingUp}>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categories} margin={{ top: 20, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    style={{ fontSize: '11px', fontWeight: 600, fill: '#475569' }} 
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.6)'}} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                    {data.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#002147', '#0072B2', '#C8102E', '#009E73', '#5E35B1', '#d97706'][index % 6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>
        )}

      </div>
    </div>
  );
}
