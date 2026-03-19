import { useState } from 'react'
import { Compass, Languages, Menu, Moon, RefreshCw, Sun, X } from 'lucide-react'

function DashboardHeader({
  headerGlassClass,
  isLightMode,
  text,
  navActiveClass,
  navInactiveClass,
  navigate,
  isFlowView,
  isAssetsView,
  isConnectionsView,
  themeToggleClass,
  setTheme,
  languageWrapperClass,
  language,
  setLanguage,
  refreshButtonClass,
  loadDashboard,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavigate = (path) => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  const mobileNavButtonBase = 'w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition'
  const mobileNavActiveClass = `${mobileNavButtonBase} bg-[rgba(31,103,255,0.85)] text-white`
  const mobileNavInactiveClass = isLightMode
    ? `${mobileNavButtonBase} text-zinc-700 hover:bg-[rgba(31,103,255,0.12)]`
    : `${mobileNavButtonBase} text-zinc-300 hover:bg-[rgba(31,103,255,0.22)]`

  return (
    <header className={headerGlassClass}>
      <div className="mx-auto w-full max-w-7xl px-6 py-2.5 md:py-3">
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-6">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg md:hidden ${isLightMode ? 'bg-white text-zinc-700' : 'bg-zinc-900/70 text-zinc-300'}`}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <button
              onClick={() => navigate('/')}
              className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-lg font-bold tracking-tight md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:text-xl ${isLightMode ? 'text-zinc-900' : 'text-zinc-100'}`}
              aria-label="Go to overview"
            >
              <Compass className="h-6 w-6 md:h-7 md:w-7" />
              <span>Wallet Hub</span>
            </button>

            <nav className="hidden items-center gap-1.5 md:flex md:w-auto">
              <button onClick={() => navigate('/')} className={!isFlowView && !isAssetsView && !isConnectionsView ? navActiveClass : navInactiveClass}>
                {text.navOverview}
              </button>
              <button onClick={() => navigate('/flow')} className={isFlowView ? navActiveClass : navInactiveClass}>
                {text.navFlow}
              </button>
              <button onClick={() => navigate('/assets')} className={isAssetsView ? navActiveClass : navInactiveClass}>
                {text.navAssets}
              </button>
              <button onClick={() => navigate('/connections')} className={isConnectionsView ? navActiveClass : navInactiveClass}>
                {text.navConnections}
              </button>
            </nav>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={() => setTheme(isLightMode ? 'dark' : 'light')}
              className={themeToggleClass}
              aria-label={isLightMode ? text.darkMode : text.lightMode}
            >
              {isLightMode ? <Moon className="h-3.5 w-3.5 shrink-0" /> : <Sun className="h-3.5 w-3.5 shrink-0" />}
              <span className="hidden leading-none md:inline">{isLightMode ? text.darkMode : text.lightMode}</span>
            </button>

            <button
              onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
              className={languageWrapperClass}
              aria-label={language === 'pt' ? 'Switch language to English' : 'Trocar idioma para Português'}
            >
              <Languages className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden leading-none md:inline">{language === 'pt' ? 'EN' : 'PT'}</span>
            </button>

            <button
              onClick={loadDashboard}
              className={`${refreshButtonClass} gap-1.5 md:gap-2`}
              aria-label={text.refresh}
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">{text.refresh}</span>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className={`mt-2 grid gap-1 rounded-xl border p-2 md:hidden ${isLightMode ? 'border-zinc-300 bg-white/80' : 'border-zinc-700 bg-zinc-900/70'}`}>
            <button onClick={() => handleNavigate('/')} className={!isFlowView && !isAssetsView && !isConnectionsView ? mobileNavActiveClass : mobileNavInactiveClass}>
              {text.navOverview}
            </button>
            <button onClick={() => handleNavigate('/flow')} className={isFlowView ? mobileNavActiveClass : mobileNavInactiveClass}>
              {text.navFlow}
            </button>
            <button onClick={() => handleNavigate('/assets')} className={isAssetsView ? mobileNavActiveClass : mobileNavInactiveClass}>
              {text.navAssets}
            </button>
            <button onClick={() => handleNavigate('/connections')} className={isConnectionsView ? mobileNavActiveClass : mobileNavInactiveClass}>
              {text.navConnections}
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}

export default DashboardHeader
