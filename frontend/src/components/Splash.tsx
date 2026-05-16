import { NexusLogoMark, HeroIllustration, ArrowRight } from './Icons'

interface SplashProps { onStart: () => void; loading?: boolean }

export function Splash({ onStart, loading }: SplashProps) {
  return (
    <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--pad)', maxWidth: 480, width: '100%', margin: '0 auto' }}>

      {/* Header */}
      <div className="top-bar s1">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NexusLogoMark size={38} />
          <div>
            <div style={{ fontFamily: 'var(--f)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--t1)', lineHeight: 1 }}>NEXUS</div>
            <div className="t-label" style={{ marginTop: 3, color: 'var(--cyan)', opacity: 0.7 }}>v0.3 · Mission Control</div>
          </div>
        </div>
        <span className="badge badge-cyan">Beta</span>
      </div>

      {/* Hero illustration */}
      <div className="s2" style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
        <HeroIllustration />
      </div>

      {/* Hero copy */}
      <div className="s3" style={{ textAlign: 'center', padding: '0 4px', marginBottom: 24 }}>
        <div className="t-hero" style={{ marginBottom: 12 }}>
          Бизнес‑идеи<br/>
          <span className="holo-text">под ваш профиль</span>
        </div>
        <div className="t-body" style={{ maxWidth: 290, margin: '0 auto', lineHeight: 1.7 }}>
          AI анализирует капитал, опыт и цели — выдаёт идеи с финмоделями и роадмапом
        </div>
      </div>

      {/* Feature chips */}
      <div className="s4" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 20 }}>
        {[['🧠','3 AI‑фильтра'],['📊','Финмодель'],['✅','CustDev'],['🗺️','Роадмап 90 дн']].map(([icon, text]) => (
          <div key={text as string} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,245,233,0.05)',
            border: '1px solid rgba(0,245,233,0.15)',
            borderRadius: 100, padding: '6px 14px',
            fontFamily: 'var(--f)', fontSize: 12, fontWeight: 500, color: 'var(--t2)',
            backdropFilter: 'blur(10px)',
          }}>
            <span>{icon as string}</span><span>{text as string}</span>
          </div>
        ))}
      </div>

      {/* Steps card */}
      <div className="s4" style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--b2)',
        borderRadius: 'var(--r-lg)',
        padding: 18, marginBottom: 20
      }}>
        {[
          ['01', 'var(--cyan)',   'Профиль',    'Капитал · опыт · цели'],
          ['02', 'var(--lime)',   'Генерация',  '8 идей через 3 параллельных AI‑фильтра'],
          ['03', 'var(--amber)',  'Финмодель',  'Сценарии · CAC/LTV · слайдеры'],
        ].map(([num, col, title, desc], i) => (
          <div key={num as string} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            paddingBottom: i < 2 ? 14 : 0, marginBottom: i < 2 ? 14 : 0,
            borderBottom: i < 2 ? '1px solid var(--b1)' : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: `${col as string}14`,
              border: `1px solid ${col as string}35`,
              color: col as string,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 700, flexShrink: 0
            }}>
              {num as string}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--f)', fontSize: 13, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.2, marginBottom: 2 }}>{title as string}</div>
              <div className="t-small">{desc as string}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="s5">
        <button className="btn btn-primary" onClick={onStart} disabled={loading}>
          {loading ? 'Подождите…' : 'Начать бесплатно'}
          {!loading && <ArrowRight size={16} />}
        </button>
        <div className="t-small" style={{ textAlign: 'center', marginTop: 10 }}>Бесплатно · ~2 минуты · Без регистрации</div>
      </div>
    </div>
  )
}
