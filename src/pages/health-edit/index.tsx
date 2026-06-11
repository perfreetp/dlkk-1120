import { useMemo, useState } from 'react';
import { View, Text, Textarea, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { formatDateTime, generateId, formatFullDate } from '@/utils';
import type { HealthEventType, HealthSeverity, SymptomItem, MedicineItem } from '@/types';

const TYPE_META: Record<HealthEventType, { label: string; icon: string; defaultTitle: string }> = {
  fever: { label: '发热', icon: '🤒', defaultTitle: '发热' },
  rash: { label: '湿疹/皮疹', icon: '🔴', defaultTitle: '湿疹/皮疹' },
  vomit: { label: '吐奶', icon: '🤮', defaultTitle: '吐奶' },
  diarrhea: { label: '腹泻', icon: '💩', defaultTitle: '腹泻' },
  cough: { label: '咳嗽', icon: '🗣️', defaultTitle: '咳嗽' },
  cold: { label: '感冒', icon: '🤧', defaultTitle: '感冒' },
  medicine: { label: '用药', icon: '💊', defaultTitle: '用药记录' },
  hospital: { label: '就医', icon: '🏥', defaultTitle: '就医' },
  other: { label: '其他', icon: '📝', defaultTitle: '健康事件' }
};

const SEVERITY_LIST: { value: HealthSeverity; label: string; cls: string }[] = [
  { value: 'mild', label: '轻微', cls: styles.severityMildActive },
  { value: 'moderate', label: '中度', cls: styles.severityModerateActive },
  { value: 'severe', label: '严重', cls: styles.severitySevereActive }
];

export default function HealthEdit() {
  const router = useRouter();
  const params = router.params;
  const editId = params?.id;

  const { records, familyMembers, healthEvents, addHealthEvent, updateHealthEvent } = useBabyStore();

  const editing = useMemo(() => editId ? healthEvents.find(h => h.id === editId) : null, [editId, healthEvents]);
  const me = familyMembers[0];

  const [type, setType] = useState<HealthEventType>(editing?.type || 'fever');
  const [title, setTitle] = useState(editing?.title || '');
  const [startAt, setStartAt] = useState(editing?.startAt || Date.now());
  const [endAt, setEndAt] = useState<number | undefined>(editing?.endAt);
  const [severity, setSeverity] = useState<HealthSeverity>(editing?.severity || 'mild');
  const [temperature, setTemperature] = useState<string>(editing?.temperature !== undefined ? String(editing.temperature) : '');
  const [symptoms, setSymptoms] = useState<SymptomItem[]>(editing?.symptoms || []);
  const [newSymptom, setNewSymptom] = useState('');
  const [medicines, setMedicines] = useState<MedicineItem[]>(editing?.medicines || []);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [description, setDescription] = useState(editing?.description || '');
  const [relatedIds, setRelatedIds] = useState<string[]>(editing?.relatedRecordIds || []);

  useDidShow(() => {
    if (editing) Taro.setNavigationBarTitle({ title: '编辑健康事件' });
  });

  const relatedDateStart = startAt - 3 * 86400000;
  const relatedDateEnd = (endAt || startAt) + 3 * 86400000;
  const candidateRecords = useMemo(() => {
    return records
      .filter(r => r.timestamp >= relatedDateStart && r.timestamp <= relatedDateEnd)
      .filter(r => ['feeding', 'solid', 'diaper', 'sleep'].includes(r.type))
      .slice(0, 50);
  }, [records, relatedDateStart, relatedDateEnd]);

  const handlePickDateTime = (target: 'startAt' | 'endAt') => {
    Taro.showActionSheet({
      itemList: target === 'endAt' ? ['选择日期', '选择时间', '使用当前时间', '清除结束时间'] : ['选择日期', '选择时间', '使用当前时间'],
      success: (res) => {
        const _taro = Taro as any;
        const curVal = target === 'startAt' ? startAt : (endAt || Date.now());
        if (res.tapIndex === 0) {
          _taro.showDatePicker?.({
            format: 'YYYY-MM-DD',
            current: formatDateTime(curVal, 'YYYY-MM-DD'),
            success: (dr) => {
              const dt = new Date(dr.value);
              const old = new Date(curVal);
              dt.setHours(old.getHours(), old.getMinutes(), 0, 0);
              target === 'startAt' ? setStartAt(dt.getTime()) : setEndAt(dt.getTime());
            }
          }) || Taro.showToast({ title: '当前环境不支持', icon: 'none' });
        } else if (res.tapIndex === 1) {
          _taro.showTimePicker?.({
            format: 'HH:mm',
            current: formatDateTime(curVal, 'HH:mm'),
            success: (tr) => {
              const [h, m] = tr.value.split(':').map(Number);
              const dt = new Date(curVal);
              dt.setHours(h, m, 0, 0);
              target === 'startAt' ? setStartAt(dt.getTime()) : setEndAt(dt.getTime());
            }
          }) || Taro.showToast({ title: '当前环境不支持', icon: 'none' });
        } else if (res.tapIndex === 2) {
          target === 'startAt' ? setStartAt(Date.now()) : setEndAt(Date.now());
        } else if (res.tapIndex === 3) {
          setEndAt(undefined);
        }
      }
    });
  };

  const handleAddSymptom = () => {
    if (!newSymptom.trim()) return;
    setSymptoms([...symptoms, { id: generateId(), name: newSymptom.trim() }]);
    setNewSymptom('');
  };

  const handleDelSymptom = (id: string) => setSymptoms(symptoms.filter(s => s.id !== id));

  const handleAddMed = () => {
    if (!newMedName.trim() || !newMedDosage.trim()) {
      Taro.showToast({ title: '请填写药名和剂量', icon: 'none' });
      return;
    }
    setMedicines([...medicines, { id: generateId(), name: newMedName.trim(), dosage: newMedDosage.trim() }]);
    setNewMedName('');
    setNewMedDosage('');
  };

  const handleDelMed = (id: string) => setMedicines(medicines.filter(m => m.id !== id));

  const toggleRelated = (rid: string) => {
    setRelatedIds(relatedIds.includes(rid) ? relatedIds.filter(r => r !== rid) : [...relatedIds, rid]);
  };

  const handleSubmit = () => {
    if (!title.trim() && TYPE_META[type]) setTitle(TYPE_META[type].defaultTitle);
    const payload = {
      type,
      title: title.trim() || TYPE_META[type].defaultTitle,
      startAt,
      endAt,
      severity,
      temperature: temperature ? Number(temperature) : undefined,
      symptoms,
      medicines,
      description: description.trim(),
      relatedRecordIds: relatedIds,
      photos: editing?.photos || [],
      createdBy: editing?.createdBy || me?.name || '家人'
    };
    if (editing) {
      updateHealthEvent(editing.id, payload);
    } else {
      addHealthEvent(payload);
    }
    Taro.showToast({ title: editing ? '已更新' : '已记录', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 500);
  };

  const handleCancel = () => Taro.navigateBack();

  const getRecordSummary = (r: any): string => {
    switch (r.type) {
      case 'feeding':
        return r.subType?.startsWith('breast_')
          ? `${r.subType === 'breast_left' ? '母乳左' : '母乳右'} ${Math.round((r.duration || 0) / 60)}分钟`
          : `${r.subType === 'bottle' ? '瓶喂' : '配方奶'} ${r.amount}ml`;
      case 'solid':
        return `辅食：${(r.ingredients || []).join('、')}`;
      case 'diaper':
        return `尿布：${r.hasPee ? '尿' : ''}${r.hasPoop ? '便' : ''}`;
      case 'sleep':
        return `睡眠：${formatDateTime(r.startTime, 'HH:mm')}-${formatDateTime(r.endTime, 'HH:mm')}`;
      default:
        return r.type;
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>事件类型</Text>
        <View className={styles.typeGrid}>
          {(Object.keys(TYPE_META) as HealthEventType[]).map(k => {
            const m = TYPE_META[k];
            return (
              <View
                key={k}
                className={`${styles.typeItem} ${type === k ? styles.typeItemActive : ''}`}
                onClick={() => setType(k)}
              >
                <Text className={styles.typeItemIcon}>{m.icon}</Text>
                <Text className={styles.typeItemLabel}>{m.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>基本信息</Text>
        <Text className={styles.inputLabel}>事件标题</Text>
        <Input
          className={styles.textInput}
          placeholder={`${TYPE_META[type]?.defaultTitle || '健康事件'}`}
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
          maxlength={40}
        />

        <View className={styles.timeRow} style={{ marginTop: 24 }} onClick={() => handlePickDateTime('startAt')}>
          <Text className={styles.timeLabel}>开始时间</Text>
          <Text className={styles.timeValue}>{formatFullDate(startAt)} {formatDateTime(startAt, 'HH:mm')} ›</Text>
        </View>

        <View className={styles.timeRow} onClick={() => handlePickDateTime('endAt')}>
          <Text className={styles.timeLabel}>结束时间（可选）</Text>
          <Text className={styles.timeValue}>
            {endAt ? `${formatFullDate(endAt)} ${formatDateTime(endAt, 'HH:mm')} ›` : '未结束 ›'}
          </Text>
        </View>

        <Text className={styles.inputLabel}>严重程度</Text>
        <View className={styles.severityRow}>
          {SEVERITY_LIST.map(s => (
            <Text
              key={s.value}
              className={`${styles.severityItem} ${severity === s.value ? s.cls : ''}`}
              onClick={() => setSeverity(s.value)}
            >
              {s.label}
            </Text>
          ))}
        </View>

        {(type === 'fever' || editing?.temperature) && (
          <>
            <Text className={styles.inputLabel} style={{ marginTop: 24 }}>体温（℃，可选）</Text>
            <Input
              className={styles.numberInput}
              type='digit'
              placeholder='例如 38.5'
              value={temperature}
              onInput={(e) => setTemperature(e.detail.value)}
            />
          </>
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>症状表现</Text>
        <View className={styles.addItemRow}>
          <Input
            className={styles.itemInput}
            placeholder='例：红疹、瘙痒、哭闹...'
            value={newSymptom}
            onInput={(e) => setNewSymptom(e.detail.value)}
            onConfirm={handleAddSymptom}
          />
          <View className={styles.addBtnSmall} onClick={handleAddSymptom}>＋</View>
        </View>
        {symptoms.length === 0 ? (
          <Text style={{ fontSize: 24, color: '#999', padding: '16rpx 0' }}>暂无症状描述</Text>
        ) : (
          symptoms.map(s => (
            <View key={s.id} className={styles.listItem}>
              <Text className={styles.listItemValue}>{s.name}</Text>
              <Text className={styles.listItemDel} onClick={() => handleDelSymptom(s.id)}>×</Text>
            </View>
          ))
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>用药记录</Text>
        <View className={styles.addItemRow}>
          <Input
            className={styles.itemInput}
            placeholder='药名，如布洛芬'
            value={newMedName}
            onInput={(e) => setNewMedName(e.detail.value)}
          />
          <Input
            className={styles.itemInput}
            placeholder='剂量，如 2ml'
            value={newMedDosage}
            onInput={(e) => setNewMedDosage(e.detail.value)}
            onConfirm={handleAddMed}
          />
          <View className={styles.addBtnSmall} onClick={handleAddMed}>＋</View>
        </View>
        {medicines.length === 0 ? (
          <Text style={{ fontSize: 24, color: '#999', padding: '16rpx 0' }}>暂无用药</Text>
        ) : (
          medicines.map(m => (
            <View key={m.id} className={styles.listItem}>
              <Text className={styles.listItemValue}>{m.name}</Text>
              <Text className={styles.listItemSub}>{m.dosage}</Text>
              <Text className={styles.listItemDel} onClick={() => handleDelMed(m.id)}>×</Text>
            </View>
          ))
        )}
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>详细描述</Text>
        <Textarea
          className={styles.textareaInput}
          placeholder='详细描述宝宝情况、处理方式、医生建议等...'
          value={description}
          onInput={(e) => setDescription(e.detail.value)}
          maxlength={800}
        />
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>关联记录（前后3天）{relatedIds.length > 0 && `（已选 ${relatedIds.length} 条）`}</Text>
        {candidateRecords.length === 0 ? (
          <Text style={{ fontSize: 24, color: '#999', padding: '16rpx 0' }}>事件前后 3 天没有喂养/睡眠/尿布记录</Text>
        ) : (
          <ScrollView scrollY style={{ maxHeight: 600 }}>
            <View className={styles.relatedList}>
              {candidateRecords.map(r => {
                const selected = relatedIds.includes(r.id);
                return (
                  <View
                    key={r.id}
                    className={`${styles.relatedItem} ${selected ? styles.relatedItemSelected : ''}`}
                    onClick={() => toggleRelated(r.id)}
                  >
                    <View className={`${styles.relatedCheck} ${selected ? styles.relatedCheckActive : ''}`}>
                      {selected && <Text className={styles.relatedCheckIcon}>✓</Text>}
                    </View>
                    <View className={styles.relatedContent}>
                      <Text>
                        <Text className={styles.relatedType}>
                          {{feeding: '🍼 喂奶', solid: '🥣 辅食', diaper: '🧷 尿布', sleep: '🌙 睡眠'}[r.type] || r.type}
                        </Text>
                        <Text className={styles.relatedText}>{getRecordSummary(r)}</Text>
                      </Text>
                      <Text className={styles.relatedTime}>{formatDateTime(r.timestamp)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnCancel}`} onClick={handleCancel}>取消</View>
        <View className={`${styles.btn} ${styles.btnSubmit}`} onClick={handleSubmit}>
          {editing ? '保存修改' : '确认记录'}
        </View>
      </View>
    </View>
  );
}
