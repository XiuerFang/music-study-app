<template>
  <van-tabbar v-model="active" route shadow>
    <van-tabbar-item to="/timer" rounded>
      <template #icon>
        <span class="tab-icon">⏱️</span>
      </template>
      <span class="tab-text">计时</span>
    </van-tabbar-item>
    <van-tabbar-item to="/tasks" rounded>
      <template #icon>
        <span class="tab-icon">📝</span>
      </template>
      <span class="tab-text">任务</span>
    </van-tabbar-item>
    <van-tabbar-item to="/stats" rounded>
      <template #icon>
        <span class="tab-icon">📊</span>
      </template>
      <span class="tab-text">统计</span>
    </van-tabbar-item>
    <van-tabbar-item to="/profile" rounded>
      <template #icon>
        <span class="tab-icon">👤</span>
      </template>
      <span class="tab-text">我的</span>
    </van-tabbar-item>
  </van-tabbar>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup>
import { ref } from 'vue'

const active = ref(0)
</script>

<style>
.van-tabbar {
  background: white !important;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}

.van-tabbar-item {
  background: transparent;
}

.van-tabbar-item--active {
  color: #5B8FF9;
}

.tab-icon {
  font-size: 20px;
}

.tab-text {
  font-size: 12px;
  margin-top: 2px;
}
</style>
