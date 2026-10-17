import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useT } from '../i18n'

const REPO_URL = 'https://github.com/frankf1747/Avalon-web'
const TIMELINE_URL = 'https://frankfu.me/progress?p=avalon-web'

// Fanned hand of role cards, Merlin in the middle. [card, x offset (rem), lift (rem), tilt (deg)]
const HAND = [
  ['mordred', -9, 1.2, -14],
  ['percival', -4.6, 0.3, -7],
  ['assassin', 9, 1.2, 14],
  ['morgana', 4.6, 0.3, 7],
  ['merlin', 0, -0.6, 0],
]

const STEPS = ['home', 'reveal', 'night', 'vote', 'mission', 'end']

function Phone({ src, alt, className = '' }) {
  return (
    <div className={`rounded-[1.6rem] border border-gold/40 bg-gradient-to-br from-[#3b3524] via-[#121018] to-[#2a2418] p-1.5 shadow-card ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="block w-full rounded-[1.25rem]" />
    </div>
  )
}

function CardHand() {
  const reduce = useReducedMotion()
  return (
    // Below sm the fan is scaled down so the outer cards stay on screen.
    <div className="relative mx-auto h-[13rem] w-full max-w-[26rem] origin-bottom scale-[0.74] sm:h-[19rem] sm:scale-100" aria-hidden="true">
      {HAND.map(([card, x, y, r], i) => (
        <motion.img
          key={card}
          src={`/landing/card-${card}.png`}
          alt=""
          className={`absolute bottom-0 left-1/2 w-[7.5rem] -ml-[3.75rem] rounded-md shadow-card sm:w-[9.5rem] sm:-ml-[4.75rem]
            ${card === 'merlin' ? 'z-10 ring-1 ring-goldBright/70 shadow-[0_0_2.5rem_rgba(245,217,122,0.35)]' : ''}`}
          initial={reduce ? false : { x: 0, y: 40, rotate: 0, opacity: 0 }}
          animate={{ x: `${x}rem`, y: `${y}rem`, rotate: r, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  )
}

export default function Landing() {
  const t = useT()
  const shot = (name) => (name === 'reveal' && t.lang === 'zh' ? 'reveal-zh' : name)

  return (
    <div className="min-h-screen text-ink">
      {/* Hero */}
      <header className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-20 md:grid-cols-[1.05fr_1fr] md:gap-6 md:pt-24">
        <div className="order-2 text-center md:order-1 md:text-left">
          <h1 className="font-display text-6xl text-goldBright drop-shadow-[0_0_24px_rgba(245,217,122,0.35)] sm:text-7xl">
            {t('app.name')}
          </h1>
          <p className="mx-auto mt-6 max-w-[34rem] text-xl leading-relaxed text-ink/90 md:mx-0">{t('landing.lede')}</p>
          <p className="mx-auto mt-3 max-w-[34rem] text-base text-inkMuted md:mx-0">{t('landing.meta')}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start">
            <Link to="/play" className="btn-primary px-9 text-base">{t('landing.play')}</Link>
            <a href="#how" className="btn-ghost">{t('landing.how')}</a>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <CardHand />
        </div>
      </header>

      {/* How a game goes */}
      <section id="how" className="border-t border-gold/20 bg-black/20">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-3xl text-goldBright sm:text-4xl">{t('landing.flowTitle')}</h2>
          <p className="mt-3 max-w-[40rem] text-lg text-ink/80">{t('landing.flowLede')}</p>
          <ol className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((name, i) => (
              <li key={name} className="grid grid-cols-[7.5rem_1fr] items-start gap-5 sm:grid-cols-1">
                <Phone src={`/landing/${shot(name)}.jpg`} alt={t('landing.shotAlt', { title: t(`landing.step${i + 1}.title`) })} className="sm:max-w-[15rem]" />
                <div>
                  <div className="font-display text-sm text-gold">{i + 1}</div>
                  <h3 className="mt-1 font-display text-xl text-goldBright">{t(`landing.step${i + 1}.title`)}</h3>
                  <p className="mt-2 text-base leading-relaxed text-ink/75">{t(`landing.step${i + 1}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Narrator screen */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[1.6rem] border border-gold/40 bg-gradient-to-br from-[#3b3524] via-[#121018] to-[#2a2418] p-2.5 shadow-card">
            <img src="/landing/referee.jpg" alt={t('landing.tableAlt')} loading="lazy" className="block w-full rounded-xl" />
          </div>
          <div>
            <h2 className="font-display text-3xl text-goldBright">{t('landing.tableTitle')}</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">{t('landing.tableBody')}</p>
          </div>
        </div>
      </section>

      {/* About, for visitors who came from the portfolio */}
      <section className="border-y border-gold/20 bg-black/20">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className="font-display text-2xl text-goldBright">{t('landing.aboutTitle')}</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">{t('landing.aboutBody')}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-base">
            <span className="text-inkMuted">{t('landing.aboutBy')}</span>
            <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className="text-goldBright underline decoration-gold/40 underline-offset-4 hover:decoration-goldBright">{t('landing.code')}</a>
            <a href={TIMELINE_URL} target="_blank" rel="noreferrer noopener" className="text-goldBright underline decoration-gold/40 underline-offset-4 hover:decoration-goldBright">{t('landing.timeline')}</a>
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h2 className="font-display text-3xl text-goldBright sm:text-4xl">{t('landing.ctaTitle')}</h2>
        <p className="mt-3 text-lg text-ink/80">{t('landing.ctaBody')}</p>
        <Link to="/play" className="btn-primary mt-8 px-9 text-base">{t('landing.ctaButton')}</Link>
      </section>
    </div>
  )
}
