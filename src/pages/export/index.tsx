import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { formatFullDate } from '@/utils';
import dayjs from 'dayjs';

const typeOptions = [
  { value: 'feeding', label: '喂奶记录', icon: '🍼' },
  { value: 'solid', label: '辅食记录', icon: '🥣' },
  { value: 'diaper', label: '尿布记录', icon: '🧷' },
  { value: 'sleep', label: '睡眠记录', icon: '😴' },
  { value: 'growth', label: '成长记录', icon: '📏' }
];

const presetOptions = [
  { value: '7', label: '最近7天' },
  { value: '30', label: '最近30天' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自定义' }
];

const templateOptions = [
  { value: 'default', label: '通用报告', icon: '📋', desc: '完整记录，适合日常沟通', types: ['feeding', 'solid', 'diaper', 'sleep', 'growth'] },
  { value: 'checkup', label: '儿保体检', icon: '🏥', desc: '突出身高体重、喂养数据、睡眠时长', types: ['feeding', 'growth', 'sleep', 'diaper'] },
  { value: 'allergy', label: '过敏排查', icon: '🔍', desc: '突出辅食配料、过敏反应、异常备注', types: ['solid', 'diaper', 'feeding'] },
  { value: 'sleep', label: '睡眠观察', icon: '🌙', desc: '突出睡眠时长、质量、环境、夜醒备注', types: ['sleep', 'feeding', 'diaper'] }
];

const ExportPage: React.FC = () => {
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').valueOf());
  const [endDate, setEndDate] = useState(Date.now());
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['feeding', 'solid', 'diaper', 'sleep', 'growth']);
  const [preset, setPreset] = useState('7');
  const [template, setTemplate] = useState('default');

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setTemplate('custom');
  };

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    const tpl = templateOptions.find((t) => t.value === value);
    if (tpl) {
      setSelectedTypes([...tpl.types]);
    }
  };

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = dayjs();
    if (value === '7') {
      setStartDate(now.subtract(7, 'day').valueOf());
      setEndDate(now.valueOf());
    } else if (value === '30') {
      setStartDate(now.subtract(30, 'day').valueOf());
      setEndDate(now.valueOf());
    } else if (value === 'month') {
      setStartDate(now.startOf('month').valueOf());
      setEndDate(now.endOf('day').valueOf());
    }
  };

  const handleDateClick = (which: 'start' | 'end') => {
    setPreset('custom');
    const _taro = Taro as any;
    _taro.showDatePicker?.({
      type: 'date',
      success: (res: any) => {
        const ts = dayjs(res.value as string).valueOf();
        if (which === 'start') {
          setStartDate(ts);
        } else {
          setEndDate(ts);
        }
      }
    });
  };

  const handlePreview = () => {
    if (selectedTypes.length === 0) {
      Taro.showToast({ title: '请选择导出类型', icon: 'none' });
      return;
    }
    const startStr = dayjs(startDate).format('YYYY-MM-DD');
    const endStr = dayjs(endDate).format('YYYY-MM-DD');
    const typeStr = selectedTypes.join(',');
    const tpl = template === 'custom' ? 'default' : template;
    Taro.navigateTo({
      url: `/pages/report-preview/index?startDate=${startStr}&endDate=${endStr}&type=${typeStr}&template=${tpl}`
    });
  };

  const handleExport = () => {
    if (selectedTypes.length === 0) {
      Taro.showToast({ title: '请选择导出类型', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '正在生成...' });
    setTimeout(() => {
      Taro.hideLoading();
      handlePreview();
    }, 500);
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>时间范围</Text>
        <View className={styles.presetList}>
          {presetOptions.map((opt) => (
            <Text
              key={opt.value}
              className={classnames(styles.presetBtn, preset === opt.value && styles.presetBtnActive)}
              onClick={() => handlePresetChange(opt.value)}
            >
              {opt.label}
            </Text>
          ))}
        </View>
        <View className={styles.dateRange}>
          <View className={styles.dateItem} onClick={() => handleDateClick('start')}>
            <Text className={styles.dateLabel}>开始日期</Text>
            <Text className={styles.dateValue}>{formatFullDate(startDate)}</Text>
          </View>
          <View className={styles.dateItem} onClick={() => handleDateClick('end')}>
            <Text className={styles.dateLabel}>结束日期</Text>
            <Text className={styles.dateValue}>{formatFullDate(endDate)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>报告模板</Text>
        <View className={styles.templateList}>
          {templateOptions.map((opt) => (
            <View
              key={opt.value}
              className={classnames(styles.templateItem, template === opt.value && styles.templateItemActive)}
              onClick={() => handleTemplateChange(opt.value)}
            >
              <Text className={styles.templateIcon}>{opt.icon}</Text>
              <View className={styles.templateInfo}>
                <Text className={styles.templateLabel}>{opt.label}</Text>
                <Text className={styles.templateDesc}>{opt.desc}</Text>
              </View>
              <View className={classnames(styles.radio, template === opt.value && styles.radioActive)}>
                {template === opt.value && <Text className={styles.radioCheck}>✓</Text>}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>导出内容</Text>
        <View className={styles.typeList}>
          {typeOptions.map((opt) => (
            <View
              key={opt.value}
              className={classnames(styles.typeItem, selectedTypes.includes(opt.value) && styles.typeItemActive)}
              onClick={() => toggleType(opt.value)}
            >
              <View className={classnames(styles.checkbox, selectedTypes.includes(opt.value) && styles.checkboxActive)}>
                {selectedTypes.includes(opt.value) && <Text className={styles.checkIcon}>✓</Text>}
              </View>
              <Text className={styles.typeText}>{opt.icon} {opt.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.previewBtn} onClick={handlePreview}>
          <Text>预览报告</Text>
        </View>
        <View className={styles.exportBtn} onClick={handleExport}>
          <Text>生成报告</Text>
        </View>
      </View>
    </View>
  );
};

export default ExportPage;
