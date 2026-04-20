import React, { useEffect, useRef } from 'react'
import { useAppStore } from './store/appStore'
import { TitleBar } from './components/TitleBar/TitleBar'
import { Sidebar } from './components/Sidebar/Sidebar'
import { RepoView } from './components/RepoView/RepoView'
import { WelcomeView } from './components/WelcomeView/WelcomeView'
import { CloneModal } from './components/CloneModal/CloneModal'
import { Settings } from './components/Settings/Settings'
import { ErrorToast } from './components/common/ErrorToast'
import { GitLogPanel } from './components/common/GitLogPanel'
import { PullConflictModal } from './components/common/PullConflictModal'

export default function App() {
  const {
    activeRepo,
    showCloneModal,
    showSettings,
    showPullConflictModal,
    error,
    setError,
    theme,
    loadSettings,
    loadServers,
    loadRecentRepos,
    fetchRepos,
    servers,
    gitLogs,
    refreshStatusSilent,
    silentFetch,
  } = useAppStore()

  // Polling refs so intervals always see latest activeRepo
  const activeRepoRef = useRef(activeRepo)
  activeRepoRef.current = activeRepo

  useEffect(() => {
    async function init() {
      await loadSettings()
      await loadServers()
      await loadRecentRepos()
      const currentServers = useAppStore.getState().servers
      for (const server of currentServers) {
        if (server.connected) {
          fetchRepos(server.id).catch(() => {})
        }
      }
    }
    init()
  }, [])

  // Auto-poll local status every 3 seconds (detects file changes on disk)
  useEffect(() => {
    const id = setInterval(() => {
      if (activeRepoRef.current) {
        useAppStore.getState().refreshStatusSilent()
      }
    }, 3000)
    return () => clearInterval(id)
  }, [])

  // Auto-fetch remote every 60 seconds (updates ahead/behind counts)
  useEffect(() => {
    const id = setInterval(() => {
      if (activeRepoRef.current) {
        useAppStore.getState().silentFetch()
      }
    }, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`app-layout ${theme}`} style={{ position: 'relative' }}>
      <TitleBar />
      <Sidebar />
      <main className="main-content">
        {activeRepo ? <RepoView /> : <WelcomeView />}
      </main>

      {showCloneModal && <CloneModal />}
      {showSettings && <Settings />}
      {showPullConflictModal && <PullConflictModal />}
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {gitLogs.length > 0 && <GitLogPanel />}
    </div>
  )
}
