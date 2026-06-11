import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import type { SleepQuality } from '@/types';
import dayjs from 'dayjs';

const qualityOptions: { value: SleepQuality; icon: string; label: string }[] = [
  { value: 'good', icon: '😴', label: '好' },
  { value: 'normal', icon: '💤', label: '一般' },
  { value: 'poor', icon: '😟', label: '差' }
];

const envOptions = ['安静', '吵闹', '开灯', '关灯', '抱睡', '哄睡', '自己睡'];

const SleepEditPage: React.FC = () => {
  const { addRecord } = useBabyStore();
  const now = Date.now();
  const [startTime, setStartTime] = useState(now - 1000 * 60 * 90);
  const [endTime, setEndTime] = useState(now);
  const [quality, setQuality] = useState<SleepQuality>('good');
  const [environment, setEnvironment] = useState<string>('');
  const [note, setNote] = useState('');

  const duration = useMemo(() => {
    return Math.max(0, Math.floor((endTime - startTime) / 1000));
  }, [startTime, endTime]);

  const formatDuration = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}小时${m}分钟`;
    return `${m}分钟`;
  };

  const handleSubmit = () => {
    if (duration < 60) {
      Taro.showToast({ title: '睡眠时间至少1分钟', icon: 'none' });
      return;
    }

    addRecord({
      type: 'sleep',
      startTime,
      endTime,
      quality,
      environment: environment || undefined,
      note: note || undefined,
      timestamp: startTime,
      createdBy: '妈妈'
    } as any);

    Taro.showToast({ title: '记录成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1000);
  };

  const formatPickerValue = (ts: number): string => {
    return dayjs(ts).format('YYYY-MM-DD HH:mm');
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <View className={styles.durationDisplay}>
          <Text className={styles.durationLabel}>睡眠时长</Text>
          <Text className={styles.durationValue}>{formatDuration(duration)}</Text>
        </View>

        <Picker
          mode="multiSelector"
          value={[0, 0]}
          onChange={(e) => console.log(e)}
        >
          <View className={styles.timeRow} onClick={() => {
            Taro.showActionSheet({
              itemList: ['使用当前时间为开始时间', '使用当前时间为结束时间'],
              success: (res) => {
                const now = Date.now();
                if (res.tapIndex === 0) setStartTime(now);
                else setEndTime(now);
              }
            });
          }}>
            <Text className={styles.timeLabel}>开始时间</Text>
            <Text className={styles.timeValue}>{formatPickerValue(startTime)}</Text>
          </View>
        </Picker>

        <View className={styles.timeRow} onClick={() => setEndTime(Date.now())}>
          <Text className={styles.timeLabel}>结束时间</Text>
          <Text className={styles.timeValue}>{formatPickerValue(endTime)}</Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>睡眠质量</Text>
        <View className={styles.qualityGrid}>
          {qualityOptions.map((opt) => (
            <View
              key={opt.value}
              className={classnames(styles.qualityItem, quality === opt.value && styles.qualityItemActive)}
              onClick={() => setQuality(opt.value)}
            >
              <Text className={styles.qualityIcon}>{opt.icon}</Text>
              <Text className={styles.qualityText}>{opt.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.qualitySection}>
          <Text className={styles.qualityLabel}>睡眠环境</Text>
          <View className={styles.envOptions}>
            {envOptions.map((env) => (
              <Text
                key={env}
                className={classnames(styles.envTag, environment === env && styles.envTagActive)}
                onClick={() => setEnvironment(environment === env ? '' : env)}
              >
                {env}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>备注</Text>
        <Textarea
          className={styles.noteInput}
          placeholder="输入备注信息（可选）"
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          maxlength={200}
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.btnCancel)} onClick={() => Taro.navigateBack()}>
          <Text>取消</Text>
        </View>
        <View className={classnames(styles.btn, styles.btnSubmit)} onClick={handleSubmit}>
          <Text>保存记录</Text>
        </View>
      </View>
    </View>
  );
};

export default SleepEditPage;
