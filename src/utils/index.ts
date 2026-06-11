import dayjs from 'dayjs';
import type { BabyRecord, DailyStats, FeedingSubType } from '@/types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0分钟';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
  }
  return `${minutes}分钟`;
};

export const formatTime = (timestamp: number): string => {
  return dayjs(timestamp).format('HH:mm');
};

export const formatDate = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY-MM-DD');
};

export const formatDateTime = (timestamp: number): string => {
  return dayjs(timestamp).format('MM-DD HH:mm');
};

export const formatFullDate = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY年MM月DD日');
};

export const getBabyAge = (birthday: number): string => {
  const now = dayjs();
  const birth = dayjs(birthday);
  const days = now.diff(birth, 'day');
  const months = now.diff(birth, 'month');
  const years = Math.floor(months / 12);
  
  if (days < 30) {
    return `${days}天`;
  } else if (months < 12) {
    const remainDays = days - (months * 30);
    return remainDays > 0 ? `${months}个月${remainDays}天` : `${months}个月`;
  } else {
    const remainMonths = months % 12;
    return remainMonths > 0 ? `${years}岁${remainMonths}个月` : `${years}岁`;
  }
};

export const getTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(timestamp);
};

export const getFeedingTypeLabel = (subType: FeedingSubType): string => {
  const map: Record<FeedingSubType, string> = {
    breast_left: '母乳左侧',
    breast_right: '母乳右侧',
    bottle: '瓶喂',
    formula: '配方奶'
  };
  return map[subType];
};

export const calculateDailyStats = (records: BabyRecord[], date: string): DailyStats => {
  const dayStart = dayjs(date).startOf('day').valueOf();
  const dayEnd = dayjs(date).endOf('day').valueOf();
  const dayRecords = records.filter(r => r.timestamp >= dayStart && r.timestamp <= dayEnd);
  
  const stats: DailyStats = {
    date,
    feedingCount: 0,
    feedingTotalAmount: 0,
    breastLeftDuration: 0,
    breastRightDuration: 0,
    bottleAmount: 0,
    formulaAmount: 0,
    solidCount: 0,
    diaperCount: 0,
    sleepTotalDuration: 0,
    sleepCount: 0
  };
  
  dayRecords.forEach(record => {
    if (record.type === 'feeding') {
      stats.feedingCount++;
      if (record.subType === 'breast_left') {
        stats.breastLeftDuration += record.duration || 0;
      } else if (record.subType === 'breast_right') {
        stats.breastRightDuration += record.duration || 0;
      } else if (record.subType === 'bottle') {
        stats.bottleAmount += record.amount || 0;
        stats.feedingTotalAmount += record.amount || 0;
      } else if (record.subType === 'formula') {
        stats.formulaAmount += record.amount || 0;
        stats.feedingTotalAmount += record.amount || 0;
      }
    } else if (record.type === 'solid') {
      stats.solidCount++;
    } else if (record.type === 'diaper') {
      stats.diaperCount++;
    } else if (record.type === 'sleep') {
      stats.sleepCount++;
      stats.sleepTotalDuration += (record.endTime - record.startTime) / 1000;
    }
  });
  
  return stats;
};

export const getDateList = (days: number): string[] => {
  const list: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    list.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return list;
};

export const getMonthDateList = (): string[] => {
  const list: string[] = [];
  const daysInMonth = dayjs().daysInMonth();
  for (let i = 1; i <= daysInMonth; i++) {
    list.push(dayjs().date(i).format('YYYY-MM-DD'));
  }
  return list;
};
