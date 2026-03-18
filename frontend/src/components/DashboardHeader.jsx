import { Languages, Moon, Sun } from 'lucide-react'

function DashboardHeader({
  headerGlassClass,
  isLightMode,
  text,
  navActiveClass,
  navInactiveClass,
  navigate,
  isFlowView,
  themeToggleClass,
  setTheme,
  languageWrapperClass,
  language,
  setLanguage,
  refreshButtonClass,
  loadDashboard,
}) {
  return (
    <header className={headerGlassClass}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-2.5 md:py-3">
        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-1.5 md:flex">
            <button onClick={() => navigate('/')} className={!isFlowView ? navActiveClass : navInactiveClass}>
              {text.navOverview}
            </button>
            <button onClick={() => navigate('/flow')} className={isFlowView ? navActiveClass : navInactiveClass}>
              {text.navFlow}
            </button>
            <button className={navInactiveClass}>
              {text.navAssets}
            </button>
            <button className={navInactiveClass}>
              {text.navConnections}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTheme(isLightMode ? 'dark' : 'light')}
            className={themeToggleClass}
          >
            {isLightMode ? <Moon className="h-3.5 w-3.5 shrink-0" /> : <Sun className="h-3.5 w-3.5 shrink-0" />}
            <span className="leading-none">{isLightMode ? text.darkMode : text.lightMode}</span>
          </button>

          <button
            onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
            className={languageWrapperClass}
          >
            <Languages className="h-3.5 w-3.5 shrink-0" />
            <span className="leading-none">{language === 'pt' ? 'EN' : 'PT'}</span>
          </button>

          <button
            onClick={loadDashboard}
            className={refreshButtonClass}
          >
            {text.refresh}
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
