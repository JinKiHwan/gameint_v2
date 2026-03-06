export const DNA_AXES = {
  I: { id: 'I', name: 'Imagination', label: '상상력', color: '#9C27B0' },
  K: { id: 'K', name: 'Knowledge', label: '지식', color: '#1E88E5' },
  G: { id: 'G', name: 'Growth', label: '성장', color: '#43A047' },
  E: { id: 'E', name: 'Emotion', label: '감성', color: '#E91E63' }
};

export const CATEGORY_MAPPING: Record<string, string> = {
  '소설': 'I',
  '자기계발': 'G',
  '경제/경영': 'G',
  '인문/사회': 'K',
  '과학/기술': 'K',
  '시/에세이': 'E'
};

export const DNA_TYPES: Record<string, any> = {
  'IE': {
    name: '인간 문학가',
    description: '인간 이야기 중심, 감정 공감 높음, 문학 선호형',
    recommended: ['문학', '에세이', '인간 드라마']
  },
  'IK': {
    name: '세계관 설계자',
    description: '이야기와 지식의 결합, 세계관 분석형',
    recommended: ['SF', '역사소설']
  },
  'IG': {
    name: '인생 서사형',
    description: '주인공의 성장 서사 선호, 인물 변화에 관심',
    recommended: ['성장 소설', '전기']
  },
  'KE': {
    name: '철학 탐험가',
    description: '인간 존재 탐구, 사색형 독서가',
    recommended: ['철학', '고전문학']
  },
  'KG': {
    name: '전략적 사고가',
    description: '현실적 사고, 생산성, 경제/경영 선호',
    recommended: ['경제/경영', '전략']
  },
  'KI': {
    name: '스토리 분석가',
    description: '문학을 텍스트와 구조적으로 분석하며 읽는 타입',
    recommended: ['비평', '추리소설']
  },
  'EE': {
    name: '감성 기록자',
    description: '감정 기록, 에세이 강력 선호형',
    recommended: ['에세이', '일기']
  },
  'EK': {
    name: '예술 사색가',
    description: '예술과 철학의 결합을 즐기는 타입',
    recommended: ['예술철학', '미학']
  },
  'EG': {
    name: '인생 탐색가',
    description: '자기성찰 중심의 에세이 선호형',
    recommended: ['심리학', '치유 에세이']
  },
  'GK': {
    name: '인생 전략가',
    description: '성장과 지식의 결합을 추구하는 타입',
    recommended: ['자기계발', '전문지식']
  },
  'GE': {
    name: '자기 탐구자',
    description: '내면의 자기 이해를 돕는 독서 선호',
    recommended: ['자기계발', '심리상담']
  },
  'GG': {
    name: '목표 설계자',
    description: '실용적인 자기계발 중심의 독서가',
    recommended: ['경제적 자유', '시간관리']
  },
  'KK': {
    name: '지식 수집가',
    description: '극강의 지식 탐구, 학습형 독서가',
    recommended: ['백과사전', '심화 전공서']
  },
  'BALANCED': {
    name: '균형 독서가',
    description: '모든 분야에 열려있는 균형 잡힌 독서가',
    recommended: ['다양한 장르']
  }
};
