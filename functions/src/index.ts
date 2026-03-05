import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

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
async function rewardExp(userId: string, expAmount: number) {
  const userRef = db.collection("users").doc(userId);
  
  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) return;

    const userData = userDoc.data() || {};
    let currentExp = typeof userData.exp === "number" ? userData.exp : 0;
    let currentLevel = typeof userData.level === "number" ? userData.level : 1;

    currentExp += expAmount;
    
    // 경험치가 다음 레벨업 목표 경험치(현재 레벨 * 100)를 초과하는 한 계속 레벨업 처리
    let nextLevelExp = currentLevel * 100;

    while (currentExp >= nextLevelExp) {
      currentExp -= nextLevelExp;
      currentLevel++;
      nextLevelExp = currentLevel * 100;
    }

    transaction.update(userRef, {
      exp: currentExp,
      level: currentLevel
    });
  });
}


/**
 * 3. 트리거: 게시글 작성 시 (EXP 15 증가)
 */
export const onPostCreate = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid) return null;
    
    await rewardExp(data.author.uid, 15);
    return null;
  });


/**
 * 4. 트리거: 댓글 작성 시 (EXP 5 증가)
 */
export const onCommentCreate = functions
  .region("asia-northeast3")
  .firestore.document("posts/{postId}/comments/{commentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid) return null;
    
    await rewardExp(data.author.uid, 5);
    return null;
  });
