<template>
  <van-config-provider :theme-vars="themeVars">
    <router-view />
  </van-config-provider>
</template>

<script setup>
// 莫兰迪色系 / Morandi Colors - 优雅柔和
const themeVars = {
  // Primary Colors - 莫兰迪蓝绿
  primaryColor: '#5B8FF9',
  primaryColorTap: '#3D76DD',
  successColor: '#6DD400',
  warningColor: '#FF8F00',
  dangerColor: '#F04844',
  
  // Background Colors
  backgroundColor: '#F7F8FA',
  cardBackground: '#FFFFFF',
  surfaceColor: '#FFFFFF',
  
  // Text Colors  
  textColor: '#1F1F1F',
  textColor2: '#666666',
  textColor3: '#999999',
  
  // Border & Divider
  borderColor: '#EEEEEE',
  dividerColor: '#EBEBEB',
  
  // Tabbar
  tabbarBackground: '#FFFFFF',
  tabbarItemTextColor: '#999999',
  tabbarItemSelectedColor: '#5B8FF9',
  
  // Button
  buttonPrimaryBackground: '#5B8FF9',
  buttonPrimaryBorderColor: '#5B8FF9',
  buttonDefaultBackground: '#FFFFFF',
  buttonDefaultBorderColor: '#DCDEE0',
  buttonDefaultColor: '#1F1F1F',
  
  // Cell
  cellBackground: '#FFFFFF',
  cellBorderColor: '#EBEBEB',
  cellTextColor: '#1F1F1F',
  cellLabelColor: '#999999',
  
  // Input
  inputBackgroundColor: '#F7F8FA',
  inputTextColor: '#1F1F1F',
  inputPlaceholderColor: '#BFBFBF',
  
  // Popup
  popupBackground: '#FFFFFF',
  
  // Calendar
  calendarBackground: '#FFFFFF',
  calendarItemColor: '#1F1F1F',
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #F7F8FA;
  color: #1F1F1F;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-overflow-scrolling: touch;
}

/* 通用页面容器 */
.page-container {
  min-height: 100vh;
  background: #F7F8FA;
}

/* 卡片样式 */
.card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 文字样式 */
.text-primary { color: #5B8FF9; }
.text-success { color: #6DD400; }
.text-warning { color: #FF8F00; }
.text-danger { color: #F04844; }
.text-muted { color: #999999; }

/* 渐变背景 */
.gradient-primary {
  background: linear-gradient(135deg, #5B8FF9 0%, #14C4E4 100%);
}

.gradient-success {
  background: linear-gradient(135deg, #6DD400 0%, #4BD808 100%);
}

.gradient-warm {
  background: linear-gradient(135deg, #FF8F00 0%, #FFB300 100%);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* 阴影 */
.shadow-sm {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.shadow-md {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.shadow-lg {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
</style>
