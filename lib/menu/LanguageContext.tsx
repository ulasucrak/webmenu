'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Lang = 'tr' | 'en'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangContextValue>({ lang: 'tr', setLang: () => {} })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('tr')

  useEffect(() => {
    const stored = localStorage.getItem('menu-language') as Lang | null
    if (stored === 'tr' || stored === 'en') setLangState(stored)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('menu-language', l)
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

export const T = {
  tr: {
    tagline:       'THE ART OF MACARONI',
    explore:       'Menüyü Keşfet',
    menuSection:   'Menü',
    noCategories:  'Henüz kategori eklenmedi.',
    aiPlaceholder: 'Bir şey sorun...',
    aiWelcome:     'Menüden ne arıyorsunuz? Sormaktan çekinmeyin!',
    quickPrompts:  ['Vejetaryen seçenekler', 'Günün önerisi', 'Glutensiz seçenekler', 'Önerilen ürünler'],
    items:         'ürün',
    about:         'Hakkımızda',
    categories:    'Kategoriler',
    address:       'Adres',
    phone:         'Telefon',
    workingHours:  'Çalışma Saatleri',
    openNow:       'Açık',
    closedNow:     'Kapalı',
    getDirections: 'Yol Tarifi Al',
    openInMaps:    'Google Maps\'te Aç',
    rating:        'Değerlendirme',
    back:          'Geri',
  },
  en: {
    tagline:       'THE ART OF MACARONI',
    explore:       'Explore Menu',
    menuSection:   'Menu',
    noCategories:  'No categories yet.',
    aiPlaceholder: 'Ask something...',
    aiWelcome:     'What are you looking for? Feel free to ask!',
    quickPrompts:  ['Vegetarian options', "Today's recommendation", 'Gluten-free options', 'Recommended dishes'],
    items:         'items',
    about:         'About',
    categories:    'Categories',
    address:       'Address',
    phone:         'Phone',
    workingHours:  'Opening Hours',
    openNow:       'Open',
    closedNow:     'Closed',
    getDirections: 'Get Directions',
    openInMaps:    'Open in Google Maps',
    rating:        'Rating',
    back:          'Back',
  },
} as const
