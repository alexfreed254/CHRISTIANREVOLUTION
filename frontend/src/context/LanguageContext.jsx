import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'
import { UI_STRINGS_EN } from '../constants/uiStrings.en'

const STORAGE_KEY = 'crm_language'
const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const { user, token } = useAuth()
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    return localStorage.getItem(STORAGE_KEY) || 'en'
  })
  const [languageGroups, setLanguageGroups] = useState([])
  const [languages, setLanguages] = useState([])
  const [uiStrings, setUiStrings] = useState(UI_STRINGS_EN)
  const [aiTranslation, setAiTranslation] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    axios.get('/api/languages').then((res) => {
      setLanguageGroups(res.data.groups || [])
      setLanguages(res.data.languages || [])
      setAiTranslation(!!res.data.ai_translation)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (user?.preferred_language && user.preferred_language !== language) {
      setLanguageState(user.preferred_language)
      localStorage.setItem(STORAGE_KEY, user.preferred_language)
    }
  }, [user?.preferred_language])

  const loadUiStrings = useCallback(async (lang) => {
    if (lang === 'en') {
      setUiStrings(UI_STRINGS_EN)
      setReady(true)
      return
    }
    try {
      const res = await axios.get('/api/translate/ui', { params: { lang } })
      setUiStrings({ ...UI_STRINGS_EN, ...(res.data.strings || {}) })
      setAiTranslation(!!res.data.ai_translation)
    } catch {
      setUiStrings(UI_STRINGS_EN)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    setReady(false)
    loadUiStrings(language)
  }, [language, loadUiStrings])

  const setLanguage = async (code) => {
    setLanguageState(code)
    localStorage.setItem(STORAGE_KEY, code)
    if (token) {
      try {
        await axios.patch('/api/me/language', { preferred_language: code }, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // guest/local preference still works
      }
    }
  }

  const t = (key) => uiStrings[key] || UI_STRINGS_EN[key] || key

  const langParam = { lang: language }

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      languages,
      languageGroups,
      aiTranslation,
      ready,
      t,
      langParam,
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
