import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useStudioStore } from '@/store/studioStore';
import { useBookingStore } from '@/store/bookingStore';
import { generateWeekDates } from '@/data/schedules';
import { calculatePricing } from '@/utils/pricing';
import { getWeekdayLabel, isToday } from '@/utils/time';
import { TimeSlot as TimeSlotType } from '@/types';
import TimeSlot from '@/components/TimeSlot';
import styles from './index.module.scss';

const SchedulePage: React.FC = () => {
  const weekDates = useMemo(() => generateWeekDates(), []);
  const { studios, getStudioById } = useStudioStore();
  const {
    selectedDate,
    selectedStudioId,
    selectedStartTime,
    selectedEndTime,
    schedules,
    setSelectedDate,
    setSelectedStudioId,
    setSelectedTimeRange,
    refreshSchedules,
    addWaitlist
  } = useBookingStore();

  const [showStudioPicker, setShowStudioPicker] = useState(false);

  useDidShow(() => {
    console.log('[SchedulePage] 页面显示');
    if (selectedStudioId) {
      refreshSchedules();
    }
  });

  usePullDownRefresh(() => {
    console.log('[SchedulePage] 下拉刷新');
    refreshSchedules();
    setTimeout(() => Taro.stopPullDownRefresh(), 600);
  });

  useEffect(() => {
    if (!selectedStudioId && studios.length > 0) {
      const available = studios.find((s) => s.status === 'available');
      if (available) {
        setSelectedStudioId(available.id);
      }
    }
  }, [studios, selectedStudioId, setSelectedStudioId]);

  const currentStudio = selectedStudioId ? getStudioById(selectedStudioId) : null;

  const pricing = useMemo(() => {
    if (selectedStartTime && selectedEndTime) {
      return calculatePricing(selectedDate, selectedStartTime, selectedEndTime);
    }
    return null;
  }, [selectedDate, selectedStartTime, selectedEndTime]);

  const handleStudioSelect = () => {
    const studioNames = studios.map((s) => `${s.name}(${s.status === 'available' ? '可约' : s.status === 'busy' ? '使用中' : '维护'})`);
    Taro.showActionSheet({
      itemList: studioNames,
      success: (res) => {
        const studio = studios[res.tapIndex];
        if (studio.status !== 'maintenance') {
          setSelectedStudioId(studio.id);
          setSelectedTimeRange(null, null);
        } else {
          Taro.showToast({ title: '该影棚维护中', icon: 'none' });
        }
      },
      fail: (err) => console.error('[SchedulePage] 选择影棚失败', err)
    });
  };

  const handleSlotClick = (slot: TimeSlotType) => {
    if (slot.status === 'booked') {
      Taro.showModal({
        title: '该时段已被预约',
        content: '是否加入候补队列？有空闲时段将第一时间通知您。',
        confirmText: '加入候补',
        success: (res) => {
          if (res.confirm && currentStudio) {
            addWaitlist({
              studioId: currentStudio.id,
              studioName: currentStudio.name,
              userId: 'user-001',
              userName: '张先生',
              date: selectedDate,
              startTime: slot.startTime,
              endTime: slot.endTime
            });
            Taro.showToast({ title: '已加入候补', icon: 'success' });
          }
        }
      });
      return;
    }

    if (slot.status !== 'available') return;

    if (!selectedStartTime) {
      setSelectedTimeRange(slot.startTime, slot.endTime);
    } else {
      const startMin = parseInt(selectedStartTime.split(':')[0]) * 60 + parseInt(selectedStartTime.split(':')[1]);
      const endMin = parseInt(selectedEndTime!.split(':')[0]) * 60 + parseInt(selectedEndTime!.split(':')[1]);
      const slotMin = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);

      if (slotMin === endMin) {
        setSelectedTimeRange(selectedStartTime, slot.endTime);
      } else if (slotMin === startMin - 60) {
        setSelectedTimeRange(slot.startTime, selectedEndTime);
      } else {
        setSelectedTimeRange(slot.startTime, slot.endTime);
      }
    }
  };

  const handleBooking = () => {
    if (!selectedStartTime || !selectedEndTime || !currentStudio) {
      Taro.showToast({ title: '请选择时段', icon: 'none' });
      return;
    }

    console.log('[SchedulePage] 提交预约', {
      studio: currentStudio.id,
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime
    });

    Taro.navigateTo({
      url: `/pages/booking-confirm/index?studioId=${currentStudio.id}&date=${selectedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}`
    });
  };

  const isSlotSelected = (slot: TimeSlotType) => {
    if (!selectedStartTime || !selectedEndTime) return false;
    const startMin = parseInt(selectedStartTime.split(':')[0]) * 60;
    const endMin = parseInt(selectedEndTime.split(':')[0]) * 60;
    const slotMin = parseInt(slot.startTime.split(':')[0]) * 60;
    return slotMin >= startMin && slotMin < endMin;
  };

  if (!currentStudio) {
    return (
      <View className={styles.page}>
        <View className={styles.noStudio}>
          <Text className={styles.noStudioText}>请先选择一个影棚</Text>
          <Button className={styles.noStudioBtn} onClick={handleStudioSelect}>
            选择影棚
          </Button>
        </View>
      </View>
    );
  }

  const hasBookedSlots = schedules.some((s) => s.status === 'booked');

  return (
    <View className={styles.page}>
      <View className={styles.studioPicker} onClick={handleStudioSelect}>
        <Text className={styles.pickerLabel}>当前影棚</Text>
        <View className={styles.pickerValue}>
          <Text>{currentStudio.name}</Text>
          <Text className={styles.pickerArrow}>▼</Text>
        </View>
      </View>

      <View className={styles.calendar}>
        <ScrollView className={styles.calendarScroll} scrollX enhanced showScrollbar={false}>
          <View className={styles.calendarList}>
            {weekDates.map((dateStr) => {
              const date = dayjs(dateStr);
              const weekday = getWeekdayLabel(date.day());
              const dayNum = date.date();
              const active = dateStr === selectedDate;
              const today = isToday(date);

              return (
                <View
                  key={dateStr}
                  className={classnames(styles.dayItem, active && styles.dayActive)}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setSelectedTimeRange(null, null);
                  }}
                >
                  <Text className={styles.weekday}>{weekday}</Text>
                  <Text className={styles.daynum}>{dayNum}</Text>
                  {today && <Text className={styles.todayTag}>今天</Text>}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {hasBookedSlots && (
        <View className={styles.waitlistHint}>
          <Text className={styles.waitlistHintText}>
            满档时段可加入候补，超时未到自动释放后第一时间通知补位
          </Text>
          <Button
            className={styles.waitlistBtn}
            onClick={() =>
              Taro.navigateTo({ url: '/pages/waitlist/index' })
            }
          >
            候补队列
          </Button>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            {dayjs(selectedDate).format('YYYY年MM月DD日')} 时段
          </Text>
          <Text className={styles.tips}>点击选择连续时段</Text>
        </View>
        <View className={styles.slotGrid}>
          {schedules.map((slot) => (
            <View className={styles.slotCol} key={slot.id}>
              <TimeSlot slot={slot} selected={isSlotSelected(slot)} onClick={handleSlotClick} />
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.summary}>
          {pricing ? (
            <>
              <Text className={styles.summaryTime}>
                {selectedStartTime} - {selectedEndTime}
              </Text>
              <View className={styles.summaryInfo}>
                <Text className={styles.summaryPrice}>¥{pricing.totalAmount.toFixed(2)}</Text>
                <Text className={styles.summaryHours}>
                  共 {pricing.totalHours} 小时，{pricing.segments.length} 个时段
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text className={styles.summaryTime}>请选择预约时段</Text>
              <View className={styles.summaryInfo}>
                <Text className={styles.summaryPrice}>¥0.00</Text>
              </View>
            </>
          )}
        </View>
        <Button
          className={classnames(styles.bookBtn, !pricing && styles.bookBtnDisabled)}
          disabled={!pricing}
          onClick={handleBooking}
        >
          确认预约
        </Button>
      </View>
    </View>
  );
};

export default SchedulePage;
