import React from 'react';
import { EXAM_FEE_LABEL, EXAM_FEE_UZS, SHOW_EXAM_FEE_ON_CARDS } from '../config/site';

const MobileTestDateCard = ({ date, index, isVisible, onDateSelect }) => {
  const action = (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${date.isFull ? 'bg-gray-700 text-gray-400' : 'bg-[#024890] text-white group-hover:bg-[#023e7d]'}`} aria-hidden="true">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </span>
  );

  return (
    <button
      type="button"
      disabled={date.isFull}
      onClick={() => onDateSelect(date)}
      aria-label={`${date.day} ${date.month}, ${date.time || '09:00'}${date.location ? `, ${date.location}` : ''}. ${date.isFull ? 'Fully booked' : `${date.available} places left`}${SHOW_EXAM_FEE_ON_CARDS ? `. Exam fee: ${EXAM_FEE_LABEL}` : ''}`}
      className={`group w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1f2937]/90 text-left backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5b706] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 enabled:active:scale-[0.99] disabled:cursor-not-allowed ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${0.1 + (index * 0.1)}s` }}
    >
      <div className={`grid items-center p-4 ${SHOW_EXAM_FEE_ON_CARDS ? 'grid-cols-2 gap-3' : 'grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_auto] gap-2'}`}>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold leading-none tracking-tight text-white">{date.day}</span>
            <span className="mt-1 text-xs font-bold uppercase text-[#f5b706]">{date.month.substring(0, 3)}</span>
          </div>
          {date.location && (
            <div className="flex items-start gap-1.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#f5b706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="min-w-0 break-words text-sm font-semibold capitalize text-white">{date.location}</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-end gap-2">
          <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold ${date.time && date.time.length > 10 ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300' : 'border-blue-500/20 bg-blue-500/10 text-blue-300'}`}>
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="min-w-0 break-words">{date.time || '09:00'}</span>
          </span>
          <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${date.isFull ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-green-500/20 bg-green-500/10 text-green-400'}`}>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${date.isFull ? 'bg-red-500' : 'bg-green-500'}`} aria-hidden="true" />
            <span>{date.isFull ? 'Full' : `${date.available} Places Left`}</span>
          </span>
        </div>
        {!SHOW_EXAM_FEE_ON_CARDS && action}
      </div>

      {SHOW_EXAM_FEE_ON_CARDS && (
        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.025] px-4 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Exam fee</span>
            <span className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-xl font-bold leading-tight tracking-tight text-[#f5b706] tabular-nums">{EXAM_FEE_UZS.toLocaleString('en-US')}</span>
              <span className="text-xs font-semibold text-gray-400">UZS</span>
            </span>
          </div>
          {action}
        </div>
      )}
    </button>
  );
};

export default MobileTestDateCard;
