export const MOCK_PREGNANCY = {
  configured: true,
  week: 18,
  gestationalAgeWeeks: 17,
  gestationalAgeDays: 4,
  trimester: 2,
  progressPercent: 45,
  dueDateLabel: '15 janvier 2027',
  remainingWeeks: 22,
  remainingDays: 154,
  babySizeLabel: 'poivron',
  babyWeightLabel: '260 g',
  babyLengthLabel: '14,2 cm',
  nextAppointment: {
    dateLabel: '20 mai 2025',
    timeLabel: '10:30',
    type: 'Échographie',
    practitioner: 'Dr. Benali',
  },
  nextExam: {
    dateLabel: '30 mai 2025',
    type: 'Échographie T2',
  },
  calendar: {
    selectedDate: '2026-08-11',
    events: [
      {id: 'vitamins-2026-08-20', date: '2026-08-20', type: 'reminder', title: 'Rappel vitamines'},
      {id: 'consultation-2026-08-24', date: '2026-08-24', type: 'appointment', title: 'Consultation prénatale', time: '10:30'},
      {id: 'exam-2026-08-30', date: '2026-08-30', type: 'exam', title: 'Échographie T2'},
    ],
  },
} as const;
