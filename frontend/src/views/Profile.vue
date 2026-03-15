<template>
  <div class="profile-page">
    <h1>个人中心</h1>

    <van-cell-group inset>
      <van-cell title="头像" is-link>
        <template #default>
          <div class="avatar">{{ user?.nickname?.[0] || user?.username?.[0] || '?' }}</div>
        </template>
      </van-cell>
      <van-cell title="用户名" :value="user?.username" />
      <van-cell title="昵称" :value="user?.nickname || '未设置'" is-link @click="showNickname = true" />
    </van-cell-group>

    <van-cell-group inset>
      <van-cell title="修改密码" is-link @click="showPassword = true" />
      <van-cell title="番茄设置" is-link @click="showSettings = true" />
    </van-cell-group>

    <van-cell-group inset>
      <van-cell title="游戏记录" is-link @click="showGames = true" />
    </van-cell-group>

    <div class="logout-btn">
      <van-button type="danger" block @click="logout">退出登录</van-button>
    </div>

    <!-- Nickname Modal -->
    <van-popup v-model:show="showNickname" position="bottom">
      <div class="modal">
        <div class="modal-title">修改昵称</div>
        <van-cell-group inset>
          <van-field v-model="nickname" placeholder="请输入新昵称" />
        </van-cell-group>
        <div class="modal-btn">
          <van-button @click="showNickname = false">取消</van-button>
          <van-button type="primary" @click="updateNickname">保存</van-button>
        </div>
      </div>
    </van-popup>

    <!-- Password Modal -->
    <van-popup v-model:show="showPassword" position="bottom">
      <div class="modal">
        <div class="modal-title">修改密码</div>
        <van-cell-group inset>
          <van-field v-model="oldPassword" type="password" placeholder="旧密码" />
          <van-field v-model="newPassword" type="password" placeholder="新密码" />
        </van-cell-group>
        <div class="modal-btn">
          <van-button @click="showPassword = false">取消</van-button>
          <van-button type="primary" @click="updatePassword">保存</van-button>
        </div>
      </div>
    </van-popup>

    <!-- Settings Modal -->
    <van-popup v-model:show="showSettings" position="bottom">
      <div class="modal">
        <div class="modal-title">番茄设置</div>
        <van-cell-group inset>
          <van-field v-model.number="tempSettings.workDuration" type="digit" label="工作时长(分钟)" />
          <van-field v-model.number="tempSettings.shortBreak" type="digit" label="短休息(分钟)" />
          <van-field v-model.number="tempSettings.longBreak" type="digit" label="长休息(分钟)" />
          <van-field v-model.number="tempSettings.longBreakInterval" type="digit" label="长休息间隔" />
        </van-cell-group>
        <div class="modal-btn">
          <van-button @click="showSettings = false">取消</van-button>
          <van-button type="primary" @click="updateSettings">保存</van-button>
        </div>
      </div>
    </van-popup>

    <!-- Games Modal -->
    <van-popup v-model:show="showGames" position="bottom">
      <div class="modal">
        <div class="modal-title">游戏记录</div>
        <van-cell-group inset>
          <van-cell title="2048" :value="gameScores['2048']?.score || '暂无'" />
          <van-cell title="贪吃蛇" :value="gameScores['snake']?.score || '暂无'" />
          <van-cell title="打砖块" :value="gameScores['brick']?.score || '暂无'" />
        </van-cell-group>
        <div class="modal-btn">
          <van-button block @click="showGames = false">关闭</van-button>
        </div>
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
  background: #0f172a;
  padding: 20px;
  padding-bottom: 80px;
}

.profile-page h1 {
  font-size: 20px;
  color: #f8fafc;
  margin-bottom: 20px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.logout-btn {
  margin-top: 40px;
  padding: 20px;
}

.modal {
  padding: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
}

.modal-btn {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.modal-btn .van-button {
  flex: 1;
}
</style>
