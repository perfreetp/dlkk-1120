import type { BabyRecord, Reminder, FamilyMember, BabyInfo } from '@/types';

export const mockBabyInfo: BabyInfo = {
  name: '小汤圆',
  gender: 'girl',
  birthday: new Date('2026-02-15').getTime(),
  avatar: 'https://picsum.photos/id/64/200/200'
};

export const mockRecords: BabyRecord[] = [
  {
    id: 'r1',
    type: 'feeding',
    subType: 'breast_left',
    timestamp: Date.now() - 1000 * 60 * 30,
    duration: 840,
    createdBy: '妈妈',
    createdAt: Date.now() - 1000 * 60 * 30,
    updatedAt: Date.now() - 1000 * 60 * 30
  },
  {
    id: 'r2',
    type: 'diaper',
    color: 'yellow',
    texture: 'soft',
    hasPee: true,
    hasPoop: true,
    amount: 'medium',
    timestamp: Date.now() - 1000 * 60 * 60,
    note: '量适中',
    createdBy: '妈妈',
    createdAt: Date.now() - 1000 * 60 * 60,
    updatedAt: Date.now() - 1000 * 60 * 60
  },
  {
    id: 'r3',
    type: 'sleep',
    startTime: Date.now() - 1000 * 60 * 60 * 2,
    endTime: Date.now() - 1000 * 60 * 30,
    quality: 'good',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    environment: '安静',
    createdBy: '妈妈',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2
  },
  {
    id: 'r4',
    type: 'feeding',
    subType: 'bottle',
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
    amount: 120,
    createdBy: '月嫂',
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 3
  },
  {
    id: 'r5',
    type: 'solid',
    ingredients: ['米粉', '南瓜泥'],
    amount: 50,
    allergyLevel: 'none',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    note: '吃得不错',
    createdBy: '妈妈',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 5
  },
  {
    id: 'r6',
    type: 'feeding',
    subType: 'breast_right',
    timestamp: Date.now() - 1000 * 60 * 60 * 6,
    duration: 900,
    createdBy: '妈妈',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 6
  },
  {
    id: 'r7',
    type: 'diaper',
    color: 'yellow',
    texture: 'normal',
    hasPee: true,
    hasPoop: false,
    amount: 'light',
    timestamp: Date.now() - 1000 * 60 * 60 * 7,
    createdBy: '爸爸',
    createdAt: Date.now() - 1000 * 60 * 60 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 7
  },
  {
    id: 'r8',
    type: 'sleep',
    startTime: Date.now() - 1000 * 60 * 60 * 10,
    endTime: Date.now() - 1000 * 60 * 60 * 7,
    quality: 'normal',
    timestamp: Date.now() - 1000 * 60 * 60 * 10,
    createdBy: '妈妈',
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 10
  },
  {
    id: 'r9',
    type: 'feeding',
    subType: 'formula',
    timestamp: Date.now() - 1000 * 60 * 60 * 11,
    amount: 150,
    formulaWaterTemp: 45,
    formulaAmount: 5,
    createdBy: '月嫂',
    createdAt: Date.now() - 1000 * 60 * 60 * 11,
    updatedAt: Date.now() - 1000 * 60 * 60 * 11
  },
  {
    id: 'r10',
    type: 'growth',
    height: 65.5,
    weight: 7.2,
    headCircumference: 42.5,
    timestamp: new Date('2026-06-01').getTime(),
    createdBy: '妈妈',
    createdAt: new Date('2026-06-01').getTime(),
    updatedAt: new Date('2026-06-01').getTime()
  },
  {
    id: 'r11',
    type: 'growth',
    height: 63.2,
    weight: 6.8,
    headCircumference: 41.8,
    timestamp: new Date('2026-05-01').getTime(),
    createdBy: '妈妈',
    createdAt: new Date('2026-05-01').getTime(),
    updatedAt: new Date('2026-05-01').getTime()
  },
  {
    id: 'r12',
    type: 'growth',
    height: 60.5,
    weight: 6.2,
    headCircumference: 40.5,
    timestamp: new Date('2026-04-01').getTime(),
    createdBy: '妈妈',
    createdAt: new Date('2026-04-01').getTime(),
    updatedAt: new Date('2026-04-01').getTime()
  }
];

export const mockReminders: Reminder[] = [
  {
    id: 'rem1',
    title: '乙肝疫苗第三针',
    type: 'vaccine',
    timestamp: new Date('2026-06-20T09:00:00').getTime(),
    isCompleted: false,
    note: '社区卫生服务中心'
  },
  {
    id: 'rem2',
    title: '6个月体检',
    type: 'checkup',
    timestamp: new Date('2026-06-25T10:00:00').getTime(),
    isCompleted: false,
    note: '儿科医院'
  },
  {
    id: 'rem3',
    title: '补充维生素D',
    type: 'custom',
    timestamp: Date.now() + 1000 * 60 * 60 * 2,
    repeat: 'daily',
    isCompleted: false
  },
  {
    id: 'rem4',
    title: '百白破疫苗',
    type: 'vaccine',
    timestamp: new Date('2026-07-15T09:00:00').getTime(),
    isCompleted: false
  },
  {
    id: 'rem5',
    title: '口服轮状病毒',
    type: 'vaccine',
    timestamp: new Date('2026-05-20T09:00:00').getTime(),
    isCompleted: true
  }
];

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'm1',
    name: '妈妈',
    role: '管理员',
    avatar: 'https://picsum.photos/id/91/200/200',
    permissions: ['all'],
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 120
  },
  {
    id: 'm2',
    name: '爸爸',
    role: '成员',
    avatar: 'https://picsum.photos/id/177/200/200',
    permissions: ['read', 'write'],
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 118
  },
  {
    id: 'm3',
    name: '月嫂李阿姨',
    role: '月嫂',
    avatar: 'https://picsum.photos/id/338/200/200',
    permissions: ['read', 'write'],
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 30
  }
];

export const solidIngredients = [
  '米粉', '大米粥', '小米粥', '面条', '馒头',
  '蛋黄', '鸡蛋羹',
  '南瓜泥', '胡萝卜泥', '土豆泥', '红薯泥', '山药泥',
  '苹果泥', '香蕉泥', '牛油果泥', '梨泥',
  '西兰花泥', '菠菜泥', '青菜泥',
  '牛肉泥', '鸡肉泥', '猪肉泥', '鱼肉泥',
  '豆腐', '酸奶'
];

export const allergySymptoms = [
  '皮疹', '荨麻疹', '呕吐', '腹泻', '呼吸困难',
  '面部肿胀', '嘴唇肿胀', '流鼻涕', '咳嗽', '眼睛红肿'
];
