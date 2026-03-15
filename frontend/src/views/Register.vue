<template>
  <div class="register-page">
    <!-- Header -->
    <div class="page-header">
      <van-icon name="arrow-left" class="back-icon" @click="goLogin" />
      <div class="page-title">注册账号</div>
    </div>

    <!-- Logo -->
    <div class="logo-section">
      <div class="logo-icon">🎵</div>
      <div class="logo-text">胡天才音乐学习</div>
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
            v-model="nickname"
            name="nickname"
            placeholder="请输入昵称（可选）"
            left-icon="contact"
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
            注册
          </van-button>
        </div>
      </van-form>

      <div class="login-link">
        已有账号？<span @click="goLogin">立即登录</span>
      </div>
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
  background: linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%);
  padding: 20px 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.back-icon {
  font-size: 24px;
  color: #1F1F1F;
  cursor: pointer;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

/* Logo */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 56px;
  margin-bottom: 12px;
}

.logo-text {
  font-size: 22px;
  font-weight: 600;
  color: #1F1F1F;
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

.login-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #999999;
}

.login-link span {
  color: #5B8FF9;
  font-weight: 500;
  cursor: pointer;
}
</style>
