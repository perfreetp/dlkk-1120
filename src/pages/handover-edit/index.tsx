import { useState, useMemo } from 'react';
import { View, Text, Textarea, Input } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useBabyStore } from '@/store/babyStore';
import { formatDateTime, generateId } from '@/utils';
import styles from './index.module.scss';
import type { HandoverTodo } from '@/types';

export default function HandoverEdit() {
  const router = useRouter();
  const params = router.params;
  const editId = params?.id;

  const { familyMembers, handovers, addHandover, updateHandover } = useBabyStore();

  const editingHandover = useMemo(() => (editId ? handovers.find(h => h.id === editId) : null), [editId, handovers]);
  const me = familyMembers[0];

  const [timestamp, setTimestamp] = useState(editingHandover?.timestamp || Date.now());
  const [fromMember, setFromMember] = useState(editingHandover?.fromMember || me?.name || '');
  const [toMember, setToMember] = useState(editingHandover?.toMember || '');
  const [keyPoints, setKeyPoints] = useState(editingHandover?.keyPoints || '');
  const [exceptions, setExceptions] = useState(editingHandover?.exceptions || '');
  const [todos, setTodos] = useState<HandoverTodo[]>(editingHandover?.todos || []);
  const [newTodoText, setNewTodoText] = useState('');

  useDidShow(() => {
    if (editingHandover) {
      Taro.setNavigationBarTitle({ title: '编辑交接班' });
    }
  });

  const handleChooseTime = () => {
    Taro.showActionSheet({
      itemList: ['选择日期', '选择时间', '使用当前时间'],
      success: (res) => {
        const _taro = Taro as any;
        if (res.tapIndex === 0) {
          _taro.showDatePicker?.({
            format: 'YYYY-MM-DD',
            current: formatDateTime(timestamp, 'YYYY-MM-DD'),
            success: (dr) => {
              const dt = new Date(dr.value);
              const old = new Date(timestamp);
              dt.setHours(old.getHours(), old.getMinutes(), 0, 0);
              setTimestamp(dt.getTime());
            }
          }) || Taro.showToast({ title: '当前环境不支持', icon: 'none' });
        } else if (res.tapIndex === 1) {
          _taro.showTimePicker?.({
            format: 'HH:mm',
            current: formatDateTime(timestamp, 'HH:mm'),
            success: (tr) => {
              const [h, m] = tr.value.split(':').map(Number);
              const dt = new Date(timestamp);
              dt.setHours(h, m, 0, 0);
              setTimestamp(dt.getTime());
            }
          }) || Taro.showToast({ title: '当前环境不支持', icon: 'none' });
        } else if (res.tapIndex === 2) {
          setTimestamp(Date.now());
        }
      }
    });
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    setTodos([...todos, { id: generateId(), content: newTodoText.trim(), isDone: false }]);
    setNewTodoText('');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, isDone: !t.isDone } : t));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  const handleSubmit = () => {
    if (!fromMember) {
      Taro.showToast({ title: '请选择交班人', icon: 'none' });
      return;
    }
    if (!keyPoints.trim()) {
      Taro.showToast({ title: '请填写今日重点', icon: 'none' });
      return;
    }

    const payload = {
      fromMember,
      toMember,
      timestamp,
      keyPoints: keyPoints.trim(),
      exceptions: exceptions.trim(),
      todos,
      readBy: editingHandover?.readBy || [fromMember],
      createdBy: editingHandover?.createdBy || fromMember,
    };

    if (editingHandover) {
      updateHandover(editingHandover.id, payload);
    } else {
      addHandover(payload);
    }
    Taro.showToast({ title: editingHandover ? '已更新' : '已交班', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 500);
  };

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.cardTitle}>交班信息</Text>

        <View className={styles.timeRow} onClick={handleChooseTime}>
          <Text className={styles.timeLabel}>交班时间</Text>
          <Text className={styles.timeValue}>{formatDateTime(timestamp, 'YYYY-MM-DD HH:mm')} ›</Text>
        </View>

        <View className={styles.inputLabel}>交班人</View>
        <View className={styles.memberRow}>
          {familyMembers.map(m => (
            <View
              key={m.id}
              className={`${styles.memberTag} ${fromMember === m.name ? styles.memberTagActive : ''}`}
              onClick={() => setFromMember(m.name)}
            >
              {m.name}
            </View>
          ))}
        </View>

        <View className={styles.inputLabel} style={{ marginTop: 24 }}>交接给（可选）</View>
        <View className={styles.memberRow}>
          {familyMembers.filter(m => m.name !== fromMember).map(m => (
            <View
              key={m.id}
              className={`${styles.memberTag} ${toMember === m.name ? styles.memberTagActive : ''}`}
              onClick={() => setToMember(toMember === m.name ? '' : m.name)}
            >
              {m.name}
            </View>
          ))}
          <View className={styles.memberTag} onClick={() => setToMember('')}>
            全体成员
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>今日重点</Text>
        <Textarea
          className={styles.textareaInput}
          placeholder='记录今日喂养重点、宝宝状态、活动情况等'
          value={keyPoints}
          onInput={(e) => setKeyPoints(e.detail.value)}
          maxlength={500}
        />
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>异常情况（可选）</Text>
        <Textarea
          className={styles.textareaInput}
          placeholder='记录身体不适、皮肤异常、哭闹异常、过敏反应等...'
          value={exceptions}
          onInput={(e) => setExceptions(e.detail.value)}
          maxlength={300}
        />
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>待办提醒</Text>
        <View className={styles.todoAddRow}>
          <Input
            className={styles.todoInput}
            placeholder='添加待办事项，例：18点吃药、洗澡后涂霜'
            value={newTodoText}
            onInput={(e) => setNewTodoText(e.detail.value)}
            onConfirm={handleAddTodo}
          />
          <View className={styles.todoAddBtn} onClick={handleAddTodo}>＋</View>
        </View>
        {todos.length === 0 ? (
          <Text style={{ fontSize: 24, color: '#999', padding: '16rpx 0' }}>暂无待办事项</Text>
        ) : (
          <View className={styles.todoList}>
            {todos.map(t => (
              <View key={t.id} className={styles.todoItem}>
                <View className={`${styles.todoCheck} ${t.isDone ? styles.todoCheckDone : ''}`} onClick={() => handleToggleTodo(t.id)}>
                  {t.isDone && <Text className={styles.todoCheckIcon}>✓</Text>}
                </View>
                <Text className={`${styles.todoText} ${t.isDone ? styles.todoTextDone : ''}`}>{t.content}</Text>
                <Text className={styles.todoDelete} onClick={() => handleDeleteTodo(t.id)}>×</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={`${styles.btn} ${styles.btnCancel}`} onClick={handleCancel}>取消</View>
        <View className={`${styles.btn} ${styles.btnSubmit}`} onClick={handleSubmit}>
          {editingHandover ? '保存修改' : '确认交班'}
        </View>
      </View>
    </View>
  );
}
