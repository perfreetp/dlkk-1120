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

export interface SeriesData {
  name: string;
  color: string;
  data: number[];
}

interface MultiLineChartProps {
  title?: string;
  xLabels: string[];
  series: SeriesData[];
  yLeftLabel?: string;
  yRightLabel?: string;
  yLeftMax?: number;
  yRightMax?: number;
  rightSeriesIndexes?: number[];
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  title,
  xLabels,
  series,
  yLeftLabel,
  yRightLabel,
  yLeftMax,
  yRightMax,
  rightSeriesIndexes = []
}) => {
  const chartHeight = 300;
  const chartWidth = xLabels.length * 100;
  const width = Math.max(chartWidth, 100);

  const leftSeries = series.filter((_, i) => !rightSeriesIndexes.includes(i));
  const rightSeries = series.filter((_, i) => rightSeriesIndexes.includes(i));

  const yLeftMaxValue = yLeftMax || Math.max(1, ...leftSeries.flatMap(s => s.data));
  const yRightMaxValue = yRightMax || Math.max(1, ...rightSeries.flatMap(s => s.data), ...(rightSeries.length === 0 ? [1] : []));

  const getY = (value: number, idx: number) => {
    const isRight = rightSeriesIndexes.includes(idx);
    const maxVal = isRight ? yRightMaxValue : yLeftMaxValue;
    const ratio = value / maxVal;
    return chartHeight - ratio * (chartHeight - 60) - 30;
  };

  const getX = (i: number) => {
    if (xLabels.length === 1) return width / 2;
    return 60 + (i * (width - 120)) / (xLabels.length - 1);
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View className={styles.multiChartContainer}>
      {title && <Text className={styles.chartTitle}>{title}</Text>}

      <View className={styles.legendRow}>
        {series.map((s, i) => (
          <View key={i} className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: s.color }} />
            <Text className={styles.legendText}>{s.name}</Text>
          </View>
        ))}
      </View>

      <View className={styles.lineChartWrapper}>
        {(yLeftLabel || yRightLabel) && (
          <View className={styles.yLabels}>
            <View className={styles.yLabelLeft}>
              <Text className={styles.yLabelText}>{yLeftLabel}</Text>
              <Text className={styles.yLabelMax}>{yLeftMaxValue.toFixed(0)}</Text>
              <Text className={styles.yLabelMin}>0</Text>
            </View>
            {yRightLabel && (
              <View className={styles.yLabelRight}>
                <Text className={styles.yLabelText}>{yRightLabel}</Text>
                <Text className={styles.yLabelMax}>{yRightMaxValue.toFixed(0)}</Text>
                <Text className={styles.yLabelMin}>0</Text>
              </View>
            )}
          </View>
        )}

        <View
          className={styles.lineChart}
          style={{
            height: `${chartHeight}rpx`,
            minWidth: `${width}rpx`,
            position: 'relative'
          }}
        >
          {gridLines.map((ratio, i) => (
            <View
              key={i}
              className={styles.gridLine}
              style={{ top: `${chartHeight - ratio * (chartHeight - 60) - 30}rpx` }}
            />
          ))}

          <View className={styles.svgLines}>
            {series.map((s, si) => {
              const points = s.data
                .map((v, xi) => {
                  if (v === null || v === undefined) return null;
                  const x = getX(xi);
                  const y = getY(v, si);
                  return `${x}rpx,${y}rpx`;
                })
                .filter(Boolean) as string[];
              return (
                <View key={si} className={styles.seriesWrap}>
                  <View
                    className={styles.polyline}
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${s.color}, ${s.color})`,
                      WebkitMaskImage: 'none'
                    }}
                  >
                    {points.slice(0, -1).map((_, i) => {
                      const [x1, y1] = points[i].split(',');
                      const [x2, y2] = points[i + 1].split(',');
                      const numX1 = parseFloat(x1);
                      const numY1 = parseFloat(y1);
                      const numX2 = parseFloat(x2);
                      const numY2 = parseFloat(y2);
                      const dx = numX2 - numX1;
                      const dy = numY2 - numY1;
                      const length = Math.sqrt(dx * dx + dy * dy);
                      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                      return (
                        <View
                          key={i}
                          className={styles.lineSeg}
                          style={{
                            left: x1,
                            top: y1,
                            width: `${length}rpx`,
                            height: '4rpx',
                            backgroundColor: s.color,
                            transform: `rotate(${angle}deg)`,
                            transformOrigin: '0 50%'
                          }}
                        />
                      );
                    })}
                  </View>

                  {s.data.map((v, di) => {
                    if (v === null || v === undefined) return null;
                    return (
                      <View
                        key={di}
                        className={styles.pointDot}
                        style={{
                          left: `${getX(di)}rpx`,
                          top: `${getY(v, si)}rpx`,
                          backgroundColor: s.color
                        }}
                      />
                    );
                  })}

                  {s.data.map((v, di) => {
                    if (v === null || v === undefined) return null;
                    return (
                      <Text
                        key={`val-${di}`}
                        className={styles.pointValue}
                        style={{
                          left: `${getX(di) - 30}rpx`,
                          top: `${getY(v, si) - 40}rpx`,
                          color: s.color
                        }}
                      >
                        {typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(1)) : v}
                      </Text>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className={styles.xLabelsWide}>
        {xLabels.map((lb, i) => (
          <Text key={i} className={styles.xLabelItem}>{lb}</Text>
        ))}
      </View>
    </View>
  );
};
