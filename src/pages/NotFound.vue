<template>
  <q-page padding class="not-found-page">
    <div class="page-content">
      <div class="nf-card">
        <div class="nf-icon">
          <q-icon name="explore" size="48px" color="#D1CCC6" />
        </div>
        <div class="nf-code">404</div>
        <div class="nf-title">页面走丢了</div>
        <div class="nf-desc">你访问的页面不存在或已被移除</div>
        <div class="nf-actions">
          <button class="btn-home" @click="$router.push('/')">
            <q-icon name="home" size="16px" />
            <span>回到首页</span>
          </button>
          <button class="btn-back" @click="$router.back()">
            <q-icon name="arrow_back" size="16px" />
            <span>返回上页</span>
          </button>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.not-found-page {
  background: var(--color-bg);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-content {
  max-width: 400px;
  width: 100%;
  padding: 24px;
}

.nf-card {
  background: var(--color-bg-card);
  border-radius: 20px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.nf-icon {
  margin-bottom: 20px;
}

.nf-code {
  font-size: var(--fs-56, 56px);
  font-weight: 800;
  color: var(--color-border);
  letter-spacing: -2px;
  line-height: 1;
  margin-bottom: 12px;
}

.nf-title {
  font-size: var(--fs-20, 20px);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.nf-desc {
  font-size: var(--fs-13, 13px);
  color: var(--color-text-muted);
  margin-bottom: 28px;
}

.nf-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-home {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-primary);
  color: white;
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--color-primary-glow);
}

.btn-home:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: var(--fs-13, 13px);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
