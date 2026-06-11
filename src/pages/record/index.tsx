import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import RecordItem from '@/components/RecordItem';
import EmptyState from '@/components/EmptyState';
import type { RecordType, BabyRecord } from '@/types';
import { formatDate, formatFullDate } from '@/utils';
import dayjs from 'dayjs';

const typeOptions: { value: RecordType | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'feeding', label: '喂奶' },
  { value: 'solid', label: '辅食' },
  { value: 'diaper', label: '尿布' },
  { value: 'sleep', label: '睡眠' }
];

const RecordPage: React.FC = () => {
  const { records, deleteRecord } = useBabyStore();
  const [activeType, setActiveType] = useState<RecordType | 'all'>('all');

  const filteredRecords = useMemo(() => {
    if (activeType === 'all') return records;
    return records.filter((r) => r.type === activeType);
  }, [records, activeType]);

  const groupedRecords = useMemo(() => {
    const groups: Record<string, BabyRecord[]> = {};
    filteredRecords.forEach((record) => {
      const date = formatDate(record.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(record);
    });
    return groups;
  }, [filteredRecords]);

  const handleAdd = () => {
    Taro.showActionSheet({
      itemList: ['母乳左侧', '母乳右侧', '瓶喂', '配方奶', '辅食', '尿布', '睡眠'],
      success: (res) => {
        const pages = [
          '/pages/feeding-edit/index?subType=breast_left',
          '/pages/feeding-edit/index?subType=breast_right',
          '/pages/feeding-edit/index?subType=bottle',
          '/pages/feeding-edit/index?subType=formula',
          '/pages/solid-edit/index',
          '/pages/diaper-edit/index',
          '/pages/sleep-edit/index'
        ];
        Taro.navigateTo({ url: pages[res.tapIndex] });
      }
    });
  };

  const handleRecordClick = (record: BabyRecord) => {
    Taro.showActionSheet({
      itemList: ['查看编辑', '删除记录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          const pageMap: Record<string, string> = {
            feeding: `/pages/feeding-edit/index?id=${record.id}`,
            solid: `/pages/solid-edit/index?id=${record.id}`,
            diaper: `/pages/diaper-edit/index?id=${record.id}`,
            sleep: `/pages/sleep-edit/index?id=${record.id}`,
            growth: `/pages/growth-edit/index?id=${record.id}`
          };
          const url = pageMap[record.type];
          if (url) Taro.navigateTo({ url });
        } else if (res.tapIndex === 1) {
          deleteRecord(record.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.typeTabs}>
        {typeOptions.map((opt) => (
          <Text
            key={opt.value}
            className={classnames(styles.typeTab, activeType === opt.value && styles.typeTabActive)}
            onClick={() => setActiveType(opt.value)}
          >
            {opt.label}
          </Text>
        ))}
      </View>

      <ScrollView scrollY>
        {Object.keys(groupedRecords).length > 0 ? (
          Object.keys(groupedRecords).map((date) => (
            <View key={date} className={styles.dateGroup}>
              <View className={styles.dateHeader}>
                <Text className={styles.dateTitle}>
                  {date === formatDate(Date.now()) ? '今天' : formatFullDate(new Date(date).getTime())}
                </Text>
                <Text className={styles.dateSummary}>{groupedRecords[date].length} 条记录</Text>
              </View>
              {groupedRecords[date].map((record) => (
                <RecordItem
                  key={record.id}
                  record={record}
                  onClick={() => handleRecordClick(record)}
                />
              ))}
            </View>
          ))
        ) : (
          <EmptyState icon="📝" text="还没有记录，点击右下角添加" />
        )}
      </ScrollView>

      <View className={styles.addBtn} onClick={handleAdd}>
        <Text className={styles.addBtnText}>+</Text>
      </View>
    </View>
  );
};

export default RecordPage;
