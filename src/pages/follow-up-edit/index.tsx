import { useMemo, useState } from 'react';
import { View, Text, Textarea, Input } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { formatFullDate, formatDateTime, generateId } from '@/utils';
import type { FollowUpObservation } from '@/types';

export default function FollowUpEdit() {
  const router = useRouter();
  const params = router.params;
  const editId = params?.id;
  const prefillStart = params?.startDate;
  const prefillEnd = params?.endDate;

  const { familyMembers, followUps, addFollowUp, updateFollowUp } = useBabyStore();
  const editing = useMemo(() => editId ? followUps.find(f => f.id === editId) : null, [editId, followUps]);
  const me = familyMembers[0];

  const [title, setTitle] = useState(editing?.title || '');
  const [reportStartDate, setReportStartDate] = useState(editing?.reportStartDate || prefillStart || '');
  const [reportEndDate, setReportEndDate] = useState(editing?.reportEndDate || prefillEnd || '');
  const [doctorAdvice, setDoctorAdvice] = useState(editing?.doctorAdvice || '');
  const [nextReviewAt, setNextReviewAt] = useState(editing?.nextReviewAt || Date.now() + 7 * 86400000);
  const [observations, setObservations] = useState<FollowUpObservation[]>(editing?.observations || []);
  const [newObsText, setNewObsText] = useState('');
  const [result, setResult] = useState(editing?.result || '');

  useDidShow(() => {
    if (editing) Taro.setNavigationBarTitle({ title: '编辑随访' });
  });

  const handlePickDate = (target: 'review' | 'reportStart' | 'reportEnd') => {
    const _taro = Taro as any;
    const curVal = target === 'review'
      ? formatFullDate(nextReviewAt)
      : target === 'reportStart' ? reportStartDate : reportEndDate;
    const today = formatFullDate(Date.now());
    _taro.showDatePicker?.({
      format: 'YYYY-MM-DD',
      current: curVal || today,
      success: (dr) => {
        if (target === 'review') {
          const dt = new Date(dr.value);
          dt.setHours(10, 0, 0, 0);
          setNextReviewAt(dt.getTime());
        } else if (target === 'reportStart') {
          setReportStartDate(dr.value);
        } else {
          setReportEndDate(dr.value);
        }
      }
    }) || Taro.showToast({ title: '当前环境不支持', icon: 'none' });
  };

  const handlePickTime = () => {
    const _taro = Taro as any;
    _taro.showTimePicker?.({
      format: 'HH:mm',
      current: formatDateTime(nextReviewAt, 'HH:mm'),
      success: (tr) => {
        const [h, m] = tr.value.split(':').map(Number);
        const dt = new Date(nextReviewAt);
        dt.setHours(h, m, 0, 0);
        setNextReviewAt(dt.getTime());
      }
    }) || Taro.showToast({ title: '当前环境不支持', icon: 'none' });
  };

  const handlePickReview = () => {
    Taro.showActionSheet({
      itemList: ['选择日期', '选择时间'],
      success: (res) => {
        if (res.tapIndex === 0) handlePickDate('review');
        else if (res.tapIndex === 1) handlePickTime();
      }
    });
  };

  const handleAddObs = () => {
    if (!newObsText.trim()) return;
    setObservations([...observations, { id: generateId(), content: newObsText.trim(), isDone: false }]);
    setNewObsText('');
  };

  const handleToggleObs = (id: string) => {
    setObservations(observations.map(o => o.id === id ? { ...o, isDone: !o.isDone } : o));
  };

  const handleDelObs = (id: string) => {
    setObservations(observations.filter(o => o.id !== id));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请填写随访标题', icon: 'none' });
      return;
    }
    if (!doctorAdvice.trim()) {
      Taro.showToast({ title: '请填写医生建议', icon: 'none' });
      return;
    }
    const payload = {
      title: title.trim(),
      reportStartDate: reportStartDate || undefined,
      reportEndDate: reportEndDate || undefined,
      doctorAdvice: doctorAdvice.trim(),
      nextReviewAt,
      observations,
      status: editing?.status || 'pending',
      result: result.trim() || undefined,
      createdBy: editing?.createdBy || me?.name || '家人'
    };
    if (editing) {
      updateFollowUp(editing.id, payload);
    } else {
      addFollowUp(payload);
    }
    Taro.showToast({ title: editing ? '已更新' : '已创建', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 500);
  };

  const handleCancel = () => Taro.navigateBack();

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>基本信息</Text>
        <Text className={styles.inputLabel}>随访标题</Text>
        <Input
          className={styles.textInput}
          placeholder='例：满月儿保、湿疹复查、三个月体检'
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
          maxlength={40}
        />

        <Text className={styles.inputLabel} style={{ marginTop: 24 }}>报告对应区间（可选）</Text>
        <View className={styles.dateRow} onClick={() => handlePickDate('reportStart')}>
          <Text className={styles.dateLabel}>开始日期</Text>
          <Text className={styles.dateValue}>{reportStartDate || '点击选择 ›'}</Text>
        </View>
        <View className={styles.dateRow} onClick={() => handlePickDate('reportEnd')}>
          <Text className={styles.dateLabel}>结束日期</Text>
          <Text className={styles.dateValue}>{reportEndDate || '点击选择 ›'}</Text>
        </View>

        <Text className={styles.inputLabel}>下次复查时间</Text>
        <View className={styles.dateRow} onClick={handlePickReview}>
          <Text className={styles.dateLabel}>复查时间</Text>
          <Text className={styles.dateValue}>{formatFullDate(nextReviewAt)} {formatDateTime(nextReviewAt, 'HH:mm')} ›</Text>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>医生建议</Text>
        <Textarea
          className={styles.textareaInput}
          placeholder='记录本次就医或沟通时医生的具体建议...'
          value={doctorAdvice}
          onInput={(e) => setDoctorAdvice(e.detail.value)}
          maxlength={800}
        />
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>需要观察的指标</Text>
        <View className={styles.addItemRow}>
          <Input
            className={styles.itemInput}
            placeholder='例：每日体温、湿疹变化、奶量是否达标'
            value={newObsText}
            onInput={(e) => setNewObsText(e.detail.value)}
            onConfirm={handleAddObs}
          />
          <View className={styles.addBtnSmall} onClick={handleAddObs}>＋</View>
        </View>
        {observations.length === 0 ? (
          <Text style={{ fontSize: 24, color: '#999', padding: '16rpx 0' }}>暂无观察项，可添加多个</Text>
        ) : (
          observations.map(o => (
            <View key={o.id} className={styles.obsItem}>
              <View
                className={`${styles.obsCheck} ${o.isDone ? styles.obsCheckDone : ''}`}
                onClick={() => handleToggleObs(o.id)}
              >
                {o.isDone && <Text className={styles.obsCheckIcon}>✓</Text>}
              </View>
              <Text className={`${styles.obsText} ${o.isDone ? styles.obsTextDone : ''}`}>{o.content}</Text>
              <Text className={styles.obsDel} onClick={() => handleDelObs(o.id)}>×</Text>
            </View>
          ))
        )}
      </View>

      {editing && (
        <View className={`${styles.card} ${styles.resultSection}`}>
          <Text className={styles.cardTitle}>随访结果（可选）</Text>
          <Textarea
            className={styles.textareaInput}
            placeholder='记录本次随访的结果、宝宝表现、复查结论等'
            value={result}
            onInput={(e) => setResult(e.detail.value)}
            maxlength={500}
          />
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnCancel}`} onClick={handleCancel}>取消</View>
        <View className={`${styles.btn} ${styles.btnSubmit}`} onClick={handleSubmit}>
          {editing ? '保存修改' : '创建随访'}
        </View>
      </View>
    </View>
  );
}
