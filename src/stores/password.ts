import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PasswordEntry } from '@/types'
import { getPasswordEntries, savePasswordEntries } from '@/services/db'

export const usePasswordStore = defineStore('password', () => {
  const entries = ref<PasswordEntry[]>([])
  const isUnlocked = ref(false)
  const searchQuery = ref('')
  const currentCategory = ref<string>('all')
  const loaded = ref(false)

  async function fetchEntries() {
    if (!loaded.value) {
      try {
        const data = await getPasswordEntries()
        entries.value = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Failed to fetch password entries:', error)
        entries.value = []
      }
      loaded.value = true
    }
  }

  async function addEntry(data: Omit<PasswordEntry, 'id' | 'lastUpdated'>) {
    const newEntry: PasswordEntry = {
      ...data,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString()
    }
    entries.value.unshift(newEntry)
    await savePasswordEntries(entries.value)
    return newEntry
  }

  async function updateEntry(id: string, data: Partial<PasswordEntry>) {
    const index = entries.value.findIndex(e => e.id === id)
    if (index !== -1) {
      entries.value[index] = {
        ...entries.value[index],
        ...data,
        lastUpdated: new Date().toISOString()
      }
      await savePasswordEntries(entries.value)
    }
  }

  async function deleteEntry(id: string) {
    entries.value = entries.value.filter(e => e.id !== id)
    await savePasswordEntries(entries.value)
  }

  async function toggleStar(id: string) {
    const entry = entries.value.find(e => e.id === id)
    if (entry) {
      entry.isStarred = !entry.isStarred
      await savePasswordEntries(entries.value)
    }
  }

  function getEntryById(id: string) {
    return entries.value.find(e => e.id === id)
  }

  const filteredEntries = computed(() => {
    let result = entries.value
    if (currentCategory.value !== 'all') {
      result = result.filter(e => e.category === currentCategory.value)
    }
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.username.toLowerCase().includes(query)
      )
    }
    return result
  })

  const starredEntries = computed(() => entries.value.filter(e => e.isStarred))

  return {
    entries,
    isUnlocked,
    searchQuery,
    currentCategory,
    filteredEntries,
    starredEntries,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleStar,
    getEntryById
  }
})
