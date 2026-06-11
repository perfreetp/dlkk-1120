import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useBabyStore } from '@/store/babyStore';

const MinePage: React.FC = () => {
  const { babyInfo, records, reminders, familyMembers, isNightMode, toggleNightMode } = useBabyStore();

  const menuGroups = [
    {
      items: [
        { icon: '👨‍👩‍👧', title: '家庭成员', path: '/pages/family/index', extra: `${familyMembers.length}人` },
        { icon: '📤', title: '导出给医生', path: '/pages/export/index' },
        { icon: '📊', title: '统计分析', path: '/pages/statistics/index' },
        { icon: '📈', title: '长期趋势', path: '/pages/trends/index' }
      ]
    },
    {
      items: [
        { icon: '🌙', title: '夜间模式', toggle: true },
        { icon: '💡', title: '使用帮助', action: true },
        { icon: '⭐', title: '给我们好评', action: true }
      ]
    }
  ];

  const handleMenuClick = (item: any) => {
    if (item.toggle) {
      toggleNightMode();
    } else if (item.action) {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    } else if (item.path) {
      Taro.navigateTo({ url: item.path });
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.profile}>
          <Image
            className={styles.avatar}
            src={babyInfo.avatar || 'https://picsum.photos/id/64/200/200'}
            mode="aspectFill"
          />
          <View className={styles.userInfo}>
            <Text className={styles.userName}>{babyInfo.name}</Text>
            <Text className={styles.userRole}>{babyInfo.gender === 'girl' ? '女宝宝' : '男宝宝'}</Text>
          </View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{records.length}</Text>
            <Text className={styles.statLabel}>总记录</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{reminders.filter((r) => !r.isCompleted).length}</Text>
            <Text className={styles.statLabel}>待提醒</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{familyMembers.length}</Text>
            <Text className={styles.statLabel}>家庭成员</Text>
          </View>
        </View>
      </View>

      <ScrollView className={styles.content} scrollY>
        {menuGroups.map((group, gIdx) => (
          <View key={gIdx} className={styles.menuGroup}>
            {group.items.map((item, idx) => (
              <View key={idx} className={styles.menuItem} onClick={() => handleMenuClick(item)}>
                <View className={styles.menuIcon}>
                  <Text>{item.icon}</Text>
                </View>
                <Text className={styles.menuTitle}>{item.title}</Text>
                {item.toggle ? (
                  <View className={styles.nightToggle}>
                    <View className={classnames(styles.toggle, isNightMode && styles.toggleActive)}>
                      <View
                        className={classnames(styles.toggleKnob, isNightMode && styles.toggleKnobActive)}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={{ display: 'flex', alignItems: 'center' }}>
                    {item.extra && <Text style={{ fontSize: 24, color: '#8C8C8C', marginRight: 8 }}>{item.extra}</Text>}
                    <Text className={styles.menuArrow}>›</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MinePage;
