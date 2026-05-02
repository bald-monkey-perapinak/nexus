import type { IdeaCard } from '../types'
import { IdeaGlyph } from './Icons'

interface IdeasProps {
  ideas: IdeaCard[]
  onSelect: (idea: IdeaCard) => void
}

function difficultyLabel(d?: string) {
  if (d === 'easy') return '●○○'
  if (d === 'medium') return '●●○'
  if (d === 'hard') return '●●●'
  return '●●○'
}

function trendLabel(t?: string) {
  if (t === 'growing') return '↑ Растёт'
  if (t === 'declining') return '↓ Падает'
  return '→ Стабильно'
}

export function IdeasList({ ideas, onSelect }: IdeasProps) {
  return (
    <div className="screen">
      <div className="header">
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Nexus — результат</div>
          <div className="display-sm">
            {ideas.length} идей для вас
          </div>
        </div>
        <div className="header-series">Nexus / series.001</div>
      </div>

      <div className="rule" />

      <div className="scroll-area" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {ideas.map((idea, i) => (
          <div key={idea.id} className="card" onClick={() => onSelect(idea)}>
            <div className="card-number">
              nr.{String(i + 1).padStart(3, '0')}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingRight: 40 }}>
              <IdeaGlyph index={i} />
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.2, marginBottom: 4 }}>
                  {idea.title}
                </div>
                {idea.tagline && (
                  <div className="label" style={{ color: 'var(--ink-3)' }}>{idea.tagline}</div>
                )}
              </div>
            </div>

            <div className="rule" style={{ margin: '12px 0' }} />

            <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 12 }}>
              {idea.description.slice(0, 120)}...
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="card-score">
                <span>{idea.total_score}</span>
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${idea.total_score}%` }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <span className="tag tag-ok">{difficultyLabel(idea.difficulty)}</span>
                <span className="tag tag-ok">{trendLabel(idea.trend)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
