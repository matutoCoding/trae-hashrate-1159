export default defineAppConfig({
  pages: [
    'pages/studio/index',
    'pages/schedule/index',
    'pages/waitlist/index',
    'pages/orders/index',
    'pages/studio-detail/index',
    'pages/booking-confirm/index',
    'pages/bill-detail/index',
    'pages/rate-info/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '共享摄影棚',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#2D5BFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/studio/index',
        text: '影棚'
      },
      {
        pagePath: 'pages/schedule/index',
        text: '排期'
      },
      {
        pagePath: 'pages/waitlist/index',
        text: '候补'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单'
      }
    ]
  }
})
