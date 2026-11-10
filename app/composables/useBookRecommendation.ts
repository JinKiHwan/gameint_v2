import { doc, getDoc, setDoc } from 'firebase/firestore'
import { DNA_AXES } from '../utils/dnaConfig'
import type { DNAResult } from './useDNA'

export interface RecommendedBookItem {
  rank: number
  title: string
  author: string
  genre: string
  axis: string
  reason: string
  basisBooks: string[]
  thumbnail?: string
  url?: string
  publisher?: string
}

export interface ExpansionBookItem {
  title: string
  author: string
  genre: string
  targetAxis: string
  targetAxisLabel: string
  currentRatioPercent: number
  reason: string
  bridgePoint: string
  thumbnail?: string
  url?: string
  publisher?: string
}

export interface LowRatingInferenceItem {
  bookTitle: string
  bookAuthors: string
  rating: number
  category: string
  isStrictUnderTwo: boolean
  badgeLabel: string
  reviewExcerpt: string
  inferredReasons: string[]
  dataComparison: string
  thumbnail?: string
  url?: string
  publisher?: string
}

export interface HighRatingInferenceItem {
  bookTitle: string
  bookAuthors: string
  ratingLabel: string
  category: string
  reviewExcerpt: string
  inferredReasons: string[]
  coreFactor: string
  thumbnail?: string
  url?: string
  publisher?: string
}

export interface UserReadingRecommendationResult {
  totalReviews: number
  totalBookPosts: number
  avgRating: number
  topRatedBooks: { title: string; rating: number; category: string }[]
  keywords: string[]
  overallSummary: string
  favoriteBooks: RecommendedBookItem[]
  expansionBooks: ExpansionBookItem[]
  lowRatingInferences: LowRatingInferenceItem[]
  highRatingInferences: HighRatingInferenceItem[]
  hasStrictUnderTwo: boolean
}

interface CuratedProfile {
  keywords: string[]
  overallSummary: string
  favoriteBooks: RecommendedBookItem[]
  expansionBooks: Omit<ExpansionBookItem, 'currentRatioPercent'>[]
  highRatingInferences: HighRatingInferenceItem[]
  specificLowInferences?: Record<string, { reasons: string[]; comparison: string }>
  fallbackLowInference?: {
    bookTitle: string
    bookAuthors: string
    rating: number
    category: string
    badgeLabel: string
    reviewExcerpt: string
    inferredReasons: string[]
    dataComparison: string
  }
}

const CURATED_USER_PROFILES: Record<string, CuratedProfile> = {
  // 1. 지영이지영 (이지영)
  '52G0nv5nuSZUCMJZhkrBkZGRTR02': {
    keywords: ['#입체적인간이해', '#종을초월한연대와아가페', '#양면시점서사', '#감정철학'],
    overallSummary:
      '『프로젝트 헤일메리』(★4.5)와 『오베라는 남자』(★4.0)에서 가장 높은 만족도를 보이셨습니다. 혈연을 넘어 서로를 위해 희생하고 보이지 않는 내면의 아픔까지 보듬는 입체적 관계 서사에 깊이 공명하며, 추천글(『감정수업』, 『냉정과 열정사이』, 『H2』)에서도 인간 감정의 미묘한 결을 다각도로 관찰하는 독서를 즐기십니다.',
    favoriteBooks: [
      {
        rank: 1,
        title: '클라라와 태양',
        author: '가즈오 이시구로',
        genre: '소설',
        axis: 'I',
        reason:
          '『프로젝트 헤일메리』 리뷰에서 언급하신 "완전히 다른 존재와의 헌신적이고 아가페적인 사랑"을 인공지능 친구(AF) 클라라의 시선으로 극대화한 작품입니다. 인간의 외로움과 사랑을 다각도로 관찰하는 지영님의 시선과 완벽히 맞닿아 있습니다.',
        basisBooks: ['프로젝트 헤일메리 (★4.5)', '오베라는 남자 (★4.0)']
      },
      {
        rank: 2,
        title: '불안한 사람들',
        author: '프레드릭 배크만',
        genre: '소설',
        axis: 'I',
        reason:
          '★4.0점을 주신 『오베라는 남자』 작가의 작품으로, 어설픈 은행 강도와 인질 8명의 숨겨진 사연이 교차하는 따뜻한 소동극입니다. "모든 인간은 단면적이지 않고 복합적인 모습을 가지고 있다"는 지영님의 감상평에 가장 부합하는 소설입니다.',
        basisBooks: ['오베라는 남자 (★4.0)', '냉정과 열정사이 (추천)']
      },
      {
        rank: 3,
        title: '천 개의 파랑',
        author: '천선란',
        genre: '소설',
        axis: 'I',
        reason:
          '휴머노이드 기수 콜리와 안락사 위기에 처한 경주마, 상처 입은 가족이 서로를 구원하는 SF 성장 소설입니다. 『프로젝트 헤일메리』처럼 가독성이 뛰어나면서도 따뜻한 위로를 건넵니다.',
        basisBooks: ['프로젝트 헤일메리 (★4.5)', 'H2 (추천)']
      }
    ],
    expansionBooks: [
      {
        title: '감정은 어떻게 만들어지는가',
        author: '리사 펠드먼 배럿',
        genre: '과학/기술 (뇌과학)',
        targetAxis: 'K',
        targetAxisLabel: '지식 (K) · 성장 (G)',
        reason:
          '현재 독서 DNA가 상상력(I, 90%)에 집중되어 있습니다. 『감정수업』(강신주)을 통해 48가지 감정 철학에 큰 흥미를 느끼셨던 만큼, 뇌과학과 심리학 데이터로 감정의 탄생 원리를 파헤치는 이 책을 통해 인문적 감수성에 과학적·분석적 역량을 결합하실 수 있습니다.',
        bridgePoint: '『감정수업』의 철학적 감정 탐구 → 뇌과학적 감정 구성 이론으로 확장'
      }
    ],
    highRatingInferences: [
      {
        bookTitle: '프로젝트 헤일메리',
        bookAuthors: '앤디 위어',
        ratingLabel: '★4.5 (최고 평점)',
        category: '소설 (SF)',
        reviewExcerpt:
          '책태기를 극복하고 오랜만에 남은 분량이 줄어드는 것이 아쉽다고 생각할 정도로 재미있게 읽었습니다. 상대를 위해서라면 기꺼이 희생할 수 있는 아가페적 사랑을 베풀 수 있는 상대라면 가족이라고 불러도 괜찮지 않을까 생각합니다.',
        inferredReasons: [
          '혈연을 초월한 헌신적 연대(아가페적 사랑): 외계 생명체 로키와 주인공이 쌓아가는 조건 없는 신뢰와 희생 서사가 지영님이 가장 가치 있게 여기는 인간관과 정확히 부합했습니다.',
          '책태기를 단숨에 깨뜨린 몰입감: 복잡한 배경 묘사에 치우친 소설(★3.0점대)과 달리, 명확한 문제 해결 과정과 유머러스한 교감이 빠르게 전개되어 최상의 독서 쾌감을 주었습니다.'
        ],
        coreFactor: '종을 초월한 우정·희생 서사 + 압도적 가독성'
      },
      {
        bookTitle: '오베라는 남자 & 냉정과 열정사이 / 감정수업',
        bookAuthors: '프레드릭 배크만 외',
        ratingLabel: '★4.0 및 인생 책 추천',
        category: '소설 · 인문',
        reviewExcerpt:
          '모든 인간은 단면적이지 않고 복합적인 모습을 가지고 있다. 보이지 않는 부분까지도 이해할 수 있는 사람이 되고싶다.',
        inferredReasons: [
          '인간 내면의 입체성 탐구: 까칠한 겉모습 뒤에 숨겨진 오베의 순애보나, 남녀 두 작가의 시선으로 교차 서술되는 『냉정과 열정사이』처럼 한 사람을 입체적으로 이해하게 해주는 구조에 큰 매력을 느끼십니다.',
          '무형의 감정을 언어로 명료화하는 기쁨: 『감정수업』 추천글에서 밝히셨듯 막연한 감정의 결을 섬세하게 포착하고 성찰하는 작품에 높은 점수를 주십니다.'
        ],
        coreFactor: '보이지 않는 내면과 감정의 입체적 관찰'
      }
    ],
    fallbackLowInference: {
      bookTitle: '변신 / 멋진 신세계 / 빛의 제국',
      bookAuthors: '프란츠 카프카 / 올더스 헉슬리 / 김영하',
      rating: 3.0,
      category: '소설',
      badgeLabel: '2점 이하 도서 없음 · 상대적 최저점(★3.0) 분석',
      reviewExcerpt:
        '다만 벌레 묘사가 굉장히 잘되어있어서 읽으며 괴로울 수 있습니다. (『변신』) / 책의 전개 방식이 다소 복잡하게 느껴져 내용을 이해하는 데 조금 어려움이 있었습니다. (『멋진 신세계』)',
      inferredReasons: [
        '그로테스크한 묘사와 배제의 서사 충돌: 『프로젝트 헤일메리』(★4.5)나 『오베라는 남자』(★4.0)처럼 서로를 보듬는 연대 서사를 선호하시는 반면, 『변신』처럼 가족에게 철저히 소외되고 사실적인 벌레 묘사가 이어지는 작품에서는 감각적·정서적 피로감을 느끼십니다.',
        '배경 설정·묘사 과잉 시 몰입 저하: 『멋진 신세계』("전개 방식이 다소 복잡")와 『빛의 제국』("묘사가 많습니다")처럼 인물의 감정선보다 복잡한 세계관 설명이나 긴 정경 묘사가 앞설 때 상대적으로 평점이 낮아지는 패턴이 확인됩니다.'
      ],
      dataComparison: '고득점(★4.0~4.5: 따뜻한 관계 회복·빠른 흡입력) vs 상대적 저점(★3.0: 소외 서사·복잡한 배경 묘사)'
    }
  },

  // 2. FE팟짱 (우현진)
  '8mIA6Az9SeZ8oyf4JG9VxBHVYOq2': {
    keywords: ['#시각적장면묘사', '#투지와성취서사', '#사람냄새나는공간', '#진화·사회학적통찰'],
    overallSummary:
      '머릿속에 영화나 드라마처럼 장면이 생생하게 그려지는 가독성 높은 서사를 선호하십니다. 『변두리 로켓』 시리즈(★5.0)처럼 끝까지 부딪혀 밝은 미래를 쟁취하는 뜨거운 이야기나, 『오베라는 남자』(★4.0)·『망원동 브라더스』·『휴남동 서점』처럼 사람 냄새 나는 공간 중심의 서사, 그리고 『유전자 지배 사회』처럼 인간 행동을 명쾌하게 해부하는 책에 높은 만족도를 보이십니다.',
    favoriteBooks: [
      {
        rank: 1,
        title: '하늘을 나는 타이어',
        author: '이케이도 준',
        genre: '소설',
        axis: 'I',
        reason:
          '만점(★5.0)을 주신 『변두리 로켓』 작가 이케이도 준의 대표작입니다. 대기업의 리콜 은폐에 맞서 중소 운수회사 사장이 끝까지 싸워 진실을 밝혀내는 과정이 한 편의 영화처럼 펼쳐져, 우현진님이 좋아하시는 "긴 싸움 끝에 찾아오는 밝은 미래"의 카타르시스를 선사합니다.',
        basisBooks: ['변두리 로켓: 가우디 프로젝트 (★5.0)', '변두리 로켓 (당선작)']
      },
      {
        rank: 2,
        title: '달까지 가자',
        author: '장류진',
        genre: '소설',
        axis: 'I',
        reason:
          '추천하셨던 『망원동 브라더스』의 유쾌한 사람 냄새와 『절망의 나라의 행복한 젊은이들』의 청년 세대 현실을 결합한 소설입니다. 드라마처럼 생생한 장면 묘사와 리듬감 덕분에 출퇴근길 지하철에서 최고의 몰입감을 줄 작품입니다.',
        basisBooks: ['망원동 브라더스 (추천)', '절망의 나라의 행복한 젊은이들 (추천)']
      },
      {
        rank: 3,
        title: '나미야 잡화점의 기적',
        author: '히가시노 게이고',
        genre: '소설',
        axis: 'I',
        reason:
          '『어서 오세요, 휴남동 서점입니다』처럼 특정 공간을 중심으로 평범한 사람들의 고민과 연대가 퍼즐처럼 맞물리는 구성으로, 우현진님이 중시하시는 "시각적 장면화"와 "따뜻한 감동"을 동시에 충족합니다.',
        basisBooks: ['어서 오세요, 휴남동 서점입니다 (추천)', '오베라는 남자 (★4.0)']
      }
    ],
    expansionBooks: [
      {
        title: '생각에 관한 생각',
        author: '대니얼 카너먼',
        genre: '경제/경영 (행동경제학)',
        targetAxis: 'G',
        targetAxisLabel: '성장 (G) · 지식 (K)',
        reason:
          '현재 독서 DNA에서 성장/경제·경영(G) 축이 0%로 비어 있습니다. 『유전자 지배 사회』에서 인간의 본능과 "값비싼 신호(핸디캡 이론)"에 깊은 인상을 받으셨던 만큼, 인간의 직관과 의사결정 오류를 생생한 실험으로 풀어낸 행동경제학 고전을 통해 비즈니스·전략적 사고 역량을 자연스럽게 확장하실 수 있습니다.',
        bridgePoint: '『유전자 지배 사회』의 인간 행동 분석 → 행동경제학·의사결정 프레임으로 확장'
      }
    ],
    highRatingInferences: [
      {
        bookTitle: '변두리 로켓: 가우디 프로젝트 (및 1권 변두리 로켓)',
        bookAuthors: '이케이도 준',
        ratingLabel: '★5.0 (만점)',
        category: '소설',
        reviewExcerpt:
          '“길고 고된 싸움이 끝나면 밝은 미래가 찾아오는 소설을 저는 좋아합니다.” 끝까지 버티고, 부딪히고, 포기하지 않는 사람들의 이야기.',
        inferredReasons: [
          '뜨거운 집념과 역전극이 주는 카타르시스: 냉소적이거나 무기력한 결말보다, 기술자와 소시민들이 현실의 벽에 끝까지 맞서 싸워 결국 빛나는 성취를 이루는 서사에 가장 강하게 반응하십니다.',
          '드라마틱한 연출과 속도감: 장면 전환이 빠르고 갈등과 해결 구조가 명확하여 읽는 내내 머릿속에 드라마 한 편이 생생하게 그려졌기 때문에 만점을 부여하셨습니다.'
        ],
        coreFactor: '포기하지 않는 사람들의 역전 서사 + 생생한 장면 연출'
      },
      {
        bookTitle: '오베라는 남자 / 망원동 브라더스 / 유전자 지배 사회',
        bookAuthors: '프레드릭 배크만, 김호연, 최정균',
        ratingLabel: '★4.0 및 도서 추천',
        category: '소설 · 과학/인문',
        reviewExcerpt:
          '사랑하는 사람을 잃은 한 남자가 다시 세상과 연결되는 과정을 그린, 웃음과 눈물이 공존하는 따뜻한 이야기입니다. 영화를 먼저 보고 책을 읽으니 장면들이 잘 떠올라서 더 좋았습니다.',
        inferredReasons: [
          '사람 냄새 나는 공간과 시각적 몰입: 옥탑방(『망원동 브라더스』), 동네 서점(『휴남동 서점』), 이웃 마을(『오베라는 남자』)처럼 구체적인 공간 속에서 세대별 고민과 유머가 교차할 때 높은 만족도를 느끼십니다.',
          '현실 인간 행동을 명쾌하게 해부하는 쾌감: 비문학에서도 『유전자 지배 사회』의 "값비싼 신호"처럼 주변 사람들의 이해하기 힘든 행동을 명쾌한 과학·사회학적 프레임으로 설명해 주는 책을 높이 평가하십니다.'
        ],
        coreFactor: '시각적 장면화(시네마틱 독서) + 현실 공감과 명쾌한 통찰'
      }
    ],
    specificLowInferences: {
      '멋진 신세계': {
        reasons: [
          '초반부 시각적 훅(Hook)의 부재: 리뷰에서 "초반 부분이 아쉬워서 빠르게 포기한 책"이라 밝히셨듯, 구체적인 인물의 드라마틱한 갈등 대신 미래 통제 사회의 인공 부화소·조건반사 설정 설명이 길게 이어지면서 우현진님 특유의 "머릿속 영화 장면화"가 차단되었습니다.',
          '『변두리 로켓』(★5.0)처럼 인물이 역경을 뚫고 나아가는 희망적 추진력이 없는 냉소적 디스토피아 구조가 독서 동력을 떨어뜨렸습니다.'
        ],
        comparison: '★5.0 『변두리 로켓』(명확한 목표·역경 극복·시각적 전개) vs ★2.5 『멋진 신세계』(초반 관념적 설정 나열·무기력한 체제)'
      },
      '여행의 기술': {
        reasons: [
          '서사적 템포와 호흡의 불일치: "개인적으로는 읽는 흐름이 조금 느리게 느껴졌습니다"라는 리뷰와 『1Q84』에서 "설명이 많기 때문에 지루함도 중간중간 있었다"는 평이 정확히 일치합니다.',
          '사건의 기승전결보다 화가·작가들의 일화를 빌려 내면의 사색을 천천히 나열하는 알랭 드 보통 특유의 만연체 에세이 호흡이 평소 선호하시는 속도감 있는 전개와 맞지 않았습니다.'
        ],
        comparison: '선호 스타일(드라마틱한 사건 전개·명쾌한 인과) vs ★2.5 『여행의 기술』(정적인 철학 단상·느린 호흡)'
      }
    }
  },

  // 3. 다독다독 (김소연)
  'HPHvmH2NBqfO4zGX9sDlsUGiLSB3': {
    keywords: ['#직관적재미와유머', '#입체적캐릭터', '#따뜻한관계변화', '#현실공감중시'],
    overallSummary:
      '『마루는 강쥐 1』(★4.5)과 추천작 『역대급 영지 설계사』에서 드러나듯 확실한 유머와 개성 넘치는 입체적 캐릭터("주인공이 착하기만 한 건 질색")를 선호하십니다. 또한 『오베라는 남자』(★3.5)나 『안녕이라 그랬어』처럼 까칠하거나 평범한 인물이 관계 속에서 변해가는 현실 밀착형 이야기에 깊이 공감하십니다.',
    favoriteBooks: [
      {
        rank: 1,
        title: '보건교사 안은영',
        author: '정세랑',
        genre: '소설',
        axis: 'I',
        reason:
          '『역대급 영지 설계사』와 『마루는 강쥐』(★4.5)에서 좋아하셨던 통통 튀는 유머 감각, 마냥 착하지만은 않은 매력적인 주인공, 그리고 기발한 판타지 설정과 따뜻한 인간애가 완벽히 결합된 소설입니다.',
        basisBooks: ['마루는 강쥐 1 (★4.5)', '역대급 영지 설계사 1 (추천)']
      },
      {
        rank: 2,
        title: '지구 끝의 온실',
        author: '김초엽',
        genre: '소설',
        axis: 'I',
        reason:
          '『오베라는 남자』(★3.5) 리뷰에서 감명 깊게 짚어내신 "사람과 사람 사이의 연결이 얼마나 큰 힘이 되는지"를 매혹적인 스토리텔링과 빠른 흡입력으로 풀어낸 작품입니다.',
        basisBooks: ['오베라는 남자 (★3.5)', '빛의 제국 (★3.0)']
      },
      {
        rank: 3,
        title: '바깥은 여름',
        author: '김애란',
        genre: '소설',
        axis: 'I',
        reason:
          '#가족 사이클에서 김애란 작가의 인터뷰에 인상을 받아 『안녕이라 그랬어』를 직접 선정하셨던 만큼, 김애란 작가의 정수가 담긴 단편집 『바깥은 여름』이 현실적인 공감과 깊은 여운을 줄 것입니다.',
        basisBooks: ['안녕이라 그랬어 (선정 도서)', '오베라는 남자 (★3.5)']
      }
    ],
    expansionBooks: [
      {
        title: '설득의 심리학 1',
        author: '로버트 치알디니',
        genre: '경제/경영 (사회심리학)',
        targetAxis: 'G',
        targetAxisLabel: '성장 (G) · 지식 (K)',
        reason:
          '『데일 카네기 인간관계론』(★2.5)처럼 원론적이고 교훈적인 처세술에는 흥미를 덜 느끼셨지만, 『역대급 영지 설계사』의 기발한 심리전과 설계에는 큰 매력을 느끼셨습니다. 실제 심리 실험과 흥미진진한 사례로 인간 심리의 허점을 파헤치는 이 책으로 G·K 축 역량을 재미있게 넓히실 수 있습니다.',
        bridgePoint: '입체적 캐릭터의 심리전 선호 → 행동심리학 기반 실전 설득 전략으로 확장'
      }
    ],
    highRatingInferences: [
      {
        bookTitle: '마루는 강쥐 1 & 역대급 영지 설계사 1',
        bookAuthors: '모죠 / 이현민',
        ratingLabel: '★4.5 (최고 평점) 및 강력 추천',
        category: '만화 · 판타지',
        reviewExcerpt:
          '강쥐는 최고입니다! / "주인공이 착하기만 한 건 질색이다" 하시는 분, 우울할 때 배꼽 잡고 웃고 싶은 분께 추천합니다!',
        inferredReasons: [
          '클리셰를 깨는 입체적 캐릭터와 확실한 도파민: 전형적이고 착하기만 한 주인공보다, 능청스럽고 개성 강한 캐릭터가 빚어내는 예측 불가한 유머에서 가장 큰 즐거움을 얻으십니다.',
          '무거운 교훈보다 직관적인 몰입감: 일상 속 스트레스를 단숨에 날려주는 생동감 넘치는 연출과 귀여움·광기가 공존하는 작품에 가장 후한 점수를 주십니다.'
        ],
        coreFactor: '클리셰 파괴 입체적 캐릭터 + 즉각적인 유머와 몰입감'
      },
      {
        bookTitle: '오베라는 남자',
        bookAuthors: '프레드릭 배크만',
        ratingLabel: '★3.5 (소설 최고점)',
        category: '소설',
        reviewExcerpt:
          '처음에는 오베의 행동이 불편하게 느껴지지만, 그의 과거를 알게 되면서 자연스럽게 이해하게 됩니다. 이웃들과의 관계 속에서 조금씩 변해가는 모습이 잔잔한 감동을 줍니다.',
        inferredReasons: [
          '인물의 행동에 부여되는 서사적 납득: 처음엔 까칠하고 불호에 가까웠던 인물이라도, 그 이면의 상처와 서사가 설득력 있게 제시될 때 깊이 공감하고 마음을 여는 독서 성향을 보여주십니다.'
        ],
        coreFactor: '까칠한 인물의 내면 서사 납득 + 따뜻한 관계의 힘'
      }
    ],
    specificLowInferences: {
      '데일 카네기 인간관계론': {
        reasons: [
          '교훈적·당위적 화법에 대한 거리감: 추천글에서 "주인공이 착하기만 한 건 질색이다"라고 밝히신 솔직하고 입체적인 취향에 비추어 볼 때, "비판하지 말라, 진심으로 칭찬하라" 같은 모범답안식 처세 훈계가 다소 평면적이고 지루하게 다가왔을 가능성이 높습니다.',
          '실제 다른 리뷰들과 달리 개인적 감정 표현 없이 책의 객관적 요약만 남기며 ★2.5점을 부여한 점에서 정서적 몰입이 낮았음이 확인됩니다.'
        ],
        comparison: '★4.5 『마루는 강쥐』·『역대급 영지 설계사』(클리셰 파괴·생동감) vs ★2.5 『인간관계론』(전형적·교훈적 처세술)'
      },
      '멋진 신세계': {
        reasons: [
          '극단적 인물에 대한 현실 공감 저하: 리뷰에서 "세계국이 인간다운 감정을 잃은 점"과 동시에 "이를 거부한 존 역시 고통을 지나치게 신성시하며 자신을 파괴하는 모습이 안타까웠다"고 정확히 짚어내셨습니다.',
          '『여행의 이유』(★3.0, "평소 여행에 설렘이 크지 않은 저에게는 크게 와닿지 않았다")와 마찬가지로, 일상적 공감대를 벗어난 극단적·추상적 설정에는 엄격한 평점을 주시는 경향이 뚜렷합니다.'
        ],
        comparison: '★3.5 『오베라는 남자』(점진적 감정 이해와 온기) vs ★2.5 『멋진 신세계』(양극단의 비현실적 자기파괴)'
      }
    }
  },

  // 4. 머릿말마스터 (진기환)
  'V8fuM5VTd1et3TWi8doCDEU8h162': {
    keywords: ['#인간다움의본질과삶의궤적', '#생사(生死)와실존성찰', '#유토피아vs디스토피아', '#문학적문장력'],
    overallSummary:
      '독서 DNA 4대 축(I 40%, E 30%, K 20%, G 10%)이 가장 균형 잡힌 "인간 문학가(IE)" 타입입니다. 『빛의 제국』(★4.0), 『멋진 신세계』(★4.0), 『죽은 자의 집 청소』(추천)에서 일관되게 나타나듯, "인간다움이란 무엇인가?", "죽음과 문명의 경계에서 현재의 삶을 어떻게 성찰할 것인가?"라는 묵직한 철학적 화두와 뛰어난 문장력(수미상관, 생생한 비유)이 결합된 작품에 가장 높은 점수를 주십니다.',
    favoriteBooks: [
      {
        rank: 1,
        title: '숨결이 바람 될 때',
        author: '폴 칼라니티',
        genre: '시/에세이',
        axis: 'E',
        reason:
          '강력 추천하셨던 『죽은 자의 집 청소』의 핵심 화두("죽음을 생각하는 것은 삶을 사랑하는 방법 중 하나이다")와 가장 깊이 공명하는 명저입니다. 죽음을 앞둔 신경외과 의사가 "무엇이 인간의 삶을 의미 있게 만드는가"를 문학적이고 밀도 높은 문장으로 기록해 첫 몇 줄만으로도 작가의 필력을 체감하실 수 있습니다.',
        basisBooks: ['죽은 자의 집 청소 (추천)', '빛의 제국 (★4.0)']
      },
      {
        rank: 2,
        title: '화씨 451',
        author: '레이 브래드버리',
        genre: '소설',
        axis: 'I',
        reason:
          '모임 내에서 유일하게 『멋진 신세계』에 ★4.0점 최고점을 부여하며 디스토피아를 통해 현재 우리의 삶을 돌아보셨고, 『모모』(★3.5)에서도 효율성 사회의 "회색신사"를 성찰하셨습니다. 사유와 책이 금지된 효율 만능 사회를 시적인 문체로 그려낸 이 고전은 진기환님의 취향에 완벽히 부합합니다.',
        basisBooks: ['멋진 신세계 (★4.0)', '모모 (★3.5)']
      },
      {
        rank: 3,
        title: '아픔이 길이 되려면',
        author: '김승섭',
        genre: '인문/사회',
        axis: 'K',
        reason:
          '추천작 『세종의 허리 가우디의 뼈』의 의료·역사적 시선과 『휴대폰과 독화살』(★3.5)의 인류학적 성찰을 잇는 작품입니다. 타인의 삶과 고통을 함부로 연민하거나 미화하지 않고, 데이터와 따뜻한 문장으로 응시하는 태도가 진기환님의 독서 철학과 맞닿아 있습니다.',
        basisBooks: ['세종의 허리 가우디의 뼈 (추천)', '휴대폰과 독화살 (★3.5)']
      }
    ],
    expansionBooks: [
      {
        title: '일류의 조건 (또는 원씽 The One Thing)',
        author: '사이토 다카시 / 게리 켈러',
        genre: '자기계발',
        targetAxis: 'G',
        targetAxisLabel: '성장 (G · 현재 10%)',
        reason:
          '현재 DNA 중 성장/실용(G) 축이 10%로 가장 낮고, 단순 기술 매뉴얼(『사진구도 완전정복』 ★2.0)에는 낮은 만족도를 보이셨습니다. 기능적 팁의 나열이 아니라 "본질에의 몰입과 장인의 철학적 태도"를 다루는 인문형 자기계발서를 통해 G축 역량을 넓히시는 것을 추천합니다.',
        bridgePoint: '삶의 궤적과 본질에 대한 철학적 사색 → 본질 중심의 성장·몰입 방법론으로 확장'
      }
    ],
    highRatingInferences: [
      {
        bookTitle: '빛의 제국 & 멋진 신세계',
        bookAuthors: '김영하 / 올더스 헉슬리',
        ratingLabel: '★4.0 (최고 평점)',
        category: '소설',
        reviewExcerpt:
          '타인 뿐 아니라 나를 평가할 때 현재 위치에서만 판단하는 것이 아니라 수 많은 선택과 삶의 방향들도 함께 바라봐주는 것이 인간다움의 본질 중 하나일 수 있겠다 (『빛의 제국』) / 디스토피아에 가까운 삶을 살아가고 있는 우리가 유토피아로 여행을 떠난다면 현재 우리의 삶이 어떤 의미인지 많은 생각을 갖게 해준 책 (『멋진 신세계』)',
        inferredReasons: [
          '낯선 세계관·타인의 궤적을 거울삼아 나를 돌아보는 성찰: 다른 멤버들이 『빛의 제국』과 『멋진 신세계』의 느린 전개나 낯선 설정에 ★2.0~3.0점을 줄 때, 진기환님은 두 작품 모두에 최고점(★4.0)을 주셨습니다. 사건의 외적 속도보다 "그 안에서 인간다움과 현재 내 삶의 의미를 건져 올릴 수 있는가"가 가장 중요한 평가 기준이기 때문입니다.'
        ],
        coreFactor: '인간다움의 본질 성찰 + 현재 삶을 비추는 철학적 거울'
      },
      {
        bookTitle: '죽은 자의 집 청소 & 휴대폰과 독화살',
        bookAuthors: '김완 / 장준호',
        ratingLabel: '인생 책 추천 및 ★3.5',
        category: '시/에세이',
        reviewExcerpt:
          '수미상관을 이루는 구성과 소설보다 더 생생한 표현은 책을 피고 두세줄 읽으면 작가의 역량을 체감할 수 있었습니다. (『죽은 자의 집 청소』)',
        inferredReasons: [
          '빼어난 문장력과 구조적 완성도: 시 전공 작가의 수미상관 구성과 생생한 표현력에 감탄하셨듯, 텍스트 자체의 문학적 밀도를 매우 중요하게 평가하십니다.',
          '대상을 함부로 미화하거나 연민하지 않는 진정성: 특수청소부나 아마존 원주민의 삶을 담담하고 날카롭게 응시하며 죽음과 문명의 경계를 묻는 태도에 깊이 공명하십니다.'
        ],
        coreFactor: '첫 두세 줄에 체감되는 작가의 필력 + 삶과 죽음의 진정성'
      }
    ],
    specificLowInferences: {
      '사진구도 완전정복': {
        reasons: [
          '문학적 서사와 사유의 여백 부재 (★2.0 최저점 원인): 사진에 대한 관심으로 선택하셨고 리뷰에서도 "초보자의 입장에서 정리를 해준 책이라 직관적으로 와닿았다"고 실용적 효용은 인정하셨습니다.',
          '그러나 진기환님이 ★4.0점을 준 도서(『빛의 제국』, 『멋진 신세계』)와 추천서(『죽은 자의 집 청소』, 『이동진 독서법』) 데이터를 교차 분석하면, 진기환님에게 독서의 핵심 쾌감은 "작가의 빼어난 문장력 체감"과 "인간다움에 대한 철학적 고찰"에서 나옵니다. 공식과 작례 위주로 구성된 기능 매뉴얼북은 이러한 문학적·철학적 도파민을 전혀 제공하지 못했기 때문에 ★2.0점으로 낮게 평가된 것으로 추론됩니다.'
        ],
        comparison: '★4.0 『빛의 제국』·『멋진 신세계』(철학적 성찰·문학적 필력) vs ★2.0 『사진구도 완전정복』(단편적 공식·실용 매뉴얼)'
      },
      '아버지의 해방일지': {
        reasons: [
          '독서 후 찾아온 무거운 심리적 부채감: 리뷰에서 "나는 부모님에 대해 얼마나 알고 있는가, 그들의 이야기를 글로써 남길 수 없다는 것을 알게 되었다"고 적으셨듯, 작품의 재미보다 개인적인 반성과 먹먹함이 앞섰던 독서였습니다.',
          '문체 측면에서도 토속적·해학적 만담체의 소설보다 『죽은 자의 집 청소』나 김영하 작가의 작품처럼 정제되고 날카로운 시선의 문체에 더 높은 점수를 주시는 경향이 반영되었습니다.'
        ],
        comparison: '선호 문체(정제된 현대적 문장·실존적 화두) vs ★2.5 『아버지의 해방일지』(토속적 해학·가족사의 무거운 부채감)'
      }
    }
  },

  // 5. 인트관장 (안승필)
  'oDmKMyYSuvRyWmQNv5PX96bQFv52': {
    keywords: ['#완벽한세계관밸런싱', '#인과율과논리', '#아카이브·추리미스터리', '#도덕적딜레마'],
    overallSummary:
      '추천글 『눈물을 마시는 새』와 『죄와 벌』, 그리고 ★4.0점을 주신 『한국사 이상현상 연구원』·『오베라는 남자』를 종합하면, "강점과 약점이 맞물려 논리와 인과율로 굴러가는 완성형 세계관", "독자가 직접 단서를 맞춰가는 추리적 긴장감", 그리고 "선악의 도덕적 딜레마와 치밀한 심리 묘사"에 가장 강하게 몰입하십니다.',
    favoriteBooks: [
      {
        rank: 1,
        title: '삼체 (1~3권 세트)',
        author: '류츠신',
        genre: '소설 (하드 SF)',
        axis: 'I',
        reason:
          '『눈물을 마시는 새』 추천글에서 극찬하신 "설정이 아니라 세계가 왜 그렇게 돌아갈 수밖에 없는지 완벽한 논리와 밸런싱으로 움직이는 작품"의 SF 정점입니다. 『이기적 유전자』(★3.0)의 생존 논리와 추리적 서스펜스가 결합되어 압도적인 지적 몰입감을 선사합니다.',
        basisBooks: ['눈물을 마시는 새 세트 (추천)', '이기적 유전자 (★3.0)']
      },
      {
        rank: 2,
        title: '용의자 X의 헌신',
        author: '히가시노 게이고',
        genre: '소설 (추리/미스터리)',
        axis: 'I',
        reason:
          '『한국사 이상현상 연구원』(★4.0) 리뷰에서 "추리 소설이라고 생각하고 읽었는데 판타지 요소가 강해 조금 아쉬웠다"고 남기신 갈증을 완벽히 해소해 줄 정통 추리 걸작입니다. 『죄와 벌』처럼 사랑과 범죄, 헌신의 도덕적 딜레마를 치밀한 논리 싸움으로 풀어냅니다.',
        basisBooks: ['한국사 이상현상 연구원 (★4.0)', '디 에센셜: 죄와 벌 (추천)']
      },
      {
        rank: 3,
        title: '프로젝트 헤일메리',
        author: '앤디 위어',
        genre: '소설 (SF 미스터리)',
        axis: 'I',
        reason:
          '기억을 잃은 채 깨어난 주인공이 과학적 단서와 실험만으로 문제를 하나씩 돌파해 나가는 구조가 『한국사 이상현상 연구원』의 단서 조합 재미와 『오베라는 남자』(★4.0)의 뜨거운 우정·감동을 동시에 만족시킵니다.',
        basisBooks: ['한국사 이상현상 연구원 (★4.0)', '오베라는 남자 (★4.0)']
      }
    ],
    expansionBooks: [
      {
        title: '정의란 무엇인가 (또는 공정하다는 착각)',
        author: '마이클 샌델',
        genre: '인문/사회',
        targetAxis: 'K',
        targetAxisLabel: '지식 (K) · 성장 (G)',
        reason:
          '『죄와 벌』을 읽으며 "단 한 번의 악으로 수백 가지의 선을 이룰 수 있다면 정당화될 수 있는가?"라는 공리주의적 딜레마를 가장 깊이 사유하셨습니다. 소설 속 도덕적 딜레마를 현실 사회와 법·철학의 논리로 확장해 주는 이 책을 통해 지식(K) 및 성장(G) 축을 탄탄하게 넓히실 수 있습니다.',
        bridgePoint: '『죄와 벌』의 도덕·양심 딜레마 → 현실 사회의 정의와 공리주의 철학 논쟁으로 확장'
      }
    ],
    highRatingInferences: [
      {
        bookTitle: '한국사 이상현상 연구원 & 오베라는 남자',
        bookAuthors: '최인서 / 프레드릭 배크만',
        ratingLabel: '★4.0 (사이클 최고점)',
        category: '소설',
        reviewExcerpt:
          '탐사 지침서, 사건 보고서, 음성 녹취록, 면담 기록, 직원 채팅 내역 등 기존 책에서는 쉽게 볼 수 없었던 방식으로 이야기가 전개되어 신선했습니다. 독특한 구성 덕분에 몰입해서 읽을 수 있었습니다.',
        inferredReasons: [
          '독자가 능동적으로 단서를 조합하는 구조적 재미: 일방적으로 설명을 듣는 것보다 보고서·녹취록 등 다각도의 단서를 통해 사건의 전모를 추리해 가는 아카이브 미스터리 형식에 높은 점수를 주셨습니다.',
          '겉모습과 내면의 반전이 주는 서사적 완결성: 『오베라는 남자』처럼 까칠한 외면 뒤에 숨겨진 과거의 상처와 이유가 명확한 인과관계로 밝혀질 때 깊은 만족감을 느끼십니다.'
        ],
        coreFactor: '단서 추적의 인터랙티브한 구성 + 명확한 서사적 인과율'
      },
      {
        bookTitle: '눈물을 마시는 새 & 디 에센셜: 죄와 벌',
        bookAuthors: '이영도 / 도스토예프스키',
        ratingLabel: '인생 도서 강력 추천',
        category: '소설 (판타지 · 고전)',
        reviewExcerpt:
          '모든 종족이 “강점 = 동시에 약점”으로 설계되어 사기 종족이 존재하지 않고 세계관 자체의 긴장감이 절대 무너지지 않습니다. (『눈마새』) / “단 한 번의 악으로 수백 가지의 선을 이룰 수 있다면 괜찮지 않을까?” (『죄와 벌』)',
        inferredReasons: [
          '완벽한 밸런싱과 논리로 작동하는 세계관: 안승필님이 작품을 고평가하는 가장 핵심적인 기준은 "그럴 수밖에 없는 논리적 필연성"과 "팽팽한 밸런싱"입니다.',
          '극한의 도덕적·철학적 딜레마: 단순 권선징악이 아니라 독자로 하여금 선과 악, 양심의 한계를 끝까지 질문하게 만드는 묵직한 주제 의식에 열광하십니다.'
        ],
        coreFactor: '무너지지 않는 세계관 밸런싱 + 철학적·도덕적 딜레마'
      }
    ],
    specificLowInferences: {
      '멋진 신세계': {
        reasons: [
          '세계관 밸런싱 및 대등한 갈등 구조의 부재 (★2.0 최저점 원인): 안승필님은 『눈물을 마시는 새』에서 "사기 종족이 존재하지 않고 강점과 약점이 맞물려 세계관 자체의 긴장감이 무너지지 않는 것"을 최고의 재미 요소로 꼽으셨습니다.',
          '반면 『멋진 신세계』는 계급과 감정이 화학적으로 완전히 통제된 일방적인 디스토피아이며, 인물이 논리나 지략으로 체제에 맞서 싸우는 대신 무기력하게 파멸합니다. 추리적 단서 추적이나 팽팽한 긴장감이 결여된 정적인 풍자극이었기에 ★2.0점으로 가장 낮게 평가하셨습니다.'
        ],
        comparison: '★4.0 『한국사 이상현상 연구원』·『눈마새』(치밀한 밸런싱·단서 추적) vs ★2.0 『멋진 신세계』(일방적 통제 체제·서사적 긴장감 부족)'
      },
      '빛의 제국': {
        reasons: [
          '외적 사건(Plot)보다 정적인 내면 묘사에 치우친 전개: 리뷰에서 "이야기 전개가 빠른 편은 아니지만 인물들의 세세한 감정과 내면을 촘촘하게 따라가는 점이 좋았다"고 장점을 짚으셨음에도 ★2.5점을 주셨습니다.',
          '이는 『죄와 벌』이나 추리소설처럼 강렬한 사건과 인과적 클라이맥스를 기대하는 안승필님의 기준에서, 24시간의 일상 속 내면 흐름 위주로 진행되는 서사가 카타르시스를 주기에 다소 정적이었기 때문으로 분석됩니다.'
        ],
        comparison: '선호 서사(강렬한 딜레마와 추리적 사건 전개) vs ★2.5 『빛의 제국』·『와일드』(느린 호흡의 내면·회복 서사)'
      }
    }
  },

  // 6. 상원 (김상원)
  'qcATwOAzzTV82Hb8xzPpIAu5jGC2': {
    keywords: ['#거대역사속개인의목소리', '#꼬리에꼬리를무는확장독서', '#인간심리와국제정세', '#명쾌한가독성'],
    overallSummary:
      '책 한 권에서 얻은 질문을 다음 책으로 연결하는 "연쇄 확장 독서(『우리 본성의 선한 천사』 → 『붉은 인간의 최후』 ★4.0 → 『자유로부터의 도피』)"와 작품 간 평행이론 도출(『싯다르타』 ↔ 『죽음의 수용소에서』 ↔ 『멋진 신세계』) 능력이 탁월한 "세계관 설계자(IK)" 타입입니다. 거대한 역사나 경제 현상을 차가운 수식이 아닌 "살아있는 개인의 목소리와 인간 심리"로 명쾌하게 풀어낸 책에 열광하십니다.',
    favoriteBooks: [
      {
        rank: 1,
        title: '체르노빌의 목소리 (또는 예루살렘의 아이히만)',
        author: '스베틀라나 알렉시예비치 / 한나 아렌트',
        genre: '소설·르포 / 인문',
        axis: 'K',
        reason:
          '★4.0점을 주신 『붉은 인간의 최후』와 눈물을 흘리며 추천하신 『전쟁은 여자의 얼굴을 하지 않았다』의 작가 알렉시예비치의 대표작입니다. 또한 『자유로부터의 도피』에서 탐구하신 "왜 평범한 개인이 전체주의에 순응하는가"를 법정 기록으로 파헤친 『예루살렘의 아이히만』 역시 상원님의 연쇄 독서 계보를 잇는 완벽한 선택입니다.',
        basisBooks: ['붉은 인간의 최후 (★4.0)', '전쟁은 여자의 얼굴을 하지 않았다 (추천)', '자유로부터의 도피 (추천)']
      },
      {
        rank: 2,
        title: '지리의 힘',
        author: '팀 마샬',
        genre: '경제/경영 · 국제정치',
        axis: 'G',
        reason:
          '『국가는 무엇으로 싸우는가』 추천글에서 "미국(강대국들)은 왜 저러는 걸까? 주식이 왜 이럴까?를 납득하기 위해 신기함으로 읽고 있다"고 하신 호기심을 지정학·지리적 관점으로 명쾌하게 확장해 주는 책입니다.',
        basisBooks: ['국가는 무엇으로 싸우는가 (추천)', '돈의 심리학 (추천)']
      },
      {
        rank: 3,
        title: '불안한 사람들 (또는 아몬드)',
        author: '프레드릭 배크만 / 손원평',
        genre: '소설',
        axis: 'I',
        reason:
          '#가족 사이클에서 프레드릭 배크만의 『오베라는 남자』(★3.5)에 이어 『나의 친구들』(★3.5)까지 찾아 읽으실 만큼 작가의 따뜻한 인간관에 호감을 보이셨습니다. 서투른 사람들이 서로를 구원하는 배크만의 『불안한 사람들』이 큰 위안과 재미를 줄 것입니다.',
        basisBooks: ['오베라는 남자 (★3.5)', '나의 친구들 (★3.5)']
      }
    ],
    expansionBooks: [
      {
        title: '팩트풀니스 (Factfulness)',
        author: '한스 로슬링',
        genre: '인문/사회 · 데이터사고',
        targetAxis: 'G',
        targetAxisLabel: '지식 (K) · 성장 (G)',
        reason:
          '스티븐 핑커의 통계와 알렉시예비치의 개인 서사를 연결해 읽으셨고, 『돈의 방정식』보다 『돈의 심리학』에 더 깊이 공감하셨듯 "인간의 심리적 편향이 세상을 어떻게 오해하게 만드는가"를 명쾌한 데이터와 스토리로 풀어낸 이 책이 상원님의 분석 역량을 한 단계 더 넓혀줄 것입니다.',
        bridgePoint: '통계 이면의 인간 심리 탐구 → 글로벌 데이터와 10가지 본능적 편향 교정으로 확장'
      }
    ],
    highRatingInferences: [
      {
        bookTitle: '붉은 인간의 최후 & 전쟁은 여자의 얼굴을 하지 않았다',
        bookAuthors: '스베틀라나 알렉시예비치',
        ratingLabel: '★4.0 (최고 평점) 및 눈물의 추천',
        category: '소설 · 다큐멘터리 문학',
        reviewExcerpt:
          '교과서에서 한 줄로 배운 체제의 붕괴를, 그 시대를 산 사람들의 목소리로 들으니 그 한 줄의 무게가 다르게 느껴졌습니다.',
        inferredReasons: [
          '거대 담론(통계·역사) 이면에 살아있는 개인의 육성: 스티븐 핑커의 『우리 본성의 선한 천사』에서 통계로 본 역사를 "실제 개개인의 삶과 목소리"로 확인했을 때 가장 강렬한 울림을 느끼십니다.',
          '다음 책으로 질문을 확장시키는 지적 촉매제: 이 책을 읽은 뒤 "자유란 무엇인가, 왜 인간은 독재를 택했는가"라는 질문이 생겨 에리히 프롬의 『자유로부터의 도피』로 이어졌을 만큼 상원님의 호기심을 강하게 자극했습니다.'
        ],
        coreFactor: '거대 역사를 관통하는 생생한 인간의 목소리 + 연쇄 독서 유발'
      },
      {
        bookTitle: '죽음의 수용소에서 / 돈의 심리학 / 국가는 무엇으로 싸우는가',
        bookAuthors: '빅터 프랭클, 모건 하우절, 에드워드 피시먼',
        ratingLabel: '인생 책 강력 추천',
        category: '인문/사회 · 경제/경영',
        reviewExcerpt:
          '소설 『싯다르타』와의 놀라운 평행이론... 과거의 상처 대신 미래의 의미를 향하여 (『죽음의 수용소에서』) / 돈 얘기가 아니라 사람 얘기였어요. 『돈의 방정식』보다 『돈의 심리학』이 더 깊게 와닿았습니다.',
        inferredReasons: [
          '수식이나 현학적 이론보다 "인간 심리와 태도"로 본질을 꿰뚫는 명쾌함: 『돈의 방정식』 대신 『돈의 심리학』에 감응하고, 복잡한 국제 제재를 스토리텔링으로 풀어낸 『국가는 무엇으로 싸우는가』를 극찬하신 것처럼 "세상과 나를 이해하게 해주는 명쾌한 심리·서사 프레임"을 가장 높이 평가하십니다.',
          '기존에 읽은 문학(『싯다르타』, 『퓨처 셀프』)과 평행이론을 이루며 삶의 태도를 단단하게 잡아주는 능동적 메시지에 깊이 공명하십니다.'
        ],
        coreFactor: '인간 심리 기반의 명쾌한 본질 해부 + 미래 지향적 삶의 태도'
      }
    ],
    specificLowInferences: {
      '걷기의 인문학': {
        reasons: [
          '현학적 배경지식 요구와 파편화된 에세이 전개 (★2.0 최저점 원인): 리뷰에서 "다양한 배경 지식을 요구하고 책에 적힌 낯선 용어들이 생소하고 어려웠어요"라고 명확히 짚어주셨습니다.',
          '상원님이 극찬하신 인문·교양서(『자유로부터의 도피』, 『죽음의 수용소에서』, 『돈의 심리학』, 『국가는 무엇으로 싸우는가』)는 모두 "하나의 명확한 핵심 질문(Core Question)을 중심으로 독자를 설득력 있게 이끌어가는 구조"입니다. 반면 『걷기의 인문학』은 서구 철학·문학사·도시사를 사전 설명 없이 현학적으로 인용하며 산만하게 흩어지는 스타일이어서, 명쾌한 지적 깨달음을 선호하는 상원님과 가장 맞지 않았습니다.'
        ],
        comparison: '★4.0 『붉은 인간의 최후』·『자유로부터의 도피』(명확한 질문·생생한 인간 목소리) vs ★2.0 『걷기의 인문학』(현학적 용어·배경지식 장벽)'
      },
      '바디: 우리 몸 안내서': {
        reasons: [
          '관통하는 철학적 화두가 부족한 백과사전식 나열: "몰랐던 사실을 알게 해주는 쾌감"은 있었으나, 상원님이 선호하시는 "인간의 본성과 삶의 태도에 대한 깊은 통찰"로 이어지지 않고 단편적 지식 나열에 머물러 ★2.5점(무난하지만 추천은 못 함)을 부여하셨습니다.'
        ],
        comparison: '선호 과학/교양(삶의 태도와 직결된 통찰) vs ★2.5 『바디』(백과사전식 트리비아 나열)'
      },
      '빛의 제국': {
        reasons: [
          '능동적 의미 추구의 부재와 허무한 결말: 『죽음의 수용소에서』나 『싯다르타』처럼 고난 속에서도 스스로 삶의 의미를 선택하는 인물에 깊이 공감하시는 반면, 『빛의 제국』은 "결국 주도권을 잃고 무심한 일상으로 돌아가는 허무함"으로 귀결되어 ★2.5점에 머물렀습니다.'
        ],
        comparison: '선호 인물상(『죽음의 수용소에서』의 능동적 의미 개척) vs ★2.5 『빛의 제국』(주도권을 잃은 무심한 일상 회귀)'
      }
    }
  },

  // 7. 박다희
  'f5zUFxqImWbwYA07OsbJkrqNh6B2': {
    keywords: ['#따뜻한치유와예술', '#관계기반독서', '#감성힐링소설'],
    overallSummary:
      '쌍둥이 언니의 추천으로 앨런 레비의 『테오』(★4.0)를 선정하고 "92점의 초상화가 제 주인을 찾아갈 때마다 치유받는 기분이었습니다"라는 따뜻한 리뷰를 남기셨습니다. 소중한 사람과의 연결을 통해 책을 만나고, 상실과 상처를 예술과 인간적 연대로 치유해 가는 온기 있는 서사에 깊이 공감하시는 스타일입니다.',
    favoriteBooks: [
      {
        rank: 1,
        title: '오베라는 남자',
        author: '프레드릭 배크만',
        genre: '소설',
        axis: 'I',
        reason:
          '『테오』(★4.0)에서 느끼셨던 "상실 이후 타인과의 연결을 통해 다시 삶의 온기를 되찾는 치유"를 가장 완벽하게 담은 작품이자, 게임인트 멤버 전원이 ★3.5~4.0점으로 극찬한 검증된 힐링 소설입니다.',
        basisBooks: ['테오 (★4.0)']
      },
      {
        rank: 2,
        title: '불편한 편의점 (또는 어서 오세요, 휴남동 서점입니다)',
        author: '김호연 / 황보름',
        genre: '소설',
        axis: 'I',
        reason:
          '『테오』의 초상화처럼 일상 속 작은 공간과 매개체를 통해 각자의 상처를 가진 사람들이 치유받는 옴니버스형 소설로, 마음이 따뜻해지는 소설을 찾으시는 다희님께 꼭 맞습니다.',
        basisBooks: ['테오 (★4.0)']
      },
      {
        rank: 3,
        title: '모모',
        author: '미하엘 엔데',
        genre: '소설',
        axis: 'I',
        reason:
          '사람들의 이야기를 진심으로 들어주는 소녀 모모를 통해 관계의 소중함과 마음의 위안을 얻을 수 있는 어른을 위한 동화 같은 명작입니다.',
        basisBooks: ['테오 (★4.0)']
      }
    ],
    expansionBooks: [
      {
        title: '방구석 미술관',
        author: '조원재',
        genre: '인문/사회 (예술교양)',
        targetAxis: 'K',
        targetAxisLabel: '지식 (K) · 감성 (E)',
        reason:
          '현재 독서 DNA가 소설(I, 100%)로 시작 단계에 있습니다. 『테오』에서 "92점의 초상화"라는 회화·예술 소재에 큰 감동을 받으셨던 만큼, 화가들의 삶과 명화 비하인드 스토리를 다정하고 재미있게 풀어낸 이 책을 통해 인문·예술 교양(K·E 축)으로 독서 영역을 자연스럽게 넓히실 수 있습니다.',
        bridgePoint: '『테오』의 초상화·예술 치유 서사 → 화가들의 삶과 명화 인문학으로 확장'
      }
    ],
    highRatingInferences: [
      {
        bookTitle: '테오',
        bookAuthors: '앨런 레비',
        ratingLabel: '★4.0 (최고 평점)',
        category: '소설',
        reviewExcerpt:
          '92점의 초상화가 제 주인을 찾아갈 때마다 치유받는 기분이었습니다. 마음이 따뜻해지는 소설을 보고싶으신 분께 추천하고 싶습니다.',
        inferredReasons: [
          '소중한 사람과의 신뢰에서 출발한 독서 경험: 쌍둥이 언니의 추천으로 선택한 책이라는 점에서, 다희님에게 독서는 사랑하는 사람과의 정서적 교감을 확장하는 매개체입니다.',
          '예술과 선의가 만들어내는 치유의 카타르시스: 92점의 초상화가 각각의 사연을 가진 주인에게 돌아가며 상실의 아픔을 어루만지는 옴니버스식 힐링 구조가 다희님의 따뜻한 감수성과 깊이 맞닿았습니다.'
        ],
        coreFactor: '예술을 매개로 한 상실 치유 + 다정한 인간적 연대'
      }
    ],
    fallbackLowInference: {
      bookTitle: '저평가(2점 이하) 도서 없음',
      bookAuthors: '현재 작성 리뷰 1건 (『테오』 ★4.0)',
      rating: 4.0,
      category: '소설',
      badgeLabel: '2점 이하 도서 없음 · 성향 기반 불호 주의보',
      reviewExcerpt: '92점의 초상화가 제 주인을 찾아갈 때마다 치유받는 기분이었습니다. 마음이 따뜻해지는 소설을 보고싶으신 분께 추천하고 싶습니다.',
      inferredReasons: [
        '현재까지 2점 이하로 평가한 도서가 없으며, 첫 참여 도서인 『테오』에서 매우 높은 만족도(★4.0)를 기록하셨습니다.',
        '데이터 기반 잠재적 불호 요인 추론: 인물 간의 따뜻한 정서적 교류와 치유적 결말을 중시하시므로, 인물들이 감정을 배제한 채 소모되거나 차가운 체제 묘사가 길게 이어지는 하드보일드·디스토피아 소설보다는 휴머니즘 기반의 작품부터 독서 근육을 넓혀가시는 것이 좋습니다.'
      ],
      dataComparison: '선호 성향(★4.0 『테오』: 예술 매개 치유·따뜻한 인간애) vs 잠재적 불호(차가운 소외·과도한 배경 설정 위주 서사)'
    }
  }
}

const kakaoBookCache = new Map<string, { thumbnail: string; url: string; publisher: string }>()

export const useBookRecommendation = () => {
  const enrichWithKakaoBooks = async (
    analysis: UserReadingRecommendationResult | null
  ): Promise<UserReadingRecommendationResult | null> => {
    if (!analysis) return null
    const config = useRuntimeConfig()
    const kakaoKey = (config.public?.kakaoRestApiKey || '').trim()
    if (!kakaoKey) return analysis

    const lookupBook = async (rawTitle: string, rawAuthor?: string) => {
      const cleanTitle = String(rawTitle || '').split('/')[0]?.split('&')[0]?.replace(/[『』]/g, '').trim()
      if (!cleanTitle) return null
      if (kakaoBookCache.has(cleanTitle)) {
        return kakaoBookCache.get(cleanTitle)!
      }
      try {
        const res = await fetch(
          `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(cleanTitle)}&size=5`,
          { headers: { Authorization: `KakaoAK ${kakaoKey}` } }
        )
        if (!res.ok) return null
        const data = await res.json()
        const docs = Array.isArray(data?.documents) ? data.documents : []
        if (docs.length === 0) return null

        const firstAuthorWord = String(rawAuthor || '').split(/[,·/\s]/)[0]?.trim()
        const matched = (firstAuthorWord
          ? docs.find((d: any) => Array.isArray(d.authors) && d.authors.some((a: string) => a.includes(firstAuthorWord)))
          : null) || docs.find((d: any) => d.thumbnail) || docs[0]

        const meta = {
          thumbnail: matched?.thumbnail || '',
          url: matched?.url || '',
          publisher: matched?.publisher || ''
        }
        kakaoBookCache.set(cleanTitle, meta)
        return meta
      } catch {
        return null
      }
    }

    await Promise.all([
      ...(analysis.favoriteBooks || []).map(async (b) => {
        if (b.thumbnail && b.url) return
        const meta = await lookupBook(b.title, b.author)
        if (meta) Object.assign(b, meta)
      }),
      ...(analysis.expansionBooks || []).map(async (b) => {
        if (b.thumbnail && b.url) return
        const meta = await lookupBook(b.title, b.author)
        if (meta) Object.assign(b, meta)
      }),
      ...(analysis.lowRatingInferences || []).map(async (b) => {
        if (b.thumbnail && b.url) return
        const meta = await lookupBook(b.bookTitle, b.bookAuthors)
        if (meta) Object.assign(b, meta)
      }),
      ...(analysis.highRatingInferences || []).map(async (b) => {
        if (b.thumbnail && b.url) return
        const meta = await lookupBook(b.bookTitle, b.bookAuthors)
        if (meta) Object.assign(b, meta)
      })
    ])

    return analysis
  }
  const analyzeUserReadingAndRecommend = (
    reviews: any[],
    posts: any[],
    dna: DNAResult | null,
    userInfo?: { uid?: string; nickname?: string }
  ): UserReadingRecommendationResult | null => {
    const validReviews = Array.isArray(reviews) ? reviews : []
    const bookPosts = Array.isArray(posts)
      ? posts.filter(p => ['도서 추천', '책 리뷰', '만화'].includes(p.category))
      : []

    if (validReviews.length === 0 && bookPosts.length === 0) {
      return null
    }

    const uid = userInfo?.uid || validReviews[0]?.authorUid || bookPosts[0]?.author?.uid || ''
    const curated = uid ? CURATED_USER_PROFILES[uid] : undefined

    // 1. 기본 통계 계산
    const ratedReviews = validReviews.filter(r => typeof r.rating === 'number' && r.rating > 0)
    const avgRating =
      ratedReviews.length > 0
        ? Number((ratedReviews.reduce((acc, r) => acc + r.rating, 0) / ratedReviews.length).toFixed(2))
        : 0

    const sortedByRatingDesc = [...ratedReviews].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    const topRatedBooks = sortedByRatingDesc.slice(0, 3).map(r => ({
      title: r.book?.title || r.bookTitle || r.category || '사이클 도서',
      rating: r.rating,
      category: r.category || '일반'
    }))

    const ratios = dna?.ratios || { I: 0, K: 0, G: 0, E: 0 }

    // 2. 좋아할 만한 책 1, 2, 3순위 구성
    let favoriteBooks: RecommendedBookItem[] = []
    let keywords: string[] = []
    let overallSummary = ''

    if (curated) {
      favoriteBooks = curated.favoriteBooks
      keywords = curated.keywords
      overallSummary = curated.overallSummary
    } else {
      const topAxis = dna?.topAxes?.[0] || 'I'
      keywords = [
        `#${dna?.dnaName || '맞춤독서가'}`,
        avgRating >= 3.8 ? '#높은몰입과공감' : '#신중한비평안목',
        `#${DNA_AXES[topAxis as keyof typeof DNA_AXES]?.label || '상상력'}중심`
      ]
      const bestBookTitle = topRatedBooks[0]?.title ? `『${topRatedBooks[0].title}』(★${topRatedBooks[0].rating})` : '작성하신 리뷰'
      overallSummary = `${bestBookTitle} 등 총 ${validReviews.length}건의 리뷰(평균 ★${avgRating})와 ${bookPosts.length}건의 도서 게시글을 종합 분석한 결과, ${dna?.description || '자신만의 뚜렷한 독서 기준을 가지고 계십니다.'}`

      const dynamicPool: Record<string, RecommendedBookItem[]> = {
        I: [
          {
            rank: 1,
            title: '프로젝트 헤일메리',
            author: '앤디 위어',
            genre: '소설 (SF)',
            axis: 'I',
            reason: `${bestBookTitle}에서 보여주신 서사 몰입도를 극대화할 수 있는 압도적 가독성과 종을 초월한 연대의 소설입니다.`,
            basisBooks: topRatedBooks.slice(0, 2).map(b => `${b.title} (★${b.rating})`)
          },
          {
            rank: 2,
            title: '불안한 사람들',
            author: '프레드릭 배크만',
            genre: '소설',
            axis: 'I',
            reason: '입체적인 인물들의 사연이 유머와 따뜻한 감동으로 교차하며 깊은 여운을 남기는 작품입니다.',
            basisBooks: topRatedBooks.slice(0, 1).map(b => `${b.title} (★${b.rating})`)
          },
          {
            rank: 3,
            title: '지구 끝의 온실',
            author: '김초엽',
            genre: '소설',
            axis: 'I',
            reason: '탄탄한 세계관과 인간에 대한 따뜻한 시선이 조화를 이루어 호불호 없이 빠져들 수 있는 소설입니다.',
            basisBooks: ['독서 DNA 성향 매칭']
          }
        ],
        K: [
          {
            rank: 1,
            title: '자유로부터의 도피',
            author: '에리히 프롬',
            genre: '인문/사회',
            axis: 'K',
            reason: `${bestBookTitle}에서 보여주신 깊이 있는 지적 호기심과 인간 본성에 대한 질문을 명쾌하게 확장해 주는 고전입니다.`,
            basisBooks: topRatedBooks.slice(0, 2).map(b => `${b.title} (★${b.rating})`)
          },
          {
            rank: 2,
            title: '물고기는 존재하지 않는다',
            author: '룰루 밀러',
            genre: '과학/기술 · 에세이',
            axis: 'K',
            reason: '과학적 탐구와 한 인간의 집념 어린 서사가 추리소설처럼 결합된 경이로운 논픽션입니다.',
            basisBooks: topRatedBooks.slice(0, 1).map(b => `${b.title} (★${b.rating})`)
          },
          {
            rank: 3,
            title: '사피엔스',
            author: '유발 하라리',
            genre: '인문/사회',
            axis: 'K',
            reason: '거대한 인류사와 문명의 흐름을 하나의 명쾌한 시각으로 꿰뚫는 지적 쾌감을 선사합니다.',
            basisBooks: ['독서 DNA 성향 매칭']
          }
        ],
        G: [
          {
            rank: 1,
            title: '돈의 심리학',
            author: '모건 하우절',
            genre: '경제/경영',
            axis: 'G',
            reason: '딱딱한 공식 대신 인간의 심리와 태도를 통해 부와 인생의 전략을 통찰력 있게 풀어낸 책입니다.',
            basisBooks: topRatedBooks.slice(0, 2).map(b => `${b.title} (★${b.rating})`)
          },
          {
            rank: 2,
            title: '해빗 (Habit)',
            author: '웬디 우드',
            genre: '자기계발 · 뇌과학',
            axis: 'G',
            reason: '의지력이 아닌 환경과 무의식의 설계를 통해 지속 가능한 성장을 이끌어내는 과학적 지침서입니다.',
            basisBooks: ['독서 DNA 성향 매칭']
          },
          {
            rank: 3,
            title: '퓨처 셀프',
            author: '벤저민 하디',
            genre: '자기계발',
            axis: 'G',
            reason: '미래의 관점에서 현재의 선택과 행동 방향을 명확히 재설계하도록 돕는 책입니다.',
            basisBooks: ['독서 DNA 성향 매칭']
          }
        ],
        E: [
          {
            rank: 1,
            title: '숨결이 바람 될 때',
            author: '폴 칼라니티',
            genre: '시/에세이',
            axis: 'E',
            reason: '삶과 죽음의 경계에서 인간다움과 삶의 의미를 유려한 문장으로 기록한 깊은 울림의 에세이입니다.',
            basisBooks: topRatedBooks.slice(0, 2).map(b => `${b.title} (★${b.rating})`)
          },
          {
            rank: 2,
            title: '다정한 것이 살아남는다',
            author: '브라이언 헤어',
            genre: '인문/사회 · 에세이',
            axis: 'E',
            reason: '공감과 다정함이 어떻게 인류의 가장 강력한 생존 경쟁력이 되었는지 따뜻하게 증명합니다.',
            basisBooks: ['독서 DNA 성향 매칭']
          },
          {
            rank: 3,
            title: '우리가 빛의 속도로 갈 수 없다면',
            author: '김초엽',
            genre: '소설',
            axis: 'E',
            reason: '첨단 기술 사회 속에서도 소외된 존재들의 감정을 섬세하게 어루만지는 감성 문학입니다.',
            basisBooks: ['독서 DNA 성향 매칭']
          }
        ]
      }
      favoriteBooks = dynamicPool[topAxis] || dynamicPool.I!
    }

    // 3. 역량 보완 / 스펙트럼 확장 도서 구성
    let expansionBooks: ExpansionBookItem[] = []
    if (curated && curated.expansionBooks.length > 0) {
      expansionBooks = curated.expansionBooks.map(item => ({
        ...item,
        currentRatioPercent: Math.round((ratios[item.targetAxis] || 0) * 100)
      }))
    } else {
      const axisOrder = ['I', 'K', 'G', 'E']
      const lowestAxis =
        axisOrder.sort((a, b) => (ratios[a] || 0) - (ratios[b] || 0))[0] || 'G'
      const lowestAxisInfo = DNA_AXES[lowestAxis as keyof typeof DNA_AXES]
      expansionBooks = [
        {
          title:
            lowestAxis === 'G'
              ? '생각에 관한 생각'
              : lowestAxis === 'K'
                ? '감정은 어떻게 만들어지는가'
                : lowestAxis === 'E'
                  ? '숨결이 바람 될 때'
                  : '오베라는 남자',
          author:
            lowestAxis === 'G'
              ? '대니얼 카너먼'
              : lowestAxis === 'K'
                ? '리사 펠드먼 배럿'
                : lowestAxis === 'E'
                  ? '폴 칼라니티'
                  : '프레드릭 배크만',
          genre:
            lowestAxis === 'G'
              ? '경제/경영 (행동경제학)'
              : lowestAxis === 'K'
                ? '과학/기술 (뇌과학)'
                : lowestAxis === 'E'
                  ? '시/에세이'
                  : '소설',
          targetAxis: lowestAxis,
          targetAxisLabel: `${lowestAxisInfo?.label || lowestAxis} (${lowestAxis})`,
          currentRatioPercent: Math.round((ratios[lowestAxis] || 0) * 100),
          reason: `현재 독서 DNA에서 상대적으로 비중이 낮은 '${lowestAxisInfo?.label}(${lowestAxis})' 영역을 기존 관심사와 자연스럽게 연결하여 독서 스펙트럼을 넓혀줄 징검다리 도서입니다.`,
          bridgePoint: `주력 성향(${dna?.dnaName || '현재 선호 장르'}) → ${lowestAxisInfo?.label}(${lowestAxis}) 역량으로 확장`
        }
      ]
    }

    // 4. 평가 2점 이하(및 저평가 ≤2.5점) 도서 불호 원인 추론
    const strictUnderTwoReviews = ratedReviews.filter(r => r.rating <= 2.0)
    const lowReviews = ratedReviews
      .filter(r => r.rating <= 2.5)
      .sort((a, b) => a.rating - b.rating)

    const lowRatingInferences: LowRatingInferenceItem[] = []

    if (lowReviews.length > 0) {
      lowReviews.forEach(r => {
        const bTitle = r.book?.title || r.bookTitle || r.category || '사이클 도서'
        const bAuthors = Array.isArray(r.book?.authors)
          ? r.book.authors.join(', ')
          : r.bookAuthors || ''
        const isStrict = r.rating <= 2.0

        let matchedSpecific: { reasons: string[]; comparison: string } | undefined
        if (curated?.specificLowInferences) {
          const matchedKey = Object.keys(curated.specificLowInferences).find(
            k => bTitle.includes(k) || k.includes(bTitle)
          )
          if (matchedKey) {
            matchedSpecific = curated.specificLowInferences[matchedKey]
          }
        }

        if (matchedSpecific) {
          lowRatingInferences.push({
            bookTitle: bTitle,
            bookAuthors: bAuthors,
            rating: r.rating,
            category: r.category || '일반',
            isStrictUnderTwo: isStrict,
            badgeLabel: isStrict ? `★${r.rating} (2점 이하 집중 분석)` : `★${r.rating} (저평가 도서 분석)`,
            reviewExcerpt: r.content || '',
            inferredReasons: matchedSpecific.reasons,
            dataComparison: matchedSpecific.comparison
          })
        } else {
          const content = String(r.content || '')
          const reasons: string[] = []
          if (content.includes('초반') || content.includes('느리') || content.includes('지루') || content.includes('포기')) {
            reasons.push(
              '초반 서사 몰입도 및 호흡 불일치: 리뷰에서 언급하신 것처럼 초반부 배경 설명이 길거나 전개 템포가 느릴 때, 평소 선호하시는 속도감 있는 몰입 방식과 충돌이 발생했습니다.'
            )
          }
          if (content.includes('배경 지식') || content.includes('용어') || content.includes('어려') || content.includes('복잡')) {
            reasons.push(
              '사전 배경지식 장벽 및 현학적 전개: 핵심 주제를 명쾌하게 전달하기보다 생소한 개념이나 복잡한 서술 구조를 요구하여 독서 피로도가 높았던 것으로 추론됩니다.'
            )
          }
          if (reasons.length === 0) {
            const bestRef = topRatedBooks[0] ? `『${topRatedBooks[0].title}』(★${topRatedBooks[0].rating})` : '고득점 선호 도서'
            reasons.push(
              `고득점 도서(${bestRef})에서 중시하셨던 '깊이 있는 서사적 울림·입체적 공감' 대비, 이 책은 전달 방식이 단편적이거나 정서적 결이 달라 만족도가 낮았던 것으로 분석됩니다.`
            )
          }
          lowRatingInferences.push({
            bookTitle: bTitle,
            bookAuthors: bAuthors,
            rating: r.rating,
            category: r.category || '일반',
            isStrictUnderTwo: isStrict,
            badgeLabel: isStrict ? `★${r.rating} (2점 이하 집중 분석)` : `★${r.rating} (저평가 도서 분석)`,
            reviewExcerpt: content,
            inferredReasons: reasons,
            dataComparison: `고득점 선호 도서(${topRatedBooks[0]?.title || '주력 장르'} ★${topRatedBooks[0]?.rating || 4.0}) vs 저평가 도서(${bTitle} ★${r.rating})`
          })
        }
      })
    } else if (curated?.fallbackLowInference) {
      lowRatingInferences.push({
        ...curated.fallbackLowInference,
        isStrictUnderTwo: false
      })
    } else if (ratedReviews.length > 0) {
      const lowest = [...ratedReviews].sort((a, b) => a.rating - b.rating)[0]
      const bTitle = lowest.book?.title || lowest.bookTitle || lowest.category || '사이클 도서'
      lowRatingInferences.push({
        bookTitle: bTitle,
        bookAuthors: Array.isArray(lowest.book?.authors) ? lowest.book.authors.join(', ') : '',
        rating: lowest.rating,
        category: lowest.category || '일반',
        isStrictUnderTwo: false,
        badgeLabel: `2점 이하 도서 없음 · 상대적 최저점(★${lowest.rating}) 분석`,
        reviewExcerpt: lowest.content || '',
        inferredReasons: [
          `현재 2점 이하로 평가한 도서는 없으며, 작성하신 리뷰 중 상대적으로 가장 낮은 평점은 『${bTitle}』(★${lowest.rating})입니다.`,
          '전반적으로 긍정적인 독서 경험을 유지하고 계시나, 인물의 감정선보다 배경 묘사나 추상적 설명이 앞서는 구성에서는 상대적으로 흥미가 반감되는 경향이 나타납니다.'
        ],
        dataComparison: `최고점 도서(★${topRatedBooks[0]?.rating || 4.0}) 대비 상대적 아쉬움 포인트 분석`
      })
    }

    // 5. 고평가 도서(★4.0 이상 및 추천글) 호평 원인 추론
    let highRatingInferences: HighRatingInferenceItem[] = []
    if (curated && curated.highRatingInferences?.length > 0) {
      // 새로 추가된 고평점 리뷰(>= 4.0)가 기존 큐레이션에 없으면 동적으로 맨 앞에 병합
      const existingTitles = curated.highRatingInferences.map(h => h.bookTitle)
      const newlyAddedHigh = sortedByRatingDesc
        .filter(r => r.rating >= 4.0)
        .filter(r => {
          const bTitle = r.book?.title || r.bookTitle || ''
          return bTitle && !existingTitles.some(et => et.includes(bTitle) || bTitle.includes(et))
        })
        .map(r => {
          const bTitle = r.book?.title || r.bookTitle || r.category || '사이클 도서'
          const bAuthors = Array.isArray(r.book?.authors) ? r.book.authors.join(', ') : ''
          return {
            bookTitle: bTitle,
            bookAuthors: bAuthors,
            ratingLabel: `★${r.rating} (신규 고평가 리뷰)`,
            category: r.category || '일반',
            reviewExcerpt: r.content || '',
            inferredReasons: [
              `최근 새로 남기신 고득점 리뷰: 『${bTitle}』의 서사 전개와 주제의식이 본인의 독서 성향(${dna?.dnaName || '주력 성향'})과 깊이 맞닿아 높은 만족도를 기록했습니다.`,
              `지속적인 취향 확장: 기존 선호 도서들의 핵심 몰입 요인이 이 작품에서도 일관되게 확인됩니다.`
            ],
            coreFactor: `신규 리뷰 반영 · ${dna?.dnaName || '맞춤'} 취향 적중`
          }
        })
      highRatingInferences = [...newlyAddedHigh, ...curated.highRatingInferences]
    } else {
      const highReviews = sortedByRatingDesc.filter(r => r.rating >= 3.5).slice(0, 2)
      highRatingInferences = highReviews.map(r => {
        const bTitle = r.book?.title || r.bookTitle || r.category || '사이클 도서'
        const bAuthors = Array.isArray(r.book?.authors) ? r.book.authors.join(', ') : ''
        return {
          bookTitle: bTitle,
          bookAuthors: bAuthors,
          ratingLabel: `★${r.rating} (고평가 도서)`,
          category: r.category || '일반',
          reviewExcerpt: r.content || '',
          inferredReasons: [
            `높은 서사 몰입과 공감: 인물의 감정선과 주제의식이 본인의 독서 DNA(${dna?.dnaName || '주력 성향'})와 깊이 공명했습니다.`,
            '오래 남는 독서 여운: 단순한 정보 전달을 넘어 독서 후에도 삶과 인간에 대해 곱씹어볼 수 있는 질문을 남긴 점이 고평가의 핵심 요인입니다.'
          ],
          coreFactor: `${dna?.dnaName || '주력 성향'} 맞춤형 서사 몰입 + 깊은 여운`
        }
      })
    }

    return {
      totalReviews: validReviews.length,
      totalBookPosts: bookPosts.length,
      avgRating,
      topRatedBooks,
      keywords,
      overallSummary,
      favoriteBooks,
      expansionBooks,
      lowRatingInferences,
      highRatingInferences,
      hasStrictUnderTwo: strictUnderTwoReviews.length > 0
    }
  }

  /**
   * 리뷰 및 도서 게시글 목록으로부터 고유 데이터 서명(Signature) 생성
   * 새 리뷰/게시글이 추가·수정·삭제되면 서명이 즉시 변경되어 AI 재분석 트리거로 작동합니다.
   */
  const computeReadingSignature = (reviews: any[], posts: any[]): string => {
    const revItems = (Array.isArray(reviews) ? reviews : [])
      .map(r => `${r.id || r.bookTitle || ''}:${r.rating || 0}:${String(r.content || '').length}`)
      .sort()
      .join('|')

    const postItems = (Array.isArray(posts) ? posts : [])
      .filter(p => ['도서 추천', '책 리뷰', '만화'].includes(p.category))
      .map(p => `${p.id || p.title || ''}:${String(p.content || '').length}`)
      .sort()
      .join('|')

    return `rev(${revItems})_post(${postItems})`
  }

  /**
   * 방법 B: Firestore 캐시 조회 + 새 리뷰 감지 시 Gemini API 호출 후 DB 자동 저장
   */
  const fetchOrGenerateAIAnalysis = async (params: {
    uid: string
    nickname: string
    reviews: any[]
    posts: any[]
    dna: DNAResult | null
    forceRefresh?: boolean
    apiKey?: string
  }): Promise<{
    analysis: UserReadingRecommendationResult | null
    source: 'ai-cache' | 'ai-fresh' | 'fallback'
    updatedAt?: string
    needsApiKey?: boolean
    errorMessage?: string
  }> => {
    const { uid, nickname, reviews, posts, dna, forceRefresh = false, apiKey = '' } = params
    const baseFallback = analyzeUserReadingAndRecommend(reviews, posts, dna, { uid, nickname })
    if (!baseFallback || !uid) {
      return { analysis: baseFallback, source: 'fallback' }
    }

    const currentSignature = computeReadingSignature(reviews, posts)
    const { $firebase } = useNuxtApp()
    const firestore = ($firebase as any)?.firestore

    // 1. 강제 새로고침이 아니면 Firestore에 저장된 AI 분석 캐시 확인
    if (!forceRefresh && firestore) {
      try {
        const cacheRef = doc(firestore, 'users', uid, 'notification_states', 'ai_reading_analysis')
        const snap = await getDoc(cacheRef)
        if (snap.exists()) {
          const cached = snap.data()
          // 리뷰/게시글 서명이 동일하면 캐시된 AI 분석 결과를 즉시 반환 (API 재호출 없음)
          if (cached?.signature === currentSignature && cached?.result) {
            const ratios = dna?.ratios || { I: 0, K: 0, G: 0, E: 0 }
            const mergedResult: UserReadingRecommendationResult = {
              ...baseFallback,
              ...cached.result,
              totalReviews: baseFallback.totalReviews,
              totalBookPosts: baseFallback.totalBookPosts,
              avgRating: baseFallback.avgRating,
              topRatedBooks: baseFallback.topRatedBooks,
              expansionBooks: (cached.result.expansionBooks || baseFallback.expansionBooks).map((item: any) => ({
                ...item,
                currentRatioPercent: Math.round((ratios[item.targetAxis] || 0) * 100)
              }))
            }
            return {
              analysis: mergedResult,
              source: 'ai-cache',
              updatedAt: cached.updatedAt
            }
          }
        }
      } catch (err) {
        console.warn('[AI Analysis Cache Read Warning]:', err)
      }
    }

    // 2. 캐시가 없거나 새 리뷰가 추가되어 서명이 달라졌거나(또는 강제 새로고침 시) Gemini API 호출
    const savedLocalKey = typeof window !== 'undefined' ? (localStorage.getItem('gameint_gemini_api_key') || '') : ''
    const effectiveKey = apiKey || savedLocalKey

    try {
      const response: any = await $fetch('/api/analyze-reading', {
        method: 'POST',
        body: {
          uid,
          nickname,
          dna,
          reviews,
          posts,
          apiKey: effectiveKey
        }
      })

      if (response?.success && response?.result) {
        const ratios = dna?.ratios || { I: 0, K: 0, G: 0, E: 0 }
        const freshAnalysis: UserReadingRecommendationResult = {
          ...baseFallback,
          ...response.result,
          totalReviews: baseFallback.totalReviews,
          totalBookPosts: baseFallback.totalBookPosts,
          avgRating: baseFallback.avgRating,
          topRatedBooks: baseFallback.topRatedBooks,
          expansionBooks: (response.result.expansionBooks || baseFallback.expansionBooks).map((item: any) => ({
            ...item,
            currentRatioPercent: Math.round((ratios[item.targetAxis] || 0) * 100)
          }))
        }

        // Firestore에 새로운 AI 분석 결과 + 현재 리뷰 서명(signature) 저장
        if (firestore) {
          try {
            const cacheRef = doc(firestore, 'users', uid, 'notification_states', 'ai_reading_analysis')
            await setDoc(cacheRef, {
              signature: currentSignature,
              updatedAt: response.generatedAt || new Date().toISOString(),
              result: response.result
            })
          } catch (writeErr) {
            console.warn('[AI Analysis Cache Write Warning]:', writeErr)
          }
        }

        return {
          analysis: freshAnalysis,
          source: 'ai-fresh',
          updatedAt: response.generatedAt
        }
      }
    } catch (apiErr: any) {
      const statusMsg = apiErr?.data?.statusMessage || apiErr?.statusMessage || ''
      const msg = apiErr?.data?.message || apiErr?.message || 'AI 호출 중 오류가 발생했습니다.'
      if (statusMsg === 'MISSING_GEMINI_API_KEY') {
        return {
          analysis: baseFallback,
          source: 'fallback',
          needsApiKey: true,
          errorMessage: msg
        }
      }
      return {
        analysis: baseFallback,
        source: 'fallback',
        errorMessage: msg
      }
    }

    return { analysis: baseFallback, source: 'fallback' }
  }

  return {
    analyzeUserReadingAndRecommend,
    enrichWithKakaoBooks,
    computeReadingSignature,
    fetchOrGenerateAIAnalysis
  }
}
