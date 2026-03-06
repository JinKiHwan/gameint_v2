import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { EXP_CONFIG } from "./shared/expConfig";

admin.initializeApp();
const db = admin.firestore();

// ── KST 변환 유틸 ──────────────────────────────────────────────
const getKstDate = () => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  return new Date(now.getTime() + kstOffset).toISOString().split("T")[0];
};

// 1. 프로필 업데이트 시 과거 게시글/댓글 동기화
export const onUserProfileUpdate = functions
  .region("asia-northeast3") // 서울 리전
  .firestore.document("users/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) return null;

    // 변경된 항목 체크
    const nicknameChanged = beforeData.nickname !== afterData.nickname;
    const avatarChanged = beforeData.profileImageId !== afterData.profileImageId;

    if (!nicknameChanged && !avatarChanged) {
      return null;
    }

    const newNickname = afterData.nickname;
    const newAvatar = afterData.profileImageId;

    let batch = db.batch();
    let currentBatchSize = 0;
    let totalUpdated = 0;

    const commitBatchIfNeeded = async () => {
      // firestore 배치는 최대 500개이므로 안전하게 450개에서 커밋
      if (currentBatchSize >= 450) {
        await batch.commit();
        batch = db.batch();
        currentBatchSize = 0;
      }
    };

    const pushUpdate = async (docRef: admin.firestore.DocumentReference, updateData: Record<string, any>) => {
      batch.update(docRef, updateData);
      currentBatchSize++;
      totalUpdated++;
      await commitBatchIfNeeded();
    };

    try {
      // 1-1. 내가 쓴 게시판 글 업데이트
      const postsSnapshot = await db.collection("posts")
        .where("author.uid", "==", userId)
        .get();

      for (const doc of postsSnapshot.docs) {
        const updateData: Record<string, any> = {};
        if (nicknameChanged) updateData["author.nickname"] = newNickname;
        if (avatarChanged) updateData["author.profileImageId"] = newAvatar;
        
        await pushUpdate(doc.ref, updateData);
      }

      // 1-2. 내가 쓴 댓글 업데이트 (collectionGroup 사용)
      const commentsSnapshot = await db.collectionGroup("comments")
        .where("author.uid", "==", userId)
        .get();

      for (const doc of commentsSnapshot.docs) {
        const updateData: Record<string, any> = {};
        if (nicknameChanged) updateData["author.nickname"] = newNickname;
        if (avatarChanged) updateData["author.profileImageId"] = newAvatar;
        
        await pushUpdate(doc.ref, updateData);
      }

      if (currentBatchSize > 0) {
        await batch.commit();
      }

      console.log(`Successfully synced profile changes for userId: ${userId}. Total documents updated: ${totalUpdated}`);
    } catch (error) {
      console.error(`Error syncing profile changes for userId ${userId}:`, error);
    }

    return null;
  });

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
async function rewardExp(userId: string, action: keyof typeof EXP_CONFIG.REWARDS | 'MANUAL', manualAmount?: number) {
  console.log(`[rewardExp] Starting reward for userId: ${userId}, action: ${action}`);
  const userRef = db.collection("users").doc(userId);
  const today = getKstDate();
  
  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        console.warn(`[rewardExp] User document not found for userId: ${userId}`);
        return;
      }

      const userData = userDoc.data() || {};
      let currentExp = typeof userData.exp === "number" ? userData.exp : 0;
      let currentLevel = typeof userData.level === "number" ? userData.level : 1;
      const expTracker = userData.expTracker || {};
      let oldTier = userData.tier || 'Bronze'; // Capture old tier before any updates

      let expAmount = manualAmount || 0;
      if (action !== 'MANUAL') {
        expAmount = EXP_CONFIG.REWARDS[action];
        
        // 제한 로직 체크
        if (action === 'ATTENDANCE') {
          if (expTracker.lastAttendanceDate === today) {
            console.log(`[rewardExp] Attendance already rewarded for today: ${today}`);
            return;
          }
          expTracker.lastAttendanceDate = today;
        } else if (action === 'POST_GENERAL') {
          if (expTracker.lastPostDate === today) {
            console.log(`[rewardExp] General post already rewarded for today: ${today}`);
            return;
          }
          expTracker.lastPostDate = today;
        } else if (action === 'POST_RECOMMEND') {
          if (expTracker.lastRecommendBookDate === today) {
            console.log(`[rewardExp] Recommend book already rewarded for today: ${today}`);
            return;
          }
          expTracker.lastRecommendBookDate = today;
        } else if (action === 'COMMENT') {
          const lastDate = expTracker.lastCommentDate || "";
          let countToday = (lastDate === today) ? (expTracker.commentCountToday || 0) : 0;
          if (countToday >= EXP_CONFIG.LIMITS.COMMENT_PER_DAY) {
            console.log(`[rewardExp] Comment limit reached for today: ${today}`);
            return;
          }
          
          expTracker.lastCommentDate = today;
          expTracker.commentCountToday = countToday + 1;
        }
      }

      if (expAmount <= 0) return;

      currentExp += expAmount;
      console.log(`[rewardExp] Adding ${expAmount} XP to userId: ${userId}. New total: ${currentExp}`);
      
      // 레벨업 로직 (비선형 테이블 적용)
      let nextLevelExp = EXP_CONFIG.getNextLevelExp(currentLevel + 1);

      while (currentExp >= nextLevelExp && currentLevel < 100) {
        currentExp -= nextLevelExp;
        currentLevel++;
        console.log(`[rewardExp] Level Up! New Level: ${currentLevel}`);
        nextLevelExp = EXP_CONFIG.getNextLevelExp(currentLevel + 1);
      }

      const currentTier = EXP_CONFIG.getTier(currentLevel);

      const updateData: any = {
        exp: currentExp,
        level: currentLevel,
        tier: currentTier,
        expTracker: expTracker
      };
      
      transaction.update(userRef, updateData);

      // 티어 승급 알림 (전역)
      if (currentTier !== oldTier) {
        await createNotification({
          type: 'TIER_UP',
          title: '🏆 티어 승급 소식!',
          message: `${userData.nickname}님의 티어가 '${currentTier}'로 승급하셨습니다!`,
          link: '/board' // 혹은 랭킹 페이지
        });
      }
    });
    console.log(`[rewardExp] Successfully completed reward for userId: ${userId}`);
  } catch (error) {
    console.error(`[rewardExp] Error in transaction for userId: ${userId}`, error);
  }
}


/**
 * 3. 트리거: 게시글 작성 시 (도서 추천 vs 일반)
 */
export const onPostCreate = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid) return null;
    
    const action = data.category === '도서 추천' ? 'POST_RECOMMEND' : 'POST_GENERAL';
    await rewardExp(data.author.uid, action);
    return null;
  });


/**
 * 4. 트리거: 댓글 작성 시
 */
export const onCommentCreate = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}/comments/{commentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid) return null;
    
    await rewardExp(data.author.uid, 'COMMENT');

    // 알림: 게시글 작성자에게
    const postSnap = await db.collection("posts").doc(context.params.postId).get();
    const postData = postSnap.data();
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
 * 5. 트리거: 좋아요 발생 시 (게시글 작성자에게 보상)
 */
export const onLikeCreate = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}/likes/{userId}")
  .onCreate(async (snapshot, context) => {
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
 * 6. 트리거: 사이클 리뷰 작성 시
 */
export const onReviewCreate = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.authorUid) return null;
    
    await rewardExp(data.authorUid, 'CYCLE_REVIEW');
    await updateUserDNA(data.authorUid);
    return null;
  });

/**
 * 7. 트리거: 사이클 리뷰 수정/삭제 시 (DNA 갱신용)
 */
export const onReviewUpdate = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.category !== after.category) {
      await updateUserDNA(after.authorUid);
    }
    return null;
  });

export const onReviewDelete = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
  .onDelete(async (snapshot, context) => {
    const data = snapshot.data();
    if (data && data.authorUid) {
      await updateUserDNA(data.authorUid);
    }
    return null;
  });

/**
 * 7. 트리거: 출석 체크 (userData.expTracker.lastAttendanceDate 필드 업데이트 시)
 */
export const onAttendanceUpdate = functions
  .region("asia-northeast3")
  .firestore.document("users/{userId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data()?.expTracker?.lastAttendanceDate;
    const after = change.after.data()?.expTracker?.lastAttendanceDate;
    
    if (after && before !== after) {
      await rewardExp(context.params.userId, 'ATTENDANCE');
    }
    return null;
  });

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
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    await handleCycleNotification(context.params.cycleId, null, data);
    return null;
  });

export const onCycleUpdate = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    await handleCycleNotification(context.params.cycleId, before, after);
    return null;
  });

/**
 * DNA 분석 및 업데이트 (공용)
 */
async function updateUserDNA(uid: string) {
  try {
    const reviewsSnap = await db.collectionGroup("reviews")
      .where("authorUid", "==", uid)
      .get();
    
    const reviews = reviewsSnap.docs.map(d => d.data());
    if (reviews.length === 0) {
      await db.collection("users").doc(uid).set({
        dna: null,
        dnaTitle: '미분석'
      }, { merge: true });
      return;
    }

    const CATEGORY_MAPPING: Record<string, string> = {
      '소설': 'I',
      '자기계발': 'G',
      '경제/경영': 'G',
      '인문/사회': 'K',
      '과학/기술': 'K',
      '시/에세이': 'E'
    };

    const scores: Record<string, number> = { I: 0, K: 0, G: 0, E: 0 };
    let totalValid = 0;

    reviews.forEach(r => {
      const axis = CATEGORY_MAPPING[r.category];
      if (axis) {
        scores[axis]++;
        totalValid++;
      }
    });

    if (totalValid === 0) return;

    const ratios: Record<string, number> = {};
    Object.keys(scores).forEach(key => {
      const score = scores[key] || 0;
      ratios[key] = Number((score / totalValid).toFixed(2));
    });

    const sortedAxes = Object.entries(ratios)
      .sort((a: any, b: any) => {
        const valA = a[1] || 0;
        const valB = b[1] || 0;
        if (valB !== valA) return valB - valA;
        const priority: Record<string, number> = { K: 4, I: 3, E: 2, G: 1 };
        return (priority[b[0]] || 0) - (priority[a[0]] || 0);
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
        'GK': '인생 전략가', 'GE': '자기 탐구자', 'GG': '목표 설계자', 'KK': '지식 수집가'
      };
      dnaName = DNA_NAMES[dnaType] || '일반 독서가';
    }

    await db.collection("users").doc(uid).set({
      dna: {
         dnaType,
         dnaName,
         scores,
         ratios,
         updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      dnaTitle: dnaName
    }, { merge: true });

  } catch (err) {
    console.error('updateUserDNA error:', err);
  }
}
