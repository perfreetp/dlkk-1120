import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { formatFullDate } from '@/utils';
import dayjs from 'dayjs';

const typeOptions = [
  { value: 'feeding', label: '喂奶记录', icon: '🍼' },
  { value: 'solid', label: '辅食记录', icon: '🥣' },
  { value: 'diaper', label: '尿布记录', icon: '🧷' },
  { value: 'sleep', label: '睡眠记录', icon: '😴' },
  { value: 'growth', label: '成长记录', icon: '📏' },
  { value: 'reminder', label: '提醒记录', icon: '⏰' }
];

const formatOptions = [
  { value: 'pdf', label: 'PDF文档', icon: '📄' },
  { value: 'excel', label: 'Excel表格', icon: '📊' }
];

const ExportPage: React.FC = () => {
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').valueOf());
  const [endDate, setEndDate] = useState(Date.now());
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['feeding', 'solid', 'diaper', 'sleep', 'growth']);
  const [format, setFormat] = useState('pdf');

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleExport = () => {
    if (selectedTypes.length === 0) {
      Taro.showToast({ title: '请选择导出类型', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '正在导出...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: '导出成功', icon: 'success' });
    }, 1500);
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>时间范围</Text>
        <View className={styles.dateRange}>
          <View className={styles.dateItem}>
            <Text className={styles.dateLabel}>开始日期</Text>
            <Text className={styles.dateValue}>{formatFullDate(startDate)}</Text>
          </View>
          <View className={styles.dateItem}>
            <Text className={styles.dateLabel}>结束日期</Text>
            <Text className={styles.dateValue}>{formatFullDate(endDate)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>导出内容</Text>
        <View className={styles.typeList}>
          {typeOptions.map((opt) => (
            <View
              key={opt.value}
              className={classnames(styles.typeItem, selectedTypes.includes(opt.value) && styles.typeItemActive)}
              onClick={() => toggleType(opt.value)}
            >
              <View className={classnames(styles.checkbox, selectedTypes.includes(opt.value) && styles.checkboxActive)}>
                {selectedTypes.includes(opt.value) && <Text className={styles.checkIcon}>✓</Text>}
              </View>
              <Text className={styles.typeText}>{opt.icon} {opt.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>导出格式</Text>
        <View className={styles.formatList}>
          {formatOptions.map((opt) => (
            <View
              key={opt.value}
              className={classnames(styles.formatItem, format === opt.value && styles.formatItemActive)}
              onClick={() => setFormat(opt.value)}
            >
              <Text className={styles.formatIcon}>{opt.icon}</Text>
              <Text className={styles.formatLabel}>{opt.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.exportBtn} onClick={handleExport}>
          <Text>导出报告</Text>
        </View>
      </View>
    </View>
  );
};

export default ExportPage;
