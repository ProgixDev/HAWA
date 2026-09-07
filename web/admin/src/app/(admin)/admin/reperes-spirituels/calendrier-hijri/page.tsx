import React from 'react';
import {
  getSpiritualConfiguration,
  getSpiritualEvents,
  getSpiritualHistory,
} from '@/services/spiritual';
import FeatureControlContent from '@/app/spiritual/components/FeatureControlContent';

export default async function HijriPage() {
  const [configuration, events, history] = await Promise.all([
    getSpiritualConfiguration('hijri'),
    getSpiritualEvents('hijri'),
    getSpiritualHistory('hijri'),
  ]);
  return (
    <FeatureControlContent
      kind="hijri"
      configuration={configuration}
      events={events}
      reminders={[]}
      history={history}
      linkedArticles={[]}
    />
  );
}
