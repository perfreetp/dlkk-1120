import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { formatDateTime, formatFullDate } from '@/utils';
import type { HealthEventType, HealthEvent } from '@/types';

const TYPE_META: Record<HealthEventType | 'all', { label: string; icon: string }> = {
  all: { label: '全部', icon: '🏥' },
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

const SEVERITY_LABEL = { mild: '轻微', moderate: '中度', severe: '严重' };

const HealthPage: React.FC = () => {
  const { healthEvents, records, deleteHealthEvent } = useBabyStore();
  const [activeType, setActiveType] = useState<HealthEventType | 'all'>('all');

  const filteredEvents = useMemo(() => {
    if (activeType === 'all') return healthEvents;
    return healthEvents.filter(e => e.type === activeType);
  }, [healthEvents, activeType]);

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/health-edit/index' });
  };

  const handleEdit = (e: HealthEvent) => {
    Taro.showActionSheet({
      itemList: ['查看详情', '时间线（关联记录）', '删除事件'],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.navigateTo({ url: `/pages/health-edit/index?id=${e.id}` });
        } else if (res.tapIndex === 1) {
          const related = records.filter(r => e.relatedRecordIds.includes(r.id));
          const msg = related.length
            ? `已关联 ${related.length} 条记录：\n${related.slice(0, 5).map(r => `${formatDateTime(r.timestamp)} ${r.type}`).join('\n')}${related.length > 5 ? `\n...还有 ${related.length - 5} 条` : ''}`
            : '该事件尚未关联任何记录，可在编辑页添加';
          Taro.showModal({ title: `${TYPE_META[e.type].icon} 时间线`, content: msg, showCancel: false });
        } else if (res.tapIndex === 2) {
          Taro.showModal({
            title: '删除事件',
            content: '确定要删除该健康事件吗？删除后无法恢复',
            success: (r) => {
              if (r.confirm) {
                deleteHealthEvent(e.id);
                Taro.showToast({ title: '已删除', icon: 'success' });
              }
            }
          });
        }
      }
    });
  };

  const typeList = (Object.keys(TYPE_META) as (HealthEventType | 'all')[]);

  return (
    <View className={styles.page}>
      <View className={styles.typeTabs}>
        {typeList.map(t => (
          <Text
            key={t}
            className={`${styles.typeChip} ${activeType === t ? styles.typeChipActive : ''}`}
            onClick={() => setActiveType(t)}
          >
            {TYPE_META[t].icon} {TYPE_META[t].label}
          </Text>
        ))}
      </View>

      <ScrollView scrollY>
        {filteredEvents.length === 0 ? (
          <View className={styles.emptyCard}>
            <Text className={styles.emptyIcon}>🩺</Text>
            <Text className={styles.emptyTitle}>暂无健康事件记录</Text>
            <Text className={styles.emptyDesc}>点击右下角记录宝宝的发热、湿疹、用药等情况，复诊时一键调出完整时间线</Text>
          </View>
        ) : (
          filteredEvents.map(e => {
            const meta = TYPE_META[e.type];
            const severityCls =
              e.severity === 'severe' ? styles.eventSevere :
              e.severity === 'moderate' ? styles.eventModerate : '';
            return (
              <View
                key={e.id}
                className={`${styles.eventCard} ${severityCls}`}
                onClick={() => handleEdit(e)}
              >
                <View className={styles.eventHeader}>
                  <View className={styles.eventTitleWrap}>
                    <Text className={styles.eventTitle}>
                      <Text className={styles.eventIcon}>{meta.icon}</Text>
                      {e.title || meta.label}
                      <Text className={`${styles.eventSeverityTag} ${
                        e.severity === 'mild' ? styles.sevMild :
                        e.severity === 'moderate' ? styles.sevModerate : styles.sevSevere
                      }`}>
                        {SEVERITY_LABEL[e.severity]}
                      </Text>
                    </Text>
                    <Text className={styles.eventTime}>
                      {formatFullDate(e.startAt)} {formatDateTime(e.startAt, 'HH:mm')}
                      {e.endAt && ` → ${formatDateTime(e.endAt, 'HH:mm')}`}
                    </Text>
                  </View>
                </View>

                <View className={styles.eventRow}>
                  {e.temperature !== undefined && (
                    <Text className={`${styles.eventItem} ${styles.eventItemPrimary}`}>🌡️ {e.temperature}℃</Text>
                  )}
                  {e.symptoms.length > 0 && (
                    <Text className={styles.eventItem}>
                      症状：{e.symptoms.map(s => s.name).slice(0, 3).join('、')}{e.symptoms.length > 3 ? '...' : ''}
                    </Text>
                  )}
                  {e.medicines.length > 0 && (
                    <Text className={styles.eventItem}>
                      用药：{e.medicines.map(m => m.name).slice(0, 3).join('、')}{e.medicines.length > 3 ? '...' : ''}
                    </Text>
                  )}
                </View>

                {e.description && <Text className={styles.eventDesc}>{e.description}</Text>}

                <View className={styles.eventRelated}>
                  <Text className={styles.eventRelatedLabel}>关联记录：</Text>
                  <Text className={styles.eventRelatedCount}>
                    {e.relatedRecordIds.length} 条喂养/睡眠/尿布记录
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View className={styles.addBtn} onClick={handleAdd}>
        <Text className={styles.addBtnText}>+</Text>
      </View>
    </View>
  );
};

export default HealthPage;
