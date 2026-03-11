import { DNA_AXES, CATEGORY_MAPPING, DNA_TYPES } from '../utils/dnaConfig';

export interface DNAResult {
  dnaType: string;
  dnaName: string;
  description: string;
  scores: Record<string, number>;
  ratios: Record<string, number>;
  topAxes: string[];
  recommendedGenres: string[];
}

export const useDNA = () => {
  const analyzeDNA = (reviews: any[]): DNAResult | null => {
    if (!reviews || reviews.length === 0) return null;

    const scores: Record<string, number> = { I: 0, K: 0, G: 0, E: 0 };
    let totalValid = 0;

    reviews.forEach(item => {
      // Cycle Review uses 'category' for genre.
      // Board Post uses 'bookGenre' for genre.
      const genre = item.bookGenre || item.category;
      const axis = CATEGORY_MAPPING[genre];
      if (axis && scores[axis] !== undefined) {
        scores[axis]++;
        totalValid++;
      }
    });

    if (totalValid === 0) return null;

    const ratios: Record<string, number> = {};
    Object.keys(scores).forEach(key => {
      const score = scores[key] ?? 0;
      ratios[key] = Number((score / totalValid).toFixed(2));
    });

    // ── 타입 판별 로직 ──
    const sortedAxes = Object.entries(ratios)
      .sort((a, b) => {
        const valA = a[1] ?? 0;
        const valB = b[1] ?? 0;
        // 1. 비율 내림차순
        if (valB !== valA) return valB - valA;
        // 2. 우선순위 (K > I > E > G)
        const priority: Record<string, number> = { K: 4, I: 3, E: 2, G: 1 };
        return (priority[b[0]] ?? 0) - (priority[a[0]] ?? 0);
      });

    const first = sortedAxes[0];
    const second = sortedAxes[1];
    
    if (!first) return null;

    // 1. 균형 독서가 (Balanced): 모든 축의 편차가 10% 이내 (0.1)
    const minRatio = Math.min(...Object.values(ratios));
    const maxRatio = Math.max(...Object.values(ratios));
    if (maxRatio - minRatio <= 0.1 && totalValid >= 4) {
      return {
        dnaType: 'BALANCED',
        dnaName: DNA_TYPES.BALANCED.name,
        description: DNA_TYPES.BALANCED.description,
        scores,
        ratios,
        topAxes: sortedAxes.map(a => a[0]),
        recommendedGenres: DNA_TYPES.BALANCED.recommended
      };
    }

    // 2. 단일 심화 타입 (Intensive): 1순위가 60% 이상
    let typeKey = '';
    if (first[1] >= 0.6) {
      typeKey = first[0] + first[0];
    } else if (second) {
      typeKey = first[0] + second[0];
    } else {
      typeKey = first[0] + first[0]; // 데이터가 하나뿐일 때
    }

    const typeInfo = DNA_TYPES[typeKey] || { name: '데이터 부족', description: '글을 더 작성하여 당신의 독서 DNA를 확인해 보세요!', recommended: [] };

    return {
      dnaType: typeKey,
      dnaName: typeInfo.name,
      description: typeInfo.description,
      scores,
      ratios,
      topAxes: second ? [first[0], second[0]] : [first[0]],
      recommendedGenres: typeInfo.recommended
    };
  };

  return { analyzeDNA };
};
