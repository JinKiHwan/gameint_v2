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

      transaction.update(userRef, {
        exp: currentExp,
        level: currentLevel,
        tier: currentTier,
        expTracker: expTracker
      });
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
 * 8. 트리거: 사이클 공통 도서 확정 (당선자 보상)
 */
export const onCycleCommonBookConfirm = functions
  .region("asia-northeast3")
  .firestore.document("cycles/{cycleId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (!before || !after) return null;
    
    console.log(`[onCycleCommonBookConfirm] Triggered for cycleId: ${context.params.cycleId}`);
    console.log(`[onCycleCommonBookConfirm] Phase: ${before.phase} -> ${after.phase}`);
    console.log(`[onCycleCommonBookConfirm] Recommender: ${before.commonBookRecommenderUid} -> ${after.commonBookRecommenderUid}`);

    const isNewlyConfirmed = (before.phase !== 'phase2_reading' && after.phase === 'phase2_reading');
    const isRecommenderNewlySet = (!before.commonBookRecommenderUid && after.commonBookRecommenderUid);
    const isRecommenderChanged = (before.commonBookRecommenderUid && after.commonBookRecommenderUid && before.commonBookRecommenderUid !== after.commonBookRecommenderUid);
    
    if ((isNewlyConfirmed || isRecommenderNewlySet || isRecommenderChanged) && after.commonBookRecommenderUid) {
      console.log(`[onCycleCommonBookConfirm] Rewarding winner: ${after.commonBookRecommenderUid}`);
      await rewardExp(after.commonBookRecommenderUid, 'CYCLE_WIN');
    }
    return null;
  });
