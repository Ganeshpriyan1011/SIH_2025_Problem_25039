import React, { useMemo } from 'react';
import { Report, Role, User, HazardType } from '../types';
import { HAZARD_COLORS } from '../constants';

interface AnalyticsProps {
  reports: Report[];
  user: User;
}

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ reports, user }) => {
  // Check if user has access to analytics
  if (user.role === Role.Citizen) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <ion-icon name="analytics-outline" size="large" className="text-slate-400 mb-4"></ion-icon>
          <h2 className="text-xl font-semibold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400">Analytics are only available to officials and analysts.</p>
        </div>
      </div>
    );
  }

  const analytics = useMemo(() => {
    const total = reports.length;
    const verified = reports.filter(r => r.verified).length;
    const rejected = reports.filter(r => r.verificationStatus === 'rejected').length;
    const pending = total - verified - rejected;
    
    // Hazard type distribution
    const hazardCounts = reports.reduce((acc, report) => {
      acc[report.hazard] = (acc[report.hazard] || 0) + 1;
      return acc;
    }, {} as Record<HazardType, number>);

    // Location analysis (simplified - by state/region)
    const locationCounts = reports.reduce((acc, report) => {
      const location = report.location.name.split(',').slice(-2, -1)[0]?.trim() || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Time-based analysis (last 7 days)
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyCounts = last7Days.map(date => ({
      date,
      count: reports.filter(r => r.timestamp.startsWith(date)).length
    }));

    // Confidence analysis
    const avgConfidence = reports.length > 0 
      ? Math.round(reports.reduce((sum, r) => sum + r.confidence, 0) / reports.length)
      : 0;

    const highConfidence = reports.filter(r => r.confidence >= 75).length;
    const mediumConfidence = reports.filter(r => r.confidence >= 40 && r.confidence < 75).length;
    const lowConfidence = reports.filter(r => r.confidence < 40).length;

    return {
      total,
      verified,
      rejected,
      pending,
      hazardCounts,
      locationCounts,
      dailyCounts,
      avgConfidence,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
      rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0
    };
  }, [reports]);

  const statCards: StatCard[] = [
    {
      title: 'Total Reports',
      value: analytics.total,
      icon: 'document-text-outline',
      color: 'bg-blue-500'
    },
    {
      title: 'Verified Reports',
      value: analytics.verified,
      change: `${analytics.verificationRate}%`,
      changeType: 'positive',
      icon: 'checkmark-circle-outline',
      color: 'bg-green-500'
    },
    {
      title: 'Rejected Reports',
      value: analytics.rejected,
      change: `${analytics.rejectionRate}%`,
      changeType: 'negative',
      icon: 'close-circle-outline',
      color: 'bg-red-500'
    },
    {
      title: 'Pending Review',
      value: analytics.pending,
      icon: 'time-outline',
      color: 'bg-amber-500'
    },
    {
      title: 'Avg Confidence',
      value: `${analytics.avgConfidence}%`,
      icon: 'trending-up-outline',
      color: 'bg-purple-500'
    },
    {
      title: 'High Confidence',
      value: analytics.highConfidence,
      change: `≥75% confidence`,
      changeType: 'positive',
      icon: 'shield-checkmark-outline',
      color: 'bg-emerald-500'
    }
  ];

  const StatCard: React.FC<{ stat: StatCard }> = ({ stat }) => (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-xs font-medium">{stat.title}</p>
          <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
          {stat.change && (
            <p className={`text-xs mt-1 ${
              stat.changeType === 'positive' ? 'text-green-400' : 
              stat.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
            }`}>
              {stat.change}
            </p>
          )}
        </div>
        <div className={`${stat.color} p-2 rounded-lg flex-shrink-0`}>
          <ion-icon name={stat.icon} className="text-white text-lg"></ion-icon>
        </div>
      </div>
    </div>
  );

  const ChartBar: React.FC<{ label: string; value: number; maxValue: number; color: string }> = ({ 
    label, value, maxValue, color 
  }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-20 text-sm text-slate-300 truncate">{label}</div>
        <div className="flex-1 bg-slate-700 rounded-full h-6 relative">
          <div 
            className={`${color} h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
            style={{ width: `${Math.max(percentage, 5)}%` }}
          >
            <span className="text-xs font-semibold text-white">{value}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center border-b border-slate-700 pb-4">
        <h1 className="text-lg font-bold text-white flex items-center justify-center gap-2">
          <ion-icon name="analytics-outline"></ion-icon>
          Analytics Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">Real-time hazard report analysis</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3">
        {statCards.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-4">
        {/* Verification Status Chart */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <ion-icon name="pie-chart-outline" className="mr-2"></ion-icon>
            Verification Status
          </h3>
          <div className="space-y-2">
            <ChartBar 
              label="Verified" 
              value={analytics.verified} 
              maxValue={analytics.total} 
              color="bg-green-500" 
            />
            <ChartBar 
              label="Rejected" 
              value={analytics.rejected} 
              maxValue={analytics.total} 
              color="bg-red-500" 
            />
            <ChartBar 
              label="Pending" 
              value={analytics.pending} 
              maxValue={analytics.total} 
              color="bg-amber-500" 
            />
          </div>
        </div>

        {/* Hazard Types Chart */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <ion-icon name="warning-outline" className="mr-2"></ion-icon>
            Top Hazards
          </h3>
          <div className="space-y-2">
            {Object.entries(analytics.hazardCounts)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 4)
              .map(([hazard, count]) => (
                <ChartBar 
                  key={hazard}
                  label={hazard} 
                  value={count as number} 
                  maxValue={Math.max(...Object.values(analytics.hazardCounts))} 
                  color={HAZARD_COLORS[hazard as HazardType] || 'bg-gray-500'} 
                />
              ))}
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <ion-icon name="speedometer-outline" className="mr-2"></ion-icon>
            Confidence Levels
          </h3>
          <div className="space-y-2">
            <ChartBar 
              label="High (≥75%)" 
              value={analytics.highConfidence} 
              maxValue={analytics.total} 
              color="bg-green-500" 
            />
            <ChartBar 
              label="Medium (40-74%)" 
              value={analytics.mediumConfidence} 
              maxValue={analytics.total} 
              color="bg-amber-500" 
            />
            <ChartBar 
              label="Low (<40%)" 
              value={analytics.lowConfidence} 
              maxValue={analytics.total} 
              color="bg-red-500" 
            />
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
          <ion-icon name="bulb-outline" className="mr-2"></ion-icon>
          Key Insights
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-2">
            <div className="bg-green-500/20 p-1 rounded">
              <ion-icon name="checkmark-circle" className="text-green-400 text-sm"></ion-icon>
            </div>
            <div>
              <p className="text-white font-medium">Verification Rate</p>
              <p className="text-slate-400">
                {analytics.verificationRate}% verified by officials
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="bg-amber-500/20 p-1 rounded">
              <ion-icon name="speedometer" className="text-amber-400 text-sm"></ion-icon>
            </div>
            <div>
              <p className="text-white font-medium">Avg Confidence</p>
              <p className="text-slate-400">
                {analytics.avgConfidence}% average score
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="bg-blue-500/20 p-1 rounded">
              <ion-icon name="location" className="text-blue-400 text-sm"></ion-icon>
            </div>
            <div>
              <p className="text-white font-medium">Coverage</p>
              <p className="text-slate-400">
                {Object.keys(analytics.locationCounts).length} regions covered
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
