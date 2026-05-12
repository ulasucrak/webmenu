import { notFound } from 'next/navigation'
import { getRestaurant } from '@/lib/supabase/queries'
import { LanguageProvider } from '@/lib/menu/LanguageContext'
import { ThemeProvider } from '@/lib/menu/ThemeContext'
import AiAssistant from '@/components/menu/AiAssistant'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ restaurant: string; branch: string }>
}

export default async function BranchLayout({ children, params }: LayoutProps) {
  const { restaurant: restaurantSlug, branch: branchSlug } = await params

  const restaurant = await getRestaurant(restaurantSlug)
  if (!restaurant) notFound()

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
          {children}
          <AiAssistant
            restaurantSlug={restaurantSlug}
            branchSlug={branchSlug}
            restaurantName={restaurant.name}
          />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}
