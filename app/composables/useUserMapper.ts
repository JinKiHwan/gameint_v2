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
    const resolveUser = (uid: string, fallbackData?: any) => {
        const latestUser = usersStore.getUser(uid)

        if (latestUser) {
            return {
                ...fallbackData,
                ...latestUser,
                uid,
                isUnknown: false
            }
        }

        // 스토어에 없더라도 fallbackData가 있으면 (예: 멤버 관리 페이지의 pending 유저) 해당 데이터 사용
        if (fallbackData) {
            const isPending = fallbackData.status === 'pending'
            return {
                ...fallbackData,
                uid,
                // pending 유저면 원본 닉네임 사용, 아니면 '알 수 없음' 문구 추가
                nickname: isPending ? (fallbackData.nickname || '승인 대기 유저') : (fallbackData.nickname ? `${fallbackData.nickname} (알 수 없음)` : '알 수 없는 사용자'),
                isUnknown: !isPending
            }
        }

        // 정말로 정보가 없는 유저
        return {
            uid,
            nickname: '알 수 없는 사용자',
            profileImageId: 'avatar_bronze_01',
            tier: 'Bronze',
            isUnknown: true
        }
    }

    return {
        resolveUser,
        usersStore
    }
}
