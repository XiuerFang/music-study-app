<template>
  <div class="login-page">
    <div class="logo">
      <span class="logo-icon">🎵</span>
      <span class="logo-text">胡天才音乐学习</span>
    </div>
    
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          label="用户名"
          placeholder="请输入用户名"
          :rules="[{ required: true, message: '请输入用户名' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>
      <div class="btn-group">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
        <van-button round block plain type="primary" @click="goRegister" class="mt-10">
          注册账号
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { showToast } from 'vant'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

const onSubmit = async () => {
  loading.value = true
  try {
    await authStore.login(username.value, password.value)
    showToast('登录成功')
    router.replace('/')
  } catch (error) {
    showToast(error.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}

const goRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #0f172a;
  padding: 60px 20px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60px;
}

.logo-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.logo-text {
  font-size: 24px;
  font-weight: 600;
  color: #ec4899;
}

.btn-group {
  padding: 20px;
}

.mt-10 {
  margin-top: 10px;
}
</style>
