import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { WaitlistItem as WaitlistItemType, WaitlistStatus } from '@/types';
import { useBookingStore } from '@/store/bookingStore';
import styles from './index.module.scss';

interface WaitlistItemProps {
  item: WaitlistItemType;
}

const statusMap: Record<WaitlistStatus, { label: string; className: string }> = {
  waiting: { label: '排队中', className: styles.waiting },
  notified: { label: '待确认补位', className: styles.notified },
  confirmed: { label: '补位成功', className: styles.confirmed },
  expired: { label: '已超时', className: styles.expired },
  cancelled: { label: '已取消', className: styles.cancelled }
};

const WaitlistItem: React.FC<WaitlistItemProps> = ({ item }) => {
  const status = statusMap[item.status];
  const cancelWaitlist = useBookingStore((state) => state.cancelWaitlist);

  const handleConfirm = () => {
    console.log('[WaitlistItem] 确认补位', item.id);
    Taro.showToast({
      title: '补位成功',
      icon: 'success'
    });
  };

  const handleCancel = () => {
    console.log('[WaitlistItem] 取消候补', item.id);
    Taro.showModal({
      title: '取消候补',
      content: '确定要取消该候补记录吗？',
      success: (res) => {
        if (res.confirm) {
          cancelWaitlist(item.id);
          Taro.showToast({
            title: '已取消',
            icon: 'success'
          });
        }
      }
    });
  };

  return (
    <View className={styles.item}>
      <View className={styles.positionBadge}>
        <Text className={styles.positionNum}>{item.position}</Text>
      </View>
      <View className={styles.header}>
        <Text className={styles.studioName}>{item.studioName}</Text>
        <Text className={classnames(styles.status, status.className)}>{status.label}</Text>
      </View>
      <View className={styles.info}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>日期</Text>
          <Text className={styles.infoValue}>{item.date}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>时段</Text>
          <Text className={styles.infoValue}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>登记</Text>
          <Text className={styles.infoValue}>{item.createdAt}</Text>
        </View>
      </View>
      <View className={styles.footer}>
        {item.status === 'notified' && item.expiresAt && (
          <Text className={styles.notice}>请于 {item.expiresAt} 前确认，超时将自动释放</Text>
        )}
        {item.status === 'waiting' && <Text className={styles.notice}>有空档时将第一时间通知您</Text>}
        <View className={styles.actions}>
          {item.status === 'notified' && (
            <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handleConfirm}>
              确认补位
            </Button>
          )}
          {(item.status === 'waiting' || item.status === 'notified') && (
            <Button className={classnames(styles.btn, styles.btnOutline)} onClick={handleCancel}>
              取消候补
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default WaitlistItem;
