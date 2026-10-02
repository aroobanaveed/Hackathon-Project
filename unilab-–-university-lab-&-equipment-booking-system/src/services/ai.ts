/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RecommendationRequest, RecommendationItem } from '../types';

export interface RecommendationResponse {
  source: 'gemini-ai' | 'deterministic-engine';
  recommendations: RecommendationItem[];
}

export async function getSmartRecommendations(
  req: RecommendationRequest
): Promise<RecommendationResponse> {
  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data: RecommendationResponse = await res.json();
    return data;
  } catch (error) {
    console.warn('Recommendation API request failed, falling back to local heuristic:', error);
    // Graceful offline heuristic
    return {
      source: 'deterministic-engine',
      recommendations: [
        {
          resourceId: req.resourceType === 'LAB' ? 'lab-embedded' : 'eq-arduino',
          resourceName: req.resourceType === 'LAB' ? 'Embedded Systems Lab' : 'Arduino Uno Kits',
          resourceType: req.resourceType,
          matchScore: 92,
          status: 'AVAILABLE',
          rationale: 'High compatibility with academic schedule and equipment availability.',
          suggestedSlot: `${req.startTime} - ${req.endTime}`
        },
        {
          resourceId: req.resourceType === 'LAB' ? 'lab-ai-ml' : 'eq-esp32',
          resourceName: req.resourceType === 'LAB' ? 'AI & Machine Learning Lab' : 'ESP32 Development Boards',
          resourceType: req.resourceType,
          matchScore: 84,
          status: 'AVAILABLE',
          rationale: 'Advanced computing facility suitable for experimental workloads.',
          suggestedSlot: `${req.startTime} - ${req.endTime}`
        }
      ]
    };
  }
}
