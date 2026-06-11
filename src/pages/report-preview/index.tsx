import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { formatDuration, formatFullDate, formatTime, getBabyAge, getFeedingTypeLabel } from '@/utils';
import dayjs from 'dayjs';
import type { BabyRecord } from '@/types';

const ReportPreviewPage: React.FC = () => {
  const router = useRouter();
  const { records, babyInfo } = useBabyStore();

  const startDate = router.params.startDate || dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  const endDate = router.params.endDate || dayjs().format('YYYY-MM-DD');
  const typeParam = router.params.type || 'all';
  const template = router.params.template || 'default';

  const selectedTypes = useMemo(() => {
    if (typeParam === 'all') return ['feeding', 'solid', 'diaper', 'sleep', 'growth'];
    return typeParam.split(',').filter(Boolean);
  }, [typeParam]);

  const filteredRecords = useMemo(() => {
    const startTs = dayjs(startDate).startOf('day').valueOf();
    const endTs = dayjs(endDate).endOf('day').valueOf();

    let list = records.filter((r) => r.timestamp >= startTs && r.timestamp <= endTs);

    list = list.filter((r) => selectedTypes.includes(r.type));

    return list.sort((a, b) => a.timestamp - b.timestamp);
  }, [records, startDate, endDate, selectedTypes]);

  const summary = useMemo(() => {
    const result = {
      feedingCount: 0,
      feedingTotalAmount: 0,
      breastLeftDuration: 0,
      breastRightDuration: 0,
      bottleAmount: 0,
      formulaAmount: 0,
      solidCount: 0,
      diaperCount: 0,
      wetDiaper: 0,
      dirtyDiaper: 0,
      sleepTotalDuration: 0,
      sleepCount: 0,
      growthCount: 0,
      lastWeight: 0,
      lastHeight: 0,
      notes: [] as string[]
    };

    filteredRecords.forEach((record) => {
      switch (record.type) {
        case 'feeding':
          result.feedingCount++;
          if (record.subType === 'breast_left') {
            result.breastLeftDuration += record.duration || 0;
          } else if (record.subType === 'breast_right') {
            result.breastRightDuration += record.duration || 0;
          } else if (record.subType === 'bottle') {
            result.bottleAmount += record.amount || 0;
            result.feedingTotalAmount += record.amount || 0;
          } else if (record.subType === 'formula') {
            result.formulaAmount += record.amount || 0;
            result.feedingTotalAmount += record.amount || 0;
          }
          break;
        case 'solid':
          result.solidCount++;
          break;
        case 'diaper':
          result.diaperCount++;
          if (record.hasPee) result.wetDiaper++;
          if (record.hasPoop) result.dirtyDiaper++;
          break;
        case 'sleep':
          result.sleepCount++;
          result.sleepTotalDuration += (record.endTime - record.startTime) / 1000;
          break;
        case 'growth':
          result.growthCount++;
          if (record.weight) result.lastWeight = record.weight;
          if (record.height) result.lastHeight = record.height;
          break;
      }
      if (record.note && record.note.trim()) {
        result.notes.push(
          `${dayjs(record.timestamp).format('MM-DD HH:mm')} ${record.note}`
        );
      }
    });

    return result;
  }, [filteredRecords]);

  const renderRecordContent = (record: BabyRecord) => {
    switch (record.type) {
      case 'feeding':
        if (record.subType?.startsWith('breast_')) {
          return `${getFeedingTypeLabel(record.subType)} · ${formatDuration(record.duration || 0)}`;
        }
        return `${getFeedingTypeLabel(record.subType!)} · ${record.amount}ml`;
      case 'solid':
        return `辅食：${record.ingredients.join('、') || '未填写'}`;
      case 'diaper':
        const types: string[] = [];
        if (record.hasPee) types.push('小便');
        if (record.hasPoop) types.push('大便');
        return `尿布：${types.join('+') || '无'}`;
      case 'sleep':
        return `睡眠：${formatTime(record.startTime)} - ${formatTime(record.endTime)}`;
      case 'growth': {
        let txt = '成长记录';
        if (record.weight) txt += ` · ${record.weight}kg`;
        if (record.height) txt += ` · ${record.height}cm`;
        return txt;
      }
      default:
        return '';
    }
  };

  const growthRecords = filteredRecords.filter((r) => r.type === 'growth');
  const noteRecords = filteredRecords.filter((r) => r.note && r.note.trim());
  const solidRecords = filteredRecords.filter((r) => r.type === 'solid');
  const sleepRecords = filteredRecords.filter((r) => r.type === 'sleep');

  const templateConfig: Record<string, {
    title: string;
    highlightSections: string[];
    sectionOrder: string[];
  }> = {
    default: {
      title: '宝宝喂养报告',
      highlightSections: [],
      sectionOrder: ['feeding', 'solid-diaper', 'sleep', 'growth', 'notes', 'details']
    },
    checkup: {
      title: '儿保体检专用报告',
      highlightSections: ['growth', 'feeding', 'sleep'],
      sectionOrder: ['growth', 'feeding', 'sleep', 'solid-diaper', 'notes', 'details']
    },
    allergy: {
      title: '过敏排查专用报告',
      highlightSections: ['solid', 'diaper', 'notes'],
      sectionOrder: ['solid', 'diaper', 'feeding', 'notes', 'details']
    },
    sleep: {
      title: '睡眠观察专用报告',
      highlightSections: ['sleep', 'notes'],
      sectionOrder: ['sleep', 'feeding', 'diaper', 'notes', 'details']
    }
  };

  const cfg = templateConfig[template] || templateConfig.default;

  const generateReportText = (): string => {
    const highlight = (text: string, section: string) =>
      cfg.highlightSections.includes(section) ? `【★重点】${text}` : text;

    const lines: string[] = [];
    lines.push('========================================');
    lines.push(`      ${cfg.title}`);
    lines.push('========================================');
    lines.push('');
    lines.push(`报告期间：${startDate} 至 ${endDate}`);
    lines.push(`宝宝姓名：${babyInfo.name || '未设置'}`);
    lines.push(`宝宝年龄：${babyInfo.birthday ? getBabyAge(babyInfo.birthday) : '未设置'}`);
    if (babyInfo.gender) {
      lines.push(`宝宝性别：${babyInfo.gender === 'boy' ? '男宝' : '女宝'}`);
    }
    lines.push('');

    const buildSection = (sec: string): string[] => {
      const out: string[] = [];
      switch (sec) {
        case 'feeding': {
          out.push(highlight('【喂奶统计】', 'feeding'));
          out.push(`  总次数：${summary.feedingCount} 次`);
          out.push(`  母乳左侧：${formatDuration(summary.breastLeftDuration)}`);
          out.push(`  母乳右侧：${formatDuration(summary.breastRightDuration)}`);
          out.push(`  瓶喂总量：${summary.bottleAmount}ml`);
          out.push(`  配方奶量：${summary.formulaAmount}ml`);
          out.push(`  奶量总计：${summary.feedingTotalAmount}ml`);
          out.push('');
          break;
        }
        case 'growth': {
          if (summary.growthCount > 0) {
            out.push(highlight('【成长记录】', 'growth'));
            if (summary.lastWeight > 0) out.push(`  最新体重：${summary.lastWeight}kg`);
            if (summary.lastHeight > 0) out.push(`  最新身高：${summary.lastHeight}cm`);
            out.push(`  记录次数：${summary.growthCount} 次`);
            out.push('');
          }
          break;
        }
        case 'sleep': {
          out.push(highlight('【睡眠统计】', 'sleep'));
          out.push(`  总时长：${formatDuration(summary.sleepTotalDuration)}`);
          out.push(`  睡眠次数：${summary.sleepCount} 次`);
          sleepRecords.forEach(r => {
            const qual = r.quality ? `[${r.quality}]` : '';
            const env = r.environment ? `[${r.environment}]` : '';
            const t = `${formatTime(r.startTime)}-${formatTime(r.endTime)}`;
            const d = formatDuration((r.endTime - r.startTime) / 1000);
            const tag = `${qual}${env}`.trim();
            out.push(`  ${t} ${d} ${tag}`);
            if (r.note) out.push(`    备注：${r.note}`);
          });
          out.push('');
          break;
        }
        case 'solid': {
          out.push(highlight('【辅食统计】', 'solid'));
          out.push(`  辅食次数：${summary.solidCount} 次`);
          solidRecords.forEach(r => {
            const ingredients = r.ingredients?.join('、') || '未填写';
            const allergy = r.allergyLevel ? `[过敏${r.allergyLevel}]` : '';
            const sym = r.allergySymptoms?.length ? `症状：${r.allergySymptoms.join('、')}` : '';
            out.push(`  ${ingredients} ${r.amount ? `(${r.amount}g)` : ''} ${allergy}`);
            if (sym) out.push(`    ${sym}`);
            if (r.note) out.push(`    备注：${r.note}`);
          });
          out.push('');
          break;
        }
        case 'diaper': {
          out.push(highlight('【尿布统计】', 'diaper'));
          out.push(`  总次数：${summary.diaperCount} 次`);
          out.push(`  小便：${summary.wetDiaper} 次`);
          out.push(`  大便：${summary.dirtyDiaper} 次`);
          out.push('');
          break;
        }
        case 'solid-diaper': {
          out.push(highlight('【辅食&尿布统计】', 'solid'));
          out.push(`  辅食次数：${summary.solidCount} 次`);
          out.push(`  尿布总次数：${summary.diaperCount} 次（小便 ${summary.wetDiaper} / 大便 ${summary.dirtyDiaper}）`);
          out.push('');
          break;
        }
        case 'notes': {
          if (summary.notes.length > 0) {
            out.push(highlight('【异常/备注记录】', 'notes'));
            summary.notes.forEach((note, i) => {
              out.push(`  ${i + 1}. ${note}`);
            });
            out.push('');
          }
          break;
        }
        case 'details': {
          out.push(highlight('【详细记录】', 'details'));
          out.push('--------------------');
          filteredRecords.forEach((record) => {
            const time = dayjs(record.timestamp).format('MM-DD HH:mm');
            let content = '';
            switch (record.type) {
              case 'feeding':
                if (record.subType?.startsWith('breast_')) {
                  content = `${getFeedingTypeLabel(record.subType)} ${formatDuration(record.duration || 0)}`;
                } else {
                  content = `${getFeedingTypeLabel(record.subType!)} ${record.amount}ml`;
                }
                break;
              case 'solid':
                content = `辅食：${record.ingredients.join('、') || '未填写'}`;
                if (record.amount) content += ` ${record.amount}g`;
                break;
              case 'diaper':
                const diaperType: string[] = [];
                if (record.hasPee) diaperType.push('小便');
                if (record.hasPoop) diaperType.push('大便');
                content = `尿布：${diaperType.join('+') || '无'}`;
                break;
              case 'sleep':
                content = `睡眠：${formatTime(record.startTime)} - ${formatTime(record.endTime)} (${formatDuration((record.endTime - record.startTime) / 1000)})`;
                break;
              case 'growth':
                content = '成长记录';
                if (record.weight) content += ` 体重${record.weight}kg`;
                if (record.height) content += ` 身高${record.height}cm`;
                break;
            }
            out.push(`${time}  ${content}`);
            if (record.note) {
              out.push(`         备注：${record.note}`);
            }
          });
          out.push('');
          break;
        }
      }
      return out;
    };

    cfg.sectionOrder.forEach(s => {
      lines.push(...buildSection(s));
    });

    lines.push('========================================');
    lines.push(`报告生成时间：${dayjs().format('YYYY-MM-DD HH:mm')}`);
    lines.push('========================================');
    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = generateReportText();
    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  };

  const handleShare = () => {
    Taro.showToast({ title: '请使用复制功能', icon: 'none' });
    handleCopy();
  };

  const isHighlight = (section: string) => cfg.highlightSections.includes(section);

  const renderFeedingCard = () => (
    <View className={`${styles.reportCard} ${isHighlight('feeding') ? styles.highlightCard : ''}`}>
      <Text className={styles.sectionTitle}>
        <Text className={styles.sectionIcon}>🍼</Text>
        喂奶统计 {isHighlight('feeding') && <Text className={styles.highlightTag}>重点</Text>}
      </Text>
      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>总次数</Text>
          <Text className={styles.statValue}>
            {summary.feedingCount}
            <Text className={styles.statUnit}>次</Text>
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>总奶量</Text>
          <Text className={styles.statValue}>
            {summary.feedingTotalAmount}
            <Text className={styles.statUnit}>ml</Text>
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>母乳左侧</Text>
          <Text className={styles.statValue}>
            {Math.round(summary.breastLeftDuration / 60)}
            <Text className={styles.statUnit}>分钟</Text>
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>母乳右侧</Text>
          <Text className={styles.statValue}>
            {Math.round(summary.breastRightDuration / 60)}
            <Text className={styles.statUnit}>分钟</Text>
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>瓶喂</Text>
          <Text className={styles.statValue}>
            {summary.bottleAmount}
            <Text className={styles.statUnit}>ml</Text>
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>配方奶</Text>
          <Text className={styles.statValue}>
            {summary.formulaAmount}
            <Text className={styles.statUnit}>ml</Text>
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSolidCard = () => (
    <View className={`${styles.reportCard} ${isHighlight('solid') ? styles.highlightCard : ''}`}>
      <Text className={styles.sectionTitle}>
        <Text className={styles.sectionIcon}>🥣</Text>
        辅食记录 {isHighlight('solid') && <Text className={styles.highlightTag}>重点</Text>}
      </Text>
      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>辅食次数</Text>
          <Text className={styles.statValue}>
            {summary.solidCount}
            <Text className={styles.statUnit}>次</Text>
          </Text>
        </View>
      </View>
      <View className={styles.recordList}>
        {solidRecords.length === 0 ? (
          <Text className={styles.emptyText}>暂无辅食记录</Text>
        ) : (
          solidRecords.map((record) => (
            <View key={record.id} className={styles.recordItem}>
              <Text className={styles.recordTime}>
                {dayjs(record.timestamp).format('MM-DD HH:mm')}
              </Text>
              <Text className={styles.recordContent}>
                配料：{record.ingredients.join('、') || '未填写'}
                {record.amount ? ` · ${record.amount}g` : ''}
              </Text>
              {record.allergyLevel && record.allergyLevel !== 'none' && (
                <View className={styles.recordNote}>
                  过敏等级：{record.allergyLevel === 'mild' ? '轻度' : record.allergyLevel === 'moderate' ? '中度' : '重度'}
                  {record.allergySymptoms && record.allergySymptoms.length > 0 && ` · 反应：${record.allergySymptoms.join('、')}`}
                </View>
              )}
              {record.note && <View className={styles.recordNote}>备注：{record.note}</View>}
            </View>
          ))
        )}
      </View>
    </View>
  );

  const renderDiaperCard = () => (
    <View className={`${styles.reportCard} ${isHighlight('diaper') ? styles.highlightCard : ''}`}>
      <Text className={styles.sectionTitle}>
        <Text className={styles.sectionIcon}>🧷</Text>
        尿布记录 {isHighlight('diaper') && <Text className={styles.highlightTag}>重点</Text>}
      </Text>
      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>尿布次数</Text>
          <Text className={styles.statValue}>
            {summary.diaperCount}
            <Text className={styles.statUnit}>次</Text>
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>小便</Text>
          <Text className={styles.statValue}>
            {summary.wetDiaper}
            <Text className={styles.statUnit}>次</Text>
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>大便</Text>
          <Text className={styles.statValue}>
            {summary.dirtyDiaper}
            <Text className={styles.statUnit}>次</Text>
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSolidDiaperCard = () => (
    <View className={`${styles.reportCard} ${isHighlight('solid-diaper') ? styles.highlightCard : ''}`}>
      <Text className={styles.sectionTitle}>
        <Text className={styles.sectionIcon}>🥣</Text>
        辅食与尿布
      </Text>
      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>辅食次数</Text>
          <Text className={styles.statValue}>
            {summary.solidCount}
            <Text className={styles.statUnit}>次</Text>
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>尿布次数</Text>
          <Text className={styles.statValue}>
            {summary.diaperCount}
            <Text className={styles.statUnit}>次</Text>
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSleepCard = () => (
    <View className={`${styles.reportCard} ${isHighlight('sleep') ? styles.highlightCard : ''}`}>
      <Text className={styles.sectionTitle}>
        <Text className={styles.sectionIcon}>😴</Text>
        睡眠统计 {isHighlight('sleep') && <Text className={styles.highlightTag}>重点</Text>}
      </Text>
      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>总时长</Text>
          <Text className={styles.statValue}>
            {Math.round(summary.sleepTotalDuration / 3600 * 10) / 10}
            <Text className={styles.statUnit}>小时</Text>
          </Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statLabel}>睡眠次数</Text>
          <Text className={styles.statValue}>
            {summary.sleepCount}
            <Text className={styles.statUnit}>次</Text>
          </Text>
        </View>
      </View>
      {isHighlight('sleep') && sleepRecords.length > 0 && (
        <View className={styles.recordList}>
          <Text className={styles.subSectionTitle}>睡眠明细</Text>
          {sleepRecords.map((record) => (
            <View key={record.id} className={styles.recordItem}>
              <Text className={styles.recordTime}>
                {formatTime(record.startTime)} - {formatTime(record.endTime)}
                {' '}({formatDuration((record.endTime - record.startTime) / 1000)})
              </Text>
              <Text className={styles.recordContent}>
                质量：{record.quality === 'good' ? '好 😴' : record.quality === 'normal' ? '一般 💤' : '差 😟'}
                {record.environment ? ` · 环境：${record.environment}` : ''}
              </Text>
              {record.note && <View className={styles.recordNote}>备注：{record.note}</View>}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderGrowthCard = () => (
    growthRecords.length > 0 && (
      <View className={`${styles.reportCard} ${isHighlight('growth') ? styles.highlightCard : ''}`}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📏</Text>
          成长记录 {isHighlight('growth') && <Text className={styles.highlightTag}>重点</Text>}
        </Text>
        <View className={styles.recordList}>
          {growthRecords.map((record) => (
            <View key={record.id} className={styles.recordItem}>
              <Text className={styles.recordTime}>
                {formatFullDate(record.timestamp)}
              </Text>
              <Text className={styles.recordContent}>
                {record.weight ? `体重 ${record.weight} kg` : ''}
                {record.weight && record.height ? ' · ' : ''}
                {record.height ? `身高 ${record.height} cm` : ''}
                {record.headCircumference ? ` · 头围 ${record.headCircumference} cm` : ''}
              </Text>
              {record.note && <View className={styles.recordNote}>备注：{record.note}</View>}
            </View>
          ))}
        </View>
      </View>
    )
  );

  const renderNotesCard = () => (
    noteRecords.length > 0 && (
      <View className={`${styles.reportCard} ${isHighlight('notes') ? styles.highlightCard : ''}`}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📝</Text>
          异常/备注 {isHighlight('notes') && <Text className={styles.highlightTag}>重点</Text>}
        </Text>
        <View className={styles.recordList}>
          {noteRecords.map((record) => (
            <View key={record.id} className={styles.recordItem}>
              <Text className={styles.recordTime}>
                {dayjs(record.timestamp).format('MM-DD HH:mm')} · {record.type === 'feeding' ? '喂奶' : record.type === 'solid' ? '辅食' : record.type === 'diaper' ? '尿布' : record.type === 'sleep' ? '睡眠' : '成长'}
              </Text>
              <View className={styles.recordNote}>{record.note}</View>
            </View>
          ))}
        </View>
      </View>
    )
  );

  const renderDetailsCard = () => (
    <View className={styles.reportCard}>
      <Text className={styles.sectionTitle}>
        <Text className={styles.sectionIcon}>📋</Text>
        详细记录
      </Text>
      {filteredRecords.length === 0 ? (
        <Text className={styles.emptyText}>暂无记录</Text>
      ) : (
        <View className={styles.recordList}>
          {filteredRecords.map((record) => (
            <View key={record.id} className={styles.recordItem}>
              <Text className={styles.recordTime}>
                {dayjs(record.timestamp).format('MM-DD HH:mm')}
              </Text>
              <Text className={styles.recordContent}>
                {renderRecordContent(record)}
              </Text>
              {record.note && (
                <View className={styles.recordNote}>{record.note}</View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSection = (section: string) => {
    switch (section) {
      case 'feeding': return renderFeedingCard();
      case 'solid': return renderSolidCard();
      case 'diaper': return renderDiaperCard();
      case 'solid-diaper': return renderSolidDiaperCard();
      case 'sleep': return renderSleepCard();
      case 'growth': return renderGrowthCard();
      case 'notes': return renderNotesCard();
      case 'details': return renderDetailsCard();
      default: return null;
    }
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.reportCard}>
          <View className={styles.reportHeader}>
            <Text className={styles.reportTitle}>{cfg.title}</Text>
            <Text className={styles.reportSubtitle}>{startDate} 至 {endDate}</Text>
          </View>

          <View className={styles.babyInfoRow}>
            <Text className={styles.babyInfoLabel}>宝宝姓名</Text>
            <Text className={styles.babyInfoValue}>{babyInfo.name || '未设置'}</Text>
          </View>
          <View className={styles.babyInfoRow}>
            <Text className={styles.babyInfoLabel}>宝宝年龄</Text>
            <Text className={styles.babyInfoValue}>
              {babyInfo.birthday ? getBabyAge(babyInfo.birthday) : '未设置'}
            </Text>
          </View>
        </View>

        {cfg.sectionOrder.map((section, idx) => (
          <View key={`${section}-${idx}`}>
            {renderSection(section)}
          </View>
        ))}
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleCopy}>
          复制报告
        </View>
        <View className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => {
          Taro.navigateTo({
            url: `/pages/follow-up-edit/index?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
          });
        }}>
          建随访
        </View>
        <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleShare}>
          分享给医生
        </View>
      </View>
    </View>
  );
};

export default ReportPreviewPage;
