export type AppMetadata = {
  displayName: string;
  version: string;
  buildNumber: string;
  publicationDate?: string;
  websiteUrl?: string;
  contactEmail?: string;
};

// Single source of truth matching android/app/build.gradle.
// Optional public contact values remain undefined until officially configured.
export const APP_METADATA: AppMetadata = {
  displayName: 'AWA',
  version: '1.0',
  buildNumber: '1',
  contactEmail: 'awa@admin.com',
};
