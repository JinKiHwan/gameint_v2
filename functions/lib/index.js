"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCycleUpdate = exports.onCycleCreate = exports.onAttendanceUpdate = exports.onReviewCreate = exports.onLikeCreate = exports.onCommentCreate = exports.onPostCreate = exports.onUserProfileUpdate = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const expConfig_1 = require("./shared/expConfig");
admin.initializeApp();
const db = admin.firestore();
// ── KST 변환 유틸 ──────────────────────────────────────────────
const getKstDate = () => {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    return new Date(now.getTime() + kstOffset).toISOString().split("T")[0];
};
// 1. 프로필 업데이트 시 과거 게시글/댓글 동기화
exports.onUserProfileUpdate = functions
    .region("asia-northeast3") // 서울 리전
    .firestore.document("users/{userId}")
    .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData)
        return null;
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
    const pushUpdate = async (docRef, updateData) => {
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
            const updateData = {};
            if (nicknameChanged)
                updateData["author.nickname"] = newNickname;
            if (avatarChanged)
                updateData["author.profileImageId"] = newAvatar;
            await pushUpdate(doc.ref, updateData);
        }
        // 1-2. 내가 쓴 댓글 업데이트 (collectionGroup 사용)
        const commentsSnapshot = await db.collectionGroup("comments")
            .where("author.uid", "==", userId)
            .get();
        for (const doc of commentsSnapshot.docs) {
            const updateData = {};
            if (nicknameChanged)
                updateData["author.nickname"] = newNickname;
            if (avatarChanged)
                updateData["author.profileImageId"] = newAvatar;
            await pushUpdate(doc.ref, updateData);
        }
        if (currentBatchSize > 0) {
            await batch.commit();
        }
        console.log(`Successfully synced profile changes for userId: ${userId}. Total documents updated: ${totalUpdated}`);
    }
    catch (error) {
        console.error(`Error syncing profile changes for userId ${userId}:`, error);
    }
    return null;
});
// ── 알림 생성 헬퍼 ──────────────────────────────────────────────
async function createNotification(params) {
    const notificationData = Object.assign(Object.assign({}, params), { createdAt: admin.firestore.FieldValue.serverTimestamp(), isRead: false });
    if (params.recipientId) {
        // 개인 알림
        await db.collection("users").doc(params.recipientId).collection("notifications").add(notificationData);
    }
    else {
        // 전역 알림 (비용 최적화: 문서 1개 고정)
        await db.collection("global_notifications").add(notificationData);
    }
}
/**
 * 2. Helper function to reward EXP to a user and handle level-ups.
 */
async function rewardExp(userId, action, manualAmount) {
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
                expAmount = expConfig_1.EXP_CONFIG.REWARDS[action];
                // 제한 로직 체크
                if (action === 'ATTENDANCE') {
                    if (expTracker.lastAttendanceDate === today) {
                        console.log(`[rewardExp] Attendance already rewarded for today: ${today}`);
                        return;
                    }
                    expTracker.lastAttendanceDate = today;
                }
                else if (action === 'POST_GENERAL') {
                    if (expTracker.lastPostDate === today) {
                        console.log(`[rewardExp] General post already rewarded for today: ${today}`);
                        return;
                    }
                    expTracker.lastPostDate = today;
                }
                else if (action === 'POST_RECOMMEND') {
                    if (expTracker.lastRecommendBookDate === today) {
                        console.log(`[rewardExp] Recommend book already rewarded for today: ${today}`);
                        return;
                    }
                    expTracker.lastRecommendBookDate = today;
                }
                else if (action === 'COMMENT') {
                    const lastDate = expTracker.lastCommentDate || "";
                    let countToday = (lastDate === today) ? (expTracker.commentCountToday || 0) : 0;
                    if (countToday >= expConfig_1.EXP_CONFIG.LIMITS.COMMENT_PER_DAY) {
                        console.log(`[rewardExp] Comment limit reached for today: ${today}`);
                        return;
                    }
                    expTracker.lastCommentDate = today;
                    expTracker.commentCountToday = countToday + 1;
                }
            }
            if (expAmount <= 0)
                return;
            currentExp += expAmount;
            console.log(`[rewardExp] Adding ${expAmount} XP to userId: ${userId}. New total: ${currentExp}`);
            // 레벨업 로직 (비선형 테이블 적용)
            let nextLevelExp = expConfig_1.EXP_CONFIG.getNextLevelExp(currentLevel + 1);
            while (currentExp >= nextLevelExp && currentLevel < 100) {
                currentExp -= nextLevelExp;
                currentLevel++;
                console.log(`[rewardExp] Level Up! New Level: ${currentLevel}`);
                nextLevelExp = expConfig_1.EXP_CONFIG.getNextLevelExp(currentLevel + 1);
            }
            const currentTier = expConfig_1.EXP_CONFIG.getTier(currentLevel);
            const updateData = {
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
    }
    catch (error) {
        console.error(`[rewardExp] Error in transaction for userId: ${userId}`, error);
    }
}
/**
 * 3. 트리거: 게시글 작성 시 (도서 추천 vs 일반)
 */
exports.onPostCreate = functions
    .region("asia-northeast3")
    .firestore.document("posts/{postId}")
    .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid)
        return null;
    const action = data.category === '도서 추천' ? 'POST_RECOMMEND' : 'POST_GENERAL';
    await rewardExp(data.author.uid, action);
    return null;
});
/**
 * 4. 트리거: 댓글 작성 시
 */
exports.onCommentCreate = functions
    .region("asia-northeast3")
    .firestore.document("posts/{postId}/comments/{commentId}")
    .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid)
        return null;
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
exports.onLikeCreate = functions
    .region("asia-northeast3")
    .firestore.document("posts/{postId}/likes/{userId}")
    .onCreate(async (snapshot, context) => {
    const postId = context.params.postId;
    const postSnap = await db.collection("posts").doc(postId).get();
    const postData = postSnap.data();
    if (!postData || !postData.author || !postData.author.uid)
        return null;
    const likerId = context.params.userId;
    if (likerId === postData.author.uid)
        return null;
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
exports.onReviewCreate = functions
    .region("asia-northeast3")
    .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
    .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.authorUid)
        return null;
    await rewardExp(data.authorUid, 'CYCLE_REVIEW');
    return null;
});
/**
 * 7. 트리거: 출석 체크 (userData.expTracker.lastAttendanceDate 필드 업데이트 시)
 */
exports.onAttendanceUpdate = functions
    .region("asia-northeast3")
    .firestore.document("users/{userId}")
    .onUpdate(async (change, context) => {
    var _a, _b, _c, _d;
    const before = (_b = (_a = change.before.data()) === null || _a === void 0 ? void 0 : _a.expTracker) === null || _b === void 0 ? void 0 : _b.lastAttendanceDate;
    const after = (_d = (_c = change.after.data()) === null || _c === void 0 ? void 0 : _c.expTracker) === null || _d === void 0 ? void 0 : _d.lastAttendanceDate;
    if (after && before !== after) {
        await rewardExp(context.params.userId, 'ATTENDANCE');
    }
    return null;
});
/**
 * 8. 트리거: 사이클 공통 도서 확정 및 페이즈 전환 알림
 */
async function handleCycleNotification(cycleId, before, after) {
    var _a;
    if (!after)
        return;
    const isNewlyConfirmed = ((before === null || before === void 0 ? void 0 : before.phase) !== 'phase2_reading' && after.phase === 'phase2_reading');
    const isRecommenderNewlySet = (!(before === null || before === void 0 ? void 0 : before.commonBookRecommenderUid) && after.commonBookRecommenderUid);
    const isRecommenderChanged = ((before === null || before === void 0 ? void 0 : before.commonBookRecommenderUid) && after.commonBookRecommenderUid && before.commonBookRecommenderUid !== after.commonBookRecommenderUid);
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
            message: `이번 달 공통 도서 '${((_a = after.commonBook) === null || _a === void 0 ? void 0 : _a.title) || '알 수 없는 도서'}'가 선정되었습니다. 모두 읽기 단계로 이동해 주세요!`,
            link: '/cycles'
        });
    }
    else if (after.phase === 'phase1_reading' && (before === null || before === void 0 ? void 0 : before.phase) !== 'phase1_reading') {
        await createNotification({
            type: 'CYCLE_PHASE',
            title: '🆕 새로운 월간 주제!',
            message: `이번 달 새로운 주제로 '${after.title || '알 수 없는 주제'}'이 선정되었습니다. 모두 주제와 관련된 개인 희망책을 선정해 주세요!`,
            link: '/cycles'
        });
    }
}
exports.onCycleCreate = functions
    .region("asia-northeast3")
    .firestore.document("cycles/{cycleId}")
    .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    await handleCycleNotification(context.params.cycleId, null, data);
    return null;
});
exports.onCycleUpdate = functions
    .region("asia-northeast3")
    .firestore.document("cycles/{cycleId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    await handleCycleNotification(context.params.cycleId, before, after);
    return null;
});
//# sourceMappingURL=index.js.map