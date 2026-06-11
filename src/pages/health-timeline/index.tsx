import { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { formatDateTime, formatFullDate } from '@/utils';
import type { HealthEventType, HealthEvent, BabyRecord, FollowUpStatus } from '@/types';

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

const RECORD_TYPE_META: Record<string, { label: string; icon: string; page: string }> = {
  feeding: { label: '喂奶', icon: '🍼', page: '/pages/feeding-edit/index' },
  solid: { label: '辅食', icon: '🥣', page: '/pages/solid-edit/index' },
  diaper: { label: '尿布', icon: '🧷', page: '/pages/diaper-edit/index' },
  sleep: { label: '睡眠', icon: '🌙', page: '/pages/sleep-edit/index' },
  growth: { label: '成长', icon: '📏', page: '/pages/growth-edit/index' }
};

const SEVERITY_LABEL = { mild: '轻微', moderate: '中度', severe: '严重' };
const FOLLOWUP_STATUS_LABEL: Record<FollowUpStatus, string> = {
  pending: '待随访',
  overdue: '已逾期',
  done: '已完成'
};
const FOLLOWUP_STATUS_CLS: Record<FollowUpStatus, string> = {
  pending: styles.followStatusPending,
  overdue: styles.followStatusOverdue,
  done: styles.followStatusDone
};

interface TimelineEvent {
  kind: 'event' | 'record' | 'medicine' | 'hospital';
  id: string;
  timestamp: number;
  title: string;
  icon: string;
  summary: string;
  page?: string;
}

export default function HealthTimelinePage() {
  const router = useRouter();
  const eventId = router.params?.id;

  const { healthEvents, records, followUps } = useBabyStore();

  const event = useMemo<HealthEvent | undefined>(
    () => healthEvents.find(e => e.id === eventId),
    [healthEvents, eventId]
  );

  useDidShow(() => {
    if (event) {
      Taro.setNavigationBarTitle({ title: `${TYPE_META[event.type].icon} ${event.title || TYPE_META[event.type].label}时间线` });
    }
  });

  const relatedFollowUps = useMemo(
    () => followUps.filter(f => event?.followUpIds.includes(f.id)),
    [followUps, event]
  );

  const groupedByDay = useMemo(() => {
    if (!event) return [];
    const items: TimelineEvent[] = [];

    items.push({
      kind: 'event',
      id: `ev-start-${event.id}`,
      timestamp: event.startAt,
      title: `${TYPE_META[event.type].icon} ${event.title || TYPE_META[event.type].label}（开始）`,
      icon: '🚨',
      summary: [
        `严重程度：${SEVERITY_LABEL[event.severity]}`,
        event.temperature ? `体温：${event.temperature}℃` : '',
        event.symptoms.length ? `症状：${event.symptoms.map(s => s.name).join('、')}` : '',
        event.description ? event.description : ''
      ].filter(Boolean).join(' | ')
    });

    if (event.endAt) {
      items.push({
        kind: 'event',
        id: `ev-end-${event.id}`,
        timestamp: event.endAt,
        title: `${TYPE_META[event.type].icon} ${event.title || TYPE_META[event.type].label}（结束）`,
        icon: '✅',
        summary: `持续 ${Math.ceil((event.endAt - event.startAt) / 86400000)} 天`
      });
    }

    event.medicines.forEach((m, idx) => {
      items.push({
        kind: 'medicine',
        id: `med-${event.id}-${idx}`,
        timestamp: event.startAt + idx * 60000,
        title: `💊 用药：${m.name}`,
        icon: '💊',
        summary: `剂量：${m.dosage}${m.time ? ` · ${m.time}` : ''}`
      });
    });

    const linked = records.filter(r => event.relatedRecordIds.includes(r.id));
    linked.forEach(r => {
      const meta = RECORD_TYPE_META[r.type] || { label: r.type, icon: '📝', page: '' };
      let summary = '';
      switch (r.type) {
        case 'feeding':
          summary = (r as any).subType?.startsWith('breast_')
            ? `${(r as any).subType === 'breast_left' ? '母乳左' : '母乳右'} ${Math.round(((r as any).duration || 0) / 60)} 分钟`
            : `${(r as any).subType === 'bottle' ? '瓶喂' : '配方奶'} ${(r as any).amount}ml`;
          break;
        case 'solid':
          summary = `食材：${((r as any).ingredients || []).join('、')}${(r as any).amount ? ` · ${(r as any).amount}g` : ''}`;
          break;
        case 'diaper':
          summary = `${(r as any).hasPee ? '尿' : ''}${(r as any).hasPoop ? '便' : ''} · ${(r as any).color || ''}`;
          break;
        case 'sleep':
          summary = `${formatDateTime((r as any).startTime, 'HH:mm')} - ${formatDateTime((r as any).endTime, 'HH:mm')}（${Math.round(((r as any).endTime - (r as any).startTime) / 60000)} 分钟）`;
          break;
        case 'growth':
          summary = [`体重 ${(r as any).weight}kg`, `身高 ${(r as any).height}cm`, `头围 ${(r as any).headCircumference}cm`].filter(Boolean).join(' · ');
          break;
      }
      items.push({
        kind: 'record',
        id: r.id,
        timestamp: r.timestamp,
        title: `${meta.icon} ${meta.label}`,
        icon: meta.icon,
        summary,
        page: meta.page
      });
    });

    items.sort((a, b) => a.timestamp - b.timestamp);

    const byDay = new Map<string, TimelineEvent[]>();
    items.forEach(it => {
      const k = formatFullDate(it.timestamp);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k)!.push(it);
    });
    return Array.from(byDay.entries()).map(([day, dayItems]) => ({ day, items: dayItems }));
  }, [event, records]);

  const handleTapItem = (it: TimelineEvent) => {
    if (it.kind === 'record' && it.page) {
      Taro.navigateTo({ url: `${it.page}?id=${it.id}` });
    } else if (it.kind === 'event') {
      Taro.navigateTo({ url: `/pages/health-edit/index?id=${eventId}` });
    } else {
      Taro.showToast({ title: '点击上方查看详情', icon: 'none' });
    }
  };

  const handleTapFollowUp = (fid: string) => {
    Taro.navigateTo({ url: `/pages/follow-up-edit/index?id=${fid}` });
  };

  if (!event) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyCard}>
          <Text className={styles.emptyIcon}>⏳</Text>
          <Text className={styles.emptyTitle}>未找到该健康事件</Text>
          <Text className={styles.emptyDesc}>可能已被删除，返回上一页重试</Text>
        </View>
      </View>
    );
  }

  const headerCls =
    event.severity === 'severe' ? styles.eventHeaderSevere :
    event.severity === 'moderate' ? styles.eventHeaderModerate : '';
  const sevCls =
    event.severity === 'mild' ? styles.sevMild :
    event.severity === 'moderate' ? styles.sevModerate : styles.sevSevere;

  return (
    <View className={styles.page}>
      <View className={`${styles.eventHeader} ${headerCls}`}>
        <Text className={styles.eventHeaderTitle}>
          <Text className={styles.eventHeaderIcon}>{TYPE_META[event.type].icon}</Text>
          {event.title || TYPE_META[event.type].label}
        </Text>
        <Text className={styles.eventHeaderMeta}>
          开始：{formatFullDate(event.startAt)} {formatDateTime(event.startAt, 'HH:mm')}
          {event.endAt && ` → ${formatFullDate(event.endAt)} ${formatDateTime(event.endAt, 'HH:mm')}`}
        </Text>
        <View className={styles.eventHeaderRow}>
          <Text className={`${styles.eventTag} ${sevCls}`}>{SEVERITY_LABEL[event.severity]}</Text>
          {event.temperature !== undefined && (
            <Text className={styles.eventTag}>🌡️ {event.temperature}℃</Text>
          )}
          {event.symptoms.length > 0 && (
            <Text className={styles.eventTag}>症状 {event.symptoms.length} 项</Text>
          )}
          {event.medicines.length > 0 && (
            <Text className={styles.eventTag}>用药 {event.medicines.length} 种</Text>
          )}
        </View>
        {event.description && <Text className={styles.eventHeaderDesc}>{event.description}</Text>}

        {relatedFollowUps.length > 0 && (
          <View className={styles.eventHeaderFollowUps}>
            <Text className={styles.eventHeaderFollowLabel}>关联随访（{relatedFollowUps.length}）</Text>
            {relatedFollowUps.map(f => (
              <View key={f.id} className={styles.followLinkItem} onClick={() => handleTapFollowUp(f.id)}>
                <Text className={styles.followLinkText}>📅 {f.title}</Text>
                <Text className={`${styles.followLinkStatus} ${FOLLOWUP_STATUS_CLS[f.status]}`}>
                  {FOLLOWUP_STATUS_LABEL[f.status]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {groupedByDay.length === 0 ? (
        <View className={styles.emptyCard}>
          <Text className={styles.emptyIcon}>🕒</Text>
          <Text className={styles.emptyTitle}>时间线暂无内容</Text>
          <Text className={styles.emptyDesc}>可在编辑页勾选关联的喂养/睡眠/尿布记录，即可在这里串成完整时间线</Text>
        </View>
      ) : (
        <ScrollView scrollY>
          {groupedByDay.map(g => (
            <View key={g.day} className={styles.dayGroup}>
              <View className={styles.dayHeader}>
                <View className={styles.dayDot} />
                <Text className={styles.dayLabel}>{g.day}</Text>
                <Text className={styles.dayCount}>共 {g.items.length} 条</Text>
              </View>
              <View className={styles.timeLine}>
                {g.items.map(it => {
                  const itemCls =
                    it.kind === 'event' ? styles.timeItemEvent :
                    it.kind === 'medicine' ? styles.timeItemMed : '';
                  return (
                    <View
                      key={it.id}
                      className={`${styles.timeItem} ${itemCls}`}
                      onClick={() => handleTapItem(it)}
                    >
                      <View className={styles.timeItemHeader}>
                        <Text className={styles.timeItemType}>
                          <Text className={styles.timeItemIcon}>{it.icon}</Text>
                          {it.title}
                        </Text>
                        <Text className={styles.timeItemTime}>{formatDateTime(it.timestamp, 'HH:mm')}</Text>
                      </View>
                      <Text className={styles.timeItemBody}>{it.summary}</Text>
                      {it.kind === 'record' && it.page && (
                        <Text className={styles.timeItemDetailTag}>点击查看原始记录 ›</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
