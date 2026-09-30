import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/app/components/HeroSection';
import FeaturesSection from '@/app/components/FeaturesSection';
import JourneysSection from '@/app/components/JourneysSection';
import AppearanceSection from '@/app/components/AppearanceSection';
import PricingSection from '@/app/components/PricingSection';
import ScreenshotsSection from '@/app/components/ScreenshotsSection';
import PrivacySection from '@/app/components/PrivacySection';
import FAQSection from '@/app/components/FAQSection';
import NewsletterSection from '@/app/components/NewsletterSection';
import ScrollAnimator from '@/app/components/ScrollAnimator';

export default function HomePage() {
  return (
    <>
      <ScrollAnimator />
      <Header />
      <main>
        <HeroSection />
        <hr className="section-divider" />
        <FeaturesSection />
        <hr className="section-divider" />
        <JourneysSection />
        <hr className="section-divider" />
        <AppearanceSection />
        <hr className="section-divider" />
        <PricingSection />
        <hr className="section-divider" />
        <ScreenshotsSection />
        <hr className="section-divider" />
        <PrivacySection />
        <hr className="section-divider" />
        <FAQSection />
        <NewsletterSection />
      </main>
      <Footer />
    </>
  );
}
