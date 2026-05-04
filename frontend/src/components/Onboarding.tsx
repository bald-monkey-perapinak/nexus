import { useState } from 'react'
import type { UserProfile } from '../types'
import { NexusLogo, ArrowRight } from './Icons'

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <div className={`chip ${selected ? 'selected' : ''}`} onClick={onClick}>{label}</div>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="form-label">{label}</div>
        {hint && <div className="t-small">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    business_type: [],
    has_clients: false, has_premises: false, has_partners: false,
    is_main_income: true,
  })

  const set = (k: keyof UserProfile, v: unknown) => setProfile(p => ({ ...p, [k]: v }))
  const toggle = (k: keyof UserProfile, val: string) => {
    const arr = (profile[k] as string[]) || []
    set(k, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const canStep1 = profile.capital_range && profile.format &&
    (profile.business_type?.length ?? 0) > 0 && profile.team_size

  return (
    <div className="screen">

      {/* Header */}
      <div className="top-bar">
        <div>
          <div className="t-label" style={{ marginBottom: 4 }}>Шаг {step} из 2</div>
          <div className="t-title">{step === 1 ? 'Ваш профиль' : 'Детали'}</div>
        </div>
        <NexusLogo size={36} />
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: step === 1 ? '50%' : '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <div className="t-small">{step === 1 ? 'Основные параметры' : 'Детали и предпочтения'}</div>
          <div className="t-small">{step}/2</div>
        </div>
      </div>

      <div className="scroll-area">
        {step === 1 && (
          <div style={{ animation: 'fadeUp 0.3s var(--ease) both' }}>

            <Field label="Стартовый капитал" hint="Сколько готовы вложить">
              <div className="chips">
                {['до 500к', '500к–2м', '2м–5м', '5м+'].map(o => (
                  <Chip key={o} label={o} selected={profile.capital_range === o} onClick={() => set('capital_range', o)} />
                ))}
              </div>
            </Field>

            <Field label="Формат бизнеса">
              <div className="chips">
                {[['offline','🏪 Офлайн'],['online','💻 Онлайн'],['hybrid','🔄 Гибрид']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={profile.format === v} onClick={() => set('format', v)} />
                ))}
              </div>
            </Field>

            <Field label="Тип клиентов" hint="Можно несколько">
              <div className="chips">
                {['B2C', 'B2B', 'B2G'].map(o => (
                  <Chip key={o} label={o} selected={(profile.business_type||[]).includes(o)} onClick={() => toggle('business_type', o)} />
                ))}
              </div>
            </Field>

            <Field label="Команда на старте">
              <div className="chips">
                {['1 (только я)', '2–5', '6–15', '15+'].map(o => (
                  <Chip key={o} label={o} selected={profile.team_size === o} onClick={() => set('team_size', o)} />
                ))}
              </div>
            </Field>

            <Field label="Желаемая окупаемость" hint="Месяцев">
              <div className="chips">
                {['3–6', '6–12', '12–24', '24+'].map(o => (
                  <Chip key={o} label={o} selected={profile.payback_period === o} onClick={() => set('payback_period', o)} />
                ))}
              </div>
            </Field>

            <Field label="Город">
              <input className="form-input" placeholder="Москва, Казань, онлайн…"
                value={profile.city || ''} onChange={e => set('city', e.target.value)} />
            </Field>

          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeUp 0.3s var(--ease) both' }}>

            {/* Tip card */}
            <div style={{
              background: 'var(--indigo-light)', border: '1px solid var(--indigo-mid)',
              borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 20,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18 }}>💡</span>
              <div className="t-small" style={{ color: 'var(--indigo)', lineHeight: 1.5 }}>
                Чем точнее заполните — тем лучше подберутся идеи. Поля необязательные.
              </div>
            </div>

            <Field label="Ваш опыт и навыки">
              <textarea className="form-textarea"
                placeholder="Чем занимались раньше? Профессиональные навыки?"
                value={profile.experience || ''} onChange={e => set('experience', e.target.value)} />
            </Field>

            <Field label="Что категорически не хотите">
              <textarea className="form-textarea"
                placeholder="Ресторан, МЛМ, строительство…"
                value={profile.exclusions || ''} onChange={e => set('exclusions', e.target.value)} />
            </Field>

            <Field label="Уровень технологичности">
              <div className="chips">
                {[['low','🔧 Низкий'],['medium','⚙️ Средний'],['high','🤖 Высокий']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={profile.tech_level === v} onClick={() => set('tech_level', v)} />
                ))}
              </div>
            </Field>

            <Field label="Риск-профиль">
              <div className="chips">
                {[['conservative','🛡️ Консервативный'],['moderate','⚖️ Умеренный'],['aggressive','🚀 Агрессивный']].map(([v,l]) => (
                  <Chip key={v} label={l} selected={profile.risk_profile === v} onClick={() => set('risk_profile', v)} />
                ))}
              </div>
            </Field>

            <Field label="Это основной доход?">
              <div className="chips">
                <Chip label="✅ Да, основной" selected={profile.is_main_income === true} onClick={() => set('is_main_income', true)} />
                <Chip label="➕ Нет, побочный" selected={profile.is_main_income === false} onClick={() => set('is_main_income', false)} />
              </div>
            </Field>

            <Field label="Что уже есть">
              <div className="chips">
                <Chip label="👥 Клиенты" selected={!!profile.has_clients} onClick={() => set('has_clients', !profile.has_clients)} />
                <Chip label="🏠 Помещение" selected={!!profile.has_premises} onClick={() => set('has_premises', !profile.has_premises)} />
                <Chip label="🤝 Партнёры" selected={!!profile.has_partners} onClick={() => set('has_partners', !profile.has_partners)} />
              </div>
            </Field>

            <div style={{ height: 80 }} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky-footer">
        <div style={{ display: 'flex', gap: 10 }}>
          {step === 2 && (
            <button className="btn btn-outline" onClick={() => setStep(1)}
              style={{ width: 48, padding: '13px 0', flexShrink: 0 }}>←</button>
          )}
          <button
            className="btn btn-primary"
            disabled={step === 1 ? !canStep1 : false}
            onClick={step === 1 ? () => setStep(2) : () => onComplete(profile as UserProfile)}
          >
            {step === 1 ? 'Далее' : '🚀 Сгенерировать идеи'}
            {step === 1 && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
