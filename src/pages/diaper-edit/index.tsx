import React, { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import type { DiaperColor, DiaperTexture } from '@/types';

const colorOptions: { value: DiaperColor; label: string }[] = [
  { value: 'yellow', label: '黄色' },
  { value: 'green', label: '绿色' },
  { value: 'brown', label: '棕色' },
  { value: 'black', label: '黑色' },
  { value: 'red', label: '红色' },
  { value: 'other', label: '其他' }
];

const textureOptions: { value: DiaperTexture; label: string }[] = [
  { value: 'soft', label: '软便' },
  { value: 'normal', label: '正常' },
  { value: 'hard', label: '硬便' },
  { value: 'watery', label: '水样' },
  { value: 'mucus', label: '粘液' },
  { value: 'bloody', label: '血便' }
];

const DiaperEditPage: React.FC = () => {
  const { addRecord } = useBabyStore();
  const [hasPee, setHasPee] = useState(true);
  const [hasPoop, setHasPoop] = useState(false);
  const [color, setColor] = useState<DiaperColor>('yellow');
  const [texture, setTexture] = useState<DiaperTexture>('normal');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!hasPee && !hasPoop) {
      Taro.showToast({ title: '请至少选择一种', icon: 'none' });
      return;
    }

    addRecord({
      type: 'diaper',
      hasPee,
      hasPoop,
      color,
      texture: hasPoop ? texture : 'normal',
      timestamp: Date.now(),
      note: note || undefined,
      createdBy: '妈妈'
    } as any);

    Taro.showToast({ title: '记录成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1000);
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>类型</Text>
        <View className={styles.typeGrid}>
          <View
            className={classnames(styles.typeItem, hasPee && !hasPoop && styles.typeItemActive)}
            onClick={() => { setHasPee(true); setHasPoop(false); }}
          >
            <Text className={styles.typeIcon}>💧</Text>
            <Text className={styles.typeLabel}>尿</Text>
          </View>
          <View
            className={classnames(styles.typeItem, hasPee && hasPoop && styles.typeItemActive)}
            onClick={() => { setHasPee(true); setHasPoop(true); }}
          >
            <Text className={styles.typeIcon}>💧💩</Text>
            <Text className={styles.typeLabel}>尿便</Text>
          </View>
          <View
            className={classnames(styles.typeItem, !hasPee && hasPoop && styles.typeItemActive)}
            onClick={() => { setHasPee(false); setHasPoop(true); }}
          >
            <Text className={styles.typeIcon}>💩</Text>
            <Text className={styles.typeLabel}>便</Text>
          </View>
        </View>

        {hasPoop && (
          <>
            <View className={styles.colorSection}>
              <Text className={styles.sectionLabel}>颜色</Text>
              <View className={styles.colorGrid}>
                {colorOptions.map((opt) => (
                  <View
                    key={opt.value}
                    className={classnames(styles.colorItem, color === opt.value && styles.colorItemActive)}
                    onClick={() => setColor(opt.value)}
                  >
                    <View className={classnames(styles.colorDot, styles[opt.value])} />
                    <Text className={styles.colorLabel}>{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View>
              <Text className={styles.sectionLabel}>形态</Text>
              <View className={styles.textureGrid}>
                {textureOptions.map((opt) => (
                  <Text
                    key={opt.value}
                    className={classnames(styles.textureItem, texture === opt.value && styles.textureItemActive)}
                    onClick={() => setTexture(opt.value)}
                  >
                    {opt.label}
                  </Text>
                ))}
              </View>
            </View>
          </>
        )}
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

export default DiaperEditPage;
