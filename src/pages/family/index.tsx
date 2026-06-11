import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { formatFullDate, formatDateTime } from '@/utils';

const FamilyPage: React.FC = () => {
  const { familyMembers, handovers, markHandoverRead, toggleHandoverTodo } = useBabyStore();
  const me = familyMembers[0];

  const groupedHandovers = useMemo(() => {
    const groups: Record<string, typeof handovers> = {};
    handovers.forEach(h => {
      const key = formatDateTime(h.timestamp, 'YYYY-MM-DD');
      if (!groups[key]) groups[key] = [];
      groups[key].push(h);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [handovers]);

  const handleAddMember = () => {
    Taro.showActionSheet({
      itemList: ['通过微信邀请', '复制邀请链接'],
      success: () => {
        Taro.showToast({ title: '邀请链接已复制', icon: 'success' });
      }
    });
  };

  const handlePerm = (name: string) => {
    Taro.showActionSheet({
      itemList: ['查看权限', '编辑权限', '移除成员'],
      success: (res) => {
        if (res.tapIndex === 2) {
          Taro.showModal({
            title: '确认移除',
            content: `确定要移除${name}吗？`,
            success: (res) => {
              if (res.confirm) {
                Taro.showToast({ title: '已移除', icon: 'success' });
              }
            }
          });
        } else {
          Taro.showToast({ title: '已设置', icon: 'success' });
        }
      }
    });
  };

  const handleAddHandover = () => {
    Taro.navigateTo({ url: '/pages/handover-edit/index' });
  };

  const handleEditHandover = (id: string) => {
    Taro.navigateTo({ url: `/pages/handover-edit/index?id=${id}` });
  };

  const handleMarkRead = (id: string) => {
    if (me?.name) {
      markHandoverRead(id, me.name);
      Taro.showToast({ title: '已确认', icon: 'success' });
    }
  };

  const handleToggleTodo = (handoverId: string, todoId: string) => {
    toggleHandoverTodo(handoverId, todoId);
  };

  const getReadStatus = (h: typeof handovers[0]) => {
    if (!me?.name) return '';
    const unread = familyMembers
      .filter(m => m.role !== '管理员' || m.name !== h.fromMember)
      .filter(m => !h.readBy.includes(m.name) && m.name !== h.fromMember);
    if (unread.length === 0) return '全员已读';
    return `待读 ${unread.map(m => m.name).join('、')}`;
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>交接班记录</Text>
          <View className={styles.addBtn} onClick={handleAddHandover}>
            <Text className={styles.addBtnText}>+ 写交班</Text>
          </View>
        </View>

        {groupedHandovers.length === 0 ? (
          <View className={styles.emptyCard}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyTitle}>暂无交接班记录</Text>
            <Text className={styles.emptyDesc}>月嫂或家人交班时写一下今日重点，其他成员进来就能看到</Text>
          </View>
        ) : (
          groupedHandovers.map(([date, list]) => (
            <View key={date}>
              <Text className={styles.groupDate}>{date} 共 {list.length} 次交班</Text>
              {list.map(h => {
                const isMeUnread = me && !h.readBy.includes(me.name) && h.fromMember !== me.name;
                const allDone = h.todos.length > 0 && h.todos.every(t => t.isDone);
                return (
                  <View key={h.id} className={`${styles.handoverCard} ${isMeUnread ? styles.handoverUnread : ''}`} onClick={() => handleEditHandover(h.id)}>
                    {isMeUnread && <View className={styles.unreadBadge} />}
                    <View className={styles.handoverHeader}>
                      <View className={styles.handoverFrom}>
                        <Text className={styles.handoverFromName}>{h.fromMember}</Text>
                        <Text className={styles.handoverRole}>交班</Text>
                        {h.toMember && <Text className={styles.handoverTo}>→ {h.toMember}</Text>}
                        {h.todos.length > 0 && (
                          <Text className={`${styles.handoverStatusTag} ${allDone ? styles.handoverStatusDone : styles.handoverStatusPending}`}>
                            {allDone ? '已办结' : `待办 ${h.todos.filter(t => !t.isDone).length}`}
                          </Text>
                        )}
                      </View>
                      <Text className={styles.handoverTime}>{formatDateTime(h.timestamp, 'HH:mm')}</Text>
                    </View>

                    {h.keyPoints && (
                      <View className={styles.handoverSection}>
                        <Text className={styles.handoverSectionLabel}>📌 今日重点</Text>
                        <Text className={styles.handoverSectionText}>{h.keyPoints}</Text>
                      </View>
                    )}

                    {h.exceptions && (
                      <View className={styles.handoverSection}>
                        <Text className={styles.handoverSectionLabel}>⚠️ 异常情况</Text>
                        <Text className={`${styles.handoverSectionText} ${styles.handoverException}`}>{h.exceptions}</Text>
                      </View>
                    )}

                    {h.todos.length > 0 && (
                      <View className={styles.handoverSection}>
                        <Text className={styles.handoverSectionLabel}>📋 待办 ({h.todos.filter(t => !t.isDone).length}/{h.todos.length})</Text>
                        <View className={styles.todoListInline}>
                          {h.todos.map(t => (
                            <View
                              key={t.id}
                              className={`${styles.todoItemInline} ${t.isDone ? styles.todoItemDone : ''}`}
                              onClick={(e) => { e.stopPropagation(); handleToggleTodo(h.id, t.id); }}
                            >
                              <Text className={styles.todoCheckInline}>{t.isDone ? '✅' : '◻️'}</Text>
                              <Text className={styles.todoTextInline}>{t.content}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <View className={styles.handoverFooter}>
                      <Text className={styles.handoverReadStatus}>{getReadStatus(h)}</Text>
                      {isMeUnread && (
                        <View
                          className={styles.markReadBtn}
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(h.id); }}
                        >
                          <Text>确认已读</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}

        <View className={styles.sectionHeader} style={{ marginTop: 40 }}>
          <Text className={styles.sectionTitle}>家庭成员</Text>
        </View>

        {familyMembers.map((member) => (
          <View key={member.id} className={styles.memberCard}>
            <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
            <View className={styles.info}>
              <View className={styles.nameRow}>
                <Text className={styles.name}>{member.name}</Text>
                <Text className={styles.roleTag}>{member.role}</Text>
              </View>
              <Text className={styles.joinDate}>加入于 {formatFullDate(member.joinedAt)}</Text>
            </View>
            <Text className={styles.permBtn} onClick={() => handlePerm(member.name)}>
              权限
            </Text>
          </View>
        ))}

        <View className={styles.addCard} onClick={handleAddMember}>
          <Text className={styles.addIcon}>+</Text>
          <Text className={styles.addText}>邀请家庭成员</Text>
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.tipTitle}>💡 家庭协作说明</Text>
          <Text className={styles.tipText}>
            {'\n'}· 管理员可管理所有成员和记录{'\n'}
            · 成员可查看和编辑记录{'\n'}
            · 所有操作都会记录操作人{'\n'}
            · 支持同时多人在线编辑
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default FamilyPage;
