<template>
  <div class="timer-page">
    <!-- Header -->
    <div class="page-header">
      <div class="date-display">{{ currentDate }}</div>
      <div class="greeting">{{ greeting }}</div>
    </div>

    <!-- Task Card -->
    <div class="task-card" v-if="currentTask" @click="showTaskPicker = true">
      <div class="task-card-header">
        <span class="task-badge">当前任务</span>
        <span class="task-category">{{ categoryNames[currentTask.category] }}</span>
      </div>
      <div class="task-card-title">{{ currentTask.name }}</div>
      <div class="task-card-footer">
        <div class="pomodoro-progress">
          <span class="current">{{ currentTask.completedPomodoros || 0 }}</span>
          <span class="separator">/</span>
          <span class="total">{{ currentTask.estimatedPomodoros }}</span>
          <span class="unit">番茄</span>
        </div>
        <van-button size="small" type="primary" round plain>切换</van-button>
      </div>
      <van-progress 
        :percentage="getProgress(currentTask)" 
        :stroke-width="4" 
        :show-pivot="false"
        color="linear-gradient(90deg, #5B8FF9, #14C4E4)"
        track-color="#E8F0FE"
      />
    </div>

    <!-- No Task State -->
    <div class="no-task-card" v-else @click="showTaskPicker = true">
      <div class="no-task-icon">🎯</div>
      <div class="no-task-text">选择一个任务开始学习</div>
      <van-button type="primary" round size="small">选择任务</van-button>
    </div>

    <!-- Timer -->
    <div class="timer-section">
      <div class="timer-ring" :class="{ 'is-rest': isRest }">
        <svg class="progress-ring" viewBox="0 0 200 200">
          <circle 
            class="progress-ring-bg"
            cx="100" cy="100" r="90"
            fill="none"
            stroke="#E8F0FE"
            stroke-width="8"
          />
          <circle 
            class="progress-ring-progress"
            cx="100" cy="100" r="90"
            fill="none"
            :stroke="isRest ? '#6DD400' : 'url(#progressGradient)'"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
            transform="rotate(-90 100 100)"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#5B8FF9" />
              <stop offset="100%" stop-color="#14C4E4" />
            </linearGradient>
          </defs>
        </svg>
        
        <div class="timer-content">
          <div class="timer-time">{{ timeDisplay }}</div>
          <div class="timer-label">
            <van-tag :type="isRest ? 'success' : 'primary'" size="medium" round>
              {{ timerLabel }}
            </van-tag>
          </div>
          <div class="pomodoro-badge" v-if="currentPomodoro > 0">
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
        class="control-btn start-btn"
      >
        <van-icon name="play" size="24" />
        {{ isPaused ? '继续' : '开始学习' }}
      </van-button>
      
      <van-button 
        v-else 
        type="default" 
        size="large" 
        round
        @click="pauseTimer"
        class="control-btn pause-btn"
      >
        <van-icon name="pause" size="24" />
        暂停
      </van-button>

      <div class="secondary-btns">
        <van-button 
          round 
          plain 
          size="large"
          :disabled="!isRunning && !isPaused && timeLeft === defaultTime"
          @click="resetTimer"
        >
          <van-icon name="replay" /> 重置
        </van-button>
      </div>
    </div>

    <!-- Settings Card -->
    <div class="settings-card">
      <van-cell-group inset>
        <van-cell title="工作时长" :value="settings.workDuration + ' 分钟'" is-link @click="showSettings = true" />
        <van-cell title="今日完成" :value="todayPomodoros + ' 番茄'" />
      </van-cell-group>
    </div>

    <!-- Rest Popup -->
    <van-popup v-model:show="showRest" position="bottom" :close-on-click-overlay="false" round>
      <div class="rest-popup">
        <div class="rest-header">
          <span class="rest-emoji">☕</span>
          <div class="rest-title">休息一下吧</div>
          <div class="rest-subtitle">让大脑放松一下</div>
        </div>
        
        <div class="rest-timer-display">{{ timeDisplay }}</div>

        <div class="rest-activities">
          <div class="activity-item" @click="skipRest">
            <span class="activity-icon">🚶</span>
            <span class="activity-name">走动一下</span>
          </div>
          <div class="activity-item" @click="skipRest">
            <span class="activity-icon">💧</span>
            <span class="activity-name">喝水</span>
          </div>
          <div class="activity-item" @click="skipRest">
            <span class="activity-icon">👀</span>
            <span class="activity-name">远眺</span>
          </div>
          <div class="activity-item" @click="skipRest">
            <span class="activity-icon">🧘</span>
            <span class="activity-name">放松</span>
          </div>
        </div>

        <van-button type="primary" block round size="large" @click="skipRest">
          跳过休息
        </van-button>
      </div>
    </van-popup>

    <!-- Task Picker -->
    <van-popup v-model:show="showTaskPicker" position="bottom" round>
      <div class="task-picker">
        <div class="picker-header">
          <span class="picker-title">选择学习任务</span>
          <van-button size="small" type="primary" round @click="goCreateTask">新建</van-button>
        </div>
        
        <div class="picker-list">
          <div 
            v-for="task in tasks" 
            :key="task.id"
            class="picker-item"
            :class="{ active: currentTask?.id === task.id }"
            @click="selectTask(task)"
          >
            <div class="picker-item-content">
              <div class="picker-item-name">{{ task.name }}</div>
              <div class="picker-item-meta">{{ categoryNames[task.category] }} · {{ task.completedPomodoros || 0 }}/{{ task.estimatedPomodoros }} 番茄</div>
            </div>
            <van-icon name="success" v-if="currentTask?.id === task.id" class="check-icon" />
          </div>
          <van-empty v-if="tasks.length === 0" description="还没有任务，去创建一个吧" />
        </div>
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

const isRunning = ref(false)
const isPaused = ref(false)
const isRest = ref(false)
const showRest = ref(false)
const showTaskPicker = ref(false)
const showSettings = ref(false)
const timeLeft = ref(25 * 60)
const currentPomodoro = ref(0)
const todayPomodoros = ref(0)

let timerInterval = null
let defaultTime = 25 * 60

// 计时器持久化：用开始时间戳计算，确保切后台后时间准确
let timerStartTime = null  // 计时器开始时的 timestamp
let timerPausedAt = null   // 暂停时的剩余秒数（用于恢复）
const circumference = 2 * Math.PI * 90

const currentDate = computed(() => {
  const date = new Date()
  const options = { month: 'long', day: 'numeric', weekday: 'long' }
  return date.toLocaleDateString('zh-CN', options)
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好，准备好学习了吗？'
  if (hour < 18) return '下午好，继续加油！'
  return '晚上好，保持专注！'
})

const progressOffset = computed(() => {
  const total = isRest.value 
    ? (currentPomodoro.value % settings.value.longBreakInterval === 0 
      ? settings.value.longBreak 
      : settings.value.shortBreak) * 60
    : settings.value.workDuration * 60
  const progress = (total - timeLeft.value) / total
  return circumference * (1 - progress)
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
  showTaskPicker.value = false
  showToast(`已选择: ${task.name}`)
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
  
  // 记录开始时间戳，用于切后台后恢复
  timerStartTime = Date.now()
  
  timerInterval = setInterval(() => {
    // 用当前时间 - 开始时间 计算已经过去的秒数
    const elapsedSeconds = Math.floor((Date.now() - timerStartTime) / 1000)
    const totalSeconds = isRest.value 
      ? (currentPomodoro.value % settings.value.longBreakInterval === 0 
          ? settings.value.longBreak 
          : settings.value.shortBreak) * 60
      : settings.value.workDuration * 60
    
    // 如果是暂停后恢复，需要加上暂停时的剩余时间
    const startTimeLeft = timerPausedAt !== null ? timerPausedAt : totalSeconds
    timeLeft.value = Math.max(0, startTimeLeft - elapsedSeconds)
    
    if (timeLeft.value <= 0) {
      completePhase()
    }
  }, 1000)

  // 清除暂停记录
  timerPausedAt = null

  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

const pauseTimer = () => {
  clearInterval(timerInterval)
  // 暂停时记录当前剩余秒数
  timerPausedAt = timeLeft.value
  timerStartTime = null  // 清除开始时间
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
  // 清除计时器状态
  timerStartTime = null
  timerPausedAt = null
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
  // 清除计时器状态
  timerStartTime = null
  timerPausedAt = null

  if (!isRest.value) {
    currentPomodoro.value++
    todayPomodoros.value++
    
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
        
        const newCount = (currentTask.value.completedPomodoros || 0) + 1
        tasksAPI.update(currentTask.value.id, {
          completedPomodoros: newCount
        })
        currentTask.value.completedPomodoros = newCount
        
        loadTasks()
        
        if (newCount >= currentTask.value.estimatedPomodoros) {
          showNotify({ type: 'success', message: '🎉 任务完成！' })
        }
      } catch (e) {
        console.error('Save error:', e)
      }
    }

    if (Notification.permission === 'granted') {
      new Notification('番茄完成！', { body: '工作时段结束，该休息了~' })
    }

    playNotificationSound()

    const isLongBreak = currentPomodoro.value % settings.value.longBreakInterval === 0
    const restDuration = isLongBreak ? settings.value.longBreak : settings.value.shortBreak
    timeLeft.value = restDuration * 60
    isRest.value = true
    showRest.value = true
    
    startRestTimer()
  } else {
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

// 保存计时器状态到 localStorage
const saveTimerState = () => {
  if (isRunning.value || isPaused.value) {
    const state = {
      timeLeft: timeLeft.value,
      isRest: isRest.value,
      isPaused: isPaused.value,
      isRunning: isRunning.value,
      currentPomodoro: currentPomodoro.value,
      currentTaskId: currentTask.value?.id,
      timerStartTime: timerStartTime,
      timerPausedAt: timerPausedAt,
      savedAt: Date.now()
    }
    localStorage.setItem('pomodoroState', JSON.stringify(state))
  }
}

// 从 localStorage 恢复计时器状态
const restoreTimerState = () => {
  const saved = localStorage.getItem('pomodoroState')
  if (!saved) return false
  
  try {
    const state = JSON.parse(saved)
    const now = Date.now()
    const elapsed = Math.floor((now - state.savedAt) / 1000)
    
    // 如果计时器正在运行，需要计算切后台期间过去的时间
    if (state.isRunning && state.timerStartTime) {
      const totalSeconds = state.isRest 
        ? (state.currentPomodoro % settings.value.longBreakInterval === 0 
            ? settings.value.longBreak 
            : settings.value.shortBreak) * 60
        : settings.value.workDuration * 60
      
      // 用保存时的时间和当前时间差来恢复
      const startTimeLeft = state.timeLeft
      timeLeft.value = Math.max(0, startTimeLeft - elapsed)
      timerStartTime = Date.now() - elapsed * 1000  // 调整开始时间
      timerPausedAt = null
      isRest.value = state.isRest
      currentPomodoro.value = state.currentPomodoro
      
      if (timeLeft.value > 0) {
        isRunning.value = true
        startTimer()
        return true
      }
    } else if (state.isPaused) {
      // 暂停状态直接恢复
      timeLeft.value = state.timeLeft
      isRest.value = state.isRest
      isPaused.value = true
      currentPomodoro.value = state.currentPomodoro
      timerPausedAt = state.timerPausedAt
      return true
    }
  } catch (e) {
    console.error('Restore timer state error:', e)
  }
  
  // 清理保存的状态
  localStorage.removeItem('pomodoroState')
  return false
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
  
  // 尝试恢复之前保存的计时器状态
  restoreTimerState()
  
  // 监听页面可见性变化，保存状态
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveTimerState()
    }
  })
  
  // 页面卸载前保存状态
  window.addEventListener('beforeunload', saveTimerState)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  // 清理事件监听器
  document.removeEventListener('visibilitychange', saveTimerState)
  window.removeEventListener('beforeunload', saveTimerState)
})
</script>

<style scoped>
.timer-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%);
  padding: 20px;
  padding-bottom: 100px;
}

/* Header */
.page-header {
  text-align: center;
  padding: 20px 0;
}

.date-display {
  font-size: 14px;
  color: #999999;
  margin-bottom: 4px;
}

.greeting {
  font-size: 20px;
  font-weight: 600;
  color: #1F1F1F;
}

/* Task Card */
.task-card {
  background: linear-gradient(135deg, #5B8FF9 0%, #14C4E4 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  cursor: pointer;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-badge {
  font-size: 12px;
  background: rgba(255,255,255,0.25);
  padding: 2px 10px;
  border-radius: 10px;
  color: white;
}

.task-category {
  font-size: 12px;
  color: rgba(255,255,255,0.8);
}

.task-card-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
}

.task-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pomodoro-progress {
  font-size: 14px;
  color: white;
}

.pomodoro-progress .current {
  font-size: 24px;
  font-weight: 700;
}

.pomodoro-progress .separator,
.pomodoro-progress .unit {
  opacity: 0.8;
  margin: 0 2px;
}

/* No Task State */
.no-task-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.no-task-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.no-task-text {
  font-size: 16px;
  color: #666666;
  margin-bottom: 16px;
}

/* Timer Section */
.timer-section {
  display: flex;
  justify-content: center;
  margin: 32px 0;
}

.timer-ring {
  position: relative;
  width: 240px;
  height: 240px;
}

.timer-ring.is-rest .progress-ring-progress {
  stroke: #6DD400 !important;
}

.progress-ring {
  width: 100%;
  height: 100%;
}

.progress-ring-progress {
  transition: stroke-dashoffset 0.5s ease;
}

.timer-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.timer-time {
  font-size: 48px;
  font-weight: 700;
  color: #1F1F1F;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}

.timer-label {
  margin-top: 8px;
}

.pomodoro-badge {
  margin-top: 12px;
  font-size: 13px;
  color: #999999;
}

/* Controls */
.timer-controls {
  text-align: center;
  padding: 0 20px;
}

.control-btn {
  height: 56px !important;
  font-size: 18px !important;
  font-weight: 600;
}

.start-btn {
  background: linear-gradient(135deg, #5B8FF9 0%, #14C4E4 100%) !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(91, 143, 249, 0.4);
}

.pause-btn {
  background: white !important;
  border: 2px solid #E8F0FE !important;
}

.secondary-btns {
  margin-top: 12px;
}

.secondary-btns .van-button {
  color: #999999;
}

/* Settings Card */
.settings-card {
  margin-top: 32px;
}

/* Rest Popup */
.rest-popup {
  padding: 32px 24px;
  text-align: center;
}

.rest-header {
  margin-bottom: 24px;
}

.rest-emoji {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.rest-title {
  font-size: 24px;
  font-weight: 600;
  color: #1F1F1F;
  margin-bottom: 4px;
}

.rest-subtitle {
  font-size: 14px;
  color: #999999;
}

.rest-timer-display {
  font-size: 56px;
  font-weight: 700;
  color: #6DD400;
  margin: 24px 0;
  font-variant-numeric: tabular-nums;
}

.rest-activities {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.activity-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: #F7F8FA;
  border-radius: 12px;
}

.activity-icon {
  font-size: 24px;
}

.activity-name {
  font-size: 12px;
  color: #666666;
}

/* Task Picker */
.task-picker {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.picker-title {
  font-size: 18px;
  font-weight: 600;
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.picker-item.active {
  background: linear-gradient(135deg, rgba(91, 143, 249, 0.1) 0%, rgba(20, 196, 228, 0.1) 100%);
  border: 1px solid #5B8FF9;
}

.picker-item-name {
  font-size: 16px;
  font-weight: 500;
  color: #1F1F1F;
}

.picker-item-meta {
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}

.check-icon {
  color: #5B8FF9;
}
</style>
