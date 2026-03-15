<template>
  <div class="tasks-page">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title">学习任务</div>
      <van-button type="primary" size="small" round @click="showAdd = true">
        <van-icon name="plus" /> 新建
      </van-button>
    </div>

    <!-- Category Tabs -->
    <van-tabs v-model:active="activeTab" @change="loadTasks" swipeable animated>
      <van-tab title="全部" name="all" />
      <van-tab title="🎼" name="music-history" />
      <van-tab title="🎤" name="singing" />
      <van-tab title="🎹" name="improvisation" />
      <van-tab title="📚" name="teaching" />
      <van-tab title="💪" name="training" />
    </van-tabs>

    <!-- Task List -->
    <div class="task-list">
      <div 
        v-for="task in tasks" 
        :key="task.id"
        class="task-card"
        :class="{ completed: task.completed }"
      >
        <div class="task-card-inner" @click="editTask(task)">
          <div class="task-header">
            <van-tag :type="getCategoryType(task.category)" size="small" round>
              {{ categoryNames[task.category] }}
            </van-tag>
            <van-icon 
              v-if="task.completed" 
              name="success" 
              class="completed-icon" 
              color="#6DD400"
            />
          </div>
          
          <div class="task-name">{{ task.name }}</div>
          
          <div class="task-progress-section">
            <van-progress 
              :percentage="getProgress(task)" 
              :stroke-width="6" 
              :show-pivot="false"
              :color="getProgressColor(task)"
              track-color="#E8F0FE"
            />
            <div class="progress-info">
              <span class="progress-text">
                <span class="completed-count">{{ task.completedPomodoros || 0 }}</span>
                <span class="separator">/</span>
                <span class="total-count">{{ task.estimatedPomodoros }}</span>
                <span class="unit">番茄</span>
              </span>
              <span class="progress-percent">{{ getProgress(task) }}%</span>
            </div>
          </div>

          <div class="task-notes" v-if="task.notes">
            {{ task.notes }}
          </div>
        </div>

        <div class="task-actions">
          <van-button 
            size="small" 
            round 
            :type="task.completed ? 'default' : 'success'"
            @click.stop="toggleComplete(task)"
          >
            {{ task.completed ? '重做' : '完成' }}
          </van-button>
          <van-button 
            size="small" 
            round 
            type="danger"
            plain
            @click.stop="deleteTask(task.id)"
          >
            删除
          </van-button>
        </div>
      </div>

      <van-empty v-if="tasks.length === 0" description="还没有任务，点击右上角创建一个">
        <template #image>
          <span style="font-size: 64px">📝</span>
        </template>
      </van-empty>
    </div>

    <!-- Add/Edit Task Modal -->
    <van-popup v-model:show="showAdd" position="bottom" round>
      <div class="task-form">
        <div class="form-header">
          <span class="form-title">{{ editingTask ? '编辑任务' : '新建学习任务' }}</span>
          <van-icon name="cross" @click="closeForm" />
        </div>
        
        <van-form @submit="saveTask">
          <van-cell-group inset>
            <van-field
              v-model="form.name"
              name="name"
              label="任务名称"
              placeholder="例如：学习 Beethoven 第九交响曲"
              :rules="[{ required: true, message: '请输入任务名称' }]"
            />
            
            <van-field
              v-model="form.category"
              is-link
              readonly
              name="category"
              label="学习类型"
              @click="showCategory = true"
            >
              <template #input>
                <span class="category-display">{{ categoryNames[form.category] || '请选择' }}</span>
              </template>
            </van-field>
            
            <van-field
              v-model.number="form.estimatedPomodoros"
              type="digit"
              name="estimatedPomodoros"
              label="预估番茄"
              placeholder="需要多少个25分钟？"
            >
              <template #extra>
                <span class="tomato-icon">🍅</span>
              </template>
            </van-field>
            
            <van-field
              v-model="form.notes"
              type="textarea"
              name="notes"
              label="备注"
              placeholder="添加一些备注..."
              rows="2"
              autosize
            />
          </van-cell-group>

          <div class="form-tips">
            💡 番茄工作法：1个番茄 = 25分钟专注学习
          </div>

          <div class="form-actions">
            <van-button @click="closeForm">取消</van-button>
            <van-button type="primary" native-type="submit">
              {{ editingTask ? '保存' : '创建任务' }}
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- Category Picker -->
    <van-action-sheet
      v-model:show="showCategory"
      title="选择学习类型"
      :actions="categories"
      @select="onSelectCategory"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { showToast, showConfirmDialog, showNotify } from 'vant'
import { tasksAPI } from '../api'

const categoryNames = {
  'music-history': '🎼 音乐历史',
  'singing': '🎤 演唱练习',
  'improvisation': '🎹 即兴伴奏',
  'teaching': '📚 教学试讲',
  'training': '💪 辅助训练'
}

const categories = [
  { name: '🎼 音乐历史学习', subname: '音乐史、乐理知识', value: 'music-history' },
  { name: '🎤 演唱练习', subname: '声乐练习、歌曲演唱', value: 'singing' },
  { name: '🎹 即兴伴奏训练', subname: '键盘伴奏、即兴训练', value: 'improvisation' },
  { name: '📚 教学试讲准备', subname: '教学备课、试讲练习', value: 'teaching' },
  { name: '💪 辅助训练', subname: '体能训练如平板支撑', value: 'training' }
]

const activeTab = ref('all')
const tasks = ref([])
const showAdd = ref(false)
const showCategory = ref(false)
const editingTask = ref(null)

const form = reactive({
  name: '',
  category: 'music-history',
  estimatedPomodoros: 4,
  notes: ''
})

const getCategoryType = (category) => {
  const types = {
    'music-history': 'primary',
    'singing': 'warning',
    'improvisation': 'danger',
    'teaching': 'default',
    'training': 'success'
  }
  return types[category] || 'primary'
}

const getProgress = (task) => {
  if (!task.estimatedPomodoros) return 0
  return Math.round(((task.completedPomodoros || 0) / task.estimatedPomodoros) * 100)
}

const getProgressColor = (task) => {
  const progress = getProgress(task)
  if (progress >= 100) return '#6DD400'
  if (progress >= 50) return '#FF8F00'
  return 'linear-gradient(90deg, #5B8FF9, #14C4E4)'
}

const loadTasks = async () => {
  try {
    const res = await tasksAPI.getAll(activeTab.value)
    tasks.value = res.tasks
  } catch (e) {
    showToast('加载失败')
  }
}

const editTask = (task) => {
  editingTask.value = task
  form.name = task.name
  form.category = task.category
  form.estimatedPomodoros = task.estimatedPomodoros
  form.notes = task.notes
  showAdd.value = true
}

const saveTask = async () => {
  try {
    if (editingTask.value) {
      await tasksAPI.update(editingTask.value.id, form)
      showToast('更新成功')
    } else {
      await tasksAPI.create(form)
      showNotify({ type: 'success', message: '任务创建成功！' })
    }
    closeForm()
    loadTasks()
  } catch (e) {
    showToast(e.response?.data?.error || '保存失败')
  }
}

const deleteTask = async (id) => {
  try {
    await showConfirmDialog({ 
      title: '删除任务', 
      message: '确定要删除这个学习任务吗？',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await tasksAPI.delete(id)
    showToast('已删除')
    loadTasks()
  } catch (e) {
    if (e !== 'cancel') {
      showToast('删除失败')
    }
  }
}

const toggleComplete = async (task) => {
  try {
    const newCompleted = !task.completed
    await tasksAPI.update(task.id, { completed: newCompleted })
    showToast(newCompleted ? '标记为完成' : '重新开始')
    loadTasks()
  } catch (e) {
    showToast('操作失败')
  }
}

const onSelectCategory = (action) => {
  form.category = action.value
  showCategory.value = false
}

const closeForm = () => {
  showAdd.value = false
  editingTask.value = null
  form.name = ''
  form.category = 'music-history'
  form.estimatedPomodoros = 4
  form.notes = ''
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.tasks-page {
  min-height: 100vh;
  background: #F7F8FA;
  padding-bottom: 80px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1F1F1F;
}

.task-list {
  padding: 16px;
}

.task-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.task-card.completed {
  opacity: 0.7;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.completed-icon {
  font-size: 20px;
}

.task-name {
  font-size: 18px;
  font-weight: 600;
  color: #1F1F1F;
  margin-bottom: 16px;
}

.task-progress-section {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999999;
  margin-top: 8px;
}

.progress-text .completed-count {
  font-size: 18px;
  font-weight: 600;
  color: #5B8FF9;
}

.progress-text .separator {
  margin: 0 2px;
}

.progress-text .unit {
  margin-left: 4px;
}

.task-notes {
  font-size: 13px;
  color: #999999;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F0F0F0;
}

.task-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F0F0F0;
}

.task-actions .van-button {
  flex: 1;
}

/* Form */
.task-form {
  padding: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
}

.form-tips {
  padding: 12px 16px;
  font-size: 13px;
  color: #999999;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.form-actions .van-button {
  flex: 1;
}

.category-display {
  color: #1F1F1F;
}

.tomato-icon {
  font-size: 16px;
}
</style>
