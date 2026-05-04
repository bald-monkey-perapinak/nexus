import { useState, useEffect } from 'react'
import { authTelegram, saveProfile, generateIdeas, setToken, getToken } from './api'
import { getTelegramInitData, tgReady } from './telegram'
import type { AppScreen, IdeaCard, UserProfile } from './types'

import { Splash }                from './components/Splash'
import { Onboarding }            from './components/Onboarding'
import { Generating }            from './components/Generating'
import { IdeasList }             from './components/IdeasList'
import { IdeaDetail }            from './components/IdeaDetail'
import { FinancialModelScreen }  from './components/FinancialModel'
import { ValidationScreen }      from './components/Validation'

type ExtendedScreen = AppScreen | 'validation'

export default function App() {
  const [screen, setScreen]         = useState<ExtendedScreen>('splash')
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError]           = useState('')
  const [sessionId, setSessionId]   = useState('')
  const [ideas, setIdeas]           = useState<IdeaCard[]>([])
  const [selectedIdea, setSelectedIdea] = useState<IdeaCard | null>(null)

  useEffect(() => {
    tgReady()
    if (getToken()) setScreen('onboarding')
  }, [])

  async function handleStart() {
    setAuthLoading(true); setError('')
    try {
      const auth = await authTelegram(getTelegramInitData())
      setToken(auth.access_token)
      setScreen('onboarding')
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setAuthLoading(false) }
  }

  async function handleProfileDone(profile: UserProfile) {
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
      {screen === 'splash' && <Splash onStart={handleStart} loading={authLoading} />}
      {screen === 'onboarding' && <Onboarding onComplete={handleProfileDone} />}
      {screen === 'generating' && (
        <Generating sessionId={sessionId}
          onDone={ideas => { setIdeas(ideas); setScreen('ideas') }}
          onError={msg  => { setError(msg);   setScreen('splash') }}
        />
      )}
      {screen === 'ideas' && (
        <IdeasList ideas={ideas}
          onSelect={idea => { setSelectedIdea(idea); setScreen('idea_detail') }}
        />
      )}
      {screen === 'idea_detail' && selectedIdea && (
        <IdeaDetail
          idea={selectedIdea}
          onBack={() => setScreen('ideas')}
          onBuildModel={() => setScreen('financial')}
          onValidate={() => setScreen('validation')}
        />
      )}
      {screen === 'financial' && selectedIdea && (
        <FinancialModelScreen idea={selectedIdea} sessionId={sessionId} onBack={() => setScreen('idea_detail')} />
      )}
      {screen === 'validation' && selectedIdea && (
        <ValidationScreen
          ideaId={selectedIdea.id}
          sessionId={sessionId}
          ideaTitle={selectedIdea.title}
          onBack={() => setScreen('idea_detail')}
        />
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
