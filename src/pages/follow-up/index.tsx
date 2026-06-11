import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { formatFullDate, formatDateTime } from '@/utils';
import type { FollowUpRecord, FollowUpStatus } from '@/types';

const STATUS_LABEL: Record<FollowUpStatus, { label: string; cls: string }> = {
  pending: { label: '待随访', cls: styles.statusPending },
  overdue: { label: '已逾期', cls: styles.statusOverdue },
  done: { label: '已完成', cls: styles.statusDone }
};

const FollowUpPage: React.FC = () => {
  const { followUps, refreshFollowUpStatus, toggleFollowUpObservation, deleteFollowUp, updateFollowUp } = useBabyStore();
  const [activeStatus, setActiveStatus] = useState<FollowUpStatus | 'all'>('all');

  useDidShow(() => {
    refreshFollowUpStatus();
  });

  const filtered = useMemo(() => {
    if (activeStatus === 'all') return followUps;
    return followUps.filter(f => f.status === activeStatus);
  }, [followUps, activeStatus]);

  const handleAdd = () => Taro.navigateTo({ url: '/pages/follow-up-edit/index' });

  const handleEdit = (f: FollowUpRecord) => Taro.navigateTo({ url: `/pages/follow-up-edit/index?id=${f.id}` });

  const handleMarkDone = (f: FollowUpRecord) => {
    Taro.showModal({
      title: '标记完成',
      content: '确定本次随访已完成吗？',
      success: (res) => {
        if (res.confirm) {
          updateFollowUp(f.id, { status: 'done' });
          Taro.showToast({ title: '已完成', icon: 'success' });
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '删除随访',
      content: '删除后无法恢复，确定删除？',
      success: (res) => {
        if (res.confirm) {
          deleteFollowUp(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const handleAction = (f: FollowUpRecord) => {
    const items = ['查看/编辑', '标记已完成', '删除随访'];
    Taro.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) handleEdit(f);
        else if (res.tapIndex === 1) handleMarkDone(f);
        else if (res.tapIndex === 2) handleDelete(f.id);
      }
    });
  };

  const isOverdue = (f: FollowUpRecord) => f.status === 'overdue';

  return (
    <View className={styles.page}>
      <View className={styles.statusTabs}>
        {[
          { value: 'all', label: `全部 (${followUps.length})` },
          { value: 'pending', label: `待随访 (${followUps.filter(f => f.status === 'pending').length})` },
          { value: 'overdue', label: `逾期 (${followUps.filter(f => f.status === 'overdue').length})` },
          { value: 'done', label: `已完成 (${followUps.filter(f => f.status === 'done').length})` }
        ].map(s => (
          <Text
            key={s.value}
            className={`${styles.statusTab} ${activeStatus === s.value ? styles.statusTabActive : ''}`}
            onClick={() => setActiveStatus(s.value as any)}
          >
            {s.label}
          </Text>
        ))}
      </View>

      <ScrollView scrollY>
        {filtered.length === 0 ? (
          <View className={styles.emptyCard}>
            <Text className={styles.emptyIcon}>📅</Text>
            <Text className={styles.emptyTitle}>暂无随访计划</Text>
            <Text className={styles.emptyDesc}>导出报告后把医生建议、下次复查时间和观察指标记下来，到期自动提醒</Text>
          </View>
        ) : (
          filtered.map(f => {
            const meta = STATUS_LABEL[f.status];
            return (
              <View
                key={f.id}
                className={`${styles.followCard} ${
                  f.status === 'overdue' ? styles.followCardOverdue :
                  f.status === 'done' ? styles.followCardDone : ''
                }`}
                onClick={() => handleAction(f)}
              >
                <View className={styles.followHeader}>
                  <Text className={styles.followTitle}>{f.title}</Text>
                  <Text className={`${styles.followStatus} ${meta.cls}`}>{meta.label}</Text>
                </View>

                <Text className={styles.followMeta}>
                  创建于 {formatFullDate(f.createdAt)}
                  {f.reportStartDate && f.reportEndDate && ` · 报告区间 ${f.reportStartDate} 至 ${f.reportEndDate}`}
                </Text>

                <View className={styles.followDateRow}>
                  <Text className={styles.followDateLabel}>下次复查</Text>
                  <Text className={`${styles.followDateValue} ${isOverdue(f) ? styles.followDateOverdue : ''}`}>
                    {formatFullDate(f.nextReviewAt)} {formatDateTime(f.nextReviewAt, 'HH:mm')}
                  </Text>
                </View>

                {f.doctorAdvice && <Text className={styles.followAdvice}>💬 {f.doctorAdvice}</Text>}

                {f.observations.length > 0 && (
                  <View className={styles.followObs}>
                    <Text className={styles.followObsLabel}>
                      观察指标（{f.observations.filter(o => o.isDone).length}/{f.observations.length}）
                    </Text>
                    {f.observations.map(o => (
                      <View
                        key={o.id}
                        className={styles.followObsItem}
                        onClick={(e) => { e.stopPropagation(); toggleFollowUpObservation(f.id, o.id); }}
                      >
                        <View className={`${styles.followObsCheck} ${o.isDone ? styles.followObsCheckDone : ''}`}>
                          {o.isDone && <Text className={styles.followObsCheckIcon}>✓</Text>}
                        </View>
                        <Text className={`${styles.followObsText} ${o.isDone ? styles.followObsTextDone : ''}`}>{o.content}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {f.status !== 'done' && (
                  <View className={styles.followActions}>
                    <View
                      className={`${styles.followBtn} ${styles.followBtnDone}`}
                      onClick={(e) => { e.stopPropagation(); handleMarkDone(f); }}
                    >
                      标记完成
                    </View>
                    <View
                      className={`${styles.followBtn} ${styles.followBtnEdit}`}
                      onClick={(e) => { e.stopPropagation(); handleEdit(f); }}
                    >
                      编辑
                    </View>
                  </View>
                )}
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

export default FollowUpPage;
