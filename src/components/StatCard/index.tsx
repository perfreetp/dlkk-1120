import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatCardProps {
  icon: string;
  type?: 'feeding' | 'solid' | 'diaper' | 'sleep';
  value: string | number;
  unit?: string;
  label: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, type = 'feeding', value, unit, label, onClick }) => {
  return (
    <View className={styles.statCard} onClick={onClick}>
      <View className={classnames(styles.iconWrap, styles[type])}>
        <Text className={styles.iconText}>{icon}</Text>
      </View>
      <View>
        <Text className={styles.value}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      <Text className={styles.label}>{label}</Text>
    </View>
  );
};

export default StatCard;
