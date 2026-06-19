import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useBookingStore } from '@/store/bookingStore';
import { calculatePricing, getRateLabel } from '@/utils/pricing';
import { BookingStatus, BookingSegment } from '@/types';
import styles from './index.module.scss';

const statusConfig: Record<BookingStatus, { icon: string; text: string; desc: string }> = {
  pending: { icon: '⏳', text: '待支付', desc: '请尽快完成支付确认预约' },
  confirmed: { icon: '✅', text: '预约成功', desc: '请按时到达影棚，超时30分钟自动释放' },
  completed: { icon: '🎉', text: '已完成', desc: '感谢使用，期待您的下次光临' },
  cancelled: { icon: '❌', text: '已取消', desc: '该预约已被取消' },
  no_show: { icon: '⚠️', text: '超时未到', desc: '已超时自动释放资源，费用不退' },
  released: { icon: '🔄', text: '已释放', desc: '资源已释放，候补用户已通知补位' }
};

interface SegmentComparison {
  timeRange: string;
  original: BookingSegment | null;
  current: BookingSegment | null;
  priceDiff: number;
}

const BillDetailPage: React.FC = () => {
  const router = useRouter();
  const bookingId = router.params.bookingId;
  const { getBookingById, processTimeoutBookings, processExpiredWaitlistNotifications } = useBookingStore();

  useDidShow(() => {
    processTimeoutBookings();
    processExpiredWaitlistNotifications();
  });

  const booking = useMemo(() => {
    if (!bookingId) return null;
    return getBookingById(bookingId);
  }, [bookingId, getBookingById]);

  const currentPricing = useMemo(() => {
    if (!booking) return null;
    return calculatePricing(booking.date, booking.startTime, booking.endTime);
  }, [booking]);

  const hasRateDiff = useMemo(() => {
    if (!booking || !currentPricing) return false;
    return Math.abs(currentPricing.totalAmount - booking.totalAmount) >= 0.01;
  }, [booking, currentPricing]);

  const segmentComparisons = useMemo(() => {
    if (!booking || !currentPricing) return [];

    const comparisons: SegmentComparison[] = [];
    const origSegs = booking.segments;
    const curSegs = currentPricing.segments;

    const allTimes = new Set<string>();
    origSegs.forEach((s) => allTimes.add(`${s.startTime}-${s.endTime}`));
    curSegs.forEach((s) => allTimes.add(`${s.startTime}-${s.endTime}`));

    const sortedTimes = Array.from(allTimes).sort();

    sortedTimes.forEach((timeRange) => {
      const origSeg = origSegs.find((s) => `${s.startTime}-${s.endTime}` === timeRange) || null;
      const curSeg = curSegs.find((s) => `${s.startTime}-${s.endTime}` === timeRange) || null;

      const origSubtotal = origSeg ? origSeg.subtotal : 0;
      const curSubtotal = curSeg ? curSeg.subtotal : 0;

      comparisons.push({
        timeRange,
        original: origSeg,
        current: curSeg,
        priceDiff: curSubtotal - origSubtotal
      });
    });

    return comparisons;
  }, [booking, currentPricing]);

  if (!booking) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '200rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#86909C', fontSize: '28rpx' }}>账单不存在</Text>
        </View>
      </View>
    );
  }

  const status = statusConfig[booking.status];

  const handlePay = () => {
    console.log('[BillDetailPage] 去支付', booking.id);
    Taro.showToast({ title: '支付功能开发中', icon: 'none' });
  };

  const handleContact = () => {
    Taro.showToast({ title: '联系客服功能开发中', icon: 'none' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.statusRow}>
          <Text className={styles.statusIcon}>{status.icon}</Text>
          <Text className={styles.statusText}>{status.text}</Text>
        </View>
        <Text className={styles.statusDesc}>{status.desc}</Text>
        <View className={styles.amountRow}>
          <Text className={styles.amountLabel}>账单金额</Text>
          <Text className={styles.amountValue}>¥{booking.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>预约信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>影棚</Text>
          <Text className={styles.infoValue}>{booking.studioName}</Text>
        </View>
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
          <Text className={styles.infoLabel}>时长</Text>
          <Text className={styles.infoValue}>{booking.totalHours} 小时</Text>
        </View>
        {booking.checkInTime && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>签到时间</Text>
            <Text className={styles.infoValue}>{booking.checkInTime}</Text>
          </View>
        )}
        {booking.releaseTime && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>释放时间</Text>
            <Text className={styles.infoValue}>{booking.releaseTime}</Text>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>分段计费明细</Text>
          <Text className={styles.priceNote}>按下单时费率</Text>
        </View>

        {hasRateDiff && (
          <View className={styles.rateDiffBanner}>
            <Text className={styles.rateDiffIcon}>💡</Text>
            <Text className={styles.rateDiffText}>
              费率已调整，下方逐段对照下单价格与当前费率
            </Text>
          </View>
        )}

        <View className={styles.segmentHeader}>
          <Text className={classnames(styles.segmentCol, styles.segTimeCol)}>时段</Text>
          <Text className={classnames(styles.segmentCol, styles.segRateCol)}>费率</Text>
          <Text className={classnames(styles.segmentCol, styles.segAmountCol)}>金额</Text>
        </View>

        {segmentComparisons.map((comp, idx) => {
          const seg = comp.original || comp.current;
          if (!seg) return null;

          return (
            <View key={idx} className={styles.segmentItem}>
              <Text className={styles.segmentTimeValue}>{comp.timeRange}</Text>
              <View className={styles.segRateArea}>
                <Text className={classnames(styles.segmentTag, styles[seg.rateType])}>
                  {getRateLabel(seg.rateType)}
                </Text>
                {comp.original && (
                  <Text className={styles.segOrigCalc}>
                    {comp.original.hours}h × ¥{comp.original.pricePerHour}
                  </Text>
                )}
              </View>
              <View className={styles.segAmountArea}>
                {comp.original && (
                  <Text className={styles.segmentAmountValue}>
                    ¥{comp.original.subtotal.toFixed(2)}
                  </Text>
                )}
                {comp.current && comp.priceDiff !== 0 && (
                  <Text
                    className={classnames(
                      styles.segCurAmount,
                      comp.priceDiff > 0 ? styles.segPriceUp : styles.segPriceDown
                    )}
                  >
                    当前¥{comp.current.subtotal.toFixed(2)}
                    {comp.priceDiff > 0 ? '↑' : '↓'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        <View className={styles.summary}>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>分段数量</Text>
            <Text className={styles.summaryValue}>{booking.segments.length} 段</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>总时长</Text>
            <Text className={styles.summaryValue}>{booking.totalHours} 小时</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>下单金额</Text>
            <Text className={styles.summaryTotal}>¥{booking.totalAmount.toFixed(2)}</Text>
          </View>
          {hasRateDiff && currentPricing && (
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>当前费率预估</Text>
              <Text
                className={classnames(
                  styles.summaryTotal,
                  currentPricing.totalAmount > booking.totalAmount ? styles.segPriceUp : styles.segPriceDown
                )}
              >
                ¥{currentPricing.totalAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>账单信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>订单号</Text>
          <View className={classnames(styles.infoValue, styles.billNo)}>
            <Text>{booking.id}</Text>
            <Text
              className={styles.copyBtn}
              onClick={() => {
                Taro.setClipboardData({ data: booking.id });
              }}
            >
              复制
            </Text>
          </View>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>创建时间</Text>
          <Text className={styles.infoValue}>{booking.createdAt}</Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={classnames(styles.btn, styles.btnOutline)} onClick={handleContact}>
          联系客服
        </Button>
        {booking.status === 'pending' && (
          <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handlePay}>
            立即支付
          </Button>
        )}
      </View>
    </View>
  );
};

export default BillDetailPage;
