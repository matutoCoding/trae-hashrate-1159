import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useRateStore } from '@/store/rateStore';
import { RateType } from '@/types';
import styles from './index.module.scss';

const RateInfoPage: React.FC = () => {
  const rates = useRateStore((s) => s.rates);
  const weekdayRates = rates.filter((r) => r.weekdays.includes(1));
  const weekendRates = rates.filter((r) => r.weekdays.includes(6));

  const priceRanges = useMemo(() => {
    const getRange = (type: RateType) => {
      const typeRates = rates.filter((r) => r.type === type);
      if (typeRates.length === 0) return { min: 0, max: 0 };
      const prices = typeRates.map((r) => r.pricePerHour);
      return { min: Math.min(...prices), max: Math.max(...prices) };
    };
    return {
      peak: getRange('peak'),
      normal: getRange('normal'),
      offpeak: getRange('offpeak')
    };
  }, [rates]);

  const formatRange = (range: { min: number; max: number }) => {
    if (range.min === range.max) return String(range.min);
    return `${range.min}-${range.max}`;
  };

  const handleGotoManage = () => {
    Taro.navigateTo({ url: '/pages/rate-manage/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerRow}>
          <Text className={styles.title}>时段费率说明</Text>
          <Button className={styles.manageBtn} onClick={handleGotoManage}>
            管理费率
          </Button>
        </View>
        <Text className={styles.desc}>
          按时段费率分高峰平峰多档计费，跨费率切换点将自动分段计算费用
        </Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>费率档位</Text>
        <View className={classnames(styles.rateCard, styles.peak)}>
          <View className={classnames(styles.rateIcon, styles.peakIcon)}>🔥</View>
          <View className={styles.rateInfo}>
            <Text className={styles.rateLabel}>高峰时段</Text>
            <Text className={styles.rateTime}>需求旺盛时段，价格较高</Text>
          </View>
          <View className={styles.ratePrice}>
            <Text className={styles.ratePriceValue}>{formatRange(priceRanges.peak)}</Text>
            <Text className={styles.ratePriceUnit}>元/时</Text>
          </View>
        </View>
        <View className={classnames(styles.rateCard, styles.normal)}>
          <View className={classnames(styles.rateIcon, styles.normalIcon)}>☀️</View>
          <View className={styles.rateInfo}>
            <Text className={styles.rateLabel}>平峰时段</Text>
            <Text className={styles.rateTime}>正常营业时段，标准价格</Text>
          </View>
          <View className={styles.ratePrice}>
            <Text className={styles.ratePriceValue}>{formatRange(priceRanges.normal)}</Text>
            <Text className={styles.ratePriceUnit}>元/时</Text>
          </View>
        </View>
        <View className={classnames(styles.rateCard, styles.offpeak)}>
          <View className={classnames(styles.rateIcon, styles.offpeakIcon)}>🌿</View>
          <View className={styles.rateInfo}>
            <Text className={styles.rateLabel}>特惠时段</Text>
            <Text className={styles.rateTime}>早班特惠时段，超值优惠</Text>
          </View>
          <View className={styles.ratePrice}>
            <Text className={styles.ratePriceValue}>{formatRange(priceRanges.offpeak)}</Text>
            <Text className={styles.ratePriceUnit}>元/时</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>工作日费率表 (周一至周五)</Text>
        <View className={styles.table}>
          <View className={classnames(styles.tableRow, styles.tableHeader)}>
            <Text className={classnames(styles.tableCell, styles.tableHeaderCell)}>时段</Text>
            <Text className={classnames(styles.tableCell, styles.tableHeaderCell)}>费率</Text>
            <Text className={classnames(styles.tableCell, styles.tableHeaderCell)}>价格</Text>
          </View>
          {weekdayRates.map((rate) => (
            <View className={styles.tableRow} key={rate.id}>
              <Text className={styles.tableCell}>
                {rate.startTime} - {rate.endTime}
              </Text>
              <Text className={styles.tableCell}>
                <Text
                  className={classnames(
                    styles.tag,
                    rate.type === 'peak'
                      ? styles.peakTag
                      : rate.type === 'normal'
                      ? styles.normalTag
                      : styles.offpeakTag
                  )}
                >
                  {rate.label}
                </Text>
              </Text>
              <Text className={styles.tableCell}>¥{rate.pricePerHour}/时</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>周末费率表 (周六至周日)</Text>
        <View className={styles.table}>
          <View className={classnames(styles.tableRow, styles.tableHeader)}>
            <Text className={classnames(styles.tableCell, styles.tableHeaderCell)}>时段</Text>
            <Text className={classnames(styles.tableCell, styles.tableHeaderCell)}>费率</Text>
            <Text className={classnames(styles.tableCell, styles.tableHeaderCell)}>价格</Text>
          </View>
          {weekendRates.map((rate) => (
            <View className={styles.tableRow} key={rate.id}>
              <Text className={styles.tableCell}>
                {rate.startTime} - {rate.endTime}
              </Text>
              <Text className={styles.tableCell}>
                <Text
                  className={classnames(
                    styles.tag,
                    rate.type === 'peak'
                      ? styles.peakTag
                      : rate.type === 'normal'
                      ? styles.normalTag
                      : styles.offpeakTag
                  )}
                >
                  {rate.label}
                </Text>
              </Text>
              <Text className={styles.tableCell}>¥{rate.pricePerHour}/时</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>计费规则</Text>
        <View className={styles.ruleList}>
          <View className={styles.ruleItem}>
            <Text className={styles.ruleNum}>1</Text>
            <Text className={styles.ruleText}>
              计费以小时为单位，不足1小时按1小时计算
            </Text>
          </View>
          <View className={styles.ruleItem}>
            <Text className={styles.ruleNum}>2</Text>
            <Text className={styles.ruleText}>
              跨费率切换点时自动拆分时段，按各段费率分别计算后合计
            </Text>
          </View>
          <View className={styles.ruleItem}>
            <Text className={styles.ruleNum}>3</Text>
            <Text className={styles.ruleText}>
              工作日与周末费率不同，系统根据预约日期自动匹配费率
            </Text>
          </View>
          <View className={styles.ruleItem}>
            <Text className={styles.ruleNum}>4</Text>
            <Text className={styles.ruleText}>
              超时30分钟未到自动释放资源，费用不退，名额释放给候补用户
            </Text>
          </View>
          <View className={styles.ruleItem}>
            <Text className={styles.ruleNum}>5</Text>
            <Text className={styles.ruleText}>
              如需取消预约，请提前2小时操作，临时取消可能影响信用
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>分段计费示例</Text>
        <View className={styles.example}>
          <Text className={styles.exampleTitle}>示例：周三 16:00 - 20:00 预约</Text>
          <Text className={styles.exampleText}>
            {'\n'}16:00 - 18:00 平峰时段：2小时 × ¥120 ={' '}
            <Text className={styles.exampleHighlight}>¥240</Text>
            {'\n'}18:00 - 20:00 高峰时段：2小时 × ¥180 ={' '}
            <Text className={styles.exampleHighlight}>¥360</Text>
            {'\n'}
            {'\n'}合计：4小时，{' '}
            <Text className={styles.exampleHighlight}>¥600</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

export default RateInfoPage;
