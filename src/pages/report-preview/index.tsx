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

  const filteredRecords = useMemo(() => {
    const startTs = dayjs(startDate).startOf('day').valueOf();
    const endTs = dayjs(endDate).endOf('day').valueOf();

    let list = records.filter((r) => r.timestamp >= startTs && r.timestamp <= endTs);

    if (typeParam !== 'all') {
      list = list.filter((r) => r.type === typeParam);
    }

    return list.sort((a, b) => a.timestamp - b.timestamp);
  }, [records, startDate, endDate, typeParam]);

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

  const generateReportText = (): string => {
    const lines: string[] = [];
    lines.push('========================================');
    lines.push('      宝宝喂养与成长报告');
    lines.push('========================================');
    lines.push('');
    lines.push(`报告期间：${startDate} 至 ${endDate}`);
    lines.push(`宝宝姓名：${babyInfo.name || '未设置'}`);
    lines.push(`宝宝年龄：${babyInfo.birthday ? getBabyAge(babyInfo.birthday) : '未设置'}`);
    if (babyInfo.gender) {
      lines.push(`宝宝性别：${babyInfo.gender === 'boy' ? '男宝' : '女宝'}`);
    }
    lines.push('');
    lines.push('【喂奶统计】');
    lines.push(`  总次数：${summary.feedingCount} 次`);
    lines.push(`  母乳左侧：${formatDuration(summary.breastLeftDuration)}`);
    lines.push(`  母乳右侧：${formatDuration(summary.breastRightDuration)}`);
    lines.push(`  瓶喂总量：${summary.bottleAmount}ml`);
    lines.push(`  配方奶量：${summary.formulaAmount}ml`);
    lines.push(`  奶量总计：${summary.feedingTotalAmount}ml`);
    lines.push('');
    lines.push('【辅食统计】');
    lines.push(`  辅食次数：${summary.solidCount} 次`);
    lines.push('');
    lines.push('【尿布统计】');
    lines.push(`  总次数：${summary.diaperCount} 次`);
    lines.push(`  小便：${summary.wetDiaper} 次`);
    lines.push(`  大便：${summary.dirtyDiaper} 次`);
    lines.push('');
    lines.push('【睡眠统计】');
    lines.push(`  总时长：${formatDuration(summary.sleepTotalDuration)}`);
    lines.push(`  睡眠次数：${summary.sleepCount} 次`);
    lines.push('');
    if (summary.growthCount > 0) {
      lines.push('【成长记录】');
      if (summary.lastWeight > 0) lines.push(`  最新体重：${summary.lastWeight}kg`);
      if (summary.lastHeight > 0) lines.push(`  最新身高：${summary.lastHeight}cm`);
      lines.push(`  记录次数：${summary.growthCount} 次`);
      lines.push('');
    }
    if (summary.notes.length > 0) {
      lines.push('【异常/备注记录】');
      summary.notes.forEach((note, i) => {
        lines.push(`  ${i + 1}. ${note}`);
      });
      lines.push('');
    }
    lines.push('【详细记录】');
    lines.push('--------------------');
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
      lines.push(`${time}  ${content}`);
      if (record.note) {
        lines.push(`         备注：${record.note}`);
      }
    });
    lines.push('');
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

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.reportCard}>
          <View className={styles.reportHeader}>
            <Text className={styles.reportTitle}>宝宝喂养报告</Text>
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

        <View className={styles.reportCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🍼</Text>
            喂奶统计
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

        <View className={styles.reportCard}>
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

        <View className={styles.reportCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>😴</Text>
            睡眠统计
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
        </View>

        {growthRecords.length > 0 && (
          <View className={styles.reportCard}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📏</Text>
              成长记录
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
                </Text>
              </View>
            ))}
            </View>
          </View>
        )}

        {noteRecords.length > 0 && (
          <View className={styles.reportCard}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📝</Text>
              异常/备注
            </Text>
            <View className={styles.recordList}>
              {noteRecords.map((record) => (
                <View key={record.id} className={styles.recordItem}>
                  <Text className={styles.recordTime}>
                    {dayjs(record.timestamp).format('MM-DD HH:mm')}
                  </Text>
                  <View className={styles.recordNote}>{record.note}</View>
                </View>
              ))}
            </View>
          </View>
        )}

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
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleCopy}>
          复制报告
        </View>
        <View className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleShare}>
          分享给医生
        </View>
      </View>
    </View>
  );
};

export default ReportPreviewPage;
