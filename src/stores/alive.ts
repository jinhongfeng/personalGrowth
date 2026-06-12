import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, AliveTask, TaskLog } from '@/types'
import { getTaskLogs, saveTaskLogs, getUserProfile, saveUserProfile } from '@/services/db'

export const useAliveStore = defineStore('alive', () => {
  const userProfile = ref<UserProfile | null>(null)
  const currentTask = ref<AliveTask | null>(null)
  const taskLogs = ref<TaskLog[]>([])
  const taskHistory = ref<string[]>([])
  const loaded = ref(false)

  async function fetchTaskLogs() {
    if (!loaded.value) {
      try {
        const data = await getTaskLogs()
        taskLogs.value = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Failed to fetch task logs:', error)
        taskLogs.value = []
      }
      loaded.value = true
    }
  }

  async function fetchUserProfile() {
    try {
      userProfile.value = await getUserProfile()
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      userProfile.value = null
    }
  }

  async function saveProfile(data: UserProfile) {
    userProfile.value = data
    await saveUserProfile(data)
  }

  async function skipTask() {
    if (currentTask.value) {
      taskHistory.value.push(currentTask.value.id)
    }
    currentTask.value = null
  }

  async function completeTask(feedback: { beforeScore: number; afterScore: number; notes: string }) {
    if (currentTask.value) {
      const log: TaskLog = {
        id: Date.now().toString(),
        taskId: currentTask.value.id,
        executedAt: new Date().toISOString(),
        beforeScore: feedback.beforeScore,
        afterScore: feedback.afterScore,
        feedback: feedback.notes
      }
      taskLogs.value.unshift(log)
      await saveTaskLogs(taskLogs.value)
      currentTask.value = null
    }
  }

  const recentLogs = computed(() => taskLogs.value.slice(0, 10))

  const totalCompleted = computed(() => taskLogs.value.length)

  const averageImprovement = computed(() => {
    if (taskLogs.value.length === 0) return 0
    const total = taskLogs.value.reduce((sum, log) => sum + (log.afterScore - log.beforeScore), 0)
    return Math.round(total / taskLogs.value.length * 10) / 10
  })

  return {
    userProfile,
    currentTask,
    taskLogs,
    recentLogs,
    totalCompleted,
    averageImprovement,
    fetchTaskLogs,
    fetchUserProfile,
    saveProfile,
    skipTask,
    completeTask
  }
})
