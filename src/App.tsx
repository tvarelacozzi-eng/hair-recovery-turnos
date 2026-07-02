import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  UsersRound,
  XCircle,
} from 'lucide-react'
import {
  getAvailableSlots,
  defaultBranchId,
  findTreatment,
  formatDisplayDate,
  getDateOptions,
  initialAppointments,
  initialBranches,
  initialProfessionals,
  initialTreatments,
  statusLabels,
  timeToMinutes,
  todayInputValue,
  weekdayLabels,
  weekdayOrder,
  type Appointment,
  type AppointmentStatus,
  type Branch,
  type BranchRegion,
  type Professional,
  type TimeBlock,
  type Treatment,
  type Weekday,
} from './scheduling'
import AnimatedHero from './components/AnimatedHero'
import hairRecoveryLogo from './assets/hair-recovery-logo.svg'
import './App.css'

type ViewMode = 'booking' | 'admin'
type BookingStep = 0 | 1 | 2 | 3 | 4 | 5
type AdminModule = 'appointments' | 'professionals' | 'services'
type DateFilterMode = 'all' | 'date'
type StatusFilter = AppointmentStatus | 'all'

const statusOptions: StatusFilter[] = [
  'all',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
]

const bookingSteps = [
  'Sede',
  'Servicio',
  'Profesional',
  'Fecha y horario',
  'Datos',
] as const

const treatmentShowcase = [
  {
    category: 'Quirúrgicos',
    title: 'Microtrasplante capilar',
    description:
      'Tratamiento ambulatorio pelo por pelo, orientado a resultados naturales y definitivos.',
    items: ['Trasplante capilar', 'Barba y cejas', 'Robot ARTAS®'],
  },
  {
    category: 'No quirúrgicos',
    title: 'Nutrición y prevención',
    description:
      'Protocolos para detener la caída, fortalecer el pelo y mejorar brillo, grosor y vitalidad.',
    items: ['Nutrifol', 'PlasmaHair', 'Láser de baja frecuencia'],
  },
  {
    category: 'Diagnóstico',
    title: 'Hair Analysis',
    description:
      'Evaluación inicial con foco médico para definir el plan adecuado antes de reservar.',
    items: ['Análisis capilar', 'Plan personalizado', 'Seguimiento'],
  },
] as const

const aboutHighlights = [
  'Dedicación exclusiva a medicina capilar.',
  'Tratamientos personalizados por equipo médico.',
  'Tecnología avanzada y estándares de calidad.',
  'Acompañamiento durante todo el proceso.',
] as const

const branchRegions: BranchRegion[] = ['Buenos Aires', 'CABA', 'Interior']

const professionalPalette: Record<string, string> = {
  'valentina-rivas': '#8b827a',
  'mateo-godoy': '#c5a282',
  'camila-suarez': '#636a25',
}

const getProfessionalColor = (professional: Professional): string =>
  professionalPalette[professional.id] ?? professional.color

const getBranchLabel = (branch: Branch | undefined): string =>
  branch ? `${branch.region} · ${branch.name}` : 'Sede no disponible'

const getProfessionalBranchId = (professional: Professional | undefined): string =>
  professional?.branchId ?? defaultBranchId

const createAppointmentId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `appointment-${Date.now()}`

const normalizeServiceId = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'servicio'

const createServiceId = (
  serviceName: string,
  existingServices: Treatment[],
): string => {
  const baseId = normalizeServiceId(serviceName)
  const existingIds = new Set(existingServices.map((service) => service.id))
  let candidateId = baseId
  let suffix = 2

  while (existingIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`
    suffix += 1
  }

  return candidateId
}

const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key)
      return storedValue ? (JSON.parse(storedValue) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

const getStatusTone = (status: AppointmentStatus): string => {
  const tones: Record<AppointmentStatus, string> = {
    pending: 'warning',
    confirmed: 'success',
    completed: 'neutral',
    cancelled: 'danger',
  }
  return tones[status]
}

const sortAppointments = (appointments: Appointment[]): Appointment[] =>
  [...appointments].sort(
    (left, right) =>
      left.date.localeCompare(right.date) ||
      timeToMinutes(left.time) - timeToMinutes(right.time),
  )

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`status-badge ${getStatusTone(status)}`}>
      {statusLabels[status]}
    </span>
  )
}

function BookingProgress({ currentStep }: { currentStep: BookingStep }) {
  return (
    <div className="wizard-progress" aria-label="Progreso de reserva">
      {bookingSteps.map((label, index) => {
        const stepNumber = (index + 1) as BookingStep
        return (
          <span
            className={`progress-step ${
              currentStep === stepNumber ? 'active' : ''
            } ${currentStep > stepNumber ? 'complete' : ''}`}
            key={label}
          >
            {index + 1}
          </span>
        )
      })}
    </div>
  )
}

function App() {
  const today = todayInputValue()
  const dateOptions = useMemo(() => getDateOptions(14), [])
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>(
    'hair-recovery-appointments',
    initialAppointments,
  )
  const [professionals, setProfessionals] = useLocalStorage<Professional[]>(
    'hair-recovery-professionals',
    initialProfessionals,
  )
  const [services, setServices] = useLocalStorage<Treatment[]>(
    'hair-recovery-services',
    initialTreatments,
  )
  const [viewMode, setViewMode] = useState<ViewMode>('booking')
  const [bookingStep, setBookingStep] = useState<BookingStep>(0)
  const [adminModule, setAdminModule] = useState<AdminModule>('appointments')
  const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId)
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(
    initialProfessionals[0].id,
  )
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(
    initialTreatments[0].id,
  )
  const [selectedDate, setSelectedDate] = useState(dateOptions[0] ?? today)
  const [selectedTime, setSelectedTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmation, setConfirmation] = useState<Appointment | null>(null)
  const [adminBranchId, setAdminBranchId] = useState(defaultBranchId)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoginError, setAdminLoginError] = useState('')
  const [adminDate, setAdminDate] = useState(today)
  const [dateFilterMode, setDateFilterMode] =
    useState<DateFilterMode>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [scheduleProfessionalId, setScheduleProfessionalId] = useState(
    initialProfessionals[0].id,
  )
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceDescription, setNewServiceDescription] = useState('')
  const [newServiceDuration, setNewServiceDuration] = useState('45')
  const [newServicePrice, setNewServicePrice] = useState('')

  const branchesByRegion = useMemo(
    () =>
      branchRegions.map((region) => ({
        region,
        branches: initialBranches.filter((branch) => branch.region === region),
      })),
    [],
  )
  const selectedBranch =
    initialBranches.find((branch) => branch.id === selectedBranchId) ??
    initialBranches[0]
  const selectedAdminBranch =
    initialBranches.find((branch) => branch.id === adminBranchId) ??
    initialBranches[0]
  const activeProfessionals = useMemo(
    () => professionals.filter((professional) => professional.active),
    [professionals],
  )
  const branchProfessionals = useMemo(
    () =>
      activeProfessionals.filter(
        (professional) => getProfessionalBranchId(professional) === selectedBranchId,
      ),
    [activeProfessionals, selectedBranchId],
  )
  const adminBranchProfessionals = useMemo(
    () =>
      professionals.filter(
        (professional) => getProfessionalBranchId(professional) === adminBranchId,
      ),
    [adminBranchId, professionals],
  )
  const selectedTreatment =
    services.find((service) => service.id === selectedTreatmentId) ?? null
  const matchingProfessionals = useMemo(
    () =>
      branchProfessionals.filter((professional) =>
        professional.treatmentIds.includes(selectedTreatmentId),
      ),
    [branchProfessionals, selectedTreatmentId],
  )
  const selectedProfessional =
    matchingProfessionals.find(
      (professional) => professional.id === selectedProfessionalId,
    ) ?? matchingProfessionals[0]
  const availableSlots = useMemo(
    () =>
      selectedProfessional && selectedTreatment
        ? getAvailableSlots(
            selectedProfessional,
            selectedTreatment,
            selectedDate,
            appointments,
            services,
          )
        : [],
    [appointments, selectedDate, selectedProfessional, selectedTreatment, services],
  )
  const scheduleProfessional =
    adminBranchProfessionals.find(
      (professional) => professional.id === scheduleProfessionalId,
    ) ?? adminBranchProfessionals[0]
  const adminBranchAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const appointmentProfessional = professionals.find(
          (professional) => professional.id === appointment.professionalId,
        )
        const appointmentBranchId =
          appointment.branchId ?? getProfessionalBranchId(appointmentProfessional)
        return appointmentBranchId === adminBranchId
      }),
    [adminBranchId, appointments, professionals],
  )

  const activeAppointmentsToday = adminBranchAppointments.filter(
    (appointment) =>
      appointment.date === today && appointment.status !== 'cancelled',
  )
  const pendingAppointments = adminBranchAppointments.filter(
    (appointment) => appointment.status === 'pending',
  )
  const availableSlotsToday = adminBranchProfessionals.reduce((total, professional) => {
    const firstTreatment = services.find((treatment) =>
      professional.treatmentIds.includes(treatment.id),
    )
    return firstTreatment && professional.active
      ? total +
          getAvailableSlots(
            professional,
            firstTreatment,
            today,
            appointments,
            services,
          ).length
      : total
  }, 0)
  const adminAppointments = sortAppointments(
    adminBranchAppointments.filter(
      (appointment) =>
        (dateFilterMode === 'all' || appointment.date === adminDate) &&
        (statusFilter === 'all'
          ? appointment.status !== 'cancelled'
          : appointment.status === statusFilter),
    ),
  )
  const patientFieldsComplete =
    clientName.trim().length > 0 &&
    phone.trim().length > 0 &&
    email.trim().length > 0

  useEffect(() => {
    setProfessionals((currentProfessionals) => {
      let changed = false
      const existingIds = new Set(
        currentProfessionals.map((professional) => professional.id),
      )
      const normalizedProfessionals = currentProfessionals.map((professional) => {
        if (professional.branchId) {
          return professional
        }

        changed = true
        return { ...professional, branchId: defaultBranchId }
      })
      const missingProfessionals = initialProfessionals.filter(
        (professional) => !existingIds.has(professional.id),
      )

      if (missingProfessionals.length > 0) {
        changed = true
      }

      return changed
        ? [...normalizedProfessionals, ...missingProfessionals]
        : currentProfessionals
    })
  }, [setProfessionals])

  useEffect(() => {
    if (!services.some((service) => service.id === selectedTreatmentId)) {
      setSelectedTreatmentId(services[0]?.id ?? '')
      setSelectedTime('')
    }
  }, [selectedTreatmentId, services])

  useEffect(() => {
    if (
      !matchingProfessionals.some(
        (professional) => professional.id === selectedProfessionalId,
      )
    ) {
      setSelectedProfessionalId(matchingProfessionals[0]?.id ?? '')
      setSelectedTime('')
    }
  }, [matchingProfessionals, selectedProfessionalId])

  useEffect(() => {
    if (
      !adminBranchProfessionals.some(
        (professional) => professional.id === scheduleProfessionalId,
      )
    ) {
      setScheduleProfessionalId(adminBranchProfessionals[0]?.id ?? '')
    }
  }, [adminBranchProfessionals, scheduleProfessionalId])

  useEffect(() => {
    if (selectedTime && !availableSlots.includes(selectedTime)) {
      setSelectedTime('')
    }
  }, [availableSlots, selectedTime])

  const getProfessional = (professionalId: string) =>
    professionals.find((professional) => professional.id === professionalId)

  const startBooking = () => {
    setConfirmation(null)
    setBookingStep(1)
  }

  const restartBooking = () => {
    setConfirmation(null)
    setSelectedTime('')
    setSelectedDate(dateOptions[0] ?? today)
    setBookingStep(1)
  }

  const goBack = () => {
    setConfirmation(null)
    setBookingStep((currentStep) =>
      currentStep <= 1 ? 0 : ((currentStep - 1) as BookingStep),
    )
  }

  const goForward = () => {
    setConfirmation(null)
    setBookingStep((currentStep) =>
      currentStep >= 5 ? 5 : ((currentStep + 1) as BookingStep),
    )
  }

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId)
    setSelectedProfessionalId(
      activeProfessionals.find(
        (professional) =>
          getProfessionalBranchId(professional) === branchId &&
          professional.treatmentIds.includes(selectedTreatmentId),
      )?.id ?? '',
    )
    setSelectedTime('')
    setConfirmation(null)
  }

  const handleTreatmentSelect = (treatmentId: string) => {
    setSelectedTreatmentId(treatmentId)
    setSelectedProfessionalId(
      activeProfessionals.find(
        (professional) =>
          getProfessionalBranchId(professional) === selectedBranchId &&
          professional.treatmentIds.includes(treatmentId),
      )?.id ?? '',
    )
    setSelectedTime('')
    setConfirmation(null)
  }

  const handleProfessionalSelect = (professionalId: string) => {
    setSelectedProfessionalId(professionalId)
    setSelectedTime('')
    setConfirmation(null)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
    setConfirmation(null)
  }

  const handleCreateAppointment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      !selectedProfessional ||
      !selectedTreatment ||
      !selectedTime ||
      !patientFieldsComplete
    ) {
      return
    }

    const newAppointment: Appointment = {
      id: createAppointmentId(),
      clientName: clientName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      branchId: selectedBranchId,
      treatmentId: selectedTreatment.id,
      professionalId: selectedProfessional.id,
      date: selectedDate,
      time: selectedTime,
      notes: notes.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    setAppointments((currentAppointments) => [
      newAppointment,
      ...currentAppointments,
    ])
    setAdminDate(selectedDate)
    setDateFilterMode('date')
    setStatusFilter('all')
    setConfirmation(newAppointment)
    setClientName('')
    setPhone('')
    setEmail('')
    setNotes('')
    setSelectedTime('')
  }

  const updateAppointmentStatus = (
    appointmentId: string,
    status: AppointmentStatus,
  ) => {
    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, status }
          : appointment,
      ),
    )
  }

  const updateScheduleBlock = (
    day: Weekday,
    blockIndex: number,
    field: keyof TimeBlock,
    value: string,
  ) => {
    if (!scheduleProfessional) {
      return
    }

    setProfessionals((currentProfessionals) =>
      currentProfessionals.map((professional) => {
        if (professional.id !== scheduleProfessional.id) {
          return professional
        }

        const updatedBlocks = professional.weeklyHours[day].map((block, index) =>
          index === blockIndex ? { ...block, [field]: value } : block,
        )

        return {
          ...professional,
          weeklyHours: {
            ...professional.weeklyHours,
            [day]: updatedBlocks,
          },
        }
      }),
    )
  }

  const addScheduleBlock = (day: Weekday) => {
    if (!scheduleProfessional) {
      return
    }

    setProfessionals((currentProfessionals) =>
      currentProfessionals.map((professional) =>
        professional.id === scheduleProfessional.id
          ? {
              ...professional,
              weeklyHours: {
                ...professional.weeklyHours,
                [day]: [
                  ...professional.weeklyHours[day],
                  { start: '09:00', end: '13:00' },
                ],
              },
            }
          : professional,
      ),
    )
  }

  const removeScheduleBlock = (day: Weekday, blockIndex: number) => {
    if (!scheduleProfessional) {
      return
    }

    setProfessionals((currentProfessionals) =>
      currentProfessionals.map((professional) =>
        professional.id === scheduleProfessional.id
          ? {
              ...professional,
              weeklyHours: {
                ...professional.weeklyHours,
                [day]: professional.weeklyHours[day].filter(
                  (_, index) => index !== blockIndex,
                ),
              },
            }
          : professional,
      ),
    )
  }

  const toggleProfessionalActive = () => {
    if (!scheduleProfessional) {
      return
    }

    setProfessionals((currentProfessionals) =>
      currentProfessionals.map((professional) =>
        professional.id === scheduleProfessional.id
          ? { ...professional, active: !professional.active }
          : professional,
      ),
    )
  }

  const toggleProfessionalTreatment = (treatmentId: string) => {
    if (!scheduleProfessional) {
      return
    }

    setProfessionals((currentProfessionals) =>
      currentProfessionals.map((professional) => {
        if (professional.id !== scheduleProfessional.id) {
          return professional
        }

        const hasTreatment = professional.treatmentIds.includes(treatmentId)

        return {
          ...professional,
          treatmentIds: hasTreatment
            ? professional.treatmentIds.filter((id) => id !== treatmentId)
            : [...professional.treatmentIds, treatmentId],
        }
      }),
    )
  }

  const handleCreateService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const serviceName = newServiceName.trim()
    const serviceDescription = newServiceDescription.trim()
    const serviceDuration = Number(newServiceDuration)
    const servicePrice = newServicePrice.trim()

    if (
      !serviceName ||
      !Number.isFinite(serviceDuration) ||
      serviceDuration <= 0
    ) {
      return
    }

    const newService: Treatment = {
      id: createServiceId(serviceName, services),
      name: serviceName,
      description:
        serviceDescription || 'Servicio configurado desde administracion.',
      duration: serviceDuration,
      price: servicePrice || '-',
    }

    setServices((currentServices) => [...currentServices, newService])
    setNewServiceName('')
    setNewServiceDescription('')
    setNewServiceDuration('45')
    setNewServicePrice('')
  }

  const removeService = (serviceId: string) => {
    const nextSelectedTreatmentId =
      services.find((service) => service.id !== serviceId)?.id ?? ''

    setServices((currentServices) =>
      currentServices.filter((service) => service.id !== serviceId),
    )
    setProfessionals((currentProfessionals) =>
      currentProfessionals.map((professional) => ({
        ...professional,
        treatmentIds: professional.treatmentIds.filter((id) => id !== serviceId),
      })),
    )

    if (selectedTreatmentId === serviceId) {
      setSelectedTreatmentId(nextSelectedTreatmentId)
      setSelectedTime('')
    }
  }

  const handleAdminLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      adminEmail.trim().toLowerCase() === 'admin@admin.com' &&
      adminPassword === 'admin'
    ) {
      setIsAdminAuthenticated(true)
      setAdminLoginError('')
      setAdminPassword('')
      return
    }

    setAdminLoginError('Usuario o contraseña incorrectos.')
  }

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false)
    setAdminEmail('')
    setAdminPassword('')
    setAdminLoginError('')
  }

  const goHome = () => {
    setViewMode('booking')
    setBookingStep(0)
    setConfirmation(null)
  }

  const goToBookingStep = (step: BookingStep) => {
    setViewMode('booking')
    setBookingStep(step)
    setConfirmation(null)
  }

  const goToSection = (sectionId: string) => {
    goHome()
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 0)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={goHome}>
          <img
            className="brand-logo"
            src={hairRecoveryLogo}
            alt="Hair Recovery"
          />
          <div>
            <strong>Hair Recovery</strong>
            <span>Sistema de turnos</span>
          </div>
        </button>

        <nav className="main-nav" aria-label="Navegación principal">
          <button type="button" onClick={() => goToBookingStep(1)}>
            Turno Web
          </button>
          <button type="button" onClick={() => goToSection('tratamientos')}>
            Tratamientos
          </button>
          <button type="button" onClick={() => goToSection('nosotros')}>
            Nosotros
          </button>
          <button type="button" onClick={() => goToSection('sedes')}>
            Sedes
          </button>
          <a
            href="https://eshop.hairrecovery.com.ar"
            target="_blank"
            rel="noreferrer"
          >
            Shop
          </a>
          <a href="tel:08101224247">0810-122-4247</a>
          <a
            className="nav-icon-link"
            href="https://wa.me/5491112224247"
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
          >
            <MessageCircle size={23} />
          </a>
          <button
            className="admin-nav-link"
            type="button"
            onClick={() => setViewMode('admin')}
          >
            <ShieldCheck size={17} />
            Admin
          </button>
        </nav>
      </header>

      {viewMode === 'booking' ? (
        <main className={`booking-view ${bookingStep === 0 ? 'intro-mode' : ''}`}>
          <section className="booking-panel wizard-panel" aria-labelledby="booking-title">
            {bookingStep === 0 ? (
              <div className="booking-intro">
                <AnimatedHero onStartBooking={startBooking} />

                <section
                  className="landing-section treatments-showcase"
                  id="tratamientos"
                  aria-labelledby="tratamientos-title"
                >
                  <div className="landing-heading">
                    <span>Tratamientos</span>
                    <h2 id="tratamientos-title">
                      Tecnología médica para recuperar, mantener y cuidar tu pelo.
                    </h2>
                    <p>
                      Inspirado en la propuesta oficial de Hair Recovery: cirugía
                      capilar, tratamientos preventivos y diagnóstico para definir
                      el camino adecuado.
                    </p>
                  </div>
                  <div className="treatment-showcase-grid">
                    {treatmentShowcase.map((treatment) => (
                      <article className="treatment-showcase-card" key={treatment.title}>
                        <span>{treatment.category}</span>
                        <h3>{treatment.title}</h3>
                        <p>{treatment.description}</p>
                        <ul>
                          {treatment.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="about-preview" id="nosotros">
                  <div className="timeline-rail" aria-hidden="true">
                    <span></span>
                  </div>
                  <section>
                    <span>Desde 1996</span>
                    <h2>Una idea pionera en medicina capilar</h2>
                    <p>
                      Hair Recovery nació para ofrecer respuestas médicas,
                      científicas y personalizadas a pacientes con alopecia,
                      afinamiento o caída capilar.
                    </p>
                  </section>
                  <section>
                    <span>Hoy</span>
                    <h2>Atención integral de principio a fin</h2>
                    <p>
                      El equipo acompaña cada consulta con diagnóstico,
                      tratamiento y seguimiento, sosteniendo una experiencia
                      clara desde el primer turno.
                    </p>
                  </section>
                </section>

                <section
                  className="landing-section about-detail"
                  aria-labelledby="about-detail-title"
                >
                  <div className="landing-heading">
                    <span>Nosotros</span>
                    <h2 id="about-detail-title">
                      Una clínica integral dedicada exclusivamente a medicina capilar.
                    </h2>
                  </div>
                  <div className="about-detail-grid">
                    <p>
                      La historia de Hair Recovery se apoya en una idea pionera:
                      acercar respuestas médicas y científicas para la caída y el
                      afinamiento capilar, con tratamientos personalizados.
                    </p>
                    <div className="about-highlight-list">
                      {aboutHighlights.map((highlight) => (
                        <span key={highlight}>{highlight}</span>
                      ))}
                    </div>
                  </div>
                </section>

                <section
                  className="landing-section branches-showcase"
                  id="sedes"
                  aria-labelledby="sedes-title"
                >
                  <div className="landing-heading">
                    <span>Sedes</span>
                    <h2 id="sedes-title">Encontrá tu centro Hair Recovery más cercano.</h2>
                    <p>
                      La red de sedes está organizada por región para que el primer
                      paso de la reserva sea claro y rápido.
                    </p>
                  </div>
                  <div className="branches-showcase-grid">
                    {branchesByRegion.map(({ region, branches }) => (
                      <article className="branches-showcase-card" key={region}>
                        <h3>{region}</h3>
                        <div>
                          {branches.slice(0, 9).map((branch) => (
                            <span key={branch.id}>{branch.name}</span>
                          ))}
                        </div>
                        <small>
                          {branches.length} centros disponibles para reservar.
                        </small>
                      </article>
                    ))}
                  </div>
                  <button
                    className="primary-action intro-action"
                    type="button"
                    onClick={startBooking}
                  >
                    Elegir sede y agendar
                    <ChevronRight size={19} />
                  </button>
                </section>
              </div>
            ) : (
              <>
                <div className="wizard-header">
                  <div className="section-heading">
                    <span>Reserva online</span>
                    <h1 id="booking-title">Agendá tu consulta capilar</h1>
                    <p>
                      Paso {bookingStep} de 5 · {bookingSteps[bookingStep - 1]}
                    </p>
                  </div>
                  <BookingProgress currentStep={bookingStep} />
                </div>

                {bookingStep === 1 ? (
                  <section className="wizard-card" aria-labelledby="branch-title">
                    <div className="step-title">
                      <span>1</span>
                      <h2 id="branch-title">Elegí sede</h2>
                    </div>
                    <div className="branch-group-list">
                      {branchesByRegion.map(({ region, branches }) => (
                        <section className="branch-group" key={region}>
                          <h3>{region}</h3>
                          <div className="branch-grid">
                            {branches.map((branch) => {
                              const branchProfessionalCount = activeProfessionals.filter(
                                (professional) =>
                                  getProfessionalBranchId(professional) === branch.id,
                              ).length

                              return (
                                <button
                                  className={`branch-card ${
                                    selectedBranchId === branch.id ? 'selected' : ''
                                  }`}
                                  type="button"
                                  key={branch.id}
                                  onClick={() => handleBranchSelect(branch.id)}
                                >
                                  <strong>{branch.name}</strong>
                                  <span>{branch.region}</span>
                                  <small>
                                    {branchProfessionalCount} profesionales disponibles
                                  </small>
                                </button>
                              )
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                    <div className="wizard-actions">
                      <button className="secondary-action" type="button" onClick={goBack}>
                        <ArrowLeft size={18} />
                        Volver
                      </button>
                      <button
                        className="primary-action"
                        type="button"
                        onClick={goForward}
                        disabled={!selectedBranch}
                      >
                        Continuar
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </section>
                ) : null}

                {bookingStep === 2 ? (
                  <section className="wizard-card" aria-labelledby="treatment-title">
                    <div className="step-title">
                      <span>2</span>
                      <h2 id="treatment-title">Elegí servicio</h2>
                    </div>
                    <div className="treatment-grid">
                      {services.map((treatment) => {
                        const compatibleCount = branchProfessionals.filter(
                          (professional) =>
                            professional.treatmentIds.includes(treatment.id),
                        ).length

                        return (
                          <button
                            className={`treatment-card ${
                              selectedTreatmentId === treatment.id ? 'selected' : ''
                            }`}
                            type="button"
                            key={treatment.id}
                            onClick={() => handleTreatmentSelect(treatment.id)}
                          >
                            <strong>{treatment.name}</strong>
                            <span>{treatment.description}</span>
                            <small>
                              {treatment.duration} min · {compatibleCount}{' '}
                              profesional{compatibleCount === 1 ? '' : 'es'}
                            </small>
                          </button>
                        )
                      })}
                      {services.length === 0 ? (
                        <div className="empty-state compact">
                          No hay servicios cargados para reservar online.
                        </div>
                      ) : null}
                    </div>
                    <div className="wizard-actions">
                      <button className="secondary-action" type="button" onClick={goBack}>
                        <ArrowLeft size={18} />
                        Inicio
                      </button>
                      <button
                        className="primary-action"
                        type="button"
                        onClick={goForward}
                        disabled={!selectedTreatment || matchingProfessionals.length === 0}
                      >
                        Continuar
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </section>
                ) : null}

                {bookingStep === 3 ? (
                  <section className="wizard-card" aria-labelledby="professional-title">
                    <div className="step-title">
                      <span>3</span>
                      <h2 id="professional-title">Elegí profesional</h2>
                    </div>
                    <div className="professional-list">
                      {matchingProfessionals.map((professional) => (
                        <button
                          className={`professional-option ${
                            selectedProfessional?.id === professional.id ? 'selected' : ''
                          }`}
                          type="button"
                          key={professional.id}
                          onClick={() => handleProfessionalSelect(professional.id)}
                        >
                          <span
                            className="avatar"
                            style={{ backgroundColor: getProfessionalColor(professional) }}
                          >
                            {professional.initials}
                          </span>
                          <span>
                            <strong>{professional.name}</strong>
                            <small>{professional.specialty}</small>
                          </span>
                          <ChevronRight size={18} />
                        </button>
                      ))}
                      {matchingProfessionals.length === 0 ? (
                        <div className="empty-state compact">
                          No hay profesionales disponibles para este servicio.
                        </div>
                      ) : null}
                    </div>
                    <div className="wizard-actions">
                      <button className="secondary-action" type="button" onClick={goBack}>
                        <ArrowLeft size={18} />
                        Volver
                      </button>
                      <button
                        className="primary-action"
                        type="button"
                        onClick={goForward}
                        disabled={!selectedProfessional}
                      >
                        Continuar
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </section>
                ) : null}

                {bookingStep === 4 ? (
                  <section className="wizard-card" aria-labelledby="availability-title">
                    <div className="step-title">
                      <span>4</span>
                      <h2 id="availability-title">Elegí fecha y horario</h2>
                    </div>
                    <div className="date-strip">
                      {dateOptions.map((date) => (
                        <button
                          className={selectedDate === date ? 'selected' : ''}
                          type="button"
                          key={date}
                          onClick={() => handleDateSelect(date)}
                        >
                          {formatDisplayDate(date)}
                        </button>
                      ))}
                    </div>

                    <div className="slot-grid">
                      {availableSlots.map((slot) => (
                        <button
                          className={selectedTime === slot ? 'selected' : ''}
                          type="button"
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                        >
                          <Clock size={16} />
                          {slot}
                        </button>
                      ))}
                    </div>

                    {availableSlots.length === 0 ? (
                      <div className="empty-state">
                        No quedan horarios disponibles para esa combinación.
                      </div>
                    ) : null}

                    <div className="wizard-actions">
                      <button className="secondary-action" type="button" onClick={goBack}>
                        <ArrowLeft size={18} />
                        Volver
                      </button>
                      <button
                        className="primary-action"
                        type="button"
                        onClick={goForward}
                        disabled={!selectedTime}
                      >
                        Continuar
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </section>
                ) : null}

                {bookingStep === 5 ? (
                  <form className="booking-form wizard-card" onSubmit={handleCreateAppointment}>
                    <div className="step-title">
                      <span>5</span>
                      <h2>Completá tus datos</h2>
                    </div>
                    <div className="field-grid">
                      <label>
                        Nombre completo
                        <input
                          value={clientName}
                          onChange={(event) => setClientName(event.target.value)}
                          placeholder="Ej. Sofía Pérez"
                          required
                        />
                      </label>
                      <label>
                        Teléfono
                        <input
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="+54 9 11 5555-0000"
                          required
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="nombre@email.com"
                          required
                        />
                      </label>
                      <label>
                        Comentarios
                        <input
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Motivo de consulta"
                        />
                      </label>
                    </div>

                    <div className="booking-summary">
                      <div>
                        <span>Selección</span>
                        <strong>
                          {selectedTreatment?.name ?? 'Servicio no disponible'}
                          {selectedTime ? ` · ${selectedTime}` : ''}
                        </strong>
                        <small>
                          {getBranchLabel(selectedBranch)} ·{' '}
                          {selectedProfessional?.name ?? 'Sin profesional'} ·{' '}
                          {formatDisplayDate(selectedDate)}
                        </small>
                      </div>
                      <button
                        className="primary-action"
                        type="submit"
                        disabled={!selectedTime || !patientFieldsComplete}
                      >
                        <Check size={18} />
                        Solicitar turno
                      </button>
                    </div>

                    {confirmation ? (
                      <div className="confirmation">
                        <CheckCircle2 size={20} />
                        <span>
                          Turno solicitado para {confirmation.clientName} el{' '}
                          {formatDisplayDate(confirmation.date)} a las{' '}
                          {confirmation.time} en {getBranchLabel(selectedBranch)}.
                          El equipo lo confirmará a la brevedad.
                        </span>
                        <button className="secondary-action" type="button" onClick={restartBooking}>
                          Agendar otro turno
                        </button>
                      </div>
                    ) : null}

                    <div className="wizard-actions">
                      <button className="secondary-action" type="button" onClick={goBack}>
                        <ArrowLeft size={18} />
                        Volver
                      </button>
                    </div>
                  </form>
                ) : null}
              </>
            )}
          </section>
        </main>
      ) : (
        <main className="admin-view">
          {isAdminAuthenticated ? (
            <>
          <section className="admin-header" aria-labelledby="admin-title">
            <div className="section-heading">
              <span>Administrador</span>
              <h1 id="admin-title">Gestión operativa de turnos</h1>
              <p>
                Control de agenda diaria, estado de reservas y horarios para{' '}
                {getBranchLabel(selectedAdminBranch)}.
              </p>
            </div>
            <div className="admin-actions">
              <label>
                Sede
                <select
                  value={adminBranchId}
                  onChange={(event) => setAdminBranchId(event.target.value)}
                >
                  {initialBranches.map((branch) => (
                    <option value={branch.id} key={branch.id}>
                      {getBranchLabel(branch)}
                    </option>
                  ))}
                </select>
              </label>
              {adminModule === 'appointments' ? (
                <>
                <div className="date-filter-toggle" aria-label="Filtro de fecha">
                  <button
                    className={dateFilterMode === 'all' ? 'selected' : ''}
                    type="button"
                    onClick={() => setDateFilterMode('all')}
                  >
                    Todos
                  </button>
                  <button
                    className={dateFilterMode === 'date' ? 'selected' : ''}
                    type="button"
                    onClick={() => setDateFilterMode('date')}
                  >
                    Por fecha
                  </button>
                </div>
                {dateFilterMode === 'date' ? (
                  <label>
                    Fecha
                    <input
                      type="date"
                      value={adminDate}
                      onChange={(event) => setAdminDate(event.target.value)}
                    />
                  </label>
                ) : null}
                </>
              ) : null}
              <button className="admin-logout" type="button" onClick={handleAdminLogout}>
                Salir
              </button>
            </div>
          </section>

          <section className="stats-grid" aria-label="Indicadores">
            <StatCard
              icon={<CalendarDays size={22} />}
              label="Turnos hoy"
              value={String(activeAppointmentsToday.length)}
              detail="sin cancelados"
            />
            <StatCard
              icon={<Clock size={22} />}
              label="Huecos libres"
              value={String(availableSlotsToday)}
              detail="próximas horas"
            />
            <StatCard
              icon={<UsersRound size={22} />}
              label="Profesionales"
              value={String(
                adminBranchProfessionals.filter((professional) => professional.active)
                  .length,
              )}
              detail="activos"
            />
            <StatCard
              icon={<SlidersHorizontal size={22} />}
              label="Pendientes"
              value={String(pendingAppointments.length)}
              detail="requieren confirmación"
            />
          </section>

          <section className="admin-module-tabs" aria-label="Módulos de administrador">
            <button
              className={adminModule === 'appointments' ? 'selected' : ''}
              type="button"
              onClick={() => setAdminModule('appointments')}
            >
              <CalendarDays size={18} />
              Turnos
            </button>
            <button
              className={adminModule === 'professionals' ? 'selected' : ''}
              type="button"
              onClick={() => setAdminModule('professionals')}
            >
              <UsersRound size={18} />
              Profesionales
            </button>
            <button
              className={adminModule === 'services' ? 'selected' : ''}
              type="button"
              onClick={() => setAdminModule('services')}
            >
              <SlidersHorizontal size={18} />
              Servicios
            </button>
          </section>

          <section
            className={`admin-layout ${
              adminModule === 'professionals' ? '' : 'single'
            }`}
          >
            <div
              className={`appointments-panel ${
                adminModule === 'appointments' ? '' : 'is-hidden'
              }`}
            >
              <div className="panel-heading">
                <div>
                  <span>Turnos</span>
                  <h2>
                    {dateFilterMode === 'all'
                      ? 'Todos los turnos'
                      : formatDisplayDate(adminDate)}
                  </h2>
                </div>
                <div className="status-filter">
                  {statusOptions.map((status) => (
                    <button
                      className={statusFilter === status ? 'selected' : ''}
                      type="button"
                      key={status}
                      onClick={() => setStatusFilter(status)}
                    >
                        {status === 'all' ? 'Activos' : statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="appointment-list">
                {adminAppointments.map((appointment) => {
                  const professional = getProfessional(appointment.professionalId)
                  const treatment = findTreatment(appointment.treatmentId, services)

                    return (
                      <article className="appointment-card" key={appointment.id}>
                        <div className="appointment-time">
                          <span>
                            <Clock size={16} />
                            <strong>{appointment.time}</strong>
                          </span>
                          <small>{formatDisplayDate(appointment.date)}</small>
                        </div>
                      <div className="appointment-main">
                        <div className="appointment-title">
                          <strong>{appointment.clientName}</strong>
                          <StatusBadge status={appointment.status} />
                        </div>
                        <span>{treatment.name}</span>
                        <small>
                          {professional?.name ?? 'Profesional no asignado'}
                        </small>
                        <div className="appointment-contact">
                          <span>
                            <Phone size={14} />
                            {appointment.phone}
                          </span>
                          {appointment.email ? (
                            <span>
                              <Mail size={14} />
                              {appointment.email}
                            </span>
                          ) : null}
                        </div>
                        {appointment.notes ? <p>{appointment.notes}</p> : null}
                      </div>
                      <div className="appointment-actions">
                        <select
                          value={appointment.status}
                          onChange={(event) =>
                            updateAppointmentStatus(
                              appointment.id,
                              event.target.value as AppointmentStatus,
                            )
                          }
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="completed">Completado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            updateAppointmentStatus(appointment.id, 'cancelled')
                          }
                        >
                          <XCircle size={16} />
                          Cancelar
                        </button>
                      </div>
                    </article>
                  )
                })}

                {adminAppointments.length === 0 ? (
                  <div className="empty-state">
                    No hay turnos para la fecha y filtro seleccionados.
                  </div>
                ) : null}
              </div>
            </div>

            {adminModule === 'professionals' ? (
              <div className="professionals-panel">
                <div className="panel-heading">
                  <div>
                    <span>Profesionales</span>
                    <h2>Equipo disponible</h2>
                  </div>
                  <UsersRound size={22} />
                </div>

                <div className="professional-admin-list">
                  {adminBranchProfessionals.map((professional) => (
                    <button
                      className={`professional-admin-card ${
                        scheduleProfessional?.id === professional.id
                          ? 'selected'
                          : ''
                      }`}
                      type="button"
                      key={professional.id}
                      onClick={() => setScheduleProfessionalId(professional.id)}
                    >
                      <span
                        className="avatar"
                        style={{ backgroundColor: getProfessionalColor(professional) }}
                      >
                        {professional.initials}
                      </span>
                      <span>
                        <strong>{professional.name}</strong>
                        <small>{professional.specialty}</small>
                      </span>
                      <small>
                        {professional.active ? 'Online' : 'Oculto'} ·{' '}
                        {professional.treatmentIds.length} servicios
                      </small>
                    </button>
                  ))}
                  {adminBranchProfessionals.length === 0 ? (
                    <div className="empty-state">
                      No hay profesionales cargados en esta sede.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <aside
              className={`schedule-panel ${
                adminModule === 'professionals' ? '' : 'is-hidden'
              }`}
            >
              <div className="panel-heading">
                <div>
                  <span>Configuracion</span>
                  <h2>{scheduleProfessional?.name ?? 'Profesional'}</h2>
                </div>
                <Settings2 size={22} />
              </div>

              {scheduleProfessional ? (
                <>
                  <button
                    className={`availability-toggle ${
                      scheduleProfessional.active ? 'active' : ''
                    }`}
                    type="button"
                    onClick={toggleProfessionalActive}
                  >
                    <UserRound size={18} />
                    {scheduleProfessional.active
                      ? 'Disponible online'
                      : 'Oculto para reservas'}
                  </button>

                  <section className="service-assignment" aria-labelledby="service-assignment-title">
                    <div>
                      <span>Servicios</span>
                      <h3 id="service-assignment-title">Qué realiza este profesional</h3>
                    </div>
                    <div className="service-toggle-list">
                      {services.map((treatment) => (
                        <label className="service-toggle" key={treatment.id}>
                          <input
                            type="checkbox"
                            checked={scheduleProfessional.treatmentIds.includes(treatment.id)}
                            onChange={() => toggleProfessionalTreatment(treatment.id)}
                          />
                          <span>
                            <strong>{treatment.name}</strong>
                            <small>{treatment.duration} min</small>
                          </span>
                        </label>
                      ))}
                      {services.length === 0 ? (
                        <div className="empty-state">
                          No hay servicios cargados para asignar.
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <div className="schedule-list">
                    {weekdayOrder.map((day) => (
                      <section className="day-row" key={day}>
                        <div className="day-heading">
                          <strong>{weekdayLabels[day]}</strong>
                          <button type="button" onClick={() => addScheduleBlock(day)}>
                            <Plus size={15} />
                            Bloque
                          </button>
                        </div>

                        {scheduleProfessional.weeklyHours[day].map((block, index) => (
                          <div className="time-block" key={`${day}-${index}`}>
                            <input
                              aria-label={`${weekdayLabels[day]} inicio`}
                              type="time"
                              value={block.start}
                              onChange={(event) =>
                                updateScheduleBlock(
                                  day,
                                  index,
                                  'start',
                                  event.target.value,
                                )
                              }
                            />
                            <span>a</span>
                            <input
                              aria-label={`${weekdayLabels[day]} fin`}
                              type="time"
                              value={block.end}
                              onChange={(event) =>
                                updateScheduleBlock(
                                  day,
                                  index,
                                  'end',
                                  event.target.value,
                                )
                              }
                            />
                            <button
                              className="icon-button"
                              aria-label={`Eliminar bloque de ${weekdayLabels[day]}`}
                              type="button"
                              onClick={() => removeScheduleBlock(day, index)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}

                        {scheduleProfessional.weeklyHours[day].length === 0 ? (
                          <small className="closed-label">Sin atención</small>
                        ) : null}
                      </section>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">No hay profesionales cargados.</div>
              )}
            </aside>

            {adminModule === 'services' ? (
              <section className="services-panel">
                <div className="panel-heading">
                  <div>
                    <span>Servicios</span>
                    <h2>Agregar o quitar servicios</h2>
                  </div>
                  <SlidersHorizontal size={22} />
                </div>

                <form className="service-form" onSubmit={handleCreateService}>
                  <label>
                    Nombre
                    <input
                      value={newServiceName}
                      onChange={(event) => setNewServiceName(event.target.value)}
                      placeholder="Ej. Consulta de diagnostico"
                      required
                    />
                  </label>
                  <label>
                    Descripcion
                    <input
                      value={newServiceDescription}
                      onChange={(event) =>
                        setNewServiceDescription(event.target.value)
                      }
                      placeholder="Detalle breve del servicio"
                    />
                  </label>
                  <label>
                    Duracion
                    <input
                      min="15"
                      step="15"
                      type="number"
                      value={newServiceDuration}
                      onChange={(event) => setNewServiceDuration(event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Precio
                    <input
                      value={newServicePrice}
                      onChange={(event) => setNewServicePrice(event.target.value)}
                      placeholder="Ej. $85.000"
                    />
                  </label>
                  <button className="primary-action" type="submit">
                    <Plus size={18} />
                    Agregar servicio
                  </button>
                </form>

                <div className="service-admin-list">
                  {services.map((service) => {
                    const assignedProfessionals = adminBranchProfessionals.filter((professional) =>
                      professional.treatmentIds.includes(service.id),
                    ).length

                    return (
                      <article className="service-admin-card" key={service.id}>
                        <div>
                          <strong>{service.name}</strong>
                          <span>{service.description}</span>
                          <small>
                            {service.duration} min · {service.price} ·{' '}
                            {assignedProfessionals} profesionales
                          </small>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeService(service.id)}
                        >
                          <Trash2 size={16} />
                          Quitar
                        </button>
                      </article>
                    )
                  })}

                  {services.length === 0 ? (
                    <div className="empty-state">No hay servicios cargados.</div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </section>
            </>
          ) : (
            <section className="admin-login-panel" aria-labelledby="admin-login-title">
              <div className="section-heading">
                <span>Acceso administrador</span>
                <h1 id="admin-login-title">Ingresá para gestionar turnos</h1>
                <p>
                  Usuario maestro inicial: admin@admin.com. En una etapa posterior
                  cada sede tendrá su propio usuario y verá solo su información.
                </p>
              </div>

              <form className="admin-login-form" onSubmit={handleAdminLogin}>
                <label>
                  Email
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    placeholder="admin@admin.com"
                    required
                  />
                </label>
                <label>
                  Contraseña
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    placeholder="admin"
                    required
                  />
                </label>
                {adminLoginError ? (
                  <div className="login-error">{adminLoginError}</div>
                ) : null}
                <button className="primary-action" type="submit">
                  <ShieldCheck size={18} />
                  Ingresar
                </button>
              </form>
            </section>
          )}
        </main>
      )}
    </div>
  )
}

export default App
