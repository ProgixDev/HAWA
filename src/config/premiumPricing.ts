export type PremiumPlan = 'annual' | 'monthly';
// TODO: replace these development placeholders with verified Play Billing / StoreKit products.
export const PREMIUM_PRICING = {annual: {label: 'Abonnement annuel', detail: '12 mois', price: 'Tarif à venir'}, monthly: {label: 'Mensuel', detail: 'Accès complet sans engagement', price: 'Tarif à venir'}, regions: [{code:'DZ', label:'Algérie'}, {code:'MA', label:'Maroc'}, {code:'TN', label:'Tunisie'}]} as const;
