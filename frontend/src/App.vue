<template>
  <van-config-provider :theme-vars="themeVars">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </van-config-provider>
</template>

<script setup>
// 莫兰迪色系 - 优雅柔和
const themeVars = {
  primaryColor: '#5B8FF9',
  primaryColorTap: '#3D76DD',
  successColor: '#6DD400',
  warningColor: '#FF8F00',
  dangerColor: '#F04844',
  backgroundColor: '#F7F8FA',
  cardBackground: '#FFFFFF',
  textColor: '#1F1F1F',
  textColor2: '#666666',
  textColor3: '#999999',
  borderColor: '#EEEEEE',
  tabbarBackground: '#FFFFFF',
  tabbarItemTextColor: '#999999',
  tabbarItemSelectedColor: '#5B8FF9',
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

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 通用样式 */
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1F1F1F;
  margin-bottom: 16px;
}

/* 卡片阴影 */
.card-shadow {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 渐变按钮 */
.gradient-btn {
  background: linear-gradient(135deg, #5B8FF9 0%, #14C4E4 100%) !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(91, 143, 249, 0.3);
}
</style>
