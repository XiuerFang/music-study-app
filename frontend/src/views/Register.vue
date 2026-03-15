<template>
  <div class="register-page">
    <div class="logo">
      <span class="logo-icon">🎵</span>
      <span class="logo-text">注册账号</span>
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
          v-model="nickname"
          name="nickname"
          label="昵称"
          placeholder="请输入昵称（可选）"
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
          注册
        </van-button>
        <van-button round block plain type="primary" @click="goLogin" class="mt-10">
          已有账号，去登录
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
const nickname = ref('')
const password = ref('')
const loading = ref(false)

const onSubmit = async () => {
  loading.value = true
  try {
    await authStore.register({
      username: username.value,
      nickname: nickname.value,
      password: password.value
    })
    showToast('注册成功')
    router.replace('/')
  } catch (error) {
    showToast(error.response?.data?.error || '注册失败')
  } finally {
    loading.value = false
  }
}

const goLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #0f172a;
  padding: 60px 20px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 50px;
  margin-bottom: 12px;
}

.logo-text {
  font-size: 22px;
  font-weight: 600;
  color: #f8fafc;
}

.btn-group {
  padding: 20px;
}

.mt-10 {
  margin-top: 10px;
}
</style>
