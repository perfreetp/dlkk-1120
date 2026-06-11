import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import type { SleepQuality, SleepRecord } from '@/types';
import dayjs from 'dayjs';

const qualityOptions: { value: SleepQuality; icon: string; label: string }[] = [
  { value: 'good', icon: '😴', label: '好' },
  { value: 'normal', icon: '💤', label: '一般' },
  { value: 'poor', icon: '😟', label: '差' }
];

const envOptions = ['安静', '吵闹', '开灯', '关灯', '抱睡', '哄睡', '自己睡'];

const SleepEditPage: React.FC = () => {
  const router = useRouter();
  const { addRecord, updateRecord, records } = useBabyStore();

  const editId = router.params.id;
  const isEdit = !!editId;

  const now = Date.now();
  const [startTime, setStartTime] = useState(now - 1000 * 60 * 90);
  const [endTime, setEndTime] = useState(now);
  const [quality, setQuality] = useState<SleepQuality>('good');
  const [environment, setEnvironment] = useState<string>('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (isEdit) {
      const record = records.find((r) => r.id === editId) as SleepRecord;
      if (record) {
        setStartTime(record.startTime);
        setEndTime(record.endTime);
        setQuality(record.quality);
        setEnvironment(record.environment || '');
        setNote(record.note || '');
        setPhotos(record.photos || []);
        Taro.setNavigationBarTitle({ title: '编辑睡眠记录' });
      }
    }
  }, [isEdit, editId, records]);

  const duration = useMemo(() => {
    return Math.max(0, Math.floor((endTime - startTime) / 1000));
  }, [startTime, endTime]);

  const formatDuration = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}小时${m}分钟`;
    return `${m}分钟`;
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

  const handlePickDateTime = (target: 'start' | 'end') => {
    const ts = target === 'start' ? startTime : endTime;
    const dateStr = new Date(ts).toISOString().split('T')[0];
    const timeStr = new Date(ts).toTimeString().slice(0, 5);
    Taro.showActionSheet({
      itemList: ['选择日期', '选择时间', '使用当前时间'],
      success: (res) => {
        const now = Date.now();
        const _taro = Taro as any;
        if (res.tapIndex === 0) {
          _taro.showDatePicker?.({
            format: 'YYYY-MM-DD',
            currentDate: dateStr,
            success: (dateRes: any) => {
              const newDate = new Date(dateRes.detail.value || dateRes.value);
              const oldDate = new Date(ts);
              newDate.setHours(oldDate.getHours(), oldDate.getMinutes());
              const newTs = newDate.getTime();
              if (target === 'start') setStartTime(newTs);
              else setEndTime(newTs);
            }
          }) || Taro.showToast({ title: '请手动设置', icon: 'none' });
        } else if (res.tapIndex === 1) {
          _taro.showTimePicker?.({
            format: 'HH:mm',
            currentTime: timeStr,
            success: (timeRes: any) => {
              const [hours, minutes] = (timeRes.detail.value || timeRes.value).split(':').map(Number);
              const newDate = new Date(ts);
              newDate.setHours(hours, minutes);
              const newTs = newDate.getTime();
              if (target === 'start') setStartTime(newTs);
              else setEndTime(newTs);
            }
          }) || Taro.showToast({ title: '请手动设置', icon: 'none' });
        } else if (res.tapIndex === 2) {
          if (target === 'start') setStartTime(now);
          else setEndTime(now);
        }
      }
    });
  };

  const handleSubmit = () => {
    if (duration < 60) {
      Taro.showToast({ title: '睡眠时间至少1分钟', icon: 'none' });
      return;
    }

    const recordData = {
      type: 'sleep' as const,
      startTime,
      endTime,
      quality,
      environment: environment || undefined,
      note: note || undefined,
      photos: photos.length > 0 ? photos : undefined,
      timestamp: startTime,
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

        <View className={styles.timeRow} onClick={() => handlePickDateTime('start')}>
          <Text className={styles.timeLabel}>开始时间</Text>
          <Text className={styles.timeValue}>{formatPickerValue(startTime)}</Text>
          <Text className={styles.timeArrow}>›</Text>
        </View>

        <View className={styles.timeRow} onClick={() => handlePickDateTime('end')}>
          <Text className={styles.timeLabel}>结束时间</Text>
          <Text className={styles.timeValue}>{formatPickerValue(endTime)}</Text>
          <Text className={styles.timeArrow}>›</Text>
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

export default SleepEditPage;
