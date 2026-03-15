<template>
  <van-tabbar v-model="active" route>
    <van-tabbar-item to="/timer" icon="clock-o">计时器</van-tabbar-item>
    <van-tabbar-item to="/tasks" icon="todo-list-o">任务</van-tabbar-item>
    <van-tabbar-item to="/stats" icon="chart-trending-o">统计</van-tabbar-item>
    <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(0)
</script>

<style>
.van-tabbar {
  background: #1e293b !important;
}
</style>
