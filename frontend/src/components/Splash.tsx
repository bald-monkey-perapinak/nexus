import { NexusLogo } from './Icons'

interface SplashProps {
  onStart: () => void
  loading?: boolean
}

export function Splash({ onStart, loading }: SplashProps) {
  return (
    <div className="splash">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <NexusLogo size={72} />
        <div>
          <div className="display" style={{ textAlign: 'center' }}>NEXUS</div>
          <div className="label" style={{ textAlign: 'center', marginTop: 6 }}>
            Бизнес-идеи. Точно по профилю.
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 280 }}>
        <div className="rule" />
        <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.7, margin: '16px 0' }}>
          AI-платформа, которая генерирует бизнес-идеи под ваш капитал, опыт и цели —
          и ведёт от идеи до первых продаж.
        </p>
        <div className="rule" />
      </div>

      <button
        className="btn btn-fill"
        onClick={onStart}
        disabled={loading}
        style={{ maxWidth: 280 }}
      >
        {loading ? 'Загрузка...' : 'Начать →'}
      </button>

      <div className="label" style={{ opacity: 0.4 }}>series.001 — nr.001</div>
    </div>
  )
}
