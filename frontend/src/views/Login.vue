<template>
  <div class="login-page">
    <!-- Logo -->
    <div class="logo-section">
      <div class="logo-icon">🎵</div>
      <div class="logo-text">胡天才音乐学习</div>
      <div class="logo-slogan">番茄工作法 · 专注学习</div>
    </div>

    <!-- Form -->
    <div class="form-section">
      <van-form @submit="onSubmit">
        <van-cell-group inset class="form-group">
          <van-field
            v-model="username"
            name="username"
            placeholder="请输入用户名"
            left-icon="user-o"
            :rules="[{ required: true, message: '请输入用户名' }]"
          />
          <van-field
            v-model="password"
            type="password"
            name="password"
            placeholder="请输入密码"
            left-icon="lock"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="form-btn">
          <van-button round block type="primary" native-type="submit" :loading="loading" size="large">
            登录
          </van-button>
        </div>
      </van-form>

      <div class="register-link">
        还没有账号？<span @click="goRegister">立即注册</span>
      </div>
    </div>

    <!-- Decorative -->
    <div class="decoration">
      <div class="decoration-item">🍅</div>
      <div class="decoration-item">📚</div>
      <div class="decoration-item">🎹</div>
    </div>
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
  background: linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%);
  padding: 60px 24px;
  display: flex;
  flex-direction: column;
}

/* Logo */
.logo-section {
  text-align: center;
  margin-bottom: 48px;
}

.logo-icon {
  font-size: 72px;
  margin-bottom: 16px;
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  color: #1F1F1F;
  margin-bottom: 8px;
}

.logo-slogan {
  font-size: 14px;
  color: #999999;
}

/* Form */
.form-section {
  flex: 1;
}

.form-group {
  margin-bottom: 24px;
}

.form-btn {
  padding: 0 20px;
}

.form-btn .van-button {
  height: 52px;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #5B8FF9 0%, #14C4E4 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(91, 143, 249, 0.3);
}

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #999999;
}

.register-link span {
  color: #5B8FF9;
  font-weight: 500;
  cursor: pointer;
}

/* Decoration */
.decoration {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 48px;
}

.decoration-item {
  font-size: 32px;
  opacity: 0.5;
}
</style>
