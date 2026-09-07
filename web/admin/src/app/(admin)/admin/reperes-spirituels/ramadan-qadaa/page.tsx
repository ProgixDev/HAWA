import React from 'react';
import {
  getSpiritualArticles,
  getSpiritualConfiguration,
  getSpiritualEvents,
  getSpiritualHistory,
  getSpiritualReminders,
} from '@/services/spiritual';
import FeatureControlContent from '@/app/spiritual/components/FeatureControlContent';

export default async function RamadanPage() {
  const [configuration, events, reminders, history, articles] = await Promise.all([
    getSpiritualConfiguration('ramadan_qadaa'),
    getSpiritualEvents('ramadan_qadaa'),
    getSpiritualReminders('ramadan_qadaa'),
    getSpiritualHistory('ramadan_qadaa'),
    getSpiritualArticles(),
  ]);
  return (
    <FeatureControlContent
      kind="ramadan"
      configuration={configuration}
      events={events}
      reminders={reminders}
      history={history}
      linkedArticles={articles.filter((article) =>
        /ramadan|jeûne|qadaa/i.test(`${article.title} ${article.tags.join(' ')}`)
      )}
    />
  );
}
