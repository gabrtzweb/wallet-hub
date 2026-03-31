import { ArrowRight, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

function HomePage({ isLightMode, text }) {
  return (
    <section className="flex min-h-[calc(100vh-14rem)] items-center justify-center p-2 md:p-6">
      <div className="w-full max-w-6xl grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center">
        <div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${isLightMode ? 'border-zinc-300/80 bg-white/70 text-zinc-700' : 'border-white/10 bg-white/5 text-zinc-300'}`}>
            <Compass className="h-3.5 w-3.5" />
            {text.homeBadge}
          </span>

          <h1 className={`mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl ${isLightMode ? 'text-zinc-900' : 'text-white'}`}>
            {text.homeTitle}
          </h1>

          <p className={`mt-4 max-w-xl text-base md:text-lg ${isLightMode ? 'text-zinc-600' : 'text-zinc-300/85'}`}>
            {text.homeSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/settings"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1f67ff] px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <span>{text.homePrimaryCta}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="https://github.com/gabrtzweb/wallet-hub"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex h-11 items-center rounded-xl border px-5 text-sm font-semibold ${isLightMode ? 'border-zinc-300 bg-white/80 text-zinc-800' : 'border-white/15 bg-white/5 text-zinc-100'}`}
            >
              {text.homeSecondaryCta}
            </a>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-2xl ${isLightMode ? 'border-zinc-300/80 bg-white/80' : 'border-white/10 bg-white/5'}`}>
          <p className={`text-sm font-semibold ${isLightMode ? 'text-zinc-700' : 'text-zinc-200'}`}>{text.homePreviewTitle}</p>
          <ul className="mt-4 space-y-3">
            <li className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-200 bg-white' : 'border-white/10 bg-black/20'}`}>
              <span>Nubank</span>
              <span className="font-semibold">R$ 4.231,50</span>
            </li>
            <li className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-200 bg-white' : 'border-white/10 bg-black/20'}`}>
              <span>Inter</span>
              <span className="font-semibold">R$ 12.890,00</span>
            </li>
            <li className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-200 bg-white' : 'border-white/10 bg-black/20'}`}>
              <span>Banco do Brasil</span>
              <span className="font-semibold">R$ 8.455,30</span>
            </li>
          </ul>

          <div className={`mt-4 flex items-center justify-between rounded-xl px-3 py-2 text-sm ${isLightMode ? 'bg-zinc-100 text-zinc-700' : 'bg-white/10 text-zinc-100'}`}>
            <span>{text.homePreviewTotalLabel}</span>
            <span className="text-lg font-bold">R$ 25.576,80</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomePage