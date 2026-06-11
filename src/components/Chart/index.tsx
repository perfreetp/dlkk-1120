import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  title?: string;
  data: BarChartData[];
  maxValue?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ title, data, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <View className={styles.chartContainer}>
      {title && <Text className={styles.chartTitle}>{title}</Text>}
      <View className={styles.barChart}>
        {data.map((item, index) => (
          <View key={index} className={styles.barWrap}>
            {item.value > 0 && <Text className={styles.barValue}>{item.value}</Text>}
            <View
              className={styles.bar}
              style={{ height: `${(item.value / max) * 180 + 10}rpx` }}
            />
          </View>
        ))}
      </View>
      <View className={styles.xLabels}>
        {data.map((item, index) => (
          <Text key={index} className={styles.xLabel}>{item.label}</Text>
        ))}
      </View>
    </View>
  );
};
