"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXP_CONFIG = void 0;
exports.EXP_CONFIG = {
    // 10레벨까지의 고정 경험치 테이블 (Index = Target Level)
    // Lv 1 -> 2: 50, Lv 2 -> 3: 60, ...
    LEVEL_EXP_TABLE: [0, 0, 50, 60, 70, 80, 120, 140, 160, 180, 200],
    /**
     * 다음 레벨로 승급하기 위해 필요한 경험치를 반환합니다.
     * @param targetLevel 도달하고자 하는 목표 레벨
     */
    getNextLevelExp: (targetLevel) => {
        if (targetLevel <= 1)
            return 0;
        if (targetLevel <= 10)
            return exports.EXP_CONFIG.LEVEL_EXP_TABLE[targetLevel] || 200;
        if (targetLevel >= 36)
            return 1500;
        // 점진적 증가 구간 (명세서 기준 범위 내 선형 보간)
        if (targetLevel <= 15)
            return 250 + (targetLevel - 11) * 25; // 250 ~ 350
        if (targetLevel <= 20)
            return 350 + (targetLevel - 16) * 37; // 350 ~ 500
        if (targetLevel <= 25)
            return 500 + (targetLevel - 21) * 50; // 500 ~ 700
        if (targetLevel <= 30)
            return 700 + (targetLevel - 26) * 75; // 700 ~ 1000
        if (targetLevel <= 35)
            return 1000 + (targetLevel - 31) * 125; // 1000 ~ 1500
        return 1500;
    },
    /**
     * 레벨에 따른 티어 이름을 반환합니다.
     */
    getTier: (level) => {
        if (level >= 36)
            return 'Challenger';
        if (level >= 31)
            return 'Grandmaster';
        if (level >= 26)
            return 'Master';
        if (level >= 21)
            return 'Diamond';
        if (level >= 16)
            return 'Platinum';
        if (level >= 11)
            return 'Gold';
        if (level >= 6)
            return 'Silver';
        return 'Bronze';
    },
    // 경험치 보상 수치
    REWARDS: {
        ATTENDANCE: 50,
        POST_GENERAL: 30,
        POST_RECOMMEND: 50,
        LIKE_RECEIVED: 10,
        COMMENT: 10,
        CYCLE_REVIEW: 200,
        CYCLE_WIN: 500,
    },
    // 일일 획득 제한
    LIMITS: {
        ATTENDANCE_PER_DAY: 1,
        POST_GENERAL_PER_DAY: 1,
        POST_RECOMMEND_PER_DAY: 1,
        COMMENT_PER_DAY: 3,
    }
};
//# sourceMappingURL=expConfig.js.map