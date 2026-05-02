import { useState, useEffect } from 'react'
import { authTelegram, saveProfile, generateIdeas, setToken, getToken } from './api'
import { getTelegramInitData, tgReady } from './telegram'
import type { AppScreen, IdeaCard, UserProfile } from './types'

import { Splash } from './components/Splash'
import { Onboarding } from './components/Onboarding'
import { Generating } from './components/Generating'
import { IdeasList } from './components/IdeasList'
import { IdeaDetail } from './components/IdeaDetail'
import { FinancialModelScreen } from './components/FinancialModel'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash')
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [ideas, setIdeas] = useState<IdeaCard[]>([])
  const [selectedIdea, setSelectedIdea] = useState<IdeaCard | null>(null)

  useEffect(() => {
    tgReady()
    // Auto-auth if token exists
    if (getToken()) {
      setScreen('onboarding')
    }
  }, [])

  async function handleStart() {
    setAuthLoading(true)
    setError('')
    try {
      const initData = getTelegramInitData()
      const auth = await authTelegram(initData)
      setToken(auth.access_token)
      setScreen('onboarding')
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleProfileDone(profile: UserProfile) {
    try {
      await saveProfile(profile)
      const gen = await generateIdeas()
      setSessionId(gen.session_id)
      setScreen('generating')
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  function handleIdeasReady(newIdeas: IdeaCard[]) {
    setIdeas(newIdeas)
    setScreen('ideas')
  }

  function handleIdeaSelect(idea: IdeaCard) {
    setSelectedIdea(idea)
    setScreen('idea_detail')
  }

  function handleBuildModel() {
    setScreen('financial')
  }

  return (
    <>
      <div className="grid-bg" />

      {screen === 'splash' && (
        <Splash onStart={handleStart} loading={authLoading} />
      )}

      {screen === 'onboarding' && (
        <Onboarding onComplete={handleProfileDone} />
      )}

      {screen === 'generating' && (
        <Generating
          sessionId={sessionId}
          onDone={handleIdeasReady}
          onError={msg => { setError(msg); setScreen('splash') }}
        />
      )}

      {screen === 'ideas' && (
        <IdeasList ideas={ideas} onSelect={handleIdeaSelect} />
      )}

      {screen === 'idea_detail' && selectedIdea && (
        <IdeaDetail
          idea={selectedIdea}
          onBack={() => setScreen('ideas')}
          onBuildModel={handleBuildModel}
        />
      )}

      {screen === 'financial' && selectedIdea && (
        <FinancialModelScreen
          idea={selectedIdea}
          sessionId={sessionId}
          onBack={() => setScreen('idea_detail')}
        />
      )}

      {error && (
        <div style={{
          position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 100,
          background: 'var(--ink)', color: 'var(--cream)',
          padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'var(--cream)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}
    </>
  )
}
