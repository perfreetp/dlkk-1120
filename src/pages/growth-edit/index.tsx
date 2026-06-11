import React, { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import { formatFullDate } from '@/utils';

const GrowthEditPage: React.FC = () => {
  const { addRecord } = useBabyStore();
  const [height, setHeight] = useState<number>(65);
  const [weight, setWeight] = useState<number>(7);
  const [headCircumference, setHeadCircumference] = useState<number>(42);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!height && !weight && !headCircumference) {
      Taro.showToast({ title: '请至少填写一项', icon: 'none' });
      return;
    }

    addRecord({
      type: 'growth',
      height: height || undefined,
      weight: weight || undefined,
      headCircumference: headCircumference || undefined,
      timestamp,
      note: note || undefined,
      createdBy: '妈妈'
    } as any);

    Taro.showToast({ title: '记录成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1000);
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>测量数据</Text>

        <View className={styles.inputRow}>
          <Text className={styles.inputLabel}>身高</Text>
          <View className={styles.inputWrap}>
            <View className={styles.counterBtn} onClick={() => setHeight(Math.max(0, Number((height - 0.1).toFixed(1))))}>
              <Text>-</Text>
            </View>
            <Text className={styles.inputValue}>{height.toFixed(1)}</Text>
            <View className={styles.counterBtn} onClick={() => setHeight(Number((height + 0.1).toFixed(1)))}>
              <Text>+</Text>
            </View>
            <Text className={styles.inputUnit}>cm</Text>
          </View>
        </View>

        <View className={styles.inputRow}>
          <Text className={styles.inputLabel}>体重</Text>
          <View className={styles.inputWrap}>
            <View className={styles.counterBtn} onClick={() => setWeight(Math.max(0, Number((weight - 0.1).toFixed(1))))}>
              <Text>-</Text>
            </View>
            <Text className={styles.inputValue}>{weight.toFixed(1)}</Text>
            <View className={styles.counterBtn} onClick={() => setWeight(Number((weight + 0.1).toFixed(1)))}>
              <Text>+</Text>
            </View>
            <Text className={styles.inputUnit}>kg</Text>
          </View>
        </View>

        <View className={styles.inputRow}>
          <Text className={styles.inputLabel}>头围</Text>
          <View className={styles.inputWrap}>
            <View className={styles.counterBtn} onClick={() => setHeadCircumference(Math.max(0, Number((headCircumference - 0.1).toFixed(1))))}>
              <Text>-</Text>
            </View>
            <Text className={styles.inputValue}>{headCircumference.toFixed(1)}</Text>
            <View className={styles.counterBtn} onClick={() => setHeadCircumference(Number((headCircumference + 0.1).toFixed(1)))}>
              <Text>+</Text>
            </View>
            <Text className={styles.inputUnit}>cm</Text>
          </View>
        </View>

        <View className={styles.dateRow} onClick={() => setTimestamp(Date.now())}>
          <Text className={styles.dateLabel}>测量日期</Text>
          <Text className={styles.dateValue}>{formatFullDate(timestamp)}</Text>
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

export default GrowthEditPage;
