'use client';
import React, { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const journeys = [
{
  id: 'cycle',
  label: 'Cycle',
  title: 'Mieux connaître votre rythme.',
  description:
  'Rassemblez vos dates, symptômes et ressentis dans un même espace pour comprendre votre corps en profondeur.',
  benefits: [
  'Calendrier interactif et historique',
  'Prédictions personnalisées',
  'Suivi des symptômes et de l\'humeur'],

  image:
  "https://img.rocket.new/generatedImages/rocket_gen_img_177511ab3-1765039588918.png",
  imageAlt:
  'AWA cycle tracking calendar screen with marked days on soft blush background'
},
{
  id: 'concevoir',
  label: 'Concevoir',
  title: 'Optimiser vos chances naturellement.',
  description:
  'Identifiez vos fenêtres de fertilité et suivez chaque signe de votre corps pour mettre toutes les chances de votre côté.',
  benefits: [
  'Suivi de la fenêtre fertile',
  'Courbe de température basale',
  'Conseils personnalisés'],

  image:
  "https://img.rocket.new/generatedImages/rocket_gen_img_196c3be95-1769420430702.png",
  imageAlt:
  'AWA fertility tracking screen showing ovulation window and temperature chart on light background'
},
{
  id: 'contraception',
  label: 'Contraception',
  title: 'Suivre votre contraception sereinement.',
  description:
  'Rappels, suivi de votre méthode et journal de vos ressentis pour une contraception vécue en pleine conscience.',
  benefits: [
  'Rappels de prise personnalisés',
  'Journal des effets ressentis',
  'Historique et synthèse'],

  image:
  "https://img.rocket.new/generatedImages/rocket_gen_img_468225263-1790692026512.png",
  imageAlt:
  'AWA contraception tracking screen showing reminder and journal on soft background'
},
{
  id: 'sopk',
  label: 'SOPK',
  title: 'Apprivoiser votre cycle irrégulier.',
  description:
  'Des outils adaptés aux cycles longs, irréguliers ou anovulatoires pour mieux comprendre votre SOPK.',
  benefits: [
  'Suivi des cycles irréguliers',
  'Visualisation des tendances',
  'Ressources éducatives SOPK'],

  image:
  "https://img.rocket.new/generatedImages/rocket_gen_img_4f300b04c-1790692026674.png",
  imageAlt:
  'AWA PCOS tracking screen showing irregular cycle patterns and trend analysis on light background'
},
{
  id: 'grossesse',
  label: 'Grossesse',
  title: 'Accompagner chaque semaine de grossesse.',
  description:
  'Suivez le développement de votre bébé, notez vos ressentis et préparez chaque rendez-vous médical.',
  benefits: [
  'Suivi semaine par semaine',
  'Journal de grossesse',
  'Préparation des consultations'],

  image:
  "https://img.rocket.new/generatedImages/rocket_gen_img_4712e8272-1790692027288.png",
  imageAlt:
  'AWA pregnancy tracking screen showing weekly progression and journal entries on soft background'
},
{
  id: 'postpartum',
  label: 'Post-partum',
  title: 'Prendre soin de vous après la naissance.',
  description:
  'Retrouvez vos repères, suivez votre récupération et notez chaque étape de cette période unique.',
  benefits: [
  'Suivi de la récupération physique',
  'Journal émotionnel',
  'Retour de couches personnalisé'],

  image:
  "https://img.rocket.new/generatedImages/rocket_gen_img_41771bda3-1790692027290.png",
  imageAlt:
  'AWA postpartum tracking screen showing recovery progress and emotional journal on light background'
},
{
  id: 'perimenopause',
  label: 'Périménopause',
  title: 'Naviguer cette transition en douceur.',
  description:
  'Suivez vos symptômes, vos cycles changeants et accédez à des contenus adaptés à cette étape de vie.',
  benefits: [
  'Suivi des symptômes spécifiques',
  'Cycles changeants et irréguliers',
  'Contenus éducatifs dédiés'],

  image:
  "https://img.rocket.new/generatedImages/rocket_gen_img_452a8cb0d-1790692026287.png",
  imageAlt:
  'AWA perimenopause tracking screen showing symptom log and educational content on soft blush background'
},
{
  id: 'fausse-couche',
  label: 'Après une fausse couche',
  title: 'Un espace doux pour vous reconstruire.',
  description:
  'Un espace bienveillant pour suivre votre récupération physique et émotionnelle à votre propre rythme.',
  benefits: [
  'Suivi émotionnel et physique',
  'Retour de cycle personnalisé',
  'Ressources de soutien'],

  image:
  "https://img.rocket.new/generatedImages/rocket_gen_img_4b3d46ed4-1790692026287.png",
  imageAlt:
  'AWA recovery tracking screen showing gentle emotional and physical wellbeing log on soft background'
}];


export default function JourneysSection() {
  const [activeId, setActiveId] = useState('cycle');
  const active = journeys?.find((j) => j?.id === activeId) || journeys?.[0];

  return (
    <section id="journeys" className="py-16 md:py-20 bg-muted">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <div className="max-w-xl mb-8 fade-up">
          <h2 className="font-serif text-section-title text-primary mb-3">
            À chaque étape,{' '}
            <span className="italic" style={{ color: 'var(--secondary)' }}>
              votre espace à vous.
            </span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Vos besoins évoluent. Choisissez le parcours qui vous correspond aujourd'hui.
          </p>
        </div>

        {/* Tab selector — horizontally scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 fade-up" style={{ scrollbarWidth: 'none' }}>
          {journeys?.map((j) =>
          <button
            key={j?.id}
            onClick={() => setActiveId(j?.id)}
            className={`tab-journey ${activeId === j?.id ? 'active' : ''}`}>
            
              {j?.label}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] gap-8 lg:gap-20 items-start">
          {/* Phone */}
          <div className="flex justify-center lg:justify-start fade-up">
            <div className="phone-frame">
              <div className="phone-notch" />
              <AppImage
                key={active?.id}
                src={active?.image}
                alt={active?.imageAlt}
                fill
                className="object-cover transition-opacity duration-300" />
              
            </div>
          </div>

          {/* Text */}
          <div className="fade-up fade-up-delay-1 lg:self-center lg:-translate-y-8 max-w-xl">
            <h3 className="font-serif text-2xl md:text-3xl text-primary mb-3 leading-tight">
              {active?.title}
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed mb-6">
              {active?.description}
            </p>
            <ul className="flex flex-col gap-3">
              {active?.benefits?.map((b) =>
              <li key={b} className="flex items-center gap-3">
                  <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent)' }}>
                  
                    <Icon name="CheckIcon" size={12} className="text-primary" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{b}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>);

}
