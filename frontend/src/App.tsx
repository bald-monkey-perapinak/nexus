import { useState, useEffect } from 'react'
import { authLogin, authRegister, saveProfile, generateIdeas, setToken, getToken } from './api'
import type { AppScreen, IdeaCard, UserProfile, Contradiction } from './types'

import { Login }                from './components/Login'
import { Onboarding }           from './components/Onboarding'
import { Generating }           from './components/Generating'
import { IdeasList }            from './components/IdeasList'
import { IdeaDetail }           from './components/IdeaDetail'
import { FinancialModelScreen } from './components/FinancialModel'
import { ValidationScreen }     from './components/Validation'
import { RoadmapScreen }        from './components/Roadmap'
import { AnalyticsScreen }      from './components/Analytics'

type Screen = AppScreen | 'validation' | 'roadmap' | 'login' | 'register'

export default function App() {
  const [screen, setScreen]         = useState<Screen>('login')
  const [authLoading, setAuth]      = useState(false)
  const [error, setError]           = useState('')
  const [sessionId, setSid]         = useState('')
  const [ideas, setIdeas]           = useState<IdeaCard[]>([])
  const [idea, setIdea]             = useState<IdeaCard | null>(null)
  const [savedProfile, setProfile]          = useState<UserProfile | null>(null)
  const [contradictions, setContradictions] = useState<Contradiction[]>([])

  useEffect(() => { if (getToken()) setScreen('onboarding') }, [])

  async function handleLogin(email: string, password: string) {
    setAuth(true); setError('')
    try {
      const auth = await authLogin(email, password)
      setToken(auth.access_token)
      setScreen('onboarding')
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setAuth(false) }
  }

  async function handleRegister(email: string, password: string, fullName: string) {
    setAuth(true); setError('')
    try {
      const auth = await authRegister(email, password, fullName)
      setToken(auth.access_token)
      setScreen('onboarding')
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setAuth(false) }
  }

  async function handleProfile(profile: UserProfile) {
    setError('')
    try {
      await saveProfile(profile)
      setProfile(profile)
      const gen = await generateIdeas()
      setSid(gen.session_id)
      setScreen('generating')
    } catch (e: unknown) { setError((e as Error).message) }
  }

  async function handleRegenerate() {
    if (!savedProfile) { setScreen('onboarding'); return }
    setError('')
    try {
      const gen = await generateIdeas()
      setSid(gen.session_id)
      setScreen('generating')
    } catch (e: unknown) { setError((e as Error).message) }
  }

  return (
    <>
      {screen === 'login'       && <Login onLogin={handleLogin} onSwitchRegister={() => setScreen('register')} loading={authLoading} />}
      {screen === 'register'    && <Login isRegister onRegister={handleRegister} onSwitchLogin={() => setScreen('login')} loading={authLoading} />}
      {screen === 'onboarding'  && <Onboarding onComplete={handleProfile} />}
      {screen === 'generating'  && (
        <Generating sessionId={sessionId}
          onDone={(list, contradicts) => {
            setIdeas(list)
            setContradictions(contradicts)
            setScreen('ideas')
          }}
          onError={msg  => { setError(msg); setScreen('login') }} />
      )}
      {screen === 'ideas'       && (
        <IdeasList ideas={ideas}
          contradictions={contradictions}
          onSelect={i => { setIdea(i); setScreen('idea_detail') }}
          onRegenerate={handleRegenerate}
          onEditProfile={() => setScreen('onboarding')} />
      )}
      {screen === 'idea_detail' && idea && (
        <IdeaDetail idea={idea}
          onBack={() => setScreen('ideas')}
          onBuildModel={() => setScreen('financial')}
          onValidate={() => setScreen('validation')}
          onRoadmap={() => setScreen('roadmap')}
          onAnalytics={() => setScreen('analytics')} />
      )}
      {screen === 'financial'  && idea && (
        <FinancialModelScreen idea={idea} sessionId={sessionId} onBack={() => setScreen('idea_detail')} />
      )}
      {screen === 'validation' && idea && (
        <ValidationScreen ideaId={idea.id} sessionId={sessionId}
          ideaTitle={idea.title} onBack={() => setScreen('idea_detail')} />
      )}
      {screen === 'analytics'  && idea && (
        <AnalyticsScreen
          ideaId={idea.id}
          sessionId={sessionId}
          ideaTitle={idea.title}
          isOnline={(idea as any).format === 'online'}
          onBack={() => setScreen('idea_detail')} />
      )}
      {screen === 'roadmap'    && idea && (
        <RoadmapScreen ideaId={idea.id} sessionId={sessionId}
          ideaTitle={idea.title} onBack={() => setScreen('idea_detail')} />
      )}

      {error && (
        <div className="toast">
          <span style={{ fontFamily: 'var(--f)' }}>{error}</span>
          <button className="toast-close" onClick={() => setError('')}>×</button>
        </div>
      )}
    </>
  )
}
