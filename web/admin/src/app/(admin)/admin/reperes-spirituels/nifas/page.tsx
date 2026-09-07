import React from 'react';
import {
  getSpiritualArticles,
  getSpiritualConfiguration,
  getSpiritualHistory,
  getSpiritualReminders,
} from '@/services/spiritual';
import FeatureControlContent from '@/app/spiritual/components/FeatureControlContent';

export default async function NifasPage() {
  const [configuration, reminders, history, articles] = await Promise.all([
    getSpiritualConfiguration('nifas'),
    getSpiritualReminders('nifas'),
    getSpiritualHistory('nifas'),
    getSpiritualArticles(),
  ]);
  return (
    <FeatureControlContent
      kind="nifas"
      configuration={configuration}
      events={[]}
      reminders={reminders}
      history={history}
      linkedArticles={articles.filter((article) =>
        /nifas/i.test(`${article.title} ${article.category} ${article.tags.join(' ')}`)
      )}
    />
  );
}
