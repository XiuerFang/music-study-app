<template>
  <div class="stats-page">
    <h1>数据统计</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalPomodoros || 0 }}</div>
        <div class="stat-label">总番茄数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalMinutes || 0 }}</div>
        <div class="stat-label">总学习时长(分钟)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.completedTasks || 0 }}</div>
        <div class="stat-label">完成任务数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.streakDays || 0 }}</div>
        <div class="stat-label">连续学习天数</div>
      </div>
    </div>

    <van-cell-group inset>
      <van-cell title="本周学习趋势" />
      <div class="chart-container">
        <canvas ref="weekChartRef"></canvas>
      </div>
    </van-cell-group>

    <van-cell-group inset>
      <van-cell title="分类统计" />
      <div class="chart-container">
        <canvas ref="categoryChartRef"></canvas>
      </div>
    </van-cell-group>

    <!-- Calendar -->
    <van-cell-group inset>
      <van-cell title="学习日历" is-link @click="showCalendar = true" />
    </van-cell-group>

    <van-popup v-model:show="showCalendar" position="bottom" full>
      <div class="calendar-popup">
        <div class="calendar-header">
          <van-button size="small" @click="prevMonth">&lt;</van-button>
          <span>{{ currentYear }}年{{ currentMonth }}月</span>
          <van-button size="small" @click="nextMonth">&gt;</van-button>
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
            :style="{ opacity: calendarData[day.date] ? Math.min(calendarData[day.date].totalPomodoros / 10 + 0.3, 1) : 0.3 }"
          >
            {{ day.day }}
          </div>
        </div>
        <van-button block @click="showCalendar = false">关闭</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { showToast } from 'vant'
import { recordsAPI } from '../api'

const stats = reactive({
  totalPomodoros: 0,
  totalMinutes: 0,
  completedTasks: 0,
  streakDays: 0,
  categoryStats: {},
  weekData: []
})

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
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevLastDay - i
    const date = new Date(currentYear.value, currentMonth.value - 2, d).toISOString().split('T')[0]
    days.push({ day: d, date, otherMonth: true })
  }
  
  // Current month days
  for (let i = 1; i <= lastDay; i++) {
    const date = new Date(currentYear.value, currentMonth.value - 1, i).toISOString().split('T')[0]
    days.push({ day: i, date, otherMonth: false })
  }
  
  // Next month days
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i).toISOString().split('T')[0]
    days.push({ day: i, date, otherMonth: true })
  }
  
  return days
})

const loadStats = async () => {
  try {
    const res = await recordsAPI.getStats()
    Object.assign(stats, res)
    await nextTick()
    renderCharts()
  } catch (e) {
    showToast('加载失败')
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
  
  // Simple week chart rendering (would use Chart.js in production)
  const ctx = weekChartRef.value.getContext('2d')
  const width = weekChartRef.value.width = weekChartRef.value.offsetWidth
  const height = weekChartRef.value.height = 150
  
  ctx.clearRect(0, 0, width, height)
  
  const barWidth = width / 7 - 10
  const maxValue = Math.max(...stats.weekData.map(d => d.count), 1)
  
  stats.weekData.forEach((d, i) => {
    const barHeight = (d.count / maxValue) * (height - 20)
    const x = i * (barWidth + 10) + 5
    const y = height - barHeight - 20
    
    ctx.fillStyle = '#6366f1'
    ctx.fillRect(x, y, barWidth, barHeight)
    
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(d.day, x + barWidth / 2, height - 5)
  })

  // Category chart
  if (!categoryChartRef.value) return
  const catCtx = categoryChartRef.value.getContext('2d')
  const catWidth = categoryChartRef.value.width = categoryChartRef.value.offsetWidth
  const catHeight = categoryChartRef.value.height = 150
  const radius = Math.min(catWidth, catHeight) / 2 - 20
  const centerX = catWidth / 2
  const centerY = catHeight / 2
  
  catCtx.clearRect(0, 0, catWidth, catHeight)
  
  const categories = Object.keys(stats.categoryStats)
  const total = Object.values(stats.categoryStats).reduce((a, b) => a + b, 0) || 1
  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444']
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
  background: #0f172a;
  padding: 20px;
  padding-bottom: 80px;
}

.stats-page h1 {
  font-size: 20px;
  color: #f8fafc;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: #1e293b;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #6366f1;
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.chart-container {
  padding: 12px;
  height: 150px;
}

.chart-container canvas {
  width: 100%;
  height: 100%;
}

.calendar-popup {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: #f8fafc;
  font-size: 18px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  color: #94a3b8;
  margin-bottom: 10px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  flex: 1;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #1e293b;
  color: #f8fafc;
  font-size: 14px;
}

.calendar-day.other-month {
  color: #475569;
}

.calendar-day.has-data {
  background: #6366f1;
}
</style>
