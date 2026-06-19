import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useConversion } from '@/hooks/useAnalytics'
import { FunnelType } from '@/api/analyticsApi'

const FUNNEL_TABS: { type: FunnelType; label: string }[] = [
  { type: 'VIEW_TO_MESSAGE', label: 'View → Message' },
  { type: 'PROPOSAL_TO_CONTRACT', label: 'Proposal → Contract' },
  { type: 'VIEW_TO_PURCHASE', label: 'View → Purchase' },
  { type: 'CHAT_TO_DEAL', label: 'Chat → Deal' },
]

export default function ConversionFunnel() {
  const [activeFunnel, setActiveFunnel] = useState<FunnelType>('PROPOSAL_TO_CONTRACT')
  const { data: conversion, isLoading } = useConversion(activeFunnel)

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Conversion Rates</h2>
      <p className="mt-1 text-xs font-medium text-slate-500">
        Rates will populate once event emitters are instrumented (M12.1).
      </p>

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {FUNNEL_TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => setActiveFunnel(tab.type)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeFunnel === tab.type
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-slate-100" />
      ) : conversion ? (
        <div className="mt-5">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-950">
              {(conversion.rate * 100).toFixed(1)}%
            </span>
            <span className="text-sm font-medium text-slate-500">
              {conversion.numerator} / {conversion.denominator}
            </span>
          </div>

          {conversion.trend.length > 0 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart
                  data={conversion.trend.map((p) => ({ date: formatDate(p.date), value: p.value }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11 }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Rate']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 text-center text-sm font-medium text-slate-400">
          No conversion data available yet.
        </div>
      )}
    </section>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
