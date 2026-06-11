import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useBabyStore } from '@/store/babyStore';
import { formatFullDate } from '@/utils';

const FamilyPage: React.FC = () => {
  const { familyMembers } = useBabyStore();

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

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
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
