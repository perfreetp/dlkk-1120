import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import StatCard from '@/components/StatCard';
import QuickAction from '@/components/QuickAction';
import SectionHeader from '@/components/SectionHeader';
import RecordItem from '@/components/RecordItem';
import EmptyState from '@/components/EmptyState';
import { getBabyAge, getTimeAgo, calculateDailyStats, formatDuration } from '@/utils';
import dayjs from 'dayjs';

type DateRange = 'today' | 'week' | 'month';

const HomePage: React.FC = () => {
  const { babyInfo, records, deleteRecord, undoDelete, lastDeletedRecord, isNightMode } = useBabyStore();
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [showUndo, setShowUndo] = useState(false);

  const todayStats = useMemo(() => {
    return calculateDailyStats(records, dayjs().format('YYYY-MM-DD'));
  }, [records]);

  const weekStats = useMemo(() => {
    let feeding = 0, solid = 0, diaper = 0, sleep = 0;
    for (let i = 0; i < 7; i++) {
      const stats = calculateDailyStats(records, dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
      feeding += stats.feedingCount;
      solid += stats.solidCount;
      diaper += stats.diaperCount;
      sleep += stats.sleepTotalDuration;
    }
    return { feeding, solid, diaper, sleep };
  }, [records]);

  const displayStats = dateRange === 'today' ? {
    feeding: todayStats.feedingCount,
    solid: todayStats.solidCount,
    diaper: todayStats.diaperCount,
    sleep: todayStats.sleepTotalDuration
  } : weekStats;

  const lastRecord = records[0];

  const handleQuickAction = (type: string) => {
    const pageMap: Record<string, string> = {
      breast_left: '/pages/feeding-edit/index?subType=breast_left',
      breast_right: '/pages/feeding-edit/index?subType=breast_right',
      bottle: '/pages/feeding-edit/index?subType=bottle',
      solid: '/pages/solid-edit/index',
      diaper: '/pages/diaper-edit/index',
      sleep: '/pages/sleep-edit/index'
    };
    Taro.navigateTo({ url: pageMap[type] || pageMap.bottle });
  };

  const handleDeleteRecord = (id: string) => {
    deleteRecord(id);
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 3000);
  };

  const handleUndo = () => {
    undoDelete();
    setShowUndo(false);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.babyInfo}>
          <Image
            className={styles.avatar}
            src={babyInfo.avatar || 'https://picsum.photos/id/64/200/200'}
            mode="aspectFill"
          />
          <View>
            <View className={styles.nameRow}>
              <Text className={styles.babyName}>{babyInfo.name}</Text>
              <Text className={styles.genderTag}>{babyInfo.gender === 'girl' ? '👧 女宝' : '👦 男宝'}</Text>
            </View>
            <Text className={styles.babyAge}>{getBabyAge(babyInfo.birthday)}</Text>
          </View>
        </View>
        {lastRecord && (
          <View className={styles.lastRecord}>
            <Text className={styles.lastLabel}>距上次记录</Text>
            <Text className={styles.lastText}>
              {getTimeAgo(lastRecord.timestamp)} · 上次是{lastRecord.type === 'feeding' ? '喂奶' : lastRecord.type === 'solid' ? '辅食' : lastRecord.type === 'diaper' ? '尿布' : lastRecord.type === 'sleep' ? '睡眠' : '成长'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.dateTabs}>
          {(['today', 'week', 'month'] as DateRange[]).map((tab) => (
            <Text
              key={tab}
              className={classnames(styles.dateTab, dateRange === tab && styles.dateTabActive)}
              onClick={() => setDateRange(tab)}
            >
              {tab === 'today' ? '今日' : tab === 'week' ? '本周' : '本月'}
            </Text>
          ))}
        </View>

        <View className={styles.statsGrid}>
          <StatCard
            icon="🍼"
            type="feeding"
            value={displayStats.feeding}
            unit="次"
            label="喂奶"
          />
          <StatCard
            icon="🥣"
            type="solid"
            value={displayStats.solid}
            unit="次"
            label="辅食"
          />
          <StatCard
            icon="🧷"
            type="diaper"
            value={displayStats.diaper}
            unit="次"
            label="尿布"
          />
          <StatCard
            icon="😴"
            type="sleep"
            value={dateRange === 'today' ? Math.round(todayStats.sleepTotalDuration / 3600 * 10) / 10 : Math.round(weekStats.sleep / 3600 * 10) / 10}
            unit="小时"
            label="睡眠"
          />
        </View>

        <SectionHeader title="快捷录入" />
        <View className={styles.quickActions}>
          <QuickAction icon="🤱" label="母乳左" onClick={() => handleQuickAction('breast_left')} />
          <QuickAction icon="🤱" label="母乳右" onClick={() => handleQuickAction('breast_right')} />
          <QuickAction icon="🍼" label="瓶喂" onClick={() => handleQuickAction('bottle')} />
          <QuickAction icon="🥣" label="辅食" onClick={() => handleQuickAction('solid')} />
          <QuickAction icon="🧷" label="尿布" onClick={() => handleQuickAction('diaper')} />
          <QuickAction icon="😴" label="睡眠" onClick={() => handleQuickAction('sleep')} />
          <QuickAction icon="📏" label="成长" onClick={() => Taro.navigateTo({ url: '/pages/growth-edit/index' })} />
          <QuickAction icon="📊" label="统计" onClick={() => Taro.navigateTo({ url: '/pages/statistics/index' })} />
        </View>

        <SectionHeader title="最近记录" actionText="查看全部" onAction={() => Taro.switchTab({ url: '/pages/record/index' })} />
        <View className={styles.recordsList}>
          {records.slice(0, 10).map((record) => (
            <RecordItem
              key={record.id}
              record={record}
              onClick={() => {
                Taro.showActionSheet({
                  itemList: ['删除记录', '补录修改'],
                  success: (res) => {
                    if (res.tapIndex === 0) {
                      handleDeleteRecord(record.id);
                    }
                  }
                });
              }}
            />
          ))}
          {records.length === 0 && <EmptyState icon="📝" text="还没有记录，快去添加吧" />}
        </View>
      </ScrollView>

      {showUndo && (
        <View className={styles.undoToast}>
          <Text>已删除一条记录</Text>
          <Text className={styles.undoBtn} onClick={handleUndo}>撤销</Text>
        </View>
      )}
    </View>
  );
};

export default HomePage;
