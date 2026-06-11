import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import { BarChart } from '@/components/Chart';
import EmptyState from '@/components/EmptyState';
import type { GrowthRecord } from '@/types';
import { formatFullDate } from '@/utils';

type MetricType = 'height' | 'weight' | 'head';

const GrowthPage: React.FC = () => {
  const { records } = useBabyStore();
  const [activeMetric, setActiveMetric] = useState<MetricType>('weight');

  const growthRecords = useMemo(() => {
    return records
      .filter((r): r is GrowthRecord => r.type === 'growth')
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [records]);

  const latestRecord = growthRecords[growthRecords.length - 1];

  const chartData = useMemo(() => {
    const fieldMap: Record<MetricType, string> = {
      height: 'height',
      weight: 'weight',
      head: 'headCircumference'
    };
    return growthRecords.slice(-6).map((r) => ({
      label: formatFullDate(r.timestamp).slice(5).replace('月', '/').replace('日', ''),
      value: (r as any)[fieldMap[activeMetric]] || 0
    }));
  }, [growthRecords, activeMetric]);

  return (
    <View className={styles.page}>
      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>最新记录</Text>
        {latestRecord ? (
          <View className={styles.summaryStats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>
                {latestRecord.height || '--'}
                <Text className={styles.statUnit}>cm</Text>
              </Text>
              <Text className={styles.statLabel}>身高</Text>
            </View>
            <View className={styles.divider} />
            <View className={styles.statItem}>
              <Text className={styles.statValue}>
                {latestRecord.weight || '--'}
                <Text className={styles.statUnit}>kg</Text>
              </Text>
              <Text className={styles.statLabel}>体重</Text>
            </View>
            <View className={styles.divider} />
            <View className={styles.statItem}>
              <Text className={styles.statValue}>
                {latestRecord.headCircumference || '--'}
                <Text className={styles.statUnit}>cm</Text>
              </Text>
              <Text className={styles.statLabel}>头围</Text>
            </View>
          </View>
        ) : (
          <EmptyState icon="📏" text="暂无成长数据" />
        )}
      </View>

      <View className={styles.metricTabs}>
        {[
          { value: 'height', label: '身高' },
          { value: 'weight', label: '体重' },
          { value: 'head', label: '头围' }
        ].map((opt) => (
          <Text
            key={opt.value}
            className={classnames(styles.metricTab, activeMetric === opt.value && styles.metricTabActive)}
            onClick={() => setActiveMetric(opt.value as MetricType)}
          >
            {opt.label}
          </Text>
        ))}
      </View>

      <ScrollView scrollY>
        <View className={styles.chartSection}>
          {chartData.length > 0 ? (
            <BarChart title="成长趋势" data={chartData} />
          ) : (
            <EmptyState icon="📊" text="数据不足，无法生成图表" />
          )}
        </View>

        <View className={styles.recordsList}>
          {growthRecords.slice().reverse().map((record) => (
            <View key={record.id} className={styles.recordRow}>
              <Text className={styles.recordDate}>{formatFullDate(record.timestamp)}</Text>
              <View className={styles.recordMetrics}>
                <View className={styles.recordMetric}>
                  <Text className={styles.recordMetricValue}>{record.height || '--'}</Text>
                  <Text className={styles.recordMetricLabel}>身高cm</Text>
                </View>
                <View className={styles.recordMetric}>
                  <Text className={styles.recordMetricValue}>{record.weight || '--'}</Text>
                  <Text className={styles.recordMetricLabel}>体重kg</Text>
                </View>
                <View className={styles.recordMetric}>
                  <Text className={styles.recordMetricValue}>{record.headCircumference || '--'}</Text>
                  <Text className={styles.recordMetricLabel}>头围cm</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        className={styles.addBtn}
        onClick={() => Taro.navigateTo({ url: '/pages/growth-edit/index' })}
      >
        <Text className={styles.addBtnText}>+</Text>
      </View>
    </View>
  );
};

export default GrowthPage;
