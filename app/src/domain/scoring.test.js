import { describe, expect, it } from 'vitest'
import {
  calculateRiskScore,
  getDistanceKm,
  getRiskLevel,
  RISK_LEVELS,
} from './scoring.js'

describe('risk scoring', () => {
  it('maps score boundaries to risk levels', () => {
    expect(getRiskLevel(39)).toBe(RISK_LEVELS.normal)
    expect(getRiskLevel(40)).toBe(RISK_LEVELS.waspada)
    expect(getRiskLevel(60)).toBe(RISK_LEVELS.tinggi)
    expect(getRiskLevel(80)).toBe(RISK_LEVELS.kritis)
  })

  it('returns infinity when coordinates are invalid', () => {
    expect(getDistanceKm({ lat: Number.NaN, lng: 105 }, { lat: 0, lng: 0 })).toBe(Number.POSITIVE_INFINITY)
  })

  it('raises risk from nearby reports, public facilities, and age', () => {
    const report = {
      id: 'current',
      severity: 'kritis',
      category: 'sumbatan',
      lat: -5.3971,
      lng: 105.2668,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    const nearbyReport = {
      id: 'nearby',
      lat: -5.3972,
      lng: 105.2669,
      createdAt: '2026-01-01T00:10:00.000Z',
    }

    const risk = calculateRiskScore(report, {
      reports: [nearbyReport],
      facilities: [{ name: 'Rumah Sakit', lat: -5.3972, lng: 105.2669 }],
      now: '2026-01-03T00:00:00.000Z',
    })

    expect(risk.score).toBe(83)
    expect(risk.level).toBe(RISK_LEVELS.kritis)
    expect(risk.breakdown.map((item) => item.id)).toEqual(['severity', 'category', 'nearby', 'facility', 'age'])
    expect(risk.breakdown.find((item) => item.id === 'nearby')).toMatchObject({
      rawScore: 25,
      points: 5,
    })
  })
})
