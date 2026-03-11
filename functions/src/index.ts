import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { EXP_CONFIG } from "./shared/expConfig";

admin.initializeApp();
const db = admin.firestore();

// ── KST 변환 유틸 ──────────────────────────────────────────────
const getKstDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstOffset = 9 * 60 * 60 * 1000;
  return new Date(utc + kstOffset).toISOString().split("T")[0];
};

// 1. 프로필 업데이트 시 과거 게시글/댓글 동기화
/*
export const onUserProfileUpdate = functions
  .region("asia-northeast3") // 서울 리전
  ...
    return null;
  });
*/

// ── 알림 생성 헬퍼 ──────────────────────────────────────────────
async function createNotification(params: {
  recipientId?: string; // 생략 시 global_notifications에 저장
  type: 'LIKE' | 'COMMENT' | 'TIER_UP' | 'CYCLE_PHASE';
  title: string;
  message: string;
  link?: string;
}) {
  const notificationData = {
    ...params,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isRead: false
  };

  if (params.recipientId) {
    // 개인 알림
    await db.collection("users").doc(params.recipientId).collection("notifications").add(notificationData);
  } else {
    // 전역 알림 (비용 최적화: 문서 1개 고정)
    await db.collection("global_notifications").add(notificationData);
  }
}


/**
 * 2. Helper function to reward EXP to a user and handle level-ups.
 */
async function rewardExp(userId: string, action: keyof typeof EXP_CONFIG.REWARDS | 'MANUAL' | 'CYCLE_REVIEW', manualAmount?: number, bookGenre?: string, isDecrement = false) {
  console.log(`[rewardExp] ENTER: userId=${userId}, action=${action}, isDecrement=${isDecrement}`);
  const userRef = db.collection("users").doc(userId);
  const today = getKstDate();

  try {
    await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        console.warn(`[rewardExp] User ${userId} not found`);
        return;
      }

      const userData = userDoc.data() || {};
      console.log(`[rewardExp] Current Data: exp=${userData.exp}, level=${userData.level}, lastAttendance=${userData.expTracker?.lastAttendanceDate}`);
      
      let currentExp = Number(userData.exp) || 0;
      let currentLevel = Number(userData.level) || 1;
      const expTracker = userData.expTracker || {};

      let expAmount = 0;
      let expBlocked = false;

      if (action === 'MANUAL') {
        expAmount = Number(manualAmount) || 0;
      } else {
        expAmount = Number(EXP_CONFIG.REWARDS[action]) || 0;

        if (action === 'POST_GENERAL') {
          if (expTracker.lastPostDate === today) {
            expBlocked = true;
          } else {
            expTracker.lastPostDate = today;
          }
        } else if (action === 'POST_RECOMMEND') {
          if (expTracker.lastRecommendBookDate === today) {
            expBlocked = true;
          } else {
            expTracker.lastRecommendBookDate = today;
          }
        } else if (action === 'COMMENT') {
          const lastDate = expTracker.lastCommentDate || "";
          let countToday = (lastDate === today) ? Number(expTracker.commentCountToday || 0) : 0;
          if (countToday >= EXP_CONFIG.LIMITS.COMMENT_PER_DAY) {
            expBlocked = true;
          } else {
            expTracker.lastCommentDate = today;
            expTracker.commentCountToday = countToday + 1;
          }
        }
      }

      const updateData: any = {};
      
      // Exp / Level 계산 (차감 시에는 스킵)
      if (!isDecrement && expAmount > 0 && !expBlocked) {
        console.log(`[rewardExp] Adding ${expAmount} EXP to ${currentExp}`);
        currentExp += expAmount;
        while (currentExp >= EXP_CONFIG.getNextLevelExp(currentLevel + 1) && currentLevel < 100) {
          const reqExp = EXP_CONFIG.getNextLevelExp(currentLevel + 1);
          console.log(`[rewardExp] Level Up! ${currentLevel} -> ${currentLevel + 1} (Req: ${reqExp})`);
          currentExp -= reqExp;
          currentLevel++;
        }
        updateData.exp = currentExp;
        updateData.level = currentLevel;
        updateData.tier = EXP_CONFIG.getTier(currentLevel);
      }

      // Tracker 업데이트 (차감 시에는 스킵)
      if (!isDecrement && expTracker) {
        Object.keys(expTracker).forEach(key => {
          updateData[`expTracker.${key}`] = expTracker[key];
        });
      }

      // DNA 증분/차감
      if (bookGenre || action === 'POST_RECOMMEND' || action === 'CYCLE_REVIEW') {
        const genreToMap = bookGenre || (action === 'POST_RECOMMEND' ? '도서 추천' : ''); 
        if (genreToMap) {
          const CATEGORY_MAPPING: Record<string, string> = {
            '소설': 'I', '자기계발': 'G', '경제/경영': 'G', '인문/사회': 'K', '과학/기술': 'K', '시/에세이': 'E', '만화': 'I',
            '도서 추천': 'G', '책 리뷰': 'I', '책추천': 'G', '도서추천': 'G'
          };
          const axis = CATEGORY_MAPPING[genreToMap];
          if (axis) {
            updateData[`dna.scores.${axis}`] = admin.firestore.FieldValue.increment(isDecrement ? -1 : 1);
          }
        }
      }

      // 카운터 및 활동량 업데이트
      if (action === 'POST_GENERAL' || action === 'POST_RECOMMEND') {
        updateData.postCount = admin.firestore.FieldValue.increment(isDecrement ? -1 : 1);
        updateData.activityCount = admin.firestore.FieldValue.increment(isDecrement ? -1 : 1);
      } else if (action === 'CYCLE_REVIEW') {
        updateData.activityCount = admin.firestore.FieldValue.increment(isDecrement ? -1 : 1);
      } else if (!isDecrement) {
        // 댓글/좋아요 등은 점수 차감 로직이 별도 트리거에 있으므로 여기서는 생성 시에만 처리
        if (action === 'COMMENT') {
           updateData.commentCount = admin.firestore.FieldValue.increment(1);
           updateData.activityCount = admin.firestore.FieldValue.increment(1);
        } else if (action === 'LIKE_RECEIVED') {
           updateData.likesReceivedCount = admin.firestore.FieldValue.increment(1);
        } else if (action === 'CYCLE_WIN') {
           updateData.selectionCount = admin.firestore.FieldValue.increment(1);
        }
      }

      console.log(`[rewardExp] Final Update Object (isDecrement=${isDecrement}):`, JSON.stringify(updateData));
      transaction.update(userRef, updateData);
    });
    console.log(`[rewardExp] Transaction committed for ${userId}`);
  } catch (error) {
    console.error(`[rewardExp] CRITICAL ERROR for ${userId}:`, error);
  }
}


/**
 * 3. 트리거: 게시글 작성 시 (마일리지, DNA, 활동 피드 통합)
 */
export const onPostCreate = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}")
  .onCreate(async (snapshot: admin.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid) return null;

    // 1. 경험치 보상 & DNA 증분 업데이트 호출
    const action = data.category === '도서 추천' ? 'POST_RECOMMEND' : 'POST_GENERAL';
    const genre = data.bookGenre || (data.category === '만화' ? '만화' : (data.category === '도서 추천' ? '자기계발' : null));
    await rewardExp(data.author.uid, action, undefined, genre);

    return null;
  });

/**
 * 3-1. 트리거: 게시글 삭제 시 (카운터 감소)
 */
export const onPostDelete = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}")
  .onDelete(async (snapshot: admin.firestore.QueryDocumentSnapshot) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid) return null;

    // 점수 차감 및 DNA 보정 호출
    const action = data.category === '도서 추천' ? 'POST_RECOMMEND' : 'POST_GENERAL';
    const genre = data.bookGenre || (data.category === '만화' ? '만화' : (data.category === '도서 추천' ? '자기계발' : null));
    await rewardExp(data.author.uid, action, undefined, genre, true);

    return null;
  });


/**
 * 4. 트리거: 댓글 작성 시
 */
export const onCommentCreate = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}/comments/{commentId}")
  .onCreate(async (snapshot: admin.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid) return null;

    // 1. 경험치 보상
    await rewardExp(data.author.uid, 'COMMENT');

    // 2. 게시글 정보 조회 (알림 및 피드용)
    const postSnap = await db.collection("posts").doc(context.params.postId).get();
    const postData = postSnap.data();

    // 3. 알림: 게시글 작성자에게 (본인이 아닐 때만)
    if (postData && postData.author && postData.author.uid !== data.author.uid) {
      await createNotification({
        recipientId: postData.author.uid,
        type: 'COMMENT',
        title: '💬 새로운 댓글',
        message: `'${data.author.nickname}'님이 회원님의 게시글에 댓글을 남겼습니다.`,
        link: `/board/${context.params.postId}`
      });
    }

    return null;
  });

/**
 * 4-1. 트리거: 댓글 삭제 시 (카운터 감소)
 */
export const onCommentDelete = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}/comments/{commentId}")
  .onDelete(async (snapshot: admin.firestore.QueryDocumentSnapshot) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid) return null;

    const userRef = db.collection("users").doc(data.author.uid);
    await userRef.update({
      commentCount: admin.firestore.FieldValue.increment(-1),
      activityCount: admin.firestore.FieldValue.increment(-1)
    });
    return null;
  });


/**
 * 5. 트리거: 좋아요 발생 시 (게시글 작성자에게 보상)
 */
export const onLikeCreate = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}/likes/{userId}")
  .onCreate(async (snapshot: admin.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const postId = context.params.postId;
    const postSnap = await db.collection("posts").doc(postId).get();
    const postData = postSnap.data();

    if (!postData || !postData.author || !postData.author.uid) return null;

    const likerId = context.params.userId;
    if (likerId === postData.author.uid) return null;

    await rewardExp(postData.author.uid, 'LIKE_RECEIVED');

    // 알림: 게시글 작성자에게
    const likerSnap = await db.collection("users").doc(likerId).get();
    const likerData = likerSnap.data();
    if (likerData) {
      await createNotification({
        recipientId: postData.author.uid,
        type: 'LIKE',
        title: '❤️ 좋아요 알림',
        message: `'${likerData.nickname}'님이 회원님의 게시글을 좋아합니다.`,
        link: `/board/${postId}`
      });
    }

    return null;
  });

/**
 * 5-1. 트리거: 좋아요 취소 시 (카운터 감소)
 */
export const onLikeDelete = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}/likes/{userId}")
  .onDelete(async (snapshot: admin.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const postId = context.params.postId;
    const postSnap = await db.collection("posts").doc(postId).get();
    const postData = postSnap.data();

    if (!postData || !postData.author || !postData.author.uid) return null;

    const likerId = context.params.userId;
    if (likerId === postData.author.uid) return null;

    const userRef = db.collection("users").doc(postData.author.uid);
    await userRef.update({
      likesReceivedCount: admin.firestore.FieldValue.increment(-1)
    });

    return null;
  });

/**
 * 6. 트리거: 사이클 리뷰 작성 시
 */
export const onReviewCreateMerged = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
  .onCreate(async (snapshot: admin.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const data = snapshot.data();
    if (!data || !data.authorUid) return null;

    // 리뷰 작성 시 경험치 + DNA 증분 (리뷰 카테고리를 장르로 매핑)
    await rewardExp(data.authorUid, 'CYCLE_REVIEW', undefined, data.category);
    return null;
  });

/**
 * 7. 트리거: 사이클 리뷰 수정/삭제 시 (DNA 갱신용)
 */
export const onReviewUpdate = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
  .onUpdate(async (change: functions.Change<admin.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    // const before = change.before.data();
    // const after = change.after.data();
    // DNA 증분 업데이트는 onReviewCreateMerged에서 처리하므로 여기서는 생략
    return null;
  });

export const onReviewDelete = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
  .onDelete(async (snapshot: admin.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const data = snapshot.data();
    if (!data || !data.authorUid) return null;
    
    // 리뷰 삭제 시 DNA 점수 차감
    await rewardExp(data.authorUid, 'CYCLE_REVIEW', undefined, data.category, true);
    return null;
  });

// 기존 DNA 스캔 로직들 비활성화 (비용 방어)
/*
export const onPostCreate = functions ...
export const onPostUpdate = functions ...
export const onPostDelete = functions ...
*/

/**
 * 8. 트리거: 사이클 공통 도서 확정 및 페이즈 전환 알림
 */
async function handleCycleNotification(cycleId: string, before: any, after: any) {
  if (!after) return;

  const isNewlyConfirmed = (before?.phase !== 'phase2_reading' && after.phase === 'phase2_reading');
  const isRecommenderNewlySet = (!before?.commonBookRecommenderUid && after.commonBookRecommenderUid);
  const isRecommenderChanged = (before?.commonBookRecommenderUid && after.commonBookRecommenderUid && before.commonBookRecommenderUid !== after.commonBookRecommenderUid);

  // 1. 당선자 보상 (EXP)
  if ((isNewlyConfirmed || isRecommenderNewlySet || isRecommenderChanged) && after.commonBookRecommenderUid) {
    console.log(`[handleCycleNotification] Rewarding winner: ${after.commonBookRecommenderUid}`);
    await rewardExp(after.commonBookRecommenderUid, 'CYCLE_WIN');
  }

  // 2. 페이즈 전환 알림 (전역)
  if (isNewlyConfirmed) {
    await createNotification({
      type: 'CYCLE_PHASE',
      title: '📖 공통 도서 확정!',
      message: `이번 달 공통 도서 '${after.commonBook?.title || '알 수 없는 도서'}'가 선정되었습니다. 모두 읽기 단계로 이동해 주세요!`,
      link: '/cycles'
    });
  } else if (after.phase === 'phase1_reading' && before?.phase !== 'phase1_reading') {
    await createNotification({
      type: 'CYCLE_PHASE',
      title: '🆕 새로운 월간 주제!',
      message: `이번 달 새로운 주제로 '${after.keyword || after.title || '알 수 없는 주제'}'이 선정되었습니다. 모두 주제와 관련된 개인 희망책을 선정해 주세요!`,
      link: '/cycles'
    });
  }
}

export const onCycleCreate = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}")
  .onCreate(async (snapshot: admin.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    const data = snapshot.data();
    await handleCycleNotification(context.params.cycleId, null, data);
    return null;
  });

export const onCycleUpdate = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}")
  .onUpdate(async (change: functions.Change<admin.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    const before = change.before.data();
    const after = change.after.data();
    await handleCycleNotification(context.params.cycleId, before, after);
    return null;
  });

/**
 * DNA 타입 재계산 트리거 (최적화 버전)
 * scores가 변경될 때마다 전체를 다시 읽지 않고, 이미 유저 문서에 있는 scores 객체만 사용하여 타입을 갱신합니다.
 */
export const onUserScoresUpdate = functions
  .region("asia-northeast3")
  .firestore.document("users/{userId}")
  .onUpdate(async (change: functions.Change<admin.firestore.DocumentSnapshot>) => {
    const after: any = change.after.data();
    if (!after) return null;

    // dna.scores 필드가 변경되었을 때만 실행
    const scoresAfter = after.dna?.scores;
    const scoresBefore = change.before.data()?.dna?.scores;
    if (JSON.stringify(scoresAfter) === JSON.stringify(scoresBefore)) return null;

    const scores: Record<string, number> = scoresAfter || { I: 0, K: 0, G: 0, E: 0 };
    const totalValid = Object.values(scores).reduce((a: number, b: number) => a + b, 0);

    if (totalValid === 0) return null;

    const ratios: Record<string, number> = {};
    Object.keys(scores).forEach(key => {
      ratios[key] = Number((scores[key] / totalValid).toFixed(2));
    });

    const sortedAxes = Object.entries(ratios)
      .sort((a: any, b: any) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        const priority: Record<string, number> = { K: 4, I: 3, E: 2, G: 1 };
        return priority[b[0]] - priority[a[0]];
      });

    const first = sortedAxes[0];
    const second = sortedAxes[1];
    const minRatio = Math.min(...Object.values(ratios) as number[]);
    const maxRatio = Math.max(...Object.values(ratios) as number[]);

    let dnaType = '';
    let dnaName = '';

    if (maxRatio - minRatio <= 0.1 && totalValid >= 4) {
      dnaType = 'BALANCED';
      dnaName = '균형 독서가';
    } else if (first) {
      if (first[1] >= 0.6) {
        dnaType = first[0] + first[0];
      } else if (second) {
        dnaType = first[0] + second[0];
      } else {
        dnaType = first[0] + first[0];
      }

      const DNA_NAMES: Record<string, string> = {
        'IE': '인간 문학가', 'IK': '세계관 설계자', 'IG': '인생 서사형',
        'KE': '철학 탐험가', 'KG': '전략적 사고가', 'KI': '스토리 분석가',
        'EE': '감성 기록자', 'EK': '예술 사색가', 'EG': '인생 탐색가',
        'GK': '인생 전략가', 'GE': '자기 탐구자', 'GG': '목표 설계자', 'KK': '지식 수집가',
        'II': '몰입 독서가'
      };
      dnaName = DNA_NAMES[dnaType] || '데이터 부족';
    } else {
      dnaName = '데이터 부족';
    }

    // ── 무한 루프 및 데이터 유실 방지 로직 ──
    // 1. 기존 데이터와 동일하면 업데이트 생략 (무한 루프 방지)
    if (after.dna?.dnaType === dnaType && after.dnaTitle === dnaName && JSON.stringify(after.dna?.ratios) === JSON.stringify(ratios)) {
      console.log(`[onUserScoresUpdate] No significant change for ${change.after.id}. Skipping. (type=${dnaType})`);
      return null;
    }

    console.log(`[onUserScoresUpdate] Updating ${change.after.id}: type=${dnaType}, name=${dnaName}`);

    await change.after.ref.set({
      dna: {
        scores, // 중요: scores를 반드시 포함하여 데이터 유실 방지
        dnaType,
        dnaName,
        ratios,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      dnaTitle: dnaName
    }, { merge: true });

    return null;
  });

/**
 * 9. 트리거: 사이클 참여자 증가/감소 시 카운터 업데이트 및 최근 참여자 목록 동기화
 */
export const onParticipantCreate = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}/participants/{uid}")
  .onCreate(async (snapshot, context) => {
    const cycleId = context.params.cycleId;
    const uid = context.params.uid;

    const cycleRef = db.collection("cycles").doc(cycleId);

    try {
      await db.runTransaction(async (t) => {
        const cycleDoc = await t.get(cycleRef);
        if (!cycleDoc.exists) return;

        const data = cycleDoc.data() || {};
        let recentUids = data.recentParticipantUids || [];

        // 새 UID를 맨 앞에 추가 (중복 방지 및 5명 제한)
        recentUids = [uid, ...recentUids.filter((id: string) => id !== uid)].slice(0, 5);

        t.update(cycleRef, {
          participantCount: admin.firestore.FieldValue.increment(1),
          recentParticipantUids: recentUids
        });
      });
    } catch (err) {
      console.error(`[onParticipantCreate] Error updating cycle ${cycleId}:`, err);
    }
    return null;
  });

export const onParticipantDelete = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}/participants/{uid}")
  .onDelete(async (snapshot, context) => {
    const cycleId = context.params.cycleId;
    const uid = context.params.uid;

    const cycleRef = db.collection("cycles").doc(cycleId);

    try {
      await db.runTransaction(async (t) => {
        const cycleDoc = await t.get(cycleRef);
        if (!cycleDoc.exists) return;

        const data = cycleDoc.data() || {};
        let recentUids = data.recentParticipantUids || [];

        recentUids = recentUids.filter((id: string) => id !== uid);

        t.update(cycleRef, {
          participantCount: admin.firestore.FieldValue.increment(-1),
          recentParticipantUids: recentUids
        });
      });
    } catch (err) {
      console.error(`[onParticipantDelete] Error updating cycle ${cycleId}:`, err);
    }
    return null;
  });
