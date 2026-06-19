import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useStudioStore } from '@/store/studioStore';
import { useBookingStore } from '@/store/bookingStore';
import { calculatePricing, getRateLabel } from '@/utils/pricing';
import styles from './index.module.scss';

const BookingConfirmPage: React.FC = () => {
  const router = useRouter();
  const { studioId, date, startTime, endTime } = router.params;
  const { getStudioById } = useStudioStore();
  const { addWaitlist, addBooking } = useBookingStore();
  const [joinWaitlist, setJoinWaitlist] = useState(false);

  const studio = studioId ? getStudioById(studioId) : null;

  const pricing = useMemo(() => {
    if (date && startTime && endTime) {
      return calculatePricing(date, startTime, endTime);
    }
    return null;
  }, [date, startTime, endTime]);

  const handleSubmit = () => {
    if (!studio || !pricing) return;

    console.log('[BookingConfirmPage] 提交预约', {
      studioId,
      date,
      startTime,
      endTime,
      joinWaitlist,
      pricing
    });

    Taro.showLoading({ title: '提交中...' });

    setTimeout(() => {
      Taro.hideLoading();

      const newBooking = addBooking({
        studioId: studio.id,
        studioName: studio.name,
        userId: 'user-001',
        userName: '张先生',
        date: date!,
        startTime: startTime!,
        endTime: endTime!,
        totalHours: pricing.totalHours,
        segments: pricing.segments,
        totalAmount: pricing.totalAmount,
        status: 'confirmed'
      });

      if (joinWaitlist) {
        addWaitlist({
          studioId: studio.id,
          studioName: studio.name,
          userId: 'user-001',
          userName: '张先生',
          date: date!,
          startTime: startTime!,
          endTime: endTime!
        });
      }

      console.log('[BookingConfirmPage] 预约已持久化', newBooking);

      Taro.showModal({
        title: '预约成功',
        content: `已预约${studio.name}\n${date} ${startTime}-${endTime}\n合计 ¥${pricing.totalAmount.toFixed(2)}`,
        showCancel: false,
        confirmText: '查看订单',
        success: () => {
          Taro.switchTab({ url: '/pages/orders/index' });
        }
      });
    }, 800);
  };

  if (!studio || !pricing) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '200rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#86909C', fontSize: '28rpx' }}>预约信息不完整</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>预约信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>影棚</Text>
          <Text className={styles.infoValue}>{studio.name}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>日期</Text>
          <Text className={styles.infoValue}>{date}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>时段</Text>
          <Text className={styles.infoValue}>
            {startTime} - {endTime} ({pricing.totalHours}小时)
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>地址</Text>
          <Text className={styles.infoValue}>{studio.address}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>分段计费明细</Text>
        <View className={styles.segmentList}>
          {pricing.segments.map((seg, idx) => (
            <View className={styles.segmentItem} key={idx}>
              <Text className={styles.segmentTime}>
                {seg.startTime}-{seg.endTime}
              </Text>
              <Text className={classnames(styles.segmentTag, styles[seg.rateType])}>
                {getRateLabel(seg.rateType)}
              </Text>
              <Text className={styles.segmentRate}>
                {seg.hours}小时 × ¥{seg.pricePerHour}/时
              </Text>
              <Text className={styles.segmentSubtotal}>¥{seg.subtotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>
        <View className={styles.summary}>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>分段数量</Text>
            <Text className={styles.summaryValue}>{pricing.segments.length} 段</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>总时长</Text>
            <Text className={styles.summaryValue}>{pricing.totalHours} 小时</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>合计金额</Text>
            <Text className={styles.summaryTotal}>¥{pricing.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>候补设置</Text>
        <View className={styles.waitlistOption}>
          <View className={styles.waitlistInfo}>
            <Text className={styles.waitlistLabel}>预约满档时加入候补</Text>
            <Text className={styles.waitlistDesc}>
              超时30分钟未到自动释放，系统按顺序通知补位
            </Text>
          </View>
          <View
            className={classnames(styles.switch, joinWaitlist && styles.switchActive)}
            onClick={() => setJoinWaitlist(!joinWaitlist)}
          >
            <View
              className={classnames(
                styles.switchDot,
                joinWaitlist && styles.switchActiveDot
              )}
            />
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.notice}>
          <Text className={styles.noticeTitle}>⚠️ 预约须知</Text>
          <Text className={styles.noticeText}>
            1. 请在预约开始后30分钟内到场，超时未到将自动释放资源并记入候补队列{'\n'}
            2. 跨费率时段按分段计费，高峰/平峰/特惠时段分别计算{'\n'}
            3. 如需取消请提前2小时，临时取消可能影响信用
          </Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.priceLabel}>应付</Text>
          <Text className={styles.priceValue}>¥{pricing.totalAmount.toFixed(2)}</Text>
        </View>
        <Button className={styles.confirmBtn} onClick={handleSubmit}>
          确认预约
        </Button>
      </View>
    </View>
  );
};

export default BookingConfirmPage;
