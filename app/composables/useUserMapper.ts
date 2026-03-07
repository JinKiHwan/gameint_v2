import { useUsersStore } from '~/stores/users'

export const useUserMapper = () => {
    const usersStore = useUsersStore()

    // 앱 시작 시 유저 목록 초기화 (이미 초기화된 경우 무시됨)
    onMounted(() => {
        usersStore.initUsers()
    })

    /**
     * UID를 기반으로 최신 유저 정보를 반환합니다.
     * 스토어에 정보가 없으면 제공된 fallback 데이터를 사용합니다.
     */
    const resolveUser = (uid: string, fallbackData?: { nickname?: string, profileImageId?: string }) => {
        const latestUser = usersStore.getUser(uid)

        if (latestUser) {
            return {
                nickname: latestUser.nickname,
                profileImageId: latestUser.profileImageId,
                tier: latestUser.tier,
                isUnknown: false
            }
        }

        // 탈퇴했거나 정보가 없는 경우
        return {
            nickname: fallbackData?.nickname ? `${fallbackData.nickname} (알 수 없음)` : '알 수 없는 사용자',
            profileImageId: fallbackData?.profileImageId || 'avatar_bronze_01',
            tier: 'Bronze',
            isUnknown: true
        }
    }

    return {
        resolveUser,
        usersStore
    }
}
