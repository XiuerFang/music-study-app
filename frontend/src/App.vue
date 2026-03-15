<template>
  <van-config-provider :theme-vars="themeVars">
    <router-view />
  </van-config-provider>
</template>

<script setup>
const themeVars = {
  primaryColor: '#6366f1',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  dangerColor: '#ef4444',
  backgroundColor: '#0f172a',
  cardBackground: '#1e293b',
  textColor: '#f8fafc',
  textColor2: '#94a3b8',
  borderColor: '#334155',
  tabbarBackground: '#1e293b',
  tabbarItemTextColor: '#94a3b8',
  tabbarItemSelectedColor: '#6366f1'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0f172a;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.van-nav-bar {
  background: #1e293b !important;
}

.van-nav-bar__title {
  color: #f8fafc !important;
}

.van-tabbar {
  background: #1e293b !important;
}

.van-cell {
  background: #1e293b !important;
  color: #f8fafc !important;
}
</style>
