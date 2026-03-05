export interface Avatar {
  id: string;
  name: string;
  src: string;
  requiredLevel: number;
  description: string;
}

export const AVATARS: Avatar[] = [
  {
    id: 'avatar_bronze_01',
    name: '독서 새싹 고양이',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    requiredLevel: 1,
    description: '독서를 막 시작한 귀여운 고양이 로봇입니다.',
  },
  {
    id: 'avatar_bronze_02',
    name: '열정적인 강아지',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=Buster',
    requiredLevel: 2,
    description: '레벨 2 달성! 책의 즐거움을 알게 된 강아지.',
  },
  {
    id: 'avatar_silver_01',
    name: '지혜로운 부엉이',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=Oliver',
    requiredLevel: 5,
    description: '레벨 5 달성! 지혜가 쌓이기 시작합니다.',
  },
  {
    id: 'avatar_silver_02',
    name: '통찰의 여우',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mimi',
    requiredLevel: 7,
    description: '레벨 7 달성! 책 속의 숨은 의미를 발견합니다.',
  },
  {
    id: 'avatar_gold_01',
    name: '독서왕 사자',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=Leo',
    requiredLevel: 10,
    description: '레벨 10 달성! 북클럽의 진정한 독서왕.',
  },
  {
    id: 'avatar_master_01',
    name: '전설의 용',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dragon',
    requiredLevel: 20,
    description: '레벨 20 달성! 모두가 우러러보는 전설적인 존재.',
  }
];
