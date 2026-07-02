export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type TimeBlock = {
  start: string
  end: string
}

export type Treatment = {
  id: string
  name: string
  description: string
  duration: number
  price: string
}

export type BranchRegion = 'Buenos Aires' | 'CABA' | 'Interior'

export type Branch = {
  id: string
  region: BranchRegion
  name: string
}

export type Professional = {
  id: string
  branchId: string
  name: string
  specialty: string
  initials: string
  color: string
  active: boolean
  treatmentIds: string[]
  weeklyHours: Record<Weekday, TimeBlock[]>
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

export type Appointment = {
  id: string
  clientName: string
  phone: string
  email: string
  branchId?: string
  treatmentId: string
  professionalId: string
  date: string
  time: string
  notes: string
  status: AppointmentStatus
  createdAt: string
}

export const weekdayOrder: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const weekdayLabels: Record<Weekday, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const createBranch = (region: BranchRegion, name: string): Branch => ({
  id: `${slugify(region)}-${slugify(name)}`,
  region,
  name,
})

export const initialBranches: Branch[] = [
  createBranch('Buenos Aires', 'Centro Médico'),
  createBranch('Buenos Aires', 'Bahía Blanca'),
  createBranch('Buenos Aires', 'City Bell'),
  createBranch('Buenos Aires', 'La Plata'),
  createBranch('Buenos Aires', 'Lomas de Zamora'),
  createBranch('Buenos Aires', 'Mar del Plata'),
  createBranch('Buenos Aires', 'Martínez'),
  createBranch('Buenos Aires', 'Nordelta'),
  createBranch('Buenos Aires', 'Parque Leloir'),
  createBranch('Buenos Aires', 'Pilar'),
  createBranch('Buenos Aires', 'Quilmes'),
  createBranch('Buenos Aires', 'Ramos Mejía'),
  createBranch('Buenos Aires', 'Trenque Lauquen'),
  createBranch('Buenos Aires', 'Vicente López'),
  createBranch('CABA', 'Centro Médico'),
  createBranch('CABA', 'Belgrano'),
  createBranch('CABA', 'Caballito'),
  createBranch('CABA', 'Casa Central'),
  createBranch('CABA', 'Devoto'),
  createBranch('CABA', 'Palermo'),
  createBranch('CABA', 'Urquiza'),
  createBranch('Interior', 'Cerro de las Rosas'),
  createBranch('Interior', 'Córdoba'),
  createBranch('Interior', 'Córdoba Jockey'),
  createBranch('Interior', 'Gral Pico'),
  createBranch('Interior', 'Jujuy'),
  createBranch('Interior', 'Mendoza'),
  createBranch('Interior', 'Neuquén'),
  createBranch('Interior', 'Rada Tilly'),
  createBranch('Interior', 'Río Gallegos'),
  createBranch('Interior', 'Río Cuarto'),
  createBranch('Interior', 'Rosario'),
  createBranch('Interior', 'Salta'),
  createBranch('Interior', 'Santa Fe'),
  createBranch('Interior', 'Santa Rosa'),
  createBranch('Interior', 'Sgo del Estero'),
  createBranch('Interior', 'Tucumán'),
  createBranch('Interior', 'Villa Carlos Paz'),
  createBranch('Interior', 'Villa María'),
]

export const defaultBranchId = initialBranches[0].id

export const initialTreatments: Treatment[] = [
  {
    id: 'diagnosis',
    name: 'Evaluación capilar',
    description: 'Consulta inicial, diagnóstico y plan sugerido.',
    duration: 45,
    price: 'Sin cargo',
  },
  {
    id: 'prp',
    name: 'PRP capilar',
    description: 'Sesión médica de plasma rico en plaquetas.',
    duration: 60,
    price: '$85.000',
  },
  {
    id: 'mesotherapy',
    name: 'Mesoterapia capilar',
    description: 'Aplicación localizada para estimular el cuero cabelludo.',
    duration: 45,
    price: '$58.000',
  },
  {
    id: 'follow-up',
    name: 'Control post tratamiento',
    description: 'Seguimiento de evolución y ajustes del plan.',
    duration: 30,
    price: 'Incluido',
  },
]

const createSchedule = (
  input: Partial<Record<Weekday, TimeBlock[]>>,
): Record<Weekday, TimeBlock[]> =>
  weekdayOrder.reduce(
    (schedule, day) => {
      schedule[day] = input[day] ?? []
      return schedule
    },
    {} as Record<Weekday, TimeBlock[]>,
  )

const createProfessionalsForBranch = (branch: Branch): Professional[] => [
  {
    id: `${branch.id}-profesional-1`,
    branchId: branch.id,
    name: `Profesional ${branch.name} 1`,
    specialty: 'Medicina capilar',
    initials: 'P1',
    color: '#8b827a',
    active: true,
    treatmentIds: ['diagnosis', 'prp', 'follow-up'],
    weeklyHours: createSchedule({
      monday: [
        { start: '09:00', end: '13:00' },
        { start: '14:00', end: '18:00' },
      ],
      tuesday: [
        { start: '09:00', end: '13:00' },
        { start: '14:00', end: '18:00' },
      ],
      wednesday: [
        { start: '09:00', end: '13:00' },
        { start: '14:00', end: '18:00' },
      ],
      thursday: [
        { start: '09:00', end: '13:00' },
        { start: '14:00', end: '18:00' },
      ],
      friday: [
        { start: '09:00', end: '13:00' },
        { start: '14:00', end: '17:00' },
      ],
      saturday: [{ start: '10:00', end: '14:00' }],
    }),
  },
  {
    id: `${branch.id}-profesional-2`,
    branchId: branch.id,
    name: `Profesional ${branch.name} 2`,
    specialty: 'Tratamientos capilares',
    initials: 'P2',
    color: '#c5a282',
    active: true,
    treatmentIds: ['diagnosis', 'mesotherapy', 'follow-up'],
    weeklyHours: createSchedule({
      monday: [{ start: '11:00', end: '19:00' }],
      tuesday: [{ start: '11:00', end: '19:00' }],
      wednesday: [{ start: '11:00', end: '19:00' }],
      thursday: [{ start: '11:00', end: '19:00' }],
      friday: [{ start: '10:00', end: '16:00' }],
    }),
  },
]

export const initialProfessionals: Professional[] = initialBranches.flatMap(
  createProfessionalsForBranch,
)

export const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

export const todayInputValue = (): string => toDateInputValue(new Date())

export const getDateOptions = (days = 14): string[] =>
  Array.from({ length: days }, (_, index) =>
    toDateInputValue(addDays(new Date(), index)),
  )

export const formatDisplayDate = (date: string): string =>
  new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`))

export const getWeekdayFromDate = (date: string): Weekday => {
  const day = new Date(`${date}T12:00:00`).getDay()
  const dayMap: Weekday[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]
  return dayMap[day]
}

export const timeToMinutes = (time: string): number => {
  const [hours = '0', minutes = '0'] = time.split(':')
  return Number(hours) * 60 + Number(minutes)
}

export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export const fallbackTreatment: Treatment = {
  id: 'unknown',
  name: 'Servicio no disponible',
  description: 'Este servicio ya no se encuentra activo.',
  duration: 30,
  price: '-',
}

export const findTreatment = (
  treatmentId: string,
  treatmentList: Treatment[] = initialTreatments,
): Treatment =>
  treatmentList.find((treatment) => treatment.id === treatmentId) ??
  initialTreatments.find((treatment) => treatment.id === treatmentId) ??
  treatmentList[0] ??
  initialTreatments[0] ??
  fallbackTreatment

export const getMatchingProfessionals = (
  professionals: Professional[],
  treatmentId: string,
): Professional[] =>
  professionals.filter(
    (professional) =>
      professional.active && professional.treatmentIds.includes(treatmentId),
  )

const appointmentsOverlap = (
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean => startA < endB && startB < endA

export const getAvailableSlots = (
  professional: Professional,
  treatment: Treatment,
  date: string,
  appointments: Appointment[],
  treatmentList: Treatment[] = initialTreatments,
): string[] => {
  const blocks = professional.weeklyHours[getWeekdayFromDate(date)] ?? []
  const existingAppointments = appointments.filter(
    (appointment) =>
      appointment.professionalId === professional.id &&
      appointment.date === date &&
      appointment.status !== 'cancelled',
  )
  const now = new Date()
  const isToday = date === toDateInputValue(now)
  const minimumStart = now.getHours() * 60 + now.getMinutes() + 60

  return blocks.flatMap((block) => {
    const blockStart = timeToMinutes(block.start)
    const blockEnd = timeToMinutes(block.end)
    const slots: string[] = []

    for (
      let slotStart = blockStart;
      slotStart + treatment.duration <= blockEnd;
      slotStart += 30
    ) {
      const slotEnd = slotStart + treatment.duration
      const hasConflict = existingAppointments.some((appointment) => {
        const appointmentTreatment = findTreatment(
          appointment.treatmentId,
          treatmentList,
        )
        const appointmentStart = timeToMinutes(appointment.time)
        const appointmentEnd = appointmentStart + appointmentTreatment.duration
        return appointmentsOverlap(
          slotStart,
          slotEnd,
          appointmentStart,
          appointmentEnd,
        )
      })

      if (!hasConflict && (!isToday || slotStart >= minimumStart)) {
        slots.push(minutesToTime(slotStart))
      }
    }

    return slots
  })
}

export const initialAppointments: Appointment[] = [
  {
    id: 'seed-1',
    clientName: 'Laura Fernández',
    phone: '+54 9 11 5555-0194',
    email: 'laura.fernandez@email.com',
    branchId: defaultBranchId,
    treatmentId: 'diagnosis',
    professionalId: `${defaultBranchId}-profesional-1`,
    date: todayInputValue(),
    time: '15:00',
    notes: 'Consulta inicial por afinamiento frontal.',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    clientName: 'Nicolás Herrera',
    phone: '+54 9 11 5555-0140',
    email: 'nicolas.herrera@email.com',
    branchId: defaultBranchId,
    treatmentId: 'mesotherapy',
    professionalId: `${defaultBranchId}-profesional-2`,
    date: toDateInputValue(addDays(new Date(), 1)),
    time: '12:00',
    notes: 'Prefiere recibir recordatorio por WhatsApp.',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    clientName: 'Martín Sosa',
    phone: '+54 9 11 5555-0181',
    email: 'martin.sosa@email.com',
    branchId: defaultBranchId,
    treatmentId: 'follow-up',
    professionalId: `${defaultBranchId}-profesional-2`,
    date: toDateInputValue(addDays(new Date(), 2)),
    time: '10:30',
    notes: 'Control a 45 días.',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
]
