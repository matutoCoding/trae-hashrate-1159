import { Studio } from '@/types';

export const studios: Studio[] = [
  {
    id: 'studio-001',
    name: '光影一号棚',
    description: '大型商业摄影棚，配备专业灯光系统和无影墙，适合服装、人像、产品拍摄。',
    coverImage: 'https://picsum.photos/id/1082/750/500',
    images: [
      'https://picsum.photos/id/1082/750/500',
      'https://picsum.photos/id/1060/750/500',
      'https://picsum.photos/id/1058/750/500'
    ],
    area: 120,
    capacity: 15,
    status: 'available',
    equipment: [
      { name: '保荣闪光灯', quantity: 4 },
      { name: '常亮LED灯', quantity: 6 },
      { name: '反光板套装', quantity: 3 },
      { name: '柔光箱', quantity: 5 },
      { name: '背景纸', quantity: 8 }
    ],
    tags: ['大型棚', '无影墙', '商业拍摄'],
    address: '创意园区A栋301'
  },
  {
    id: 'studio-002',
    name: '幻境二号棚',
    description: '中型创意摄影棚，适合电商产品、自媒体内容创作，空间灵活多变。',
    coverImage: 'https://picsum.photos/id/1060/750/500',
    images: [
      'https://picsum.photos/id/1060/750/500',
      'https://picsum.photos/id/1048/750/500',
      'https://picsum.photos/id/1059/750/500'
    ],
    area: 80,
    capacity: 8,
    status: 'busy',
    equipment: [
      { name: '闪光灯套装', quantity: 3 },
      { name: '环形补光灯', quantity: 2 },
      { name: '三脚架', quantity: 4 },
      { name: '柔光伞', quantity: 3 }
    ],
    tags: ['中型棚', '电商', '直播'],
    address: '创意园区A栋302'
  },
  {
    id: 'studio-003',
    name: '星芒三号棚',
    description: '小型精品摄影棚，适合证件照、形象照、小产品拍摄，性价比高。',
    coverImage: 'https://picsum.photos/id/1048/750/500',
    images: [
      'https://picsum.photos/id/1048/750/500',
      'https://picsum.photos/id/1050/750/500',
      'https://picsum.photos/id/1051/750/500'
    ],
    area: 45,
    capacity: 4,
    status: 'available',
    equipment: [
      { name: '闪光灯套装', quantity: 2 },
      { name: '柔光箱', quantity: 3 },
      { name: '背景架', quantity: 2 }
    ],
    tags: ['小型棚', '证件照', '高性价比'],
    address: '创意园区B栋201'
  },
  {
    id: 'studio-004',
    name: '流光四号棚',
    description: '专业视频拍摄棚，配备绿幕和专业灯光，适合短视频、宣传片录制。',
    coverImage: 'https://picsum.photos/id/1058/750/500',
    images: [
      'https://picsum.photos/id/1058/750/500',
      'https://picsum.photos/id/1062/750/500',
      'https://picsum.photos/id/1074/750/500'
    ],
    area: 100,
    capacity: 12,
    status: 'available',
    equipment: [
      { name: '影视灯', quantity: 6 },
      { name: '绿幕背景', quantity: 1 },
      { name: '提词器', quantity: 2 },
      { name: '收音麦克风', quantity: 4 }
    ],
    tags: ['视频棚', '绿幕', '短视频'],
    address: '创意园区B栋202'
  },
  {
    id: 'studio-005',
    name: '墨韵五号棚',
    description: '维护升级中，预计明日开放，敬请期待。',
    coverImage: 'https://picsum.photos/id/1050/750/500',
    images: [
      'https://picsum.photos/id/1050/750/500',
      'https://picsum.photos/id/1052/750/500'
    ],
    area: 65,
    capacity: 6,
    status: 'maintenance',
    equipment: [
      { name: '闪光灯', quantity: 3 },
      { name: '柔光设备', quantity: 4 }
    ],
    tags: ['中型棚', '维护中'],
    address: '创意园区C栋101'
  },
  {
    id: 'studio-006',
    name: '魅影六号棚',
    description: '高端定制摄影棚，艺术风格独特，适合高端写真和创意作品拍摄。',
    coverImage: 'https://picsum.photos/id/1059/750/500',
    images: [
      'https://picsum.photos/id/1059/750/500',
      'https://picsum.photos/id/1070/750/500',
      'https://picsum.photos/id/1069/750/500'
    ],
    area: 150,
    capacity: 20,
    status: 'available',
    equipment: [
      { name: '高端闪光灯', quantity: 8 },
      { name: '电影级灯光', quantity: 4 },
      { name: '艺术背景', quantity: 10 },
      { name: '道具库', quantity: 1 }
    ],
    tags: ['高端棚', '艺术', '定制'],
    address: '创意园区C栋201'
  }
];
