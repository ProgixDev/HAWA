export type ObjectiveId =
  | 'cycle'
  | 'conceive'
  | 'contraception'
  | 'irregular'
  | 'menopause'
  | 'pregnancy'
  | 'postpartum'
  | 'loss';

export type FaqCategory =
  | 'Suivre mon cycle'
  | 'Essayer de concevoir'
  | 'Contraception'
  | 'Cycles irréguliers / SOPK'
  | 'Périménopause / Ménopause'
  | 'Suivi de grossesse'
  | 'Post-partum'
  | 'Après une fausse couche'
  | 'Repères spirituels'
  | 'Journal quotidien'
  | 'Données & confidentialité';

export type FaqId =
  | 'cycle-record-period'
  | 'cycle-edit-period'
  | 'cycle-predictions'
  | 'cycle-flow'
  | 'cycle-calendar'
  | 'conceive-fertile-window'
  | 'conceive-ovulation'
  | 'conceive-temperature'
  | 'conceive-cervical-mucus'
  | 'conceive-lh-test'
  | 'conceive-intercourse'
  | 'contraception-method'
  | 'contraception-pill-reminder'
  | 'contraception-forgotten-pill'
  | 'contraception-history'
  | 'contraception-predictions'
  | 'irregular-long-cycle'
  | 'irregular-symptoms'
  | 'irregular-acne-hair'
  | 'irregular-weight'
  | 'irregular-predictions'
  | 'menopause-symptoms'
  | 'menopause-hot-flashes'
  | 'menopause-sleep'
  | 'menopause-hormonal-treatment'
  | 'menopause-labs'
  | 'pregnancy-due-date'
  | 'pregnancy-weekly'
  | 'pregnancy-appointments'
  | 'pregnancy-reminders'
  | 'pregnancy-journal'
  | 'postpartum-lochia'
  | 'postpartum-cycle-return'
  | 'postpartum-breastfeeding'
  | 'postpartum-recovery'
  | 'postpartum-nifas'
  | 'loss-bleeding'
  | 'loss-cycle-return'
  | 'loss-symptoms'
  | 'loss-notes'
  | 'loss-conceive-again'
  | 'spiritual-hijri'
  | 'spiritual-purity'
  | 'spiritual-prayer-return'
  | 'spiritual-qadaa'
  | 'spiritual-nifas'
  | 'spiritual-istihada'
  | 'journal-what-can-track'
  | 'journal-intimacy'
  | 'journal-private-photos'
  | 'security-private-data'
  | 'security-export'
  | 'security-delete';

export type FaqItem = {
  id: FaqId;
  icon: string;
  question: string;
  subtitle: string;
  answer: string;
  category: FaqCategory;
  objective?: ObjectiveId;
  featured?: boolean;
};

export const FAQ_ITEMS: FaqItem[] = [
  // ============================================================
  // 1. SUIVRE MON CYCLE
  // ============================================================
  {
    id: 'cycle-record-period',
    icon: 'water-outline',
    category: 'Suivre mon cycle',
    objective: 'cycle',
    question: 'Comment enregistrer mes règles ?',
    subtitle: 'Ajoute les dates et la durée de tes menstruations.',
    answer:
      'Dans le calendrier ou le Journal quotidien, enregistre le début de tes règles, leur durée et l’intensité du flux. Ces informations alimentent ton historique personnel et servent aux estimations affichées dans HAWA.',
    featured: true,
  },
  {
    id: 'cycle-edit-period',
    icon: 'calendar-edit',
    category: 'Suivre mon cycle',
    objective: 'cycle',
    question: 'Puis-je modifier une date de règles ?',
    subtitle: 'Corrige une date si ton suivi a changé.',
    answer:
      'Oui. Modifie la date concernée dans ton suivi afin que ton historique reste fidèle à ton cycle réel. Les estimations peuvent ensuite évoluer en fonction des nouvelles informations enregistrées.',
  },
  {
    id: 'cycle-predictions',
    icon: 'chart-bell-curve',
    category: 'Suivre mon cycle',
    objective: 'cycle',
    question: 'Comment sont calculées mes prochaines règles ?',
    subtitle: 'Des estimations basées sur ton historique personnel.',
    answer:
      'HAWA estime les prochaines règles, la fenêtre fertile et l’ovulation à partir de ton historique personnel, de la durée de tes cycles et des informations que tu enregistres. Les estimations ne reposent pas uniquement sur un cycle standard de 28 jours.',
  },
  {
    id: 'cycle-flow',
    icon: 'water',
    category: 'Suivre mon cycle',
    objective: 'cycle',
    question: 'Comment suivre l’intensité de mon flux ?',
    subtitle: 'Enregistre l’évolution de tes saignements.',
    answer:
      'Utilise le Journal quotidien pour indiquer l’intensité de ton flux menstruel. Cela te permet de conserver un historique de son évolution au fil de tes cycles.',
  },
  {
    id: 'cycle-calendar',
    icon: 'calendar-month-outline',
    category: 'Suivre mon cycle',
    objective: 'cycle',
    question: 'Que signifient les repères du calendrier ?',
    subtitle: 'Règles, fertilité, ovulation et calendrier hijri.',
    answer:
      'Le calendrier affiche tes jours de règles enregistrés ainsi que les estimations de fenêtre fertile et d’ovulation. Si les repères spirituels sont activés, la date hijri peut également être affichée en parallèle de la date grégorienne.',
  },

  // ============================================================
  // 2. ESSAYER DE CONCEVOIR
  // ============================================================
  {
    id: 'conceive-fertile-window',
    icon: 'leaf',
    category: 'Essayer de concevoir',
    objective: 'conceive',
    question: 'Comment connaître ma fenêtre fertile ?',
    subtitle: 'Repère les jours estimés comme les plus fertiles.',
    answer:
      'En mode Essai de conception, HAWA affiche une fenêtre fertile estimée à partir des informations de ton cycle et de ton historique personnel.',
    featured: true,
  },
  {
    id: 'conceive-ovulation',
    icon: 'egg-outline',
    category: 'Essayer de concevoir',
    objective: 'conceive',
    question: 'Comment est estimée mon ovulation ?',
    subtitle: 'Une estimation qui évolue avec ton suivi.',
    answer:
      'L’ovulation est estimée à partir des informations disponibles dans ton historique de cycle. Cette estimation peut évoluer lorsque tu ajoutes de nouvelles données.',
  },
  {
    id: 'conceive-temperature',
    icon: 'thermometer',
    category: 'Essayer de concevoir',
    objective: 'conceive',
    question: 'Puis-je suivre ma température basale ?',
    subtitle: 'Ajoute ta température dans ton suivi de fertilité.',
    answer:
      'Oui. Le cahier des charges prévoit le suivi de la température basale dans le mode dédié à la conception.',
  },
  {
    id: 'conceive-cervical-mucus',
    icon: 'water-opacity',
    category: 'Essayer de concevoir',
    objective: 'conceive',
    question: 'Puis-je suivre ma glaire cervicale ?',
    subtitle: 'Ajoute cette observation à ton suivi de fertilité.',
    answer:
      'Oui. Le suivi de la glaire cervicale fait partie des informations prévues pour le mode Essai de conception.',
  },
  {
    id: 'conceive-lh-test',
    icon: 'test-tube',
    category: 'Essayer de concevoir',
    objective: 'conceive',
    question: 'Puis-je enregistrer un test d’ovulation LH ?',
    subtitle: 'Conserve tes résultats dans ton suivi.',
    answer:
      'Oui. Le cahier des charges prévoit l’enregistrement des tests d’ovulation LH dans le parcours de conception.',
  },
  {
    id: 'conceive-intercourse',
    icon: 'heart-outline',
    category: 'Essayer de concevoir',
    objective: 'conceive',
    question: 'Comment enregistrer mes rapports ?',
    subtitle: 'Une information privée dans ton journal.',
    answer:
      'La rubrique Vie intime permet d’enregistrer les rapports et d’autres informations associées. Cette partie doit rester discrète et peut être protégée séparément.',
  },

  // ============================================================
  // 3. CONTRACEPTION
  // ============================================================
  {
    id: 'contraception-method',
    icon: 'shield-check-outline',
    category: 'Contraception',
    objective: 'contraception',
    question: 'Quelles contraceptions puis-je suivre ?',
    subtitle: 'Pilule, anneau, patch et traitements hormonaux.',
    answer:
      'Le cahier des charges prévoit la gestion de la pilule contraceptive, de l’anneau vaginal, du patch contraceptif et d’autres traitements hormonaux.',
    featured: true,
  },
  {
    id: 'contraception-pill-reminder',
    icon: 'bell-outline',
    category: 'Contraception',
    objective: 'contraception',
    question: 'Puis-je créer un rappel pour ma pilule ?',
    subtitle: 'Configure des rappels personnalisables.',
    answer:
      'Oui. HAWA prévoit des rappels personnalisables pour la prise de pilule ainsi que des notifications quotidiennes.',
  },
  {
    id: 'contraception-forgotten-pill',
    icon: 'pill-off',
    category: 'Contraception',
    objective: 'contraception',
    question: 'Puis-je enregistrer une pilule oubliée ?',
    subtitle: 'Garde une trace des oublis.',
    answer:
      'Oui. Le suivi des oublis fait partie des fonctionnalités prévues pour le parcours contraception.',
  },
  {
    id: 'contraception-history',
    icon: 'history',
    category: 'Contraception',
    objective: 'contraception',
    question: 'Où retrouver l’historique de mes prises ?',
    subtitle: 'Consulte les prises et oublis enregistrés.',
    answer:
      'Le cahier des charges prévoit un historique des prises afin de conserver une trace de ton suivi contraceptif.',
  },
  {
    id: 'contraception-predictions',
    icon: 'calendar-question',
    category: 'Contraception',
    objective: 'contraception',
    question: 'Les prédictions restent-elles utiles sous contraception ?',
    subtitle: 'Certaines méthodes peuvent modifier le cycle naturel.',
    answer:
      'HAWA peut continuer à afficher les informations de suivi disponibles, mais l’interprétation des prédictions dépend de ta situation et de la méthode utilisée. L’application ne remplace pas un avis médical.',
  },

  // ============================================================
  // 4. CYCLES IRRÉGULIERS / SOPK
  // ============================================================
  {
    id: 'irregular-long-cycle',
    icon: 'chart-timeline-variant',
    category: 'Cycles irréguliers / SOPK',
    objective: 'irregular',
    question: 'Un cycle long est-il considéré comme un retard ?',
    subtitle: 'HAWA tient compte des cycles irréguliers.',
    answer:
      'Non. Dans le mode SOPK et cycles irréguliers, HAWA ne doit pas considérer automatiquement un cycle long comme un retard.',
    featured: true,
  },
  {
    id: 'irregular-symptoms',
    icon: 'heart-pulse',
    category: 'Cycles irréguliers / SOPK',
    objective: 'irregular',
    question: 'Quels symptômes puis-je suivre avec un SOPK ?',
    subtitle: 'Observe les symptômes qui évoluent avec le temps.',
    answer:
      'Le cahier des charges prévoit notamment le suivi des cycles irréguliers, de l’acné, de la pilosité, des variations de poids et des symptômes associés.',
  },
  {
    id: 'irregular-acne-hair',
    icon: 'face-woman-outline',
    category: 'Cycles irréguliers / SOPK',
    objective: 'irregular',
    question: 'Puis-je suivre l’acné et la pilosité ?',
    subtitle: 'Ajoute des observations dans ton suivi SOPK.',
    answer:
      'Oui. L’acné et la pilosité font partie des éléments explicitement prévus dans le suivi adapté au SOPK.',
  },
  {
    id: 'irregular-weight',
    icon: 'scale-bathroom',
    category: 'Cycles irréguliers / SOPK',
    objective: 'irregular',
    question: 'Puis-je suivre mes variations de poids ?',
    subtitle: 'Observe l’évolution de ton poids dans le temps.',
    answer:
      'Oui. Le suivi des variations de poids est prévu dans le mode SOPK.',
  },
  {
    id: 'irregular-predictions',
    icon: 'chart-line-variant',
    category: 'Cycles irréguliers / SOPK',
    objective: 'irregular',
    question: 'Pourquoi mes prédictions varient-elles davantage ?',
    subtitle: 'Les cycles irréguliers rendent les estimations moins stables.',
    answer:
      'Lorsque les cycles sont irréguliers, les estimations peuvent naturellement changer davantage. HAWA doit utiliser ton historique personnel sans interpréter automatiquement un cycle long comme un retard.',
  },

  // ============================================================
  // 5. PÉRIMÉNOPAUSE / MÉNOPAUSE
  // ============================================================
  {
    id: 'menopause-symptoms',
    icon: 'flower-outline',
    category: 'Périménopause / Ménopause',
    objective: 'menopause',
    question: 'Quels symptômes puis-je suivre ?',
    subtitle: 'Un suivi adapté aux changements de cette période.',
    answer:
      'Le cahier des charges prévoit notamment les bouffées de chaleur, sueurs nocturnes, troubles du sommeil, fatigue, variations d’humeur et brouillard mental.',
    featured: true,
  },
  {
    id: 'menopause-hot-flashes',
    icon: 'weather-sunny-alert',
    category: 'Périménopause / Ménopause',
    objective: 'menopause',
    question: 'Puis-je enregistrer mes bouffées de chaleur ?',
    subtitle: 'Observe leur fréquence dans ton historique.',
    answer:
      'Oui. Les bouffées de chaleur font partie des symptômes prévus dans le mode périménopause / ménopause.',
  },
  {
    id: 'menopause-sleep',
    icon: 'weather-night',
    category: 'Périménopause / Ménopause',
    objective: 'menopause',
    question: 'Puis-je suivre mon sommeil et ma fatigue ?',
    subtitle: 'Observe les troubles du sommeil et la fatigue.',
    answer:
      'Oui. Les troubles du sommeil, les sueurs nocturnes et la fatigue sont prévus dans ce parcours.',
  },
  {
    id: 'menopause-hormonal-treatment',
    icon: 'pill',
    category: 'Périménopause / Ménopause',
    objective: 'menopause',
    question: 'Puis-je suivre un traitement hormonal ?',
    subtitle: 'Conserve les informations utiles à ton suivi.',
    answer:
      'Oui. Le cahier des charges prévoit la possibilité de suivre les traitements hormonaux.',
  },
  {
    id: 'menopause-labs',
    icon: 'test-tube',
    category: 'Périménopause / Ménopause',
    objective: 'menopause',
    question: 'Puis-je enregistrer mes résultats FSH et estradiol ?',
    subtitle: 'Ajoute certains résultats biologiques à ton suivi.',
    answer:
      'Oui. Les résultats biologiques tels que la FSH et l’estradiol sont mentionnés dans le cahier des charges pour ce mode.',
  },

  // ============================================================
  // 6. GROSSESSE
  // ============================================================
  {
    id: 'pregnancy-due-date',
    icon: 'calendar-clock',
    category: 'Suivi de grossesse',
    objective: 'pregnancy',
    question: 'Comment est calculé mon terme estimé ?',
    subtitle: 'Une estimation affichée dans ton suivi de grossesse.',
    answer:
      'Le parcours grossesse prévoit le calcul du terme estimé à partir des informations disponibles dans ton suivi.',
    featured: true,
  },
  {
    id: 'pregnancy-weekly',
    icon: 'calendar-week',
    category: 'Suivi de grossesse',
    objective: 'pregnancy',
    question: 'Puis-je suivre ma grossesse semaine par semaine ?',
    subtitle: 'Observe l’évolution de la grossesse au fil des semaines.',
    answer:
      'Oui. Le cahier des charges prévoit un suivi semaine par semaine et une présentation de l’évolution de la grossesse.',
  },
  {
    id: 'pregnancy-appointments',
    icon: 'calendar-account-outline',
    category: 'Suivi de grossesse',
    objective: 'pregnancy',
    question: 'Puis-je enregistrer mes rendez-vous médicaux ?',
    subtitle: 'Centralise les rendez-vous importants.',
    answer:
      'Oui. Les rendez-vous médicaux et examens importants font partie du suivi prévu pour la grossesse.',
  },
  {
    id: 'pregnancy-reminders',
    icon: 'bell-ring-outline',
    category: 'Suivi de grossesse',
    objective: 'pregnancy',
    question: 'Puis-je recevoir des rappels pour mes examens ?',
    subtitle: 'Configure des rappels personnalisés.',
    answer:
      'Oui. Le cahier des charges prévoit des rappels personnalisés liés aux rendez-vous et examens importants.',
  },
  {
    id: 'pregnancy-journal',
    icon: 'notebook-heart-outline',
    category: 'Suivi de grossesse',
    objective: 'pregnancy',
    question: 'Que puis-je suivre pendant ma grossesse ?',
    subtitle: 'Symptômes, poids, humeur, sommeil et informations personnelles.',
    answer:
      'Le suivi de grossesse peut inclure les symptômes ressentis, le poids, l’humeur, le sommeil et des informations médicales personnelles.',
  },

  // ============================================================
  // 7. POST-PARTUM
  // ============================================================
  {
    id: 'postpartum-lochia',
    icon: 'water-outline',
    category: 'Post-partum',
    objective: 'postpartum',
    question: 'Comment suivre mes lochies ?',
    subtitle: 'Observe la durée et l’évolution des pertes.',
    answer:
      'Le parcours post-partum prévoit le suivi de la durée des lochies, de l’évolution du flux et des symptômes associés.',
    featured: true,
  },
  {
    id: 'postpartum-cycle-return',
    icon: 'calendar-refresh-outline',
    category: 'Post-partum',
    objective: 'postpartum',
    question: 'Comment suivre le retour de mes règles ?',
    subtitle: 'Observe progressivement la reprise du cycle.',
    answer:
      'HAWA prévoit le suivi du retour du cycle, de la reprise des règles et de l’évolution hormonale après l’accouchement.',
  },
  {
    id: 'postpartum-breastfeeding',
    icon: 'baby-bottle-outline',
    category: 'Post-partum',
    objective: 'postpartum',
    question: 'Puis-je suivre l’allaitement et l’aménorrhée ?',
    subtitle: 'Conserve ces informations dans ton parcours post-partum.',
    answer:
      'Oui. L’allaitement et l’aménorrhée post-partum font partie des informations prévues dans le cahier des charges.',
  },
  {
    id: 'postpartum-recovery',
    icon: 'heart-pulse',
    category: 'Post-partum',
    objective: 'postpartum',
    question: 'Quels éléments puis-je suivre pendant ma récupération ?',
    subtitle: 'Fatigue, sommeil, humeur, douleurs et récupération physique.',
    answer:
      'Le suivi quotidien post-partum comprend notamment la fatigue, le sommeil, l’humeur, les douleurs et la récupération physique.',
  },
  {
    id: 'postpartum-nifas',
    icon: 'mosque',
    category: 'Post-partum',
    objective: 'postpartum',
    question: 'Comment HAWA gère-t-elle le nifas ?',
    subtitle: 'Un repère religieux distinct du suivi médical.',
    answer:
      'Lorsque les repères spirituels sont activés, HAWA peut suivre la durée des saignements post-partum et présenter le repère de fin du nifas selon la référence juridique retenue. Le cahier des charges précise que la durée maximale peut varier selon les écoles et ne doit pas être présentée comme une vérité unique lorsque les avis divergent.',
  },

  // ============================================================
  // 8. APRÈS UNE FAUSSE COUCHE
  // ============================================================
  {
    id: 'loss-bleeding',
    icon: 'water-outline',
    category: 'Après une fausse couche',
    objective: 'loss',
    question: 'Comment suivre mes saignements ?',
    subtitle: 'Observe leur évolution sans reprendre immédiatement un suivi classique.',
    answer:
      'Le parcours Après une fausse couche prévoit le suivi des saignements et de leur évolution dans un espace adapté à cette période.',
    featured: true,
  },
  {
    id: 'loss-cycle-return',
    icon: 'calendar-refresh-outline',
    category: 'Après une fausse couche',
    objective: 'loss',
    question: 'Comment suivre le retour de mon cycle ?',
    subtitle: 'Reprends ton suivi progressivement.',
    answer:
      'HAWA prévoit le suivi du retour du cycle après une fausse couche afin de reprendre progressivement l’historique sans imposer immédiatement un suivi menstruel classique.',
  },
  {
    id: 'loss-symptoms',
    icon: 'heart-pulse',
    category: 'Après une fausse couche',
    objective: 'loss',
    question: 'Quels symptômes puis-je enregistrer ?',
    subtitle: 'Suis les symptômes physiques que tu souhaites noter.',
    answer:
      'Le cahier des charges prévoit le suivi des symptômes physiques dans ce parcours.',
  },
  {
    id: 'loss-notes',
    icon: 'notebook-edit-outline',
    category: 'Après une fausse couche',
    objective: 'loss',
    question: 'Puis-je conserver des notes personnelles ?',
    subtitle: 'Un espace personnel dans ton journal.',
    answer:
      'Oui. Les notes personnelles sont prévues pour accompagner le suivi de cette période.',
  },
  {
    id: 'loss-conceive-again',
    icon: 'heart-plus-outline',
    category: 'Après une fausse couche',
    objective: 'loss',
    question: 'Puis-je reprendre ensuite un parcours conception ?',
    subtitle: 'Change ton objectif lorsque tu souhaites reprendre les essais.',
    answer:
      'Le cahier des charges prévoit un accompagnement de la reprise des essais de conception. Le changement d’objectif doit rester progressif et choisi par l’utilisatrice.',
  },

  // ============================================================
  // REPÈRES SPIRITUELS
  // ============================================================
  {
    id: 'spiritual-hijri',
    icon: 'moon-waning-crescent',
    category: 'Repères spirituels',
    question: 'Comment fonctionne le calendrier hijri ?',
    subtitle: 'Affiche la date hijri avec la date grégorienne.',
    answer:
      'Lorsque les repères spirituels sont activés, HAWA peut afficher la date hijri en parallèle de la date grégorienne et signaler des mois importants comme Ramadan ou Dhoul Hijja.',
    featured: true,
  },
  {
    id: 'spiritual-purity',
    icon: 'water-check-outline',
    category: 'Repères spirituels',
    question: 'Que signifie le statut de pureté ?',
    subtitle: 'Un repère discret lié à la reprise des pratiques religieuses.',
    answer:
      'HAWA peut afficher un indicateur discret distinguant la période de règles de la période de pureté lorsque les repères spirituels sont activés.',
  },
  {
    id: 'spiritual-prayer-return',
    icon: 'mosque',
    category: 'Repères spirituels',
    question: 'Comment HAWA indique-t-elle la reprise de la prière ?',
    subtitle: 'Un repère basé sur l’heure de fin des règles.',
    answer:
      'Le cahier des charges prévoit que si le retour de pureté survient avant la fin du créneau de la prière en cours, l’application peut signaler que cette prière redevient due. Les prières manquées pendant les règles ne sont pas comptées comme prières à rattraper.',
  },
  {
    id: 'spiritual-qadaa',
    icon: 'food-apple-outline',
    category: 'Repères spirituels',
    question: 'Comment fonctionne le suivi des jours de jeûne à rattraper ?',
    subtitle: 'Compte les jours manqués pendant les règles.',
    answer:
      'HAWA peut proposer un compteur de jours de jeûne manqués à cause des règles, notamment pendant Ramadan, ainsi qu’un rappel doux après le mois pour organiser le rattrapage.',
  },
  {
    id: 'spiritual-nifas',
    icon: 'baby-face-outline',
    category: 'Repères spirituels',
    question: 'Comment le nifas est-il présenté ?',
    subtitle: 'Un repère qui peut varier selon les écoles juridiques.',
    answer:
      'HAWA peut présenter la référence juridique retenue pour la durée maximale du nifas, en signalant les divergences entre écoles lorsque le contenu validé le prévoit. L’application ne doit pas imposer un chiffre unique comme vérité absolue.',
  },
  {
    id: 'spiritual-istihada',
    icon: 'book-open-page-variant-outline',
    category: 'Repères spirituels',
    question: 'HAWA donne-t-elle des conseils sur l’istihâda ?',
    subtitle: 'Du contenu éducatif, pas une fatwa personnalisée.',
    answer:
      'HAWA peut proposer du contenu éducatif général sur l’istihâda et ses implications. Le cahier des charges précise que l’application ne doit jamais délivrer de fatwa personnalisée et que les contenus religieux doivent être validés par une autorité reconnue.',
  },

  // ============================================================
  // JOURNAL QUOTIDIEN
  // ============================================================
  {
    id: 'journal-what-can-track',
    icon: 'notebook-edit-outline',
    category: 'Journal quotidien',
    question: 'Que puis-je enregistrer dans mon journal ?',
    subtitle: 'Symptômes, humeur, vie intime, sommeil et activité.',
    answer:
      'Le Journal quotidien prévoit le suivi des symptômes physiques, de l’état émotionnel, de la vie intime, du sommeil, de l’activité physique ainsi que des notes personnelles.',
  },
  {
    id: 'journal-intimacy',
    icon: 'heart-outline',
    category: 'Journal quotidien',
    question: 'Ma rubrique Vie intime peut-elle être protégée ?',
    subtitle: 'Une section discrète et séparée.',
    answer:
      'Oui. Le cahier des charges prévoit que la rubrique Vie intime puisse être masquée et protégée par un code ou Face ID séparé.',
  },
  {
    id: 'journal-private-photos',
    icon: 'camera-lock-outline',
    category: 'Journal quotidien',
    question: 'Puis-je conserver des photos privées ?',
    subtitle: 'Pour suivre certains changements visuels.',
    answer:
      'Oui. Le cahier des charges prévoit des photos privées sécurisées, par exemple pour suivre l’évolution de l’acné, de la pilosité ou de symptômes cutanés.',
  },

  // ============================================================
  // DONNÉES & CONFIDENTIALITÉ
  // ============================================================
  {
    id: 'security-private-data',
    icon: 'shield-lock-outline',
    category: 'Données & confidentialité',
    question: 'Comment HAWA protège-t-elle mes données ?',
    subtitle: 'Confidentialité, sécurité et collecte minimale.',
    answer:
      'Le cahier des charges prévoit une collecte minimale des données, aucune publicité ciblée, aucune revente des données personnelles et un stockage sécurisé avec chiffrement réel des données sensibles.',
    featured: true,
  },
  {
    id: 'security-export',
    icon: 'export-variant',
    category: 'Données & confidentialité',
    question: 'Puis-je exporter mes données ?',
    subtitle: 'PDF et CSV sont prévus dans le cahier des charges.',
    answer:
      'Oui. Le cahier des charges prévoit un export PDF du suivi et un export CSV des données afin de créer un historique clair, notamment pour un professionnel de santé.',
  },
  {
    id: 'security-delete',
    icon: 'delete-outline',
    category: 'Données & confidentialité',
    question: 'Puis-je supprimer mes données facilement ?',
    subtitle: 'La suppression doit rester simple et accessible.',
    answer:
      'Oui. Le cahier des charges prévoit une suppression simplifiée des données et du compte depuis les réglages prévus à cet effet.',
  },
];

// ============================================================
// GUIDES
// ============================================================

export type GuideId =
  | 'getting-started'
  | 'cycle'
  | 'conceive'
  | 'contraception'
  | 'irregular'
  | 'menopause'
  | 'pregnancy'
  | 'postpartum'
  | 'loss'
  | 'calendar'
  | 'journal'
  | 'spiritual'
  | 'privacy';

export type GuideTone =
  | 'purple'
  | 'green'
  | 'blue'
  | 'rose'
  | 'gold';

export type GuideItem = {
  id: GuideId;
  icon: string;
  title: string;
  text: string;
  category: string;
  tone: GuideTone;
};

export const GUIDE_ITEMS: readonly GuideItem[] = [
  {
    id: 'getting-started',
    icon: 'rocket-launch-outline',
    title: 'Bien démarrer avec HAWA',
    text:
      'Découvre ton accueil, ton calendrier, ton journal, ton objectif et tes repères spirituels.',
    category: 'Découvrir HAWA',
    tone: 'purple',
  },
  {
    id: 'cycle',
    icon: 'calendar-heart',
    title: 'Suivre mon cycle',
    text:
      'Enregistre tes règles, ton flux et consulte les estimations de ton cycle.',
    category: 'Objectifs',
    tone: 'rose',
  },
  {
    id: 'conceive',
    icon: 'heart-plus-outline',
    title: 'Essayer de concevoir',
    text:
      'Suis fertilité, ovulation, température basale, glaire cervicale et tests LH.',
    category: 'Objectifs',
    tone: 'green',
  },
  {
    id: 'contraception',
    icon: 'shield-check-outline',
    title: 'Contraception',
    text:
      'Gère ta méthode contraceptive, tes rappels, oublis et historique de prises.',
    category: 'Objectifs',
    tone: 'blue',
  },
  {
    id: 'irregular',
    icon: 'chart-timeline-variant',
    title: 'Cycles irréguliers / SOPK',
    text:
      'Observe cycles irréguliers, acné, pilosité, poids et autres symptômes associés.',
    category: 'Objectifs',
    tone: 'purple',
  },
  {
    id: 'menopause',
    icon: 'flower-outline',
    title: 'Périménopause / Ménopause',
    text:
      'Suis bouffées de chaleur, sommeil, fatigue, humeur et traitements hormonaux.',
    category: 'Objectifs',
    tone: 'gold',
  },
  {
    id: 'pregnancy',
    icon: 'human-pregnant',
    title: 'Suivi de grossesse',
    text:
      'Suis le terme estimé, les semaines, rendez-vous, examens et symptômes.',
    category: 'Objectifs',
    tone: 'rose',
  },
  {
    id: 'postpartum',
    icon: 'baby-face-outline',
    title: 'Post-partum',
    text:
      'Suis lochies, retour du cycle, allaitement, sommeil, humeur et récupération.',
    category: 'Objectifs',
    tone: 'green',
  },
  {
    id: 'loss',
    icon: 'weather-cloudy-alert',
    title: 'Après une fausse couche',
    text:
      'Suis saignements, symptômes et retour progressif du cycle à ton rythme.',
    category: 'Objectifs',
    tone: 'blue',
  },
  {
    id: 'calendar',
    icon: 'calendar-month-outline',
    title: 'Utiliser le calendrier',
    text:
      'Comprends les règles, prédictions, indicateurs et affichage grégorien / hijri.',
    category: 'Fonctionnalités',
    tone: 'purple',
  },
  {
    id: 'journal',
    icon: 'notebook-edit-outline',
    title: 'Remplir mon journal quotidien',
    text:
      'Enregistre symptômes, humeur, sommeil, activité, notes et vie intime.',
    category: 'Fonctionnalités',
    tone: 'rose',
  },
  {
    id: 'spiritual',
    icon: 'mosque',
    title: 'Utiliser les repères spirituels',
    text:
      'Découvre calendrier hijri, pureté, prière, jeûne, qadaa et nifas.',
    category: 'Repères spirituels',
    tone: 'gold',
  },
  {
    id: 'privacy',
    icon: 'shield-lock-outline',
    title: 'Confidentialité & données',
    text:
      'Gère sécurité, mode discret, export, chiffrement et suppression des données.',
    category: 'Confidentialité',
    tone: 'blue',
  },
] as const;

// ============================================================
// HELPERS
// ============================================================

export const FEATURED_FAQ_ITEMS = FAQ_ITEMS.filter(
  item => item.featured,
);

export const OBJECTIVE_FAQ_ITEMS = FAQ_ITEMS.filter(
  item => Boolean(item.objective),
);

export const SPIRITUAL_FAQ_ITEMS = FAQ_ITEMS.filter(
  item => item.category === 'Repères spirituels',
);

export const JOURNAL_FAQ_ITEMS = FAQ_ITEMS.filter(
  item => item.category === 'Journal quotidien',
);

export const PRIVACY_FAQ_ITEMS = FAQ_ITEMS.filter(
  item => item.category === 'Données & confidentialité',
);

export const getFaqById = (
  id: FaqId,
): FaqItem | undefined =>
  FAQ_ITEMS.find(item => item.id === id);

export const getFaqByCategory = (
  category: FaqCategory,
): FaqItem[] =>
  FAQ_ITEMS.filter(item => item.category === category);

export const getFaqByObjective = (
  objective: ObjectiveId,
): FaqItem[] =>
  FAQ_ITEMS.filter(item => item.objective === objective);

export const getGuideById = (
  id: GuideId,
): GuideItem | undefined =>
  GUIDE_ITEMS.find(item => item.id === id);
