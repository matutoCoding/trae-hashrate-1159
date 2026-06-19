import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import { useBookingStore } from '@/store/bookingStore';
import { BookingStatus } from '@/types';
import OrderCard from '@/components/OrderCard';
import styles from './index.module.scss';

type TabType = 'all' | BookingStatus;

const tabs: Array<{ key: TabType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' }
];

const OrdersPage: React.FC = () => {
  const { bookings, refreshBookings } = useBookingStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useDidShow(() => {
    console.log('[OrdersPage] 页面显示');
    refreshBookings();
  });

  usePullDownRefresh(() => {
    console.log('[OrdersPage] 下拉刷新');
    refreshBookings();
    setTimeout(() => Taro.stopPullDownRefresh(), 600);
  });

  const stats = useMemo(() => {
    const totalAmount = bookings
      .filter((b) => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    const totalCount = bookings.length;
    return { totalAmount, totalCount };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (activeTab !== 'all') {
      list = list.filter((b) => b.status === activeTab);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log('[OrdersPage] 筛选结果', { activeTab, count: list.length });
    return list;
  }, [bookings, activeTab]);

  const handleGoSchedule = () => {
    Taro.switchTab({
      url: '/pages/schedule/index'
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.summary}>
        <Text className={styles.summaryTitle}>累计消费</Text>
        <View>
          <Text className={styles.summaryAmount}>¥{stats.totalAmount.toFixed(2)}</Text>
        </View>
        <Text className={styles.summaryDesc}>共 {stats.totalCount} 笔订单，按时段分段计费</Text>
      </View>

      <View className={styles.tabs}>
        <ScrollView className={styles.tabScroll} scrollX enhanced showScrollbar={false}>
          <View className={styles.tabList}>
            {tabs.map((tab) => (
              <View
                key={tab.key}
                className={classnames(
                  styles.tabItem,
                  activeTab === tab.key && styles.tabActive
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className={styles.listSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>订单列表</Text>
          <Text className={styles.sectionCount}>共 {filteredBookings.length} 条</Text>
        </View>

        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => <OrderCard key={booking.id} booking={booking} />)
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无相关订单</Text>
            <Button className={styles.emptyBtn} onClick={handleGoSchedule}>
              去预约影棚
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

export default OrdersPage;
