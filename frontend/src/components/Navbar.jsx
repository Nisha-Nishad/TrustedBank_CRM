import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  X,
  Users,
  User,
  MessageSquare,
  ArrowRight,
  Building,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ user, onNavigate }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ customers: [], leads: [], deals: [] });
  const searchContainerRef = useRef(null);

  const roleName = user?.role === 'ADMIN' ? 'Admin' : user?.role === 'SALES_REP' ? 'Sales RM' : 'Manager';
  const displayName = user?.name || 'Rahul Sharma';
  const roleSubtitle = user?.role === 'ADMIN' ? 'System Administrator' : user?.role === 'SALES_REP' ? 'Relationship Manager' : 'Branch Manager';

  // Debounced search effect
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ customers: [], leads: [], deals: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api.search(query.trim());
        setResults({
          customers: data.customers || [],
          leads: data.leads || [],
          deals: data.deals || [],
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = results.customers.length + results.leads.length + results.deals.length;

  const handleSelectCustomer = (customerId) => {
    setIsOpen(false);
    setQuery('');
    onNavigate?.('customer-detail', customerId);
  };

  const handleSelectLead = () => {
    setIsOpen(false);
    setQuery('');
    onNavigate?.('leads');
  };

  const handleSelectDeal = () => {
    setIsOpen(false);
    setQuery('');
    onNavigate?.('deals');
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between shrink-0 relative z-30">
      {/* Global Omnisearch Container */}
      <div ref={searchContainerRef} className="relative w-[380px]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search leads, customers, deals, phone..."
            className="w-full bg-white border border-[#E2E8F0] text-xs rounded-lg pl-9 pr-8 py-2 text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0F357E] shadow-sm"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setResults({ customers: [], leads: [], deals: [] });
              }}
              className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-11 bg-white border border-[#CBD5E1] rounded-xl shadow-xl overflow-hidden text-xs z-50 max-h-[460px] overflow-y-auto custom-scrollbar">
            {/* Quick Search Guide when no query or query < 2 */}
            {query.length < 2 && (
              <div className="p-4 bg-[#F8FAFC]">
                <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2">
                  🔍 What you can search:
                </div>
                <div className="space-y-1.5 text-xs text-[#334155]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0F357E]">Customer Name:</span>
                    <span>Rohit Mehta, Priya Patel, Sneha Joshi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0F357E]">Phone Number:</span>
                    <span className="font-mono text-[11px]">98201, 98202, 98203</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0F357E]">Loan Product:</span>
                    <span>Home Loan, Business Loan, Car Loan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0F357E]">City / Stage:</span>
                    <span>Mumbai, Ahmedabad, Approved, Won</span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="p-4 flex items-center justify-center gap-2 text-xs text-[#0F357E]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching banking records across database...</span>
              </div>
            )}

            {/* Results Display */}
            {!loading && query.length >= 2 && (
              <div>
                {totalResults === 0 ? (
                  <div className="p-6 text-center text-[#64748B]">
                    <div className="font-semibold text-[#0F172A]">No banking records found</div>
                    <div className="text-[11px] mt-1">
                      No customer, lead, or deal matched "{query}"
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {/* Matching Customers */}
                    {results.customers.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-[#0F357E]" />
                          <span>Customers ({results.customers.length})</span>
                        </div>
                        {results.customers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectCustomer(c.id)}
                            className="w-full px-2.5 py-2 hover:bg-[#EFF6FF] rounded-lg text-left flex items-center justify-between transition group"
                          >
                            <div>
                              <div className="font-semibold text-[#0F172A] group-hover:text-[#0F357E]">
                                {c.name}
                              </div>
                              <div className="text-[11px] text-[#64748B]">
                                {c.phone} &bull; {c.city || 'India'} &bull; <span className="font-medium text-[#0F357E]">{c.type}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-[#0F357E] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <span>Customer 360</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Matching Leads */}
                    {results.leads.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3 h-3 text-[#2563EB]" />
                          <span>Leads / Inquiries ({results.leads.length})</span>
                        </div>
                        {results.leads.map((l) => (
                          <button
                            key={l.id}
                            onClick={handleSelectLead}
                            className="w-full px-2.5 py-2 hover:bg-[#EFF6FF] rounded-lg text-left flex items-center justify-between transition group"
                          >
                            <div>
                              <div className="font-semibold text-[#0F172A] group-hover:text-[#0F357E]">
                                {l.name}
                              </div>
                              <div className="text-[11px] text-[#64748B]">
                                Interest: <span className="font-semibold text-[#0F172A]">{l.productInterest}</span> &bull; {l.phone}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] text-[#475569]">
                              {l.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Matching Deals */}
                    {results.deals.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3 text-[#16A34A]" />
                          <span>Deals & Loan Pipeline ({results.deals.length})</span>
                        </div>
                        {results.deals.map((d) => (
                          <button
                            key={d.id}
                            onClick={handleSelectDeal}
                            className="w-full px-2.5 py-2 hover:bg-[#EFF6FF] rounded-lg text-left flex items-center justify-between transition group"
                          >
                            <div>
                              <div className="font-semibold text-[#0F172A] group-hover:text-[#0F357E]">
                                {d.title}
                              </div>
                              <div className="text-[11px] text-[#64748B]">
                                Customer: {d.customer?.name} &bull; <strong className="text-[#16A34A]">₹{(d.amount / 100000).toFixed(1)} Lakh</strong>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                              {d.stage}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-5">
        {/* Notification Bell */}
        <button
          onClick={() => alert('No new regulatory notifications. All 20 customer accounts in good standing.')}
          className="relative p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg transition"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[#334155]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0F357E] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-[#E2E8F0]">
            {user?.name ? (
              user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            ) : (
              'NN'
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A] leading-tight">
              {displayName} &bull; {roleSubtitle}
            </div>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#0F357E] border border-[#BFDBFE]">
              {roleName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
