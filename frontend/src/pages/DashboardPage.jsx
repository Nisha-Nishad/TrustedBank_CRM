import React, { useState } from 'react';
import { TrendingUp, Plus } from 'lucide-react';

export default function DashboardPage({ setActivePage, onNotify }) {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Call Mr. Verma - Home Loan Doc collection',
      priority: 'High',
      completed: false,
    },
    {
      id: 2,
      title: 'KYC Verification - Priya Patel',
      priority: 'Medium',
      completed: false,
    },
    {
      id: 3,
      title: 'Follow up - Car Loan Inquiry (A. Kapoor)',
      priority: 'Medium',
      completed: false,
    },
    {
      id: 4,
      title: 'Review Credit Score - S. Nair',
      priority: 'Low',
      completed: false,
    },
  ]);

  const toggleTask = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const priorityStyles = {
    High: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]',
    Medium: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
    Low: 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]',
  };

  // Pipeline stages matching exact values from screenshot:
  const pipelineStages = [
    { name: 'New', count: '1,248', heightPercent: 100 },
    { name: 'Contacted', count: '856', heightPercent: 68 },
    { name: 'Documents', count: '542', heightPercent: 44 },
    { name: 'Verification', count: '439', heightPercent: 35 },
    { name: 'Approved', count: '368', heightPercent: 29 },
    { name: 'Won', count: '100', heightPercent: 12 },
    { name: 'Lost', count: '36', heightPercent: 6 },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 bg-[#F8FAFC]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
            Branch Performance Dashboard
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Welcome back, Rahul. Here is today's overview.
          </p>
        </div>

        <button
          onClick={() => setActivePage('leads')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0F357E] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg shadow-sm transition w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Lead</span>
        </button>
      </div>

      {/* Row of 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-medium text-[#64748B]">Total Leads</div>
          <div className="text-3xl font-bold text-[#0F172A] my-1">1,248</div>
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#16A34A]">
              +12% this month
            </span>
          </div>
        </div>

        {/* Card 2: Active Customers */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-medium text-[#64748B]">Active Customers</div>
          <div className="text-3xl font-bold text-[#0F172A] my-1">856</div>
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#16A34A]">
              +5% MoM
            </span>
          </div>
        </div>

        {/* Card 3: Won Deals */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-medium text-[#64748B]">Won Deals</div>
          <div className="text-3xl font-bold text-[#0F172A] my-1">₹4.82 Cr</div>
          <div className="text-xs text-[#64748B]">Target: ₹5 Cr</div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-medium text-[#64748B]">Conversion Rate</div>
          <div className="flex items-center justify-between my-1">
            <span className="text-3xl font-bold text-[#0F172A]">24.6%</span>
            <span className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#0F357E] flex items-center justify-center shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xs text-[#64748B] opacity-0">Spacer</div>
        </div>
      </div>

      {/* Middle Grid: Leads by Pipeline Stage Bar Chart & Today Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Leads by Pipeline Stage */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <h2 className="text-sm font-bold text-[#0F172A] mb-4">
            Leads by Pipeline Stage
          </h2>

          <div className="relative pt-6 pb-2 overflow-x-auto custom-scrollbar">
            <div className="min-w-[320px] relative">
              {/* Horizontal Gridlines */}
              <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-[#E2E8F0]"></div>
                <div className="border-b border-[#E2E8F0]"></div>
                <div className="border-b border-[#E2E8F0]"></div>
                <div className="border-b border-[#E2E8F0]"></div>
              </div>

              {/* Vertical Bars Columns */}
              <div className="relative z-10 flex items-end justify-between gap-1.5 sm:gap-3 h-48 px-1 sm:px-2">
                {pipelineStages.map((stage) => (
                  <div key={stage.name} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#0F172A] mb-1.5">
                      {stage.count}
                    </span>

                    <div className="w-full max-w-[42px] bg-[#E2E8F0] rounded-t flex items-end overflow-hidden" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-[#0F357E] rounded-t transition-all duration-500 group-hover:bg-[#1E3A8A]"
                        style={{ height: `${stage.heightPercent}%` }}
                      ></div>
                    </div>

                    <span className="text-[10px] sm:text-[11px] text-[#475569] font-medium mt-2 text-center truncate max-w-[64px]" title={stage.name}>
                      {stage.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Today Tasks */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] mb-4">Today Tasks</h2>

            <div className="space-y-3.5">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="w-4 h-4 rounded border-[#CBD5E1] text-[#0F357E] focus:ring-[#0F357E] cursor-pointer"
                    />
                    <span
                      className={`truncate ${
                        task.completed
                          ? 'text-[#94A3B8] line-through'
                          : 'text-[#0F172A] font-medium'
                      }`}
                    >
                      {task.title}
                    </span>
                  </label>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      priorityStyles[task.priority]
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Recent Activity Timeline */}
      <div id="recent-activity-section" className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
        <h2 className="text-sm font-bold text-[#0F172A] mb-4">
          Recent Activity Timeline
        </h2>

        <div className="relative pl-2 space-y-4 text-xs">
          <div className="absolute left-[84px] top-2 bottom-2 w-px bg-[#CBD5E1]"></div>

          <div className="relative flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-[#64748B] w-16 text-[11px] font-mono">10:42 AM</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F357E] ring-4 ring-white shrink-0 z-10"></span>
              <span className="text-[#0F172A]">
                Deal approved for <strong>Rohit Mehta</strong> (₹45 Lakh Home Loan)
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] font-medium">
              Approved by Credit Desk
            </span>
          </div>

          <div className="relative flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-[#64748B] w-16 text-[11px] font-mono">09:55 AM</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F357E] ring-4 ring-white shrink-0 z-10"></span>
              <span className="text-[#0F172A]">
                New lead assigned: <strong>Sneha Joshi</strong> (₹18 Lakh Business Loan)
              </span>
            </div>
          </div>

          <div className="relative flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-[#64748B] w-16 text-[11px] font-mono">09:15 AM</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F357E] ring-4 ring-white shrink-0 z-10"></span>
              <span className="text-[#0F172A]">
                KYC documents verified for <strong>Priya Patel</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
