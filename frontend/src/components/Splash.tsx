import { NexusLogo, HeroIllustration, ArrowRight } from './Icons'

interface SplashProps { onStart: () => void; loading?: boolean }

export function Splash({ onStart, loading }: SplashProps) {
  return (
    <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--pad)', maxWidth: 480, width: '100%', margin: '0 auto' }}>

      {/* Header */}
      <div className="top-bar s1">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NexusLogo size={34} />
          <div>
            <div style={{ fontFamily: 'var(--f)', fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--t1)', lineHeight: 1 }}>NEXUS</div>
            <div className="t-label" style={{ marginTop: 2 }}>v0.3 · Mission Control</div>
          </div>
        </div>
        <span className="badge badge-lime">Beta</span>
      </div>

      {/* Hero illustration */}
      <div className="s2" style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
        <HeroIllustration />
      </div>

      {/* Hero copy */}
      <div className="s3" style={{ textAlign: 'center', padding: '0 4px', marginBottom: 24 }}>
        <div className="t-hero" style={{ marginBottom: 10 }}>
          Бизнес‑идеи<br/>
          <span style={{ color: 'var(--lime)' }}>под ваш профиль</span>
        </div>
        <div className="t-body" style={{ maxWidth: 290, margin: '0 auto', lineHeight: 1.6 }}>
          AI анализирует капитал, опыт и цели — выдаёт идеи с финмоделями и роадмапом
        </div>
      </div>

      {/* Feature row */}
      <div className="s4" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 20 }}>
        {[['🧠','3 AI‑фильтра'],['📊','Финмодель'],['✅','CustDev'],['🗺️','Роадмап 90 дн']].map(([icon, text]) => (
          <div key={text as string} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-card)', border: '1px solid var(--b2)',
            borderRadius: 100, padding: '6px 12px',
            fontFamily: 'var(--f)', fontSize: 12, fontWeight: 600, color: 'var(--t2)',
          }}>
            <span>{icon as string}</span><span>{text as string}</span>
          </div>
        ))}
      </div>

      {/* Steps card */}
      <div className="s4" style={{ background: 'var(--bg-card)', border: '1px solid var(--b2)', borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 20 }}>
        {[
          ['01', 'var(--lime)',  'Профиль',    'Капитал · опыт · цели'],
          ['02', 'var(--teal)',  'Генерация',  '8 идей через 3 параллельных AI‑фильтра'],
          ['03', 'var(--amber)', 'Финмодель',  'Сценарии · CAC/LTV · слайдеры'],
        ].map(([num, col, title, desc], i) => (
          <div key={num as string} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            paddingBottom: i < 2 ? 12 : 0, marginBottom: i < 2 ? 12 : 0,
            borderBottom: i < 2 ? '1px solid var(--b1)' : 'none',
          }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${col}20`, border: `1px solid ${col}40`, color: col as string, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {num as string}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--f)', fontSize: 13, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2, marginBottom: 2 }}>{title as string}</div>
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
