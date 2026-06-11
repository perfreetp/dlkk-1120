import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { BabyRecord } from '@/types';
import { formatDuration, getFeedingTypeLabel, getTimeAgo } from '@/utils';

interface RecordItemProps {
  record: BabyRecord;
  onClick?: () => void;
}

const getRecordDetail = (record: BabyRecord): { icon: string; title: string; detail: string } => {
  switch (record.type) {
    case 'feeding':
      const feedingIcon = record.subType.includes('breast') ? '🍼' : '🥛';
      const feedingTitle = getFeedingTypeLabel(record.subType);
      let feedingDetail = '';
      if (record.subType === 'breast_left' || record.subType === 'breast_right') {
        feedingDetail = `时长 ${formatDuration(record.duration || 0)}`;
      } else if (record.subType === 'bottle') {
        feedingDetail = `奶量 ${record.amount}ml`;
      } else if (record.subType === 'formula') {
        feedingDetail = `奶量 ${record.amount}ml · 水温 ${record.formulaWaterTemp}°C · 奶粉 ${record.formulaAmount}勺`;
      }
      return { icon: feedingIcon, title: feedingTitle, detail: feedingDetail };
    case 'solid':
      return {
        icon: '🥣',
        title: '辅食',
        detail: `${record.ingredients.join('、')}${record.amount ? ` · ${record.amount}g` : ''}${record.allergyLevel !== 'none' ? ' · 有过敏反应' : ''}`
      };
    case 'diaper':
      const diaperColorMap: Record<string, string> = {
        yellow: '黄色', green: '绿色', brown: '棕色', black: '黑色', red: '红色', other: '其他'
      };
      const diaperTextureMap: Record<string, string> = {
        soft: '软便', normal: '正常', hard: '硬便', watery: '水样', mucus: '粘液', bloody: '血便'
      };
      return {
        icon: '🧷',
        title: '尿布',
        detail: `${record.hasPee ? '尿' : ''}${record.hasPoop ? '便' : ''} · ${diaperColorMap[record.color]}${record.hasPoop ? ` · ${diaperTextureMap[record.texture]}` : ''}`
      };
    case 'sleep':
      const sleepQualityMap: Record<string, string> = { good: '好', normal: '一般', poor: '差' };
      return {
        icon: '😴',
        title: '睡眠',
        detail: `${formatDuration((record.endTime - record.startTime) / 1000)} · 质量${sleepQualityMap[record.quality]}`
      };
    case 'growth':
      const parts: string[] = [];
      if (record.height) parts.push(`身高${record.height}cm`);
      if (record.weight) parts.push(`体重${record.weight}kg`);
      if (record.headCircumference) parts.push(`头围${record.headCircumference}cm`);
      return { icon: '📏', title: '成长记录', detail: parts.join(' · ') };
    default:
      return { icon: '📝', title: '记录', detail: '' };
  }
};

const RecordItem: React.FC<RecordItemProps> = ({ record, onClick }) => {
  const { icon, title, detail } = getRecordDetail(record);
  const hasPhotos = record.photos && record.photos.length > 0;

  const handlePhotoClick = (e: any) => {
    e.stopPropagation?.();
    if (hasPhotos) {
      Taro.previewImage({
        current: record.photos![0],
        urls: record.photos!
      });
    }
  };

  return (
    <View className={styles.recordItem} onClick={onClick}>
      <View className={classnames(styles.iconWrap, styles[record.type])}>
        <Text className={styles.iconText}>{icon}</Text>
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.title}>{title}</Text>
          <Text className={styles.time}>{getTimeAgo(record.timestamp)}</Text>
        </View>
        <Text className={styles.detail}>{detail}</Text>
        {hasPhotos && (
          <View className={styles.photoRow}>
            {record.photos!.slice(0, 4).map((photo, idx) => (
              <Image
                key={idx}
                className={styles.thumbImg}
                src={photo}
                mode="aspectFill"
                onClick={handlePhotoClick}
              />
            ))}
            {record.photos!.length > 4 && (
              <View className={styles.photoMore}>
                <Text className={styles.photoMoreText}>+{record.photos!.length - 4}</Text>
              </View>
            )}
          </View>
        )}
        <View className={styles.meta}>
          {record.note && <Text className={styles.note}>📝 {record.note}</Text>}
          <Text className={styles.author}>{record.createdBy}</Text>
        </View>
      </View>
    </View>
  );
};

export default RecordItem;
