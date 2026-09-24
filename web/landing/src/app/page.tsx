import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import OverviewSection from '@/components/landing/OverviewSection';
import CustomizeSection from '@/components/landing/CustomizeSection';
import StatsSection from '@/components/landing/StatsSection';
import PricingSection from '@/components/landing/PricingSection';
import ScreenshotCarousel from '@/components/landing/ScreenshotCarousel';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import DownloadSection from '@/components/landing/DownloadSection';
import FAQSection from '@/components/landing/FAQSection';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'AWA — Comprenez votre cycle. Reconnectez-vous à vous-même.',
  description:
    'AWA aide les femmes à suivre leur cycle, à comprendre leurs variations quotidiennes et à accéder à des informations de bien-être personnalisées, dans une expérience mobile calme, privée et intuitive.',
};

export default function LandingPage() {
  return (
    <main>
      {/* 01 Navbar */}
      <Navbar />

      {/* 02 Hero */}
      <HeroSection />

      {/* 03 Amazing Features */}
      <FeaturesSection />

      {/* 04 Overview / Why AWA */}
      <OverviewSection />

      {/* 05 Personalization */}
      <CustomizeSection />

      {/* 06 Statistics */}
      <StatsSection />

      {/* 07 Pricing */}
      <PricingSection />

      {/* 08 Screenshot Showcase */}
      <ScreenshotCarousel />

      {/* 09 Testimonials */}
      <TestimonialsSection />

      {/* 10 Download CTA */}
      <DownloadSection />

      {/* 11 FAQ + Contact */}
      <FAQSection />

      {/* 12 Newsletter + Footer */}
      <Footer />
    </main>
  );
}
