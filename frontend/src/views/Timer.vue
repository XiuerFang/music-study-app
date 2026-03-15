<template>
  <div class="timer-page">
    <div class="current-task" v-if="currentTask">
      <div class="task-name">{{ currentTask.name }}</div>
      <div class="task-category">{{ categoryNames[currentTask.category] }}</div>
    </div>
    
    <div class="timer-circle" :style="{ '--progress': progress + '%' }">
      <div class="timer-inner">
        <div class="timer-time">{{ timeDisplay }}</div>
        <div class="timer-label">{{ timerLabel }}</div>
      </div>
    </div>

    <div class="timer-controls">
      <van-button type="primary" size="large" @click="startTimer" v-if="!isRunning">
        {{ isPaused ? '继续' : '开始' }}
      </van-button>
      <van-button type="warning" size="large" @click="pauseTimer" v-else>
        暂停
      </van-button>
      <van-button size="large" @click="resetTimer">重置</van-button>
    </div>

    <van-cell-group inset class="settings-group">
      <van-cell title="工作时长" :value="settings.workDuration + '分钟'" />
      <van-cell title="短休息" :value="settings.shortBreak + '分钟'" />
      <van-cell title="长休息" :value="settings.longBreak + '分钟'" />
    </van-cell-group>

    <!-- Rest Mode Overlay -->
    <van-popup v-model:show="showRest" position="bottom" :close-on-click-overlay="false">
      <div class="rest-popup">
        <div class="rest-title">☕ 休息一下</div>
        <div class="rest-timer">{{ timeDisplay }}</div>
        <div class="rest-games">
          <van-button size="small" @click="openGame('2048')">🎮 2048</van-button>
          <van-button size="small" @click="openGame('snake')">🐍 贪吃蛇</van-button>
        </div>
        <van-button type="primary" block @click="skipRest">跳过休息</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { showToast } from 'vant'
import { settingsAPI, recordsAPI, tasksAPI } from '../api'

const categoryNames = {
  'music-history': '🎼 音乐历史',
  'singing': '🎤 演唱练习',
  'improvisation': '🎹 即兴伴奏',
  'teaching': '📚 教学试讲',
  'training': '💪 辅助训练'
}

const settings = ref({ workDuration: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 })
const currentTask = ref(null)

const isRunning = ref(false)
const isPaused = ref(false)
const isRest = ref(false)
const showRest = ref(false)
const timeLeft = ref(25 * 60)
const currentPomodoro = ref(0)

let timerInterval = null

const progress = computed(() => {
  const total = isRest.value 
    ? (currentPomodoro.value % settings.value.longBreakInterval === 0 
      ? settings.value.longBreak 
      : settings.value.shortBreak) * 60
    : settings.value.workDuration * 60
  return ((total - timeLeft.value) / total) * 100
})

const timeDisplay = computed(() => {
  const mins = Math.floor(timeLeft.value / 60).toString().padStart(2, '0')
  const secs = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
})

const timerLabel = computed(() => {
  if (isRest.value) {
    return currentPomodoro.value % settings.value.longBreakInterval === 0 ? '长休息' : '短休息'
  }
  return '工作中'
})

const startTimer = () => {
  isRunning.value = true
  isPaused.value = false
  
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      completePhase()
    }
  }, 1000)

  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

const pauseTimer = () => {
  clearInterval(timerInterval)
  isPaused.value = true
  isRunning.value = false
}

const resetTimer = () => {
  clearInterval(timerInterval)
  isRunning.value = false
  isPaused.value = false
  isRest.value = false
  showRest.value = false
  timeLeft.value = settings.value.workDuration * 60
}

const skipRest = () => {
  clearInterval(timerInterval)
  isRest.value = false
  showRest.value = false
  timeLeft.value = settings.value.workDuration * 60
}

const completePhase = () => {
  clearInterval(timerInterval)
  isRunning.value = false

  if (!isRest.value) {
    // Work completed
    currentPomodoro.value++
    
    // Save record
    if (currentTask.value) {
      try {
        recordsAPI.create({
          taskId: currentTask.value.id,
          taskName: currentTask.value.name,
          category: currentTask.value.category,
          duration: settings.value.workDuration,
          pomodoros: 1,
          recordDate: new Date().toISOString().split('T')[0]
        })
        
        // Update task
        tasksAPI.update(currentTask.value.id, {
          completedPomodoros: (currentTask.value.completedPomodoros || 0) + 1
        })
      } catch (e) {
        console.error('Save record error:', e)
      }
    }

    // Notification
    if (Notification.permission === 'granted') {
      new Notification('番茄完成！', { body: '工作时段结束，该休息了~' })
    }

    // Play sound
    playNotificationSound()

    // Enter rest
    const isLongBreak = currentPomodoro.value % settings.value.longBreakInterval === 0
    const restDuration = isLongBreak ? settings.value.longBreak : settings.value.shortBreak
    timeLeft.value = restDuration * 60
    isRest.value = true
    showRest.value = true
    
    startRestTimer()
  } else {
    // Rest completed
    showRest.value = false
    isRest.value = false
    timeLeft.value = settings.value.workDuration * 60
  }
}

const startRestTimer = () => {
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      completePhase()
    }
  }, 1000)
}

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch (e) {}
}

const openGame = (type) => {
  showToast(`即将开放${type}游戏`)
}

onMounted(async () => {
  try {
    const res = await settingsAPI.get()
    settings.value = res.settings
    timeLeft.value = settings.value.workDuration * 60
  } catch (e) {
    console.error('Load settings error:', e)
  }
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.timer-page {
  padding: 20px;
  min-height: 100vh;
  background: #0f172a;
}

.current-task {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
}

.task-name {
  font-size: 18px;
  font-weight: 600;
}

.task-category {
  margin-top: 8px;
  opacity: 0.8;
}

.timer-circle {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: conic-gradient(#6366f1 var(--progress), #334155 0%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
}

.timer-inner {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer-time {
  font-size: 48px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.timer-label {
  margin-top: 8px;
  color: #94a3b8;
}

.timer-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 30px;
}

.timer-controls .van-button {
  flex: 1;
}

.settings-group {
  margin-top: 20px;
}

.rest-popup {
  padding: 30px;
  text-align: center;
}

.rest-title {
  font-size: 24px;
  color: #10b981;
  margin-bottom: 20px;
}

.rest-timer {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 30px;
}

.rest-games {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}
</style>
