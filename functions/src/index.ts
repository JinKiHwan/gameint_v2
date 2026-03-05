import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const onUserProfileUpdate = functions
  .region("asia-northeast3") // Use Seoul region, or let it default to us-central1 if preferred. I'll stick to default or the one used.
  .firestore.document("users/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) return null;

    // Check if nickname or profileImageId changed
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
      if (currentBatchSize >= 450) {
        await batch.commit();
        batch = db.batch();
        currentBatchSize = 0;
      }
    };

    const pushUpdate = async (docRef: admin.firestore.DocumentReference, updateData: any) => {
      batch.update(docRef, updateData);
      currentBatchSize++;
      totalUpdated++;
      await commitBatchIfNeeded();
    };

    try {
      // 1. Update posts where author.uid == userId
      const postsSnapshot = await db.collection("posts")
        .where("author.uid", "==", userId)
        .get();

      for (const doc of postsSnapshot.docs) {
        const updateData: any = {};
        if (nicknameChanged) updateData["author.nickname"] = newNickname;
        if (avatarChanged) updateData["author.profileImageId"] = newAvatar;
        
        await pushUpdate(doc.ref, updateData);
      }

      // 2. Update comments where author.uid == userId
      // Note: This requires a Collection Group index on 'comments' for 'author.uid'
      const commentsSnapshot = await db.collectionGroup("comments")
        .where("author.uid", "==", userId)
        .get();

      for (const doc of commentsSnapshot.docs) {
        const updateData: any = {};
        if (nicknameChanged) updateData["author.nickname"] = newNickname;
        if (avatarChanged) updateData["author.profileImageId"] = newAvatar;
        
        await pushUpdate(doc.ref, updateData);
      }

      // Commit any remaining updates
      if (currentBatchSize > 0) {
        await batch.commit();
      }

      console.log(`Successfully synced profile changes for userId: ${userId}. Total documents updated: ${totalUpdated}`);
    } catch (error) {
      console.error(`Error syncing profile changes for userId ${userId}:`, error);
    }

    return null;
  });
