import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, PhoneCall } from 'lucide-react'

type AnimatedHeroProps = {
  onStartBooking: () => void
}

function AnimatedHero({ onStartBooking }: AnimatedHeroProps) {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(
    () => ['capilar', 'médica', 'personalizada', 'moderna', 'simple'],
    [],
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTitleNumber((currentTitle) =>
        currentTitle === titles.length - 1 ? 0 : currentTitle + 1,
      )
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [titleNumber, titles])

  return (
    <section className="animated-hero" aria-labelledby="booking-title">
      <button className="hero-kicker" type="button" onClick={onStartBooking}>
        Reservá tu consulta
        <ChevronRight size={16} />
      </button>

      <div className="animated-hero-copy">
        <h1 id="booking-title">
          <span>Una experiencia</span>
          <span className="animated-title-track" aria-live="polite">
            {titles.map((title, index) => (
              <span
                className={`animated-title-word ${
                  titleNumber === index ? 'active' : ''
                } ${titleNumber > index ? 'previous' : 'next'}`}
                key={title}
              >
                {title}
              </span>
            ))}
          </span>
        </h1>

        <p>
          Agendá tu consulta en Hair Recovery con una reserva clara por sede,
          tratamiento, profesional y horario disponible.
        </p>
      </div>

      <div className="animated-hero-actions">
        <a className="secondary-action hero-call-action" href="tel:08101224247">
          Hablar por teléfono
          <PhoneCall size={17} />
        </a>
        <button className="primary-action" type="button" onClick={onStartBooking}>
          Agendar turno
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}

export default AnimatedHero
