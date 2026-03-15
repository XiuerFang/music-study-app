<template>
  <div class="profile-page">
    <!-- Profile Header -->
    <div class="profile-header">
      <div class="avatar-wrapper">
        <div class="avatar">{{ userInitial }}</div>
      </div>
      <div class="profile-info">
        <div class="username">{{ user?.username || '用户' }}</div>
        <div class="nickname" v-if="user?.nickname">{{ user.nickname }}</div>
      </div>
    </div>

    <!-- Menu Groups -->
    <div class="menu-section">
      <div class="menu-title">账号信息</div>
      <div class="menu-group">
        <div class="menu-item" @click="showNickname = true">
          <span class="menu-icon">✏️</span>
          <span class="menu-text">修改昵称</span>
          <span class="menu-value">{{ user?.nickname || '未设置' }}</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showPassword = true">
          <span class="menu-icon">🔒</span>
          <span class="menu-text">修改密码</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-title">番茄设置</div>
      <div class="menu-group">
        <div class="menu-item" @click="showSettings = true">
          <span class="menu-icon">⏱️</span>
          <span class="menu-text">番茄计时设置</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showGames = true">
          <span class="menu-icon">🎮</span>
          <span class="menu-text">游戏记录</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-title">关于</div>
      <div class="menu-group">
        <div class="menu-item">
          <span class="menu-icon">ℹ️</span>
          <span class="menu-text">版本</span>
          <span class="menu-value">v1.0.0</span>
        </div>
      </div>
    </div>

    <!-- Logout -->
    <div class="logout-section">
      <van-button type="danger" block round size="large" @click="logout">
        退出登录
      </van-button>
    </div>

    <!-- Nickname Modal -->
    <van-popup v-model:show="showNickname" position="bottom" round>
      <div class="modal">
        <div class="modal-title">修改昵称</div>
        <van-cell-group inset>
          <van-field v-model="nickname" placeholder="请输入新昵称" />
        </van-cell-group>
        <div class="modal-actions">
          <van-button @click="showNickname = false">取消</van-button>
          <van-button type="primary" @click="updateNickname">保存</van-button>
        </div>
      </div>
    </van-popup>

    <!-- Password Modal -->
    <van-popup v-model:show="showPassword" position="bottom" round>
      <div class="modal">
        <div class="modal-title">修改密码</div>
        <van-cell-group inset>
          <van-field v-model="oldPassword" type="password" placeholder="旧密码" />
          <van-field v-model="newPassword" type="password" placeholder="新密码" />
        </van-cell-group>
        <div class="modal-actions">
          <van-button @click="showPassword = false">取消</van-button>
          <van-button type="primary" @click="updatePassword">保存</van-button>
        </div>
      </div>
    </van-popup>

    <!-- Settings Modal -->
    <van-popup v-model:show="showSettings" position="bottom" round>
      <div class="modal">
        <div class="modal-title">番茄设置</div>
        <van-cell-group inset>
          <van-field v-model.number="tempSettings.workDuration" type="digit" label="工作时长" suffix="分钟" />
          <van-field v-model.number="tempSettings.shortBreak" type="digit" label="短休息" suffix="分钟" />
          <van-field v-model.number="tempSettings.longBreak" type="digit" label="长休息" suffix="分钟" />
          <van-field v-model.number="tempSettings.longBreakInterval" type="digit" label="长休息间隔" suffix="个番茄" />
        </van-cell-group>
        <div class="modal-actions">
          <van-button @click="showSettings = false">取消</van-button>
          <van-button type="primary" @click="updateSettings">保存</van-button>
        </div>
      </div>
    </van-popup>

    <!-- Games Modal -->
    <van-popup v-model:show="showGames" position="bottom" round>
      <div class="modal">
        <div class="modal-title">游戏记录</div>
        <van-cell-group inset>
          <van-cell title="🎮 2048" :value="gameScores['2048']?.score || '暂无记录'" />
          <van-cell title="🐍 贪吃蛇" :value="gameScores['snake']?.score || '暂无记录'" />
          <van-cell title="🧱 打砖块" :value="gameScores['brick']?.score || '暂无记录'" />
        </van-cell-group>
        <van-button block round @click="showGames = false" style="margin-top: 20px;">关闭</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { showToast } from 'vant'
import { authAPI, settingsAPI, gamesAPI } from '../api'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const userInitial = computed(() => (user.value?.nickname || user.value?.username || '?')[0].toUpperCase())

const showNickname = ref(false)
const showPassword = ref(false)
const showSettings = ref(false)
const showGames = ref(false)

const nickname = ref('')
const oldPassword = ref('')
const newPassword = ref('')

const tempSettings = reactive({
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4
})

const gameScores = reactive({
  '2048': null,
  'snake': null,
  'brick': null
})

const logout = () => {
  authStore.logout()
  router.replace('/login')
}

const updateNickname = async () => {
  try {
    await authAPI.updateProfile({ nickname: nickname.value })
    await authStore.fetchProfile()
    showToast('修改成功')
    showNickname.value = false
  } catch (e) {
    showToast('修改失败')
  }
}

const updatePassword = async () => {
  try {
    await authAPI.changePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value
    })
    showToast('修改成功')
    showPassword.value = false
    oldPassword.value = ''
    newPassword.value = ''
  } catch (e) {
    showToast(e.response?.data?.error || '修改失败')
  }
}

const loadSettings = async () => {
  try {
    const res = await settingsAPI.get()
    Object.assign(tempSettings, res.settings)
  } catch (e) {
    console.error(e)
  }
}

const updateSettings = async () => {
  try {
    await settingsAPI.update(tempSettings)
    showToast('保存成功')
    showSettings.value = false
  } catch (e) {
    showToast('保存失败')
  }
}

const loadGameScores = async () => {
  try {
    const res = await gamesAPI.getScores()
    Object.assign(gameScores, res.scores)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadSettings()
  loadGameScores()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #F7F8FA;
  padding: 20px;
  padding-bottom: 100px;
}

/* Profile Header */
.profile-header {
  background: linear-gradient(135deg, #5B8FF9 0%, #14C4E4 100%);
  border-radius: 20px;
  padding: 32px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.avatar-wrapper {
  flex-shrink: 0;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: #5B8FF9;
}

.profile-info {
  flex: 1;
}

.username {
  font-size: 22px;
  font-weight: 600;
  color: white;
}

.nickname {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
}

/* Menu Section */
.menu-section {
  margin-bottom: 16px;
}

.menu-title {
  font-size: 13px;
  color: #999999;
  padding: 8px 12px;
}

.menu-group {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 20px;
  margin-right: 12px;
}

.menu-text {
  flex: 1;
  font-size: 16px;
  color: #1F1F1F;
}

.menu-value {
  font-size: 14px;
  color: #999999;
  margin-right: 8px;
}

.menu-arrow {
  font-size: 18px;
  color: #CCCCCC;
}

/* Logout */
.logout-section {
  margin-top: 32px;
  padding: 0 20px;
}

/* Modal */
.modal {
  padding: 24px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.modal-actions .van-button {
  flex: 1;
}
</style>
