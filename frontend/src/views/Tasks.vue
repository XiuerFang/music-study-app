<template>
  <div class="tasks-page">
    <div class="header">
      <h1>任务管理</h1>
      <van-button type="primary" size="small" @click="showAdd = true">+ 添加</van-button>
    </div>

    <van-tabs v-model:active="activeTab" @change="loadTasks">
      <van-tab title="全部" name="all" />
      <van-tab title="🎼" name="music-history" />
      <van-tab title="🎤" name="singing" />
      <van-tab title="🎹" name="improvisation" />
      <van-tab title="📚" name="teaching" />
      <van-tab title="💪" name="training" />
    </van-tabs>

    <div class="task-list">
      <van-swipe-cell v-for="task in tasks" :key="task.id">
        <van-cell>
          <template #title>
            <div class="task-item" @click="selectTask(task)">
              <div class="task-name">{{ task.name }}</div>
              <van-progress 
                :percentage="getProgress(task)" 
                :stroke-width="6" 
                :show-pivot="false"
                color="#6366f1"
              />
              <div class="task-meta">
                {{ categoryNames[task.category] }} · {{ task.completedPomodoros || 0 }}/{{ task.estimatedPomodoros }} 番茄
              </div>
            </div>
          </template>
          <template #right>
            <van-button square type="primary" text="编辑" @click="editTask(task)" />
            <van-button square type="danger" text="删除" @click="deleteTask(task.id)" />
          </template>
        </van-cell>
      </van-swipe-cell>

      <van-empty v-if="tasks.length === 0" description="暂无任务" />
    </div>

    <!-- Add/Edit Task Modal -->
    <van-popup v-model:show="showAdd" position="bottom">
      <div class="task-form">
        <div class="form-title">{{ editingTask ? '编辑任务' : '添加任务' }}</div>
        <van-form @submit="saveTask">
          <van-cell-group inset>
            <van-field
              v-model="form.name"
              name="name"
              label="任务名称"
              placeholder="请输入任务名称"
              :rules="[{ required: true }]"
            />
            <van-field
              v-model="form.category"
              is-link
              readonly
              name="category"
              label="类型"
              @click="showCategory = true"
            />
            <van-field
              v-model.number="form.estimatedPomodoros"
              type="digit"
              name="estimatedPomodoros"
              label="预估番茄"
              placeholder="请输入预估番茄数"
            />
            <van-field
              v-model="form.notes"
              type="textarea"
              name="notes"
              label="备注"
              placeholder="请输入备注"
              rows="2"
            />
          </van-cell-group>
          <div class="form-btn">
            <van-button @click="showAdd = false">取消</van-button>
            <van-button type="primary" native-type="submit">保存</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <van-action-sheet
      v-model:show="showCategory"
      :actions="categories"
      @select="onSelectCategory"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { tasksAPI } from '../api'

const categoryNames = {
  'music-history': '🎼 音乐历史',
  'singing': '🎤 演唱练习',
  'improvisation': '🎹 即兴伴奏',
  'teaching': '📚 教学试讲',
  'training': '💪 辅助训练'
}

const categories = Object.entries(categoryNames).map(([value, name]) => ({ name, value }))

const activeTab = ref('all')
const tasks = ref([])
const showAdd = ref(false)
const showCategory = ref(false)
const editingTask = ref(null)

const form = reactive({
  name: '',
  category: 'music-history',
  estimatedPomodoros: 1,
  notes: ''
})

const getProgress = (task) => {
  if (!task.estimatedPomodoros) return 0
  return Math.round(((task.completedPomodoros || 0) / task.estimatedPomodoros) * 100)
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
      showToast('创建成功')
    }
    showAdd.value = false
    editingTask.value = null
    resetForm()
    loadTasks()
  } catch (e) {
    showToast(e.response?.data?.error || '保存失败')
  }
}

const deleteTask = async (id) => {
  try {
    await showConfirmDialog({ title: '确认删除', message: '确定要删除这个任务吗？' })
    await tasksAPI.delete(id)
    showToast('删除成功')
    loadTasks()
  } catch (e) {
    if (e !== 'cancel') {
      showToast('删除失败')
    }
  }
}

const selectTask = (task) => {
  showToast(`已选择任务: ${task.name}`)
}

const onSelectCategory = (action) => {
  form.category = action.value
  showCategory.value = false
}

const resetForm = () => {
  form.name = ''
  form.category = 'music-history'
  form.estimatedPomodoros = 1
  form.notes = ''
  editingTask.value = null
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.tasks-page {
  min-height: 100vh;
  background: #0f172a;
  padding-bottom: 50px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.header h1 {
  font-size: 20px;
  color: #f8fafc;
}

.task-list {
  padding: 12px;
}

.task-item {
  padding: 8px 0;
}

.task-name {
  font-size: 16px;
  color: #f8fafc;
  margin-bottom: 8px;
}

.task-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}

.task-form {
  padding: 20px;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
}

.form-btn {
  display: flex;
  gap: 12px;
  padding: 20px;
}

.form-btn .van-button {
  flex: 1;
}
</style>
