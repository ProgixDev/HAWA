// Português (Brasil) — pt-BR. An OVERLAY on ptPT.ts: only the words, spellings and constructions that differ in Brazil. i18next resolves pt-BR → pt-PT → en
// key by key (see i18n/index.ts), so a key that is not listed here reads exactly as in Portugal. A changed array ships the whole array. Terms that need a
// Brazilian medical / religious reviewer are listed in mobile/docs/i18n/portuguese-review-checklist.md.
export const ptBR = {
  common: {
    save: 'Salvar',
  },
  about: {
    logoA11y: 'Logotipo da AWA',
    title: 'Sobre a AWA',
    subtitle: 'Saiba mais sobre o seu aplicativo 💜',
    linkUnavailable: 'Este link não está disponível no momento.',
    emailAppUnavailable: 'Não foi possível abrir o seu aplicativo de e-mail.',
    linkOpenFailed: 'Não foi possível abrir este link.',
    appDescription: 'A AWA acompanha você todos os dias para compreender o seu corpo, acompanhar o seu ciclo e cuidar de si com tranquilidade.',
    sectionAppInfo: 'Informações do aplicativo',
    rowDesignedWithValue: '💜 pela equipe da AWA',
    sectionAbout: 'Sobre',
    privacyValueText: 'A sua privacidade é a nossa prioridade absoluta. Todos os seus dados permanecem protegidos no aplicativo.',
    termsOfUse: 'Termos de uso',
    buildLabel: 'Build {{build}}',
    teamModalTitle: 'A equipe da AWA',
  },
  libraryArticle: {
    shareA11y: 'Compartilhar',
    bookmarkA11y: 'Salvar nos favoritos',
  },
  journalEntryDate: {
    futureEntryMessage: 'Não é possível salvar um registro de acompanhamento para uma data futura.',
  },
  inlineCalendarPicker: {
    nextMonthA11y: 'Próximo mês',
  },
  birthDatePicker: {
    backToMonthA11y: 'Voltar para {{month}}',
  },
  objectives: {
    contraception: 'Contracepção',
  },
  averageCycle: {
    measuredSubtitle: 'Com base nos seus ciclos registrados',
    declaredSubtitle: 'Com base no que você informou',
    days_one: '{{count}} dia',
    days_other: '{{count}} dias',
  },
  appearance: {
    headerTitle: 'Aparência',
    subtitle: 'Personalize a aparência do seu aplicativo AWA\nconforme as suas preferências.',
    languageRowTitle: 'Idioma do aplicativo',
    infoText: 'Você pode alterar a aparência a qualquer momento nas configurações.',
    language: {
      title: 'Idioma do aplicativo',
      systemName: 'Padrão do dispositivo',
    },
  },
  cycleHome: {
    preFirstPeriod: {
      title: 'Ainda sem períodos registrados',
      subtitleOwner: 'Registre o início do seu período para começar o seu acompanhamento.',
    },
    education: {
      title: 'Preparando o primeiro período dela',
      body: 'Cada menina tem o primeiro período em uma época diferente. A AWA permite começar o acompanhamento assim que acontecer.',
    },
    phase: {
      follicular: {
        message: 'A sua energia está aumentando suavemente — um bom momento para se reencontrar consigo.',
        energy: 'Subindo',
      },
      ovulation: {
        message: 'A ovulação é esperada para hoje, e a sua energia está no auge.',
        tip: 'Movimente-se com suavidade',
      },
      luteal: {
        message: 'O seu corpo está se preparando para um novo ciclo — seja gentil consigo.',
        mood: 'Introspectiva',
      },
    },
    mood: {
      stressed: 'Estressada',
    },
    quickActions: {
      subtitle: 'Pressione e segure para personalizar',
      reorderHint: 'Toque em outro cartão para trocar de lugar',
      prayerTimes: 'Horários de\noração',
      dailyJournal: 'Registro diário',
    },
    nextPeriod: {
      inDays_one: 'Em {{count}} dia',
      inDays_other: 'Em {{count}} dias',
      windowInProgress: 'Janela estimada em andamento',
    },
    observationInProgress: 'Observação em andamento',
  },
  homeHeader: {
    notificationsUnread_one: '{{count}} notificação não lida',
    notificationsUnread_other: '{{count}} notificações não lidas',
  },
  motivationCard: {
    title: 'Cuide de si,\n você é preciosa ✨',
  },
  objectiveArticles: {
    title: 'Para apoiar você',
  },
  spiritualGuidance: {
    locationPlaceholder: 'Defina a sua localização para obter horários de oração precisos',
    daysCount_one: '{{count}} dia',
    daysCount_other: '{{count}} dias',
    calculating: 'Calculando…',
    prayerTimesUnavailable: 'Horários de oração temporariamente indisponíveis',
    nifasReferenceApproachingHeadline: 'O marcador de {{days}} dias utilizado pela AWA está se aproximando',
  },
  dailyJournal: {
    title: 'Registro de hoje',
  },
  journalMood: {
    saveMood: 'Salvar humor',
    heroTitle: 'Como você se sente\nhoje?',
    stressLabel: 'Estresse',
    errorMessage: 'Não foi possível salvar o seu humor no momento.',
    savedToast: 'Humor salvo com sucesso ✨',
  },
  journalHydration: {
    glassesCount_one: '{{count}} copo',
    glassesCount_other: '{{count}} copos',
    noRecordThisWeek: 'Ainda não há copos registrados esta semana.',
    dayGlasses_one: '{{day}}: {{count}} copo',
    dayGlasses_other: '{{day}}: {{count}} copos',
    saveGoalButton: 'Salvar objetivo',
  },
  journalMenstrualFlow: {
    errorMessage: 'Não foi possível salvar o seu fluxo no momento.',
    periodInProgress: 'Período em andamento',
    intensity: {
      spotting: 'Escape',
      light: 'Leve',
    },
    clots: {
      none: 'Nenhum',
    },
    protection: {
      pad: 'Absorvente',
      tampon: 'Absorvente interno',
      cup: 'Coletor menstrual',
      underwear: 'Calcinhas menstruais',
    },
    saveFlow: 'Salvar fluxo menstrual',
    flowSavedToast: 'Fluxo salvo com sucesso ✨',
    periodEndSavedToast: 'Fim do período salvo ✨',
  },
  journalSymptoms: {
    errorMessage: 'Não foi possível salvar os seus sintomas no momento.',
    saveSymptoms: 'Salvar sintomas',
    selectedCount_one: '{{count}} selecionado',
    selectedCount_other: '{{count}} selecionados',
    addedToJournal: 'Adicionado ao seu registro',
    intensity: {
      mild: {
        label: 'Leve',
        description: 'Presente, mas fácil de controlar',
      },
    },
    bodyZone: 'Região do corpo',
    selectedZone: 'Região selecionada',
    saveMySymptoms: 'Salvar meus sintomas',
    savedToast: 'Sintomas salvos com sucesso ✨',
  },
  journalActivity: {
    errorMessage: 'Não foi possível salvar a sua atividade no momento.',
    heroTitle: 'Movimente-se pelo seu bem-estar ✦',
    heroText: 'A atividade física ajuda a reduzir o estresse, a melhorar o humor e a aliviar os sintomas.',
    durationSectionHint: 'Por quanto tempo você se movimentou?',
    intensityLightDescription: 'Esforço leve',
    kindnessText: 'Cada passo conta. Valorize-se por cuidar de si hoje! 💜',
    saveActivity: 'Salvar atividade',
    savedToast: 'Atividade salva com sucesso ✨',
  },
  journalSleep: {
    invalidTimesTitle: 'Horários incorretos',
    invalidTimesMessage: 'Use o formato HH:MM, por exemplo 22:45.',
    errorMessage: 'Não foi possível salvar o seu sono no momento.',
    awakeningsTip: 'É normal ter alguns despertares.\nO seu corpo se regula gradualmente.',
    clearSubject: 'este registro de sono',
    savedToast: 'Sono salvo com sucesso ✨',
    closeTimeList: 'Fechar a lista de horários',
    selectATime: 'Selecione um horário',
  },
  journalNote: {
    writeAFewWords: 'Escreva algumas palavras antes de salvar.',
    errorMessage: 'Não foi possível salvar a sua nota no momento.',
    heroText: 'Escreva o que quer lembrar hoje: como se sente, observações, mudanças na pele, no cabelo ou qualquer outro sintoma.',
    privatePhotosTitle: 'Fotos privadas',
    privatePhotosHint: 'Acompanhe as mudanças na pele, no cabelo ou em um sintoma.',
    photosAddedCount_one: '{{count}} foto adicionada',
    photosAddedCount_other: '{{count}} fotos adicionadas',
    tapToViewReplaceDelete: 'Toque para ver, substituir ou excluir.',
    addPrivatePhotos: 'Adicionar fotos privadas',
    photosStayOnDevice: 'Suas fotos ficam apenas no seu dispositivo.',
    dataProtectedText: 'Todas as suas notas e fotos são salvas apenas no seu dispositivo. Ninguém mais tem acesso a elas.',
    saveMyNote: 'Salvar minha nota',
    savedToast: 'Nota salva com sucesso ✨',
  },
  journalPrivatePhotos: {
    cameraUnavailable: 'A câmera não está disponível neste dispositivo.',
    permissionDenied: 'Permita o acesso à câmera ou à galeria nas configurações para adicionar uma foto.',
    genericPickerError: 'Não foi possível abrir o seletor de fotos agora.',
    savedTitle: 'Fotos salvas',
    savedWithCopyFailure: 'Salvo, mas algumas fotos não puderam ser armazenadas de forma duradoura — tente novamente, se necessário.',
    savedSuccessfully: 'Suas fotos foram atualizadas no registro diário.',
    errorMessage: 'Não foi possível salvar agora.',
    subtitle: 'Acompanhe com discrição suas mudanças visuais — acne, cabelo, sintomas na pele.',
    myPhotos: 'Minhas fotos',
    photoCount: '{{count}} / {{max}} fotos',
    addAPrivatePhoto: 'Adicionar uma foto privada',
    emptyStateText: 'Escolha uma foto existente ou tire uma nova para acompanhar suas mudanças.',
    camera: 'Câmera',
    takeANewPhoto: 'Tirar uma nova foto',
    addAPhoto: 'Adicionar uma foto',
    securityText: 'Suas fotos são salvas localmente no espaço privado do aplicativo.',
    photoNoLongerAvailable: 'Esta foto não está mais acessível neste dispositivo.',
    chooseAnotherPhoto: 'Escolher outra foto',
    delete: 'Excluir',
    removeFromJournal: 'Remover do registro diário',
    photoUnavailable: 'Foto indisponível',
    viewPhoto: 'Ver foto',
  },
  journalIntimacy: {
    errorMessage: 'Não foi possível salvar essas informações agora.',
    heroTitle: 'Sua intimidade, seu espaço ♡',
    heroText: 'Anote como você se sente com total confiança.\nEsta seção é privada e protegida.',
    learnMore: 'Saiba mais',
    libidoSubtitle: 'Como você classificaria seu desejo sexual hoje?',
    commentSubtitle: 'Escreva aqui o que quiser registrar.',
    notePlaceholder: 'Escreva aqui seu comentário...',
    securityText: 'Esta seção é protegida por um código separado ou por Face ID.\nNinguém mais tem acesso.',
    saveIntimacy: 'Salvar informações de saúde íntima',
    savedToast: 'Saúde íntima salva com sucesso ✨',
    selectDesiredTime: 'Selecione o horário desejado',
  },
  journalCervicalMucus: {
    chooseAspectTitle: 'Qual é o aspecto hoje?',
    chooseAspectSubtitle: 'Escolha a opção que mais se aproxima do que você observa.',
    addDetailSubtitle: 'Você pode registrar uma sensação, uma cor ou qualquer outro detalhe útil.',
    tipText: 'O muco cervical pode mudar de aspecto ao longo do ciclo. Estas observações são pessoais e não constituem um diagnóstico médico.',
    saveToastTitle: 'Observação salva',
    saveToastMessage: 'Sua observação do muco cervical foi adicionada ao seu registro diário.',
    clearToastTitle: 'Registro limpo',
    clearToastMessage: 'A observação de hoje foi excluída.',
  },
  journalLHTest: {
    heroLabel: 'Acompanhe seu pico de LH\nno momento certo',
    resultQuestionTitle: 'Qual resultado você vê?',
    detailQuestionSubtitle: 'Escolha o horário em que fez o teste.',
    tipTitle: 'Entendendo seu resultado',
    saveToastTitle: 'Teste de LH salvo',
    saveToastMessage: 'Seu resultado foi adicionado ao seu registro diário.',
    clearToastTitle: 'Registro limpo',
    clearToastMessage: 'O teste de LH de hoje foi excluído.',
    states: {
      invalid: {
        helper: 'Você pode repetir o teste seguindo as instruções do fabricante.',
      },
      negative: {
        eyebrow: 'NENHUM PICO DETECTADO',
        helper: 'No momento, este teste não detecta nenhum pico de LH.',
      },
    },
  },
  journalTemperature: {
    heroLabel: 'Sua medição da manhã',
    rangeError: 'Digite uma temperatura entre {{min}} e {{max}} °{{unit}}.',
    saveToastTitle: 'Temperatura salva',
    saveToastMessage: 'Sua temperatura corporal basal foi adicionada ao seu registro diário.',
    clearToastTitle: 'Registro limpo',
    clearToastMessage: 'A temperatura de hoje foi excluída.',
    addMorningReading: 'Adicione sua medição da manhã',
    checkValue: 'Verifique o valor digitado',
    readyToSave: 'Pronto para salvar',
    sectionTitle: 'Minha temperatura',
    methodSubtitle: 'Escolha o método que você usou nesta manhã.',
    tipText: 'Meça a temperatura assim que acordar, antes de se levantar, idealmente no mesmo horário todos os dias.',
  },
  journalCycleEvolution: {
    heroLabel: 'Seu ciclo hoje',
    notEnoughDataText: 'Registre o início do seu último período para ver a evolução do seu ciclo.',
    observationInProgress: 'Observando seu ciclo',
    aboutEstimatesText: 'Estes marcos são calculados a partir dos períodos que você registrou e continuam sendo estimativas.',
    phaseDescription: {
      menstruation: 'Seu ciclo está atualmente na fase menstrual.',
      follicular: 'Seu corpo se prepara gradualmente para a ovulação.',
      fertile: 'Você está na sua janela fértil estimada.',
      ovulation: 'A ovulação está estimada para este momento do ciclo.',
      luteal: 'Seu ciclo está na fase posterior à ovulação.',
    },
  },
  journalConceptionReports: {
    heroText: 'Suas informações permanecem protegidas de acordo com suas configurações de privacidade.',
    reportTodaySubtitle: 'Gostaria de registrar uma relação?',
    protectionUsedQuestion: 'Usou proteção?',
    securityText: 'Esta seção usa seu código privado ou a biometria. Suas informações permanecem protegidas de acordo com suas configurações.',
    saveToastTitle: 'Registro salvo',
    saveToastMessage: 'Suas informações foram adicionadas ao seu registro diário.',
  },
  cycleInformation: {
    subtitle: 'Esta informação nos ajuda\na entender e apoiar você melhor.',
    next: 'Próximo',
    missingEndDateError: 'Informe a data de fim do seu último período.',
  },
  cycleReminders: {
    subtitleOnboarding: 'Escolha os lembretes que podem apoiar o seu acompanhamento. Você pode alterá-los a qualquer momento no seu perfil.',
    unavailableNote: 'Disponível depois que o primeiro período dela for registrado.',
    daysBefore_one: '{{count}} dia antes',
    daysBefore_other: '{{count}} dias antes',
    periodStartCheckDescription: 'Um aviso discreto se a data estimada chegar sem que o início do período tenha sido registrado.',
    dailyJournalTimeError: 'Escolha uma hora para o lembrete do seu registro diário.',
    permissionNoticeText: 'Ative as notificações nas configurações do celular para receber seus lembretes.',
    openNotificationSettings: 'Abrir as configurações de notificações',
    openSettings: 'Abrir as configurações',
    infoText: 'As datas do período, da janela fértil e da ovulação são estimativas baseadas nas informações registradas na AWA.',
    skip: 'Pular',
  },
  dataSafety: {
    banner: {
      body: 'Seus registros não foram excluídos nem alterados.',
    },
    recovery: {
      intro: 'A AWA não conseguiu abrir alguns dos seus registros criptografados. Foram deixados exatamente como estão.',
      keyLost: 'A chave de proteção deste celular não está mais disponível, então os registros criptografados não podem ser abertos. Isso pode acontecer após uma redefinição ou uma alteração na segurança do celular.',
      authFailed: 'Alguns registros não puderam ser verificados e foram deixados intactos.',
      other: 'Alguns registros não puderam ser lidos por outro motivo.',
      safeNote: 'Enquanto isso durar, a AWA não grava sobre esses registros e não mostra estimativas baseadas em dados ausentes.',
      discard: 'Apagar registros ilegíveis',
      newKeyBody: 'Os novos registros serão protegidos com uma nova chave. Os registros que já estão ilegíveis continuam ilegíveis, a menos que você restaure uma cópia de segurança.',
      discardTitle: 'Apagar registros ilegíveis?',
      discardBody: 'Estes registros não podem mais ser abertos. Apagá-los não pode ser desfeito. Restaurar uma cópia de segurança é a única forma de recuperá-los.',
      discarded: 'Registros ilegíveis apagados.',
    },
  },
  saveFailure: {
    title: 'Não foi possível salvar',
    failedBody: 'Suas alterações não puderam ser salvas. O que você digitou foi mantido: tente novamente em instantes.',
    unavailableBody: 'Seus dados protegidos estão ilegíveis no momento, por isso a AWA não os substitui e esta alteração não foi salva. O que você digitou foi mantido. Abra as opções de recuperação e tente novamente.',
  },
  portableBackup: {
    entryTitle: 'Cópia de segurança criptografada',
    entrySubtitle: 'Protegida pela sua senha. Restaure-a neste ou em outro celular.',
    screenTitle: 'Cópia de segurança criptografada',
    createIntro: 'Seus dados são lacrados com uma senha que só você conhece, para que o arquivo possa ser restaurado em outro celular.',
    passphraseLabel: 'Senha',
    confirmLabel: 'Confirmar senha',
    passphraseHint: 'Pelo menos 10 caracteres. Algumas palavras formam uma boa senha.',
    weakTooShort: 'A senha é curta demais.',
    weakRepetitive: 'A senha é repetitiva demais.',
    mismatch: 'As duas senhas não coincidem.',
    lossWarning: 'Se você perder esta senha, a cópia de segurança não poderá ser recuperada. Ninguém, incluindo a AWA, pode redefini-la.',
    photosNote: 'As fotos privadas não estão incluídas nesta cópia de segurança.',
    create: 'Criar e compartilhar a cópia de segurança',
    creating: 'Protegendo seus dados…',
    shareTitle: 'Cópia de segurança criptografada da AWA',
    errorUnreadable: 'Alguns registros não podem ser lidos neste celular, por isso não é possível fazer uma cópia de segurança completa. Nada foi alterado.',
    restoreIntro: 'Escolha um arquivo de cópia de segurança que você criou anteriormente e informe a respectiva senha.',
    pick: 'Escolher um arquivo de cópia de segurança',
    pickedProfile: 'Cópia de segurança de um perfil gerenciado, {{date}}',
    restorePassphrase: 'Senha da cópia de segurança',
    restoring: 'Restaurando…',
    confirmBody: 'Os dados da cópia de segurança substituem os dados correspondentes neste celular. Os registros que a cópia de segurança não contém permanecem como estão.',
    success: 'Cópia de segurança restaurada ({{count}} registros).',
    errorNotBackup: 'Este arquivo não é uma cópia de segurança da AWA.',
    errorInvalid: 'Este arquivo de cópia de segurança está danificado.',
    errorWrong: 'Senha incorreta ou arquivo danificado. Nada foi alterado.',
    errorProfileMissing: 'Esta cópia de segurança pertence a um perfil que não existe neste celular. Restaure primeiro a cópia de segurança principal.',
    errorStorage: 'Não foi possível concluir a restauração. Seus dados anteriores foram mantidos.',
  },
  statistics: {
    flowLabels: {
      light: 'Leve',
    },
    missingAverageCycleData: {
      unconfirmedEnds: 'As datas de início dos seus períodos estão registradas, mas o respectivo fim ainda não foi confirmado. Confirme quando o seu período termina para incluí-lo nesta estatística.',
      keepLogging: 'Continue registrando seus períodos para ver a duração média do seu ciclo aparecer.',
    },
    unavailableTitle: 'Não é possível mostrar suas estatísticas agora',
    unavailableDetail: 'Alguns dos seus registros protegidos não podem ser lidos no momento. Nada foi excluído e nenhuma estimativa é feita com dados ausentes.',
    loading: 'Carregando suas estatísticas',
    emptyAllDetail: 'Suas estatísticas vão aparecer quando você começar a registrar seus dados.',
    shortestCycle_one: 'Ciclo mais curto: {{count}} dia',
    shortestCycle_other: 'Ciclo mais curto: {{count}} dias',
    longestCycle_one: 'Ciclo mais longo: {{count}} dia',
    longestCycle_other: 'Ciclo mais longo: {{count}} dias',
    averagePeriodDuration_one: 'Período médio: {{count}} dia',
    averagePeriodDuration_other: 'Período médio: {{count}} dias',
    periodDurationNeedsEnd: 'Confirme quando seu período termina para ver a duração média.',
    moodSubtitle: 'Humores que você registrou',
    moodEmptyTitle: 'Nenhum humor registrado',
    moodEmptyDetail: 'Registre seu humor no registro diário para vê-lo aqui.',
    moodLabels: {
      stressed: 'Estressada',
    },
    periods: {
      months_one: '{{count}} mês',
      months_other: '{{count}} meses',
    },
    daysPlural_one: '{{count}} dia',
    daysPlural_other: '{{count}} dias',
    cyclesAnalyzed_one: '{{count}} ciclo analisado',
    cyclesAnalyzed_other: '{{count}} ciclos analisados',
    daysLogged_one: '{{count}} dia registrado',
    daysLogged_other: '{{count}} dias registrados',
    notEnoughCyclesTitle: 'Ainda não há ciclos suficientes registrados',
    daysWithFlow_one: '{{count}} dia com fluxo',
    daysWithFlow_other: '{{count}} dias com fluxo',
    flowLabelDays_one: '{{label}} {{count}} dia',
    flowLabelDays_other: '{{label}} {{count}} dias',
    flowLabelDaysColon_one: '{{label}}: {{count}} dia',
    flowLabelDaysColon_other: '{{label}}: {{count}} dias',
    noFlowThisPeriod: 'Ainda não foi registrado nenhum fluxo neste período.',
    logFlowToSeeStatistic: 'Registre seu fluxo no Registro diário para ver esta estatística aparecer.',
    noFlowThisMonthTitle: 'Nenhum fluxo registrado este mês',
    mostRecordedSymptoms: 'Os sintomas mais registrados',
    logSymptomsToSeeStatistic: 'Registre seus sintomas no Registro diário para ver esta estatística aparecer.',
    noSymptomsThisPeriodTitle: 'Nenhum sintoma registrado neste período',
    noSymptomsThisMonthTitle: 'Nenhum sintoma registrado este mês',
    medicalHint: 'Estas tendências, baseadas em seus dados reais, podem ajudá-la a descrever seu histórico com mais clareza em uma consulta médica. Não substituem o aconselhamento médico.',
  },
  dailyJournalSheet: {
    defaultTitle: 'Registro diário',
    defaultSubtitle: 'Como você está se sentindo hoje?',
    closeJournal: 'Fechar o registro',
    openEntryHint: 'Abre o registro de {{category}}',
    contraceptionSubtitle: 'Seu acompanhamento da contracepção, um dia de cada vez.',
    irregularSubtitle: 'Seu acompanhamento, no seu ritmo.',
    menopauseSubtitle: 'Seu acompanhamento da perimenopausa / menopausa, um dia de cada vez.',
    pregnancySubtitle: 'Reserve alguns segundos para anotar como você está se sentindo hoje.',
    postpartumSubtitle: 'Reserve um momento para você hoje.',
    miscarriageSubtitle: 'Reserve um momento para você hoje.',
    conceiveSubtitle: 'Seu acompanhamento da fertilidade, um dia de cada vez.',
    periodActionSubtitle: 'Registre o início do seu período',
    pregnancyItems: {
      symptoms: {
        title: 'Sintomas que você sente',
        subtitle: 'Anote suas sensações físicas',
      },
      weight: {
        subtitle: 'Registre uma medição em kg',
      },
      mood: {
        subtitle: 'Como você está se sentindo hoje?',
      },
    },
    chooseTrackingSubtitle: 'Selecione as categorias que deseja acompanhar',
    items: {
      symptom: {
        subtitle: 'Registre seus sintomas físicos',
      },
      mood: {
        subtitle: 'Como você está se sentindo hoje?',
      },
      hydration: {
        subtitle: 'Acompanhe sua ingestão de água',
      },
      note: {
        subtitle: 'Escreva seus pensamentos e adicione fotos privadas',
      },
    },
  },
  periodStartSheet: {
    titleOther: 'O seu período começou em {{date}}?',
    confirmOther: 'Sim, em {{date}}',
    saving: 'Salvando…',
  },
  journalScreenLayout: {
    privacyFooter: 'Seus dados são mantidos privados e seguros de acordo com suas configurações.',
  },
  privateSectionAuth: {
    promptSubtitle: 'Confirme sua identidade para continuar',
  },
  privateIntimacyUnlock: {
    purpose: {
      conception: 'Seus registros de intimidade permanecem totalmente privados.',
      photos: 'Suas fotos permanecem totalmente privadas.',
      export: 'Confirme sua identidade antes de exportar dados sensíveis.',
    },
    subtitle: 'Desbloqueie com seu código privado\nou com sua biometria.',
    backToJournal: 'Voltar ao registro',
    biometricHint: 'Abre a tela de desbloqueio com Face ID',
    enterPin: 'Digite seu código privado',
    usePinSubtitle: 'Use seu código de 6 dígitos',
    privacyTitle: 'Sua privacidade é a nossa prioridade',
    privacyText: 'Seus dados permanecem privados e só podem ser acessados por você.',
  },
  privateIntimacyPin: {
    genericError: 'Algo deu errado. Tente novamente.',
    enterYourCode: 'Digite seu código privado',
    digitsEntered: '{{count}} dígitos digitados',
    deleteKey: 'Apagar',
  },
  privateIntimacyFaceId: {
    lookAtPhone: 'Olhe para o celular para desbloquear\neste espaço privado.',
    useBiometrics: 'Use sua biometria para desbloquear\neste espaço privado.',
    verifying: 'Verificando…',
    usePinCodeInstead: 'Usar meu código privado em vez disso',
  },
  clearEntryButton: {
    confirmTitle: 'Limpar este registro?',
    confirmMessage: 'Você está prestes a excluir definitivamente {{subject}} registrado para hoje.',
    clearThisEntry: 'Limpar este registro',
  },
  calendar: {
    subtitle: 'Acompanhe seu ciclo com facilidade ✨',
    nonContinuousMessage: 'Os dias do período precisam formar um intervalo contínuo.',
    editErrorTitle: 'Não foi possível salvar as alterações',
    editErrorOverlap: 'Este período se sobrepõe a outro já registrado.',
    noNewPeriodRecorded: 'Nenhum novo período registrado',
    observingCycles: 'A AWA está observando seus ciclos',
    noPeriodThisDay: 'Nenhum período registrado neste dia',
    predictionsPendingFirstPeriod: 'As previsões do ciclo estarão disponíveis quando o primeiro período dela for registrado e existirem dados suficientes.',
    predictionsPendingFirstPeriodOwner: 'As previsões do ciclo estarão disponíveis quando seu período for registrado e existirem dados suficientes.',
    predictionsPendingMoreData: 'As previsões do ciclo aparecerão quando forem registrados períodos suficientes.',
    daysSelected_one: '{{count}} dia selecionado',
    daysSelected_other: '{{count}} dias selecionados',
    predictionsCaption: 'Previsões calculadas a partir de seus ciclos registrados.',
    timelineTitle: 'A linha do tempo do seu ciclo',
    dayCard: {
      phase: {
        follicular: {
          subtitle: 'Fertilidade aumentando',
        },
      },
      flow: {
        light: 'Leve',
      },
      editing: 'Editando',
      periodUnrecorded: 'Nenhum período registrado neste ciclo',
    },
    nextMonth: 'Próximo mês',
    filtersSubtitle: 'Escolha as informações exibidas em seu calendário.',
    legendSheet: {
      ramadanDescription: 'Este dia está dentro do mês de Ramadão (jejum).',
      dhoulHijjaDescription: 'Este dia está dentro do mês de Dhu al-Hijjah.',
      periodDescription: 'Dias registrados como seu período menstrual.',
      fertileDescription: 'Os dias em que a probabilidade de concepção é mais elevada.',
      moodDescription: 'Um humor foi registrado neste dia.',
      notesSymptomsDescription: 'Uma nota, um sintoma ou outro registro diário (atividade, sono, hidratação, saúde íntima) foi registrado neste dia.',
      todayDescription: 'Marca o dia atual em seu calendário.',
    },
  },
  managedProfile: {
    intro: {
      benefitAdaptedSubtitle: 'Conteúdos e funcionalidades\npensados só para ela.',
    },
    daughterInfo: {
      description: 'Isso ajuda a personalizar o espaço dela.',
      firstNameLabel: 'Nome',
      firstNameAccessibilityLabel: 'Nome da sua filha',
      age_one: 'Idade: {{count}} ano',
      age_other: 'Idade: {{count}} anos',
      editPhoto: 'Editar foto de perfil',
      photoSheetTitle: 'Foto de perfil',
      photoSheetSubtitle: 'Escolha uma foto para o perfil dela.',
      takePhoto: 'Tirar uma foto',
      photoErrorTitle: 'Foto de perfil',
      photoErrorAccess: 'Não foi possível acessar a câmera ou a galeria agora.',
      photoErrorGeneric: 'Algo deu errado. Tente novamente.',
    },
    firstPeriod: {
      description: 'Isso ajuda a adaptar a experiência dela.',
      creating: 'Criando…',
    },
    cycleSetup: {
      days_one: '{{count}} dia',
      days_other: '{{count}} dias',
      savedValuesNote: 'As durações exibidas (período: {{period}}, ciclo: {{cycle}}) serão salvas quando você tocar em “{{button}}”. Você pode alterá-las mais tarde.',
      creating: 'Criando…',
    },
    success: {
      subtitle: 'Agora você já pode acessar o espaço dela e começar a registrar as informações dela.',
    },
    deleteModal: {
      closeAccessibility: 'Fechar sem excluir',
      title: 'Excluir este perfil?',
      body: 'Tem certeza de que deseja excluir o perfil de {{firstName}}?',
      reassurance: 'As informações salvas neste perfil serão excluídas.',
      confirmAccessibilityNamed: 'Confirmar a exclusão do perfil de {{firstName}}',
      confirmAccessibility: 'Confirmar exclusão',
      confirmText: 'Excluir perfil',
      deleting: 'Excluindo…',
      failedTitle: 'Perfil não excluído por completo',
      failedBody: 'Não foi possível excluir o perfil por completo. Mais nada foi alterado — tente novamente.',
    },
  },
  profile: {
    aboutAwaSubtitle: 'Versão, avisos legais, privacidade e valores do app',
    awaADeuxSubtitle: 'Compartilhe algumas percepções com seu parceiro',
    backupSubtitle: 'Backup na nuvem e restauração dos seus dados',
    backupTitle: 'Backup',
    editAnonymousAvatarAccessibility: 'Personalizar meu avatar anônimo',
    editAvatarAccessibility: 'Alterar foto de perfil',
    generalHealthSubtitle: 'Peso, altura, tipo sanguíneo, condições…',
    headerSubtitle: 'Gerencie suas informações e preferências',
    helpSupportSubtitle: 'Perguntas frequentes, relatar um problema e contato',
    managedProfileEyebrow: 'PERFIL GERENCIADO',
    moreSectionSubtitle: 'Ajuda, informações sobre a AWA e gerenciamento da sua sessão.',
    signOut: 'Sair',
    cycle: {
      remindersSubtitle: 'Períodos, registro diário, ovulação e janela fértil',
    },
    accountInfoModal: {
      anonymousId: 'ID anônimo',
      anonymousMode: 'Modo anônimo',
      subtitle: 'Seu perfil anônimo não contém nenhuma informação que permita identificá-la.',
    },
    anonymousMode: {
      exit: 'Sair do modo anônimo',
      identityHiddenSubtitle: 'Sua identidade real permanece oculta',
      manageSubtitle: 'Gerencie sua identidade privada e as opções anônimas',
      title: 'Modo anônimo',
    },
    conceive: {
      manageReminders: 'Gerenciar meus lembretes de concepção',
      ovulationAwarenessTitle: 'Percepção da ovulação',
    },
    contraception: {
      remindersSubtitle: 'Lembretes associados ao seu método contraceptivo',
    },
    cycleDurationEditor: {
      subtitle: 'Quantos dias o ciclo dela costuma durar?',
    },
    irregular: {
      remindersSubtitle: 'Registro diário e períodos não registrados',
      trackedItemsCount_one: '{{count}} item acompanhado',
      trackedItemsCount_other: '{{count}} itens acompanhados',
    },
    logoutDialog: {
      body: 'Tem certeza de que deseja sair da sua conta AWA?',
      confirmAccessibilityLabel: 'Confirmar saída',
      reassurance: 'Você pode entrar novamente a qualquer momento.',
      title: 'Sair?',
    },
    managedProfileInfoModal: {
      firstNameLabel: 'Nome',
      linkedAccountInfo: 'Este perfil gerenciado não tem conta AWA própria — as informações dela permanecem associadas às suas e podem ser editadas em “Gerenciar perfis”.',
    },
    managedProfiles: {
      deleteProfileOf: 'Excluir o perfil de {{name}}',
      swipeDeleteLabel: 'Excluir',
      sheetSubtitle: 'Acompanhe seu ciclo ou um perfil que você gerencia.',
      sheetTitle: 'Gerenciar perfis',
    },
    menopause: {
      labTrackingLabel: 'Exames acompanhados',
      remindersSubtitle: 'Registro diário e lembrete do tratamento',
      symptomsTrackedCount_one: '{{count}} sintoma acompanhado',
      symptomsTrackedCount_other: '{{count}} sintomas acompanhados',
      hormonalTreatment: {
        notNow: 'Não por enquanto',
      },
      labTracking: {
        none: 'Não por enquanto',
      },
    },
    miscarriage: {
      currentBleedingLabel: 'Sangramento atual',
      cycleReturnLabel: 'Retorno do ciclo',
      periodReturnDateLabel: 'Data do retorno do período',
      cycleReturn: {
        unknown: 'Não tenho certeza',
      },
      tryingAgain: {
        ready: 'Sim, me sinto pronta',
      },
    },
    periodDurationEditor: {
      subtitle: 'Quantos dias dura normalmente o período dela?',
    },
    personalInfo: {
      anonymousSubtitle: 'Conta protegida e anônima',
      daughterSubtitle: 'Primeiro nome, data de nascimento…',
    },
    photoModal: {
      cameraGalleryError: 'Não foi possível acessar a câmera ou a galeria no momento.',
      editTitle: 'Editar foto',
      removePhoto: 'Remover foto',
      revertToDefaultSubtitle: 'Voltar ao avatar padrão',
      takePhoto: 'Tirar uma foto',
      title: 'Foto de perfil',
      useCameraSubtitle: 'Usar a câmera',
    },
    postpartum: {
      babyFeedingLabel: 'Alimentação do bebê',
      feedingSubtitle: 'Amamentação e alimentação do bebê',
      remindersSubtitle: 'Gerenciar meu lembrete de registro diário',
      deliveryType: {
        emergencyCsection: 'Cesariana de emergência',
      },
      feedingType: {
        exclusiveBottle: 'Apenas mamadeira',
        mixed: 'Alimentação mista (peito + mamadeira)',
      },
    },
    pregnancy: {
      datingSubtitle: 'Data de início, data prevista do parto ou concepção',
      trackingPreferencesSubtitle: 'Escolher as categorias do meu registro diário',
    },
    premiumCard: {
      accessibilityLabel: 'Conheça a AWA Premium',
      activeSubscription: 'Assinatura ativa',
      activeSubtitle: 'Obrigada por apoiar a AWA — a sua assinatura está ativa.',
    },
    regularityEditor: {
      subtitle: 'O ciclo dela costuma ser regular?',
    },
    spiritualMarkers: {
      canChangeAnytime: 'Você pode alterar esta escolha a qualquer momento no seu perfil.',
      manageMarkers: 'Gerenciar marcadores',
    },
  },
  inAppNotifications: {
    deleteNotification: 'Excluir esta notificação',
  },
  conceiveDashboard: {
    hero: {
      title: {
        menstruation: 'Ciclo em andamento',
        follicular: 'Fertilidade aumentando',
      },
      description: {
        follicular: 'Seu corpo está se preparando — mantenha seu registro diário.',
        fertile: 'Hoje você está na fase de maior fertilidade.',
      },
    },
    advice: {
      follicular: 'Mantenha seu registro diário — sua janela fértil está se aproximando.',
      fertile: 'Este é um bom momento para maximizar suas chances — cuide de si e fique atenta ao seu corpo.',
    },
    ring: {
      cycleDays_one: 'Ciclo de {{count}} dia',
      cycleDays_other: 'Ciclo de {{count}} dias',
    },
    evolutionCard: {
      subtitleConfigure: 'Configure o seu ciclo para ver',
    },
    dailyJournalTitle: 'Registro de hoje',
  },
  conceiveCalendar: {
    subtitle: 'Seu ciclo e sua fertilidade, de relance',
    categories: {
      fertile: {
        description: 'Os dias mais favoráveis à concepção.',
      },
      temperature: {
        description: 'Temperatura registrada no seu diário.',
      },
      intimacy: {
        description: 'Relação registrada no seu diário, de forma privada.',
      },
    },
    emptyState: {
      noFilters: 'Ative pelo menos um filtro para ver o registro deste dia.',
    },
    intimacyRecorded: 'Registrada',
    legendSheet: {
      ramadanDescription: 'Este dia está no mês de Ramadão (jejum).',
      dhoulHijjaDescription: 'Este dia está no mês de Dhu al-Hijjah.',
      todayDescription: 'O contorno preto tracejado marca a data de hoje.',
    },
  },
  conceiveStatistics: {
    summary: {
      overviewSubtitle: 'Este ciclo, de relance',
      temperaturesRecorded: 'Temperaturas registradas',
      temperatureEmptyText: 'Registre sua temperatura corporal basal no diário para ver a evolução.',
      adviceText: 'Estas estimativas são uma referência pessoal baseada no seu registro. Não garantem a gravidez e não substituem o aconselhamento médico.',
    },
    temperature: {
      emptyText: 'Registre sua temperatura corporal basal todas as manhãs para acompanhar a evolução.',
      recordedReadings: 'Medições registradas',
      infoConvertedSuffix: ' As medições inseridas na outra unidade são convertidas para exibição (os seus dados em si não são alterados).',
    },
    fertility: {
      emptyText: 'Registre seus testes de ovulação e observações do muco cervical para ver aqui as suas tendências.',
      lhEmptyText: 'Registre seus testes de ovulação para ver a respectiva distribuição.',
      lhEvolutionSubtitle: 'Seus resultados registrados ao longo do tempo.',
      lhEvolutionInfo_one: 'Altura da barra = número de testes de LH positivos registrados neste mês, num total de {{count}} teste ao longo de {{period}}.',
      lhEvolutionInfo_other: 'Altura da barra = número de testes de LH positivos registrados neste mês, num total de {{count}} testes ao longo de {{period}}.',
      mucusEmptyText: 'Registre suas observações do muco cervical para ver a respectiva distribuição.',
      mucusEvolutionSubtitle: 'Suas observações registradas ao longo do tempo.',
      disclaimer: 'Este acompanhamento é uma referência pessoal. Um teste positivo não é garantia de concepção.',
    },
    cycle: {
      evolutionEmptyText: 'Registre o início dos seus períodos para ver como a duração do ciclo evolui.',
      infoText: 'A duração do seu ciclo pode variar naturalmente de mês para mês — este acompanhamento ajuda você a observar seus próprios padrões.',
    },
  },
  conceptionOnboarding: {
    shell: {
      backAccessibility: 'Voltar à etapa anterior',
      next: 'Próximo',
    },
    tryingDuration: {
      options: {
        startingNow: 'Estou começando agora',
      },
      info: 'Cada jornada é única. A AWA está aqui para apoiar você em cada etapa.',
    },
    ovulationAwareness: {
      title: 'Você consegue perceber, em geral, quando está ovulando?',
      subtitle: 'Isso nos ajuda a oferecer o melhor acompanhamento a você.',
      options: {
        often: {
          description: 'Sou bastante boa em identificar meus sinais de ovulação.',
        },
        sometimes: {
          label: 'Às vezes',
        },
      },
      info: 'Não se preocupe se você ainda não sabe. A AWA vai ajudar você a observar o seu ciclo ao longo do tempo.',
    },
    indicators: {
      options: {
        lhTests: {
          description: 'Registre seus testes de LH para acompanhar o pico de ovulação.',
        },
        intercourse: {
          description: 'Registre esta informação de forma privada e discreta.',
        },
      },
      info: 'As informações relacionadas à sua vida íntima permanecem privadas e podem ser protegidas pelas suas configurações de privacidade.',
    },
    reminders: {
      options: {
        fertileWindow: {
          description: 'Avisa você quando sua janela fértil se aproxima ou começa.',
        },
        estimatedOvulation: {
          description: 'Avisa você por volta do dia estimado da sua ovulação.',
        },
        temperature: {
          detail: 'Ideal para não esquecer a medição ao acordar, antes de levantar da cama.',
        },
      },
      privacyText: 'O conteúdo sensível pode permanecer oculto de acordo com as suas configurações de privacidade.',
      settingsNotice: 'Você pode alterar estas preferências a qualquer momento nas configurações.',
      editSubtitle: 'Escolha os lembretes que apoiam você na sua jornada de concepção.',
      saving: 'Salvando…',
    },
  },
  conceptionJournalConfig: {
    temperature: {
      subtitle: 'Registre sua temperatura da manhã',
    },
  },
  contraceptionLabels: {
    method: {
      pill: 'Pílula anticoncepcional',
      patch: 'Adesivo anticoncepcional',
    },
    reminderContent: {
      pill: {
        subtitle: 'Escolha se quer receber lembretes para tomar a pílula.',
        cardTitle: 'Lembretes da tomada\ndiária da pílula',
      },
      ring: {
        cardDescription: 'Ative os lembretes relacionados ao uso do anel.',
      },
      patch: {
        subtitle: 'Escolha se quer receber lembretes para o seu adesivo contraceptivo.',
        cardTitle: 'Lembretes para o seu\nadesivo contraceptivo',
      },
      default: {
        subtitle: 'Escolha se quer receber lembretes para o seu método de contracepção.',
        cardDescription: 'Ative os lembretes relacionados ao seu método de contracepção.',
      },
    },
    intakeActionLabel: {
      pill: 'Tomada de hoje',
      ring: 'Uso do anel',
      patch: 'Uso do adesivo',
      other: 'Uso do tratamento',
    },
    defaultIntakeActionLabel: 'Tomada / uso de hoje',
    heroActionLabels: {
      pill: {
        missed: 'Esqueci',
      },
    },
    eventSummary: {
      empty: 'Ainda sem registro',
      count_one: '{{count}} evento registrado',
      count_other: '{{count}} eventos registrados',
    },
  },
  contraceptionJournalConfig: {
    intake: {
      journalSubtitle: 'Registre o acompanhamento de hoje',
    },
    feelings: {
      label: 'Como você se sente',
    },
  },
  contraceptionDashboard: {
    headerSubtitle: 'Seu acompanhamento, com discrição.',
    ring: {
      packAccessibility: 'Dia {{day}} de {{total}}, cartela em andamento',
      trackingAccessibility: '{{status}}, acompanhamento em andamento',
      packFootnote: 'Cartela em andamento',
      trackingFootnote: 'Acompanhamento em andamento',
    },
    hero: {
      title: {
        taken: 'Pílula \nregistrada',
        late: 'Atraso registrado',
        missed: 'Dose esquecida registrada',
        toTake: 'Pílula a tomar',
      },
      subtitle: {
        taken: 'A tomada de hoje está registrada.',
        late: 'A tomada em atraso de hoje está registrada.',
        missed: 'A dose esquecida de hoje está registrada.',
        toTake: 'Não se esqueça de registrar a tomada de hoje.',
        remindersEnabled: 'Seus lembretes estão ativos.',
        remindersDisabled: 'Seus lembretes estão desativados.',
      },
    },
    circleStatus: {
      recorded: 'Registrada',
      todo: 'A fazer',
    },
    method: {
      eyebrow: 'Meu método',
      editAccessibility: 'Editar minha contracepção',
      editLabel: 'Editar meu método',
      scheduleCyclicValue: '{{active}} d. de tomada + {{breakDays}} d. de pausa',
      scheduleContinuousValue: 'Uso contínuo',
      scheduleContinuousSummary: 'Uso contínuo, sem pausa programada',
    },
    daily: {
      subtitle: 'Seu registro de contracepção de hoje',
      intakeState: {
        recorded: 'Registrada',
        missed: 'Dose esquecida informada',
        toProvide: 'A preencher',
      },
      feelingsCount_one: '{{count}} item',
      feelingsCount_other: '{{count}} itens',
      feelingsToProvide: 'A preencher',
    },
    history: {
      empty: 'Ainda sem eventos registrados.',
      intakeTitle: 'Histórico de doses',
    },
    historyModal: {
      eventsSubtitle: 'Todos os seus eventos registrados',
      intakeTitle: 'Histórico de doses',
      intakeSubtitle: 'Todas as suas doses registradas',
      emptyEventsText: 'Seus eventos aparecerão aqui depois de registrados.',
      emptyIntakeText: 'Suas doses tomadas e esquecidas aparecerão aqui depois de registradas.',
      deleteHint: 'Abre as opções de exclusão',
      editDeleteHint: 'Abre as opções de edição e exclusão',
      premiumHint: 'Com o Premium, acesse o histórico completo, sem limite de 30 dias.',
    },
    recordStatus: {
      late: 'Atraso registrado',
      missed: 'Dose esquecida registrada',
    },
    deleteRecordConfirm: {
      title: 'Excluir este registro?',
      message: '{{date}} — esta ação não pode ser desfeita.',
    },
    deleteEventConfirm: {
      title: 'Excluir este evento?',
      message: '{{label}} — {{date}} — esta ação não pode ser desfeita.',
    },
    deleteButton: 'Excluir',
    recordAction: {
      subtitle: 'Editar ou excluir este registro',
      deleteLabel: 'Excluir este registro',
    },
  },
  contraceptionCalendar: {
    subtitle: 'Acompanhe sua contracepção, dia após dia',
    nextMonthAccessibility: 'Próximo mês',
    legend: {
      notRecorded: 'Sem registro',
    },
    selected: {
      noEvent: 'Nenhum evento registrado',
      recordedAt: 'Registrada às {{time}}',
      recorded: 'Registrada',
      notRecorded: 'Sem registro',
      feelingsLabel: 'Como você se sentiu',
      feelingsCount_one: '{{count}} item',
      feelingsCount_other: '{{count}} itens',
      editFeelingsAccessibility: 'Editar como você se sentiu neste dia',
      fillFeelingsAccessibility: 'Preencher como você se sentiu neste dia',
      editFeelings: 'Editar como você se sentiu neste dia',
      fillFeelings: 'Preencher como você se sentiu neste dia',
    },
    summary: {
      emptyEvents: 'Nenhum evento registrado este mês.',
      notRecorded: 'Sem registro',
      disclaimer: 'Com base nos seus próprios registros.',
    },
    sheet: {
      trackingGroupTitle: 'Acompanhamento da contracepção',
      todayDescription: 'O contorno roxo tracejado marca a data de hoje.',
      ramadanDescription: 'Este dia está dentro do mês de Ramadão.',
      dhoulHijjaDescription: 'Este dia está dentro do mês de Dhu al-Hijjah.',
    },
    filterRows: {
      takenTitle: 'Dose tomada',
      takenDescription: 'Mostrar os dias em que a dose foi registrada',
      lateDescription: 'Mostrar os dias em que foi informada uma dose em atraso',
      missedDescription: 'Mostrar os dias em que foi informada uma dose esquecida',
      eventDescription: 'Mostrar os dias em que “{{label}}” foi registrado',
    },
    legendRows: {
      takenTitle: 'Dose tomada',
      takenDescription: 'Uma dose foi registrada nesse dia.',
      lateDescription: 'Foi informada uma dose em atraso nesse dia.',
      missedDescription: 'Foi informada uma dose esquecida nesse dia.',
      eventDescription: '“{{label}}” foi registrado nesse dia.',
    },
  },
  contraceptionStatistics: {
    header: {
      subtitle: 'Veja seus hábitos de acompanhamento ao longo do tempo.',
    },
    empty: {
      title: 'Suas estatísticas aparecerão aqui',
      text: 'Registre suas doses tomadas e esquecidas durante alguns dias para descobrir suas tendências.',
    },
    hero: {
      eyebrow: 'Seu acompanhamento',
      disclaimer: 'Com base nos seus próprios registros.',
      takenCount_one: '{{count}} dose tomada',
      takenCount_other: '{{count}} doses tomadas',
      lateCount_one: '{{count}} em atraso',
      lateCount_other: '{{count}} em atraso',
      missedCount_one: '{{count}} esquecida',
      missedCount_other: '{{count}} esquecidas',
    },
    noDataInPeriod: 'Sem dados registrados neste período. Experimente um período mais longo.',
    distribution: {
      takenLabel: 'Doses tomadas',
    },
    streak: {
      value_one: '{{count}} dia seguido',
      value_other: '{{count}} dias seguidos',
    },
    tracking: {
      durationValue_one: '{{count}} dia',
      durationValue_other: '{{count}} dias',
    },
    events: {
      title: 'Eventos registrados',
      emptyTitle: 'Nenhum evento registrado',
      emptyText: 'Registre seus eventos ({{types}}) para descobrir aqui suas estatísticas.',
    },
    noMethod: {
      text: 'O acompanhamento detalhado ficará disponível depois que você escolher seu método de contracepção.',
    },
    method: {
      title: 'Meu método',
    },
  },
  contraceptionJournalEntry: {
    intake: {
      statusSubtitle: 'Registre o acompanhamento de hoje',
      takenSubtitle: 'Registre este uso como realizado hoje',
      lateSubtitle: 'Anote uma dose tomada com atraso',
      missedSubtitle: 'Informe simplesmente uma dose esquecida hoje',
      infoTitle: 'Seu acompanhamento',
      infoText: 'Este acompanhamento ajuda você a manter um registro claro, dia após dia.',
    },
    event: {
      alreadyRecorded: 'Já registrado hoje: {{list}}',
    },
    feelings: {
      heroTitle: 'Como você se sente?',
      heroSubtitle: 'Selecione o que você sentiu {{dayWord}} — este registro é pessoal e nunca constitui um diagnóstico.',
      sectionTitle: 'Como você se sentiu',
      sectionSubtitle: 'Você pode selecionar vários',
      selectedCount_one: '{{count}} item selecionado',
      selectedCount_other: '{{count}} itens selecionados',
      infoText: 'Este acompanhamento é seu — não faz nenhuma interpretação médica.',
    },
    notes: {
      heroTitle: 'Seu espaço pessoal',
      heroSubtitle: 'Um lugar privado para o que você quiser anotar.',
      sectionSubtitle: 'Escreva livremente, no seu ritmo',
    },
    breakDay: {
      infoText: 'Não há nenhuma dose prevista para hoje, de acordo com o seu esquema. Mesmo assim, você pode anotar como se sentiu ou adicionar uma nota.',
      alreadyRecordedTitle: 'Registrado',
      alreadyRecorded: 'Já foi registrado um status para hoje: {{status}}.',
    },
    errors: {
      chooseBeforeSaving: 'Escolha uma resposta antes de salvar.',
      futureDate: 'Você não pode registrar o acompanhamento de uma data futura.',
      chooseAtLeastOne: 'Escolha pelo menos um item antes de salvar.',
      addNoteBeforeSaving: 'Adicione uma nota antes de salvar.',
    },
  },
  contraceptionMethod: {
    title: 'Qual método de contracepção você usa?',
    options: {
      pillDescription: 'Acompanhamento da tomada diária',
    },
  },
  contraceptionInformation: {
    title: 'Alguns detalhes\nsobre a sua contracepção',
    subtitle: 'Suas respostas permanecem privadas e ajudam a personalizar o seu acompanhamento.',
    startDateQuestions: {
      pill: 'Desde quando você toma a pílula?',
      ring: 'Desde quando você usa o anel vaginal?',
      patch: 'Desde quando você usa o adesivo contraceptivo?',
      other: 'Desde quando você segue este tratamento?',
      default: 'Desde quando você usa este método?',
    },
    treatmentBreakQuestion: 'Você tem uma pausa ou\ninterrupção no seu tratamento?',
  },
  pillSchedule: {
    title: 'Seu esquema da pílula',
    subtitle: 'Personalize seu acompanhamento de acordo com o seu tratamento.',
    activeDays: {
      title: 'Dias de tomada',
    },
    summary: {
      title: 'Seu esquema',
      intakeLabel: 'Tomada',
    },
    unknown: {
      subtext: 'Você poderá preenchê-lo mais tarde.',
    },
    continuous: {
      title: 'Uso contínuo',
      subtitle: 'Você toma a pílula sem período de pausa, com base na sua resposta anterior.',
      footnote: 'A AWA acompanha seu uso sem contagem regressiva da cartela, já que este esquema não tem uma duração de ciclo fixa.',
    },
  },
  contraceptionReminders: {
    title: 'Seus lembretes',
    unavailableInfo: 'Os lembretes programados ainda não estão disponíveis para este método. Você pode registrar seus usos diretamente no painel.',
    settingsInfo: 'Você pode alterar esta configuração a qualquer momento nas configurações.',
  },
  irregularJournalConfig: {
    acne: {
      journalSubtitle: 'Anote o aspecto da sua pele hoje.',
    },
    weight: {
      dashboardSubtitle: 'Registre a variação do seu peso',
      journalSubtitle: 'Registre a variação do seu peso.',
    },
    mood: {
      dashboardSubtitle: 'Como você se sente hoje?',
      journalSubtitle: 'Como você se sente hoje?',
    },
  },
  irregularJournalOverview: {
    title: 'Registro diário',
    progressTitle: 'Seu registro diário',
    progressDescription: 'Cada pequeno detalhe conta. Dedique um momento ao seu registro.',
    periodPlaceholder: 'Registre o início do seu período',
    periodSpotting: 'Pequenos sangramentos',
    flow: {
      light: 'Leve',
    },
    rowDoneAccessibility: '{{label}}, registrado',
  },
  irregularOnboarding: {
    shell: {
      backAccessibility: 'Voltar à etapa anterior',
      next: 'Próximo',
    },
    cyclePattern: {
      subtitle: 'Isso nos ajuda a adaptar o seu acompanhamento — nunca para fazer um diagnóstico.',
      options: {
        irregular: {
          description: 'A duração do meu ciclo varia de forma perceptível de mês para mês.',
        },
      },
      info: 'Cada ciclo é diferente. A AWA está aqui para ajudar você a compreender melhor o seu, no seu ritmo.',
    },
    lastPeriod: {
      subtitle: 'Essa informação é apenas indicativa — nunca determina um atraso.',
      skipLabel: 'Não sei / Prefiro informar depois',
      skipDescription: 'Prefiro informar isso depois, a partir do meu Diário.',
      info: 'Sem problema se você ainda não sabe. Você pode adicioná-la depois.',
    },
    trackedItems: {
      subtitle: 'Selecione o que é importante para você. Você pode alterar a qualquer momento.',
      info: 'Você sempre encontrará o seu Registro diário completo, independentemente do que escolher aqui.',
    },
    reminders: {
      subtitleOnboarding: 'Escolha apenas os lembretes que são realmente úteis para você. Você pode alterá-los a qualquer momento no seu perfil.',
      subtitleEdit: 'Escolha os lembretes que apoiam você no seu acompanhamento.',
      dailyJournal: {
        label: 'Registro diário',
        description: 'Como você está se sentindo hoje? Lembre-se de atualizar o seu registro.',
      },
      unrecordedPeriod: {
        label: 'Período não registrado',
        description: 'Você ainda não registrou um novo período. Lembre-se de atualizar o seu registro se ele já começou.',
      },
      errorMissingTime: 'Escolha uma hora para o lembrete do seu registro diário.',
      permissionNotice: 'Ative as notificações nas configurações do seu celular para receber os seus lembretes.',
      saving: 'Salvando…',
    },
  },
  irregularCalendar: {
    nextMonthAccessibility: 'Próximo mês',
    flow: {
      light: 'Leve',
    },
    dayAccessibility: {
      trackingRecorded: ', acompanhamento registrado',
      categoriesCount_one: ' ({{count}} categoria)',
      categoriesCount_other: ' ({{count}} categorias)',
    },
    selected: {
      spotting: 'Pequenos sangramentos',
      fatigueWithSymptoms_one: '{{value}} · {{count}} sintoma associado',
      fatigueWithSymptoms_other: '{{value}} · {{count}} sintomas associados',
      fillPeriod: 'Registrar o período deste dia',
      editTodayAccessibility: 'Editar o registro de hoje',
    },
    pastCategory: {
      title: 'Registro de hoje',
      fillAccessibility: 'Registrar {{label}} deste dia',
    },
    emptyState: {
      title: 'Sem registro para este dia',
      text: 'Ainda não foi registrado nada para esta data.',
    },
    sheet: {
      todayDescription: 'O contorno roxo tracejado marca a data de hoje.',
    },
    filterRows: {
      periodDescription: 'Mostrar os dias de período registrados',
      acneDescription: 'Mostrar os dias em que foi registrada acne',
      hairGrowthDescription: 'Mostrar os dias em que foi registrado crescimento de pelos',
      weightDescription: 'Mostrar os dias em que o peso foi registrado',
      painDescription: 'Mostrar os dias em que foi registrada dor',
      moodDescription: 'Mostrar os dias em que o humor foi registrado',
      fatigueDescription: 'Mostrar os dias em que foi registrado cansaço',
    },
    legendRows: {
      periodDescription: 'Foi registrado um dia de período (diário do Período).',
      acneDescription: 'Foi registrado o acompanhamento da acne nesse dia.',
      hairGrowthDescription: 'Foi registrado o acompanhamento do crescimento de pelos nesse dia.',
      weightDescription: 'Foi registrado um peso nesse dia.',
      painDescription: 'Foi registrada dor ou desconforto nesse dia.',
      moodDescription: 'Foi registrado um humor para essa data.',
      fatigueDescription: 'Foi registrado o acompanhamento do cansaço nesse dia.',
    },
  },
  irregularStatistics: {
    common: {
      daysCount_one: '{{count}} dia',
      daysCount_other: '{{count}} dias',
      daysAbbrev_one: '{{count}}d',
      daysAbbrev_other: '{{count}}d',
      trackedDaysLabel_one: 'dia registrado',
      trackedDaysLabel_other: 'dias registrados',
      trackedDaysCount_one: '{{count}} dia registrado',
      trackedDaysCount_other: '{{count}} dias registrados',
      cyclesCount_one: '{{count}} ciclo registrado',
      cyclesCount_other: '{{count}} ciclos registrados',
    },
    cycleOverview: {
      hero: {
        footnote: 'Com base em {{cycles}} e {{days}} ao longo de {{months}}. Seus ciclos podem variar — esta referência descreve o que foi observado, sem nenhum julgamento.',
      },
      empty: {
        title: 'Ainda não há ciclos suficientes registrados',
        text: 'Continue registrando seus períodos. A AWA mostrará aqui uma duração média observada assim que houver ciclos suficientes registrados.',
        pill: 'Seu histórico vai sendo construído aos poucos',
      },
    },
    symptoms: {
      subtitleMonth: 'Sua visão geral deste mês',
      snapshot: {
        trackedLabel: 'Dias registrados',
      },
      emptyTitle: 'Nenhuma observação registrada este mês',
      emptyDetail: 'Preencha o seu registro diário para ver esta estatística aparecer.',
    },
    category: {
      emptyTitle: 'Nenhum dado registrado este mês',
      emptyDetail: 'Registre esta observação no Registro diário para ver esta estatística aparecer.',
    },
    weight: {
      subtitleLongitudinal: 'Medições registradas por mês ao longo de {{months}}',
      subtitleMonth: 'Medições registradas este mês',
      measurementsCount_one: '{{count}} medição',
      measurementsCount_other: '{{count}} medições',
      recordedLabel_one: 'medição registrada',
      recordedLabel_other: 'medições registradas',
    },
    medicalHint: 'Estas referências, baseadas nos seus dados reais, podem ajudar você a descrever o seu histórico em uma consulta médica. Elas não fazem nenhum diagnóstico e não substituem a orientação médica.',
  },
  irregularDashboard: {
    headerSubtitle: 'Seu acompanhamento, com discrição.',
    description: 'A AWA apoia você no acompanhamento dos seus sintomas e na compreensão do seu corpo.',
    ring: {
      dayAccessibility: 'Dia {{day}} do seu ciclo, acompanhamento em andamento',
      unsetAccessibility: 'Ciclo a definir, acompanhamento em andamento',
      footnote: 'Acompanhamento em andamento',
      statusUnset: 'Ciclo a definir',
    },
    daily: {
      title: 'Registro de hoje',
      subtitle: 'Anote o que é importante hoje, no seu ritmo.',
      period: {
        subtitle: 'Registre o início do seu período',
      },
    },
  },
  irregularJournalEntry: {
    todaySubtitle: 'Registro diário',
    areasTitle: 'Áreas afetadas',
    categories: {
      period: {
        prompt: 'Registre o seu fluxo e como você se sente {{day}}.',
        saveLabel: 'Salvar meu período',
        toastTitle: 'Período salvo',
      },
      acne: {
        saveLabel: 'Salvar meu registro',
        toastTitle: 'Acne salva',
      },
      hairGrowth: {
        prompt: 'Anote as alterações que você gostaria de acompanhar, no seu ritmo.',
        saveLabel: 'Salvar meu registro',
        toastTitle: 'Crescimento de pelos salvo',
      },
      weight: {
        prompt: 'Registre a medição de hoje, sem julgamentos.',
        saveLabel: 'Salvar meu peso',
        toastTitle: 'Peso salvo',
      },
      pain: {
        saveLabel: 'Salvar minha dor',
        toastTitle: 'Dor salva',
      },
      mood: {
        saveLabel: 'Salvar meu humor',
        toastTitle: 'Humor salvo',
      },
      fatigue: {
        saveLabel: 'Salvar meu registro',
        toastTitle: 'Cansaço e sintomas salvos',
      },
    },
    period: {
      status: {
        spotting: 'Pequenos sangramentos',
      },
      questionToday: 'Você está no período hoje?',
      questionPast: 'Você estava no período nesse dia?',
    },
    hairGrowth: {
      helperText: 'Selecione as áreas que você gostaria de acompanhar.',
    },
    pain: {
      whichPainTitle: 'Que dor você está sentindo?',
    },
    mood: {
      kindnessText: 'Cuide-se, no seu ritmo.',
    },
    errors: {
      futureDate: 'Não é possível registrar o acompanhamento de uma data futura.',
      periodStatusToday: 'Indique se você está no período hoje antes de salvar.',
      periodStatusPast: 'Indique se você estava no período nesse dia antes de salvar.',
      periodFlow: 'Escolha a intensidade do fluxo antes de salvar.',
      chooseAnswer: 'Escolha uma resposta antes de salvar.',
    },
    toastMessage: 'Seu registro diário foi atualizado.',
  },
  menopauseLabTracking: {
    title: 'Gostaria de acompanhar\nos seus resultados de exames?',
    subtitle: 'A AWA pode ajudar você a acompanhar a evolução dos seus resultados ao longo do tempo, sem interpretá-los por você.',
    helperText: 'Você pode alterar esta escolha depois, nas suas preferências.',
    options: {
      fsh: {
        subtitle: 'Hormônio folículo-estimulante',
      },
    },
  },
  menopauseReminders: {
    subtitle: 'Ative apenas os lembretes que são úteis para você. Você pode alterá-los depois.',
    editSubtitleWithTreatment: 'Gerencie o lembrete do seu acompanhamento diário e o lembrete do seu tratamento.',
    editSubtitleDailyOnly: 'Gerencie o lembrete do seu acompanhamento diário.',
    permissionNotice: 'Ative as notificações nas configurações do seu celular para receber os seus lembretes.',
    infoText: 'Você pode alterar estas configurações a qualquer momento nas suas preferências.',
    dailyTracking: {
      cardDescription: 'Um pequeno lembrete para completar o seu registro do dia.',
      editRowSubtitle: 'Um lembrete para completar o seu registro do dia.',
    },
    treatment: {
      cardDescription: 'Se quiser, a AWA pode lembrar você do seu tratamento.',
      editRowSubtitle: 'Um lembrete para você não esquecer o seu tratamento.',
    },
  },
  menopauseStage: {
    eyebrow: 'SEU BEM-ESTAR ESTÁ EVOLUINDO',
    subtitle: 'Escolha a opção que melhor descreve o seu momento atual. Você pode alterá-la depois.',
    options: {
      perimenopause: {
        subtitle: 'Há algum tempo percebo alterações',
      },
    },
    saving: 'Salvando…',
  },
  menopauseSymptoms: {
    subtitle: 'Escolha os que se aplicam a você hoje. Você pode selecionar vários.',
    summary: {
      none: 'Nenhum por enquanto',
      selectedCount_one: '{{count}} selecionado',
      selectedCount_other: '{{count}} selecionados',
    },
    options: {
      hot_flashes: {
        title: 'Ondas de calor',
      },
      sleep_disturbances: {
        title: 'Distúrbios do sono',
        subtitle: 'Dificuldade para dormir ou manter o sono',
      },
      brain_fog: {
        title: 'Névoa mental',
      },
    },
    helper: 'Você pode alterar suas escolhas depois.',
    saving: 'Salvando…',
  },
  menopauseHormonalTreatment: {
    eyebrow: 'SEU ACOMPANHAMENTO PERSONALIZADO',
    title: 'Você está fazendo\nterapia hormonal?',
    optionsTitle: 'Minha escolha',
    options: {
      track: {
        title: 'Sim, quero acompanhar na AWA',
        subtitle: 'Você pode configurar os detalhes depois',
      },
    },
    helperText: 'Você pode alterar esta escolha depois.',
    saving: 'Salvando…',
  },
  menopauseStatistics: {
    header: {
      subtitle: 'Seu acompanhamento da perimenopausa / menopausa, de relance.',
    },
    empty: {
      text: 'Adicione alguns registros para ver suas tendências.',
    },
    labOnly: {
      title: 'Sem registro diário neste período',
      text: 'Só existem resultados de exames neste período; eles são exibidos abaixo.',
    },
    overview: {
      daysTracked: 'Dias registrados',
      treatmentTracked: 'Registros de tratamento',
    },
    symptoms: {
      emptyText: 'Nenhum sintoma registrado neste período.',
      dayCount_one: '{{count}} dia',
      dayCount_other: '{{count}} dias',
    },
    mood: {
      dayCount_one: '{{count}} dia',
      dayCount_other: '{{count}} dias',
    },
    sleep: {
      averageLabel: 'Duração média registrada',
      evolutionHint: 'Duração média do sono registrada, mês a mês.',
    },
    energy: {
      dayCount_one: '{{count}} dia',
      dayCount_other: '{{count}} dias',
    },
    treatment: {
      emptyText: 'Nenhum registro de tratamento neste período.',
    },
    lab: {
      cardTitle: 'Histórico de exames',
      resultCount_one: '{{count}} resultado',
      resultCount_other: '{{count}} resultados',
      emptyFsh: 'Nenhum resultado de FSH registrado para {{period}}.',
      emptyEstradiol: 'Nenhum resultado de estradiol registrado para {{period}}.',
    },
  },
  menopauseJournalEntry: {
    categories: {
      symptoms: {
        description: 'Selecione os sintomas que você sente hoje. Você pode escolher mais de um.',
        saveLabel: 'Salvar registro',
      },
      mood: {
        description: 'Como você se sente hoje? Escolha o humor que melhor representa seu momento.',
        saveLabel: 'Salvar humor',
      },
      sleep: {
        description: 'Registre a duração e a qualidade do seu sono na noite passada.',
        saveLabel: 'Salvar meu sono',
      },
      energy: {
        description: 'Como está seu nível de energia hoje? Escolha a opção que mais combina com você.',
        saveLabel: 'Salvar minha energia',
      },
      treatment: {
        description: 'Anote se você tomou seu tratamento hoje. É um acompanhamento pessoal, sem julgamentos.',
        saveLabel: 'Salvar registro',
      },
      labResults: {
        description: 'Adicione os resultados dos seus exames para acompanhar a evolução ao longo do tempo.',
        saveLabel: 'Salvar resultado',
      },
      notes: {
        description: 'Um espaço privado para anotar seus pensamentos, sentimentos ou tudo o que for importante para você.',
        saveLabel: 'Salvar minha nota',
      },
    },
    common: {
      delete: 'Excluir',
      saving: 'Salvando…',
      selectedCount_one: '{{count}} selecionado',
      selectedCount_other: '{{count}} selecionados',
      savedToastTitle: 'Salvo',
      savedToastPast: 'Registro de {{date}}',
    },
    symptoms: {
      noneTrackedText: 'Você ainda não escolheu nenhum sintoma para acompanhar. Escolha os que se aplicam a você para encontrá-los aqui.',
      intensitySubtitle: 'Como você classifica a intensidade global hoje?',
    },
    mood: {
      title: 'Como você se sente?',
      kindnessText: 'É perfeitamente normal ter altos e baixos. Cuide de você, no seu ritmo.',
    },
    sleep: {
      qualitySubtitle: 'Como você classifica a qualidade da sua noite?',
      qualityDescriptions: {
        good: 'Uma noite tranquila, me sinto descansada.',
      },
    },
    energy: {
      descriptions: {
        low: 'Me sinto exausta, sem energia.',
        medium: 'Meu nível de energia é razoável.',
        high: 'Me sinto muito bem e cheia de energia.',
      },
    },
    treatment: {
      statusTitle: 'Status do dia',
      subtitleToday: 'Você tomou seu tratamento hormonal hoje?',
      subtitlePast: 'Você tomou seu tratamento hormonal nesse dia?',
      descriptions: {
        taken: 'Tomei meu tratamento conforme o planejado.',
      },
      ownershipTitle: 'Seu acompanhamento pertence a você',
      ownershipText: 'A AWA nunca sugere uma dose, um horário ou uma recomendação. Você mantém o controle do seu acompanhamento.',
    },
    lab: {
      editingText: 'Você está editando um resultado de {{type}} já registrado.',
      typeStepTitle: '1. Tipo de exame',
      valueAccessibility: 'Valor do exame',
      unitAccessibility: 'Unidade do exame',
      infoText: 'Digite o valor exatamente como aparece no seu resultado.',
      sampleDateTitle: 'Data da coleta',
      sampleDateAccessibility: 'Data da coleta: {{date}}. Editar',
      deleteResultAccessibility: 'Excluir o resultado de {{type}} de {{date}}',
      deleteLabel: 'Excluir',
      saveEditLabel: 'Salvar alterações',
    },
    notes: {
      privateText: 'Elas ficam neste dispositivo. O acesso a esta seção usa seu código ou biometria, se você os tiver configurado.',
      freedomText: 'Não há maneira certa ou errada de escrever. Escreva livremente, no seu ritmo.',
      inspirationChips: {
        letGo: 'Aquilo de que quero me libertar',
      },
    },
    hero: {
      pastDescription: 'Registro de {{date}}. Anote o que você sentiu nesse dia.',
    },
    errors: {
      futureDate: 'Você não pode salvar um registro para uma data futura.',
      invalidSleepDuration: 'Digite uma duração de sono válida, entre 0 e 24 horas.',
      treatmentRequiredToday: 'Indique se você tomou seu tratamento hoje.',
      treatmentRequiredPast: 'Indique se você tomou seu tratamento nesse dia.',
      selectLabType: 'Selecione um tipo de exame.',
      invalidLabValue: 'Digite um valor numérico para este resultado.',
      labFutureDate: 'A data da coleta não pode estar no futuro.',
      labResultGone: 'Este resultado não existe mais.',
    },
    alerts: {
      deleteLabTitle: 'Excluir este resultado?',
      clearTitle: 'Limpar este registro?',
      clearMessagePast: 'As informações registradas para {{date}} serão excluídas.',
      clearMessageToday: 'As informações registradas hoje serão excluídas.',
    },
    actions: {
      clearThisTracking: 'Limpar este registro',
    },
  },
  menopauseJournalConfig: {
    items: {
      mood: {
        journalSubtitle: 'Reserve um momento para anotar como você se sente',
      },
      labResults: {
        label: 'Exames',
      },
      notes: {
        journalSubtitle: 'Adicione uma nota pessoal ao seu registro',
      },
    },
    symptomOptions: {
      hot_flashes: {
        label: 'Ondas de calor',
      },
      sleep_disturbances: {
        label: 'Distúrbios do sono',
      },
      brain_fog: {
        label: 'Névoa mental',
      },
    },
    intensity: {
      mild: 'Leve',
    },
    sleepQuality: {
      poor: 'Ruim',
    },
    mood: {
      stressed: 'Estressada',
    },
  },
  menopauseDashboard: {
    stageOptions: {
      perimenopause: {
        subtitle: 'Há algum tempo venho notando mudanças',
      },
      menopause: {
        subtitle: 'Minha menstruação parou',
      },
    },
    hero: {
      status: {
        empty: 'Cuide de você hoje',
        complete: 'Seu registro de hoje está completo',
        partial: 'Seu registro avança no seu ritmo',
      },
      supporting: {
        empty: 'Bastam alguns momentos para ouvir o que seu corpo diz.',
        partial_one: '{{count}} registro preenchido hoje.',
        partial_other: '{{count}} registros preenchidos hoje.',
      },
    },
    stageCard: {
      title: 'Minha jornada',
    },
    daily: {
      title: 'Registro de hoje',
      toFill: 'A preencher',
      labels: {
        labResults: 'Exames',
      },
      symptomsRecorded_one: '{{count}} sintoma registrado',
      symptomsRecorded_other: '{{count}} sintomas registrados',
      labRecorded: 'Resultados registrados',
    },
    stageModal: {
      subtitle: 'Escolha a situação que melhor descreve você hoje.',
      saving: 'Salvando…',
    },
  },
  menopauseCalendar: {
    nextMonthAccessibility: 'Próximo mês',
    dayAccessibility: {
      trackingRecorded: ', registro feito',
    },
    categories: {
      filterDescription: {
        mood: 'Mostrar os dias em que um humor foi registrado',
        sleep: 'Mostrar os dias em que o sono foi registrado',
        energy: 'Mostrar os dias em que o nível de energia foi registrado',
        labResults: 'Mostrar os dias com um resultado de exame',
      },
      legendDescription: {
        symptoms: 'Um ou mais sintomas foram registrados.',
        mood: 'Um humor foi registrado para esta data.',
        sleep: 'Informações sobre o sono foram registradas.',
        energy: 'O nível de energia foi registrado.',
        treatment: 'O acompanhamento do tratamento foi registrado.',
        labResults: 'Um resultado de FSH ou de estradiol foi registrado.',
        notes: 'Uma nota pessoal foi registrada nesse dia.',
      },
    },
    selected: {
      labels: {
        labResults: 'Exames',
      },
      symptomsRecorded_one: '{{count}} registrado',
      symptomsRecorded_other: '{{count}} registrados',
      notesRecorded: 'Nota registrada',
      editTodayAccessibility: 'Editar o registro de hoje',
    },
    emptyState: {
      title: 'Sem registro neste dia',
      text: 'Nada foi registrado ainda para esta data.',
    },
    summary: {
      hotFlashDays: 'Ondas de calor',
    },
    wellbeing: {
      legendDescription: 'Este marcador combina humor, sono e energia: pelo menos um deles foi registrado nesse dia.',
    },
  },
  pregnancyDatingSetup: {
    subtitle: 'Escolha o método que melhor combina com você para estimar o início da sua gravidez.',
    options: {
      conceptionDate: {
        label: 'Data estimada da concepção',
        dateFieldLabel: 'Data estimada da concepção',
      },
    },
    next: 'Próximo',
  },
  pregnancyTrackingPreferences: {
    next: 'Próximo',
  },
  pregnancyWeight: {
    scaleAccessibility: 'Balança de banheiro',
    empty: {
      title: 'Nenhuma medição registrada',
    },
    recorded: {
      label: 'Peso registrado',
    },
    sheet: {
      subtitle: 'Informe diretamente a medição de hoje',
      supportText: 'Digite um valor entre 30 e 300 kg.',
      previousValueLabel: 'Valor registrado hoje',
      saveAccessibility: 'Salvar o peso',
      save: 'Salvar este peso',
    },
    errors: {
      invalidWeight: 'Digite um peso válido em kg.',
    },
    saveToast: {
      savedTitle: 'Peso salvo',
    },
  },
  pregnancySymptoms: {
    saveSymptomsAccessibility: 'Salvar os sintomas',
    hero: {
      subtitle: 'Registre como você se sente\nfisicamente hoje.',
    },
    selectedCount_one: '{{count}} selecionado',
    selectedCount_other: '{{count}} selecionados',
    saveMineAccessibility: 'Salvar meus sintomas',
    saveToast: {
      savedTitle: 'Sintomas salvos',
    },
  },
  pregnancyDashboard: {
    hero: {
      daysCount_one: '{{count}} dia',
      daysCount_other: '{{count}} dias',
    },
    baby: {
      eyebrow: 'Seu bebê',
      babyIllustrationAccessibility: 'Ilustração do bebê na semana {{week}}',
    },
    unconfigured: {
      description: 'Informe o início da sua gravidez para ver a sua semana, a data prevista do parto e a sua evolução.',
    },
    daily: {
      subtitle: 'Dedique um momento a você',
    },
  },
  pregnancyDeliveryDateSheet: {
    title: 'Seu bebê chegou 💜',
    description: 'Informe a data do parto para iniciar o seu acompanhamento pós-parto.',
  },
  pregnancyPostpartumCongrats: {
    deliveryRecordedOn: 'Parto registrado em',
    preparing: 'Preparando…',
  },
  pregnancyReminders: {
    description: 'Enviaremos lembretes adaptados\nàs suas preferências.',
    options: {
      dailyJournal: {
        label: 'Registro diário',
      },
    },
    infoText: 'Você pode alterar as suas preferências de lembretes\na qualquer momento nas configurações.',
  },
  pregnancyNotifications: {
    delete: 'Excluir',
    deleteReminderAccessibility: 'Excluir {{title}}',
    deleteConfirmMessage: 'Isso excluirá também o lembrete associado.',
    deleteMedicationConfirmTitle: 'Excluir este medicamento?',
    deleteVitaminConfirmTitle: 'Excluir esta vitamina?',
    deleteCustomReminderConfirmTitle: 'Excluir este lembrete?',
    sections: {
      pregnancy: {
        dailyJournal: {
          title: 'Registro diário',
          description: 'Me lembrar de completar o meu acompanhamento do dia.',
        },
      },
      appointmentsExams: {
        defaultReminderHint: 'Lembrete padrão',
        footnote: 'Cada consulta ou exame pode definir o seu próprio lembrete na respectiva página.',
      },
      health: {
        noVitaminsText: 'Nenhuma vitamina registrada.',
        noMedicationsText: 'Nenhum medicamento registrado.',
        footnote: 'O app apenas lembra do que foi informado por você — não fornece nenhuma dosagem nem orientação médica.',
      },
      custom: {
        noRemindersText: 'Nenhum lembrete personalizado registrado.',
      },
    },
  },
  pregnancyStatistics: {
    moodLabels: {
      stressed: 'Estressada',
    },
    weight: {
      emptyText: 'Nenhuma medição registrada ainda.',
      valuesCount_one: '{{count}} valor',
      valuesCount_other: '{{count}} valores',
      measurementsCount_one: '{{count}} medição',
      measurementsCount_other: '{{count}} medições',
    },
    symptoms: {
      subtitleDefault: 'Os sintomas que você registrou com mais frequência',
      dayCount_one: '{{count}} dia',
      dayCount_other: '{{count}} dias',
    },
    wellness: {
      moodEntries_one: '{{count}} registro',
      moodEntries_other: '{{count}} registros',
      sleepTracked_one: '{{count}} noite acompanhada',
      sleepTracked_other: '{{count}} noites acompanhadas',
      sleepChipCount_one: 'Sono · {{count}} noite',
      sleepChipCount_other: 'Sono · {{count}} noites',
    },
    details: {
      medicalInfoLogged: 'Registrado · {{date}}',
      medicalInfoDaysLogged_one: '{{count}} dia registrado',
      medicalInfoDaysLogged_other: '{{count}} dias registrados',
    },
    medicalSummary: {
      appointments_one: '{{count}} consulta',
      appointments_other: '{{count}} consultas',
      exams_one: '{{count}} exame',
      exams_other: '{{count}} exames',
    },
  },
  pregnancyMedicalInformation: {
    errors: {
      emptyNote: 'Adicione alguma informação antes de salvar.',
    },
    save: {
      saving: 'Salvando…',
    },
    toast: {
      success: 'Informações médicas salvas com sucesso ✨',
    },
    calendar: {
      nextMonth: 'Próximo mês',
    },
  },
  pregnancyEvent: {
    form: {
      titlePlaceholderExam: 'Ex.: Ultrassonografia do 2º trimestre',
      titleRequired: 'Digite um título.',
      deleteAppointmentTitle: 'Excluir esta consulta?',
      deleteExamTitle: 'Excluir este exame?',
      deleteMessage: 'Isso excluirá também o lembrete associado.',
      delete: 'Excluir',
      deleteAppointmentAccessibility: 'Excluir esta consulta',
      deleteExamAccessibility: 'Excluir este exame',
      deleting: 'Excluindo…',
      deleteModalCloseAccessibility: 'Fechar sem excluir',
    },
    reminder: {
      noTimeHint: 'Nenhuma hora está definida, então usamos 09:00 para calcular a hora do lembrete.',
      savedWithoutTitle: 'Salvo sem lembrete',
      savedPermission: '“{{title}}” foi salvo, mas o lembrete não foi agendado porque as notificações da AWA estão desativadas nas configurações do seu celular.',
      savedChannel: '“{{title}}” foi salvo, mas o lembrete não foi agendado porque a categoria de lembretes da AWA está bloqueada nas configurações do seu celular.',
      savedCategoryAppointment: '“{{title}}” foi salvo, mas os lembretes de consultas estão desativados em Notificações e lembretes, então o lembrete não foi agendado.',
      savedCategoryExam: '“{{title}}” foi salvo, mas os lembretes de exames estão desativados em Notificações e lembretes, então o lembrete não foi agendado.',
      savedPast: '“{{title}}” foi salvo, mas o horário do lembrete ({{when}}) já passou, então nenhum lembrete foi agendado.',
      savedUnavailable: '“{{title}}” foi salvo, mas não é possível ler agora as suas configurações de notificações, então o lembrete não foi agendado. Tente novamente mais tarde.',
      savedFailed: '“{{title}}” foi salvo, mas não foi possível agendar o lembrete. Abra-o novamente e salve para tentar de novo.',
    },
  },
  pregnancyWeekScreen: {
    tabs: {
      baby: 'Bebê',
      body: 'Seu corpo',
    },
    unconfigured: {
      text: 'Configure os dados da sua gravidez para acompanhá-la semana a semana.',
    },
    header: {
      nextWeek: 'Próxima semana',
    },
    baby: {
      heroTitle: 'Seu bebê esta semana',
    },
    body: {
      title: 'Seu corpo esta semana',
      subtitle: 'As mudanças que você pode sentir',
    },
  },
  pregnancyCalendar: {
    subtitle: 'Acompanhe sua gravidez',
    eventTypes: {
      note: {
        label: 'Registro',
        empty: 'Sem registro',
      },
    },
    filters: {
      symptoms: {
        description: 'Sinais e sintomas registrados no seu diário.',
      },
      weight: {
        empty: 'Não registrado',
      },
      mood: {
        description: 'Humor e emoções registrados dia a dia.',
        empty: 'Não registrado',
      },
      sleep: {
        empty: 'Não informado',
      },
      medical: {
        label: 'Informações médicas',
      },
    },
    dailyInfo: {
      recorded: 'Registrado',
      notRecorded: 'Não registrado',
    },
    upcoming: {
      title: 'Próximos',
      empty: 'Nenhuma consulta ou exame próximo.',
    },
    sheet: {
      legend: {
        subtitle: 'Entenda as cores e os marcadores utilizados.',
        eventDescriptions: {
          appointment: 'Consultas, visitas ou compromissos médicos agendados.',
          exam: 'Próximos exames médicos ou ultrassonografias.',
          note: 'Registro diário feito nesse dia (sintomas, peso, humor, sono ou informações médicas).',
        },
        ramadanDescription: 'Este dia fica no mês de Ramadão (jejum).',
        dhoulHijjaDescription: 'Este dia fica no mês de Dhou al-Hijja.',
        todayDescription: 'O contorno preto tracejado marca a data de hoje.',
      },
      filters: {
        subtitle: 'Escolha as informações a exibir no seu calendário.',
      },
    },
  },
  postpartumDashboard: {
    headerSubtitle: 'Cuide de você, um dia de cada vez 💜',
    feeding: {
      mixed: 'Mista (peito + mamadeira)',
      exclusiveBottle: 'Mamadeira',
    },
    hero: {
      title: 'Sua jornada pós-parto',
      illustrationAccessibility: 'Mãe com seu recém-nascido',
    },
    unconfigured: {
      title: 'Informe a data do seu parto',
      button: 'Informar a data',
    },
    today: {
      sectionSubtitle: 'Seu acompanhamento essencial, de relance',
    },
    lochia: {
      noneRecordedToday: 'Nenhuma informação registrada hoje',
    },
    cycleReturn: {
      title: 'Retorno do ciclo',
    },
    dailyCard: {
      title: 'Registro de hoje',
      subtitle: 'Reserve um momento para você',
    },
    nifas: {
      lossesOngoing: 'Dia {{day}} · Sangramento em andamento',
      notTracked: 'Dia {{day}} · Acompanhamento não registrado',
    },
    nifasModal: {
      body: 'Segundo esta referência, você pode retomar suas orações a partir de hoje, mesmo que os lóquios ou o sangramento persistam. Siga a referência religiosa que você escolheu.',
      note: 'Você pode continuar seu acompanhamento pós-parto na AWA.',
    },
  },
  postpartumCalendar: {
    header: {
      subtitle: 'Acompanhe sua jornada pós-parto',
    },
    categories: {
      lochia: {
        description: 'Fluxo e cor dos lóquios registrados no seu acompanhamento.',
      },
      fatigue: {
        description: 'Avalie seu nível de cansaço hoje',
      },
      mood: {
        description: 'Como você está se sentindo hoje?',
      },
      pain: {
        description: 'Anote a dor que você sente hoje',
      },
      physicalRecovery: {
        description: 'Como está evoluindo a sua recuperação?',
      },
    },
    selected: {
      notConfigured: 'Informe a data do seu parto para ativar o acompanhamento pós-parto.',
      lochiaEmpty: 'Não registrado',
      cycleReturnTitle: 'Retorno do ciclo',
      cycleReturnValue: 'Primeiro período pós-parto registrado',
      emptyText: 'Nenhum dado registrado para este dia.',
    },
    legend: {
      subtitle: 'Entenda as cores e os marcadores utilizados.',
      todayDescription: 'O contorno preto tracejado marca a data de hoje.',
      ramadanDescription: 'Este dia fica no mês de Ramadão (jejum).',
      dhoulHijjaDescription: 'Este dia fica no mês de Dhu al-Hijjah.',
    },
    filters: {
      subtitle: 'Escolha as informações exibidas no seu calendário.',
    },
  },
  postpartumStatistics: {
    dayCount_one: '{{count}} dia',
    dayCount_other: '{{count}} dias',
    basedOnDays_one: 'Com base em {{count}} dia',
    basedOnDays_other: 'Com base em {{count}} dias',
    daysLogged: 'Dias registrados',
    fatigue: {
      emptyText: 'Registre seu cansaço no diário para ver aqui a evolução.',
    },
    mood: {
      emptyText: 'Registre seu humor no diário para ver aqui a evolução.',
    },
    pain: {
      emptyText: 'Registre sua dor no diário para ver aqui a frequência.',
    },
    recovery: {
      emptyText: 'Registre sua recuperação no diário para ver aqui o progresso.',
    },
    summary: {
      lochiaEntries: 'Registros de lóquios',
      cycleReturnOn: 'Retorno do período: em {{date}}',
      cycleReturnNotRecorded: 'Retorno do período: ainda não registrado',
      cycleReturnCardAccessibility: 'Retorno do ciclo — marcos registrados ao longo de {{periodLabel}}',
      cycleReturnSubtitle: 'Marcos registrados ao longo do tempo',
      cycleReturnTitle: 'Retorno do ciclo',
      cycleReturnConfirmed: 'Retorno do ciclo confirmado — você informou que seu período voltou em {{date}}.',
      cycleReturnEmpty: 'Sem retorno do ciclo confirmado ao longo de {{periodLabel}}.',
      adviceText: 'Cada pequeno passo conta. Cuide de você — seu corpo está se recuperando dia após dia.',
    },
    lochia: {
      evolutionFootnote: 'A evolução dos lóquios é diferente de mulher para mulher. Mantenha seu acompanhamento diário.',
      actuallyRecorded: 'Dados efetivamente registrados',
      lastRecordedDay: 'Último dia registrado',
      recordedDuration: 'Duração registrada',
      ongoing: 'Em andamento',
      notRecorded: 'Não registrado',
      entries: 'Registros',
      recordedSequence: 'Sequência registrada',
    },
    sleep: {
      nightsRecorded: 'Noites registradas',
      durationPerDay: 'Duração por dia registrado',
    },
  },
  postpartumDeliveryDate: {
    subtitle: 'Esta data nos permite calcular o seu dia de pós-parto.',
    nextMonth: 'Próximo mês',
    saving: 'Salvando…',
    next: 'Próximo',
  },
  postpartumDeliveryType: {
    subtitle: 'Esta informação permanece privada e nos ajuda a apoiar você melhor.',
    infoText: 'Você poderá alterar esta escolha mais tarde nas configurações.',
    saving: 'Salvando...',
    next: 'Próximo',
  },
  postpartumFeeding: {
    subtitle: 'Sua escolha nos ajuda a personalizar o acompanhamento e as dicas.',
    saving: 'Salvando…',
    next: 'Próximo',
    options: {
      mixed: 'Alimentação mista\n(peito + mamadeira)',
      exclusiveBottle: 'Apenas mamadeira',
    },
  },
  postpartumCycleReturn: {
    header: {
      title: 'Retorno do ciclo',
      helpAccessibilityLabel: 'Ajuda sobre o retorno do ciclo',
    },
    feedingLabels: {
      exclusiveBottle: 'Apenas mamadeira',
    },
    notProvided: 'Não informado',
    evolutionStages: {
      gradualReturn: {
        label: 'O ciclo pode voltar gradualmente',
      },
    },
    hero: {
      illustrationAccessibilityLabel: 'Ilustração do retorno do ciclo',
      returned: 'Ciclo voltou',
      notReturned: 'Ciclo não voltou',
      returnedDescription: 'Seu primeiro período desde o parto começou em {{date}}.',
      notReturnedDescription: 'Você ainda não menstruou desde o parto.',
      returnedBadge: 'Retorno registrado',
      normalPanelTitle: 'Cada corpo tem seu ritmo',
      normalPanelText: 'O retorno do período pode demorar, principalmente durante a amamentação.',
    },
    period: {
      sectionTitle: 'Retorno do período',
      sectionSubtitle: 'Informe o primeiro dia do seu período após o parto',
      valueNotRecorded: 'Ainda não registrado',
      addAccessibilityLabel: 'Registrar a data do primeiro período',
      clearLabel: 'Limpar esta data (o ciclo não voltou)',
      recordedLabel: 'Data registrada',
    },
    factors: {
      sectionSubtitle: 'Contexto com base nas informações que você registrou',
      educationText: 'Seu corpo se adapta gradualmente após o parto. As mudanças hormonais podem afetar a amamentação, o retorno do ciclo, o humor, o sono ou o ressecamento vaginal. Estes marcos não medem seus hormônios e não constituem um diagnóstico.',
      trackedContextLabel: 'SEU CONTEXTO REGISTRADO',
      feeding: {
        description: 'Pode influenciar o momento em que o período volta.',
      },
      cycleReturn: {
        title: 'Retorno do ciclo',
        description: 'Data real que você registrou.',
        notReturned: 'Ainda não voltou',
      },
      amenorrhea: {
        finished: 'Encerrada',
        ongoing: 'Em andamento',
      },
      sleep: {
        description: 'Seu descanso e recuperação diários.',
      },
      mood: {
        description: 'Seu estado emocional desde o parto.',
      },
      fatigue: {
        description: 'Última observação registrada no seu diário.',
      },
    },
    timeline: {
      disclaimer: 'Estes marcos são indicativos: o retorno do ciclo varia de pessoa para pessoa.',
    },
    reminder: {
      eyebrow: 'PARA LEMBRAR',
      title: 'Seu ritmo é único',
      text: 'Cada corpo evolui de forma diferente após o parto. A amamentação, em particular, pode influenciar o retorno do ciclo.',
    },
    helpModal: {
      text: 'Após o parto, a ausência de períodos é comum e pode durar de várias semanas a vários meses, principalmente durante a amamentação.',
    },
    picker: {
      title: 'Data do retorno do ciclo',
      subtitle: 'Informe o primeiro dia do seu primeiro período desde o parto.',
    },
    consistency: {
      lochiaActiveTitle: 'Verifique seu acompanhamento',
      beforeDeliveryMessage: 'Seu primeiro período desde o parto não pode ser anterior à data do parto.',
      dateOrderMessage: 'A data do retorno do ciclo é anterior à data de fim dos lóquios registrada.',
      lochiaActiveMessage: 'Seus lóquios continuam marcados como em andamento, mas você quer registrar um retorno do ciclo.',
      dateOrderInfo: 'Verifique as duas datas para manter seu acompanhamento coerente.',
      lochiaActiveInfo: 'Para manter seu acompanhamento coerente, verifique primeiro a data de fim dos lóquios ou corrija a data do retorno do ciclo.',
    },
  },
  postpartumReminders: {
    timeRequiredError: 'Escolha um horário para o lembrete do seu acompanhamento diário.',
    saving: 'Salvando…',
    permissionNotice: 'Ative as notificações nas configurações do celular para receber seus lembretes.',
    timePicker: {
      label: 'Horário do lembrete',
      accessibilityLabelWithTime: 'Horário do lembrete, {{time}}',
      accessibilityLabelChoose: 'Escolher um horário para o lembrete',
      choosePlaceholderLong: 'Escolher um horário',
    },
    edit: {
      subtitle: 'Gerencie os lembretes que apoiam seu acompanhamento pós-parto.',
    },
    onboarding: {
      infoText: 'Você poderá alterar esta configuração a qualquer momento nas suas preferências.',
    },
  },
  postpartumLochia: {
    duration: {
      subtitleNoData: 'Ainda não há nenhuma observação registrada.',
      subtitleOngoing: 'Acompanhamento médico em andamento',
      metrics: {
        lastRecorded: 'Último registro',
      },
    },
    finishModal: {
      textAfter: 'será registrada como a data de fim dos seus lóquios.',
    },
    reopenModal: {
      infoText: 'As observações já registradas serão mantidas. Você poderá continuar o acompanhamento a partir de hoje.',
    },
    saveConfirmation: {
      text: 'As observações de hoje foram salvas.',
    },
    reopenConsistency: {
      message: 'Já existe um retorno do ciclo registrado, mas você quer retomar o acompanhamento dos lóquios.',
      primaryLabel: 'Ver retorno do ciclo',
    },
    endDateError: {
      infoText: 'A data de fim deve estar entre o parto e hoje, e não pode ser posterior ao retorno do período, se já estiver registrado.',
    },
  },
  miscarriageJournalConfig: {
    items: {
      bleeding: {
        label: 'Sangramento',
        dashboardLabel: 'Sangramento',
        journalSubtitle: 'Registre a intensidade do seu sangramento hoje',
      },
      physicalSymptoms: {
        journalSubtitle: 'Registre os sintomas que você sente hoje',
      },
      personalNotes: {
        journalSubtitle: 'Um espaço privado para tudo o que quiser registrar',
      },
      tryingAgain: {
        journalSubtitle: 'Como você se sente em relação a isso hoje?',
      },
    },
  },
  miscarriageTryingAgain: {
    subtitle: 'Esta escolha nos ajuda a personalizar o seu apoio. Você está sempre livre para avançar ao seu ritmo.',
    illustrationAccessibility: 'Mulher em uma postura serena',
    options: {
      soon: {
        subtitle: 'Estou começando a pensar seriamente nisso',
      },
      ready: {
        label: 'Sim, me sinto pronta',
      },
    },
    reassurance: 'Você não está sozinha 💜 Estamos aqui para apoiar você a cada passo.',
    saving: 'Salvando…',
  },
  miscarriageDate: {
    subtitle: 'Esta data nos ajuda a acompanhar a sua jornada desde esse acontecimento.',
    infoText: 'Você pode alterar esta data mais tarde a qualquer momento.',
    saving: 'Salvando…',
    next: 'Próximo',
    conflicts: {
      cycleReturn: 'Esta data é posterior à data de retorno do ciclo que você já registrou ({{date}}). Corrija primeiro o retorno do seu ciclo e depois volte para editar a data da sua perda.',
      journal_one: 'O seu diário já tem um registro com a data {{date}}, anterior a esta data. Escolha uma data igual ou anterior a esse registro — seu histórico nunca é modificado nem excluído.',
      journal_other: 'O seu diário já tem {{count}} dias registrados antes desta data (o primeiro: {{date}}). Escolha uma data igual ou anterior a esse primeiro registro — seu histórico nunca é modificado nem excluído.',
    },
  },
  miscarriageBleeding: {
    title: 'Ainda tem\nsangramento?',
    subtitle: 'Isso nos ajuda a apoiar você melhor neste momento.',
    illustrationAccessibility: 'Gota simbolizando o sangramento',
    options: {
      yes: {
        subtitle: 'Ainda tenho sangramento',
      },
      no: {
        subtitle: 'Não tenho mais sangramento',
      },
      variable: {
        title: 'Não tenho certeza / varia',
      },
    },
    infoText: 'Você poderá registrar os detalhes (intensidade, cor, duração…) no seu diário.',
    saving: 'Salvando…',
    next: 'Próximo',
  },
  miscarriageCycleReturn: {
    title: 'O seu período\njá voltou desde então?',
    subtitle: 'Isso nos ajuda a acompanhar com delicadeza o retorno do seu ciclo.',
    options: {
      yes: {
        subtitle: 'O meu período voltou',
      },
      no: {
        subtitle: 'O meu período ainda não voltou',
      },
      unknown: {
        subtitle: 'Não tenho certeza',
      },
    },
    dateField: {
      accessibilityLabel: 'Data do primeiro dia em que o período voltou',
      label: 'Data do primeiro dia em que o período voltou',
    },
    dateWarning: 'Data a verificar: {{message}} Escolha uma data válida ou remova-a para salvar.',
    saving: 'Salvando…',
    next: 'Próximo',
    pickerTitle: 'Retorno do seu período',
    pickerSubtitle: 'Indique o primeiro dia em que o período voltou desde a sua perda gestacional.',
    statusLabels: {
      no: 'Período ainda não voltou',
      yes: 'Período voltou',
      unknown: 'Ainda sem certeza',
    },
    dateErrors: {
      future: 'A data em que o período voltou pela primeira vez não pode ser no futuro.',
      beforeLoss: 'A data em que o período voltou pela primeira vez não pode ser anterior à data da sua perda gestacional.',
      invalid: 'A data em que o período voltou pela primeira vez não é válida.',
    },
  },
  miscarriageCalendar: {
    categories: {
      bleeding: {
        description: 'Intensidade do sangramento registrada no seu diário.',
      },
      physicalSymptoms: {
        description: 'Sintomas físicos sentidos, registrados dia a dia.',
      },
      tryingAgain: {
        description: 'A sua resposta sobre “tentar novamente” registrada no diário nesse dia.',
      },
    },
    noteRecorded: '1 nota registrada',
    cycleReturnBadge: 'Período voltou',
    emptyText: 'Nenhuma informação registrada para este dia.',
    dayAccessibility: {
      cycleReturn: ', período voltou',
    },
    legendSheet: {
      subtitle: 'Entenda as cores e os marcadores usados.',
      ramadanDescription: 'Este dia está dentro do mês de Ramadão (jejum).',
      dhoulHijjaDescription: 'Este dia está dentro do mês de Dhu al-Hijjah.',
    },
  },
  miscarriageDashboard: {
    headerSubtitle: 'Cuide de você, ao seu ritmo.',
    hero: {
      cycleReturn: 'Retorno do seu ciclo',
      cycleReturnHint: 'Editar o retorno do meu ciclo',
    },
    daysCount_one: '{{count}} dia',
    daysCount_other: '{{count}} dias',
    unconfigured: {
      text: 'Esta data nos permite adaptar o seu apoio dia após dia.',
    },
    conceiveTransition: {
      title: 'Retome a sua jornada de concepção',
      button: 'Passar para o acompanhamento da concepção',
    },
    conceiveTransitionModal: {
      title: 'Passar para o acompanhamento da concepção?',
      message: 'Você pode começar a acompanhar a sua jornada para tentar engravidar. Os dados da sua jornada de perda gestacional continuarão salvos e você poderá encontrá-los a qualquer momento.',
      confirmAccessibility: 'Continuar e passar para o acompanhamento da concepção',
    },
    daily: {
      filled: 'Registrado',
      openJournal: 'Abrir o diário do dia',
    },
  },
  miscarriageJournalEntry: {
    pastDayNotSupported: 'Esta seção só pode ser preenchida para hoje.',
    dateErrors: {
      future: 'Você não pode registrar o acompanhamento de uma data futura.',
      beforeLoss: 'Você não pode registrar o acompanhamento de uma data anterior à sua perda gestacional.',
    },
    errors: {
      chooseIntensity: 'Escolha uma intensidade antes de salvar.',
      chooseSymptom: 'Escolha pelo menos um sintoma antes de salvar.',
      addNote: 'Adicione uma nota antes de salvar.',
      chooseAnswer: 'Escolha uma resposta antes de salvar.',
    },
    toasts: {
      bleedingSaved: {
        title: 'Sangramento salvo',
      },
      symptomsSaved: {
        title: 'Sintomas salvos',
      },
      noteSaved: {
        title: 'Nota salva',
        message: 'A sua nota pessoal foi salva.',
      },
      tryingAgainSaved: {
        title: 'Informação salva',
      },
    },
    bleeding: {
      duration: {
        subtitle: 'Desde quando você notou?',
      },
    },
    symptoms: {
      selectedSummary_one: '{{count}} sintoma selecionado',
      selectedSummary_other: '{{count}} sintomas selecionados',
      note: {
        placeholder: 'Intensidade, duração, hora do dia ou outro detalhe…',
      },
      infoPanel: {
        text: 'Este acompanhamento ajuda você a observar o seu progresso ao longo dos dias.',
      },
    },
    personalNotes: {
      infoPanel: {
        text: 'Escute-se com gentileza e avance ao seu ritmo.',
      },
    },
    tryingAgain: {
      hero: {
        title: 'Em que ponto você está hoje?',
        subtitle: 'Não há resposta certa ou errada. Escolha apenas o que parecer certo para você.',
      },
    },
  },
  miscarriageReminders: {
    editSubtitle: 'Gerencie o lembrete que apoia você no seu acompanhamento, ao seu ritmo.',
    permissionNotice: 'Ative as notificações nas configurações do celular para receber os seus lembretes.',
    saving: 'Salvando…',
    subtitle: 'Se quiser, a AWA pode lembrar você uma vez por dia de reservar um momento para o seu acompanhamento.',
    infoText: 'Você pode alterar esta configuração a qualquer momento nas suas preferências.',
  },
  miscarriageStatistics: {
    cycleReturnLabel: 'Retorno do seu ciclo',
    daysCount_one: '{{count}} dia',
    daysCount_other: '{{count}} dias',
    tabs: {
      bleeding: 'Sangramento',
    },
    cycleReturn: {
      labels: {
        no: 'Ainda não voltou',
        yes: 'Voltou',
        unknown: 'Ainda sem certeza',
      },
    },
    summary: {
      kpi: {
        completeDays: 'Registros completos',
        bleedingDays: 'Dias com sangramento',
      },
      bleedingEvolutionTitle: 'Tendência do sangramento',
      bleedingEmptyText: 'Registre o seu sangramento no diário para ver como ele evolui.',
      adviceText: 'Cuide de você, ao seu ritmo. Cada passo conta.',
    },
    bleeding: {
      title: 'Sangramento',
      emptyText: 'Registre o seu sangramento no diário para ver aqui como ele evolui.',
      kpi: {
        recordedDays: 'Dias registrados',
      },
      evolutionSubtitleDaily: 'Sequência registrada',
    },
    symptoms: {
      emptyText: 'Registre os seus sintomas no diário para acompanhar a frequência com que ocorrem.',
      frequencySubtitleDaily: 'Com base nos seus dias registrados',
    },
    tracking: {
      notesCount_one: 'nota registrada',
      notesCount_other: 'notas registradas',
      datePillText: 'Ciclo voltou: {{date}}',
      coverageAccessibility: 'Marcos do retorno do ciclo registrados em {{periodLabel}}',
      coverageSubtitle: 'Marcos registrados ao longo do tempo',
      confirmedLabel: 'Retorno do ciclo confirmado',
      confirmedText: 'Você registrou que o seu ciclo voltou em {{date}}.',
      noCycleReturnText: 'Nenhum retorno do ciclo confirmado em {{periodLabel}}.',
      infoText: 'O retorno do seu ciclo não altera automaticamente o seu plano de acompanhamento atual.',
    },
  },
  postpartumJournalEntry: {
    errors: {
      fatigue: 'Escolha um nível de cansaço antes de salvar.',
      mood: 'Escolha um humor antes de salvar.',
      sleep: 'Escolha uma qualidade de sono antes de salvar.',
      pain: 'Escolha um nível de dor antes de salvar.',
      physicalRecovery: 'Escolha um nível de recuperação antes de salvar.',
    },
    toast: {
      saved: {
        fatigue: 'Cansaço salvo',
        mood: 'Humor salvo',
        sleep: 'Sono salvo',
        pain: 'Dor salva',
        physicalRecovery: 'Recuperação salva',
      },
    },
    mood: {
      heroTitle: 'Como você está se sentindo hoje?',
      infoText: 'Escute a si mesma com gentileza, no seu próprio ritmo.',
    },
    sleep: {
      infoTitle: 'Cuide de você',
      infoText: 'É normal ter um sono irregular depois do parto. O seu corpo se regula aos poucos.',
    },
    fatigue: {
      heroText: 'O seu corpo está passando por muitas mudanças. Reserve um tempo para ouvi-lo.',
    },
    pain: {
      heroTitle: 'Como você está se sentindo\nno seu corpo?',
      heroText: 'Registrar o seu conforto ajuda a compreender melhor as suas necessidades ao longo do tempo.',
      adviceText: 'Este acompanhamento é um ponto de referência pessoal. Se uma dor for intensa, nova ou preocupante, entre em contato com o seu profissional de saúde.',
    },
    physicalRecovery: {
      heroTitle: 'Como está indo a sua recuperação?',
      heroText: 'O seu bem-estar se constrói um dia de cada vez, sem pressão.',
      adviceText: 'Cada corpo recupera ao seu ritmo depois do parto. Celebre os pequenos passos e seja gentil com você mesma.',
    },
    fatigueRatings: {
      none: {
        description: 'Me sinto disponível e descansada.',
      },
      light: {
        description: 'Um pouco de descanso me faria bem.',
      },
      moderate: {
        description: 'Estou desacelerando e ouvindo o meu corpo.',
      },
      veryStrong: {
        description: 'Estou priorizando o descanso e o apoio.',
      },
    },
    painRatings: {
      none: {
        description: 'Me sinto confortável hoje.',
      },
      moderate: {
        description: 'Estou me dando calma e pausas.',
      },
      veryStrong: {
        description: 'Não hesite em entrar em contato com um profissional.',
      },
    },
    recoveryRatings: {
      difficult: {
        description: 'Estou dando ao meu corpo o tempo de que ele precisa.',
      },
      stable: {
        description: 'Estou reencontrando o meu equilíbrio aos poucos.',
      },
      veryGood: {
        description: 'Me sinto cada vez melhor.',
      },
    },
  },
  postpartumJournalConfig: {
    items: {
      mood: {
        journalSubtitle: 'Como você está se sentindo hoje?',
      },
      pain: {
        journalSubtitle: 'Registre a dor que sente hoje',
      },
      physicalRecovery: {
        journalSubtitle: 'Como está evoluindo a sua recuperação?',
      },
    },
  },
  postpartumJournalScreenLayout: {
    saving: 'Salvando…',
  },
  postpartumCycleStyleJournalLayout: {
    saving: 'Salvando…',
  },
  postpartumWellnessRatingLayout: {
    sectionTitle: 'Escolha o que mais combina com você',
    sectionText: 'Não há respostas certas ou erradas: olhe para você com delicadeza.',
    saving: 'Salvando…',
    saveButtonLabel: 'Salvar o meu acompanhamento',
  },
  objectiveConfirmation: {
    cycle: {
      nextStep: 'Você poderá personalizar o seu acompanhamento e adicionar as suas primeiras informações\nna próxima etapa.',
    },
    conceive: {
      description: 'Você escolheu um acompanhamento para apoiar você na sua jornada de concepção.',
    },
    contraception: {
      description: 'Você escolheu um acompanhamento adaptado à sua contracepção.',
      nextStep: 'Você poderá indicar o seu tipo de contracepção e personalizar o acompanhamento do seu ciclo.',
    },
    postpartum: {
      nextStep: 'A AWA vai acompanhar você na sua recuperação, no registro dos lóquios, no bem-estar diário e no retorno gradual do seu ciclo.',
    },
  },
  objectiveScreen: {
    next: 'Próximo',
  },
  notificationPermission: {
    blockedBody: 'A AWA não pode mostrar os seus lembretes enquanto as notificações não forem permitidas nas configurações do celular.',
    channelBlockedBody: 'A categoria de lembretes da AWA está bloqueada nas configurações do celular, por isso os lembretes não vão aparecer.',
    openSettings: 'Abrir as configurações de notificações',
    channelSilentBody: 'A categoria de lembretes da AWA está silenciosa neste celular, por isso os lembretes aparecem sem som. Pode ser uma escolha sua, e a AWA não vai alterá-la. Se quiser ouvi-los, você mesma pode ativar o som.',
    channelSilentSteps: 'No Android: Configurações > Notificações > {{channel}} > Som.',
  },
  notifications: {
    cycle: {
      upcomingPeriod: {
        title: 'O seu período está chegando 🌸',
        body: 'Tenha por perto o que precisar, por precaução.',
      },
      upcomingPeriodDaughter: {
        body: 'O próximo período dela está previsto para daqui a alguns dias.',
      },
      periodStartCheck: {
        body: 'Registre a data de início para manter o seu acompanhamento atualizado.',
      },
      dailyJournal: {
        title: 'Como você está se sentindo hoje?',
      },
      fertileWindow: {
        title: 'A sua janela fértil estimada está chegando',
      },
      fertileWindowDaughter: {
        body: 'A janela fértil estimada dela está chegando.',
      },
    },
    conception: {
      fertileWindow: {
        title: 'A sua janela fértil está começando',
      },
      dailyJournal: {
        title: 'Registro diário',
      },
    },
    contraception: {
      defaultReminderTitle: 'Lembrete de contracepção',
      body: 'Reserve um momento para o acompanhamento da sua contracepção.',
    },
    irregular: {
      dailyJournal: {
        title: 'Como você está se sentindo hoje?',
      },
      unrecordedPeriod: {
        title: 'Período ainda não registrado',
        body: 'Você ainda não registrou um novo período. Se já começou, não se esqueça de atualizar o seu acompanhamento.',
      },
    },
    menopause: {
      dailyTracking: {
        body: 'Reserve um momento para registrar como se sente hoje.',
      },
    },
    pregnancy: {
      dailyJournal: {
        title: 'Registro diário',
      },
    },
    postpartum: {
      dailyTracking: {
        body: 'Reserve um momento para registrar como se sente hoje.',
      },
      nifas: {
        approachingBody: 'Está chegando um marcador do seu acompanhamento do pós-parto.',
      },
    },
    miscarriage: {
      dailyTracking: {
        body: 'Se quiser, reserve um momento para registrar como se sente hoje.',
      },
    },
  },
  help: {
    categories: {
      contraception: 'Contracepção',
      journal: 'Registro diário',
    },
    faq: {
      'cycle-record-period': {
        question: 'Como registro o meu período?',
        answer: 'No calendário ou no Registro diário, registre quando o seu período começa, quanto tempo dura e a intensidade do fluxo. Estas informações constroem o seu histórico pessoal e alimentam as estimativas mostradas na AWA.',
      },
      'cycle-edit-period': {
        answer: 'Sim. Edite a data em questão no seu acompanhamento para que o histórico continue fiel ao seu ciclo real. As estimativas podem então mudar com base nas novas informações salvas.',
      },
      'cycle-flow': {
        subtitle: 'Registre como a sua menstruação varia.',
        answer: 'Use o Registro diário para anotar a intensidade do seu fluxo menstrual. Assim você mantém um histórico de como ele varia ao longo dos ciclos.',
      },
      'conceive-temperature': {
        answer: 'Sim. O acompanhamento da temperatura basal faz parte do modo dedicado à concepção.',
      },
      'conceive-lh-test': {
        question: 'Posso registrar um teste de ovulação (LH)?',
        subtitle: 'Salve os seus resultados no acompanhamento.',
        answer: 'Sim. O registro dos testes de ovulação (LH) faz parte da jornada de concepção.',
      },
      'conceive-intercourse': {
        question: 'Como registro as relações sexuais?',
        answer: 'A seção Intimidade permite registrar as relações sexuais e outras informações relacionadas. Esta seção permanece discreta e pode ser protegida separadamente.',
      },
      'contraception-method': {
        question: 'Quais métodos contraceptivos posso acompanhar?',
        answer: 'A AWA permite acompanhar a pílula anticoncepcional, o anel vaginal, o adesivo contraceptivo e outros tratamentos hormonais.',
      },
      'contraception-forgotten-pill': {
        question: 'Posso registrar uma pílula esquecida?',
        answer: 'Sim. O acompanhamento das doses esquecidas faz parte da jornada de contracepção.',
      },
      'contraception-history': {
        question: 'Onde encontro o meu histórico de doses tomadas?',
        answer: 'Está disponível um histórico de doses tomadas para manter um registro do acompanhamento da sua contracepção.',
      },
      'contraception-predictions': {
        question: 'As previsões continuam úteis com o uso de contracepção?',
        answer: 'A AWA pode continuar a mostrar as informações de acompanhamento disponíveis, mas a forma de interpretar as previsões depende da sua situação e do método. O aplicativo nunca substitui o aconselhamento médico.',
      },
      'irregular-long-cycle': {
        subtitle: 'A AWA leva em conta os ciclos irregulares.',
      },
      'irregular-predictions': {
        question: 'Por que as minhas previsões variam mais?',
      },
      'menopause-symptoms': {
        answer: 'O acompanhamento inclui ondas de calor, suores noturnos, problemas de sono, cansaço, alterações de humor e névoa mental, entre outros.',
      },
      'menopause-hot-flashes': {
        question: 'Posso registrar as minhas ondas de calor?',
        answer: 'Sim. As ondas de calor são um dos sintomas disponíveis no modo Perimenopausa/Menopausa.',
      },
      'menopause-hormonal-treatment': {
        subtitle: 'Salve informações úteis para o seu acompanhamento.',
      },
      'menopause-labs': {
        question: 'Posso registrar os meus resultados de FSH e estradiol?',
        subtitle: 'Adicione alguns resultados de exames ao seu acompanhamento.',
        answer: 'Sim. Resultados de exames como o FSH e o estradiol podem ser registrados neste modo.',
      },
      'pregnancy-due-date': {
        question: 'Como é calculada a minha data provável do parto?',
        answer: 'O acompanhamento da gravidez calcula a sua data provável do parto a partir das informações disponíveis no seu acompanhamento.',
      },
      'pregnancy-weekly': {
        answer: 'Sim. A AWA oferece um acompanhamento semana a semana e mostra como a sua gravidez está evoluindo.',
      },
      'pregnancy-appointments': {
        question: 'Posso registrar as minhas consultas médicas?',
      },
      'postpartum-lochia': {
        subtitle: 'Observe a duração e a evolução do corrimento.',
      },
      'postpartum-cycle-return': {
        question: 'Como acompanho o retorno do meu período?',
        subtitle: 'Veja o seu ciclo sendo retomado aos poucos.',
        answer: 'A AWA acompanha o retorno do seu ciclo, a retomada do seu período e as suas alterações hormonais após o parto.',
      },
      'postpartum-recovery': {
        answer: 'O acompanhamento diário do pós-parto inclui o cansaço, o sono, o humor, a dor e a recuperação física, entre outros aspectos.',
      },
      'postpartum-nifas': {
        question: 'Como a AWA trata o nifas?',
        answer: 'Quando os marcadores espirituais estão ativados, a AWA pode acompanhar a duração do sangramento do pós-parto e mostrar a referência do nifas de acordo com a referência religiosa escolhida. A duração máxima pode variar conforme as escolas de pensamento e nunca é apresentada como uma verdade única e universal quando as opiniões divergem.',
      },
      'loss-bleeding': {
        question: 'Como acompanho o meu sangramento?',
        answer: 'A jornada Após um aborto espontâneo acompanha o sangramento e a sua evolução, num espaço adaptado a este período.',
      },
      'loss-cycle-return': {
        question: 'Como acompanho o retorno do meu ciclo?',
        answer: 'A AWA acompanha o retorno do seu ciclo após um aborto espontâneo, permitindo que você retome o seu histórico aos poucos, sem impor de imediato o acompanhamento habitual do período.',
      },
      'loss-symptoms': {
        question: 'Que sintomas posso registrar?',
      },
      'loss-notes': {
        question: 'Posso manter notas pessoais?',
        answer: 'Sim. Há notas pessoais disponíveis para acompanhar você durante este período.',
      },
      'loss-conceive-again': {
        answer: 'O apoio para retomar as tentativas de concepção já está integrado. A mudança de objetivo acontece de forma gradual e é sempre uma escolha sua.',
      },
      'spiritual-purity': {
        subtitle: 'Um marcador discreto relacionado com a retomada da prática religiosa.',
      },
      'spiritual-prayer-return': {
        question: 'Como a AWA indica quando a oração é retomada?',
        answer: 'Se a pureza voltar antes do fim do horário da oração em andamento, o app pode sinalizar que essa oração volta a ser devida. As orações perdidas durante o seu período nunca são contabilizadas como orações a compensar.',
      },
      'spiritual-nifas': {
        subtitle: 'Um marcador que pode variar conforme as escolas de pensamento.',
        answer: 'A AWA pode apresentar a referência religiosa escolhida para a duração máxima do nifas, indicando as diferenças entre escolas quando o conteúdo validado as abrange. O app nunca apresenta um único valor como verdade absoluta.',
      },
      'spiritual-istihada': {
        answer: 'A AWA pode oferecer conteúdo educativo geral sobre a istihada e o que significa para a prática religiosa. O app nunca emite uma fatwa personalizada, e o conteúdo religioso deve ser validado por uma autoridade reconhecida.',
      },
      'journal-what-can-track': {
        question: 'O que posso registrar no meu diário?',
        answer: 'O Registro diário abrange sintomas físicos, estado emocional, intimidade, sono, atividade física e notas pessoais.',
        answerDaughter: 'O Registro diário permite acompanhar sintomas físicos, humor, sono, atividade física, hidratação, fluxo menstrual e notas pessoais.',
      },
      'journal-intimacy': {
        question: 'A minha seção Intimidade pode ser protegida?',
        subtitle: 'Uma seção discreta e separada.',
        answer: 'Sim. A seção Intimidade pode ser ocultada e protegida com um PIN ou Face ID próprios e independentes.',
      },
      'journal-private-photos': {
        question: 'Posso manter fotos privadas?',
        answer: 'Sim. Estão disponíveis fotos privadas protegidas, por exemplo para acompanhar a evolução da acne, do crescimento de pelos ou de sintomas na pele.',
      },
      'security-private-data': {
        question: 'Como a AWA protege os meus dados?',
        subtitle: 'Privacidade, segurança e coleta mínima.',
        answer: 'A AWA se baseia na coleta mínima de dados, sem publicidade direcionada, sem revenda de dados pessoais e com armazenamento seguro, com criptografia real dos dados sensíveis.',
      },
      'security-export': {
        subtitle: 'Há suporte para exportação em PDF e CSV.',
        answer: 'Sim. Estão disponíveis uma exportação em PDF do seu acompanhamento e uma exportação em CSV dos seus dados, para que você possa construir um histórico claro, inclusive para um profissional de saúde.',
      },
      'security-delete': {
        question: 'Posso excluir os meus dados facilmente?',
        subtitle: 'A exclusão continua simples e acessível.',
        answer: 'Sim. A exclusão simplificada dos seus dados e da sua conta está disponível nas configurações correspondentes.',
      },
    },
    guides: {
      'getting-started': {
        text: 'Descubra a sua tela inicial, o calendário, o diário, o objetivo e os marcadores espirituais.',
      },
      cycle: {
        text: 'Registre o seu período e o fluxo, e consulte as estimativas do seu ciclo.',
      },
      contraception: {
        title: 'Contracepção',
        text: 'Gerencie o seu método, os lembretes, as doses esquecidas e o histórico de tomadas.',
      },
      menopause: {
        text: 'Acompanhe ondas de calor, sono, cansaço, humor e tratamentos hormonais.',
      },
      pregnancy: {
        text: 'Acompanhe a data provável do parto, as semanas, as consultas, os exames e os sintomas.',
      },
      postpartum: {
        text: 'Acompanhe os lóquios, o retorno do ciclo, a amamentação, o sono, o humor e a recuperação.',
      },
      loss: {
        text: 'Acompanhe o sangramento, os sintomas e o retorno do seu ciclo no seu ritmo.',
      },
      calendar: {
        title: 'Usar o calendário',
      },
      journal: {
        title: 'Preencher o seu registro diário',
        text: 'Registre sintomas, humor, sono, atividade, notas e intimidade.',
      },
      spiritual: {
        title: 'Usar os marcadores espirituais',
      },
      privacy: {
        text: 'Gerencie a segurança, o modo discreto, a exportação, a criptografia e a exclusão de dados.',
      },
    },
    helpSupport: {
      subtitle: 'Tem alguma dúvida? Estamos aqui por você.',
      supportText: 'Escolha o método de contato que for melhor para você ou consulte as respostas mais frequentes.',
      guidesSubtitle: 'Descubra os nossos guias para aproveitar ao máximo a AWA.',
      feedbackTitle: 'Enviar feedback',
      feedbackSubtitle: 'Compartilhe as suas ideias para nos ajudar a melhorar o app.',
      bugReportTitle: 'Relatar um problema',
      bugReportSubtitle: 'Relate um erro ou um comportamento inesperado.',
      bannerTitle: 'A sua experiência nos ajuda a melhorar a AWA',
      bannerText: 'Obrigada por dedicar o seu tempo para nos escrever.',
      toastCantOpenEmail: 'Não foi possível abrir o app de e-mail.',
      modal: {
        bugTitle: 'Relatar um problema',
        categoryLabelFeedback: 'Tipo de feedback',
      },
      email: {
        feedbackSubjectPrefix: 'Feedback AWA',
      },
    },
    faqScreen: {
      intro: 'Encontre as respostas essenciais para usar a AWA com tranquilidade.',
    },
    guidesScreen: {
      intro: 'Indicações simples para aproveitar ao máximo a AWA.',
    },
    whatsNewScreen: {
      heading: 'A AWA continua evoluindo',
    },
  },
  library: {
    categories: {
      conceptionTips: {
        label: 'Dicas para a concepção',
      },
      birthControlPills: {
        label: 'Pílula anticoncepcional',
      },
      patch: {
        label: 'Adesivo anticoncepcional',
      },
      sideEffects: {
        label: 'Efeitos colaterais',
      },
      hormones: {
        label: 'Hormônios',
      },
      babyDevelopment: {
        label: 'Desenvolvimento do bebê',
      },
      fertilityAfterLoss: {
        label: 'Retorno da fertilidade',
      },
      hotFlashes: {
        label: 'Ondas de calor',
      },
    },
    objectiveHeadlines: {
      contraception: 'Gerenciar a minha contracepção',
    },
    articles: {
      'cycle-phases-expliquees': {
        summary: 'Estrogênio, progesterona: o que acontece realmente em cada semana.',
      },
      'cycle-signe-vital': {
        summary: 'Por que às vezes se diz que o ciclo é o “quinto sinal vital”.',
      },
      'firstperiod-premiers-signes': {
        summary: 'Alterações no corpo, corrimento, humor: as pistas de que o primeiro período está chegando.',
      },
      'firstperiod-comment-savoir': {
        title: 'Como sei que o meu primeiro período está chegando?',
      },
      'firstperiod-choisir-protection': {
        summary: 'Absorventes, calcinhas absorventes, absorventes internos: compreender as opções de acordo com o seu conforto.',
      },
      'firstperiod-gerer-quotidien': {
        title: 'Como lidar com o primeiro período no dia a dia',
        summary: 'Escola, esporte, sono: alguns hábitos simples para se sentir confortável.',
      },
      'firstperiod-cycle-irregulier': {
        summary: 'Por que o ciclo demora para se estabilizar e quando consultar um médico.',
      },
      'flow-comprendre-flux': {
        summary: 'Fluxo leve, moderado ou intenso: o que significam estas variações.',
      },
      'fertility-fenetre-fertile': {
        summary: 'Por que os 6 dias em torno da ovulação são os mais importantes para engravidar.',
      },
      'pain-gerer-douleurs': {
        title: 'Lidar com a dor menstrual',
      },
      'hydration-bien-shydrater': {
        summary: 'Por que beber mais água reduz o inchaço pré-menstrual.',
      },
      'sleep-sommeil-et-cycle': {
        title: 'Sono e hormônios: a ligação esquecida',
        summary: 'Por que o seu sono muda conforme a fase do ciclo e na menopausa.',
      },
      'mood-humeur-et-hormones': {
        summary: 'Por que o seu humor varia ao longo do ciclo e da vida.',
      },
      'lhtests-comprendre-tests-ovulation': {
        summary: 'Como funcionam estas tiras de teste e quando usá-las.',
      },
      'conceptiontips-essayer-de-concevoir': {
        summary: 'Os pontos de referência essenciais para iniciar a sua jornada de concepção com tranquilidade.',
      },
      'conceptiontips-hygiene-de-vie': {
        title: 'Estilo de vida e jornada de concepção',
      },
      'birthcontrolpills-comprendre-la-pilule': {
        title: 'Compreender a pílula anticoncepcional',
        summary: 'Como funciona a pílula e os pontos essenciais a conhecer antes de escolhê-la.',
      },
      'patch-le-patch-contraceptif': {
        title: 'O adesivo anticoncepcional',
      },
      'ring-anneau-vaginal': {
        title: 'O anel vaginal anticoncepcional',
      },
      'hormonaltreatments-panorama': {
        title: 'Uma visão geral dos tratamentos anticoncepcionais hormonais',
      },
      'hormonaltreatments-choisir-sa-methode': {
        summary: 'As perguntas que você deve se fazer antes de escolher.',
      },
      'missedpills-que-faire-en-cas-doubli': {
        title: 'Esqueceu de tomar a pílula: o que fazer?',
      },
      'sideeffects-reconnaitre-les-effets-secondaires': {
        title: 'Reconhecer possíveis efeitos colaterais',
      },
      'pcos-comprendre-sopk': {
        summary: 'A síndrome dos ovários policísticos (SOP) explicada com clareza: o que é, quanto varia de mulher para mulher e onde saber mais.',
      },
      'pcos-cycle-ovulation-fertilite': {
        summary: 'Por que o ciclo fica irregular com a síndrome do ovário policístico (SOP) e o que isso significa para a fertilidade.',
      },
      'pcos-peau-pilosite-symptomes': {
        summary: 'Por que a SOP pode afetar a pele e o cabelo, e como cuidar de você.',
      },
      'pcos-acne-hormonale': {
        summary: 'Por que a acne hormonal pode surgir com a SOP, como reconhecê-la e que soluções podem ajudar a controlá-la.',
      },
      'hormones-menopause-equilibre': {
        title: 'Os hormônios durante a menopausa',
        summary: 'Estrogênio, progesterona, FSH, LH: como mudam e por que os sintomas variam.',
      },
      'exercise-bouger-pour-le-cycle': {
        title: 'Se movimentar para apoiar o ciclo',
        summary: 'Por que o movimento regular pode apoiar o ciclo, que tipo de atividade escolher e como adaptar seu ritmo sem pressão.',
      },
      'exercise-bouger-enceinte': {
        summary: 'Quais movimentos continuam seguros e benéficos.',
      },
      'exercise-renforcer-perinee': {
        title: 'Fortalecer o assoalho pélvico após o parto',
        summary: 'Por que a reabilitação do assoalho pélvico é importante.',
      },
      'babydevelopment-developpement-bebe': {
        title: 'O desenvolvimento do seu bebê no útero',
        summary: 'Como o seu bebê cresce, trimestre após trimestre.',
      },
      'medicalexams-suivi-medical': {
        title: 'O calendário do pré-natal',
        summary: 'Ultrassonografias e exames essenciais, trimestre a trimestre.',
      },
      'postpartum-retour-de-couches': {
        title: 'A volta da menstruação após o parto: o que esperar',
        summary: 'Quando a menstruação volta após o parto.',
      },
      'lochia-comprendre-lochies': {
        summary: 'Esses sangramentos após o parto e como normalmente evoluem.',
      },
      'nifas-aspects-medicaux': {
        summary: 'A que corresponde esse termo do ponto de vista fisiológico e como cuidar de você.',
      },
      'breastfeeding-debuter-allaitement': {
        summary: 'Início, ritmo e sinais para observar nos primeiros dias.',
      },
      'lossphysical-recuperation-physique': {
        summary: 'Sangramento, ciclo e volta à normalidade.',
      },
      'lossemotional-traverser-le-deuil': {
        title: 'Atravessar o luto emocionalmente',
      },
      'menopause-comprendre-la-transition': {
        summary: 'O que muda gradualmente, anos antes de a menstruação parar.',
      },
      'hotflashes-bouffees-de-chaleur': {
        title: 'Controlar as ondas de calor',
        summary: 'Por que acontecem e como aliviá-las.',
      },
      'bones-sante-osseuse': {
        summary: 'Por que a menopausa aumenta o risco de osteoporose.',
      },
      'treatments-traitements-menopause': {
        summary: 'Terapia hormonal e alternativas não hormonais, em resumo.',
      },
      'istihada-comprendre-les-saignements': {
        summary: 'Distinguir um sangramento irregular de uma menstruação habitual, com referências gerais para orientar você.',
      },
      'nifasfiqh-repere-fiqh': {
        summary: 'Compreender o nifas, sua duração, a oração, o jejum e a retomada dos atos de culto após o parto.',
      },
      'prayerduringmenstruation-la-priere-suspendue': {
        summary: 'Por que a oração ritual fica suspensa durante este período e como viver este tempo com tranquilidade.',
      },
      'returningtoprayer-le-ghusl-et-le-retour': {
        title: 'O ghusl e a volta à oração',
      },
    },
    screen: {
      categoryTiles: {
        fertility: {
          label: 'Fertilidade e\nconcepção',
        },
        contraception: {
          label: 'Contracepção',
        },
      },
      subtitle: 'Conteúdos confiáveis para\nentender melhor seu corpo,\nsua saúde e sua fé.',
      searchA11y: 'Buscar',
      searchPlaceholder: 'Buscar um artigo…',
      recommendedTitle: 'Recomendado para você',
      emptyReset: 'Redefinir',
    },
    reader: {
      levels: {
        intermediate: 'Intermediário',
      },
      missingArticle: 'Este artigo não está mais disponível.',
    },
    filters: {
      level: {
        intermediate: 'Intermediário',
      },
    },
    featured: {
      headerSubtitle: 'Artigos selecionados só para você',
      trustTitle: 'Conteúdos confiáveis e validados',
      articles: {
        painGererDouleurs: {
          title: 'Lidar com a dor menstrual',
          summary: 'Formas suaves e naturais de aliviar as cólicas e voltar a se sentir bem.',
        },
      },
    },
    readingControls: {
      minutesRemaining_one: 'falta {{count}} min',
      minutesRemaining_other: 'faltam {{count}} min',
      readingTitle: 'Leitura em andamento',
    },
  },
  export: {
    fields: {
      stress: 'Estresse',
      bedtime: 'Hora de dormir',
    },
    enums: {
      mood: {
        stressed: 'Estressada',
      },
      flow: {
        light: 'Leve',
      },
      severity: {
        mild: 'Leve',
      },
    },
    pdf: {
      totalDaysLabel: 'Número de dias registrados',
      daysCount_one: '{{count}} dia',
      daysCount_other: '{{count}} dias',
      unsupportedNotice: 'Nota: alguns caracteres (emoji, outras escritas…) não podem ser exibidos neste PDF e são substituídos por “[…]”. Ficam preservados como estão na exportação CSV.',
    },
    data: {
      cycle: {
        periodEstimatedEnd: 'Fim estimado com base na duração registrada (não confirmado)',
      },
      irregular: {
        spotting: 'Pequenos sangramentos (spotting)',
      },
      conceive: {
        ovulationNotice: 'Ovulação estimada (estimativa, não um fato confirmado): {{date}}.',
      },
      contraception: {
        categories: {
          intake: 'Registro das tomadas',
        },
        activeMethodNotice: 'Método contraceptivo ativo: {{method}}.',
      },
      loss: {
        categories: {
          bleeding: 'Sangramento',
        },
      },
      menopause: {
        categories: {
          labResults: 'Resultados de exames',
        },
      },
    },
    ui: {
      objectives: {
        contraception: 'Contracepção',
      },
      categories: {
        contraception: {
          intake: 'Registro das tomadas',
        },
        loss: {
          bleeding: 'Sangramento',
        },
        menopause: {
          labResults: 'Resultados de exames (FSH, estradiol)',
        },
      },
    },
  },
  backupData: {
    title: 'Backup',
    subtitleOwner: 'Seus dados, sempre seguros 💜',
    downloadTitleOwner: 'Baixar os meus dados',
    downloadTitleDaughter: 'Baixar os dados de {{firstName}}',
    deleteSubtitleOwner: 'Excluir definitivamente os seus dados de acompanhamento',
    deleteSubtitleDaughter: 'Excluir definitivamente os dados de acompanhamento de {{firstName}}',
    deleteTitleOwner: 'Excluir os meus dados',
    deleteTitleDaughter: 'Excluir os dados de {{firstName}}',
    infoText: 'Os seus dados são armazenados localmente pela AWA.\nA cópia local permanece neste dispositivo.',
  },
  backupUtility: {
    restore: {
      unreadableBackup: 'Esta cópia de segurança não pode ser lida neste celular, por isso foi deixada inalterada. Em vez disso, restaure a partir de um arquivo de cópia de segurança criptografado.',
      heroDescriptionAvailableOwner: 'Uma cópia dos seus dados está pronta para ser restaurada.',
      heroDescriptionAvailableDaughter: 'Uma cópia dos dados de {{firstName}} está pronta para ser restaurada.',
      heroDescriptionNone: 'Crie primeiro uma cópia na seção Cópia de segurança.',
      confirmTitle: 'Confirmar restauração',
      successMessage: 'Restauração concluída com sucesso ✨',
    },
    export: {
      subtitleOwner: 'Escolha as informações que deseja recuperar.',
      formatSectionSubtitle: 'O CSV e o PDF são gerados diretamente no seu celular.',
      selectedCount_one: '{{count}} categoria selecionada',
      selectedCount_other: '{{count}} categorias selecionadas',
      sensitiveWarning: 'As categorias sensíveis são descriptografadas durante a exportação e o arquivo criado não é criptografado: compartilhe-o apenas com pessoas de confiança. Será solicitado o seu código privado (ou a biometria).',
      exportingButton: 'Gerando…',
      privacyPriorityDescription: 'A AWA nunca compartilha as suas informações.',
      premium: {
        description: 'Gere e compartilhe, a qualquer momento, um relatório completo do seu acompanhamento.',
        benefit1Description: 'CSV ou PDF prontos para usar ou compartilhar.',
        benefit2Description: 'Acesse todo o seu histórico, sem limites.',
      },
    },
    delete: {
      subtitleOwner: 'Gerencie definitivamente os seus dados de acompanhamento locais.',
      subtitleDaughter: 'Gerencie definitivamente os dados de acompanhamento locais de {{firstName}}.',
      titleOwner: 'Excluir os meus dados',
      titleDaughter: 'Excluir os dados de {{firstName}}',
      descriptionOwner: 'Esta ação excluirá definitivamente os seus dados de acompanhamento locais.',
      descriptionDaughter: 'Esta ação excluirá definitivamente os dados de acompanhamento locais de {{firstName}}.',
      itemJournal: 'Registro diário',
      accountNoticeOwner: 'A sua conta AWA não será excluída.',
      accountNoticeDaughter: 'O perfil de {{firstName}} não será excluído — apenas os respectivos dados de acompanhamento, incluindo o primeiro período registrado e quaisquer previsões.',
      confirmWord: 'EXCLUIR',
      deleteButton: 'Excluir definitivamente',
      footnote: 'Esta ação não pode ser desfeita.',
      doneTitle: 'Dados excluídos',
      doneDescriptionOwner: 'Os seus dados de acompanhamento locais foram excluídos com sucesso.',
      doneDescriptionDaughter: 'Os dados de acompanhamento locais de {{firstName}} foram excluídos com sucesso.',
    },
  },
  location: {
    title: 'Onde você está?',
    next: 'Próximo',
    save: 'Salvar',
    resolvingLocation: 'Encontrando a sua localização…',
    map: {
      loading: 'Carregando o mapa…',
      checkConnection: 'Verifique a sua conexão e a configuração do MapTiler.',
    },
    gps: {
      permissionDeniedError: 'Permita o acesso à localização em Configurações para usar a sua localização.',
    },
    errors: {
      network: 'Sem conexão com a internet.',
    },
  },
  onboarding: {
    splash: {
      logoLabel: 'Logotipo da AWA',
      slogan: 'O aplicativo de ciclo\nque respeita o seu corpo,\nos seus dados e a sua fé.',
    },
    name: {
      title: 'Como devemos\nchamar você na AWA?',
      subtitle: 'Você pode usar o seu primeiro nome ou um apelido.\nVocê pode alterar a qualquer momento.',
      cardTitle: 'O seu primeiro nome ou apelido',
      cardSubtitle: 'Este é o nome que a AWA usará para se dirigir a você.',
      inputLabel: 'Primeiro nome ou apelido',
      inputPlaceholder: 'O seu primeiro nome ou apelido',
      privacyHint: 'Você pode usar um apelido',
      saving: 'Salvando…',
      next: 'Próximo',
      formSubtitle: 'Use o seu primeiro nome ou um apelido.',
      formPlaceholder: 'ex.: Amina',
      formFooter: 'Você pode alterar depois no seu perfil.',
    },
    spiritual: {
      subtitle: 'Calendário hegírico, orações, jejum, estado de pureza ritual…\nVocê pode alterar esta escolha a qualquer momento.',
      next: 'Próximo',
    },
    summary: {
      editTip: 'Toque em um cartão para editá-lo',
      cardA11yHint: 'Abre a tela correspondente para editar esta informação',
      reassuranceTitle: 'Você continua no controle',
      reassuranceText: 'Você pode alterar estas informações mais tarde nas configurações.',
      rows: {
        datingMethodConceptionDate: 'Data estimada da concepção',
        reminderDailyJournal: 'Registro diário',
        feedingMixed: 'Alimentação mista (peito + mamadeira)',
        feedingExclusiveBottle: 'Alimentação exclusiva com mamadeira',
        feedingUnknown: 'Ainda não tenho certeza',
        dailyJournalAt: 'Registro diário às {{time}}',
        contraceptionMethod: 'Método contraceptivo',
        pillScheduleContinuous: 'Uso contínuo',
        tryingDurationStartingNow: 'Começando agora',
        currentBleeding: 'Sangramento atual',
        bleedingVariable: 'Não tenho certeza / varia',
        cycleReturn: 'Retorno do ciclo',
        cycleReturnYes: 'Sim, o meu período voltou',
        cycleReturnUnknown: 'Ainda não tenho certeza',
        firstReturnedPeriod: 'Primeiro período após o retorno',
        tryingAgainReady: 'Sim, me sinto preparada',
        menopauseStageUnsure: 'Ainda não tenho certeza',
        symptomHotFlashes: 'Ondas de calor',
        symptomSleepDisturbances: 'Distúrbios do sono',
        symptomBrainFog: 'Névoa mental',
        hormonalTreatmentNotNow: 'Por enquanto, não',
        labTracking: 'Exames laboratoriais',
        labTrackingNone: 'Por enquanto, não',
        cyclePatternUnknown: 'Ainda não tenho certeza',
        unrecordedPeriods: 'Períodos não registrados',
        privacyStandard: 'Configurações padrão',
      },
    },
  },
  auth: {
    shared: {
      tabLogin: 'Entrar',
      hidePassword: 'Ocultar senha',
      showPassword: 'Mostrar senha',
      useAnonymousMode: 'Usar a AWA no modo anônimo',
      anonymousMode: 'Modo anônimo',
      legalTerms: 'Termos de Uso e a nossa Política de Privacidade.',
    },
    login: {
      passwordPlaceholder: 'Senha',
      forgotPassword: 'Esqueceu a senha?',
      submit: 'Entrar',
      legalPrefix: 'Ao continuar, você aceita os nossos',
    },
    registration: {
      subtitle: 'Junte-se à AWA e comece\na sua jornada com serenidade.',
      firstNamePlaceholder: 'Digite o seu primeiro nome',
      lastNameLabel: 'Sobrenome',
      lastNamePlaceholder: 'Digite o seu sobrenome',
      emailPlaceholder: 'Digite o seu endereço de e-mail',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Crie uma senha',
      confirmPasswordLabel: 'Confirmar senha',
      confirmPasswordPlaceholder: 'Confirme a sua senha',
      ruleMinLength: 'Pelo menos 8 caracteres',
      ruleSpecialChar: 'Um caractere especial',
      hint: 'Pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial',
      legalPrefix: 'Ao criar uma conta, você aceita os nossos',
    },
    forgotPassword: {
      title: 'Esqueceu a senha?',
      subtitle: 'Não se preocupe. Digite o seu endereço de e-mail\ne enviaremos um link de redefinição.',
      emailRequiredError: 'Digite o seu endereço de e-mail.',
      emailInvalidError: 'Digite um endereço de e-mail válido.',
      cardText: 'Enviaremos as instruções de que você precisa para redefinir a sua senha.',
      submit: 'Enviar link de redefinição',
      infoValidEmail: 'O endereço é válido. O envio do link de redefinição ficará disponível quando o serviço de autenticação estiver ativo.',
      helpText: 'Entre em contato com a nossa equipe de suporte, estamos aqui para ajudar.',
      helpAlertMessage: 'A nossa equipe de suporte entrará em contato com você o mais rápido possível.',
    },
  },
  anonymous: {
    mode: {
      headerTitle: 'Modo anônimo',
      illustrationA11y: 'Ilustração do modo anônimo',
      activeTitle: 'Modo anônimo ativado',
      activeSubtitle: 'Seu perfil permanece desvinculado da sua identidade enquanto este modo estiver ativo.',
      nothingKeptTitle: 'Nada é armazenado',
      nothingKeptSubtitle: 'Esta informação não está associada ao seu perfil anônimo.',
      notRetained: 'Não armazenado',
      appLockA11y: 'Bloqueio do aplicativo',
      appLockTitle: 'Bloqueio do aplicativo',
      disableTitle: 'Desativar o modo anônimo',
      disableText: 'Para sair do modo anônimo, você pode criar uma conta e associar um endereço de e-mail ou um identificador.',
      pitchTitle: 'Use a AWA no modo anônimo',
      pitchSubtitle: 'Aproveite seu espaço AWA sem associar sua identidade ao seu perfil.',
      identityPrivateTitle: 'Sua identidade permanece privada',
      identityPrivateSubtitle: 'Nenhuma informação que possa identificar você é necessária para usar este modo.',
      privacyRowProfile: 'Perfil desvinculado da sua identidade',
      infoText: 'Alguns recursos de conta, sincronização ou recuperação podem ser limitados no modo anônimo.',
      recommendedProtectionText: 'Você poderá proteger o acesso à AWA com seu código PIN ou biometria.',
      continueInAnonymousMode: 'Continuar no modo anônimo',
    },
    limitations: {
      headerSubtitle: 'Modo anônimo',
      subtitle: 'No modo anônimo, alguns recursos relacionados à conta ficarão limitados ou indisponíveis.',
      communicationsText: 'A AWA não poderá enviar e-mails relacionados à sua conta anônima.',
      acknowledgeLabel: 'Entendo como funciona o modo anônimo.',
      activate: 'Ativar o modo anônimo',
    },
    creating: {
      headerTitle: 'Criando seu espaço',
      loaderA11y: 'Criando seu espaço anônimo',
      step1: 'Preparando seu espaço',
      step2: 'Configurando a privacidade',
      step3: 'Finalizando',
      creatingTitle: 'Criando seu espaço anônimo',
      creatingSubtitle: 'A AWA está preparando seu espaço privado e desvinculando seu perfil das suas informações de identificação.',
      errorSubtitle: 'Ocorreu um erro. Você pode tentar novamente.',
      loaderCaption: 'Leva apenas um instante.',
      protectionTitle: 'Protegendo sua identidade',
      protectionSubtitle: 'A AWA está preparando seu espaço e aplicando suas preferências de privacidade.',
      warning: 'Não feche o aplicativo enquanto seu espaço está sendo preparado.',
    },
    success: {
      headerTitle: 'Modo anônimo',
      title: 'Modo anônimo ativado',
      subtitle: 'Seu perfil agora está desvinculado da sua identidade. Aproveite a AWA com total privacidade.',
      cardTitle: 'Seu espaço está pronto',
      cardSubtitle: 'Você pode desativar o modo anônimo a qualquer momento em Privacidade e segurança.',
    },
    avatar: {
      headerTitle: 'Personalizar meu avatar',
      eyebrow: 'SEU PERFIL ANÔNIMO',
      subtitle: 'Basta escolher um estilo e uma cor. Nenhuma foto pessoal é necessária.',
      styleSectionDescription: 'Você pode alterá-lo mais tarde no seu perfil.',
      infoTitle: 'Sua privacidade em primeiro lugar',
      infoText: 'Este avatar substitui sua foto enquanto o modo anônimo estiver ativo. Nenhuma foto real é usada no seu perfil.',
      saveAndContinue: 'Salvar e continuar',
      saveChanges: 'Salvar alterações',
    },
  },
  biometrics: {
    useFaceId: 'Usar o Face ID',
    useTouchId: 'Usar o Touch ID',
    useFingerprint: 'Usar a impressão digital',
    useGeneric: 'Usar a biometria',
  },
  appLock: {
    subtitle: 'Autentique-se para acessar seu espaço pessoal.',
    enterPinTitle: 'Digite seu PIN',
    biometricAreaText: 'Use a biometria segura do seu dispositivo para desbloquear a AWA.',
    verifying: 'Verificando…',
    usePin: 'Usar meu PIN',
    useBiometrics: 'Usar a biometria',
    biometricPromptSubtitle: 'Autentique-se para acessar seu espaço.',
  },
  pinSetup: {
    enterCurrentTitle: 'Digite seu PIN atual',
    confirmIdentitySubtitle: 'Digite seu PIN atual para desativar a proteção.',
  },
  pinConfirm: {
    saveFailed: 'Não foi possível salvar o PIN. Tente novamente.',
    subtitle: 'Digite-o novamente para confirmar.',
  },
  pinKeypad: {
    digitsEnteredHint: '{{count}} de {{total}} dígitos digitados',
    deleteLastDigit: 'Apagar o último dígito',
  },
  faceIdSetup: {
    manageTitle: 'Gerenciar {{label}}',
    subtitleUnavailable: 'Nenhum método biométrico utilizável foi detectado.',
    secureVerificationText: 'A AWA usa apenas a caixa de diálogo biométrica nativa do seu dispositivo. Nenhum dado biométrico é armazenado no aplicativo.',
    verifyingBiometrics: 'Verificando a biometria…',
    footerHint: 'Você pode desativar esta opção a qualquer momento nas configurações.',
  },
  privacySecurity: {
    introTitle: 'Você está no controle 🔒',
    introText: 'Gerencie a privacidade dos seus dados e escolha as proteções que combinam com você.',
    pinSubtitleOff: 'Proteja o acesso ao seu aplicativo',
    discreetModeSubtitle: 'Ocultar conteúdo sensível no aplicativo',
    discreetNotificationsSubtitle: 'Usar notificações discretas',
    hideNotificationPreviewSubtitle: 'Não mostrar conteúdo na tela de bloqueio',
    discreetAppearanceTitle: 'Aparência discreta',
    discreetAppearanceSubtitle: 'Nome e ícone do aplicativo na tela inicial',
    intimacySubtitle: 'Bloquear a seção Vida íntima',
    privateContentTitle: 'Proteção das Notas / Fotos privadas',
    privateContentSubtitle: 'Bloqueie suas notas e fotos pessoais',
    anonymousTitle: 'Modo anônimo',
    anonymousSubtitle: 'Use o aplicativo sem compartilhar sua identidade',
    dataManagementTitle: 'Gerenciamento de dados',
    dataManagementSubtitle: 'Consulte, exporte ou exclua seus dados',
    deleteAccountTitle: 'Excluir minha conta',
    deleteAccountSubtitle: 'Exclua definitivamente sua conta e seus dados',
    footerInfo: 'Suas configurações de privacidade permanecem sob seu controle.\nVocê pode alterá-las a qualquer momento.',
  },
  dataPrivacy: {
    management: {
      storageCount_one: '{{count}} espaço de armazenamento local está em uso neste dispositivo.',
      storageCount_other: '{{count}} espaços de armazenamento local estão em uso neste dispositivo.',
      exportDescription: 'Crie uma cópia JSON pelo menu de compartilhamento seguro.',
      deletionInfoButton: 'Informações sobre a exclusão',
      deletionInfoMessage: 'Para excluir tudo, use “Excluir minha conta” na tela anterior.',
    },
    deleteAccount: {
      warningText: 'Todos os dados da AWA salvos localmente neste dispositivo serão excluídos definitivamente.',
      confirmWord: 'EXCLUIR',
      confirmLabel: 'Digite EXCLUIR para confirmar',
      confirmError: 'Digite EXCLUIR para confirmar.',
      deleteButton: 'Excluir definitivamente',
      deleteButtonAccessibility: 'Excluir definitivamente minha conta',
    },
  },
  discreetLauncher: {
    title: 'Aparência discreta',
    subtitle: 'Escolha como a AWA aparece na sua tela inicial',
    infoCard: 'Isso altera apenas o nome e o ícone do aplicativo na sua tela inicial. Seus dados e a proteção deles (código PIN, biometria, criptografia) permanecem exatamente iguais, qualquer que seja a identidade escolhida.',
    androidOnly: 'Este recurso está disponível apenas no Android.',
    sectionChoose: 'Escolha uma aparência',
    loadError: 'Não foi possível ler a aparência atual no momento.',
    discreetDescription: 'Aparece como um aplicativo de agenda neutro, sem nenhuma referência à AWA',
    switching: 'Alterando…',
    unsupportedVendor: 'Este recurso é limitado pelo launcher do seu celular.',
    noteDelay: 'O novo ícone pode levar alguns segundos para aparecer, dependendo do launcher do seu Android.',
    switchDiscreetTitle: 'Ativar a aparência discreta?',
    switchDiscreetBody: 'O aplicativo aparecerá com o nome “Agenda” e um ícone neutro na sua tela inicial. Seus dados e configurações permanecerão inalterados.',
    switchAwaTitle: 'Restaurar a aparência da AWA?',
    switchAwaBody: 'O aplicativo voltará a aparecer com o nome e o ícone da AWA.',
    errorModalTitle: 'Não foi possível alterar a aparência',
    errorModalBody: 'Não foi possível alterar a aparência do aplicativo no momento. Sua identidade atual não foi alterada. Tente novamente mais tarde.',
    unsupportedVendorModalTitle: 'Alteração não compatível',
    unsupportedVendorModalBody: 'A alteração do ícone não é compatível com este celular. Este recurso é limitado pelo launcher do seu dispositivo. Sua identidade atual não foi alterada.',
  },
  privateAccess: {
    enterPinToContinue: 'Digite seu PIN para continuar',
    subtitle: 'Seu espaço, só para você',
    deleteKey: 'Apagar',
  },
  securitySetup: {
    heroSubtitle: 'Escolha as proteções que gostaria de ativar. Você pode alterar essas configurações a qualquer momento.',
    statusActiveCount_one: '{{count}} proteção ativada',
    statusActiveCount_other: '{{count}} proteções ativadas',
    sectionSubtitle: 'Ative apenas o que combina com você',
    biometricsDescription: 'Use a impressão digital ou o reconhecimento facial do seu dispositivo.',
    infoText: 'Essas configurações são salvas para proteger seu uso da AWA e podem ser alteradas depois.',
  },
  privacyScreen: {
    subtitle: 'Você mantém o controle absoluto sobre seus dados.\nNós os protegemos em cada etapa.',
    guarantees: {
      fullControlDescription: 'Você mantém o controle das suas informações e da forma como são usadas, a qualquer momento.',
      encryptedTitle: 'Criptografados e anonimizados',
    },
    commitmentFullControl: 'Você mantém o controle dos seus dados a qualquer momento.',
    commitmentIdentityEncrypted: 'Os dados de identidade, como seu nome, são criptografados e anonimizados.',
    freedomTitle: 'Você continua livre',
    freedomText: 'Você pode alterar suas preferências ou solicitar a exclusão dos seus dados a qualquer momento nas configurações.',
    next: 'Próximo',
  },
  premium: {
    sheet: {
      heroSubtitle: 'Uma experiência mais rica,\nfeita para você.',
      planEyebrowAvailable: 'SUA ASSINATURA',
      planTitleAvailable: 'Escolha o plano ideal para você',
      planTitleUnavailable: 'As assinaturas chegam em breve',
      planSubtitleAvailable: 'Altere sua escolha livremente antes de continuar.',
      planSubtitleUnavailable: 'Os planos abaixo são apresentados apenas como referência — ainda não é possível fazer nenhuma compra.',
      recommendedPlanFeature: 'Acesso Premium por 12 meses',
      securityTitleAvailable: 'Pagamento pela plataforma',
      securityTitleUnavailable: 'Sem pagamento por enquanto',
      securityTextAvailable: 'Suas compras e assinaturas serão gerenciadas pelo Google Play ou pela App Store.',
      securityTextUnavailable: 'Nenhum pagamento é solicitado enquanto as assinaturas ainda não estiverem disponíveis.',
      activeSubtitle: 'Obrigada por apoiar a AWA — aproveite todos os benefícios Premium.',
      unavailableTitle: 'Assinatura em breve',
      ctaInProgressHint: 'Compra em andamento',
      ctaAccessibilityLabel: 'Assinar a AWA Premium',
      ctaInProgressText: 'Comprando…',
      ctaText: 'Assinar agora',
      restoreInProgressText: 'Restaurando…',
      footerDisclaimer: 'Ainda não é possível fazer nenhuma compra e nenhum pagamento será solicitado.',
      benefits: {
        exportsDescription: 'Gere facilmente seus relatórios em PDF e CSV.',
        advancedStatisticsDescription: 'Analise sua evolução ao longo de 3, 6 e 12 meses.',
        guidesDescription: 'Acesse conteúdos educativos exclusivos.',
        customizationDescription: 'Aproveite temas e configurações adicionais.',
      },
      feedback: {
        unavailable: 'Nenhuma compra será ativada até que o sistema de pagamento seja conectado.',
        subscribeError: 'Ocorreu um erro. Tente novamente em instantes.',
      },
    },
    plans: {
      annualLabel: 'Assinatura anual',
      monthlyLabel: 'Assinatura mensal',
    },
    providerError: 'A AWA Premium ainda não está disponível neste dispositivo. Tente novamente mais tarde.',
  },
  personalInformation: {
    subtitle: 'Gerencie suas informações básicas 🌸',
    addPhoto: 'Adicionar uma foto',
    editPhoto: 'Editar foto',
    changePhoto: 'Alterar foto',
    changeMyPhoto: 'Alterar minha foto',
    firstNameLabel: 'Nome',
    lastNameLabel: 'Sobrenome',
    preferredNameQuestion: 'Como você gostaria de ser chamada pela AWA?',
    infoCardText: 'Você pode alterar estas informações a qualquer momento.\nAlgumas alterações podem afetar suas previsões.',
    invalidEmail: 'Digite um endereço de e-mail válido.',
    invalidPhone: 'Digite um número de telefone internacional válido.',
    editFirstNameTitle: 'Editar nome',
    editLastNameTitle: 'Editar sobrenome',
    preferredNameSheetTitle: 'Como a AWA deve chamar você?',
    photoSheetTitle: 'Foto de perfil',
    takePhoto: 'Tirar uma foto',
    deletePhoto: 'Excluir foto',
    searchCountryPlaceholder: 'Buscar um país',
  },
  generalHealth: {
    privacyText: 'São usadas para personalizar seu acompanhamento na AWA e podem ser alteradas a qualquer momento.',
    bloodTypeLabel: 'Tipo sanguíneo',
    chronicConditionsTitle: 'Doenças crônicas',
    chronicConditionsEmpty: 'Nenhuma doença crônica informada',
    treatmentsEmpty: 'Nenhum tratamento informado',
    allergiesEmpty: 'Nenhuma alergia informada',
    inProgress: 'Em andamento',
    infoCardText: 'Você pode alterar todas estas informações a qualquer momento.',
    errors: {
      invalidPositiveValue: 'Digite um valor positivo válido.',
      invalidHeight: 'Digite uma altura entre 80 e 250 cm.',
      invalidWeight: 'Digite um peso entre 20 e 400 kg.',
      treatmentNameRequired: 'Digite o nome do tratamento.',
    },
    editHeightTitle: 'Editar minha altura',
    editWeightTitle: 'Editar meu peso',
    bloodTypeSheetTitle: 'Tipo sanguíneo',
    bloodTypeSheetSubtitle: 'Selecione seu tipo sanguíneo, se souber.',
    treatmentsSheetSubtitle: 'Adicione os tratamentos que você está tomando atualmente.',
    notesSheetSubtitle: 'Adicione apenas as informações que quiser manter.',
    bmiClasses: {
      underweight: 'Abaixo do peso',
      overweight: 'Sobrepeso',
    },
  },
  appearanceThemeNames: {
    'sage-serenity': 'Serenidade de Sálvia',
  },
  prayerTimes: {
    settingsAccessibility: 'Configurações dos horários de oração',
    missedPrayersNote: 'As orações não feitas durante a menstruação não precisam ser compensadas.',
    aboutHijriParagraph1: 'As datas hegíricas são calculadas e podem variar em um dia, conforme o avistamento da lua e os anúncios oficiais locais.',
    calculating: 'Calculando…',
    schedule: {
      localTimes: 'Horários locais',
      footnote: 'Os horários são calculados a partir da sua localização. Lembre-se de verificá-los regularmente.',
    },
    purity: {
      menstruatingLabel: 'Menstruação em andamento',
      unknownLabel: 'Fim do período não registrado',
      declareButton: 'Registrar',
      dateAt: 'Em {{date}} às {{time}}',
      betweenTitle: 'Nenhuma oração estava em andamento no momento em que a pureza foi restabelecida.',
      loadingSchedule: 'Carregando os horários de oração…',
    },
  },
  hijriCalendar: {
    todayAccessibility: 'Voltar para hoje',
    ramadanText: 'Este é o mês do jejum. Encontre aqui os seus marcadores espirituais e o seu registro de jejuns.',
    nextMonthAccessibility: 'Próximo mês hegírico',
  },
  qadaa: {
    loading: 'Carregando seu registro…',
    daysToMakeUpLabel_one: 'dia por compensar',
    daysToMakeUpLabel_other: 'dias por compensar',
    reminderTextActive: 'Você ainda tem dias de jejum por compensar. Organize seu registro no seu ritmo.',
    completionSubtitle: 'Registre um dia concluído para atualizar seu registro.',
    saving: 'Salvando…',
    remainingDays_one: 'Falta {{count}} dia',
    remainingDays_other: 'Faltam {{count}} dias',
    heroAccessibilityLoading: 'Carregando seu registro de jejuns por compensar',
    heroAccessibilityCount_one: '{{count}} dia por compensar',
    heroAccessibilityCount_other: '{{count}} dias por compensar',
    undoCompletionTitle: 'Desfazer esta compensação?',
    undoCompletionMessage_one: '{{title}}: {{count}} dia compensado será devolvido ao seu saldo.',
    undoCompletionMessage_other: '{{title}}: {{count}} dias compensados serão devolvidos ao seu saldo.',
    undoButton: 'Desfazer a compensação',
    entryDeletedToastTitle: 'Registro excluído',
    undoneToastTitle: 'Compensação desfeita',
    helpParagraph1: 'Esta seção ajuda você a acompanhar os dias de jejum não feitos por causa da menstruação durante o Ramadão.',
    helpParagraph2: 'Os dias detectados automaticamente vêm do seu registro do período durante o Ramadão. Você também pode adicionar dias manualmente, mesmo antigos. Ao compensar um dia, marque-o como concluído para que a contagem de dias restantes continue correta.',
    ledger: {
      automaticDetected: 'Detectados automaticamente',
      surplusNote_one: '{{count}} dia compensado além do total atual. Permanece registrado: você pode removê-lo do histórico.',
      surplusNote_other: '{{count}} dias compensados além do total atual. Permanecem registrados: você pode removê-los do histórico.',
      automaticHint: 'Detectado a partir do seu registro do período (não editável aqui)',
      deleteAction: 'Excluir',
      deleteAccessibility: 'Excluir {{title}}',
      undoAction: 'Desfazer',
      undoAccessibility: 'Desfazer a compensação de {{title}}',
    },
    form: {
      description: 'Adicione os dias de jejum que você sabe que precisa compensar, mesmo que remontem a vários anos. Você pode editá-los ou excluí-los a qualquer momento.',
      step2Title: 'Você sabe de qual Ramadão são estes dias?',
      knowsYearSubtitle: 'Sei de qual Ramadão são estes dias.',
      noteCounterAccessibility: '{{length}} caracteres de {{max}}',
      saveFailedError: 'Não foi possível salvar agora. Tente novamente.',
    },
    deleteModal: {
      closeAccessibility: 'Fechar sem excluir',
      title: 'Excluir estes dias?',
      body_one: 'Você está prestes a excluir {{quantityLabel}} adicionado manualmente. Esta ação vai remover estes dias do seu saldo de jejuns por compensar.',
      body_other: 'Você está prestes a excluir {{quantityLabel}} adicionados manualmente. Esta ação vai remover estes dias do seu saldo de jejuns por compensar.',
      reassurance: 'Esta ação exclui apenas este registro adicionado manualmente. Os dias detectados automaticamente e os dias já compensados não são afetados.',
      cancelAccessibility: 'Cancelar a exclusão',
      confirmAccessibility: 'Confirmar a exclusão',
      deleting: 'Excluindo…',
      confirmText: 'Excluir',
    },
    dayCount_one: '{{count}} dia',
    dayCount_other: '{{count}} dias',
    addedManually_one: '{{count}} dia adicionado manualmente',
    addedManually_other: '{{count}} dias adicionados manualmente',
    completedSummary_one: '{{count}} dia compensado',
    completedSummary_other: '{{count}} dias compensados',
    migratedSuffix: 'registro anterior',
    saveChanges: 'Salvar alterações',
    addDaysCount_one: 'Adicionar {{count}} dia por compensar',
    addDaysCount_other: 'Adicionar {{count}} dias por compensar',
    errors: {
      quantityRequired: 'Digite o número de dias.',
      quantityInteger: 'Digite um número inteiro de dias (ex.: 2).',
      yearFormat: 'Digite um ano com 4 dígitos (ex.: 1445 ou 2018) ou escolha “Ano desconhecido”.',
    },
  },
  awaADeux: {
    intro: {
      benefit1: 'Compartilhe com seu parceiro as informações que quiser',
      benefit4: 'Você sempre mantém o controle das suas informações',
    },
    partnerName: {
      description: 'Isso nos permite personalizar\na sua experiência AWA Together.',
      fieldLabel: 'Primeiro nome do parceiro',
    },
    partnerView: {
      description: '{{partner}} só terá acesso às informações que você escolher compartilhar.',
    },
    benefits: {
      item5: 'Uma jornada mais serena a dois',
    },
    sharing: {
      title: 'Escolha o que\nquer compartilhar',
    },
    sections: {
      fertility: {
        title: 'Fertilidade e concepção',
      },
      pregnancy: {
        babyDevelopment: 'Fase da gravidez e desenvolvimento do bebê',
      },
    },
    supportContent: {
      recommendationsNote: 'Só adaptadas à fase se você compartilhar o dia do ciclo',
    },
    pairing: {
      description: 'Convide {{partner}} para se juntar a você na AWA Together.',
      invalidEmail: 'Digite um endereço de e-mail válido.',
      emailHelper: 'Enviaremos a {{partner}} um link de convite seguro por e-mail.',
    },
    pending: {
      description: 'Você poderá começar a compartilhar as informações selecionadas assim que {{partner}} entrar na AWA Together.',
      title: 'Convite enviado\npara {{partner}}',
      statusTitle: 'Aguardando aceitação',
      previewTitle: 'Pré-visualizar a jornada do parceiro',
    },
    connected: {
      title: 'Parceiro conectado 💜',
      since: 'Conectado desde hoje',
      sharedInfoTitle: 'Informações compartilhadas',
      emptyShared: 'Nenhuma informação está sendo compartilhada no momento.',
      manageAction: 'Gerenciar as informações compartilhadas',
      stopAction: 'Parar de compartilhar',
      accessibilityConnected: 'Parceiro conectado',
    },
    stopSharingModal: {
      title: 'Parar de compartilhar?',
      body: '{{Partner}} não poderá mais acessar as informações que você escolheu compartilhar.',
      confirm: 'Parar de compartilhar',
    },
    demo: {
      babyDevelopment: 'Os órgãos do bebê continuam se formando.',
      supportTips: 'Ofereça a ela um momento de tranquilidade e uma bebida quente.',
      greetingText: 'Aqui estão algumas percepções para apoiá-la melhor hoje.',
      babyDevelopmentTitle: 'Desenvolvimento do bebê',
      emptyShared: 'Nenhuma informação está sendo compartilhada no momento.',
    },
    partnerSide: {
      invitation: {
        descriptionWithName: '{{name}} está convidando você\npara entrar na AWA Together',
        descriptionNeutral: 'Você recebeu um convite\npara entrar na AWA Together',
        cardBody: 'Ela gostaria de compartilhar algumas informações com você para ajudá-lo\na entender melhor a jornada dela.',
        privacyText: 'Você só verá as informações que ela escolher compartilhar.',
      },
      accept: {
        subtitleWithName: '{{name}} gostaria de compartilhar\ncom você:',
        subtitleNeutral: 'Sua parceira gostaria de compartilhar\ncom você:',
        emptyShared: 'Nenhuma informação está sendo compartilhada no momento.',
        privacyText: 'Você só terá acesso às informações que ela escolher compartilhar.',
      },
      home: {
        subtitle: 'Você está aqui por ela 💜',
        openProfileAccessibility: 'Abrir meu perfil',
        emptyShared: 'Nenhuma informação está sendo compartilhada com você no momento.',
        adviceLabel: 'Minha dica',
        sharedInfoTitle: 'Informações compartilhadas',
        sharedInfoSubtitle: 'Aqui estão as informações que ela escolheu compartilhar.',
        upcomingTitle: 'Próximos eventos',
        upcomingSubtitle: 'Datas estimadas com base nas informações compartilhadas.',
        periodInProgress: 'Em andamento',
        periodNotInProgress: 'Não está em andamento',
        inDays_one: 'Daqui a {{count}} dia',
        inDays_other: 'Daqui a {{count}} dias',
        remainingDays_one: 'Falta {{count}} dia',
        remainingDays_other: 'Faltam {{count}} dias',
        phaseMessageMenstruation: 'O período dela está em andamento. Um pouco de apoio pode fazer a diferença.',
      },
      calendar: {
        nextMonth: 'Próximo mês',
        emptyLegend: 'No momento, nenhum marcador está sendo compartilhado com você.',
      },
      advice: {
        subtitle: 'Ideias simples para apoiá-la todos os dias',
        supportSectionTitle: 'Como apoiá-la hoje',
        infoText: 'Você só vê aquilo que ela escolheu compartilhar com você — é normal que\nalgumas informações permaneçam privadas.',
        generalSupportTip: 'Mantenha-se atento e ofereça sua ajuda, sem precisar conhecer os detalhes do ciclo dela.',
        phaseTipFertile: 'Ela está na janela fértil: não há nada de especial a fazer, a menos que vocês estejam tentando engravidar juntos.',
      },
      profile: {
        title: 'Meu perfil',
        noNameAccessibility: 'Nenhum primeiro nome informado',
        editFirstNameAccessibility: 'Editar meu primeiro nome',
        firstNameLabel: 'Primeiro nome',
        connectedToSubtitle: 'Você está conectado a {{owner}}.',
        accessRowTitle: 'Informações às quais você tem acesso',
        noSharedTitle: 'Nenhuma informação compartilhada no momento.',
        noSharedDescription: 'Sua parceira pode alterar suas opções de compartilhamento a qualquer momento.',
        defaultAccessDescription: 'Você pode ver esta informação.',
        canSeeTitle: 'O que você pode ver',
        canSeeDescription: 'Você só vê as informações que a sua parceira escolheu compartilhar com você na AWA Together.',
        stayPrivateDescription: 'As informações que ela não compartilha permanecem privadas e não ficam visíveis no seu espaço.',
        privacyBanner: 'A AWA Together foi projetada para compartilhar apenas aquilo que ela quer mostrar a você.',
        helpRowTitle: 'Ajuda e suporte',
        signOut: 'Sair',
        rowHintAccess: 'Sua parceira escolheu compartilhar esta informação com você.',
        rowHintPrivacy: 'Entenda o que é compartilhado e o que permanece privado.',
        accessExplanationCycleDay: 'Você pode ver o dia do ciclo dela e a fase atual.',
        accessExplanationNextPeriod: 'Você pode ver a data estimada do próximo período dela.',
        accessExplanationPeriodStatus: 'Você pode ver se o período dela está em andamento ou terminou.',
        accessExplanationFertileWindow: 'Você pode ver os dias férteis dela.',
        accessExplanationOvulation: 'Você pode ver a ovulação estimada dela.',
        accessExplanationFertilityStatus: 'Você pode ver o estado de fertilidade dela.',
        accessExplanationPregnancyWeek: 'Você pode ver a semana de gravidez dela.',
        accessExplanationDueDate: 'Você pode ver a data prevista do parto dela.',
        accessExplanationBabyDevelopment: 'Você pode ver informações sobre o desenvolvimento do bebê.',
        accessExplanationMood: 'Você pode ver o humor dela durante o dia.',
        accessExplanationDailyAdvice: 'Você recebe uma dica diária para apoiá-la.',
        editNameModal: {
          title: 'Editar meu primeiro nome',
          subtitle: 'Este nome será usado no seu espaço AWA Together.',
          label: 'Primeiro nome',
        },
        logoutModal: {
          title: 'Sair?',
          body: 'Tem certeza de que quer sair do seu espaço de parceiro?',
          reassurance: 'Você pode entrar novamente a qualquer momento.',
        },
        faq: {
          howItWorksDescription: 'Saiba como o aplicativo permite que você apoie sua parceira, respeitando a privacidade dela.',
          howItWorksParagraph1: 'A AWA Together permite que você veja apenas as informações que a sua parceira escolheu compartilhar com você.',
          howItWorksParagraph2: 'Por exemplo, você pode ver algumas informações sobre o ciclo dela, o próximo período ou a janela fértil, quando o compartilhamento está ativado para essas informações.',
          howItWorksParagraph3: 'As informações visíveis dependem sempre das opções dela. Ela pode alterar o que compartilha a qualquer momento.',
          hiddenInfoTitle: 'Por que algumas informações estão ocultas?',
          hiddenInfoDescription: 'O que é compartilhado com você depende das opções da sua parceira. Ela pode alterar estas opções a qualquer momento.',
          hiddenInfoParagraph1: 'Sua parceira mantém o controle sobre as informações que quer compartilhar com você.',
          hiddenInfoParagraph2: 'Se uma informação não aparece no seu espaço, pode simplesmente significar que ela não escolheu compartilhá-la.',
          hiddenInfoParagraph3: 'As opções dela podem mudar a qualquer momento. A AWA Together mostra a você apenas as informações a que tem acesso no momento.',
          understandingIntro: 'Veja o que as informações compartilhadas com você podem significar:',
          descriptionFertileWindow: 'Período estimado durante o qual a probabilidade de concepção pode ser mais alta.',
          descriptionPeriodStatus: 'Indica se o período dela está atualmente em andamento ou terminou.',
          troubleshootingDescription: 'O que fazer se as informações não aparecem, se a conexão parece interrompida ou se você tem outro problema.',
          troubleshootingParagraph1: 'Se algumas informações não aparecem, comece verificando se sua conexão com a internet está funcionando corretamente.',
          troubleshootingParagraph2: 'Algumas informações também podem estar faltando simplesmente porque sua parceira não as está compartilhando no momento.',
          troubleshootingParagraph3: 'Você também pode tentar fechar e abrir o aplicativo novamente.',
          troubleshootingParagraph4: 'Se o problema persistir, você poderá entrar em contato com o suporte da AWA.',
          contactSupportTitle: 'Falar com o suporte',
          contactSupportDescription: 'Precisa de mais ajuda? Conte com a nossa equipe.',
          contactSupportParagraph1: 'Se tiver uma pergunta, se encontrar um problema ou se quiser compartilhar sua opinião, você pode entrar em contato com a equipe da AWA a partir desta seção.',
          contactButton: 'Escreva para nós',
          contactAccessibility: 'Entre em contato por e-mail',
        },
      },
    },
  },
  journalOptions: {
    cycleSymptom: {
      tenderBreasts: 'Seios sensíveis',
    },
    cycleSymptomLocation: {
      lowerAbdomen: 'Parte inferior do abdômen',
      breasts: 'Seios',
    },
    cycleActivityType: {
      stretching: 'Alongamento',
      hiking: 'Trilha',
    },
    cycleActivityIntensity: {
      light: 'Leve',
      high: 'Alta',
    },
    cycleIntimacyLibido: {
      high: 'Alta',
      veryHigh: 'Muito alta',
    },
    cycleIntimacyDiscomfort: {
      vaginalDryness: 'Ressecamento vaginal',
      bleedingAfterIntercourse: 'Sangramento após a relação sexual',
    },
    irregularSymptom: {
      tenderBreasts: 'Seios sensíveis',
      sleepTrouble: 'Dificuldade para dormir',
    },
    irregularIntensity: {
      light: 'Leve',
    },
    irregularFatigueLevel: {
      light: 'Leve',
    },
    irregularPeriodPainLevel: {
      light: 'Leve',
    },
    irregularAcne: {
      light: 'Leve',
    },
    irregularHair: {
      light: 'Leve',
    },
    irregularPainType: {
      lowerAbdomen: 'Parte inferior do abdômen',
    },
    irregularPainArea: {
      lowerAbdomen: 'Parte inferior do abdômen',
      breasts: 'Seios',
    },
    miscarriageBleeding: {
      light: 'Leve',
    },
    miscarriageBleedingColor: {
      brown: 'Marrom',
    },
    miscarriagePhysicalSymptom: {
      dizziness: 'Tontura',
    },
    postpartumFatigue: {
      light: 'Leve',
    },
    postpartumPain: {
      light: 'Leve',
    },
    postpartumLochiaFlow: {
      veryLight: 'Muito leve',
      light: 'Leve',
    },
    postpartumLochiaColor: {
      brown: 'Marrom',
    },
    pregnancySymptom: {
      lightCramps: 'Cólicas leves',
      dizziness: 'Tontura',
      sleepTrouble: 'Dificuldade para dormir',
    },
  },
  daughterJournal: {
    sheetSubtitle: 'O que gostaria de registrar hoje?',
    sheetItems: {
      note: 'Observação diária e fotos privadas',
    },
    symptoms: {
      intensitySubtitle: 'Escolha o nível que melhor descreve o que ela está sentindo.',
      locationSubtitle: 'Onde ela sente principalmente estes sintomas?',
      errorMessage: 'Não foi possível salvar os sintomas no momento.',
    },
    mood: {
      question: 'Como ela está se sentindo hoje?',
      errorMessage: 'Não foi possível salvar o humor no momento.',
    },
    activity: {
      durationHint: 'Por quanto tempo ela se movimentou?',
      feelingTitle: 'Como ela se sente depois da atividade?',
      errorMessage: 'Não foi possível salvar a atividade no momento.',
    },
    sleep: {
      awakeningsSubtitle: 'Quantas vezes ela acordou?',
      wakeFeelingSubtitle: 'Como ela se sente ao acordar?',
      errorMessage: 'Não foi possível salvar o sono no momento.',
    },
    note: {
      photosHint: 'Acompanhe as mudanças na pele, no cabelo ou em um sintoma.',
      photosOnDevice: 'As fotos ficam apenas neste dispositivo.',
      protectedText: 'As notas e as fotos são salvas apenas neste dispositivo. Ninguém mais tem acesso a elas.',
      saveLabel: 'Salvar observação',
      errorMessage: 'Não foi possível salvar a observação no momento.',
    },
    flow: {
      errorMessage: 'Não foi possível salvar o fluxo no momento.',
    },
  },
} as const;
