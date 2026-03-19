import { GithubIcon, Globe, LinkedinIcon } from 'lucide-react'

function DashboardFooter({ isLightMode, secondaryTextClass, text, lastSyncedText }) {
  return (
    <footer className={`mt-10 border-t pt-3 ${isLightMode ? 'border-zinc-300/60' : 'border-zinc-800/70'}`}>
      <div className={`flex flex-col gap-2 text-[11px] md:flex-row md:items-center md:justify-between ${secondaryTextClass}`}>
        <div className="md:hidden">
          <p className="flex flex-wrap items-center gap-1.5 font-medium">
            <span>{text.appVersion}</span>
            <span className={isLightMode ? 'text-zinc-500' : 'text-zinc-400'}>•</span>
            <span className={isLightMode ? 'text-zinc-500' : 'text-zinc-400'}>socials:</span>
            <a
              href="https://github.com/gabrtzweb"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className={`rounded p-0.5 transition-colors ${isLightMode ? 'text-zinc-500 hover:text-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <GithubIcon className="h-4 w-4" />
            </a>
            <a
              href="https://flamma.digital/"
              target="_blank"
              rel="noreferrer"
              aria-label="Website"
              className={`rounded p-0.5 transition-colors ${isLightMode ? 'text-zinc-500 hover:text-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Globe className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/rodrigo-gabirobertz/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className={`rounded p-0.5 transition-colors ${isLightMode ? 'text-zinc-500 hover:text-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <LinkedinIcon className="h-4 w-4" />
            </a>
          </p>
          <p className="mt-1 flex items-center gap-1.5 font-medium">
            <span className={isLightMode ? 'text-zinc-500' : 'text-zinc-400'}>{text.developedByLabel}</span>
            <span className={`font-semibold ${isLightMode ? 'text-zinc-700' : 'text-zinc-200'}`}>{text.developerSignature}</span>
          </p>
        </div>

        <p className="hidden flex-wrap items-center gap-1.5 font-medium md:flex">
          <span>{text.appVersion}</span>
          <span className={isLightMode ? 'text-zinc-500' : 'text-zinc-400'}>•</span>
          <span className={isLightMode ? 'text-zinc-500' : 'text-zinc-400'}>{text.developedByLabel}</span>
          <span className={`font-semibold ${isLightMode ? 'text-zinc-700' : 'text-zinc-200'}`}>{text.developerSignature}</span>
          <span className={isLightMode ? 'text-zinc-500' : 'text-zinc-400'}>•</span>
          <span className={isLightMode ? 'text-zinc-500' : 'text-zinc-400'}>socials:</span>
          <a
            href="https://github.com/gabrtzweb"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className={`transition-colors ${isLightMode ? 'text-zinc-500 hover:text-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <a
            href="https://flamma.digital/"
            target="_blank"
            rel="noreferrer"
            aria-label="Website"
            className={`transition-colors ${isLightMode ? 'text-zinc-500 hover:text-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Globe className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/rodrigo-gabirobertz/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className={`transition-colors ${isLightMode ? 'text-zinc-500 hover:text-zinc-700' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <LinkedinIcon className="h-4 w-4" />
          </a>
        </p>

        <p className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)] motion-safe:animate-pulse" />
          <span>{text.apiOperationalStatus}</span>
          <span className={isLightMode ? 'text-zinc-500' : 'text-zinc-400'}>• {text.lastSyncedLabel}: {lastSyncedText}</span>
        </p>
      </div>
    </footer>
  )
}

export default DashboardFooter
