import { Hourglass } from 'lucide-react'

function PlanningPage({
  glassCardClass,
  secondaryTextClass,
  text,
}) {
  return (
    <section className="w-full">
      <article className={`${glassCardClass} min-h-[100px] w-full overflow-hidden`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-5 `}>
            <div className="flex items-center gap-2 -ml-1">
                <Hourglass className="h-[18px] w-[18px] text-[#1f67ff]" />
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                    {text.planningSoon || 'Soon'}
                </h3>
            </div>
        </div>
      </article>
    </section>
  )
}

export default PlanningPage
