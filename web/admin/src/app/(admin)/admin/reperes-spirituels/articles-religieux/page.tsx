import React from 'react';
import { getSpiritualArticles, getSpiritualConfiguration } from '@/services/spiritual';
import ReligiousArticlesContent from '@/app/spiritual/components/ReligiousArticlesContent';

export default async function ReligiousArticlesPage() {
  const [articles, configuration] = await Promise.all([
    getSpiritualArticles(),
    getSpiritualConfiguration('articles'),
  ]);
  return <ReligiousArticlesContent articles={articles} configuration={configuration} />;
}
