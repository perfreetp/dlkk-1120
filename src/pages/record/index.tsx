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

const typeOptions: { value: RecordType | 'all'; label: string; emptyText: string; emptyIcon: string }[] = [
  { value: 'all', label: '全部', emptyText: '还没有记录，点击右下角添加', emptyIcon: '📝' },
  { value: 'feeding', label: '喂奶', emptyText: '还没有喂奶记录，点击右下角开始记录', emptyIcon: '🍼' },
  { value: 'solid', label: '辅食', emptyText: '还没有辅食记录，点击右下角添加', emptyIcon: '🥣' },
  { value: 'diaper', label: '尿布', emptyText: '还没有尿布记录，点击右下角添加', emptyIcon: '🧷' },
  { value: 'sleep', label: '睡眠', emptyText: '还没有睡眠记录，点击右下角添加', emptyIcon: '🌙' },
  { value: 'growth', label: '成长', emptyText: '还没有成长记录，点击右下角测量身高体重', emptyIcon: '📏' }
];

const addSheetMap: Record<string, string[]> = {
  all: ['母乳左侧', '母乳右侧', '瓶喂', '配方奶', '辅食', '尿布', '睡眠', '成长'],
  feeding: ['母乳左侧', '母乳右侧', '瓶喂', '配方奶'],
  solid: ['辅食'],
  diaper: ['尿布'],
  sleep: ['睡眠'],
  growth: ['成长']
};

const addUrlMap: Record<string, string> = {
  '母乳左侧': '/pages/feeding-edit/index?subType=breast_left',
  '母乳右侧': '/pages/feeding-edit/index?subType=breast_right',
  '瓶喂': '/pages/feeding-edit/index?subType=bottle',
  '配方奶': '/pages/feeding-edit/index?subType=formula',
  '辅食': '/pages/solid-edit/index',
  '尿布': '/pages/diaper-edit/index',
  '睡眠': '/pages/sleep-edit/index',
  '成长': '/pages/growth-edit/index'
};

const RecordPage: React.FC = () => {
  const { records, deleteRecord } = useBabyStore();
  const [activeType, setActiveType] = useState<RecordType | 'all'>('all');

  const filteredRecords = useMemo(() => {
    if (activeType === 'all') return records;
    return records.filter((r) => r.type === activeType);
  }, [records, activeType]);

  const currentTypeOption = typeOptions.find(o => o.value === activeType) || typeOptions[0];

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
    const items = addSheetMap[activeType] || addSheetMap.all;
    if (items.length === 1) {
      Taro.navigateTo({ url: addUrlMap[items[0]] });
      return;
    }
    Taro.showActionSheet({
      itemList: items,
      success: (res) => {
        const url = addUrlMap[items[res.tapIndex]];
        if (url) Taro.navigateTo({ url });
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
          <EmptyState icon={currentTypeOption.emptyIcon} text={currentTypeOption.emptyText} />
        )}
      </ScrollView>

      <View className={styles.addBtn} onClick={handleAdd}>
        <Text className={styles.addBtnText}>+</Text>
      </View>
    </View>
  );
};

export default RecordPage;
