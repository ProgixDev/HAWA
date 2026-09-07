'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Mail,
  ShieldCheck,
  UserRoundCog,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import { ADMIN_DEMO_CREDENTIALS, CURRENT_ADMIN } from '@/config/admin';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const STATS = [
  { icon: Users, value: '24 846', label: 'Utilisatrices' },
  { icon: Crown, value: '4 280', label: 'Abonnées' },
  { icon: BarChart3, value: '17.2%', label: 'Taux Premium' },
];

export default function AdminLoginContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const handleCopy = async (field: 'email' | 'password') => {
    const val = field === 'email' ? ADMIN_DEMO_CREDENTIALS.email : ADMIN_DEMO_CREDENTIALS.password;
    await navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUseDemoCredentials = () => {
    setValue('email', ADMIN_DEMO_CREDENTIALS.email);
    setValue('password', ADMIN_DEMO_CREDENTIALS.password);
  };

  // Backend integration point: replace with real auth API call
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));

    if (
      data.email === ADMIN_DEMO_CREDENTIALS.email &&
      data.password === ADMIN_DEMO_CREDENTIALS.password
    ) {
      toast.success(`Connexion réussie — Bienvenue, ${CURRENT_ADMIN.name}`);
      router.push(ADMIN_ROUTES.dashboard);
    } else {
      setError('root', {
        message:
          'Identifiants invalides — utilisez les comptes de démonstration ci-dessous pour vous connecter.',
      });
    }
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-[100dvh] w-full overflow-x-hidden bg-[#f7f3ed] lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        className="relative hidden h-[100dvh] shrink-0 overflow-hidden bg-cover bg-center md:flex md:w-[43%] lg:w-[53%] xl:w-[55%]"
        style={{ backgroundImage: "url('/assets/images/font.png')" }}
        aria-label="Présentation AWA Administration"
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,246,239,0.05)_0%,rgba(230,216,197,0.08)_58%,rgba(61,48,40,0.16)_100%)]" />

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-between px-5 py-8 text-center lg:px-10 lg:py-10 xl:px-14 xl:py-12">
          <div aria-hidden="true" className="h-4 shrink-0" />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
            className="flex max-w-[520px] flex-col items-center"
          >
            <AppLogo
              src="/assets/images/app_logo.png"
              width={232}
              height={190}
              className="drop-shadow-[0_12px_30px_rgba(95,66,34,0.16)] md:scale-90 lg:scale-100"
            />

            <div className="my-5 h-px w-12 bg-[#b68b55]/65 lg:my-6" />
            <p className="max-w-[410px] font-display text-[15px] font-medium leading-[1.75] tracking-[-0.01em] text-[#3d342f] lg:text-[17px]">
              Une gestion bienveillante
              <br />
              pour un impact réel sur la vie des femmes
              <br className="hidden lg:block" /> musulmanes francophones.
            </p>
          </motion.div>

          <div className="w-full max-w-[650px]">
            <div className="hidden grid-cols-3 gap-3 lg:grid xl:gap-4">
              {STATS.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.42 + index * 0.1 }}
                    className="rounded-[16px] border border-white/55 bg-white/45 px-3 py-4 shadow-[0_10px_30px_rgba(73,54,38,0.08)] backdrop-blur-md"
                  >
                    <Icon className="mx-auto mb-2 text-[#8f6a3d]" size={17} strokeWidth={1.6} />
                    <p className="font-display text-[19px] font-semibold tracking-[-0.02em] text-[#342d29] tabular-nums">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6f6259]">
                      {stat.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.78 }}
              className="mt-5 text-[9px] font-semibold uppercase tracking-[0.34em] text-[#51463e]/80 lg:mt-7 lg:text-[10px]"
            >
              Santé&nbsp;&nbsp;·&nbsp;&nbsp;Équilibre&nbsp;&nbsp;·&nbsp;&nbsp;Spiritualité
            </motion.p>
          </div>
        </div>
      </motion.section>

      <section className="relative flex min-h-[100dvh] w-full min-w-0 flex-1 overflow-y-auto bg-[#faf8f4] px-5 py-6 sm:px-8 md:h-[100dvh] md:min-h-0 md:w-auto md:px-7 lg:px-10 lg:py-7 xl:px-14">
        <button
          type="button"
          className="absolute right-5 top-5 z-10 flex items-center gap-1.5 rounded-full border border-[#e5ded4] bg-white/60 px-3 py-2 text-[11px] font-semibold tracking-[0.08em] text-[#655f68] transition-colors hover:border-[#cabca9] hover:text-[#4a3f55] sm:right-8 sm:top-7 xl:right-10"
          aria-label="Langue : français"
        >
          <Globe2 size={14} strokeWidth={1.7} />
          FR
          <ChevronDown size={12} strokeWidth={1.7} />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
          className="mx-auto my-auto w-full max-w-[460px] pb-3 pt-16 sm:pb-5 sm:pt-14 md:pt-16 lg:py-6"
        >
          <div className="mb-7 flex justify-center md:hidden">
            <AppLogo
              src="/assets/images/app_logo.png"
              width={126}
              height={103}
              className="drop-shadow-[0_8px_20px_rgba(95,66,34,0.12)]"
            />
          </div>

          <header className="mb-6 sm:mb-7">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-[#b68b55]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9a774e]">
                Bienvenue
              </p>
            </div>
            <h1 className="font-display text-[30px] font-semibold leading-tight tracking-[-0.035em] text-[#302a35] sm:text-[34px]">
              Se connecter
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#756f78] sm:text-sm">
              Accédez à votre espace d&apos;administration AWA
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <AnimatePresence>
              {errors.root && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 rounded-xl border p-3.5"
                  style={{ background: 'var(--danger-bg)', borderColor: 'rgba(196, 90, 90, 0.2)' }}
                >
                  <AlertCircle
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: 'var(--danger)' }}
                  />
                  <p className="text-sm" style={{ color: 'var(--danger)' }}>
                    {errors.root.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[12px] font-semibold text-[#403a45]"
              >
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  strokeWidth={1.6}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a838e]"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={CURRENT_ADMIN.email}
                  className={`h-[54px] w-full rounded-[14px] border bg-[#f1eef2] px-4 pl-11 text-[13px] text-[#37313c] outline-none transition-all placeholder:text-[#9a949d] focus:border-[#89779a] focus:bg-[#f8f6f8] focus:ring-4 focus:ring-[#75618c]/10 ${errors.email ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-[#e5e0e7]'}`}
                  {...register('email', {
                    required: "L'adresse e-mail est requise",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Format d'e-mail invalide",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--danger)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-[12px] font-semibold text-[#403a45]">
                  Mot de passe
                </label>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-[#75618c] transition-colors hover:text-[#554465]"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={17}
                  strokeWidth={1.6}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a838e]"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className={`h-[54px] w-full rounded-[14px] border bg-[#f1eef2] px-11 text-[13px] text-[#37313c] outline-none transition-all placeholder:text-[#9a949d] focus:border-[#89779a] focus:bg-[#f8f6f8] focus:ring-4 focus:ring-[#75618c]/10 ${errors.password ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-[#e5e0e7]'}`}
                  {...register('password', {
                    required: 'Le mot de passe est requis',
                    minLength: {
                      value: 8,
                      message: 'Minimum 8 caractères',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8a838e] transition-colors hover:bg-white/60 hover:text-[#44394e]"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--danger)' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 py-0.5">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-[#d7d0da] accent-[#6f5b82] focus:ring-[#75618c]/20"
                {...register('rememberMe')}
              />
              <label
                htmlFor="rememberMe"
                className="cursor-pointer select-none text-[12px] text-[#6f6872]"
              >
                Se souvenir de moi
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={isLoading ? undefined : { y: -1 }}
              whileTap={isLoading ? undefined : { scale: 0.99 }}
              className="mt-1 flex h-[54px] w-full items-center justify-center rounded-[15px] bg-[#6b587d] px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(85,68,101,0.2)] transition-[background-color,box-shadow] hover:bg-[#5e4c70] hover:shadow-[0_13px_28px_rgba(85,68,101,0.25)] disabled:cursor-not-allowed disabled:bg-[#92849e]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Connexion en cours…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Se connecter
                  <ArrowRight size={16} strokeWidth={1.8} />
                </span>
              )}
            </motion.button>
          </form>

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-[#e5dfe7]" />
            <span className="text-[10px] font-medium text-[#a19aa4]">ou</span>
            <span className="h-px flex-1 bg-[#e5dfe7]" />
          </div>

          <div className="flex items-start gap-3 rounded-[14px] border border-[#e7e1e9] bg-[#f1eef3]/75 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#75618c] shadow-sm">
              <ShieldCheck size={17} strokeWidth={1.7} />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#443d49]">
                Connexion sécurisée par 2FA
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-[#7d7680]">
                Une vérification en deux étapes peut être requise.
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.5 }}
            className="mt-4 overflow-hidden rounded-[15px] border border-[#ded5e3] bg-white/55"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8e2ea] px-4 py-3 sm:flex-nowrap sm:gap-3">
              <div className="flex items-center gap-2">
                <UserRoundCog size={15} strokeWidth={1.7} className="text-[#75618c]" />
                <p className="text-[11px] font-semibold text-[#443d49]">Accès de démonstration</p>
              </div>
              <button
                type="button"
                onClick={handleUseDemoCredentials}
                className="text-right text-[10px] font-semibold text-[#75618c] transition-colors hover:text-[#554465]"
              >
                Utiliser ces identifiants
              </button>
            </div>

            <div className="grid gap-2.5 p-3.5 sm:grid-cols-2 sm:gap-3">
              <div className="flex min-w-0 items-center justify-between gap-2 rounded-[11px] bg-[#f7f4f7] px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8b838d]">
                    E-mail
                  </p>
                  <p className="truncate font-mono text-[10px] font-medium text-[#4b444f]">
                    {ADMIN_DEMO_CREDENTIALS.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('email')}
                  className="flex-shrink-0 rounded-lg p-1.5 text-[#8b838d] transition-colors hover:bg-white hover:text-[#655276]"
                  title="Copier l’e-mail"
                  aria-label="Copier l’e-mail de démonstration"
                >
                  {copiedField === 'email' ? (
                    <Check size={13} className="text-success" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>

              <div className="flex min-w-0 items-center justify-between gap-2 rounded-[11px] bg-[#f7f4f7] px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8b838d]">
                    Mot de passe
                  </p>
                  <p className="truncate font-mono text-[10px] font-medium text-[#4b444f]">
                    {ADMIN_DEMO_CREDENTIALS.password}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('password')}
                  className="flex-shrink-0 rounded-lg p-1.5 text-[#8b838d] transition-colors hover:bg-white hover:text-[#655276]"
                  title="Copier le mot de passe"
                  aria-label="Copier le mot de passe de démonstration"
                >
                  {copiedField === 'password' ? (
                    <Check size={13} className="text-success" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          <div className="mt-5 flex items-center justify-center gap-2 text-center text-[9px] font-medium uppercase tracking-[0.1em] text-[#999199]">
            <Lock size={11} strokeWidth={1.7} />
            <span>Accès sécurisé · Chiffrement de bout en bout</span>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
