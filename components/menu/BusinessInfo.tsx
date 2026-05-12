'use client'

interface OpeningHours {
  open_now: boolean | null
  weekday_text: string[]
}

interface Props {
  address: string | null
  phone: string | null
  google_maps_url: string | null
  google_rating: number | null
  opening_hours: OpeningHours | null
}

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const half  = rating - full >= 0.4
  const empty = 5 - full - (half ? 1 : 0)

  return (
    <div className="flex items-center gap-1.5">
      <span className="flex gap-0.5">
        {Array.from({ length: full  }).map((_, i) => <Star key={`f${i}`} type="full"  />)}
        {half &&                                       <Star key="h"      type="half"  />}
        {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} type="empty" />)}
      </span>
      <span className="text-white font-semibold text-sm">{rating.toFixed(1)}</span>
      <span className="text-white/40 text-xs">/ 5</span>
    </div>
  )
}

function Star({ type }: { type: 'full' | 'half' | 'empty' }) {
  const color = type === 'empty' ? '#ffffff30' : '#c41e2a'
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={type === 'half' ? 'url(#half)' : color}>
      {type === 'half' && (
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="#c41e2a" />
            <stop offset="50%" stopColor="#ffffff30" />
          </linearGradient>
        </defs>
      )}
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

// Google weekday_text[0] = Monday; JS getDay() 0=Sun,1=Mon,...6=Sat
function todayIndex() {
  return (new Date().getDay() + 6) % 7
}

export default function BusinessInfo({ address, phone, google_maps_url, google_rating, opening_hours }: Props) {
  const todayIdx = todayIndex()
  const isOpen   = opening_hours?.open_now

  return (
    <section className="px-4 pb-10 pt-2" style={{ backgroundColor: 'var(--niyokki-black)' }}>
      {/* Divider */}
      <div className="border-t border-white/10 mb-8" />

      <div className="max-w-2xl mx-auto space-y-8">

        {/* Rating */}
        {google_rating !== null && (
          <div>
            <SectionTitle>Değerlendirme</SectionTitle>
            <StarRating rating={google_rating} />
          </div>
        )}

        {/* Address */}
        {address && (
          <div>
            <SectionTitle>Adres</SectionTitle>
            <p className="text-white/70 text-sm leading-relaxed">{address}</p>
            {google_maps_url && (
              <a
                href={google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-white/10"
                style={{ color: '#c41e2a', borderColor: '#c41e2a40' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Google Maps'te Aç
              </a>
            )}
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div>
            <SectionTitle>Telefon</SectionTitle>
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="text-white/70 text-sm hover:text-white transition-colors"
            >
              {phone}
            </a>
          </div>
        )}

        {/* Opening hours */}
        {opening_hours?.weekday_text?.length ? (
          <div>
            <SectionTitle>
              Çalışma Saatleri
              <span
                className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: isOpen ? 'rgba(45,122,45,0.2)' : 'rgba(196,30,42,0.2)',
                  color:      isOpen ? '#4ade80'             : '#f87171',
                }}
              >
                {isOpen ? 'Açık' : 'Kapalı'}
              </span>
            </SectionTitle>
            <ul className="space-y-2 mt-1">
              {opening_hours.weekday_text.map((line, i) => {
                const [day, ...rest] = line.split(': ')
                const hours = rest.join(': ')
                const isToday = i === todayIdx
                return (
                  <li
                    key={i}
                    className="flex justify-between text-sm"
                    style={{ color: isToday ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
                  >
                    <span className={`${isToday ? 'font-semibold' : ''} w-28 flex-shrink-0`}>
                      {isToday && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                          style={{ background: '#c41e2a' }}
                        />
                      )}
                      {day}
                    </span>
                    <span>{hours}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

      </div>
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2"
      style={{ color: '#c41e2a' }}
    >
      <span className="block w-4 h-px" style={{ background: '#c41e2a' }} />
      {children}
    </h3>
  )
}
