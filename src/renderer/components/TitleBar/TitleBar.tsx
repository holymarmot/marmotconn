import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { Settings, ChevronDown, Globe } from 'lucide-react'
import logoUrl from '/logo.png'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage, LangCode } from '../../i18n'

export function TitleBar() {
  const { activeRepo, activeBranch, showSettings, setShowSettings } = useAppStore()
  const { t, i18n } = useTranslation()
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  useEffect(() => {
    if (!showLangDropdown) return
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showLangDropdown])

  return (
    <header className="titlebar">
      <img
        src={logoUrl}
        alt="Marmotconn"
        style={{
          width: 22,
          height: 22,
          objectFit: 'contain',
          flexShrink: 0,
          mixBlendMode: 'screen' as const,
        }}
      />
      <span className="font-display font-bold text-sm tracking-wider text-[var(--color-accent)]">
        MARMOTCONN
      </span>

      {activeRepo && (
        <>
          <span className="text-[var(--color-text-muted)] text-xs mx-1">/</span>
          <span className="text-[var(--color-text-secondary)] text-xs font-mono truncate max-w-[200px]">
            {activeRepo.name}
          </span>
          {activeBranch && (
            <>
              <span className="text-[var(--color-text-muted)] text-xs mx-1">@</span>
              <span className="text-[var(--color-text-primary)] text-xs font-mono">
                {activeBranch}
              </span>
            </>
          )}
        </>
      )}

      <div className="flex-1" />

      {/* Language switcher */}
      <div ref={langRef} style={{ position: 'relative' }}>
        <button
          className="btn-ghost btn"
          style={{ gap: 4, padding: '3px 8px', fontSize: '0.75rem' }}
          onClick={() => setShowLangDropdown(v => !v)}
          title={t('language')}
        >
          <Globe size={13} />
          <span style={{ fontWeight: 600, letterSpacing: '0.04em' }}>{currentLang.code.toUpperCase()}</span>
          <ChevronDown size={10} />
        </button>

        {showLangDropdown && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            minWidth: 160,
            zIndex: 200,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code as LangCode); setShowLangDropdown(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 12px',
                  background: i18n.language === lang.code ? 'var(--color-surface-2)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                  color: i18n.language === lang.code ? 'var(--color-accent)' : 'var(--color-text-primary)',
                  fontWeight: i18n.language === lang.code ? 600 : 400,
                }}
                onMouseEnter={e => { if (i18n.language !== lang.code) e.currentTarget.style.background = 'var(--color-surface-2)' }}
                onMouseLeave={e => { if (i18n.language !== lang.code) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', minWidth: 22 }}>{lang.code.toUpperCase()}</span>
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className="btn-ghost btn btn-icon"
        onClick={() => setShowSettings(!showSettings)}
        title={t('titlebar.settings')}
      >
        <Settings size={14} />
      </button>
    </header>
  )
}
