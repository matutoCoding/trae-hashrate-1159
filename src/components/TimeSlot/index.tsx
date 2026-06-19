import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { TimeSlot as TimeSlotType } from '@/types';
import styles from './index.module.scss';

interface TimeSlotProps {
  slot: TimeSlotType;
  selected?: boolean;
  onClick?: (slot: TimeSlotType) => void;
}

const statusMap = {
  available: '',
  booked: '已预约',
  waitlist: '候补排队',
  maintenance: '维护中',
  expired: '已过期'
};

const TimeSlot: React.FC<TimeSlotProps> = ({ slot, selected = false, onClick }) => {
  const isAvailable = slot.status === 'available';
  const isPeak = slot.rateType === 'peak';

  const handleClick = () => {
    if (isAvailable && onClick) {
      console.log('[TimeSlot] 选择时段', slot);
      onClick(slot);
    }
  };

  const containerClass = classnames(
    styles.slot,
    !isAvailable && styles.booked,
    isAvailable && !isPeak && !selected && styles.available,
    isAvailable && isPeak && !selected && styles.peak,
    selected && isPeak && styles.peakSelected,
    selected && !isPeak && styles.selected
  );

  return (
    <View className={containerClass} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.time}>
          {slot.startTime} - {slot.endTime}
        </Text>
        <Text className={styles.price}>¥{slot.price}</Text>
      </View>
      <View className={styles.footer}>
        <Text className={styles.rateLabel}>
          {slot.rateType === 'peak' ? '高峰' : slot.rateType === 'offpeak' ? '特惠' : '平峰'}
        </Text>
        <Text className={styles.statusText}>{!isAvailable ? statusMap[slot.status] : '可预约'}</Text>
      </View>
    </View>
  );
};

export default TimeSlot;
