import React from 'react';
import {useTranslation} from 'react-i18next';

import {PregnancyBottomSheet, PregnancySheetCard, PregnancySheetRow} from './PregnancyBottomSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  onJournal: () => void;
  onAppointment: () => void;
};

// What the "+" of the bottom bar offers in the pregnancy objective: two choices only. The wording is passed with a French defaultValue.
export default function PregnancyPlusMenuSheet({visible, onClose, onJournal, onAppointment}: Props): React.JSX.Element {
  const {t} = useTranslation();

  return (
    <PregnancyBottomSheet accessibilityLabel={t('common.close')} onClose={onClose} visible={visible}>
      <PregnancySheetCard>
        <PregnancySheetRow
          icon="notebook-edit-outline"
          onPress={onJournal}
          subtitle={t('pregnancyPlusMenu.journalSubtitle', {defaultValue: 'Symptômes, humeur, sommeil...'})}
          title={t('pregnancyPlusMenu.journalTitle', {defaultValue: 'Remplir le journal du jour'})}
        />
        <PregnancySheetRow
          icon="calendar-plus"
          last
          onPress={onAppointment}
          subtitle={t('pregnancyPlusMenu.appointmentSubtitle', {defaultValue: 'Rendez-vous ou examen'})}
          title={t('pregnancyPlusMenu.appointmentTitle', {defaultValue: 'Ajouter un RDV médical'})}
        />
      </PregnancySheetCard>
    </PregnancyBottomSheet>
  );
}
