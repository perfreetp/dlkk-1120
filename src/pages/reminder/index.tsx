import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import EmptyState from '@/components/EmptyState';
import { formatFullDate, formatDateTime } from '@/utils';

type TopTab = 'reminder' | 'health' | 'followup';
type FilterType = 'all' | 'vaccine' | 'checkup' | 'custom';

const ReminderPage: React.FC = () => {
  const { reminders, toggleReminder, followUps, refreshFollowUpStatus, updateFollowUp } = useBabyStore();
  const [topTab, setTopTab] = useState<TopTab>('reminder');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const filteredReminders = useMemo(() => {
    let list = filterType === 'all' ? reminders : reminders.filter((r) => r.type === filterType);
    return list.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return a.timestamp - b.timestamp;
    });
  }, [reminders, filterType]);

  React.useEffect(() => {
    refreshFollowUpStatus();
  }, [topTab]);

  const getIconByType = (type: string): string => {
    const map: Record<string, string> = { vaccine: '💉', checkup: '🏥', custom: '⏰' };
    return map[type] || '⏰';
  };

  const getRepeatText = (repeat?: string): string => {
    const map: Record<string, string> = { daily: '每天', weekly: '每周', monthly: '每月' };
    return repeat && repeat !== 'none' ? map[repeat] || '' : '';
  };

  const pendingFollowUps = useMemo(() => followUps.filter(f => f.status !== 'done'), [followUps]);

  const renderReminders = () => (
    <>
      <View className={styles.typeTabs}>
        {[
          { value: 'all', label: '全部' },
          { value: 'vaccine', label: '疫苗' },
          { value: 'checkup', label: '体检' },
          { value: 'custom', label: '自定义' }
        ].map((opt) => (
          <Text
            key={opt.value}
            className={classnames(styles.typeTab, filterType === opt.value && styles.typeTabActive)}
            onClick={() => setFilterType(opt.value as FilterType)}
          >
            {opt.label}
          </Text>
        ))}
      </View>

      <ScrollView scrollY>
        {filteredReminders.length > 0 ? (
          filteredReminders.map((reminder) => (
            <View
              key={reminder.id}
              className={classnames(styles.reminderCard, reminder.isCompleted && styles.completed)}
            >
              <View className={classnames(styles.reminderIcon, styles[reminder.type])}>
                <Text>{getIconByType(reminder.type)}</Text>
              </View>
              <View className={styles.reminderContent} onClick={() => toggleReminder(reminder.id)}>
                <Text className={styles.reminderTitle}>{reminder.title}</Text>
                <View className={styles.reminderMeta}>
                  <Text className={styles.reminderTime}>{formatFullDate(reminder.timestamp)}</Text>
                  {getRepeatText(reminder.repeat) && (
                    <Text className={styles.reminderRepeat}>{getRepeatText(reminder.repeat)}</Text>
                  )}
                </View>
                {reminder.note && <Text className={styles.reminderNote}>📍 {reminder.note}</Text>}
              </View>
              <View
                className={classnames(styles.checkbox, reminder.isCompleted && styles.checkboxChecked)}
                onClick={() => toggleReminder(reminder.id)}
              >
                {reminder.isCompleted && <Text className={styles.checkIcon}>✓</Text>}
              </View>
            </View>
          ))
        ) : (
          <EmptyState icon="⏰" text="暂无提醒，点击添加" />
        )}
      </ScrollView>
    </>
  );

  const renderFollowUps = () => (
    <ScrollView scrollY>
      {pendingFollowUps.length === 0 ? (
        <View className={styles.emptyEntry} onClick={() => Taro.navigateTo({ url: '/pages/follow-up/index' })}>
          <EmptyState icon="📅" text="暂无随访计划，点击管理" />
        </View>
      ) : (
        pendingFollowUps.map(f => {
          const overdue = f.status === 'overdue';
          return (
            <View
              key={f.id}
              className={classnames(styles.reminderCard, overdue && styles.overdueCard)}
              onClick={() => Taro.navigateTo({ url: `/pages/follow-up-edit/index?id=${f.id}` })}
            >
              <View className={classnames(styles.reminderIcon, styles.checkup)}>
                <Text>📅</Text>
              </View>
              <View className={styles.reminderContent}>
                <Text className={styles.reminderTitle}>
                  {f.title}
                  {overdue && <Text className={styles.overdueTag}>已逾期</Text>}
                </Text>
                <View className={styles.reminderMeta}>
                  <Text className={styles.reminderTime}>{formatFullDate(f.nextReviewAt)} {formatDateTime(f.nextReviewAt, 'HH:mm')}</Text>
                  <Text className={styles.reminderRepeat}>
                    观察 {f.observations.filter(o => !o.isDone).length}/{f.observations.length}
                  </Text>
                </View>
                {f.doctorAdvice && <Text className={styles.reminderNote}>💬 {f.doctorAdvice.slice(0, 50)}{f.doctorAdvice.length > 50 ? '...' : ''}</Text>}
              </View>
              <View
                className={classnames(styles.checkbox, f.observations.length > 0 && f.observations.every(o => o.isDone) && styles.checkboxChecked)}
                onClick={(e) => {
                  e.stopPropagation();
                  updateFollowUp(f.id, { status: 'done' });
                  Taro.showToast({ title: '已完成', icon: 'success' });
                }}
              >
                {f.status === 'done' && <Text className={styles.checkIcon}>✓</Text>}
              </View>
            </View>
          );
        })
      )}

      <View className={styles.entryCard} onClick={() => Taro.navigateTo({ url: '/pages/follow-up/index' })}>
        <Text className={styles.entryIcon}>📋</Text>
        <Text className={styles.entryText}>查看全部随访计划 →</Text>
      </View>
    </ScrollView>
  );

  const renderHealthEntry = () => (
    <ScrollView scrollY>
      <View className={styles.entryCard} onClick={() => Taro.navigateTo({ url: '/pages/health/index' })}>
        <Text className={styles.entryIcon}>🩺</Text>
        <View className={styles.entryContent}>
          <Text className={styles.entryTitle}>健康事件档案</Text>
          <Text className={styles.entryDesc}>发热、湿疹、吐奶、腹泻、用药、就医都能记录，可关联喂养睡眠尿布，复诊时一键调出完整时间线</Text>
        </View>
      </View>
      <View className={styles.entryCard} onClick={() => Taro.navigateTo({ url: '/pages/follow-up/index' })}>
        <Text className={styles.entryIcon}>📅</Text>
        <View className={styles.entryContent}>
          <Text className={styles.entryTitle}>随访计划</Text>
          <Text className={styles.entryDesc}>记录医生建议、下次复查时间、需要观察的指标，到期自动提醒</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View className={styles.page}>
      <View className={styles.topTabs}>
        {[
          { value: 'reminder', label: '提醒', count: reminders.filter(r => !r.isCompleted).length },
          { value: 'health', label: '健康档案' },
          { value: 'followup', label: '随访计划', count: pendingFollowUps.length }
        ].map(t => (
          <Text
            key={t.value}
            className={classnames(styles.topTab, topTab === t.value && styles.topTabActive)}
            onClick={() => setTopTab(t.value as TopTab)}
          >
            {t.label}{t.count !== undefined && t.count > 0 ? ` (${t.count})` : ''}
          </Text>
        ))}
      </View>

      {topTab === 'reminder' && renderReminders()}
      {topTab === 'followup' && renderFollowUps()}
      {topTab === 'health' && renderHealthEntry()}
    </View>
  );
};

export default ReminderPage;
