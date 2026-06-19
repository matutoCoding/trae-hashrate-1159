import React from 'react';
import { Text } from '@tarojs/components';
import classnames from 'classnames';
import { RateType } from '@/types';
import styles from './index.module.scss';

interface RateTagProps {
  type: RateType;
  label?: string;
}

const labelMap: Record<RateType, string> = {
  peak: '高峰时段',
  normal: '平峰时段',
  offpeak: '特惠时段'
};

const RateTag: React.FC<RateTagProps> = ({ type, label }) => {
  return (
    <Text className={classnames(styles.tag, styles[type])}>{label || labelMap[type]}</Text>
  );
};

export default RateTag;
