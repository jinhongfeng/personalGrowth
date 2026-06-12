import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GrowthRecord } from '@/types'
import { getGrowthRecords, saveGrowthRecords } from '@/services/db'

export const useGrowthStore = defineStore('growth', () => {
  const records = ref<GrowthRecord[]>([])
  const currentCategory = ref<string>('all')
  const loaded = ref(false)

  async function fetchRecords() {
    if (!loaded.value) {
      try {
        const data = await getGrowthRecords()
        records.value = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Failed to fetch growth records:', error)
        records.value = []
      }
      loaded.value = true
    }
  }

  async function addRecord(data: Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const newRecord: GrowthRecord = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    records.value.unshift(newRecord)
    await saveGrowthRecords(records.value)
    return newRecord
  }

  async function updateRecord(id: string, data: Partial<GrowthRecord>) {
    const index = records.value.findIndex(r => r.id === id)
    if (index !== -1) {
      records.value[index] = {
        ...records.value[index],
        ...data,
        updatedAt: new Date().toISOString()
      }
      await saveGrowthRecords(records.value)
    }
  }

  async function deleteRecord(id: string) {
    records.value = records.value.filter(r => r.id !== id)
    await saveGrowthRecords(records.value)
  }

  function getRecordById(id: string) {
    return records.value.find(r => r.id === id)
  }

  const filteredRecords = computed(() => {
    if (currentCategory.value === 'all') return records.value
    return records.value.filter(r => r.category === currentCategory.value)
  })

  return {
    records,
    currentCategory,
    filteredRecords,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordById
  }
})
