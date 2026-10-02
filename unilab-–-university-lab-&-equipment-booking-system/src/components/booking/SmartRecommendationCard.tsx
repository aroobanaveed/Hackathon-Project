/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RecommendationItem } from '../../types';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface SmartRecommendationCardProps {
  recommendation: RecommendationItem;
  source: 'gemini-ai' | 'deterministic-engine';
  onSelect: (item: RecommendationItem) => void;
  isCurrentResource?: boolean;
}

export const SmartRecommendationCard: React.FC<SmartRecommendationCardProps> = ({
  recommendation,
  source,
  onSelect,
  isCurrentResource = false
}) => {
  const isHighMatch = recommendation.matchScore >= 85;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isCurrentResource
          ? 'bg-indigo-50/70 border-indigo-200'
          : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="text-sm font-bold text-slate-900">{recommendation.resourceName}</h5>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isHighMatch
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {recommendation.matchScore}% Match
            </span>
            {source === 'gemini-ai' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                <Sparkles className="w-3 h-3 text-purple-600" />
                Gemini AI Recommended
              </span>
            )}
          </div>
          {recommendation.location && (
            <p className="text-xs text-slate-500 mt-0.5">{recommendation.location}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(recommendation)}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-xl transition-all"
        >
          Select Alternative
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="font-semibold text-slate-700">Why recommended: </span>
        {recommendation.rationale}
      </p>

      {recommendation.suggestedSlot && (
        <div className="mt-2.5 flex items-center gap-2 text-xs text-indigo-900 font-medium">
          <span className="text-slate-400">Suggested Optimal Window:</span>
          <span className="font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
            {recommendation.suggestedSlot}
          </span>
        </div>
      )}
    </div>
  );
};
