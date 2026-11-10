import { defineEventHandler, readBody, createError } from 'h3'
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  const nickname = body?.nickname || '회원'
  const dna = body?.dna || null
  const reviews = Array.isArray(body?.reviews) ? body.reviews : []
  const posts = Array.isArray(body?.posts) ? body.posts : []

  const apiKey = (
    config.public?.firebaseApiKey ||
    config.geminiApiKey ||
    process.env.FIREBASE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim()

  const projectId = (config.public?.firebaseProjectId || process.env.FIREBASE_PROJECT_ID || 'gameint-131d5').trim()
  const appId = (config.public?.firebaseAppId || process.env.FIREBASE_APP_ID || '1:210427239265:web:d6bccd7fa3bf43f582c320').trim()

  const reviewSummaries = reviews.map((r: any, idx: number) => {
    const title = r.book?.title || r.bookTitle || r.category || `도서 ${idx + 1}`
    const authors = Array.isArray(r.book?.authors) ? r.book.authors.join(', ') : (r.bookAuthors || '')
    return `- [${idx + 1}] 도서명: 『${title}』 (${authors || '저자 미상'}) | 장르: ${r.category || '일반'} | 평점: ★${r.rating || 0} | 리뷰 내용: "${String(r.content || '').replace(/\s+/g, ' ').trim()}"`
  }).join('\n')

  const postSummaries = posts
    .filter((p: any) => ['도서 추천', '책 리뷰', '만화'].includes(p.category))
    .map((p: any, idx: number) => {
      const bTitle = p.bookTitle || p.book?.title || p.title || `게시글 ${idx + 1}`
      const cleanText = String(p.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)
      return `- [게시글 ${idx + 1}] 분류: ${p.category} | 도서/제목: 『${bTitle}』 (${p.bookGenre || '일반'}) | 내용 요약: "${cleanText}"`
    }).join('\n')

  const dnaSummary = dna
    ? `독서 DNA 유형: ${dna.dnaName}(${dna.dnaType}), 설명: ${dna.description}, 축별 비중: I(상상력)=${Math.round((dna.ratios?.I || 0) * 100)}%, K(지식)=${Math.round((dna.ratios?.K || 0) * 100)}%, G(성장)=${Math.round((dna.ratios?.G || 0) * 100)}%, E(감성)=${Math.round((dna.ratios?.E || 0) * 100)}%`
    : '독서 DNA 정보 없음'

  const prompt = `당신은 독서 모임 회원의 리뷰·평점·도서 추천글을 정밀 분석하는 'AI 독서 큐레이터'입니다.
아래는 '${nickname}' 님의 실제 독서 기록입니다.

[독서 DNA 요약]
${dnaSummary}

[작성한 사이클 리뷰 목록 (총 ${reviews.length}건)]
${reviewSummaries || '작성한 리뷰 없음'}

[작성한 도서 관련 게시글 목록]
${postSummaries || '작성한 도서 게시글 없음'}

위 데이터를 바탕으로 다음 5가지 질문(A1~A5)에 대한 맞춤형 분석 결과를 JSON 스키마에 맞춰 한국어로 작성해 주세요.
주의사항:
1. 반드시 유저가 실제로 읽은 책 제목, 별점, 리뷰 속 문장/표현을 근거로 들어 구체적이고 설득력 있게 작성하세요.
2. 가독성을 위해 문장은 간결하고 명확하게 작성하세요.
3. inferredReasons 배열의 각 항목은 반드시 "핵심 요인 소제목: 구체적인 데이터 기반 추론 설명" 형식(콜론 ':' 포함)으로 작성하세요.
4. favoriteBooks는 유저가 아직 읽지 않은 실제 출간 명저 중 1, 2, 3순위로 정확히 3권을 추천하세요.
5. expansionBooks는 현재 유저의 독서 DNA에서 비중이 낮거나 보완하면 좋은 영역을 넓혀줄 실제 도서 1권을 추천하세요.
6. lowRatingInferences는 평점이 2.0점 이하(또는 2.5점 이하, 없으면 가장 낮은 평점을 준 도서)인 책에 대해 왜 맞지 않았는지 리뷰 내용을 바탕으로 추론하세요.
7. highRatingInferences는 평점이 4.0점 이상(또는 가장 높은 평점을 준 도서 및 인생 책 추천글)인 책에 대해 왜 높게 평가했는지 리뷰 내용을 바탕으로 추론하세요.`

  const responseSchema = Schema.object({
    properties: {
      keywords: Schema.array({
        description: '#으로 시작하는 핵심 독서 성향 해시태그 4개',
        items: Schema.string()
      }),
      overallSummary: Schema.string({
        description: 'A1. 유저의 리뷰와 평점을 종합한 독서 양태 분석 요약 (2~3문장)'
      }),
      favoriteBooks: Schema.array({
        description: 'A2. 유저가 좋아할 만한 책 1, 2, 3순위 추천 (3권)',
        items: Schema.object({
          properties: {
            rank: Schema.integer(),
            title: Schema.string(),
            author: Schema.string(),
            genre: Schema.string(),
            axis: Schema.string(),
            reason: Schema.string(),
            basisBooks: Schema.array({ items: Schema.string() })
          }
        })
      }),
      expansionBooks: Schema.array({
        description: 'A3. 취향에 맞으면서 독서 스펙트럼을 확장할 만한 책 추천 (1권)',
        items: Schema.object({
          properties: {
            title: Schema.string(),
            author: Schema.string(),
            genre: Schema.string(),
            targetAxis: Schema.string({ description: 'I, K, G, E 중 하나' }),
            targetAxisLabel: Schema.string({ description: '예: 성장 (G) · 경제/경영' }),
            reason: Schema.string(),
            bridgePoint: Schema.string({ description: '예: 『기존 선호 도서』의 관심사 → 확장 도서 영역으로 연결' })
          }
        })
      }),
      lowRatingInferences: Schema.array({
        description: 'A4. 저평가 도서(★2.0 이하 또는 상대적 최저점) 불호 원인 추론 (1~2건)',
        items: Schema.object({
          properties: {
            bookTitle: Schema.string(),
            bookAuthors: Schema.string(),
            rating: Schema.number(),
            category: Schema.string(),
            isStrictUnderTwo: Schema.boolean(),
            badgeLabel: Schema.string(),
            reviewExcerpt: Schema.string(),
            inferredReasons: Schema.array({
              description: '"핵심 소제목: 상세 설명" 형태의 추론 이유 2개',
              items: Schema.string()
            }),
            dataComparison: Schema.string()
          }
        })
      }),
      highRatingInferences: Schema.array({
        description: 'A5. 고평가 도서(★4.0 이상 또는 최고점 도서) 선호 원인 추론 (1~2건)',
        items: Schema.object({
          properties: {
            bookTitle: Schema.string(),
            bookAuthors: Schema.string(),
            ratingLabel: Schema.string(),
            category: Schema.string(),
            reviewExcerpt: Schema.string(),
            inferredReasons: Schema.array({
              description: '"핵심 소제목: 상세 설명" 형태의 추론 이유 2개',
              items: Schema.string()
            }),
            coreFactor: Schema.string()
          }
        })
      })
    }
  })

  try {
    const firebaseApp = getApps().length > 0
      ? getApp()
      : initializeApp({ apiKey, projectId, appId })

    const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() })
    const model = getGenerativeModel(ai, {
      model: 'gemini-3.8-flash',
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema
      }
    })

    const result = await model.generateContent(prompt)
    const rawText = result.response.text()
    const parsed = JSON.parse(rawText)

    // Kakao Book API 연동: AI가 추천/분석한 도서에 표지 이미지(thumbnail)와 상세 링크(url) 자동 매칭
    const kakaoKey = (
      config.public?.kakaoRestApiKey ||
      process.env.NUXT_PUBLIC_KAKAO_REST_API_KEY ||
      ''
    ).trim()

    if (kakaoKey) {
      const fetchKakaoMeta = async (rawTitle: string, rawAuthor?: string) => {
        const cleanTitle = String(rawTitle || '').split('/')[0]?.split('&')[0]?.replace(/[『』]/g, '').trim()
        if (!cleanTitle) return null
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
          return {
            thumbnail: matched?.thumbnail || '',
            url: matched?.url || '',
            publisher: matched?.publisher || ''
          }
        } catch {
          return null
        }
      }

      await Promise.all([
        ...(Array.isArray(parsed.favoriteBooks)
          ? parsed.favoriteBooks.map(async (b: any) => {
              const meta = await fetchKakaoMeta(b.title, b.author)
              if (meta) Object.assign(b, meta)
            })
          : []),
        ...(Array.isArray(parsed.expansionBooks)
          ? parsed.expansionBooks.map(async (b: any) => {
              const meta = await fetchKakaoMeta(b.title, b.author)
              if (meta) Object.assign(b, meta)
            })
          : []),
        ...(Array.isArray(parsed.lowRatingInferences)
          ? parsed.lowRatingInferences.map(async (b: any) => {
              const meta = await fetchKakaoMeta(b.bookTitle, b.bookAuthors)
              if (meta) Object.assign(b, meta)
            })
          : []),
        ...(Array.isArray(parsed.highRatingInferences)
          ? parsed.highRatingInferences.map(async (b: any) => {
              const meta = await fetchKakaoMeta(b.bookTitle, b.bookAuthors)
              if (meta) Object.assign(b, meta)
            })
          : [])
      ])
    }

    return {
      success: true,
      model: 'gemini-3.8-flash',
      generatedAt: new Date().toISOString(),
      result: parsed
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_AI_ERROR',
      message: err?.message || 'Gemini AI 분석 생성 중 오류가 발생했습니다.'
    })
  }
})
