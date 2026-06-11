import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import type { FeedingSubType } from '@/types';

const typeOptions: { value: FeedingSubType; icon: string; label: string }[] = [
  { value: 'breast_left', icon: '🤱', label: '母乳左侧' },
  { value: 'breast_right', icon: '🤱', label: '母乳右侧' },
  { value: 'bottle', icon: '🍼', label: '瓶喂' },
  { value: 'formula', icon: '🥛', label: '配方奶' }
];

const FeedingEditPage: React.FC = () => {
  const router = useRouter();
  const { addRecord } = useBabyStore();

  const initialType = (router.params.subType as FeedingSubType) || 'breast_left';
  const [subType, setSubType] = useState<FeedingSubType>(initialType);
  const [duration, setDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [amount, setAmount] = useState(120);
  const [formulaAmount, setFormulaAmount] = useState(5);
  const [formulaWaterTemp, setFormulaWaterTemp] = useState(45);
  const [note, setNote] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTimeDisplay = (sec: number): string => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = () => {
    const record: any = {
      type: 'feeding',
      subType,
      timestamp: Date.now(),
      note: note || undefined,
      createdBy: '妈妈'
    };

    if (subType === 'breast_left' || subType === 'breast_right') {
      if (duration === 0) {
        Taro.showToast({ title: '请先开始计时', icon: 'none' });
        return;
      }
      record.duration = duration;
    } else if (subType === 'bottle') {
      record.amount = amount;
    } else if (subType === 'formula') {
      record.amount = amount;
      record.formulaAmount = formulaAmount;
      record.formulaWaterTemp = formulaWaterTemp;
    }

    addRecord(record);
    Taro.showToast({ title: '记录成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1000);
  };

  const isBreast = subType === 'breast_left' || subType === 'breast_right';
  const isBottle = subType === 'bottle';
  const isFormula = subType === 'formula';

  return (
    <View className={styles.page}>
      <View className={styles.typeTabs}>
        {typeOptions.map((opt) => (
          <View
            key={opt.value}
            className={classnames(styles.typeTab, subType === opt.value && styles.typeTabActive)}
            onClick={() => {
              setSubType(opt.value);
              if (isRunning) setIsRunning(false);
              if (opt.value !== subType) setDuration(0);
            }}
          >
            <Text className={styles.typeIcon}>{opt.icon}</Text>
            <Text className={styles.typeLabel}>{opt.label}</Text>
          </View>
        ))}
      </View>

      {isBreast && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            {subType === 'breast_left' ? '左侧' : '右侧'}喂奶计时
          </Text>
          <View className={styles.timerWrap}>
            <Text className={styles.timerDisplay}>{formatTimeDisplay(duration)}</Text>
            <View className={styles.timerBtns}>
              <View
                className={classnames(styles.timerBtn, !isRunning ? styles.timerBtnPrimary : styles.timerBtnSecondary)}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? '暂停' : duration > 0 ? '继续' : '开始'}
              </View>
              {duration > 0 && (
                <View
                  className={classnames(styles.timerBtn, styles.timerBtnSecondary)}
                  onClick={() => {
                    setIsRunning(false);
                    setDuration(0);
                  }}
                >
                  重置
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {(isBottle || isFormula) && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>喂奶量</Text>
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>奶量</Text>
            <View className={styles.inputWrap}>
              <View
                className={styles.counterBtn}
                onClick={() => setAmount(Math.max(0, amount - 10))}
              >
                <Text>-</Text>
              </View>
              <Text className={styles.inputValue}>{amount}</Text>
              <View
                className={styles.counterBtn}
                onClick={() => setAmount(amount + 10)}
              >
                <Text>+</Text>
              </View>
              <Text className={styles.formUnit}>ml</Text>
            </View>
          </View>
        </View>
      )}

      {isFormula && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>冲调信息</Text>
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>奶粉量</Text>
            <View className={styles.inputWrap}>
              <View
                className={styles.counterBtn}
                onClick={() => setFormulaAmount(Math.max(1, formulaAmount - 1))}
              >
                <Text>-</Text>
              </View>
              <Text className={styles.inputValue}>{formulaAmount}</Text>
              <View
                className={styles.counterBtn}
                onClick={() => setFormulaAmount(formulaAmount + 1)}
              >
                <Text>+</Text>
              </View>
              <Text className={styles.formUnit}>勺</Text>
            </View>
          </View>
          <View className={styles.formRow}>
            <Text className={styles.formLabel}>水温</Text>
            <View className={styles.inputWrap}>
              <View
                className={styles.counterBtn}
                onClick={() => setFormulaWaterTemp(Math.max(30, formulaWaterTemp - 1))}
              >
                <Text>-</Text>
              </View>
              <Text className={styles.inputValue}>{formulaWaterTemp}</Text>
              <View
                className={styles.counterBtn}
                onClick={() => setFormulaWaterTemp(Math.min(80, formulaWaterTemp + 1))}
              >
                <Text>+</Text>
              </View>
              <Text className={styles.formUnit}>°C</Text>
            </View>
          </View>
        </View>
      )}

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

export default FeedingEditPage;
