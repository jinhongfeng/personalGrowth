<template>
  <div
    class="account-row"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <div class="acct-icon" :class="bgClass">
      <q-icon :name="icon" :color="iconColor" size="16px" />
    </div>
    <div class="acct-body">
      <div class="acct-name">{{ name }}</div>
      <div class="acct-user">{{ username }}</div>
    </div>
    <q-btn flat round icon="content_copy" size="sm" class="acct-copy" @click.stop="$emit('copy', id)">
      <q-tooltip>复制密码</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id: string
  icon: string
  iconColor: string
  name: string
  username: string
}>()

defineEmits<{ click: []; copy: [id: string] }>()

const bgMap: Record<string, string> = {
  primary: 'bg-indigo',
  orange: 'bg-orange',
  green: 'bg-green',
  red: 'bg-red',
  amber: 'bg-amber',
  secondary: 'bg-teal',
}

const bgClass = computed(() => bgMap[props.iconColor] || 'bg-grey')
</script>

<style scoped>
.account-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  cursor: pointer;
  border-radius: 10px;
  outline: none;
  transition: background var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
}

.account-row:hover,
.account-row:focus-visible {
  background: var(--color-bg-hover);
  box-shadow: inset 0 0 0 1px rgba(91, 106, 191, 0.14);
}

.account-row + .account-row {
  border-top: 1px solid var(--color-bg);
}

.acct-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.bg-indigo { background: var(--color-indigo-light); }
.bg-orange { background: var(--color-orange-light); }
.bg-green { background: var(--color-success-light); }
.bg-red { background: var(--color-danger-light); }
.bg-amber { background: var(--color-warning-bg); }
.bg-teal { background: var(--color-teal-light); }
.bg-grey { background: var(--color-bg-hover); }

.acct-body {
  flex: 1;
  min-width: 0;
}

.acct-name {
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.1px;
}

.acct-user {
  font-size: var(--fs-12, 12px);
  color: var(--color-text-muted);
  margin-top: 1px;
}

.acct-copy {
  color: var(--color-text-disabled);
  flex-shrink: 0;
}

.acct-copy:hover {
  color: var(--color-primary);
}
</style>
