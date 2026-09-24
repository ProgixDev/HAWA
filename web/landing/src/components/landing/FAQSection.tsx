'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock3, MessageCircle, Minus, Plus, Send, ShieldCheck } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { staggerContainer, fadeUp, viewportConfig } from '@/lib/animations';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'Qu’est-ce qu’AWA ?',
    a: 'AWA est une application mobile privée et intuitive conçue pour aider les femmes à comprendre leur cycle menstruel, à suivre leur bien-être au quotidien et à accéder à des analyses personnalisées. Elle réunit suivi du cycle, journal des symptômes, suivi de l’humeur et contenus éducatifs dans une expérience calme et unifiée.',
  },
  {
    q: 'Comment fonctionne le suivi du cycle ?',
    a: 'Vous enregistrez les dates de début et de fin de vos règles, l’intensité du flux et vos symptômes. AWA utilise cet historique personnel pour calculer la durée moyenne de votre cycle et prédire vos prochaines règles et fenêtres de fertilité. Plus vous renseignez de données, plus vos prédictions deviennent précises.',
  },
  {
    q: 'Mes données sont-elles privées ?',
    a: 'Absolument. AWA ne vend jamais vos données, n’affiche aucune publicité et ne partage pas vos informations de santé avec des tiers. Toutes les données sont chiffrées et vous gardez à tout moment le contrôle total de vos informations.',
  },
  {
    q: 'Puis-je utiliser AWA sans créer de profil public ?',
    a: 'Oui. AWA propose un mode anonyme qui vous permet d’utiliser l’application avec un pseudonyme, sans fournir la moindre information permettant de vous identifier. Votre vie privée est une fonctionnalité essentielle, pas une simple option.',
  },
  {
    q: 'Comment les prédictions sont-elles calculées ?',
    a: 'AWA analyse votre historique de cycle personnel pour identifier vos tendances propres. Les prédictions reposent sur vos données réelles plutôt que sur des moyennes générales, et deviennent de plus en plus précises à mesure que vous continuez votre suivi.',
  },
  {
    q: 'Puis-je modifier mes préférences de suivi ?',
    a: 'Oui. Vous pouvez personnaliser entièrement les indicateurs affichés sur votre écran d’accueil, les rappels que vous recevez et leur fréquence. AWA s’adapte à vos préférences, et non l’inverse.',
  },
  {
    q: 'AWA est-elle disponible sur Android et iOS ?',
    a: 'Oui. AWA est disponible sur l’App Store d’Apple (iOS 14 et versions ultérieures) et sur Google Play (Android 8 et versions ultérieures). Vos données se synchronisent en toute sécurité entre vos appareils lorsque la sauvegarde cloud est activée.',
  },
  {
    q: 'Que comprend l’abonnement Premium ?',
    a: 'Premium, en abonnement mensuel ou annuel, inclut les statistiques avancées, l’export médical PDF/CSV, des contenus éducatifs approfondis, un historique illimité et des thèmes visuels supplémentaires.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggle = (i: number) => setOpen(open === i ? null : i);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formState.name.trim()) e.name = 'Le nom est requis';
    if (!formState.email.trim()) e.email = 'L’e-mail est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email))
      e.email = 'Veuillez saisir une adresse e-mail valide';
    if (!formState.message.trim()) e.message = 'Le message est requis';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    /* Backend integration point — connect to your API here */
    setSubmitted(true);
  };

  return (
    <section
      id="faq"
      className="cv-auto [--cv-h-m:2044px] [--cv-h-t:1896px] [--cv-h-d:1208px] relative overflow-hidden bg-gradient-to-b from-white via-[#FBF8FE] to-[#F6F0FC] py-24 md:py-32"
      aria-label="FAQ et contact"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 -top-44 h-[32rem] w-[32rem] rounded-full bg-[#C9A4F0]/18 blur-3xl" />
        <div className="absolute -bottom-52 -right-32 h-[36rem] w-[36rem] rounded-full bg-[#F2A9D0]/20 blur-3xl" />
        <div className="absolute right-[9%] top-[13%] h-44 w-44 rounded-full border border-[#B98BE2]/15" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#DFCDEC] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Vos questions,<br/><span class='gradient-text'>nos réponses.</span>"
          subtitle="Retrouvez les informations essentielles pour découvrir AWA et avancer en toute confiance."
          className="mb-16"
          titleClassName="text-[clamp(2.5rem,4vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#30253E]"
          subtitleClassName="mx-auto max-w-2xl text-[17px] font-medium leading-relaxed text-[#777089] md:text-lg"
        />

        <div className="grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          {/* FAQ accordion */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="space-y-4"
          >
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={cn(
                  'group overflow-hidden rounded-[1.5rem] border bg-white/80 shadow-[0_12px_35px_rgba(64,36,92,0.06)] backdrop-blur-xl transition-all duration-300',
                  open === i
                    ? 'border-[#C69AE8] shadow-[0_18px_45px_rgba(102,45,150,0.12)] ring-1 ring-[#A958D9]/10'
                    : 'border-[#E8DFF0] hover:-translate-y-0.5 hover:border-[#D2B6E7] hover:shadow-[0_16px_40px_rgba(64,36,92,0.09)]'
                )}
              >
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  aria-expanded={open === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="flex items-center gap-4">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold transition-colors duration-300',
                        open === i
                          ? 'bg-gradient-to-br from-[#7626D0] to-[#D51AA5] text-white shadow-[0_8px_18px_rgba(119,38,205,0.2)]'
                          : 'bg-[#F3ECF9] text-[#8B55B7]'
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'pr-2 text-[15px] font-bold leading-snug transition-colors sm:text-base',
                        open === i ? 'text-[#7B2BC7]' : 'text-[#392F43]'
                      )}
                    >
                      {faq.q}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                      open === i
                        ? 'rotate-0 bg-gradient-to-br from-[#7626D0] to-[#D51AA5] text-white shadow-[0_8px_20px_rgba(126,39,198,0.24)]'
                        : 'bg-[#F6F1FA] text-[#8D8198] group-hover:bg-[#EEE3F6] group-hover:text-[#7B2BC7]'
                    )}
                  >
                    {open === i ? (
                      <Minus size={17} aria-hidden="true" />
                    ) : (
                      <Plus size={17} aria-hidden="true" />
                    )}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="border-t border-[#EEE5F4] bg-gradient-to-r from-[#FAF6FD] to-white px-6 py-5 text-sm font-medium leading-[1.75] text-[#746C7D] sm:pl-[5.15rem] sm:pr-8">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* Contact form */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="lg:sticky lg:top-28"
          >
            <div className="relative h-full overflow-hidden rounded-[2.25rem] border border-white/25 bg-gradient-to-br from-[#5014AD] via-[#8420C7] to-[#D91A9D] p-7 text-white shadow-[0_28px_75px_rgba(101,31,159,0.24)] sm:p-9 md:p-10">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[48px] border-white/[0.06]" />
                <div className="absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-[#ED72BD]/20 blur-3xl" />
              </div>

              <div className="relative mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-md">
                    <MessageCircle size={23} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">
                      Contact
                    </span>
                    <h3 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-white">
                      Une question ?
                    </h3>
                  </div>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-semibold text-white/75 sm:flex">
                  <Clock3 size={14} aria-hidden="true" />
                  Réponse rapide
                </span>
              </div>
              <p className="relative mb-8 max-w-md text-sm font-medium leading-relaxed text-white/70">
                Nous serions ravis de vous lire. Envoyez-nous un message, nous vous répondrons
                rapidement.
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/15 shadow-lg">
                    <CheckCircle2 size={31} className="text-white" aria-hidden="true" />
                  </div>
                  <h4 className="mb-2 text-xl font-bold text-white">Message envoyé !</h4>
                  <p className="mb-6 text-sm leading-relaxed text-white/70">
                    Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormState({ name: '', email: '', message: '' });
                    }}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#7A27C4] shadow-lg transition-transform hover:-translate-y-0.5"
                  >
                    Envoyer un autre message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="relative space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-semibold text-white/85"
                    >
                      Nom
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={formState.name}
                      onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Votre nom"
                      className={cn(
                        'w-full rounded-2xl border bg-white/95 px-4 py-3.5 text-sm text-[#342A3F] outline-none transition-all duration-200 placeholder:text-[#9B92A3] focus:bg-white focus:ring-4 focus:ring-white/15',
                        errors.name ? 'border-[#FF9AAE]' : 'border-white/25 focus:border-white'
                      )}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="mt-1.5 text-xs font-medium text-[#FFD2DC]">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-semibold text-white/85"
                    >
                      E-mail
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState((p) => ({ ...p, email: e.target.value }))}
                      placeholder="vous@exemple.com"
                      className={cn(
                        'w-full rounded-2xl border bg-white/95 px-4 py-3.5 text-sm text-[#342A3F] outline-none transition-all duration-200 placeholder:text-[#9B92A3] focus:bg-white focus:ring-4 focus:ring-white/15',
                        errors.email ? 'border-[#FF9AAE]' : 'border-white/25 focus:border-white'
                      )}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="mt-1.5 text-xs font-medium text-[#FFD2DC]">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-2 block text-sm font-semibold text-white/85"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      value={formState.message}
                      onChange={(e) => setFormState((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Dites-nous ce que vous avez en tête..."
                      rows={4}
                      className={cn(
                        'w-full resize-none rounded-2xl border bg-white/95 px-4 py-3.5 text-sm text-[#342A3F] outline-none transition-all duration-200 placeholder:text-[#9B92A3] focus:bg-white focus:ring-4 focus:ring-white/15',
                        errors.message ? 'border-[#FF9AAE]' : 'border-white/25 focus:border-white'
                      )}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                    />
                    {errors.message && (
                      <p id="message-error" className="mt-1.5 text-xs font-medium text-[#FFD2DC]">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="group flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-white px-6 text-sm font-extrabold text-[#7B28C8] shadow-[0_14px_32px_rgba(35,8,66,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FFF8FD] hover:shadow-[0_18px_38px_rgba(35,8,66,0.3)]"
                  >
                    Envoyer le message
                    <Send
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>

                  <p className="flex items-center justify-center gap-2 text-center text-xs font-medium text-white/55">
                    <ShieldCheck size={14} aria-hidden="true" />
                    Votre message reste strictement confidentiel.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
