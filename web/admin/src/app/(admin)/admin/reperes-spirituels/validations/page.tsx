import React from 'react';
import { getSpiritualValidations } from '@/services/spiritual';
import ValidationsContent from '@/app/spiritual/components/ValidationsContent';

export default async function SpiritualValidationsPage() {
  const validations = await getSpiritualValidations();
  return <ValidationsContent validations={validations} />;
}
