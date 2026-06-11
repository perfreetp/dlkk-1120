import { useMemo, useState } from 'react';
import { View, Text, Textarea, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { formatFullDate, formatDateTime, generateId } from '@/utils';
import type { FollowUpObservation, FollowUpReviewRecord, HealthEventType } from '@/types';

const TYPE_META: Record<HealthEventType, { label: string; icon: string }> = {
  fever: { label: '发热', icon: '🤒' },
  rash: { label: '湿疹/皮疹', icon: '🔴' },
  vomit: { label: '吐奶', icon: '🤮' },
  diarrhea: { label: '腹泻', icon: '💩' },
  cough: { label: '咳嗽', icon: '🗣️' },
  cold: { label: '感冒', icon: '🤧' },
  medicine: { label: '用药', icon: '💊' },
  hospital: { label: '就医', icon: '🏥' },
  other: { label: '其他', icon: '📝' }
};

export default function FollowUpEdit() {
  const router = useRouter();
  const params = router.params;
  const editId = params?.id;
  const prefillStart = params?.startDate;
  const prefillEnd = params?.endDate;

  const {
    familyMembers,
    followUps,
    healthEvents,
    addFollowUp,
    updateFollowUp,
    addFollowUpReview,
    cloneFollowUpAsNext,
    linkHealthEventAndFollowUp,
    unlinkHealthEventAndFollowUp
  } = useBabyStore();
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
  const [healthEventIds, setHealthEventIds] = useState<string[]>(editing?.healthEventIds || []);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewDate, setReviewDate] = useState(Date.now());
  const [reviewConclusion, setReviewConclusion] = useState('');
  const [reviewNewAdvice, setReviewNewAdvice] = useState('');
  const [reviewNextStep, setReviewNextStep] = useState('');
  const [reviewContinue, setReviewContinue] = useState(true);

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

  const toggleHealthEvent = (hid: string) => {
    setHealthEventIds(healthEventIds.includes(hid) ? healthEventIds.filter(id => id !== hid) : [...healthEventIds, hid]);
  };

  const handleOpenReviewForm = () => {
    setReviewDate(Date.now());
    setReviewConclusion('');
    setReviewNewAdvice('');
    setReviewNextStep('');
    setReviewContinue(true);
    setShowReviewForm(true);
  };

  const handleSaveReview = () => {
    if (!editing) return;
    if (!reviewConclusion.trim()) {
      Taro.showToast({ title: '请填写复查结论', icon: 'none' });
      return;
    }
    addFollowUpReview(editing.id, {
      reviewedAt: reviewDate,
      conclusion: reviewConclusion.trim(),
      newAdvice: reviewNewAdvice.trim(),
      nextStep: reviewNextStep.trim(),
      continueObserve: reviewContinue,
      createdBy: me?.name || '家人'
    });
    Taro.showToast({ title: '已沉淀复诊记录', icon: 'success' });
    setShowReviewForm(false);
  };

  const handleCloneNext = () => {
    if (!editing) return;
    Taro.showModal({
      title: '生成下一次随访',
      content: '是否基于本次随访生成下一次？观察指标将保留并重置为未完成状态，你可以在新的随访里调整复查时间',
      success: (r) => {
        if (!r.confirm) return;
        const newId = cloneFollowUpAsNext(editing.id);
        if (newId) {
          Taro.showToast({ title: '已生成下一次随访', icon: 'success' });
          setTimeout(() => {
            Taro.redirectTo({ url: `/pages/follow-up-edit/index?id=${newId}` });
          }, 500);
        } else {
          Taro.showToast({ title: '生成失败', icon: 'none' });
        }
      }
    });
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
      healthEventIds,
      reviewRecords: editing?.reviewRecords || [],
      createdBy: editing?.createdBy || me?.name || '家人'
    };
    if (editing) {
      updateFollowUp(editing.id, payload);
    } else {
      addFollowUp(payload);
    }
    setTimeout(() => {
      const store = useBabyStore.getState();
      const finalId = editing ? editing.id :
        (store.followUps.find(f => f.title === payload.title && f.createdBy === payload.createdBy)?.id);
      if (!finalId) return;
      const oldIds = editing?.healthEventIds || [];
      const toAdd = healthEventIds.filter(id => !oldIds.includes(id));
      const toDel = oldIds.filter(id => !healthEventIds.includes(id));
      toAdd.forEach(hid => store.linkHealthEventAndFollowUp(hid, finalId));
      toDel.forEach(hid => store.unlinkHealthEventAndFollowUp(hid, finalId));
    }, 100);
    Taro.showToast({ title: editing ? '已更新' : '已创建', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 600);
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

      <View className={styles.card}>
        <Text className={styles.cardTitle}>关联健康事件{healthEventIds.length > 0 && `（已选 ${healthEventIds.length}）`}</Text>
        {healthEvents.length === 0 ? (
          <Text style={{ fontSize: 24, color: '#999', padding: '16rpx 0' }}>暂无健康事件，可在事件编辑页关联此随访</Text>
        ) : (
          <ScrollView scrollY style={{ maxHeight: 480 }}>
            <View className={styles.relatedList}>
              {healthEvents.map(h => {
                const selected = healthEventIds.includes(h.id);
                const meta = TYPE_META[h.type];
                const sevLabel = h.severity === 'mild' ? '轻微' : h.severity === 'moderate' ? '中度' : '严重';
                return (
                  <View
                    key={h.id}
                    className={`${styles.relatedItem} ${selected ? styles.relatedItemSelected : ''}`}
                    onClick={() => toggleHealthEvent(h.id)}
                  >
                    <View className={`${styles.relatedCheck} ${selected ? styles.relatedCheckActive : ''}`}>
                      {selected && <Text className={styles.relatedCheckIcon}>✓</Text>}
                    </View>
                    <View className={styles.relatedContent}>
                      <Text>
                        <Text className={styles.relatedType}>{meta.icon} {meta.label}</Text>
                        <Text className={styles.relatedText}>{h.title}（{sevLabel}）</Text>
                      </Text>
                      <Text className={styles.relatedTime}>
                        {formatFullDate(h.startAt)} {formatDateTime(h.startAt, 'HH:mm')}
                        {h.endAt ? ` → ${formatFullDate(h.endAt)} ${formatDateTime(h.endAt, 'HH:mm')}` : '（进行中）'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      {editing && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>复诊记录沉淀（{editing.reviewRecords.length}）</Text>
          {editing.reviewRecords.length === 0 ? (
            <Text style={{ fontSize: 24, color: '#999', padding: '16rpx 0' }}>每次完成随访后在这里沉淀复诊结论、医生新建议等</Text>
          ) : (
            <View className={styles.reviewList}>
              {editing.reviewRecords.map((rv: FollowUpReviewRecord) => (
                <View key={rv.id} className={styles.reviewItem}>
                  <View className={styles.reviewMeta}>
                    <Text>{rv.createdBy} · {formatFullDate(rv.reviewedAt)} {formatDateTime(rv.reviewedAt, 'HH:mm')}</Text>
                    {rv.continueObserve && <Text className={styles.reviewContinueTag}>继续观察</Text>}
                  </View>
                  <Text className={styles.reviewLabel}>复查结论</Text>
                  <Text className={styles.reviewValue}>{rv.conclusion}</Text>
                  {rv.newAdvice && (
                    <>
                      <Text className={styles.reviewLabel}>医生新建议</Text>
                      <Text className={styles.reviewValue}>{rv.newAdvice}</Text>
                    </>
                  )}
                  {rv.nextStep && (
                    <>
                      <Text className={styles.reviewLabel}>下一步安排</Text>
                      <Text className={styles.reviewValue}>{rv.nextStep}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
          <View className={styles.addReviewBtn} onClick={handleOpenReviewForm}>＋ 新增复诊记录</View>
        </View>
      )}

      {showReviewForm && editing && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>新增复诊记录</Text>
          <Text className={styles.inputLabel}>复查时间</Text>
          <View
            className={styles.dateRow}
            onClick={() => {
              const _taro = Taro as any;
              _taro.showDatePicker?.({
                format: 'YYYY-MM-DD',
                current: formatFullDate(reviewDate),
                success: (dr) => {
                  const dt = new Date(dr.value);
                  const old = new Date(reviewDate);
                  dt.setHours(old.getHours(), old.getMinutes(), 0, 0);
                  setReviewDate(dt.getTime());
                }
              });
            }}
          >
            <Text className={styles.dateLabel}>复查日期</Text>
            <Text className={styles.dateValue}>{formatFullDate(reviewDate)} ›</Text>
          </View>
          <Text className={styles.inputLabel}>复查结论 *</Text>
          <Textarea
            className={styles.textareaInput}
            placeholder='例：宝宝湿疹明显好转，可减少用药频率'
            value={reviewConclusion}
            onInput={(e) => setReviewConclusion(e.detail.value)}
            maxlength={500}
          />
          <Text className={styles.inputLabel}>医生新建议</Text>
          <Textarea
            className={styles.textareaInput}
            placeholder='医生针对本次复查给出的新建议'
            value={reviewNewAdvice}
            onInput={(e) => setReviewNewAdvice(e.detail.value)}
            maxlength={500}
          />
          <Text className={styles.inputLabel}>下一步安排</Text>
          <Textarea
            className={styles.textareaInput}
            placeholder='例：一周后复查；如果没有好转则皮肤科复诊'
            value={reviewNextStep}
            onInput={(e) => setReviewNextStep(e.detail.value)}
            maxlength={500}
          />
          <View
            style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}
            onClick={() => setReviewContinue(!reviewContinue)}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 4,
                border: '2rpx solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: reviewContinue ? '#FF8A9B' : '#fff',
                borderColor: reviewContinue ? '#FF8A9B' : '#ccc'
              }}
            >
              {reviewContinue && <Text style={{ color: '#fff', fontSize: 22 }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 26, color: '#333' }}>需要继续观察（下次可直接生成新随访）</Text>
          </View>
          <View style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            <View className={`${styles.btn} ${styles.btnCancel}`} onClick={() => setShowReviewForm(false)}>取消</View>
            <View className={`${styles.btn} ${styles.btnSubmit}`} onClick={handleSaveReview}>保存记录</View>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnCancel}`} onClick={handleCancel}>取消</View>
        {editing && (
          <View className={`${styles.btn} ${styles.btnNext}`} onClick={handleCloneNext}>
            生成下一次随访
          </View>
        )}
        <View className={`${styles.btn} ${styles.btnSubmit}`} onClick={handleSubmit}>
          {editing ? '保存修改' : '创建随访'}
        </View>
      </View>
    </View>
  );
}
