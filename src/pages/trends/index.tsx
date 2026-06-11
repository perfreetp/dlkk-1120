import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { MultiLineChart, SeriesData } from '@/components/Chart';
import { aggregateByRange, TimeRange } from '@/utils';
import type { AggregatedStats } from '@/utils';

type MetricKey = 'growth' | 'feeding' | 'sleep';

const COLORS = {
  weight: '#FF8A9B',
  height: '#FFB088',
  feeding: '#7CB342',
  sleep: '#4FC3F7'
};

const TrendsPage: React.FC = () => {
  const { records } = useBabyStore();
  const [range, setRange] = useState<TimeRange>('month');
  const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>(['growth', 'feeding', 'sleep']);

  const aggregated: AggregatedStats[] = useMemo(() => {
    return aggregateByRange(records, range);
  }, [records, range]);

  const toggleMetric = (m: MetricKey) => {
    if (activeMetrics.includes(m)) {
      if (activeMetrics.length === 1) return;
      setActiveMetrics(activeMetrics.filter(x => x !== m));
    } else {
      setActiveMetrics([...activeMetrics, m]);
    }
  };

  const xLabels = aggregated.map(a => a.label);

  const buildSeries = (): SeriesData[] => {
    const list: SeriesData[] = [];
    if (activeMetrics.includes('growth')) {
      list.push({
        name: '体重(kg)',
        color: COLORS.weight,
        data: aggregated.map(a => a.weight ?? null) as number[]
      });
      list.push({
        name: '身高(cm)',
        color: COLORS.height,
        data: aggregated.map(a => a.height ?? null) as number[]
      });
    }
    if (activeMetrics.includes('feeding')) {
      list.push({
        name: '奶量(ml)',
        color: COLORS.feeding,
        data: aggregated.map(a => range === 'week' ? a.feedingAmount : Math.round(a.feedingAmount / (range === 'month' ? 30 : 90)))
      });
    }
    if (activeMetrics.includes('sleep')) {
      list.push({
        name: '睡眠(小时/天)',
        color: COLORS.sleep,
        data: aggregated.map(a => {
          const totalSeconds = a.sleepSeconds;
          const days = range === 'week' ? 7 : range === 'month' ? 30 : 90;
          if (totalSeconds <= 0) return 0;
          return Math.round((totalSeconds / 3600 / days) * 10) / 10;
        })
      });
    }
    return list;
  };

  const series = buildSeries();
  const rightSeriesIndexes: number[] = [];
  series.forEach((s, i) => {
    if (s.name === '奶量(ml)' || s.name === '睡眠(小时/天)') rightSeriesIndexes.push(i);
  });

  const hasAny = useMemo(() => {
    if (activeMetrics.includes('growth') && aggregated.some(a => a.weight || a.height)) return true;
    if (activeMetrics.includes('feeding') && aggregated.some(a => a.feedingAmount > 0)) return true;
    if (activeMetrics.includes('sleep') && aggregated.some(a => a.sleepSeconds > 0)) return true;
    return false;
  }, [aggregated, activeMetrics]);

  const latest = aggregated[aggregated.length - 1];
  const prev = aggregated[aggregated.length - 2];

  const computeDiff = (cur?: number, prevVal?: number) => {
    if (cur === undefined || prevVal === undefined) return null;
    const diff = cur - prevVal;
    return diff;
  };

  return (
    <View className={styles.page}>
      <View className={styles.rangeTabs}>
        {[
          { value: 'week', label: '按周' },
          { value: 'month', label: '按月' },
          { value: 'quarter', label: '按季' }
        ].map(t => (
          <Text
            key={t.value}
            className={`${styles.rangeTab} ${range === t.value ? styles.rangeTabActive : ''}`}
            onClick={() => setRange(t.value as TimeRange)}
          >
            {t.label}
          </Text>
        ))}
      </View>

      <View className={styles.summaryRow}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>最新体重</Text>
          <Text className={styles.summaryValue}>
            {latest?.weight ? latest.weight.toFixed(1) : '--'}
            <Text className={styles.summaryUnit}>kg</Text>
          </Text>
          {computeDiff(latest?.weight, prev?.weight) !== null && (
            <Text className={`${styles.summaryChange} ${(computeDiff(latest!.weight!, prev!.weight!) || 0) >= 0 ? styles.summaryChangeUp : styles.summaryChangeDown}`}>
              {(computeDiff(latest!.weight!, prev!.weight!) || 0) >= 0 ? '↑' : '↓'} {Math.abs(computeDiff(latest!.weight!, prev!.weight!) || 0).toFixed(1)} kg
            </Text>
          )}
        </View>

        <View className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>最新身高</Text>
          <Text className={styles.summaryValue}>
            {latest?.height ? latest.height.toFixed(1) : '--'}
            <Text className={styles.summaryUnit}>cm</Text>
          </Text>
          {computeDiff(latest?.height, prev?.height) !== null && (
            <Text className={`${styles.summaryChange} ${(computeDiff(latest!.height!, prev!.height!) || 0) >= 0 ? styles.summaryChangeUp : styles.summaryChangeDown}`}>
              {(computeDiff(latest!.height!, prev!.height!) || 0) >= 0 ? '↑' : '↓'} {Math.abs(computeDiff(latest!.height!, prev!.height!) || 0).toFixed(1)} cm
            </Text>
          )}
        </View>

        <View className={styles.summaryCard}>
          <Text className={styles.summaryLabel}>日均睡眠</Text>
          <Text className={styles.summaryValue}>
            {latest && latest.sleepSeconds > 0 ? Math.round((latest.sleepSeconds / 3600 / (range === 'week' ? 7 : range === 'month' ? 30 : 90)) * 10) / 10 : '--'}
            <Text className={styles.summaryUnit}>小时</Text>
          </Text>
        </View>
      </View>

      <View className={styles.metricFilterRow}>
        {[
          { key: 'growth', label: '成长指标', color: COLORS.weight },
          { key: 'feeding', label: '奶量', color: COLORS.feeding },
          { key: 'sleep', label: '睡眠', color: COLORS.sleep }
        ].map(m => (
          <Text
            key={m.key}
            className={`${styles.metricChip} ${activeMetrics.includes(m.key as MetricKey) ? styles.metricChipActive : ''}`}
            style={{
              borderColor: activeMetrics.includes(m.key as MetricKey) ? m.color : undefined,
              color: activeMetrics.includes(m.key as MetricKey) ? m.color : undefined
            }}
            onClick={() => toggleMetric(m.key as MetricKey)}
          >
            ● {m.label}
          </Text>
        ))}
      </View>

      <ScrollView scrollY>
        {!hasAny || aggregated.length === 0 ? (
          <View className={styles.emptyTrend}>
            <Text className={styles.emptyIcon}>📈</Text>
            <Text className={styles.emptyTitle}>暂无长期趋势数据</Text>
            <Text className={styles.emptyDesc}>先积累两周以上的记录，再来看看宝宝的成长和作息变化吧～</Text>
          </View>
        ) : (
          <>
            <MultiLineChart
              title={`综合趋势 · ${range === 'week' ? '按周' : range === 'month' ? '按月' : '按季度'}`}
              xLabels={xLabels}
              series={series}
              yLeftLabel='体重/身高'
              yRightLabel='奶量/睡眠'
              rightSeriesIndexes={rightSeriesIndexes.filter(i => i < series.length)}
            />

            <View className={styles.tipCard}>
              <Text className={styles.tipTitle}>💡 数据解读提示</Text>
              <Text className={styles.tipText}>
                · 成长曲线应持续上升，若体重/身高连续两期下降建议就医{'\n'}
                · 正常奶量参考：月龄×30ml/次，每日约8次{'\n'}
                · 推荐睡眠：新生儿16-20h/天，1岁约12-14h/天{'\n'}
                · 切换顶部「按周/按月/按季」可观察不同时间尺度变化
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default TrendsPage;
