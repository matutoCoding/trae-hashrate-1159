import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import { useBookingStore } from '@/store/bookingStore';
import { WaitlistStatus } from '@/types';
import WaitlistItem from '@/components/WaitlistItem';
import styles from './index.module.scss';

type TabType = 'all' | WaitlistStatus;

const tabs: Array<{ key: TabType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'waiting', label: '排队中' },
  { key: 'notified', label: '待确认' }
];

const WaitlistPage: React.FC = () => {
  const { waitlist, refreshWaitlist } = useBookingStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useDidShow(() => {
    console.log('[WaitlistPage] 页面显示');
    refreshWaitlist();
  });

  usePullDownRefresh(() => {
    console.log('[WaitlistPage] 下拉刷新');
    refreshWaitlist();
    setTimeout(() => Taro.stopPullDownRefresh(), 600);
  });

  const stats = useMemo(() => {
    const waiting = waitlist.filter((w) => w.status === 'waiting').length;
    const notified = waitlist.filter((w) => w.status === 'notified').length;
    return { waiting, notified };
  }, [waitlist]);

  const filteredList = useMemo(() => {
    let list = [...waitlist];
    if (activeTab !== 'all') {
      list = list.filter((w) => w.status === activeTab);
    }
    list.sort((a, b) => {
      const order: WaitlistStatus[] = ['notified', 'waiting', 'confirmed', 'expired', 'cancelled'];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
    console.log('[WaitlistPage] 筛选结果', { activeTab, count: list.length });
    return list;
  }, [waitlist, activeTab]);

  const handleGoSchedule = () => {
    Taro.switchTab({
      url: '/pages/schedule/index'
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.stats}>
        <Text className={styles.statsTitle}>候补统计</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statsItem}>
            <Text className={styles.statsNum}>{stats.waiting}</Text>
            <Text className={styles.statsLabel}>排队中</Text>
          </View>
          <View className={styles.statsDivider} />
          <View className={styles.statsItem}>
            <Text className={styles.statsNum}>{stats.notified}</Text>
            <Text className={styles.statsLabel}>待补位确认</Text>
          </View>
        </View>
      </View>

      <View className={styles.notice}>
        <Text className={styles.noticeIcon}>💡</Text>
        <Text className={styles.noticeText}>
          影棚预约用户超时30分钟未到将自动释放资源，系统将按候补顺序推送补位通知，请在15分钟内确认，超时自动跳过。
        </Text>
      </View>

      <View className={styles.tabs}>
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
      </View>

      <View className={styles.listSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>候补记录</Text>
          <Text style={{ fontSize: '24rpx', color: '#86909C' }}>
            共 {filteredList.length} 条
          </Text>
        </View>

        {filteredList.length > 0 ? (
          filteredList.map((item) => <WaitlistItem key={item.id} item={item} />)
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>⏳</Text>
            <Text className={styles.emptyText}>暂无候补记录</Text>
            <Button className={styles.emptyBtn} onClick={handleGoSchedule}>
              去预约排期
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

export default WaitlistPage;
