import { NexusLogo, HeroIllustration, ArrowRight } from './Icons'

interface SplashProps {
  onStart: () => void
  loading?: boolean
}

export function Splash({ onStart, loading }: SplashProps) {
  return (
    <div className="screen" style={{ justifyContent: 'space-between', minHeight: '100dvh' }}>

      {/* Header */}
      <div className="top-bar s1">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NexusLogo size={36} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>Nexus</div>
            <div className="t-label" style={{ marginTop: 2 }}>v0.2 · AI Platform</div>
          </div>
        </div>
        <div className="badge badge-indigo">Beta</div>
      </div>

      {/* Hero illustration */}
      <div className="s2" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <HeroIllustration />
      </div>

      {/* Copy */}
      <div className="s3" style={{ textAlign: 'center', padding: '0 8px' }}>
        <div className="t-hero" style={{ marginBottom: 12 }}>
          Бизнес-идеи под ваш профиль
        </div>
        <div className="t-subtitle" style={{ maxWidth: 300, margin: '0 auto' }}>
          AI анализирует ваш капитал, опыт и цели — и выдаёт идеи с финансовыми моделями
        </div>
      </div>

      {/* Feature pills */}
      <div className="s4" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {[
          ['🧠', '3 AI-фильтра'],
          ['📊', 'Финмодель'],
          ['✅', 'CustDev скрипт'],
          ['🗺️', 'Роадмап'],
        ].map(([icon, text]) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 100, padding: '6px 12px',
            fontSize: 13, color: 'var(--text-2)', fontWeight: 500,
          }}>
            <span>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="s4" style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '16px',
      }}>
        {[
          ['01', 'Профиль', 'Капитал, опыт, цели — 2 минуты'],
          ['02', 'Генерация', '8 идей через 3 параллельных AI-фильтра'],
          ['03', 'Финмодель', 'Сценарии, CAC/LTV, интерактивные слайдеры'],
        ].map(([num, title, desc], i) => (
          <div key={num} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            paddingBottom: i < 2 ? 12 : 0,
            marginBottom: i < 2 ? 12 : 0,
            borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--indigo)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>{num}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{title}</div>
              <div className="t-small">{desc}</div>
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
        <div className="t-small" style={{ textAlign: 'center', marginTop: 10 }}>
          Бесплатно · ~2 минуты · Без регистрации
        </div>
      </div>

    </div>
  )
}
