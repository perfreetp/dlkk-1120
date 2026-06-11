import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import { BarChart } from '@/components/Chart';
import { calculateDailyStats, getDateList, getMonthDateList, formatDuration } from '@/utils';
import dayjs from 'dayjs';

type RangeType = 'day' | 'week' | 'month';

const StatisticsPage: React.FC = () => {
  const { records } = useBabyStore();
  const [range, setRange] = useState<RangeType>('week');

  const dateList = useMemo(() => {
    if (range === 'day') return getDateList(1);
    if (range === 'week') return getDateList(7);
    return getMonthDateList();
  }, [range]);

  const statsData = useMemo(() => {
    return dateList.map((date) => calculateDailyStats(records, date));
  }, [records, dateList]);

  const totalStats = useMemo(() => {
    return statsData.reduce(
      (acc, cur) => ({
        feeding: acc.feeding + cur.feedingCount,
        solid: acc.solid + cur.solidCount,
        diaper: acc.diaper + cur.diaperCount,
        sleep: acc.sleep + cur.sleepTotalDuration,
        milk: acc.milk + cur.feedingTotalAmount,
        breastLeft: acc.breastLeft + cur.breastLeftDuration,
        breastRight: acc.breastRight + cur.breastRightDuration,
        bottle: acc.bottle + cur.bottleAmount,
        formula: acc.formula + cur.formulaAmount
      }),
      { feeding: 0, solid: 0, diaper: 0, sleep: 0, milk: 0, breastLeft: 0, breastRight: 0, bottle: 0, formula: 0 }
    );
  }, [statsData]);

  const chartDataCount = range === 'day' ? 1 : range === 'week' ? 7 : Math.min(30, dateList.length);
  const chartStats = statsData.slice(-chartDataCount);

  const feedingChartData = useMemo(() => {
    return chartStats.map((s) => ({
      label: dayjs(s.date).format('DD'),
      value: s.feedingCount
    }));
  }, [chartStats]);

  const diaperChartData = useMemo(() => {
    return chartStats.map((s) => ({
      label: dayjs(s.date).format('DD'),
      value: s.diaperCount
    }));
  }, [chartStats]);

  const sleepChartData = useMemo(() => {
    return chartStats.map((s) => ({
      label: dayjs(s.date).format('DD'),
      value: Math.round(s.sleepTotalDuration / 3600 * 10) / 10
    }));
  }, [chartStats]);

  const rangeLabel = range === 'day' ? '今日' : range === 'week' ? '本周' : '本月';

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

        <View className={styles.detailCard}>
          <Text className={styles.detailTitle}>🍼 {rangeLabel}喂奶明细</Text>
          <View className={styles.detailGrid}>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>母乳左侧</Text>
              <Text className={styles.detailValue}>{formatDuration(totalStats.breastLeft)}</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>母乳右侧</Text>
              <Text className={styles.detailValue}>{formatDuration(totalStats.breastRight)}</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>瓶喂总量</Text>
              <Text className={styles.detailValue}>{totalStats.bottle}ml</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>配方奶量</Text>
              <Text className={styles.detailValue}>{totalStats.formula}ml</Text>
            </View>
          </View>
        </View>

        <View className={styles.detailCard}>
          <Text className={styles.detailTitle}>😴 {rangeLabel}睡眠统计</Text>
          <View className={styles.detailGrid}>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>总时长</Text>
              <Text className={styles.detailValue}>{formatDuration(totalStats.sleep)}</Text>
            </View>
            <View className={styles.detailItem}>
              <Text className={styles.detailLabel}>日均时长</Text>
              <Text className={styles.detailValue}>
                {chartStats.length > 0 ? formatDuration(Math.round(totalStats.sleep / chartStats.length)) : '0分钟'}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.chartSection}>
          <BarChart title={`${rangeLabel}喂奶次数趋势`} data={feedingChartData} />
        </View>

        <View className={styles.chartSection}>
          <BarChart title={`${rangeLabel}尿布次数趋势`} data={diaperChartData} />
        </View>

        <View className={styles.chartSection}>
          <BarChart title={`${rangeLabel}睡眠时长趋势(小时)`} data={sleepChartData} />
        </View>
      </ScrollView>
    </View>
  );
};

export default StatisticsPage;
