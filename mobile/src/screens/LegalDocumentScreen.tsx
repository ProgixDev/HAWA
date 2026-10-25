import React, {useMemo} from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

type LegalSection = {title: string; body: string};

// TERMS & PRIVACY FR/EN/ES LOCALIZATION: this screen's body is itself a
// provisional, not-yet-legally-validated placeholder (see each section's own
// text below) — there is no approved Terms/Privacy document in this
// repository yet, in any language. The French text is the original,
// unchanged source of truth; English and Spanish are faithful translations
// of that same placeholder content (not new legal drafting). Keyed by
// AwaAppLanguage so the body — not just the screen's chrome — now follows
// the app language, with no fallback to French for en/es.
// Exported for TERMS/PRIVACY structural-parity and content-leak tests
// (Phase7J1LegalDocumentLanguageSwitch.test.tsx) — never imported by any
// other screen/component.
// Languages that actually have legal placeholder text. Deliberately narrower than
// AwaAppLanguage: Italian is not translated here yet (explicit English fallback). Turkish
// has the same provisional placeholder text as the other languages (still pending legal
// validation — it carries no clause beyond the English). Russian likewise carries the same
// provisional placeholder text and no clause beyond the English. German (de) carries the same
// provisional placeholder text as well, with no clause beyond the English. Simplified Chinese (zh), Indonesian (id) and Hindi (hi) likewise.
type LegalLanguage = 'fr' | 'en' | 'es' | 'tr' | 'ru' | 'de' | 'zh' | 'id' | 'hi' | 'sq' | 'ja' | 'ko' | 'pt-PT' | 'pt-BR' | 'bn' | 'da' | 'sv';

export const TERMS: Record<LegalLanguage, LegalSection[]> = {
  fr: [
    {title: 'Objet', body: 'Ce document présente la structure provisoire des conditions d’utilisation de l’application AWA.'},
    {title: 'Utilisation de l’application', body: 'AWA propose des outils de suivi personnel et de bien-être. Le contenu définitif décrivant les droits et responsabilités des utilisatrices sera ajouté après validation juridique.'},
    {title: 'Disponibilité du service', body: 'Les modalités définitives de disponibilité, de maintenance et d’évolution du service restent à valider.'},
    {title: 'Contact', body: 'Les coordonnées officielles seront ajoutées dès leur validation par l’équipe AWA.'},
  ],
  en: [
    {title: 'Purpose', body: 'This document presents the provisional structure of AWA’s terms of use.'},
    {title: 'Use of the application', body: 'AWA offers personal tracking and well-being tools. The final content describing users’ rights and responsibilities will be added once legal validation is complete.'},
    {title: 'Service availability', body: 'The final terms governing the service’s availability, maintenance, and evolution are still to be confirmed.'},
    {title: 'Contact', body: 'Official contact details will be added once validated by the AWA team.'},
  ],
  es: [
    {title: 'Objeto', body: 'Este documento presenta la estructura provisional de las condiciones de uso de la aplicación AWA.'},
    {title: 'Uso de la aplicación', body: 'AWA ofrece herramientas de seguimiento personal y bienestar. El contenido definitivo que describe los derechos y responsabilidades de las usuarias se añadirá tras la validación jurídica.'},
    {title: 'Disponibilidad del servicio', body: 'Las modalidades definitivas de disponibilidad, mantenimiento y evolución del servicio están aún por determinar.'},
    {title: 'Contacto', body: 'Los datos de contacto oficiales se añadirán una vez validados por el equipo de AWA.'},
  ],
  tr: [
    {
      title: 'Amaç',
      body: 'Bu belge, AWA’nın kullanım koşullarının geçici yapısını sunar.',
    },
    {
      title: 'Uygulamanın kullanımı',
      body: 'AWA, kişisel takip ve iyi oluş araçları sunar. Kullanıcıların haklarını ve sorumluluklarını açıklayan nihai içerik, hukuki doğrulama tamamlandıktan sonra eklenecektir.',
    },
    {
      title: 'Hizmetin erişilebilirliği',
      body: 'Hizmetin erişilebilirliğini, bakımını ve gelişimini düzenleyen nihai koşullar henüz kesinleştirilmemiştir.',
    },
    {
      title: 'İletişim',
      body: 'Resmî iletişim bilgileri, AWA ekibi tarafından doğrulandıktan sonra eklenecektir.',
    },
  ],
  ru: [
    {title: 'Назначение', body: 'Этот документ представляет предварительную структуру условий использования AWA.'},
    {title: 'Использование приложения', body: 'AWA предлагает инструменты личного учёта и заботы о самочувствии. Окончательный текст, описывающий права и обязанности пользователей, будет добавлен после завершения юридической проверки.'},
    {title: 'Доступность сервиса', body: 'Окончательные условия, регулирующие доступность, обслуживание и развитие сервиса, ещё предстоит подтвердить.'},
    {title: 'Контакты', body: 'Официальные контактные данные будут добавлены после того, как их подтвердит команда AWA.'},
  ],
  de: [
    {title: 'Zweck', body: 'Dieses Dokument zeigt die vorläufige Struktur der Nutzungsbedingungen von AWA.'},
    {title: 'Nutzung der App', body: 'AWA bietet Werkzeuge für die persönliche Beobachtung und das Wohlbefinden. Der endgültige Text zu den Rechten und Pflichten der Nutzerinnen wird ergänzt, sobald die rechtliche Prüfung abgeschlossen ist.'},
    {title: 'Verfügbarkeit des Dienstes', body: 'Die endgültigen Bedingungen zu Verfügbarkeit, Wartung und Weiterentwicklung des Dienstes müssen noch bestätigt werden.'},
    {title: 'Kontakt', body: 'Die offiziellen Kontaktdaten werden ergänzt, sobald sie vom AWA-Team bestätigt wurden.'},
  ],
  zh: [
    {title: '目的', body: '本文件为 AWA 使用条款的临时结构。'},
    {title: '应用的使用', body: 'AWA 提供个人记录与健康管理工具。说明用户权利与责任的正式内容，将在法律审核完成后补充。'},
    {title: '服务可用性', body: '关于服务可用性、维护与更新的正式条款仍有待确认。'},
    {title: '联系方式', body: '官方联系方式将在 AWA 团队确认后补充。'},
  ],
  id: [
    {title: 'Tujuan', body: 'Dokumen ini memuat struktur sementara ketentuan penggunaan aplikasi AWA.'},
    {title: 'Penggunaan aplikasi', body: 'AWA menyediakan alat pencatatan pribadi dan kesehatan. Isi final yang menjelaskan hak dan tanggung jawab pengguna akan ditambahkan setelah validasi hukum selesai.'},
    {title: 'Ketersediaan layanan', body: 'Ketentuan final tentang ketersediaan, pemeliharaan, dan pengembangan layanan masih perlu dipastikan.'},
    {title: 'Kontak', body: 'Rincian kontak resmi akan ditambahkan setelah divalidasi oleh tim AWA.'},
  ],
  hi: [
    {title: 'उद्देश्य', body: 'यह दस्तावेज़ AWA की उपयोग की शर्तों का अस्थायी ढाँचा दिखाता है।'},
    {title: 'ऐप का उपयोग', body: 'AWA निजी ट्रैकिंग और सेहत से जुड़े टूल उपलब्ध कराता है। उपयोगकर्ताओं के अधिकारों और ज़िम्मेदारियों की अंतिम जानकारी कानूनी जाँच पूरी होने के बाद जोड़ी जाएगी।'},
    {title: 'सेवा की उपलब्धता', body: 'सेवा की उपलब्धता, रखरखाव और विकास से जुड़ी अंतिम शर्तों की पुष्टि होना अभी बाकी है।'},
    {title: 'संपर्क', body: 'AWA टीम से पुष्टि होने के बाद आधिकारिक संपर्क जानकारी जोड़ी जाएगी।'},
  ],
  sq: [
    {title: 'Qëllimi', body: 'Ky dokument paraqet strukturën e përkohshme të kushteve të përdorimit të AWA.'},
    {title: 'Përdorimi i aplikacionit', body: 'AWA ofron mjete për ndjekje personale dhe mirëqenie. Përmbajtja përfundimtare për të drejtat dhe përgjegjësitë e përdoruesve do të shtohet pasi të përfundojë vlerësimi ligjor.'},
    {title: 'Disponueshmëria e shërbimit', body: 'Kushtet përfundimtare për disponueshmërinë, mirëmbajtjen dhe zhvillimin e shërbimit duhet të konfirmohen ende.'},
    {title: 'Kontakti', body: 'Të dhënat zyrtare të kontaktit do të shtohen pasi të konfirmohen nga ekipi i AWA.'},
  ],
  ja: [
    {title: '目的', body: 'この文書は、AWAの利用規約の暫定的な構成を示すものです。'},
    {title: 'アプリの利用', body: 'AWAは、個人の記録とウェルネスのためのツールを提供します。利用者の権利と責任に関する最終的な内容は、法的な確認が完了したのちに追加されます。'},
    {title: 'サービスの提供', body: 'サービスの提供、保守、改善に関する最終的な条件は、今後確認される予定です。'},
    {title: 'お問い合わせ', body: '公式の連絡先は、AWAチームによる確認後に追加されます。'},
  ],
  ko: [
    {title: '목적', body: '이 문서는 AWA 이용약관의 임시 구성을 보여 줍니다.'},
    {title: '앱 이용', body: 'AWA는 개인 기록과 웰니스를 위한 도구를 제공합니다. 이용자의 권리와 책임에 관한 최종 내용은 법률 검토가 끝난 후 추가됩니다.'},
    {title: '서비스 제공', body: '서비스 제공, 유지 관리 및 개선에 관한 최종 조건은 앞으로 확정될 예정입니다.'},
    {title: '문의', body: '공식 연락처는 AWA 팀의 확인을 거쳐 추가됩니다.'},
  ],
  'pt-PT': [
    {title: 'Finalidade', body: 'Este documento apresenta a estrutura provisória dos Termos de Utilização do AWA.'},
    {title: 'Utilização da aplicação', body: 'O AWA disponibiliza ferramentas de registo pessoal e de bem-estar. O conteúdo final sobre os direitos e as responsabilidades dos utilizadores será acrescentado após a validação jurídica.'},
    {title: 'Prestação do serviço', body: 'As condições finais de prestação, manutenção e melhoria do serviço serão definidas mais tarde.'},
    {title: 'Contacto', body: 'O contacto oficial será acrescentado após a validação pela equipa do AWA.'},
  ],
  'pt-BR': [
    {title: 'Finalidade', body: 'Este documento apresenta a estrutura provisória dos Termos de Uso do AWA.'},
    {title: 'Uso do aplicativo', body: 'O AWA oferece ferramentas de registro pessoal e de bem-estar. O conteúdo final sobre os direitos e as responsabilidades dos usuários será acrescentado após a validação jurídica.'},
    {title: 'Prestação do serviço', body: 'As condições finais de prestação, manutenção e melhoria do serviço serão definidas mais tarde.'},
    {title: 'Contato', body: 'O contato oficial será acrescentado após a validação pela equipe do AWA.'},
  ],
  bn: [
    {title: 'উদ্দেশ্য', body: 'এই নথিতে AWA-এর ব্যবহারের শর্তাবলির অস্থায়ী কাঠামো দেখানো হয়েছে।'},
    {title: 'অ্যাপের ব্যবহার', body: 'AWA ব্যক্তিগত রেকর্ড রাখা ও সুস্থতার জন্য কিছু সরঞ্জাম সরবরাহ করে। ব্যবহারকারীদের অধিকার ও দায়িত্ব সম্পর্কে চূড়ান্ত বিষয়বস্তু আইনি যাচাইয়ের পর যোগ করা হবে।'},
    {title: 'সেবা প্রদান', body: 'সেবা প্রদান, রক্ষণাবেক্ষণ ও উন্নয়নের চূড়ান্ত শর্তগুলো পরে নির্ধারণ করা হবে।'},
    {title: 'যোগাযোগ', body: 'আনুষ্ঠানিক যোগাযোগের তথ্য AWA দলের যাচাইয়ের পর যোগ করা হবে।'},
  ],
  da: [
    {title: 'Formål', body: 'Dette dokument præsenterer den foreløbige struktur for AWA\'s brugsbetingelser.'},
    {title: 'Brug af appen', body: 'AWA tilbyder personlige sporings- og velfærdsværktøjer. Det endelige indhold, der beskriver brugernes rettigheder og ansvar, tilføjes, når den juridiske validering er afsluttet.'},
    {title: 'Tjenestetilgængelighed', body: 'De endelige betingelser for tjenestens tilgængelighed, vedligeholdelse og udvikling er endnu ikke fastlagt.'},
    {title: 'Kontakt', body: 'Officielle kontaktoplysninger tilføjes, når de er godkendt af AWA-teamet.'},
  ],
  sv: [
    {title: 'Syfte', body: 'Det här dokumentet presenterar den preliminära strukturen för AWA:s användarvillkor.'},
    {title: 'Användning av appen', body: 'AWA erbjuder personliga spårnings- och välmåendeverktyg. Det slutliga innehållet som beskriver användarnas rättigheter och skyldigheter läggs till efter juridisk granskning.'},
    {title: 'Tjänsttillgänglighet', body: 'De slutliga villkoren för tjänstens tillgänglighet, underhåll och utveckling återstår att fastställa.'},
    {title: 'Kontakt', body: 'Officiella kontaktuppgifter läggs till när de har godkänts av AWA-teamet.'},
  ],
};

export const PRIVACY: Record<LegalLanguage, LegalSection[]> = {
  fr: [
    {title: 'Données concernées', body: 'Cette section décrira précisément les données traitées par AWA et leur finalité après validation juridique.'},
    {title: 'Stockage et sécurité', body: 'La documentation définitive précisera les mesures de stockage, de protection et les durées de conservation.'},
    {title: 'Tes droits', body: 'Les procédures permettant d’accéder, corriger ou supprimer les données seront détaillées dans la version validée.'},
    {title: 'Contact confidentialité', body: 'L’adresse officielle du responsable de la confidentialité sera ajoutée avant publication.'},
  ],
  en: [
    {title: 'Data concerned', body: 'This section will precisely describe the data processed by AWA and its purpose, once legal validation is complete.'},
    {title: 'Storage and security', body: 'The final documentation will specify the storage measures, protections, and retention periods.'},
    {title: 'Your rights', body: 'The procedures for accessing, correcting, or deleting your data will be detailed in the validated version.'},
    {title: 'Privacy contact', body: 'The official contact address for the privacy officer will be added before publication.'},
  ],
  es: [
    {title: 'Datos tratados', body: 'Esta sección describirá con precisión los datos tratados por AWA y su finalidad, tras la validación jurídica.'},
    {title: 'Almacenamiento y seguridad', body: 'La documentación definitiva precisará las medidas de almacenamiento, protección y los plazos de conservación.'},
    {title: 'Tus derechos', body: 'Los procedimientos para acceder, corregir o eliminar los datos se detallarán en la versión validada.'},
    {title: 'Contacto de privacidad', body: 'La dirección oficial del responsable de privacidad se añadirá antes de la publicación.'},
  ],
  tr: [
    {
      title: 'İlgili veriler',
      body: 'Bu bölüm, hukuki doğrulama tamamlandıktan sonra AWA tarafından işlenen verileri ve işleme amacını ayrıntılı olarak açıklayacaktır.',
    },
    {
      title: 'Saklama ve güvenlik',
      body: 'Nihai belgelendirme; saklama önlemlerini, korumaları ve saklama sürelerini belirtecektir.',
    },
    {
      title: 'Haklarınız',
      body: 'Verilerinize erişme, onları düzeltme veya silme usulleri, doğrulanmış sürümde ayrıntılı olarak açıklanacaktır.',
    },
    {
      title: 'Gizlilik iletişimi',
      body: 'Gizlilik sorumlusunun resmî iletişim adresi, yayımlanmadan önce eklenecektir.',
    },
  ],
  ru: [
    {title: 'Затрагиваемые данные', body: 'После завершения юридической проверки в этом разделе будут точно описаны данные, обрабатываемые AWA, и цель их обработки.'},
    {title: 'Хранение и безопасность', body: 'В окончательной документации будут указаны меры хранения, средства защиты и сроки хранения.'},
    {title: 'Ваши права', body: 'Порядок доступа к вашим данным, их исправления или удаления будет подробно описан в проверенной версии.'},
    {title: 'Контакт по вопросам конфиденциальности', body: 'Официальный адрес ответственного за конфиденциальность будет добавлен до публикации.'},
  ],
  de: [
    {title: 'Betroffene Daten', body: 'Dieser Abschnitt beschreibt nach Abschluss der rechtlichen Prüfung genau, welche Daten AWA verarbeitet und zu welchem Zweck.'},
    {title: 'Speicherung und Sicherheit', body: 'Die endgültige Dokumentation legt die Speichermaßnahmen, Schutzvorkehrungen und Aufbewahrungsfristen fest.'},
    {title: 'Deine Rechte', body: 'Die Verfahren, um auf deine Daten zuzugreifen, sie zu berichtigen oder zu löschen, werden in der geprüften Fassung ausführlich beschrieben.'},
    {title: 'Datenschutzkontakt', body: 'Die offizielle Kontaktadresse der oder des Datenschutzverantwortlichen wird vor der Veröffentlichung ergänzt.'},
  ],
  zh: [
    {title: '涉及的数据', body: '法律审核完成后，本部分将详细说明 AWA 处理的数据及其用途。'},
    {title: '存储与安全', body: '正式文件将说明存储措施、保护措施和保存期限。'},
    {title: '你的权利', body: '访问、更正或删除你的数据的方式，将在审核通过的版本中详细说明。'},
    {title: '隐私联系方式', body: '隐私负责人的官方联系地址将在发布前补充。'},
  ],
  id: [
    {title: 'Data yang diproses', body: 'Bagian ini akan menjelaskan secara rinci data yang diproses oleh AWA beserta tujuannya, setelah validasi hukum selesai.'},
    {title: 'Penyimpanan dan keamanan', body: 'Dokumen final akan merinci langkah penyimpanan, perlindungan, dan jangka waktu penyimpanan data.'},
    {title: 'Hak Anda', body: 'Tata cara mengakses, memperbaiki, atau menghapus data Anda akan dijelaskan dalam versi yang telah divalidasi.'},
    {title: 'Kontak privasi', body: 'Alamat kontak resmi penanggung jawab privasi akan ditambahkan sebelum dipublikasikan.'},
  ],
  hi: [
    {title: 'संबंधित डेटा', body: 'कानूनी जाँच पूरी होने के बाद, यह भाग विस्तार से बताएगा कि AWA कौन-सा डेटा प्रोसेस करता है और किस उद्देश्य से।'},
    {title: 'स्टोरेज और सुरक्षा', body: 'अंतिम दस्तावेज़ में स्टोरेज के उपाय, सुरक्षा के इंतज़ाम और डेटा रखने की अवधि बताई जाएगी।'},
    {title: 'आपके अधिकार', body: 'आपके डेटा को देखने, सुधारने या हटाने की प्रक्रिया जाँचे गए संस्करण में विस्तार से बताई जाएगी।'},
    {title: 'गोपनीयता संपर्क', body: 'गोपनीयता अधिकारी का आधिकारिक संपर्क पता प्रकाशन से पहले जोड़ा जाएगा।'},
  ],
  sq: [
    {title: 'Të dhënat që përpunohen', body: 'Ky seksion do të përshkruajë saktësisht të dhënat që përpunon AWA dhe qëllimin e tyre, pasi të përfundojë vlerësimi ligjor.'},
    {title: 'Ruajtja dhe siguria', body: 'Dokumentacioni përfundimtar do të përcaktojë masat e ruajtjes, mbrojtjet dhe afatet e ruajtjes.'},
    {title: 'Të drejtat e tua', body: 'Procedurat për të hyrë, korrigjuar ose fshirë të dhënat e tua do të detajohen në versionin e verifikuar.'},
    {title: 'Kontakti për privatësinë', body: 'Adresa zyrtare e kontaktit të përgjegjësit për privatësinë do të shtohet para publikimit.'},
  ],
  ja: [
    {title: '取り扱うデータ', body: 'このセクションでは、法的な確認が完了したのち、AWAが取り扱うデータとその目的を正確に説明します。'},
    {title: '保管とセキュリティ', body: '最終版の文書では、保管方法、保護対策、保存期間が定められます。'},
    {title: '利用者の権利', body: 'データへのアクセス、訂正、削除の手続きは、確認済みの版で詳しく説明されます。'},
    {title: 'プライバシーに関するお問い合わせ', body: 'プライバシー責任者の公式な連絡先は、公開前に追加されます。'},
  ],
  ko: [
    {title: '처리하는 데이터', body: '이 항목에서는 법률 검토가 끝난 후 AWA가 처리하는 데이터와 그 목적을 정확히 설명합니다.'},
    {title: '보관 및 보안', body: '최종 문서에는 보관 방식, 보호 조치, 보관 기간이 정해집니다.'},
    {title: '이용자의 권리', body: '데이터에 접근하고 수정하거나 삭제하는 절차는 확정된 버전에서 자세히 안내합니다.'},
    {title: '개인정보 문의', body: '개인정보 보호 책임자의 공식 연락처는 공개 전에 추가됩니다.'},
  ],
  'pt-PT': [
    {title: 'Dados tratados', body: 'Esta secção descreverá com precisão os dados que o AWA trata e as respetivas finalidades, após a validação jurídica.'},
    {title: 'Conservação e segurança', body: 'O documento final definirá o modo de conservação, as medidas de proteção e os prazos de conservação.'},
    {title: 'Direitos do utilizador', body: 'Os procedimentos para aceder, retificar ou eliminar os dados serão detalhados na versão validada.'},
    {title: 'Contacto sobre privacidade', body: 'O contacto oficial do responsável pela privacidade será acrescentado antes da publicação.'},
  ],
  'pt-BR': [
    {title: 'Dados tratados', body: 'Esta seção descreverá com precisão os dados que o AWA trata e as respectivas finalidades, após a validação jurídica.'},
    {title: 'Armazenamento e segurança', body: 'O documento final definirá a forma de armazenamento, as medidas de proteção e os prazos de retenção.'},
    {title: 'Direitos do usuário', body: 'Os procedimentos para acessar, corrigir ou excluir os dados serão detalhados na versão validada.'},
    {title: 'Contato sobre privacidade', body: 'O contato oficial do responsável pela privacidade será acrescentado antes da publicação.'},
  ],
  bn: [
    {title: 'প্রক্রিয়াকৃত তথ্য', body: 'আইনি যাচাইয়ের পর এই অংশে AWA কোন তথ্য প্রক্রিয়া করে এবং কী উদ্দেশ্যে করে, তা সুনির্দিষ্টভাবে বর্ণনা করা হবে।'},
    {title: 'সংরক্ষণ ও নিরাপত্তা', body: 'চূড়ান্ত নথিতে তথ্য সংরক্ষণের পদ্ধতি, সুরক্ষা ব্যবস্থা এবং সংরক্ষণের মেয়াদ নির্ধারণ করা হবে।'},
    {title: 'ব্যবহারকারীর অধিকার', body: 'তথ্য দেখা, সংশোধন বা মুছে ফেলার পদ্ধতি যাচাইকৃত সংস্করণে বিস্তারিত জানানো হবে।'},
    {title: 'গোপনীয়তা বিষয়ক যোগাযোগ', body: 'গোপনীয়তা দায়িত্বপ্রাপ্ত ব্যক্তির আনুষ্ঠানিক যোগাযোগের তথ্য প্রকাশের আগে যোগ করা হবে।'},
  ],
  da: [
    {title: 'Berørte data', body: 'Dette afsnit vil præcist beskrive de data, AWA behandler, og formålet hermed, når den juridiske validering er afsluttet.'},
    {title: 'Opbevaring og sikkerhed', body: 'Den endelige dokumentation vil specificere opbevaringsforanstaltninger, beskyttelse og opbevaringsperioder.'},
    {title: 'Dine rettigheder', body: 'Procedurerne for at få adgang til, rette eller slette dine data vil blive beskrevet i den validerede version.'},
    {title: 'Kontakt vedr. privatlivspolitik', body: 'Den officielle kontaktadresse for databeskyttelsesansvarlig tilføjes inden offentliggørelse.'},
  ],
  sv: [
    {title: 'Berörda uppgifter', body: 'Det här avsnittet kommer att exakt beskriva de uppgifter som AWA behandlar och syftet med dem, när den juridiska granskningen är klar.'},
    {title: 'Lagring och säkerhet', body: 'Den slutliga dokumentationen kommer att specificera lagringsåtgärder, skyddsåtgärder och lagringstider.'},
    {title: 'Dina rättigheter', body: 'Rutinerna för att få tillgång till, rätta eller radera dina uppgifter beskrivs i den validerade versionen.'},
    {title: 'Kontakt integritet', body: 'Den officiella kontaktadressen till dataskyddsombudet läggs till före publicering.'},
  ],
};

/** Resolves the app's current language to one of the 6 legal-content keys —
 * the single place this screen decides fr/en/es/tr/ru/de/zh/id/hi/sq/ja/ko/pt-PT/pt-BR/bn, so body and chrome can never
 * drift apart. Italian ('it') has no legal placeholder text yet, so it — like
 * any unknown/invalid language (e.g. not yet loaded) — falls back to English,
 * never to French or Spanish. */
function resolveLegalLanguage(language: string): LegalLanguage {
  if (language === 'fr') {return 'fr';}
  if (language === 'es') {return 'es';}
  if (language === 'tr') {return 'tr';}
  if (language === 'ru') {return 'ru';}
  if (language === 'de') {return 'de';}
  if (language === 'zh') {return 'zh';}
  if (language === 'id') {return 'id';}
  if (language === 'hi') {return 'hi';}
  if (language === 'sq') {return 'sq';}
  if (language === 'ja') {return 'ja';}
  if (language === 'ko') {return 'ko';}
  if (language === 'pt-PT') {return 'pt-PT';}
  if (language === 'pt-BR') {return 'pt-BR';}
  if (language === 'bn') {return 'bn';}
  if (language === 'da') {return 'da';}
  if (language === 'sv') {return 'sv';}
  return 'en';
}

function LegalDocument({navigation, title, sections, theme}: {navigation: {goBack: () => void}; title: string; sections: LegalSection[]; theme: ResolvedAwaTheme}) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <SafeAreaView edges={['left','right']} style={styles.safe}>
    <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />
    <View style={[styles.header, {paddingTop: Math.max(insets.top, 18) + 8}]}>
      <AwaIconButton accessibilityLabel={t('common.back')} icon="chevron-left" onPress={navigation.goBack} variant="tonal" />
      <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{title}</AwaText><View style={styles.spacer}/>
    </View>
    <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom,18)+24}]} showsVerticalScrollIndicator={false}>
      <AwaCard padding="compact" style={styles.notice} variant="filled"><MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={21}/><AwaText colorRole="onSurfaceVariant" style={styles.noticeText} variant="bodySmall">{t('legalDocument.provisionalNotice')}</AwaText></AwaCard>
      {sections.map(section => <AwaCard key={section.title} style={styles.section} variant="filled"><AwaText variant="titleMedium">{section.title}</AwaText><AwaText colorRole="onSurfaceVariant" style={styles.body} variant="bodyMedium">{section.body}</AwaText></AwaCard>)}
    </ScrollView>
  </SafeAreaView>;
}

export function TermsOfUseScreen({navigation}: NativeStackScreenProps<RootStackParamList,'TermsOfUse'>) {
  const {t, i18n} = useTranslation();
  const {theme} = useAwaTheme();
  const lang = resolveLegalLanguage(i18n.language);
  return <LegalDocument navigation={navigation} sections={TERMS[lang]} theme={theme} title={t('about.termsOfUse')}/>;
}
export function PrivacyPolicyScreen({navigation}: NativeStackScreenProps<RootStackParamList,'PrivacyPolicy'>) {
  const {t, i18n} = useTranslation();
  const {theme} = useAwaTheme();
  const lang = resolveLegalLanguage(i18n.language);
  return <LegalDocument navigation={navigation} sections={PRIVACY[lang]} theme={theme} title={t('about.privacyPolicy')}/>;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12},
    title: {flex: 1, textAlign: 'center', paddingHorizontal: 8},
    spacer: {width: 40},
    content: {paddingHorizontal: 16, gap: 12},
    notice: {flexDirection: 'row', alignItems: 'center', gap: 12},
    noticeText: {flex: 1},
    section: {},
    body: {marginTop: 8},
  });
}
