export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/record/index',
    'pages/growth/index',
    'pages/reminder/index',
    'pages/mine/index',
    'pages/feeding-edit/index',
    'pages/solid-edit/index',
    'pages/diaper-edit/index',
    'pages/sleep-edit/index',
    'pages/growth-edit/index',
    'pages/statistics/index',
    'pages/export/index',
    'pages/report-preview/index',
    'pages/family/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF8A9B',
    navigationBarTitleText: '宝宝喂养记录',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF8F5'
  },
  tabBar: {
    color: '#8C8C8C',
    selectedColor: '#FF8A9B',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/record/index',
        text: '记录'
      },
      {
        pagePath: 'pages/growth/index',
        text: '成长'
      },
      {
        pagePath: 'pages/reminder/index',
        text: '提醒'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
