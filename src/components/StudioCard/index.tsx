import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Studio } from '@/types';
import styles from './index.module.scss';

interface StudioCardProps {
  studio: Studio;
  showPrice?: boolean;
  pricePerHour?: number;
}

const statusMap = {
  available: { label: '可预约', className: styles.available },
  busy: { label: '使用中', className: styles.busy },
  maintenance: { label: '维护中', className: styles.maintenance }
};

const StudioCard: React.FC<StudioCardProps> = ({ studio, showPrice = true, pricePerHour = 120 }) => {
  const status = statusMap[studio.status];

  const handleClick = () => {
    console.log('[StudioCard] 点击影棚', studio.id, studio.name);
    Taro.navigateTo({
      url: `/pages/studio-detail/index?id=${studio.id}`
    });
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.cover}>
        <Image
          className={styles.coverImage}
          src={studio.coverImage}
          mode='aspectFill'
          onError={(e) => console.error('[StudioCard] 图片加载失败', e)}
        />
        <View className={classnames(styles.statusTag, status.className)}>{status.label}</View>
      </View>
      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.name}>{studio.name}</Text>
          {showPrice && (
            <View>
              <Text className={styles.price}>¥{pricePerHour}</Text>
              <Text className={styles.priceUnit}>/时</Text>
            </View>
          )}
        </View>
        <Text className={styles.desc}>{studio.description}</Text>
        <View className={styles.tags}>
          {studio.tags.map((tag, idx) => (
            <Text key={idx} className={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
        <View className={styles.info}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>面积</Text>
            <Text>{studio.area}㎡</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>容纳</Text>
            <Text>{studio.capacity}人</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>地址</Text>
            <Text>{studio.address}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default StudioCard;
