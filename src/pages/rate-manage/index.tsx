import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useRateStore } from '@/store/rateStore';
import { TimeRate, RateType } from '@/types';
import { calculatePricing } from '@/utils/pricing';
import styles from './index.module.scss';

const typeConfig: Record<RateType, { tagClass: string; tag: string; cardClass: string }> = {
  peak: { tagClass: styles.peakTag, tag: '高峰', cardClass: styles.peak },
  normal: { tagClass: styles.normalTag, tag: '平峰', cardClass: styles.normal },
  offpeak: { tagClass: styles.offpeakTag, tag: '特惠', cardClass: styles.offpeak }
};

const weekdayStr = (weekdays: number[]) => {
  if (weekdays.includes(1) && weekdays.includes(2) && weekdays.includes(3) && weekdays.includes(4) && weekdays.includes(5)) {
    return '工作日 (周一至周五)';
  }
  if (weekdays.includes(6) && weekdays.includes(0)) {
    return '周末 (周六至周日)';
  }
  return weekdays.map((d) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、');
};

const RateManagePage: React.FC = () => {
  const { rates, updateRate, resetRates } = useRateStore();
  const [localRates, setLocalRates] = useState<TimeRate[]>(rates);

  const weekdayRates = useMemo(
    () => localRates.filter((r) => r.weekdays.includes(1)),
    [localRates]
  );
  const weekendRates = useMemo(
    () => localRates.filter((r) => r.weekdays.includes(6)),
    [localRates]
  );

  const preview = useMemo(() => {
    const nextWednesday = dayjs().day(3).isBefore(dayjs()) ? dayjs().day(10) : dayjs().day(3);
    const date = nextWednesday.format('YYYY-MM-DD');
    return calculatePricing(date, '16:00', '20:00');
  }, [localRates]);

  const handleTimePick = (id: string, field: 'startTime' | 'endTime', currentVal: string) => {
    const hour = parseInt(currentVal.split(':')[0]);
    const startHour = 8;
    const endHour = 22;
    const items: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      items.push(`${String(h).padStart(2, '0')}:00`);
    }
    Taro.showActionSheet({
      itemList: items,
      success: (res) => {
        const newVal = items[res.tapIndex];
        setLocalRates((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;
            if (field === 'startTime' && newVal >= r.endTime) {
              Taro.showToast({ title: '开始时间需早于结束时间', icon: 'none' });
              return r;
            }
            if (field === 'endTime' && newVal <= r.startTime) {
              Taro.showToast({ title: '结束时间需晚于开始时间', icon: 'none' });
              return r;
            }
            return { ...r, [field]: newVal };
          })
        );
      },
      fail: (err) => console.error('[RateManage] 选择时间失败', err)
    });
  };

  const handlePricePick = (id: string, currentPrice: number) => {
    const presetPrices = [60, 80, 100, 120, 150, 180, 200, 220, 260, 300];
    Taro.showActionSheet({
      itemList: presetPrices.map((p) => `¥${p} /小时`),
      success: (res) => {
        const newPrice = presetPrices[res.tapIndex];
        setLocalRates((prev) => prev.map((r) => (r.id === id ? { ...r, pricePerHour: newPrice } : r)));
      },
      fail: (err) => console.error('[RateManage] 选择价格失败', err)
    });
  };

  const handleSave = () => {
    console.log('[RateManage] 保存费率', localRates);
    localRates.forEach((r) => {
      updateRate(r.id, {
        startTime: r.startTime,
        endTime: r.endTime,
        pricePerHour: r.pricePerHour,
        label: r.label
      });
    });
    Taro.showToast({
      title: '保存成功',
      icon: 'success',
      success: () => {
        setTimeout(() => Taro.navigateBack(), 800);
      }
    });
  };

  const handleReset = () => {
    Taro.showModal({
      title: '恢复默认',
      content: '确定要恢复默认费率设置吗？所有自定义修改将丢失。',
      success: (res) => {
        if (res.confirm) {
          resetRates();
          setLocalRates(useRateStore.getState().rates);
          Taro.showToast({ title: '已恢复默认', icon: 'success' });
        }
      }
    });
  };

  const renderRateCard = (rate: TimeRate) => {
    const cfg = typeConfig[rate.type];
    return (
      <View key={rate.id} className={classnames(styles.rateCard, cfg.cardClass)}>
        <View className={styles.rateHeader}>
          <View className={styles.rateName}>
            <Text className={classnames(styles.rateTag, cfg.tagClass)}>{cfg.tag}</Text>
            <Text className={styles.rateLabel}>{rate.label}</Text>
          </View>
          <Text className={styles.weekdayLabel}>{weekdayStr(rate.weekdays)}</Text>
        </View>

        <View className={styles.fieldRow}>
          <Text className={styles.fieldLabel}>时段</Text>
          <View className={styles.fieldValue}>
            <View
              className={styles.timeInput}
              onClick={() => handleTimePick(rate.id, 'startTime', rate.startTime)}
            >
              <Text>{rate.startTime}</Text>
            </View>
            <Text className={styles.timeSeparator}>至</Text>
            <View
              className={styles.timeInput}
              onClick={() => handleTimePick(rate.id, 'endTime', rate.endTime)}
            >
              <Text>{rate.endTime}</Text>
            </View>
          </View>
        </View>

        <View className={styles.fieldRow}>
          <Text className={styles.fieldLabel}>单价</Text>
          <View className={styles.fieldValue}>
            <View
              className={styles.priceInput}
              onClick={() => handlePricePick(rate.id, rate.pricePerHour)}
            >
              <Text className={styles.pricePrefix}>¥</Text>
              <Text className={styles.priceValue}>{rate.pricePerHour}</Text>
              <Text className={styles.priceSuffix}>/小时</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>费率管理</Text>
        <Text className={styles.desc}>
          调整各时段时间范围和价格，修改后所有排期预估和账单计算将按新费率执行
        </Text>
      </View>

      <View className={styles.section}>
        <View className={styles.preview}>
          <Text className={styles.previewTitle}>计费预览 (周三 16:00-20:00)</Text>
          <Text className={styles.previewValue}>¥{preview.totalAmount.toFixed(2)}</Text>
          <Text className={styles.previewDesc}>
            共 {preview.totalHours} 小时，{preview.segments.length} 个时段分段计费
          </Text>
        </View>
      </View>

      <ScrollView scrollY enhanced showScrollbar={false}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>工作日费率 (周一至周五)</Text>
          {weekdayRates.map(renderRateCard)}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>周末费率 (周六至周日)</Text>
          {weekendRates.map(renderRateCard)}
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button className={classnames(styles.btn, styles.btnOutline)} onClick={handleReset}>
          恢复默认
        </Button>
        <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handleSave}>
          保存修改
        </Button>
      </View>
    </View>
  );
};

export default RateManagePage;
