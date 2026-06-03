<template>
  <div class="browser" :class="[`theme-${config.theme}`]">
    <template v-if="config.showHeader">
      <div class="titlebar" @dblclick="toggleMaximize">
        <div class="titlebar-drag">
          <div class="browser-logo" v-if="config.logo">
            <img :src="config.logo" alt="logo" />
          </div>
          <svg v-else class="logo-icon" width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="none" stroke="#4a9eff" stroke-width="1.5"/>
            <circle cx="8" cy="8" r="3" fill="#4a9eff"/>
          </svg>
          <span class="browser-title">{{ config.title }}</span>
        </div>
        <div class="window-controls">
          <button class="win-btn minimize" @click="minimize" title="最小化">
            <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
          </button>
          <button class="win-btn maximize" @click="toggleMaximize" :title="isMaximized ? '还原' : '最大化'">
            <svg v-if="!isMaximized" width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg>
            <svg v-else width="10" height="10" viewBox="0 0 10 10">
              <rect x="2" y="0" width="7.5" height="7.5" fill="none" stroke="currentColor" stroke-width="1"/>
              <rect x="0" y="2.5" width="7.5" height="7.5" fill="var(--bg-primary)" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
          <button class="win-btn close" @click="closeWindow" title="关闭">
            <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.2"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
        </div>
      </div>

      <div class="tab-bar" v-if="config.showTabBar">
        <div class="tabs-container" ref="tabsContainer">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ active: tab.id === activeTabId, loading: tab.loading }"
            @mousedown="switchTab(tab.id)"
            :title="tab.title || '新标签页'"
          >
            <div class="tab-favicon">
              <div v-if="tab.loading" class="tab-spinner"></div>
              <img v-else-if="tab.favicon" :src="tab.favicon" />
              <svg v-else width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" fill="none" stroke="#666" stroke-width="1.2"/>
                <circle cx="8" cy="8" r="2" fill="#666"/>
              </svg>
            </div>
            <span class="tab-title">{{ tab.title || '新标签页' }}</span>
            <button class="tab-close" @mousedown.stop="closeTab(tab.id)" title="关闭标签页">
              <svg width="8" height="8" viewBox="0 0 8 8"><line x1="1" y1="1" x2="7" y2="7" stroke="currentColor" stroke-width="1.2"/><line x1="7" y1="1" x2="1" y2="7" stroke="currentColor" stroke-width="1.2"/></svg>
            </button>
          </div>
        </div>
        <button class="new-tab-btn" @mousedown="addTab" title="新标签页 (Ctrl+T)">
          <svg width="14" height="14" viewBox="0 0 14 14"><line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </template>

    <div class="toolbar" v-if="config.showAddressBar">
      <div class="nav-buttons" v-if="config.showNavigationButtons">
        <button class="nav-btn" @click="goBack" :disabled="!canGoBack" title="后退 (Alt+←)">
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 2L4 8l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="nav-btn" @click="goForward" :disabled="!canGoForward" title="前进 (Alt+→)">
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="nav-btn" @click="reload" title="刷新 (Ctrl+R / F5)">
          <svg v-if="!currentTab?.loading" width="16" height="16" viewBox="0 0 16 16">
            <path d="M13.5 8a5.5 5.5 0 11-2.1-4.3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M13.5 2v3.5H10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 16 16">
            <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="nav-btn" @click="goHome" title="主页 (Alt+Home)">
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8.5V14h4v-4h2v4h4V8.5M1 8l7-6 7 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="address-bar" :class="{ focused: addressFocused }">
        <div class="security-icon">
          <svg v-if="currentTab && isSecureUrl(currentTab.url)" width="14" height="14" viewBox="0 0 14 14">
            <rect x="2" y="6" width="10" height="7" rx="1.5" fill="none" stroke="#34a853" stroke-width="1.3"/>
            <path d="M4 6V4.5a3 3 0 016 0V6" fill="none" stroke="#34a853" stroke-width="1.3"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5.5" fill="none" stroke="#888" stroke-width="1"/>
            <line x1="7" y1="4" x2="7" y2="8" stroke="#888" stroke-width="1.3"/>
            <circle cx="7" cy="10" r="0.8" fill="#888"/>
          </svg>
        </div>
        <input
          ref="addressInput"
          type="text"
          class="address-input"
          :value="displayUrl"
          @keydown.enter="navigateTo"
          @focus="onAddressFocus"
          @blur="onAddressBlur"
          placeholder="搜索或输入网址"
          spellcheck="false"
        />
        <button class="nav-btn icon-small" @click="reload" :title="currentTab?.loading ? '停止 (Esc)' : '刷新'">
          <svg v-if="!currentTab?.loading" width="14" height="14" viewBox="0 0 16 16">
            <path d="M13.5 8a5.5 5.5 0 11-2.1-4.3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M13.5 2v3.5H10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 16 16">
            <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="webview-container">
      <div v-if="isLoading" class="loading-bar">
        <div class="loading-progress"></div>
      </div>
      <webview
        v-for="tab in tabs"
        :key="tab.id"
        :src="tab.url"
        :data-tab-id="tab.id"
        class="webview"
        :class="{ visible: tab.id === activeTabId }"
        allowpopups
        disablewebsecurity
        @did-start-navigation="onNavigationStart(tab, $event)"
        @did-navigate="onNavigate(tab, $event)"
        @did-navigate-in-page="onNavigateInPage(tab, $event)"
        @page-title-updated="onTitleUpdated(tab, $event)"
        @page-favicon-updated="onFaviconUpdated(tab, $event)"
        @did-start-loading="onStartLoading(tab)"
        @did-stop-loading="onStopLoading(tab)"
        @did-fail-load="onFailLoad(tab, $event)"
        @new-window="onNewWindow(tab, $event)"
        @dom-ready="onDomReady(tab)"
      ></webview>
      <div v-if="tabs.length === 0" class="empty-state">
        <button class="new-tab-large" @mousedown="addTab">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <line x1="24" y1="12" x2="24" y2="36" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            <line x1="12" y1="24" x2="36" y2="24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <span>打开新标签页</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { browserConfig } from './config.js'

export default {
  name: 'App',
  setup() {
    const config = reactive({ ...browserConfig })
    const tabs = reactive([])
    const activeTabId = ref(null)
    const isMaximized = ref(false)
    const canGoBack = ref(false)
    const canGoForward = ref(false)
    const addressInput = ref(null)
    const tabsContainer = ref(null)
    const addressFocused = ref(false)
    const isLoading = ref(false)
    let tabCounter = 0

    const currentTab = computed(() => tabs.find(t => t.id === activeTabId.value))

    const displayUrl = computed(() => {
      if (!currentTab.value) return ''
      if (addressFocused.value) return currentTab.value.url || ''
      return formatDisplayUrl(currentTab.value.url || '')
    })

    function formatDisplayUrl(url) {
      if (!url) return ''
      try {
        const u = new URL(url)
        let display = u.hostname
        if (u.pathname && u.pathname !== '/') display += u.pathname
        if (u.search) display += u.search
        return decodeURIComponent(display)
      } catch {
        return url
      }
    }

    function isSecureUrl(url) {
      if (!url) return false
      return url.startsWith('https://')
    }

    function createTab(url) {
      tabCounter++
      const tab = reactive({
        id: `tab-${tabCounter}`,
        url: url || config.newTabUrl,
        title: '新标签页',
        favicon: null,
        loading: false
      })
      tabs.push(tab)
      activeTabId.value = tab.id
      return tab
    }

    function addTab() {
      createTab(config.newTabUrl)
    }

    function switchTab(tabId) {
      activeTabId.value = tabId
      nextTick(updateNavState)
    }

    function closeTab(tabId) {
      const index = tabs.findIndex(t => t.id === tabId)
      if (index === -1) return
      tabs.splice(index, 1)
      if (activeTabId.value === tabId) {
        if (tabs.length > 0) {
          const newIndex = Math.min(index, tabs.length - 1)
          activeTabId.value = tabs[newIndex].id
        }
      }
      nextTick(updateNavState)
    }

    function navigateTo(event) {
      let url = event.target.value.trim()
      if (!url) return
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
        if (/^[\w-]+(\.[\w-]+)+/.test(url) && !url.includes(' ')) {
          url = 'https://' + url
        } else {
          url = config.searchEngine + encodeURIComponent(url)
        }
      }
      const tab = currentTab.value
      if (tab) {
        tab.url = url
        const wv = getWebview(tab.id)
        if (wv) wv.loadURL(url)
      }
      event.target.blur()
    }

    function goBack() {
      const wv = getActiveWebview()
      if (wv && wv.canGoBack()) wv.goBack()
    }

    function goForward() {
      const wv = getActiveWebview()
      if (wv && wv.canGoForward()) wv.goForward()
    }

    function reload() {
      const tab = currentTab.value
      if (!tab) return
      if (tab.loading) {
        const wv = getActiveWebview()
        if (wv) wv.stop()
      } else {
        const wv = getActiveWebview()
        if (wv) wv.reload()
      }
    }

    function goHome() {
      const tab = currentTab.value
      if (tab) {
        tab.url = config.homeUrl
        const wv = getActiveWebview()
        if (wv) wv.loadURL(config.homeUrl)
      }
    }

    function getWebview(tabId) {
      return document.querySelector(`webview[data-tab-id="${tabId}"]`)
    }

    function getActiveWebview() {
      return getWebview(activeTabId.value)
    }

    function updateNavState() {
      const wv = getActiveWebview()
      if (wv) {
        try {
          canGoBack.value = wv.canGoBack()
          canGoForward.value = wv.canGoForward()
        } catch {
          canGoBack.value = false
          canGoForward.value = false
        }
      } else {
        canGoBack.value = false
        canGoForward.value = false
      }
    }

    function onNavigationStart(tab, event) {
      if (event.url && event.url !== 'about:blank') {
        tab.url = event.url
      }
    }

    function onNavigate(tab, event) {
      if (event.url) {
        tab.url = event.url
      }
      nextTick(updateNavState)
    }

    function onNavigateInPage(tab, event) {
      if (event.url) {
        tab.url = event.url
      }
      nextTick(updateNavState)
    }

    function onTitleUpdated(tab, event) {
      tab.title = event.title || '新标签页'
    }

    function onFaviconUpdated(tab, event) {
      if (event.favicons && event.favicons.length > 0) {
        tab.favicon = event.favicons[0]
      }
    }

    function onStartLoading(tab) {
      tab.loading = true
      isLoading.value = true
    }

    function onStopLoading(tab) {
      tab.loading = false
      isLoading.value = tabs.some(t => t.loading)
      nextTick(updateNavState)
    }

    function onFailLoad(tab, event) {
      tab.loading = false
      isLoading.value = tabs.some(t => t.loading)
      if (event.errorCode !== -3) {
        tab.title = '加载失败'
      }
    }

    function onNewWindow(tab, event) {
      event.preventDefault()
      const newTab = createTab(event.url)
      nextTick(() => {
        const wv = getWebview(newTab.id)
        if (wv) {
          try { wv.loadURL(event.url) } catch {}
        }
      })
    }

    function onDomReady(tab) {
      nextTick(updateNavState)
    }

    function onAddressFocus(event) {
      addressFocused.value = true
      nextTick(() => {
        event.target.select()
      })
    }

    function onAddressBlur() {
      addressFocused.value = false
    }

    function minimize() {
      window.electronAPI.minimize()
    }

    function toggleMaximize() {
      window.electronAPI.maximize()
    }

    function closeWindow() {
      window.electronAPI.close()
    }

    function setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 't') {
          e.preventDefault()
          addTab()
        } else if (e.ctrlKey && e.key === 'w') {
          e.preventDefault()
          if (currentTab.value) closeTab(currentTab.value.id)
        } else if (e.ctrlKey && e.key === 'Tab') {
          e.preventDefault()
          if (tabs.length > 1) {
            const index = tabs.findIndex(t => t.id === activeTabId.value)
            const nextIndex = e.shiftKey ? (index - 1 + tabs.length) % tabs.length : (index + 1) % tabs.length
            switchTab(tabs[nextIndex].id)
          }
        } else if (e.ctrlKey && e.key === 'l') {
          e.preventDefault()
          if (addressInput.value) addressInput.value.focus()
        } else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
          e.preventDefault()
          reload()
        } else if (e.altKey && e.key === 'Home') {
          e.preventDefault()
          goHome()
        } else if (e.altKey && e.key === 'ArrowLeft') {
          e.preventDefault()
          goBack()
        } else if (e.altKey && e.key === 'ArrowRight') {
          e.preventDefault()
          goForward()
        } else if (e.key === 'Escape') {
          const wv = getActiveWebview()
          if (wv && currentTab.value && currentTab.value.loading) {
            wv.stop()
          }
        } else if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
          e.preventDefault()
          const index = parseInt(e.key) - 1
          if (index < tabs.length) {
            switchTab(tabs[index].id)
          } else if (e.key === '9') {
            switchTab(tabs[tabs.length - 1].id)
          }
        }
      })
    }

    watch(activeTabId, () => {
      nextTick(updateNavState)
    })

    onMounted(() => {
      isMaximized.value = window.electronAPI.isMaximized()
      window.electronAPI.onMaximizedChanged((maximized) => {
        isMaximized.value = maximized
      })
      createTab(config.newTabUrl)
      setupKeyboardShortcuts()
    })

    return {
      config,
      tabs,
      activeTabId,
      isMaximized,
      canGoBack,
      canGoForward,
      addressInput,
      tabsContainer,
      addressFocused,
      isLoading,
      currentTab,
      displayUrl,
      addTab,
      switchTab,
      closeTab,
      navigateTo,
      goBack,
      goForward,
      reload,
      goHome,
      minimize,
      toggleMaximize,
      closeWindow,
      isSecureUrl,
      onNavigationStart,
      onNavigate,
      onNavigateInPage,
      onTitleUpdated,
      onFaviconUpdated,
      onStartLoading,
      onStopLoading,
      onFailLoad,
      onNewWindow,
      onDomReady,
      onAddressFocus,
      onAddressBlur
    }
  }
}
</script>

<style>
:root {
  --bg-primary: #1f1f1f;
  --bg-secondary: #2b2b2b;
  --bg-tertiary: #383838;
  --bg-hover: rgba(255,255,255,0.08);
  --bg-active: rgba(255,255,255,0.12);
  --text-primary: #e0e0e0;
  --text-secondary: #999;
  --border-color: #3c3c3c;
  --accent: #4a9eff;
  --tab-active-bg: #383838;
  --tab-hover-bg: rgba(255,255,255,0.06);
  --toolbar-bg: #2b2b2b;
  --address-bg: #1f1f1f;
  --address-border: #444;
  --address-focus-border: #4a9eff;
  --close-hover: #e81123;
  --loading-color: #4a9eff;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Segoe UI', 'Microsoft YaHei', system-ui, -apple-system, sans-serif;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  user-select: none;
}

.browser {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  background: var(--bg-primary);
  -webkit-app-region: drag;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.titlebar-drag {
  display: flex;
  align-items: center;
  padding-left: 12px;
  gap: 8px;
  flex: 1;
  height: 100%;
}

.browser-logo img {
  width: 16px;
  height: 16px;
}

.logo-icon {
  flex-shrink: 0;
}

.browser-title {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 400;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
  height: 100%;
}

.win-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
}

.win-btn:hover { background: var(--bg-hover); }
.win-btn.close:hover { background: var(--close-hover); color: white; }

.tab-bar {
  display: flex;
  align-items: flex-end;
  height: 38px;
  background: var(--bg-primary);
  padding: 0 8px;
  -webkit-app-region: no-drag;
  flex-shrink: 0;
}

.tabs-container {
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 1px;
  align-items: flex-end;
  padding-bottom: 0;
}

.tabs-container::-webkit-scrollbar { display: none; }

.tab {
  display: flex;
  align-items: center;
  height: 34px;
  min-width: 60px;
  max-width: 240px;
  padding: 0 12px 0 12px;
  gap: 8px;
  background: transparent;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
  position: relative;
}

.tab:hover { background: var(--tab-hover-bg); }
.tab.active { background: var(--tab-active-bg); }

.tab-favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-favicon img { width: 16px; height: 16px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tab-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--text-secondary);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.tab-title {
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
  line-height: 34px;
}

.tab.active .tab-title { color: var(--text-primary); font-weight: 500; }

.tab-close {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.1s;
  margin-right: -4px;
}

.tab:hover .tab-close { opacity: 1; }
.tab-close:hover { background: var(--bg-hover); color: var(--text-primary); }

.new-tab-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-left: 2px;
  margin-bottom: 2px;
  transition: all 0.15s;
}

.new-tab-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

.toolbar {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 8px;
  gap: 6px;
  background: var(--toolbar-bg);
  -webkit-app-region: no-drag;
  flex-shrink: 0;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
  flex-shrink: 0;
}

.nav-btn:hover:not(:disabled) { background: var(--bg-hover); }
.nav-btn:disabled { opacity: 0.3; cursor: default; }
.nav-btn.icon-small { width: 26px; height: 26px; }

.address-bar {
  flex: 1;
  display: flex;
  align-items: center;
  height: 32px;
  background: var(--address-bg);
  border: 1.5px solid var(--address-border);
  border-radius: 20px;
  padding: 0 6px 0 12px;
  gap: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.address-bar.focused {
  border-color: var(--address-focus-border);
  box-shadow: 0 0 0 1px var(--address-focus-border);
}

.security-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.address-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  font-family: inherit;
  line-height: 30px;
}

.address-input::placeholder { color: var(--text-secondary); }

.webview-container {
  flex: 1;
  position: relative;
  background: #fff;
  overflow: hidden;
}

.loading-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 10;
  overflow: hidden;
  background: transparent;
}

.loading-progress {
  height: 100%;
  background: var(--loading-color);
  width: 30%;
  animation: loading-slide 1.5s ease-in-out infinite;
  border-radius: 0 2px 2px 0;
}

@keyframes loading-slide {
  0% { transform: translateX(-100%); width: 30%; }
  50% { width: 60%; }
  100% { transform: translateX(400%); width: 30%; }
}

.webview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  visibility: hidden;
  z-index: 0;
}

.webview.visible {
  visibility: visible;
  z-index: 1;
}

.empty-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
}

.new-tab-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.new-tab-large:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(74, 158, 255, 0.05);
}
</style>
