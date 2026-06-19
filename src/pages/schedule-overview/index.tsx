import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useStudioStore } from '@/store/studioStore';
import { useBookingStore } from '@/store/bookingStore';
import { generateWeekDates, getSchedulesByDate } from '@/data/schedules';
import { calculatePricing, getRateLabel } from '@/utils/pricing';
import { Studio, TimeSlot, SlotStatus, Booking } from '@/types';
import styles from './index.module.scss';

const statusFilters: Array<{ key: SlotStatus | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'available', label: '可预约' },
  { key: 'booked', label: '已预约' },
  { key: 'notified', label: '待补位' },
  { key: 'waitlist', label: '候补中' }
];

const statusTextMap: Record<SlotStatus, string> = {
  available: '可预约',
  booked: '已预约',
  notified: '待补位确认',
  waitlist: '候补中',
  maintenance: '维护中',
  expired: '已过期'
};

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

const ScheduleOverviewPage: React.FC = () => {
  const { studios, getStudioById } = useStudioStore();
  const {
    bookings,
    waitlist,
    selectedDate,
    setSelectedDate,
    processTimeoutBookings,
    processExpiredWaitlistNotifications,
    recalcWaitlistPositions
  } = useBookingStore();

  const [selectedStudioId, setSelectedStudioId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<SlotStatus | 'all'>('all');
  const [detailSlot, setDetailSlot] = useState<{
    slot: TimeSlot;
    studio: Studio;
    bookingInfo?: Booking;
    currentPricing?: ReturnType<typeof calculatePricing>;
    waitlistCount: number;
    waitlistItems: typeof waitlist;
  } | null>(null);

  const weekDates = useMemo(() => generateWeekDates(), []);

  useDidShow(() => {
    console.log('[ScheduleOverview] 页面显示', selectedDate);
    processTimeoutBookings();
    processExpiredWaitlistNotifications();
    recalcWaitlistPositions();
  });

  usePullDownRefresh(() => {
    processTimeoutBookings();
    processExpiredWaitlistNotifications();
    recalcWaitlistPositions();
    setTimeout(() => Taro.stopPullDownRefresh(), 600);
  });

  const allSlots = useMemo(() => {
    return getSchedulesByDate(selectedDate);
  }, [selectedDate]);

  const enrichedSlots = useMemo(() => {
    return allSlots.map((slot) => {
      const activeBooking = bookings.find(
        (b) =>
          b.studioId === slot.studioId &&
          b.date === slot.date &&
          b.startTime <= slot.startTime &&
          b.endTime > slot.startTime &&
          (b.status === 'confirmed' || b.status === 'pending')
      );

      if (activeBooking) {
        return { ...slot, status: 'booked' as const, bookingId: activeBooking.id };
      }

      const notifiedWaitlist = waitlist.find(
        (w) =>
          w.studioId === slot.studioId &&
          w.date === slot.date &&
          w.startTime <= slot.startTime &&
          w.endTime > slot.startTime &&
          w.status === 'notified'
      );

      if (notifiedWaitlist) {
        return { ...slot, status: 'notified' as const };
      }

      const hasWaiting = waitlist.some(
        (w) =>
          w.studioId === slot.studioId &&
          w.date === slot.date &&
          w.startTime <= slot.startTime &&
          w.endTime > slot.startTime &&
          w.status === 'waiting'
      );

      if (hasWaiting) {
        return { ...slot, status: 'waitlist' as const };
      }

      return slot;
    });
  }, [allSlots, bookings, waitlist]);

  const studioStats = useMemo(() => {
    return studios.map((studio) => {
      const studioSlots = enrichedSlots.filter((s) => s.studioId === studio.id);
      const available = studioSlots.filter((s) => s.status === 'available').length;
      const booked = studioSlots.filter((s) => s.status === 'booked').length;
      const waitlistCount = studioSlots.filter((s) => s.status === 'waitlist' || s.status === 'notified').length;

      const activeBookings = bookings.filter(
        (b) =>
          b.studioId === studio.id &&
          b.date === selectedDate &&
          (b.status === 'confirmed' || b.status === 'pending')
      );
      const revenue = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);

      return {
        studio,
        slots: studioSlots,
        available,
        booked,
        waitlistCount,
        revenue,
        activeBookings
      };
    });
  }, [studios, enrichedSlots, bookings, selectedDate]);

  const totalStats = useMemo(() => {
    const totalAvailable = studioStats.reduce((s, x) => s + x.available, 0);
    const totalBooked = studioStats.reduce((s, x) => s + x.booked, 0);
    const totalRevenue = studioStats.reduce((s, x) => s + x.revenue, 0);
    const totalWaitlist = waitlist.filter(
      (w) => w.date === selectedDate && (w.status === 'waiting' || w.status === 'notified')
    ).length;
    return { totalAvailable, totalBooked, totalRevenue, totalWaitlist };
  }, [studioStats, waitlist, selectedDate]);

  const filteredStudios = useMemo(() => {
    if (selectedStudioId === 'all') return studioStats;
    return studioStats.filter((s) => s.studio.id === selectedStudioId);
  }, [studioStats, selectedStudioId]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  const handleStudioPick = () => {
    const items = ['全部影棚', ...studios.map((s) => s.name)];
    Taro.showActionSheet({
      itemList: items,
      success: (res) => {
        if (res.tapIndex === 0) {
          setSelectedStudioId('all');
        } else {
          setSelectedStudioId(studios[res.tapIndex - 1].id);
        }
      },
      fail: (err) => console.error('[ScheduleOverview] 选择影棚失败', err)
    });
  };

  const handleSlotClick = useCallback((slot: TimeSlot) => {
    const studio = getStudioById(slot.studioId);
    if (!studio) return;

    const bookingInfo = bookings.find(
      (b) =>
        b.studioId === slot.studioId &&
        b.date === slot.date &&
        b.startTime <= slot.startTime &&
        b.endTime > slot.startTime &&
        (b.status === 'confirmed' || b.status === 'pending')
    );

    const currentPricing = calculatePricing(slot.date, slot.startTime, slot.endTime);

    const slotWaitlist = waitlist
      .filter(
        (w) =>
          w.studioId === slot.studioId &&
          w.date === slot.date &&
          w.startTime <= slot.startTime &&
          w.endTime > slot.startTime &&
          (w.status === 'waiting' || w.status === 'notified')
      )
      .sort((a, b) => a.position - b.position);

    setDetailSlot({
      slot,
      studio,
      bookingInfo,
      currentPricing,
      waitlistCount: slotWaitlist.length,
      waitlistItems: slotWaitlist
    });
  }, [bookings, waitlist, getStudioById]);

  const handleCloseDetail = () => setDetailSlot(null);

  const slotFiltered = (slot: TimeSlot) => {
    if (statusFilter === 'all') return true;
    return slot.status === statusFilter;
  };

  const currentStudioName = selectedStudioId === 'all'
    ? '全部影棚'
    : getStudioById(selectedStudioId)?.name || '全部影棚';

  const formatShortDate = (dateStr: string) => {
    const d = dayjs(dateStr);
    return `${d.format('MM/DD')}`;
  };

  return (
    <View className={styles.page}>
      <View className={styles.dateBar}>
        <ScrollView scrollX enhanced showScrollbar={false} className={styles.dateScroll}>
          <View className={styles.dateList}>
            {weekDates.map((date) => {
              const isActive = date === selectedDate;
              const d = dayjs(date);
              const isToday = d.isSame(dayjs(), 'day');
              return (
                <View
                  key={date}
                  className={classnames(styles.dateItem, isActive && styles.dateActive)}
                  onClick={() => handleDateSelect(date)}
                >
                  <Text className={classnames(styles.dateWeekday, isActive && styles.dateActiveText)}>
                    周{weekdayLabels[d.day()]}
                  </Text>
                  <Text className={classnames(styles.dateNum, isActive && styles.dateActiveText)}>
                    {d.format('DD')}
                  </Text>
                  {isToday && (
                    <Text className={classnames(styles.dateTag, isActive && styles.dateActiveTag)}>今</Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View className={styles.filters}>
        <View className={styles.filterItem} onClick={handleStudioPick}>
          <View>
            <Text className={styles.filterLabel}>影棚</Text>
            <Text className={styles.filterValue}>{currentStudioName}</Text>
          </View>
          <Text className={styles.filterArrow}>▼</Text>
        </View>
      </View>

      <View className={styles.statusFilter}>
        {statusFilters.map((f) => (
          <View
            key={f.key}
            className={classnames(styles.statusChip, statusFilter === f.key && styles.statusChipActive)}
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label}
          </View>
        ))}
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{totalStats.totalBooked}</Text>
          <Text className={styles.statLabel}>已预约</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{totalStats.totalAvailable}</Text>
          <Text className={styles.statLabel}>可预约</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{totalStats.totalWaitlist}</Text>
          <Text className={styles.statLabel}>候补中</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNum, styles.statRevenue)}>
            ¥{totalStats.totalRevenue.toFixed(0)}
          </Text>
          <Text className={styles.statLabel}>预计收入</Text>
        </View>
      </View>

      <ScrollView scrollY enhanced showScrollbar={false} className={styles.timeline}>
        {filteredStudios.length > 0 ? (
          filteredStudios.map(({ studio, slots, available, booked, revenue }) => (
            <View key={studio.id} className={styles.studioSection}>
              <View className={styles.studioHeader}>
                <Text className={styles.studioName}>{studio.name}</Text>
                <View style={{ display: 'flex', gap: '16rpx', alignItems: 'center' }}>
                  <Text style={{ fontSize: '24rpx', color: '#86909C' }}>
                    已约{booked} / 可约{available}
                  </Text>
                  <Text style={{ fontSize: '24rpx', color: '#FF7D00', fontWeight: 600 }}>
                    ¥{revenue.toFixed(0)}
                  </Text>
                </View>
              </View>
              <View className={styles.slotsGrid}>
                {slots.filter(slotFiltered).map((slot) => (
                  <View
                    key={slot.id}
                    className={classnames(
                      styles.slotCell,
                      slot.status === 'available' && styles.slotAvailable,
                      slot.status === 'booked' && styles.slotBooked,
                      slot.status === 'notified' && styles.slotNotified,
                      slot.status === 'waitlist' && styles.slotWaitlist,
                      slot.status === 'maintenance' && styles.slotMaintenance,
                      slot.status === 'expired' && styles.slotExpired
                    )}
                    onClick={() => handleSlotClick(slot)}
                  >
                    <Text className={styles.slotTime}>{slot.startTime}</Text>
                    <Text className={styles.slotPrice}>¥{slot.price}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📅</Text>
            <Text className={styles.emptyText}>暂无排期数据</Text>
          </View>
        )}

        <View className={styles.legend}>
          <Text className={styles.legendTitle}>状态说明</Text>
          <View className={styles.legendList}>
            <View className={styles.legendItem}>
              <View className={classnames(styles.legendDot, styles.slotAvailable)}></View>
              <Text className={styles.legendText}>可预约</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classnames(styles.legendDot, styles.slotBooked)}></View>
              <Text className={styles.legendText}>已预约</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classnames(styles.legendDot, styles.slotNotified)}></View>
              <Text className={styles.legendText}>待补位</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={classnames(styles.legendDot, styles.slotWaitlist)}></View>
              <Text className={styles.legendText}>候补中</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {detailSlot && (
        <View className={styles.modalMask} onClick={handleCloseDetail}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>时段详情</Text>
              <Text className={styles.modalClose} onClick={handleCloseDetail}>✕</Text>
            </View>
            <ScrollView scrollY enhanced showScrollbar={false} className={styles.modalBody}>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>影棚</Text>
                <Text className={styles.detailValue}>{detailSlot.studio.name}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>日期</Text>
                <Text className={styles.detailValue}>{detailSlot.slot.date}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>时段</Text>
                <Text className={styles.detailValue}>
                  {detailSlot.slot.startTime} - {detailSlot.slot.endTime}
                </Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>状态</Text>
                <Text className={styles.detailValue}>{statusTextMap[detailSlot.slot.status]}</Text>
              </View>

              {detailSlot.currentPricing && (
                <>
                  <Text className={styles.sectionSubtitle}>
                    {detailSlot.slot.status === 'available' ? '当前费率预估' : '当前费率参考'}
                  </Text>
                  <View className={styles.pricingCard}>
                    {detailSlot.currentPricing.segments.map((seg, idx) => (
                      <View key={idx} className={styles.pricingRow}>
                        <Text className={styles.pricingTime}>
                          {seg.startTime}-{seg.endTime}
                        </Text>
                        <Text className={classnames(styles.pricingTag, styles[seg.rateType])}>
                          {getRateLabel(seg.rateType)}
                        </Text>
                        <Text className={styles.pricingCalc}>
                          {seg.hours}h × ¥{seg.pricePerHour}
                        </Text>
                        <Text className={styles.pricingAmount}>¥{seg.subtotal.toFixed(2)}</Text>
                      </View>
                    ))}
                    <View className={styles.pricingTotal}>
                      <Text className={styles.pricingTotalLabel}>
                        当前费率预估
                      </Text>
                      <Text className={styles.pricingTotalValue}>
                        ¥{detailSlot.currentPricing.totalAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {detailSlot.bookingInfo && (
                <>
                  <Text className={styles.sectionSubtitle}>预约信息</Text>
                  <View className={styles.bookingCard}>
                    <View className={styles.bookingHeader}>
                      <Text className={styles.bookingUser}>{detailSlot.bookingInfo.userName}</Text>
                      <Text className={styles.bookingStatus}>
                        {detailSlot.bookingInfo.status === 'confirmed' ? '已确认' : '待确认'}
                      </Text>
                    </View>
                    <View className={styles.bookingInfo}>
                      <Text>
                        订单号：{detailSlot.bookingInfo.id}{'\n'}
                        时长：{detailSlot.bookingInfo.totalHours}小时{'\n'}
                        下单金额：¥{detailSlot.bookingInfo.totalAmount.toFixed(2)}{'\n'}
                        下单时间：{detailSlot.bookingInfo.createdAt}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              <Text className={styles.sectionSubtitle}>
                候补队列 ({detailSlot.waitlistCount}人)
              </Text>
              {detailSlot.waitlistItems.length > 0 ? (
                detailSlot.waitlistItems.map((item) => (
                  <View key={item.id} className={styles.waitlistItem}>
                    <View className={styles.waitlistLeft}>
                      <View className={styles.waitlistPos}>{item.position}</View>
                      <View>
                        <Text className={styles.waitlistInfo}>{item.userName}</Text>
                      </View>
                    </View>
                    <Text className={styles.waitlistStatus}>
                      {item.status === 'notified' ? '待确认' : '排队中'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className={styles.emptyText}>暂无候补中用户</Text>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default ScheduleOverviewPage;
