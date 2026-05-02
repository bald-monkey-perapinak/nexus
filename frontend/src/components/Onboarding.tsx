import { useState } from 'react'
import type { UserProfile } from '../types'
import { NexusLogo } from './Icons'

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void
}

const CAPITAL_OPTIONS = ['до 500к', '500к–2м', '2м–5м', '5м+']
const FORMAT_OPTIONS = ['offline', 'online', 'hybrid']
const TEAM_OPTIONS = ['1 (только я)', '2–5', '6–15', '15+']
const TECH_OPTIONS = ['low', 'medium', 'high']
const RISK_OPTIONS = ['conservative', 'moderate', 'aggressive']
const PAYBACK_OPTIONS = ['3–6', '6–12', '12–24', '24+']

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <div className={`chip ${selected ? 'selected' : ''}`} onClick={onClick}>
      {label}
    </div>
  )
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    business_type: [],
    has_clients: false,
    has_premises: false,
    has_partners: false,
    is_main_income: true,
  })

  function toggle(key: keyof UserProfile, value: string) {
    const arr = (profile[key] as string[]) || []
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    setProfile(p => ({ ...p, [key]: next }))
  }

  function set(key: keyof UserProfile, value: unknown) {
    setProfile(p => ({ ...p, [key]: value }))
  }

  function canProceedStep1() {
    return profile.capital_range && profile.format && (profile.business_type?.length ?? 0) > 0 && profile.team_size
  }

  function submit() {
    onComplete(profile as UserProfile)
  }

  return (
    <div className="screen">
      <div className="header">
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Шаг {step} из 2</div>
          <div className="display-sm">
            {step === 1 ? 'Ваш профиль' : 'Детали'}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <NexusLogo size={32} />
          <div className="label">series.001</div>
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${step === 1 ? 50 : 100}%` }} />
      </div>

      <div className="scroll-area">

        {step === 1 && (
          <div>
            <div className="form-group">
              <div className="form-label">Стартовый капитал</div>
              <div className="chips">
                {CAPITAL_OPTIONS.map(o => (
                  <Chip key={o} label={o} selected={profile.capital_range === o}
                    onClick={() => set('capital_range', o)} />
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Формат бизнеса</div>
              <div className="chips">
                <Chip label="Офлайн" selected={profile.format === 'offline'} onClick={() => set('format', 'offline')} />
                <Chip label="Онлайн" selected={profile.format === 'online'} onClick={() => set('format', 'online')} />
                <Chip label="Гибрид" selected={profile.format === 'hybrid'} onClick={() => set('format', 'hybrid')} />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Тип клиентов (можно несколько)</div>
              <div className="chips">
                {['B2C', 'B2B', 'B2G'].map(o => (
                  <Chip key={o} label={o} selected={(profile.business_type || []).includes(o)}
                    onClick={() => toggle('business_type', o)} />
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Команда</div>
              <div className="chips">
                {TEAM_OPTIONS.map(o => (
                  <Chip key={o} label={o} selected={profile.team_size === o}
                    onClick={() => set('team_size', o)} />
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Желаемый срок окупаемости (мес)</div>
              <div className="chips">
                {PAYBACK_OPTIONS.map(o => (
                  <Chip key={o} label={o} selected={profile.payback_period === o}
                    onClick={() => set('payback_period', o)} />
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Город (необязательно)</div>
              <input className="form-input" placeholder="Москва, Казань, онлайн..."
                value={profile.city || ''}
                onChange={e => set('city', e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="form-group">
              <div className="form-label">Ваш опыт и навыки</div>
              <textarea className="form-textarea"
                placeholder="Чем занимались раньше? Есть ли профессиональные навыки?"
                value={profile.experience || ''}
                onChange={e => set('experience', e.target.value)} />
            </div>

            <div className="form-group">
              <div className="form-label">Что категорически не хотите</div>
              <textarea className="form-textarea"
                placeholder="Ресторан, МЛМ, строительство..."
                value={profile.exclusions || ''}
                onChange={e => set('exclusions', e.target.value)} />
            </div>

            <div className="form-group">
              <div className="form-label">Уровень технологичности</div>
              <div className="chips">
                <Chip label="Низкий" selected={profile.tech_level === 'low'} onClick={() => set('tech_level', 'low')} />
                <Chip label="Средний" selected={profile.tech_level === 'medium'} onClick={() => set('tech_level', 'medium')} />
                <Chip label="Высокий" selected={profile.tech_level === 'high'} onClick={() => set('tech_level', 'high')} />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Риск-профиль</div>
              <div className="chips">
                <Chip label="Консервативный" selected={profile.risk_profile === 'conservative'} onClick={() => set('risk_profile', 'conservative')} />
                <Chip label="Умеренный" selected={profile.risk_profile === 'moderate'} onClick={() => set('risk_profile', 'moderate')} />
                <Chip label="Агрессивный" selected={profile.risk_profile === 'aggressive'} onClick={() => set('risk_profile', 'aggressive')} />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Это будет основной доход?</div>
              <div className="chips">
                <Chip label="Да" selected={profile.is_main_income === true} onClick={() => set('is_main_income', true)} />
                <Chip label="Нет, побочный" selected={profile.is_main_income === false} onClick={() => set('is_main_income', false)} />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Что уже есть</div>
              <div className="chips">
                <Chip label="Клиенты" selected={!!profile.has_clients} onClick={() => set('has_clients', !profile.has_clients)} />
                <Chip label="Помещение" selected={!!profile.has_premises} onClick={() => set('has_premises', !profile.has_premises)} />
                <Chip label="Партнёры" selected={!!profile.has_partners} onClick={() => set('has_partners', !profile.has_partners)} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ paddingTop: 16, display: 'flex', gap: 8 }}>
        {step === 2 && (
          <button className="btn" onClick={() => setStep(1)} style={{ flex: 0, minWidth: 48 }}>←</button>
        )}
        {step === 1 ? (
          <button className="btn btn-fill" disabled={!canProceedStep1()} onClick={() => setStep(2)}>
            Далее →
          </button>
        ) : (
          <button className="btn btn-fill" onClick={submit}>
            Сгенерировать идеи →
          </button>
        )}
      </div>
    </div>
  )
}
