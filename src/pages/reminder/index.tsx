import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';
import EmptyState from '@/components/EmptyState';
import { formatFullDate } from '@/utils';

type FilterType = 'all' | 'vaccine' | 'checkup' | 'custom';

const ReminderPage: React.FC = () => {
  const { reminders, toggleReminder } = useBabyStore();
  const [filterType, setFilterType] = useState<FilterType>('all');

  const filteredReminders = useMemo(() => {
    let list = filterType === 'all' ? reminders : reminders.filter((r) => r.type === filterType);
    return list.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return a.timestamp - b.timestamp;
    });
  }, [reminders, filterType]);

  const getIconByType = (type: string): string => {
    const map: Record<string, string> = { vaccine: '💉', checkup: '🏥', custom: '⏰' };
    return map[type] || '⏰';
  };

  const getRepeatText = (repeat?: string): string => {
    const map: Record<string, string> = { daily: '每天', weekly: '每周', monthly: '每月' };
    return repeat && repeat !== 'none' ? map[repeat] || '' : '';
  };

  return (
    <View className={styles.page}>
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
    </View>
  );
};

export default ReminderPage;
