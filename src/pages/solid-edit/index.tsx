import React, { useState, useEffect } from 'react';
import { View, Text, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import { solidIngredients, allergySymptoms } from '@/data/mockData';
import type { AllergyLevel, SolidRecord } from '@/types';
import { formatDateTime } from '@/utils';

const SolidEditPage: React.FC = () => {
  const router = useRouter();
  const { addRecord, updateRecord, records } = useBabyStore();

  const editId = router.params.id;
  const isEdit = !!editId;

  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [amount, setAmount] = useState(50);
  const [allergyLevel, setAllergyLevel] = useState<AllergyLevel>('none');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [timestamp, setTimestamp] = useState(Date.now());
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (isEdit) {
      const record = records.find((r) => r.id === editId) as SolidRecord;
      if (record) {
        setSelectedIngredients(record.ingredients);
        setAmount(record.amount || 50);
        setAllergyLevel(record.allergyLevel);
        setSelectedSymptoms(record.allergySymptoms || []);
        setNote(record.note || '');
        setTimestamp(record.timestamp);
        setPhotos(record.photos || []);
        Taro.setNavigationBarTitle({ title: '编辑辅食记录' });
      }
    }
  }, [isEdit, editId, records]);

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

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 9 - photos.length,
      success: (res) => {
        setPhotos([...photos, ...res.tempFilePaths]);
      }
    });
  };

  const handlePreviewImage = (url: string) => {
    Taro.previewImage({
      current: url,
      urls: photos
    });
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleChooseTime = () => {
    Taro.showActionSheet({
      itemList: ['选择日期', '选择时间'],
      success: (res) => {
        if (res.tapIndex === 0) {
          const dateStr = new Date(timestamp).toISOString().split('T')[0];
          const _taro = Taro as any;
          _taro.showDatePicker?.({
            format: 'YYYY-MM-DD',
            currentDate: dateStr,
            success: (dateRes: any) => {
              const newDate = new Date(dateRes.detail.value || dateRes.value);
              const oldDate = new Date(timestamp);
              newDate.setHours(oldDate.getHours(), oldDate.getMinutes());
              setTimestamp(newDate.getTime());
            }
          }) || Taro.showToast({ title: '请手动设置时间', icon: 'none' });
        } else if (res.tapIndex === 1) {
          const timeStr = new Date(timestamp).toTimeString().slice(0, 5);
          const _taro = Taro as any;
          _taro.showTimePicker?.({
            format: 'HH:mm',
            currentTime: timeStr,
            success: (timeRes: any) => {
              const [hours, minutes] = (timeRes.detail.value || timeRes.value).split(':').map(Number);
              const newDate = new Date(timestamp);
              newDate.setHours(hours, minutes);
              setTimestamp(newDate.getTime());
            }
          }) || Taro.showToast({ title: '请手动设置时间', icon: 'none' });
        }
      }
    });
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

    const recordData = {
      type: 'solid' as const,
      ingredients: selectedIngredients,
      amount,
      allergyLevel,
      allergySymptoms: allergyLevel !== 'none' ? selectedSymptoms : undefined,
      note: note || undefined,
      photos: photos.length > 0 ? photos : undefined,
      timestamp,
      createdBy: '妈妈'
    };

    if (isEdit) {
      updateRecord(editId, recordData as any);
      Taro.showToast({ title: '修改成功', icon: 'success' });
    } else {
      addRecord(recordData as any);
      Taro.showToast({ title: '记录成功', icon: 'success' });
    }
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

      <View className={styles.card} onClick={handleChooseTime}>
        <Text className={styles.cardTitle}>记录时间</Text>
        <View className={styles.timeRow}>
          <Text className={styles.timeValue}>{formatDateTime(timestamp)}</Text>
          <Text className={styles.timeArrow}>›</Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>照片附件</Text>
        <View className={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} className={styles.photoItem}>
              <Image
                className={styles.photoImg}
                src={photo}
                mode="aspectFill"
                onClick={() => handlePreviewImage(photo)}
              />
              <View className={styles.photoDelete} onClick={() => handleDeletePhoto(index)}>
                <Text className={styles.photoDeleteText}>×</Text>
              </View>
            </View>
          ))}
          {photos.length < 9 && (
            <View className={styles.photoAdd} onClick={handleChooseImage}>
              <Text className={styles.photoAddIcon}>+</Text>
              <Text className={styles.photoAddText}>添加照片</Text>
            </View>
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
