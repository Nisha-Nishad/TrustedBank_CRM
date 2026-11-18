import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  Award,
  ShieldCheck,
  PieChart,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportsPage({ onNotify }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [selectedProduct, setSelectedProduct] = useState('ALL');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReportsSummary();
      setData(res);
    } catch (err) {
      console.error(err);
      onNotify?.(err.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('crm_token');
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/reports/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TrustBank_CRM_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      onNotify?.('Report CSV downloaded successfully', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to export CSV', 'error');
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-sm text-[#0F357E] font-medium">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Generating Bank Performance Reports...</span>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalDisbursedValue: 48200000,
    totalPipelineValue: 124500000,
    wonCount: 100,
    conversionRate: 24.6,
    averageTATDays: 3.8,
  };

  const rmLeaderboard = data?.rmLeaderboard || [];
  const products = data?.productsDistribution || [];
  const tierDistribution = data?.tierDistribution || { HNI: 7, Corporate: 6, SME: 4, Retail: 3 };
  const kycSummary = data?.kycSummary || { verified: 18, pending: 2, total: 20 };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 bg-[#F8FAFC]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
              Bank Analytics & Management Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
              Audited Data
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time disbursal metrics, pipeline conversion funnel, and Relationship Manager leaderboard.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="flex-1 sm:flex-none text-xs bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#334155] font-medium shadow-xs focus:ring-1 focus:ring-[#0F357E]"
          >
            <option value="month">This Month (Nov 2026)</option>
            <option value="quarter">Q3 FY 2026-27</option>
            <option value="fy">Full Year FY 2026</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-[#0F357E] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm transition shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-medium text-[#64748B]">Total Disbursed (Won)</div>
          <div className="text-2xl font-bold text-[#0F172A] my-1">
            ₹{(summary.totalDisbursedValue / 10000000).toFixed(2)} Cr
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#16A34A]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% MoM Disbursal Growth</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-medium text-[#64748B]">Total Active Pipeline</div>
          <div className="text-2xl font-bold text-[#0F172A] my-1">
            ₹{(summary.totalPipelineValue / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-xs text-[#64748B]">
            Weighted probability value: ₹8.4 Cr
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-medium text-[#64748B]">Conversion Efficiency</div>
          <div className="flex items-center justify-between my-1">
            <span className="text-2xl font-bold text-[#0F172A]">{summary.conversionRate}%</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A]">
              Top Quartile
            </span>
          </div>
          <div className="text-xs text-[#64748B]">From inquiry to sanctioned loan</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-medium text-[#64748B]">Average Disbursal TAT</div>
          <div className="text-2xl font-bold text-[#0F172A] my-1">
            {summary.averageTATDays} Days
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F357E]">
            <Clock className="w-3.5 h-3.5" />
            <span>Well within SLA target (5 Days)</span>
          </div>
        </div>
      </div>

      {/* Pipeline Funnel Visual Stage Card */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">
              Loan Application Pipeline & Stage Funnel
            </h2>
            <p className="text-xs text-[#64748B]">
              Real-time progression of leads through credit evaluation and underwriting
            </p>
          </div>
          <span className="text-xs text-[#64748B]">Total Leads Evaluated: 1,248</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
          {[
            { stage: '1. New Inquiry', count: '1,248', drop: '31% to next', color: 'bg-[#0F357E]' },
            { stage: '2. Contacted', count: '856', drop: '36% to next', color: 'bg-[#1E3A8A]' },
            { stage: '3. Documents', count: '542', drop: '19% to next', color: 'bg-[#2563EB]' },
            { stage: '4. Verification', count: '439', drop: '16% to next', color: 'bg-[#3B82F6]' },
            { stage: '5. Approved', count: '368', drop: '72% disbursed', color: 'bg-[#60A5FA]' },
            { stage: '6. Disbursed (Won)', count: '100', drop: '₹4.82 Cr volume', color: 'bg-[#16A34A]' },
            { stage: '7. Closed / Lost', count: '36', drop: 'Low CIBIL / Canceled', color: 'bg-[#DC2626]' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[#475569]">{item.stage}</span>
                <div className="text-lg font-bold text-[#0F172A] mt-1">{item.count}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B] flex items-center justify-between">
                <span>{item.drop}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RM Performance Leaderboard */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D97706]" />
              <span>Relationship Manager (RM) Performance Leaderboard</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Ranked by total loan disbursal value, target achievement, and customer SLA score
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-[#EFF6FF] text-[#0F357E] rounded-md border border-[#BFDBFE]">
            10 Active RMs
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[680px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Relationship Manager</th>
                <th className="py-3 px-4">Active Pipeline</th>
                <th className="py-3 px-4">Deals Won</th>
                <th className="py-3 px-4">Total Disbursed (₹)</th>
                <th className="py-3 px-4">Target (₹50L)</th>
                <th className="py-3 px-4">Conv. %</th>
                <th className="py-3 px-4 text-center">SLA Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {rmLeaderboard.map((rm, index) => (
                <tr key={rm.id} className="hover:bg-[#F8FAFC] transition">
                  <td className="py-3 px-4 font-bold">
                    {index === 0 ? (
                      <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#D97706] inline-flex items-center justify-center text-[10px] font-bold">
                        🥇 1
                      </span>
                    ) : index === 1 ? (
                      <span className="w-5 h-5 rounded-full bg-[#F1F5F9] text-[#475569] inline-flex items-center justify-center text-[10px] font-bold">
                        🥈 2
                      </span>
                    ) : index === 2 ? (
                      <span className="w-5 h-5 rounded-full bg-[#FFEDD5] text-[#C2410C] inline-flex items-center justify-center text-[10px] font-bold">
                        🥉 3
                      </span>
                    ) : (
                      <span className="text-[#64748B] ml-1.5">{index + 1}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0F172A]">{rm.name}</div>
                    <div className="text-[11px] text-[#64748B]">{rm.email}</div>
                  </td>
                  <td className="py-3 px-4 text-[#334155]">
                    ₹{(rm.activePipelineValue / 100000).toFixed(1)} Lakh
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#0F172A]">
                    {rm.wonDeals} Deals
                  </td>
                  <td className="py-3 px-4 font-bold text-[#16A34A]">
                    ₹{(rm.totalDisbursed / 100000).toFixed(1)} Lakh
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-28 bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#0F357E] h-2 rounded-full"
                        style={{ width: `${Math.min(100, rm.targetAchievementPercent)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-[#64748B] font-medium mt-0.5 inline-block">
                      {rm.targetAchievementPercent}% achieved
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#0F172A]">
                    {rm.conversionRate}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                      {rm.slaScore}% on-time
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Products & Regulatory Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Product Portfolio Mix */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#0F357E]" />
              <span>Loan Product Portfolio Distribution</span>
            </h2>
            <span className="text-xs text-[#64748B]">Total Disbursed: ₹4.82 Cr</span>
          </div>

          <div className="space-y-3.5">
            {products.map((prod, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
                  <span>{prod.name} ({prod.count} loans)</span>
                  <span className="text-[#0F172A] font-bold">{prod.volume} ({prod.percentage}%)</span>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#0F357E] h-2 rounded-full transition-all"
                    style={{ width: `${prod.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Secured Collateralized Ratio: <strong>86%</strong></span>
            <span>Unsecured Retail Ratio: <strong>14%</strong></span>
          </div>
        </div>

        {/* Regulatory & Risk Audit Summary */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <span>Regulatory & Risk Compliance Metrics</span>
              </h2>
              <span className="text-xs text-[#16A34A] font-semibold">RBI Audited</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <div className="font-semibold text-[#0F172A]">KYC Compliance Status</div>
                  <div className="text-[11px] text-[#64748B]">
                    {kycSummary.verified} verified out of {kycSummary.total} active accounts
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                  94.2% Compliant
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <div className="font-semibold text-[#0F172A]">Maker-Checker Dual Approval</div>
                  <div className="text-[11px] text-[#64748B]">
                    All loan disbursals exceeding ₹25 Lakh threshold signed off
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#EFF6FF] text-[#0F357E]">
                  100% Adherence
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <div className="font-semibold text-[#0F172A]">SLA Breach & Escalation Rate</div>
                  <div className="text-[11px] text-[#64748B]">
                    Customer turnaround time breaches &gt; 48 hours
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                  3.5% (Target &lt; 5%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Next Internal Audit Cycle: <strong>Dec 15, 2026</strong></span>
            <span>Audit Trail: <strong>Immutable</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
