import React, { useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import { solidIngredients, allergySymptoms } from '@/data/mockData';
import type { AllergyLevel } from '@/types';

const SolidEditPage: React.FC = () => {
  const { addRecord } = useBabyStore();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [amount, setAmount] = useState(50);
  const [allergyLevel, setAllergyLevel] = useState<AllergyLevel>('none');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = () => {
    if (selectedIngredients.length === 0) {
      Taro.showToast({ title: '请选择辅食食材', icon: 'none' });
      return;
    }
    if (allergyLevel !== 'none' && selectedSymptoms.length === 0) {
      Taro.showToast({ title: '请选择过敏症状', icon: 'none' });
      return;
    }

    addRecord({
      type: 'solid',
      ingredients: selectedIngredients,
      amount,
      allergyLevel,
      allergySymptoms: allergyLevel !== 'none' ? selectedSymptoms : undefined,
      note: note || undefined,
      timestamp: Date.now(),
      createdBy: '妈妈'
    } as any);

    Taro.showToast({ title: '记录成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1000);
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>选择食材</Text>
        <View className={styles.ingredientGrid}>
          {solidIngredients.map((ing) => (
            <Text
              key={ing}
              className={classnames(
                styles.ingredientTag,
                selectedIngredients.includes(ing) && styles.ingredientTagActive
              )}
              onClick={() => toggleIngredient(ing)}
            >
              {ing}
            </Text>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <View className={styles.amountRow}>
          <Text className={styles.amountLabel}>食用量</Text>
          <View className={styles.amountWrap}>
            <View className={styles.counterBtn} onClick={() => setAmount(Math.max(0, amount - 10))}>
              <Text>-</Text>
            </View>
            <Text className={styles.amountValue}>{amount}</Text>
            <View className={styles.counterBtn} onClick={() => setAmount(amount + 10)}>
              <Text>+</Text>
            </View>
            <Text className={styles.amountUnit}>g</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>过敏反应</Text>
        <View className={styles.allergySection}>
          <Text className={styles.allergyTitle}>过敏程度</Text>
          <View className={styles.allergyLevels}>
            {[
              { value: 'none', label: '无过敏' },
              { value: 'mild', label: '轻微' },
              { value: 'moderate', label: '中度' },
              { value: 'severe', label: '严重' }
            ].map((level) => (
              <Text
                key={level.value}
                className={classnames(
                  styles.allergyLevel,
                  allergyLevel === level.value && level.value !== 'none' && styles.allergyLevelActive
                )}
                onClick={() => setAllergyLevel(level.value as AllergyLevel)}
              >
                {level.label}
              </Text>
            ))}
          </View>

          {allergyLevel !== 'none' && (
            <>
              <Text className={styles.allergyTitle}>过敏症状</Text>
              <View className={styles.symptomGrid}>
                {allergySymptoms.map((sym) => (
                  <Text
                    key={sym}
                    className={classnames(
                      styles.symptomTag,
                      selectedSymptoms.includes(sym) && styles.symptomTagActive
                    )}
                    onClick={() => toggleSymptom(sym)}
                  >
                    {sym}
                  </Text>
                ))}
              </View>
            </>
          )}
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

export default SolidEditPage;
