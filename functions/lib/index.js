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
exports.onParticipantDelete = exports.onParticipantCreate = exports.onUserScoresUpdate = exports.onCycleUpdate = exports.onCycleCreate = exports.onAttendanceUpdate = exports.onReviewDelete = exports.onReviewUpdate = exports.onReviewCreateMerged = exports.onLikeCreate = exports.onCommentCreate = exports.onPostCreate = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const expConfig_1 = require("./shared/expConfig");
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
async function rewardExp(userId, action, manualAmount, bookGenre, isTriggeredByUpdate = false) {
    console.log(`[rewardExp] Starting reward for userId: ${userId}, action: ${action}, isTriggeredByUpdate: ${isTriggeredByUpdate}`);
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
                expAmount = expConfig_1.EXP_CONFIG.REWARDS[action];
                if (action === 'ATTENDANCE') {
                    // 트리거를 통한 업데이트인 경우 날짜 중복 체크를 우회(프론트에서 이미 업데이트했으므로)
                    if (!isTriggeredByUpdate && expTracker.lastAttendanceDate === today)
                        return;
                    expTracker.lastAttendanceDate = today;
                }
                else if (action === 'POST_GENERAL') {
                    if (expTracker.lastPostDate === today)
                        return;
                    expTracker.lastPostDate = today;
                }
                else if (action === 'POST_RECOMMEND') {
                    if (expTracker.lastRecommendBookDate === today)
                        return;
                    expTracker.lastRecommendBookDate = today;
                }
                else if (action === 'COMMENT') {
                    const lastDate = expTracker.lastCommentDate || "";
                    let countToday = (lastDate === today) ? (expTracker.commentCountToday || 0) : 0;
                    if (countToday >= expConfig_1.EXP_CONFIG.LIMITS.COMMENT_PER_DAY)
                        return;
                    expTracker.lastCommentDate = today;
                    expTracker.commentCountToday = countToday + 1;
                }
            }
            const updateData = {
                expTracker: expTracker
            };
            if (expAmount > 0) {
                currentExp += expAmount;
                while (currentExp >= expConfig_1.EXP_CONFIG.getNextLevelExp(currentLevel + 1) && currentLevel < 100) {
                    currentExp -= expConfig_1.EXP_CONFIG.getNextLevelExp(currentLevel + 1);
                    currentLevel++;
                }
                updateData.exp = currentExp;
                updateData.level = currentLevel;
                updateData.tier = expConfig_1.EXP_CONFIG.getTier(currentLevel);
            }
            // DNA 증분 업데이트 (Read 없이 처리)
            if (bookGenre || action === 'POST_RECOMMEND' || action === 'CYCLE_REVIEW') {
                const genreToMap = bookGenre || (action === 'POST_RECOMMEND' ? '도서 추천' : ''); // 실제 장르값이 필요함
                if (genreToMap) {
                    const CATEGORY_MAPPING = {
                        '소설': 'I', '자기계발': 'G', '경제/경영': 'G', '인문/사회': 'K', '과학/기술': 'K', '시/에세이': 'E'
                    };
                    const axis = CATEGORY_MAPPING[genreToMap];
                    if (axis) {
                        updateData[`dna.scores.${axis}`] = admin.firestore.FieldValue.increment(1);
                    }
                }
            }
            transaction.update(userRef, updateData);
            // 보상 후 DNA 한 줄 평/타입 재계산 (Update 트리거에서 처리할 수도 있지만, transaction 내에서 snapshot 데이터 기반으로 미리 계산 시도 가능)
            // 단, FieldValue.increment는 즉시 값을 알 수 없으므로, onUpdate 트리거에서 dna.scores 변경 시 type만 계산하는 게 더 정확할 수 있음.
            // 여기서는 일단 scores 업데이트만 수행하고, DNA 타입 계산은 별도 트리거로 분리하여 Read 최소화.
        });
    }
    catch (error) {
        console.error(`[rewardExp] Error in transaction for userId: ${userId}`, error);
    }
}
/**
 * 3. 트리거: 게시글 작성 시 (마일리지, DNA, 활동 피드 통합)
 */
exports.onPostCreate = functions
    .region("asia-northeast3")
    .firestore.document("posts/{postId}")
    .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.author || !data.author.uid)
        return null;
    // 1. 경험치 보상 & DNA 증분 업데이트 호출
    const action = data.category === '도서 추천' ? 'POST_RECOMMEND' : 'POST_GENERAL';
    const genre = data.bookGenre || (data.category === '도서 추천' ? '자기계발' : null);
    await rewardExp(data.author.uid, action, undefined, genre);
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
exports.onReviewCreateMerged = functions
    .region("asia-northeast3")
    .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
    .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || !data.authorUid)
        return null;
    // 리뷰 작성 시 경험치 + DNA 증분 (리뷰 카테고리를 장르로 매핑)
    await rewardExp(data.authorUid, 'CYCLE_REVIEW', undefined, data.category);
    return null;
});
/**
 * 7. 트리거: 사이클 리뷰 수정/삭제 시 (DNA 갱신용)
 */
exports.onReviewUpdate = functions
    .region("asia-northeast3")
    .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
    .onUpdate(async (change, context) => {
    // const before = change.before.data();
    // const after = change.after.data();
    // DNA 증분 업데이트는 onReviewCreateMerged에서 처리하므로 여기서는 생략
    return null;
});
exports.onReviewDelete = functions
    .region("asia-northeast3")
    .firestore.document("cycles/{cycleId}/reviews/{reviewId}")
    .onDelete(async (snapshot, context) => {
    // const data = snapshot.data();
    // DNA 삭제 시 보정 로직은 비용 대비 실익이 적어 생략
    return null;
});
/**
 * 트리거: 게시판 글 작성/수정/삭제 시 (DNA 갱신용)
 */
// 기존 DNA 스캔 로직들 비활성화 (비용 방어)
/*
export const onPostCreate = functions ...
export const onPostUpdate = functions ...
export const onPostDelete = functions ...
*/
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
        // 트리거를 통한 업데이트임을 알리기 위해 true 플래그 전달
        await rewardExp(context.params.userId, 'ATTENDANCE', undefined, undefined, true);
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
            message: `이번 달 새로운 주제로 '${after.keyword || after.title || '알 수 없는 주제'}'이 선정되었습니다. 모두 주제와 관련된 개인 희망책을 선정해 주세요!`,
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
/**
 * DNA 타입 재계산 트리거 (최적화 버전)
 * scores가 변경될 때마다 전체를 다시 읽지 않고, 이미 유저 문서에 있는 scores 객체만 사용하여 타입을 갱신합니다.
 */
exports.onUserScoresUpdate = functions
    .region("asia-northeast3")
    .firestore.document("users/{userId}")
    .onUpdate(async (change) => {
    var _a, _b, _c;
    const after = change.after.data();
    if (!after)
        return null;
    // dna.scores 필드가 변경되었을 때만 실행
    const scoresAfter = (_a = after.dna) === null || _a === void 0 ? void 0 : _a.scores;
    const scoresBefore = (_c = (_b = change.before.data()) === null || _b === void 0 ? void 0 : _b.dna) === null || _c === void 0 ? void 0 : _c.scores;
    if (JSON.stringify(scoresAfter) === JSON.stringify(scoresBefore))
        return null;
    const scores = scoresAfter || { I: 0, K: 0, G: 0, E: 0 };
    const totalValid = Object.values(scores).reduce((a, b) => a + b, 0);
    if (totalValid === 0)
        return null;
    const ratios = {};
    Object.keys(scores).forEach(key => {
        ratios[key] = Number((scores[key] / totalValid).toFixed(2));
    });
    const sortedAxes = Object.entries(ratios)
        .sort((a, b) => {
        if (b[1] !== a[1])
            return b[1] - a[1];
        const priority = { K: 4, I: 3, E: 2, G: 1 };
        return priority[b[0]] - priority[a[0]];
    });
    const first = sortedAxes[0];
    const second = sortedAxes[1];
    const minRatio = Math.min(...Object.values(ratios));
    const maxRatio = Math.max(...Object.values(ratios));
    let dnaType = '';
    let dnaName = '';
    if (maxRatio - minRatio <= 0.1 && totalValid >= 4) {
        dnaType = 'BALANCED';
        dnaName = '균형 독서가';
    }
    else if (first) {
        if (first[1] >= 0.6) {
            dnaType = first[0] + first[0];
        }
        else if (second) {
            dnaType = first[0] + second[0];
        }
        else {
            dnaType = first[0] + first[0];
        }
        const DNA_NAMES = {
            'IE': '인간 문학가', 'IK': '세계관 설계자', 'IG': '인생 서사형',
            'KE': '철학 탐험가', 'KG': '전략적 사고가', 'KI': '스토리 분석가',
            'EE': '감성 기록자', 'EK': '예술 사색가', 'EG': '인생 탐색가',
            'GK': '인생 전략가', 'GE': '자기 탐구자', 'GG': '목표 설계자', 'KK': '지식 수집가',
            'II': '몰입 독서가'
        };
        dnaName = DNA_NAMES[dnaType] || '일반 독서가';
    }
    await change.after.ref.set({
        dna: {
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
exports.onParticipantCreate = functions
    .region("asia-northeast3")
    .firestore.document("cycles/{cycleId}/participants/{uid}")
    .onCreate(async (snapshot, context) => {
    const cycleId = context.params.cycleId;
    const uid = context.params.uid;
    const cycleRef = db.collection("cycles").doc(cycleId);
    try {
        await db.runTransaction(async (t) => {
            const cycleDoc = await t.get(cycleRef);
            if (!cycleDoc.exists)
                return;
            const data = cycleDoc.data() || {};
            let recentUids = data.recentParticipantUids || [];
            // 새 UID를 맨 앞에 추가 (중복 방지 및 5명 제한)
            recentUids = [uid, ...recentUids.filter((id) => id !== uid)].slice(0, 5);
            t.update(cycleRef, {
                participantCount: admin.firestore.FieldValue.increment(1),
                recentParticipantUids: recentUids
            });
        });
    }
    catch (err) {
        console.error(`[onParticipantCreate] Error updating cycle ${cycleId}:`, err);
    }
    return null;
});
exports.onParticipantDelete = functions
    .region("asia-northeast3")
    .firestore.document("cycles/{cycleId}/participants/{uid}")
    .onDelete(async (snapshot, context) => {
    const cycleId = context.params.cycleId;
    const uid = context.params.uid;
    const cycleRef = db.collection("cycles").doc(cycleId);
    try {
        await db.runTransaction(async (t) => {
            const cycleDoc = await t.get(cycleRef);
            if (!cycleDoc.exists)
                return;
            const data = cycleDoc.data() || {};
            let recentUids = data.recentParticipantUids || [];
            recentUids = recentUids.filter((id) => id !== uid);
            t.update(cycleRef, {
                participantCount: admin.firestore.FieldValue.increment(-1),
                recentParticipantUids: recentUids
            });
        });
    }
    catch (err) {
        console.error(`[onParticipantDelete] Error updating cycle ${cycleId}:`, err);
    }
    return null;
});
//# sourceMappingURL=index.js.map