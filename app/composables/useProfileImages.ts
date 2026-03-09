/**
 * 프로필 이미지 메타데이터 정의
 *
 * unlock_type:
 *   'default'  - 누구나 사용 가능
 *   'tier'     - 특정 티어 이상 해금
 *   'quest'    - 특정 퀘스트 달성 해금
 *
 * tiers: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
 * quest: { type, count } — 달성 조건
 */
export interface ProfileImageMeta {
  id: string           // 파일명(확장자 제외), Firestore에 저장
  path: string         // 실제 이미지 경로 (nuxt asset)
  label: string        // 표시 이름
  unlockType: 'default' | 'tier' | 'quest'
  tier?: string        // unlockType === 'tier' 일 때 필요한 최소 티어
  quest?: { type: 'posts' | 'comments'; count: number }
}

// 티어 순서 (숫자가 낮을수록 낮은 티어)
export const TIER_ORDER: Record<string, number> = {
  Bronze: 1, Silver: 2, Gold: 3, Platinum: 4, Diamond: 5, Master: 6, Grandmaster: 7, Challenger: 8
}

export const PROFILE_IMAGES: ProfileImageMeta[] = [
  // ── 기본 제공 (누구나) ──────────────────────────────────────
  { id: 'default_01', path: '/images/profile_image/default_01.webp', label: '기본 1', unlockType: 'default' },
  { id: 'default_02', path: '/images/profile_image/default_02.webp', label: '기본 2', unlockType: 'default' },
  { id: 'default_03', path: '/images/profile_image/default_03.webp', label: '기본 3', unlockType: 'default' },
  { id: 'default_04', path: '/images/profile_image/default_04.webp', label: '기본 4', unlockType: 'default' },
  { id: 'default_05', path: '/images/profile_image/default_05.webp', label: '기본 5', unlockType: 'default' },
  { id: 'default_06', path: '/images/profile_image/default_06.webp', label: '기본 6', unlockType: 'default' },
  { id: 'default_07', path: '/images/profile_image/default_07.webp', label: '기본 7', unlockType: 'default' },

  // ── 퀘스트 해금 ────────────────────────────────────────────
  { id: 'default_08', path: '/images/profile_image/default_08.webp', label: '첫 게시글',   unlockType: 'quest', quest: { type: 'posts',    count: 1  } },
  { id: 'default_09', path: '/images/profile_image/default_09.webp', label: '게시글 5개',  unlockType: 'quest', quest: { type: 'posts',    count: 5  } },
  { id: 'default_10', path: '/images/profile_image/default_10.webp', label: '게시글 10개', unlockType: 'quest', quest: { type: 'posts',    count: 10 } },
  { id: 'default_11', path: '/images/profile_image/default_11.webp', label: '게시글 20개', unlockType: 'quest', quest: { type: 'posts',    count: 20 } },
  { id: 'default_12', path: '/images/profile_image/default_12.webp', label: '첫 댓글',    unlockType: 'quest', quest: { type: 'comments', count: 1  } },
  { id: 'default_13', path: '/images/profile_image/default_13.webp', label: '댓글 10개',  unlockType: 'quest', quest: { type: 'comments', count: 10 } },
  { id: 'default_14', path: '/images/profile_image/default_14.webp', label: '댓글 30개',  unlockType: 'quest', quest: { type: 'comments', count: 30 } },
  { id: 'default_15', path: '/images/profile_image/default_15.webp', label: '댓글 50개',  unlockType: 'quest', quest: { type: 'comments', count: 50 } },

  // ── 티어 해금 ───────────────────────────────────────────────
  { id: 'default_16', path: '/images/profile_image/default_16.webp', label: 'Silver 해금',   unlockType: 'tier', tier: 'Silver'   },
  { id: 'default_17', path: '/images/profile_image/default_17.webp', label: 'Silver 해금',   unlockType: 'tier', tier: 'Silver'   },
  { id: 'default_18', path: '/images/profile_image/default_18.webp', label: 'Silver 해금',   unlockType: 'tier', tier: 'Silver'   },
  { id: 'default_19', path: '/images/profile_image/default_19.webp', label: 'Gold 해금',     unlockType: 'tier', tier: 'Gold'     },
  { id: 'default_20', path: '/images/profile_image/default_20.webp', label: 'Gold 해금',     unlockType: 'tier', tier: 'Gold'     },
  { id: 'default_21', path: '/images/profile_image/default_21.webp', label: 'Gold 해금',     unlockType: 'tier', tier: 'Gold'     },
  { id: 'default_22', path: '/images/profile_image/default_22.webp', label: 'Platinum 해금', unlockType: 'tier', tier: 'Platinum' },
  { id: 'default_23', path: '/images/profile_image/default_23.webp', label: 'Platinum 해금', unlockType: 'tier', tier: 'Platinum' },
  { id: 'default_24', path: '/images/profile_image/default_24.webp', label: 'Platinum 해금', unlockType: 'tier', tier: 'Platinum' },
  { id: 'default_25', path: '/images/profile_image/default_25.webp', label: 'Diamond 해금',  unlockType: 'tier', tier: 'Diamond'  },
  { id: 'default_26', path: '/images/profile_image/default_26.webp', label: 'Diamond 해금',  unlockType: 'tier', tier: 'Diamond'  },
  { id: 'default_27', path: '/images/profile_image/default_27.webp', label: 'Diamond 해금',  unlockType: 'tier', tier: 'Diamond'  },
  { id: 'default_28', path: '/images/profile_image/default_28.webp', label: 'Diamond 해금',  unlockType: 'tier', tier: 'Diamond'  },
]

/**
 * 현재 유저가 특정 이미지를 해금했는지 확인
 */
export function isImageUnlocked(
  image: ProfileImageMeta,
  userData: { tier?: string; postCount?: number; commentCount?: number }
): boolean {
  if (image.unlockType === 'default') return true

  if (image.unlockType === 'tier' && image.tier) {
    const userTierLevel = TIER_ORDER[userData.tier || 'Bronze'] ?? 1
    const requiredTierLevel = TIER_ORDER[image.tier] ?? 99
    return userTierLevel >= requiredTierLevel
  }

  if (image.unlockType === 'quest' && image.quest) {
    const { type, count } = image.quest
    if (type === 'posts')    return (userData.postCount    ?? 0) >= count
    if (type === 'comments') return (userData.commentCount ?? 0) >= count
  }

  return false
}

/**
 * 이미지 ID로 경로 반환. 없으면 기본 이미지 경로
 */
export function getProfileImagePath(imageId: string | undefined | null): string {
  const found = PROFILE_IMAGES.find(img => img.id === imageId)
  return found?.path ?? PROFILE_IMAGES[0]!.path
}
