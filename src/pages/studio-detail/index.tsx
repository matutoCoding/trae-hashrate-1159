import React, { useState, useEffect } from 'react';
import { View, Text, Swiper, SwiperItem, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useStudioStore } from '@/store/studioStore';
import { useBookingStore } from '@/store/bookingStore';
import { getApplicableRate } from '@/utils/pricing';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const statusMap = {
  available: { label: '可预约', className: styles.available },
  busy: { label: '使用中', className: styles.busy },
  maintenance: { label: '维护中', className: styles.maintenance }
};

const StudioDetailPage: React.FC = () => {
  const router = useRouter();
  const studioId = router.params.id;
  const { getStudioById } = useStudioStore();
  const { setSelectedStudioId } = useBookingStore();
  const studio = getStudioById(studioId || '');
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    console.log('[StudioDetailPage] 加载影棚详情', studioId);
  }, [studioId]);

  if (!studio) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '200rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#86909C', fontSize: '28rpx' }}>影棚不存在或已删除</Text>
        </View>
      </View>
    );
  }

  const status = statusMap[studio.status];
  const todayRate = getApplicableRate(dayjs().format('YYYY-MM-DD'), '14:00');
  const displayPrice = todayRate?.pricePerHour || 120;

  const handleBooking = () => {
    if (studio.status === 'maintenance') {
      Taro.showToast({ title: '影棚维护中', icon: 'none' });
      return;
    }
    console.log('[StudioDetailPage] 去预约', studio.id);
    setSelectedStudioId(studio.id);
    Taro.switchTab({
      url: '/pages/schedule/index'
    });
  };

  return (
    <View className={styles.page}>
      <Swiper
        className={styles.swiper}
        autoplay
        circular
        indicatorDots={false}
        onChange={(e) => setCurrentImage(e.detail.current)}
      >
        {studio.images.map((img, idx) => (
          <SwiperItem key={idx}>
            <Image
              className={styles.swiperImage}
              src={img}
              mode='aspectFill'
              onError={(e) => console.error('[StudioDetailPage] 图片加载失败', e)}
            />
          </SwiperItem>
        ))}
      </Swiper>
      <View className={styles.swiperDots}>
        {studio.images.map((_, idx) => (
          <View
            key={idx}
            className={classnames(
              styles.swiperDot,
              idx === currentImage && styles.swiperDotActive
            )}
          />
        ))}
      </View>

      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{studio.name}</Text>
            <View className={styles.tags}>
              {studio.tags.map((tag, idx) => (
                <Text key={idx} className={styles.tag}>
                  {tag}
                </Text>
              ))}
            </View>
          </View>
          <Text className={classnames(styles.status, status.className)}>{status.label}</Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>基本信息</Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoValue}>{studio.area}</Text>
              <Text className={styles.infoLabel}>面积(㎡)</Text>
            </View>
            <View className={styles.infoDivider} />
            <View className={styles.infoItem}>
              <Text className={styles.infoValue}>{studio.capacity}</Text>
              <Text className={styles.infoLabel}>容纳人数</Text>
            </View>
            <View className={styles.infoDivider} />
            <View className={styles.infoItem}>
              <Text className={styles.infoValue}>24h</Text>
              <Text className={styles.infoLabel}>营业时长</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>影棚介绍</Text>
          <Text className={styles.desc}>{studio.description}</Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>配套设备</Text>
          <View className={styles.equipList}>
            {studio.equipment.map((equip, idx) => (
              <View key={idx} className={styles.equipItem}>
                <Text className={styles.equipIcon}>🎬</Text>
                <View className={styles.equipInfo}>
                  <Text className={styles.equipName}>{equip.name}</Text>
                  <Text className={styles.equipQty}>数量 x{equip.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>影棚地址</Text>
          <View className={styles.address}>
            <Text className={styles.addressIcon}>📍</Text>
            <Text className={styles.addressText}>{studio.address}</Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.priceLabel}>参考价</Text>
          <Text className={styles.priceValue}>¥{displayPrice}</Text>
          <Text className={styles.priceUnit}>/小时起</Text>
        </View>
        <Button
          className={classnames(
            styles.bookBtn,
            studio.status === 'maintenance' && styles.bookBtnDisabled
          )}
          disabled={studio.status === 'maintenance'}
          onClick={handleBooking}
        >
          {studio.status === 'maintenance' ? '维护中' : '立即预约'}
        </Button>
      </View>
    </View>
  );
};

export default StudioDetailPage;
