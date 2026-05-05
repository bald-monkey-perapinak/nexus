import { useState, useEffect } from 'react'
import { authTelegram, saveProfile, generateIdeas, setToken, getToken } from './api'
import { getTelegramInitData, tgReady } from './telegram'
import type { AppScreen, IdeaCard, UserProfile } from './types'

import { Splash }               from './components/Splash'
import { Onboarding }           from './components/Onboarding'
import { Generating }           from './components/Generating'
import { IdeasList }            from './components/IdeasList'
import { IdeaDetail }           from './components/IdeaDetail'
import { FinancialModelScreen } from './components/FinancialModel'
import { ValidationScreen }     from './components/Validation'
import { RoadmapScreen }        from './components/Roadmap'

type Screen = AppScreen | 'validation' | 'roadmap'

export default function App() {
  const [screen, setScreen]       = useState<Screen>('splash')
  const [authLoading, setAuth]    = useState(false)
  const [error, setError]         = useState('')
  const [sessionId, setSessionId] = useState('')
  const [ideas, setIdeas]         = useState<IdeaCard[]>([])
  const [idea, setIdea]           = useState<IdeaCard | null>(null)

  useEffect(() => { tgReady(); if (getToken()) setScreen('onboarding') }, [])

  async function handleStart() {
    setAuth(true); setError('')
    try {
      const auth = await authTelegram(getTelegramInitData())
      setToken(auth.access_token)
      setScreen('onboarding')
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setAuth(false) }
  }

  async function handleProfile(profile: UserProfile) {
    setError('')
    try {
      await saveProfile(profile)
      const gen = await generateIdeas()
      setSessionId(gen.session_id)
      setScreen('generating')
    } catch (e: unknown) { setError((e as Error).message) }
  }

  return (
    <>
      {screen === 'splash'      && <Splash onStart={handleStart} loading={authLoading} />}
      {screen === 'onboarding'  && <Onboarding onComplete={handleProfile} />}
      {screen === 'generating'  && (
        <Generating sessionId={sessionId}
          onDone={list => { setIdeas(list); setScreen('ideas') }}
          onError={msg => { setError(msg); setScreen('splash') }}
        />
      )}
      {screen === 'ideas'       && (
        <IdeasList ideas={ideas}
          onSelect={i => { setIdea(i); setScreen('idea_detail') }}
        />
      )}
      {screen === 'idea_detail' && idea && (
        <IdeaDetail idea={idea}
          onBack={() => setScreen('ideas')}
          onBuildModel={() => setScreen('financial')}
          onValidate={() => setScreen('validation')}
          onRoadmap={() => setScreen('roadmap')}
        />
      )}
      {screen === 'financial'   && idea && (
        <FinancialModelScreen idea={idea} sessionId={sessionId} onBack={() => setScreen('idea_detail')} />
      )}
      {screen === 'validation'  && idea && (
        <ValidationScreen ideaId={idea.id} sessionId={sessionId}
          ideaTitle={idea.title} onBack={() => setScreen('idea_detail')} />
      )}
      {screen === 'roadmap'     && idea && (
        <RoadmapScreen ideaId={idea.id} sessionId={sessionId}
          ideaTitle={idea.title} onBack={() => setScreen('idea_detail')} />
      )}

      {error && (
        <div className="toast">
          <span>{error}</span>
          <button className="toast-close" onClick={() => setError('')}>×</button>
        </div>
      )}
    </>
  )
}
