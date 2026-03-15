<template>
  <div class="stats-page">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title">数据统计</div>
      <van-button size="small" round @click="loadStats">
        <van-icon name="refresh" /> 刷新
      </van-button>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🍅</div>
        <div class="stat-value">{{ stats.totalPomodoros || 0 }}</div>
        <div class="stat-label">总番茄数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-value">{{ stats.totalMinutes || 0 }}</div>
        <div class="stat-label">学习分钟</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{ stats.completedTasks || 0 }}</div>
        <div class="stat-label">完成任务</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-value">{{ stats.streakDays || 0 }}</div>
        <div class="stat-label">连续天数</div>
      </div>
    </div>

    <!-- Week Chart -->
    <div class="chart-card">
      <div class="chart-title">本周学习趋势</div>
      <div class="chart-container">
        <canvas ref="weekChartRef"></canvas>
      </div>
    </div>

    <!-- Category Chart -->
    <div class="chart-card">
      <div class="chart-title">分类统计</div>
      <div class="chart-container">
        <canvas ref="categoryChartRef"></canvas>
      </div>
    </div>

    <!-- Recent Records -->
    <div class="records-card">
      <div class="chart-title">最近记录</div>
      <div class="records-list">
        <div 
          v-for="record in recentRecords" 
          :key="record.id"
          class="record-item"
        >
          <div class="record-icon">{{ getCategoryIcon(record.category) }}</div>
          <div class="record-content">
            <div class="record-name">{{ record.taskName }}</div>
            <div class="record-meta">{{ categoryNames[record.category] || record.category }}</div>
          </div>
          <div class="record-right">
            <div class="record-duration">+{{ record.duration }}分钟</div>
            <div class="record-date">{{ formatDate(record.recordDate) }}</div>
          </div>
        </div>
        <van-empty v-if="recentRecords.length === 0" description="暂无学习记录" :image-size="60" />
      </div>
    </div>

    <!-- Calendar -->
    <div class="calendar-card" @click="showCalendar = true">
      <div class="calendar-left">
        <span class="calendar-icon">📅</span>
        <span class="calendar-text">学习日历</span>
      </div>
      <van-icon name="arrow" />
    </div>

    <!-- Calendar Popup -->
    <van-popup v-model:show="showCalendar" position="bottom" full round>
      <div class="calendar-popup">
        <div class="calendar-header">
          <van-button size="small" round @click="prevMonth">&lt;</van-button>
          <span class="calendar-month">{{ currentYear }}年{{ currentMonth }}月</span>
          <van-button size="small" round @click="nextMonth">&gt;</van-button>
        </div>
        
        <div class="calendar-weekdays">
          <span v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</span>
        </div>
        
        <div class="calendar-days">
          <div 
            v-for="day in calendarDays" 
            :key="day.date"
            class="calendar-day"
            :class="{ 
              'other-month': day.otherMonth,
              'has-data': calendarData[day.date]
            }"
            :style="{ 
              opacity: calendarData[day.date] ? Math.min(calendarData[day.date].totalPomodoros / 10 + 0.4, 1) : 0.3,
              background: calendarData[day.date] ? 'linear-gradient(135deg, #5B8FF9, #14C4E4)' : '#F7F8FA'
            }"
          >
            {{ day.day }}
          </div>
        </div>
        
        <van-button block round @click="showCalendar = false" style="margin-top: 20px;">关闭</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { showToast, closeToast, showFailToast } from 'vant'
import { recordsAPI } from '../api'

const categoryNames = {
  'music-history': '🎼 音乐历史',
  'singing': '🎤 演唱练习',
  'improvisation': '🎹 即兴伴奏',
  'teaching': '📚 教学试讲',
  'training': '💪 辅助训练'
}

const categoryIcons = {
  'music-history': '🎼',
  'singing': '🎤',
  'improvisation': '🎹',
  'teaching': '📚',
  'training': '💪'
}

const stats = reactive({
  totalPomodoros: 0,
  totalMinutes: 0,
  completedTasks: 0,
  streakDays: 0,
  categoryStats: {},
  weekData: []
})

const recentRecords = ref([])
const weekChartRef = ref(null)
const categoryChartRef = ref(null)
const showCalendar = ref(false)
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const calendarData = ref({})

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay()
  const lastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
  const prevLastDay = new Date(currentYear.value, currentMonth.value - 1, 0).getDate()
  
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevLastDay - i
    const date = new Date(currentYear.value, currentMonth.value - 2, d).toISOString().split('T')[0]
    days.push({ day: d, date, otherMonth: true })
  }
  
  for (let i = 1; i <= lastDay; i++) {
    const date = new Date(currentYear.value, currentMonth.value - 1, i).toISOString().split('T')[0]
    days.push({ day: i, date, otherMonth: false })
  }
  
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i).toISOString().split('T')[0]
    days.push({ day: i, date, otherMonth: true })
  }
  
  return days
})

const getCategoryIcon = (category) => categoryIcons[category] || '📝'

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (dateStr === today.toISOString().split('T')[0]) return '今天'
  if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天'
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const loadStats = async () => {
  showToast({ message: '加载中...', forbidClick: true, duration: 0 })
  try {
    const res = await recordsAPI.getStats()
    Object.assign(stats, res)
    
    const recordsRes = await recordsAPI.getAll({ limit: 10 })
    recentRecords.value = recordsRes.records
    
    await nextTick()
    renderCharts()
  } catch (e) {
    showToast('加载失败')
    console.error(e)
  } finally {
    closeToast()
  }
}

const loadCalendar = async () => {
  try {
    const res = await recordsAPI.getCalendar(currentYear.value, currentMonth.value)
    calendarData.value = res.calendarData
  } catch (e) {
    console.error(e)
  }
}

const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadCalendar()
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadCalendar()
}

const renderCharts = () => {
  if (!weekChartRef.value || !stats.weekData?.length) return
  
  const ctx = weekChartRef.value.getContext('2d')
  const width = weekChartRef.value.width = weekChartRef.value.offsetWidth
  const height = weekChartRef.value.height = 120
  
  ctx.clearRect(0, 0, width, height)
  
  const barWidth = width / 7 - 10
  const maxValue = Math.max(...stats.weekData.map(d => d.count), 1)
  
  const gradient = ctx.createLinearGradient(0, 0, width, 0)
  gradient.addColorStop(0, '#5B8FF9')
  gradient.addColorStop(1, '#14C4E4')
  
  stats.weekData.forEach((d, i) => {
    const barHeight = (d.count / maxValue) * (height - 25)
    const x = i * (barWidth + 10) + 5
    const y = height - barHeight - 20
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(x, y, barWidth, barHeight, 4)
    ctx.fill()
    
    ctx.fillStyle = '#999999'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(d.day, x + barWidth / 2, height - 5)
    if (d.count > 0) {
      ctx.fillStyle = '#5B8FF9'
      ctx.fillText(d.count, x + barWidth / 2, y - 5)
    }
  })

  if (!categoryChartRef.value) return
  const catCtx = categoryChartRef.value.getContext('2d')
  const catWidth = categoryChartRef.value.width = categoryChartRef.value.offsetWidth
  const catHeight = categoryChartRef.value.height = 120
  const radius = Math.min(catWidth, catHeight) / 2 - 15
  const centerX = catWidth / 2
  const centerY = catHeight / 2
  
  catCtx.clearRect(0, 0, catWidth, catHeight)
  
  const categories = Object.keys(stats.categoryStats)
  const total = Object.values(stats.categoryStats).reduce((a, b) => a + b, 0) || 1
  const colors = ['#5B8FF9', '#FF8F00', '#6DD400', '#F04844', '#14C4E4']
  
  if (categories.length === 0) {
    catCtx.fillStyle = '#E8F0FE'
    catCtx.beginPath()
    catCtx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    catCtx.fill()
    catCtx.fillStyle = '#999999'
    catCtx.font = '14px sans-serif'
    catCtx.textAlign = 'center'
    catCtx.fillText('暂无数据', centerX, centerY)
    return
  }
  
  let startAngle = -Math.PI / 2
  
  categories.forEach((cat, i) => {
    const value = stats.categoryStats[cat]
    const sliceAngle = (value / total) * Math.PI * 2
    
    catCtx.beginPath()
    catCtx.moveTo(centerX, centerY)
    catCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
    catCtx.fillStyle = colors[i % colors.length]
    catCtx.fill()
    
    startAngle += sliceAngle
  })
}

onMounted(() => {
  loadStats()
  loadCalendar()
})
</script>

<style scoped>
.stats-page {
  min-height: 100vh;
  background: #F7F8FA;
  padding: 20px;
  padding-bottom: 80px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1F1F1F;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #5B8FF9;
}

.stat-label {
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
}

/* Chart Card */
.chart-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F1F1F;
  margin-bottom: 16px;
}

.chart-container {
  height: 120px;
}

.chart-container canvas {
  width: 100%;
  height: 100%;
}

/* Records Card */
.records-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.records-list {
  max-height: 200px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-icon {
  font-size: 24px;
  margin-right: 12px;
}

.record-content {
  flex: 1;
}

.record-name {
  font-size: 15px;
  font-weight: 500;
  color: #1F1F1F;
}

.record-meta {
  font-size: 12px;
  color: #999999;
  margin-top: 2px;
}

.record-right {
  text-align: right;
}

.record-duration {
  font-size: 14px;
  font-weight: 600;
  color: #6DD400;
}

.record-date {
  font-size: 11px;
  color: #999999;
  margin-top: 2px;
}

/* Calendar Card */
.calendar-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.calendar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.calendar-icon {
  font-size: 24px;
}

.calendar-text {
  font-size: 16px;
  font-weight: 500;
  color: #1F1F1F;
}

/* Calendar Popup */
.calendar-popup {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-month {
  font-size: 18px;
  font-weight: 600;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  color: #999999;
  margin-bottom: 12px;
  font-size: 13px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  flex: 1;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 14px;
  color: #1F1F1F;
  font-weight: 500;
}

.calendar-day.other-month {
  color: #CCCCCC;
}
</style>
