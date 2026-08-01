export type SelectedLocation = {
  city: string;
  country: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
};

export const locations: SelectedLocation[] = [
  {city: 'Alger', country: 'Algérie', timezone: 'Africa/Algiers', latitude: 36.7529, longitude: 3.042},
  {city: 'Annaba', country: 'Algérie', timezone: 'Africa/Algiers', latitude: 36.9, longitude: 7.7667},
  {city: 'Oran', country: 'Algérie', timezone: 'Africa/Algiers', latitude: 35.6971, longitude: -0.6308},
  {city: 'Constantine', country: 'Algérie', timezone: 'Africa/Algiers', latitude: 36.365, longitude: 6.6147},
  {city: 'Tlemcen', country: 'Algérie', timezone: 'Africa/Algiers', latitude: 34.8783, longitude: -1.315},
  {city: 'Béjaïa', country: 'Algérie', timezone: 'Africa/Algiers', latitude: 36.75, longitude: 5.0667},
  {city: 'Blida', country: 'Algérie', timezone: 'Africa/Algiers', latitude: 36.47, longitude: 2.83},
  {city: 'Paris', country: 'France', timezone: 'Europe/Paris', latitude: 48.8566, longitude: 2.3522},
  {city: 'Marseille', country: 'France', timezone: 'Europe/Paris', latitude: 43.2965, longitude: 5.3698},
  {city: 'Casablanca', country: 'Maroc', timezone: 'Africa/Casablanca', latitude: 33.5731, longitude: -7.5898},
  {city: 'Rabat', country: 'Maroc', timezone: 'Africa/Casablanca', latitude: 34.0209, longitude: -6.8416},
  {city: 'Tunis', country: 'Tunisie', timezone: 'Africa/Tunis', latitude: 36.8065, longitude: 10.1815},
];
