import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import { BarChart } from '@/components/Chart';
import { calculateDailyStats, getDateList, formatDuration } from '@/utils';
import dayjs from 'dayjs';

type RangeType = 'day' | 'week' | 'month';

const StatisticsPage: React.FC = () => {
  const { records } = useBabyStore();
  const [range, setRange] = useState<RangeType>('week');

  const days = range === 'day' ? 1 : range === 'week' ? 7 : 30;
  const dateList = getDateList(days);

  const statsData = useMemo(() => {
    const list = dateList.map((date) => calculateDailyStats(records, date));
    return list;
  }, [records, dateList]);

  const totalStats = useMemo(() => {
    return statsData.reduce(
      (acc, cur) => ({
        feeding: acc.feeding + cur.feedingCount,
        solid: acc.solid + cur.solidCount,
        diaper: acc.diaper + cur.diaperCount,
        sleep: acc.sleep + cur.sleepTotalDuration,
        milk: acc.milk + cur.feedingTotalAmount
      }),
      { feeding: 0, solid: 0, diaper: 0, sleep: 0, milk: 0 }
    );
  }, [statsData]);

  const feedingChartData = useMemo(() => {
    return statsData.slice(-7).map((s) => ({
      label: dayjs(s.date).format('DD'),
      value: s.feedingCount
    }));
  }, [statsData]);

  const diaperChartData = useMemo(() => {
    return statsData.slice(-7).map((s) => ({
      label: dayjs(s.date).format('DD'),
      value: s.diaperCount
    }));
  }, [statsData]);

  const sleepChartData = useMemo(() => {
    return statsData.slice(-7).map((s) => ({
      label: dayjs(s.date).format('DD'),
      value: Math.round(s.sleepTotalDuration / 3600 * 10) / 10
    }));
  }, [statsData]);

  return (
    <View className={styles.page}>
      <View className={styles.rangeTabs}>
        {[
          { value: 'day', label: '今日' },
          { value: 'week', label: '本周' },
          { value: 'month', label: '本月' }
        ].map((opt) => (
          <Text
            key={opt.value}
            className={classnames(styles.rangeTab, range === opt.value && styles.rangeTabActive)}
            onClick={() => setRange(opt.value as RangeType)}
          >
            {opt.label}
          </Text>
        ))}
      </View>

      <ScrollView scrollY>
        <View className={styles.summaryGrid}>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>喂奶次数</Text>
            <Text className={styles.summaryValue}>
              {totalStats.feeding}
              <Text className={styles.summaryUnit}>次</Text>
            </Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>喂奶总量</Text>
            <Text className={styles.summaryValue}>
              {totalStats.milk}
              <Text className={styles.summaryUnit}>ml</Text>
            </Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>辅食次数</Text>
            <Text className={styles.summaryValue}>
              {totalStats.solid}
              <Text className={styles.summaryUnit}>次</Text>
            </Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>尿布次数</Text>
            <Text className={styles.summaryValue}>
              {totalStats.diaper}
              <Text className={styles.summaryUnit}>次</Text>
            </Text>
          </View>
        </View>

        <View className={styles.chartSection}>
          <BarChart title="近7天喂奶次数" data={feedingChartData} />
        </View>

        <View className={styles.chartSection}>
          <BarChart title="近7天尿布次数" data={diaperChartData} />
        </View>

        <View className={styles.chartSection}>
          <BarChart title="近7天睡眠时长(小时)" data={sleepChartData} />
        </View>
      </ScrollView>
    </View>
  );
};

export default StatisticsPage;
