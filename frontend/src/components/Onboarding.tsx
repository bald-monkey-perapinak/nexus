import { useState } from 'react'
import type { UserProfile } from '../types'
import { NexusLogoMark, ArrowRight } from './Icons'

interface OnboardingProps { onComplete: (p: UserProfile) => void }

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <div className={`chip ${selected ? 'selected' : ''}`} onClick={onClick}>{label}</div>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="form-label">{label}</div>
        {hint && <div className="t-small" style={{ fontSize: 11 }}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [p, setP] = useState<Partial<UserProfile>>({ business_type: [], has_clients: false, has_premises: false, has_partners: false, is_main_income: true })

  const set = (k: keyof UserProfile, v: unknown) => setP(prev => ({ ...prev, [k]: v }))
  const toggle = (k: keyof UserProfile, val: string) => {
    const arr = (p[k] as string[]) || []
    set(k, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }
  const canNext = p.capital_range && p.format && (p.business_type?.length ?? 0) > 0 && p.team_size

  return (
    <div className="screen">
      {/* Header */}
      <div className="top-bar">
        <div>
          <div className="t-label" style={{ marginBottom: 5, color: 'var(--cyan)' }}>Шаг {step} из 2</div>
          <div className="t-title">{step === 1 ? 'Ваш профиль' : 'Детали'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <NexusLogoMark size={34} />
          <div style={{ display: 'flex', gap: 5 }}>
            {[1, 2].map(i => (
              <div key={i} style={{
                height: 3, borderRadius: 100,
                background: step >= i ? 'var(--cyan)' : 'var(--b2)',
                width: step === i ? 22 : 8,
                transition: 'all 0.3s var(--ease)',
                boxShadow: step === i ? '0 0 10px rgba(0,245,233,0.55)' : 'none'
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: step === 1 ? '50%' : '100%' }} />
        </div>
      </div>

      <div className="scroll-area">
        {step === 1 && (
          <div style={{ animation: 'screenIn 0.3s var(--ease) both' }}>
            <Field label="Стартовый капитал" hint="Сколько готовы вложить">
              <div className="chips">
                {['до 100к', '100к–250k', '250k–500k', '500k+'].map(o => (
                  <Chip key={o} label={o} selected={p.capital_range === o} onClick={() => set('capital_range', o)} />
                ))}
              </div>
            </Field>

            <Field label="Формат бизнеса">
              <div className="chips">
                {[['offline','🏪 Офлайн'],['online','💻 Онлайн'],['hybrid','🔄 Гибрид']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={p.format === v} onClick={() => set('format', v)} />
                ))}
              </div>
            </Field>

            <Field label="Сегмент рынка" hint="Можно несколько">
              <div className="chips">
                {['B2C','B2B','B2G'].map(o => (
                  <Chip key={o} label={o} selected={(p.business_type||[]).includes(o)} onClick={() => toggle('business_type', o)} />
                ))}
              </div>
            </Field>

            <Field label="Команда на старте">
              <div className="chips">
                {['1 (только я)','2–5','6–15','15+'].map(o => (
                  <Chip key={o} label={o} selected={p.team_size === o} onClick={() => set('team_size', o)} />
                ))}
              </div>
            </Field>

            <Field label="Желаемая окупаемость" hint="Месяцев">
              <div className="chips">
                {['3–6','6–12','12–24','24+'].map(o => (
                  <Chip key={o} label={o} selected={p.payback_period === o} onClick={() => set('payback_period', o)} />
                ))}
              </div>
            </Field>

            <Field label="Город">
              <input className="form-input" placeholder="Москва, Казань, онлайн…"
                value={p.city || ''} onChange={e => set('city', e.target.value)} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'screenIn 0.3s var(--ease) both' }}>
            <div style={{
              background: 'var(--cyan-dim)',
              border: '1px solid rgba(0,245,233,0.2)',
              borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 20,
              display: 'flex', gap: 10
            }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <div className="t-small" style={{ color: 'var(--cyan)', lineHeight: 1.6 }}>
                Чем точнее детали — тем точнее идеи. Поля необязательные.
              </div>
            </div>

            <Field label="Ваш опыт и навыки">
              <textarea className="form-textarea" placeholder="Чем занимались раньше? Профессиональные навыки?"
                value={p.experience || ''} onChange={e => set('experience', e.target.value)} />
            </Field>

            <Field label="Что категорически не хотите">
              <textarea className="form-textarea" placeholder="Ресторан, МЛМ, строительство…"
                value={p.exclusions || ''} onChange={e => set('exclusions', e.target.value)} />
            </Field>

            <Field label="Уровень технологичности">
              <div className="chips">
                {[['low','🔧 Низкий'],['medium','⚙️ Средний'],['high','🤖 Высокий']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={p.tech_level === v} onClick={() => set('tech_level', v)} />
                ))}
              </div>
            </Field>

            <Field label="Риск-профиль">
              <div className="chips">
                {[['conservative','🛡️ Консерв.'],['moderate','⚖️ Умеренный'],['aggressive','🚀 Агрессивный']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={p.risk_profile === v} onClick={() => set('risk_profile', v)} />
                ))}
              </div>
            </Field>

            <Field label="Это основной доход?">
              <div className="chips">
                <Chip label="✅ Да, основной" selected={p.is_main_income === true} onClick={() => set('is_main_income', true)} />
                <Chip label="➕ Дополнительный" selected={p.is_main_income === false} onClick={() => set('is_main_income', false)} />
              </div>
            </Field>

            <Field label="Что уже есть">
              <div className="chips">
                <Chip label="👥 Клиенты" selected={!!p.has_clients} onClick={() => set('has_clients', !p.has_clients)} />
                <Chip label="🏠 Помещение" selected={!!p.has_premises} onClick={() => set('has_premises', !p.has_premises)} />
                <Chip label="🤝 Партнёры" selected={!!p.has_partners} onClick={() => set('has_partners', !p.has_partners)} />
              </div>
            </Field>
            <div style={{ height: 80 }} />
          </div>
        )}
      </div>

      <div className="sticky-footer">
        <div style={{ display: 'flex', gap: 10 }}>
          {step === 2 && (
            <button className="btn btn-outline" onClick={() => setStep(1)} style={{ width: 48, padding: '13px 0', flexShrink: 0 }}>←</button>
          )}
          <button className="btn btn-primary" disabled={step === 1 ? !canNext : false}
            onClick={step === 1 ? () => setStep(2) : () => onComplete(p as UserProfile)}>
            {step === 1 ? 'Далее' : '🚀 Сгенерировать'} {step === 1 && <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
