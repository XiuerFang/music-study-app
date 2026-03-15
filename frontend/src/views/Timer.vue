<template>
  <div class="timer-page">
    <!-- Current Task Display -->
    <div class="current-task-card" v-if="currentTask">
      <div class="task-badge">当前任务</div>
      <div class="task-name">{{ currentTask.name }}</div>
      <div class="task-info">
        <span class="tag">{{ categoryNames[currentTask.category] }}</span>
        <span class="progress-text">{{ currentTask.completedPomodoros || 0 }}/{{ currentTask.estimatedPomodoros }} 番茄</span>
      </div>
      <van-progress 
        :percentage="getProgress(currentTask)" 
        :stroke-width="6" 
        :show-pivot="false"
        color="#6366f1"
        track-color="#334155"
      />
    </div>

    <!-- Task Selector -->
    <div class="task-selector" v-if="!currentTask">
      <van-cell-group inset>
        <van-cell title="选择任务开始学习" is-link @click="showTaskPicker = true">
          <template #label>
            <span class="hint-text">选择一个任务来计时</span>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- Timer -->
    <div class="timer-wrapper">
      <div class="timer-circle" :style="{ '--progress': progress + '%' }">
        <div class="timer-inner">
          <div class="timer-time">{{ timeDisplay }}</div>
          <div class="timer-label">
            <van-tag :type="isRest ? 'success' : 'primary'">
              {{ timerLabel }}
            </van-tag>
          </div>
          <div class="pomodoro-count" v-if="currentPomodoro > 0">
            🍅 {{ currentPomodoro }} 个番茄
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="timer-controls">
      <van-button 
        v-if="!isRunning" 
        type="primary" 
        size="large" 
        round
        :disabled="!currentTask && !isRest"
        @click="startTimer"
      >
        <van-icon name="play-circle-o" size="20" />
        {{ isPaused ? '继续' : '开始' }}
      </van-button>
      <van-button 
        v-else 
        type="warning" 
        size="large" 
        round
        @click="pauseTimer"
      >
        <van-icon name="pause-circle-o" size="20" />
        暂停
      </van-button>
      <van-button 
        size="large" 
        round
        plain
        @click="resetTimer"
        :disabled="!isRunning && !isPaused && timeLeft === defaultTime"
      >
        <van-icon name="replay" size="18" />
        重置
      </van-button>
    </div>

    <!-- Quick Task Switch -->
    <div class="quick-actions" v-if="currentTask">
      <van-button size="small" plain type="primary" @click="showTaskPicker = true">
        切换任务
      </van-button>
      <van-button size="small" plain type="danger" @click="clearCurrentTask">
        结束任务
      </van-button>
    </div>

    <!-- Settings Card -->
    <van-cell-group inset class="settings-card">
      <van-cell title="工作时长" :value="settings.workDuration + '分钟'" />
      <van-cell title="短休息" :value="settings.shortBreak + '分钟'" />
      <van-cell title="长休息" :value="settings.longBreak + '分钟'" />
    </van-cell-group>

    <!-- Rest Popup -->
    <van-popup v-model:show="showRest" position="bottom" :close-on-click-overlay="false">
      <div class="rest-popup">
        <div class="rest-header">
          <span class="rest-icon">☕</span>
          <span class="rest-title">休息一下</span>
        </div>
        
        <div class="rest-timer">{{ timeDisplay }}</div>
        
        <div class="rest-tips">
          <span>眼睛休息一下</span>
          <span>喝点水</span>
          <span>站起来活动</span>
        </div>

        <div class="rest-games">
          <div class="game-btn" @click="openGame('2048')">
            <span class="game-icon">🎮</span>
            <span>2048</span>
          </div>
          <div class="game-btn" @click="openGame('snake')">
            <span class="game-icon">🐍</span>
            <span>贪吃蛇</span>
          </div>
        </div>

        <van-button type="primary" block round @click="skipRest">
          跳过休息
        </van-button>
      </div>
    </van-popup>

    <!-- Task Picker -->
    <van-popup v-model:show="showTaskPicker" position="bottom">
      <div class="task-picker">
        <div class="picker-header">
          <span>选择任务</span>
          <van-button size="small" type="primary" @click="goCreateTask">新建任务</van-button>
        </div>
        <van-radio-group v-model="selectedTaskId">
          <van-cell-group>
            <van-cell 
              v-for="task in tasks" 
              :key="task.id"
              clickable
              @click="selectTask(task)"
            >
              <template #title>
                <div class="task-cell">
                  <span class="task-name">{{ task.name }}</span>
                  <span class="task-meta">{{ categoryNames[task.category] }}</span>
                </div>
              </template>
              <template #right-icon>
                <van-radio :name="task.id" />
              </template>
            </van-cell>
          </van-cell-group>
        </van-radio-group>
        <van-empty v-if="tasks.length === 0" description="暂无任务，去创建一个吧" />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { showToast, showNotify } from 'vant'
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
const tasks = ref([])
const selectedTaskId = ref(null)

const isRunning = ref(false)
const isPaused = ref(false)
const isRest = ref(false)
const showRest = ref(false)
const showTaskPicker = ref(false)
const timeLeft = ref(25 * 60)
const currentPomodoro = ref(0)

let timerInterval = null
let defaultTime = 25 * 60

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
  return isRunning.value ? '专注中' : '等待开始'
})

const getProgress = (task) => {
  if (!task.estimatedPomodoros) return 0
  return Math.round(((task.completedPomodoros || 0) / task.estimatedPomodoros) * 100)
}

const loadTasks = async () => {
  try {
    const res = await tasksAPI.getAll('all')
    tasks.value = res.tasks
  } catch (e) {
    console.error(e)
  }
}

const selectTask = (task) => {
  currentTask.value = task
  selectedTaskId.value = task.id
  showTaskPicker.value = false
  showToast(`已选择: ${task.name}`)
}

const clearCurrentTask = () => {
  currentTask.value = null
  selectedTaskId.value = null
}

const goCreateTask = () => {
  showTaskPicker.value = false
  window.location.href = '/tasks'
}

const startTimer = () => {
  if (!currentTask.value && !isRest.value) {
    showToast('请先选择一个任务')
    return
  }
  
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
  defaultTime = settings.value.workDuration * 60
  currentPomodoro.value = 0
}

const skipRest = () => {
  clearInterval(timerInterval)
  isRest.value = false
  showRest.value = false
  timeLeft.value = settings.value.workDuration * 60
  startTimer()
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
        const newCount = (currentTask.value.completedPomodoros || 0) + 1
        tasksAPI.update(currentTask.value.id, {
          completedPomodoros: newCount
        })
        currentTask.value.completedPomodoros = newCount
        
        // Auto complete if done
        if (newCount >= currentTask.value.estimatedPomodoros) {
          showNotify({ type: 'success', message: '🎉 任务完成！' })
        }
      } catch (e) {
        console.error('Save error:', e)
      }
    }

    // Notification
    if (Notification.permission === 'granted') {
      new Notification('番茄完成！', { body: '工作时段结束，该休息了~' })
    }

    // Sound
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
    startTimer()
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
  showToast(`即将开放 ${type} 游戏`)
}

onMounted(async () => {
  try {
    const res = await settingsAPI.get()
    settings.value = res.settings
    timeLeft.value = settings.value.workDuration * 60
    defaultTime = settings.value.workDuration * 60
  } catch (e) {
    console.error('Load settings error:', e)
  }
  loadTasks()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.timer-page {
  min-height: 100vh;
  background: #0f172a;
  padding: 20px;
  padding-bottom: 100px;
}

.current-task-card {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.task-badge {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.current-task-card .task-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.tag {
  font-size: 12px;
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 8px;
}

.progress-text {
  font-size: 12px;
  opacity: 0.8;
}

.task-selector {
  margin-bottom: 24px;
}

.hint-text {
  font-size: 12px;
  color: #94a3b8;
}

.timer-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.timer-circle {
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: conic-gradient(#6366f1 var(--progress), #334155 0%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.timer-inner {
  width: 220px;
  height: 220px;
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
  color: #f8fafc;
}

.timer-label {
  margin-top: 8px;
}

.pomodoro-count {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 8px;
}

.timer-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.timer-controls .van-button {
  flex: 1;
}

.quick-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.settings-card {
  margin-top: 20px;
}

.rest-popup {
  padding: 32px 24px;
  text-align: center;
}

.rest-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.rest-icon {
  font-size: 32px;
}

.rest-title {
  font-size: 24px;
  color: #10b981;
  font-weight: 600;
}

.rest-timer {
  font-size: 56px;
  font-weight: 700;
  color: #f8fafc;
  margin: 24px 0;
}

.rest-tips {
  display: flex;
  justify-content: center;
  gap: 16px;
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 24px;
}

.rest-games {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
}

.game-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: #1e293b;
  border-radius: 12px;
  cursor: pointer;
}

.game-icon {
  font-size: 28px;
}

.task-picker {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
}

.task-cell {
  display: flex;
  flex-direction: column;
}

.task-cell .task-name {
  color: #f8fafc;
}

.task-cell .task-meta {
  font-size: 12px;
  color: #94a3b8;
}
</style>
