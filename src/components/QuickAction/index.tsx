import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface QuickActionProps {
  icon: string;
  label: string;
  onClick?: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onClick }) => {
  return (
    <View className={styles.quickAction} onClick={onClick}>
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.label}>{label}</Text>
    </View>
  );
};

export default QuickAction;
