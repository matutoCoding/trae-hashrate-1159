import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import { useStudioStore } from '@/store/studioStore';
import { useBookingStore } from '@/store/bookingStore';
import StudioCard from '@/components/StudioCard';
import styles from './index.module.scss';

type FilterType = 'all' | 'available' | 'busy' | 'maintenance';

const filters: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: '全部影棚' },
  { key: 'available', label: '可预约' },
  { key: 'busy', label: '使用中' },
  { key: 'maintenance', label: '维护中' }
];

const StudioPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const { filterStatus, setFilterStatus, getFilteredStudios, studios } = useStudioStore();
  const { processTimeoutBookings, processExpiredWaitlistNotifications } = useBookingStore();

  useDidShow(() => {
    console.log('[StudioPage] 页面显示');
    processTimeoutBookings();
    processExpiredWaitlistNotifications();
  });

  usePullDownRefresh(() => {
    console.log('[StudioPage] 下拉刷新');
    processTimeoutBookings();
    processExpiredWaitlistNotifications();
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }, 800);
  });

  const filteredStudios = useMemo(() => {
    let list = getFilteredStudios();
    if (searchText.trim()) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(searchText.toLowerCase()) ||
          s.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    console.log('[StudioPage] 筛选结果', { filterStatus, searchText, count: list.length });
    return list;
  }, [filterStatus, searchText, getFilteredStudios]);

  const handleFilterChange = (key: FilterType) => {
    setFilterStatus(key);
  };

  const handleRateInfo = () => {
    Taro.navigateTo({
      url: '/pages/rate-info/index'
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>共享摄影棚</Text>
        <Text className={styles.subtitle}>专业影棚，随时预约，超时自动释放</Text>
        <View className={styles.searchBar}>
          <View className={styles.searchIcon}>🔍</View>
          <Input
            className={styles.searchInput}
            placeholder='搜索影棚名称或描述'
            placeholderClass={styles.searchInput}
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.filterBar}>
        <ScrollView className={styles.filterScroll} scrollX enhanced showScrollbar={false}>
          <View className={styles.filterList}>
            {filters.map((f) => (
              <View
                key={f.key}
                className={classnames(
                  styles.filterItem,
                  filterStatus === f.key && styles.filterActive
                )}
                onClick={() => handleFilterChange(f.key)}
              >
                {f.label}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className={styles.rateLegend} onClick={handleRateInfo}>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: '#FF7D00' }} />
          <Text className={styles.legendText}>高峰时段</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: '#2D5BFF' }} />
          <Text className={styles.legendText}>平峰时段</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: '#00B42A' }} />
          <Text className={styles.legendText}>特惠时段</Text>
        </View>
        <Text className={styles.legendText} style={{ color: '#2D5BFF' }}>
          查看费率 →
        </Text>
      </View>

      <View className={styles.list}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>影棚列表</Text>
          <Text className={styles.countBadge}>
            共 {filteredStudios.length} / {studios.length} 个
          </Text>
        </View>

        {filteredStudios.length > 0 ? (
          filteredStudios.map((studio) => <StudioCard key={studio.id} studio={studio} />)
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📷</Text>
            <Text className={styles.emptyText}>暂无符合条件的影棚</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default StudioPage;
