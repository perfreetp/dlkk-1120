import React, { useState, useEffect } from 'react';
import { View, Text, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import { formatFullDate } from '@/utils';
import type { GrowthRecord } from '@/types';

const GrowthEditPage: React.FC = () => {
  const router = useRouter();
  const { addRecord, updateRecord, records } = useBabyStore();

  const editId = router.params.id;
  const isEdit = !!editId;

  const [height, setHeight] = useState<number>(65);
  const [weight, setWeight] = useState<number>(7);
  const [headCircumference, setHeadCircumference] = useState<number>(42);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (isEdit) {
      const record = records.find((r) => r.id === editId) as GrowthRecord;
      if (record) {
        setHeight(record.height || 65);
        setWeight(record.weight || 7);
        setHeadCircumference(record.headCircumference || 42);
        setTimestamp(record.timestamp);
        setNote(record.note || '');
        setPhotos(record.photos || []);
        Taro.setNavigationBarTitle({ title: '编辑成长记录' });
      }
    }
  }, [isEdit, editId, records]);

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

  const handleSubmit = () => {
    if (!height && !weight && !headCircumference) {
      Taro.showToast({ title: '请至少填写一项', icon: 'none' });
      return;
    }

    const recordData = {
      type: 'growth' as const,
      height: height || undefined,
      weight: weight || undefined,
      headCircumference: headCircumference || undefined,
      timestamp,
      note: note || undefined,
      photos: photos.length > 0 ? photos : undefined,
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

export default GrowthEditPage;
