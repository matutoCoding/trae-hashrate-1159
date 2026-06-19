import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Booking, BookingStatus } from '@/types';
import styles from './index.module.scss';

interface OrderCardProps {
  booking: Booking;
}

const statusMap: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: '待确认', className: styles.pending },
  confirmed: { label: '已确认', className: styles.confirmed },
  completed: { label: '已完成', className: styles.completed },
  cancelled: { label: '已取消', className: styles.cancelled },
  no_show: { label: '超时未到', className: styles.no_show },
  released: { label: '已释放', className: styles.released }
};

const OrderCard: React.FC<OrderCardProps> = ({ booking }) => {
  const status = statusMap[booking.status];

  const handleViewDetail = () => {
    console.log('[OrderCard] 查看订单详情', booking.id);
    Taro.navigateTo({
      url: `/pages/bill-detail/index?bookingId=${booking.id}`
    });
  };

  const handlePay = () => {
    console.log('[OrderCard] 去支付', booking.id);
    Taro.showToast({
      title: '支付功能开发中',
      icon: 'none'
    });
  };

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.studioName}>{booking.studioName}</Text>
        <Text className={classnames(styles.status, status.className)}>{status.label}</Text>
      </View>
      <View className={styles.content}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>日期</Text>
          <Text className={styles.infoValue}>{booking.date}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>时段</Text>
          <Text className={styles.infoValue}>
            {booking.startTime} - {booking.endTime}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>分段</Text>
          <Text className={styles.infoValue}>{booking.segments.length} 个时段计费</Text>
        </View>
      </View>
      <View className={styles.footer}>
        <View className={styles.total}>
          <Text className={styles.totalLabel}>合计</Text>
          <Text className={styles.totalAmount}>¥{booking.totalAmount.toFixed(2)}</Text>
          <Text className={styles.hours}>({booking.totalHours}小时)</Text>
        </View>
        <View className={styles.actions}>
          {(booking.status === 'confirmed' || booking.status === 'completed') && (
            <Button className={classnames(styles.btn, styles.btnOutline)} onClick={handleViewDetail}>
              详情
            </Button>
          )}
          {booking.status === 'pending' && (
            <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handlePay}>
              去支付
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderCard;
