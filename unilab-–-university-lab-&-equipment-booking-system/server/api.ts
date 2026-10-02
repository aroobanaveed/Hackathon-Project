/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { SEED_LABS, SEED_EQUIPMENT } from '../src/lib/seed-data';

dotenv.config();

export const apiRouter: Router = express.Router();
apiRouter.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!aiClient,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Deterministic Smart Recommendation Engine
interface RecommendPayload {
  resourceType: 'LAB' | 'EQUIPMENT';
  resourceName?: string;
  departmentId?: string;
  preferredDate: string;
  startTime: string;
  endTime: string;
  quantity?: number;
  purpose: string;
  capacityNeeded?: number;
}

function computeDeterministicMatch(
  item: any,
  payload: RecommendPayload,
  isEquipment: boolean
) {
  let score = 70;
  const rationaleParts: string[] = [];

  if (isEquipment) {
    const eq = item;
    if (payload.resourceName && eq.name.toLowerCase().includes(payload.resourceName.toLowerCase())) {
      score += 25;
      rationaleParts.push(`Direct model match for ${eq.name}`);
    } else if (eq.category.toLowerCase().includes((payload.purpose || '').toLowerCase())) {
      score += 15;
      rationaleParts.push(`Category fits experimental scope`);
    }

    const qty = payload.quantity || 1;
    if (eq.availableQuantity >= qty) {
      score += 10;
      rationaleParts.push(`${eq.availableQuantity} units currently ready for checkout`);
    } else {
      score -= 30;
      rationaleParts.push(`Constrained inventory (${eq.availableQuantity} available of ${qty} requested)`);
    }
  } else {
    const lab = item;
    if (payload.departmentId && lab.departmentId === payload.departmentId) {
      score += 15;
      rationaleParts.push(`Located inside home department (${lab.departmentName})`);
    }

    if (payload.capacityNeeded && lab.capacity >= payload.capacityNeeded) {
      score += 15;
      rationaleParts.push(`Capacity of ${lab.capacity} seats accommodates your session requirement`);
    }

    if (lab.status === 'AVAILABLE') {
      score += 10;
      rationaleParts.push(`Lab operational with no active maintenance`);
    } else {
      score -= 40;
      rationaleParts.push(`Status is currently ${lab.status}`);
    }

    // Match keywords from purpose against lab facilities
    const purposeLower = (payload.purpose || '').toLowerCase();
    const matchedFac = lab.facilities.filter((f: string) => purposeLower.includes(f.toLowerCase().slice(0, 5)));
    if (matchedFac.length > 0) {
      score += 15;
      rationaleParts.push(`Equipped with required tools: ${matchedFac.slice(0, 2).join(', ')}`);
    }
  }

  score = Math.min(98, Math.max(20, score));

  return {
    resourceId: item.id,
    resourceName: item.name,
    resourceType: isEquipment ? 'EQUIPMENT' : 'LAB',
    matchScore: score,
    status: (item.status === 'CLOSED' || item.status === 'MAINTENANCE') ? 'CONFLICT' : 'AVAILABLE',
    rationale: rationaleParts.join('. ') + '.',
    location: item.location || item.labName,
    availableQuantity: isEquipment ? item.availableQuantity : undefined,
    suggestedSlot: `${payload.startTime} - ${payload.endTime}`
  };
}

// POST /api/recommend
apiRouter.post('/recommend', async (req: Request, res: Response) => {
  try {
    const payload: RecommendPayload = req.body;
    const isEquipment = payload.resourceType === 'EQUIPMENT';
    const pool = isEquipment ? SEED_EQUIPMENT : SEED_LABS;

    // 1. Compute baseline deterministic candidates
    const baselineResults = pool.map(item => computeDeterministicMatch(item, payload, isEquipment))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);

    // 2. If Gemini is available, refine rationale and comparative insights
    if (aiClient) {
      try {
        const prompt = `You are the AI Laboratory Coordinator for a prestigious university.
Analyze the following user booking request:
- Resource Type: ${payload.resourceType}
- Target Item / Interest: ${payload.resourceName || 'Unspecified'}
- Requested Date: ${payload.preferredDate}
- Time Slot: ${payload.startTime} - ${payload.endTime}
- Quantity: ${payload.quantity || 1}
- Purpose: "${payload.purpose}"

Candidate university resources with baseline availability:
${JSON.stringify(baselineResults, null, 2)}

Provide concise, academic-grade rationales for the top 3 recommendations.
Explain why each lab or equipment fits their academic purpose and whether alternate time slots or labs would be ideal.
Return ONLY a valid JSON array of objects conforming to:
[
  {
    "resourceId": "string",
    "resourceName": "string",
    "matchScore": number,
    "rationale": "Clear, concise 1-2 sentence university recommendation explaining match",
    "suggestedSlot": "e.g. 14:00 - 16:00 or alternate if conflict"
  }
]
No markdown wrapping, just the JSON string.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        });

        const text = response.text || '';
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const geminiRanks = JSON.parse(cleaned);

        if (Array.isArray(geminiRanks) && geminiRanks.length > 0) {
          const merged = baselineResults.map(base => {
            const aiMatch = geminiRanks.find((g: any) => g.resourceId === base.resourceId || g.resourceName === base.resourceName);
            if (aiMatch) {
              return {
                ...base,
                matchScore: typeof aiMatch.matchScore === 'number' ? aiMatch.matchScore : base.matchScore,
                rationale: aiMatch.rationale || base.rationale,
                suggestedSlot: aiMatch.suggestedSlot || base.suggestedSlot
              };
            }
            return base;
          });

          return res.json({
            source: 'gemini-ai',
            recommendations: merged.sort((a, b) => b.matchScore - a.matchScore)
          });
        }
      } catch (geminiError) {
        console.warn('Gemini recommendation call fallback:', geminiError);
        // Fallback to deterministic
      }
    }

    return res.json({
      source: 'deterministic-engine',
      recommendations: baselineResults
    });
  } catch (error: any) {
    console.error('Error in /api/recommend:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations.' });
  }
});
