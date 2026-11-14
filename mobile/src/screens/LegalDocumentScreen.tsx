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
type LegalLanguage = 'fr' | 'en' | 'es' | 'tr' | 'ru' | 'de' | 'zh' | 'zh-Hant' | 'id' | 'hi' | 'sq' | 'ja' | 'ko' | 'pt-PT' | 'pt-BR' | 'bn' | 'da' | 'sv' | 'nb' | 'pl' | 'uk' | 'cs' | 'sk' | 'hu' | 'ro' | 'bg' | 'sr' | 'hr' | 'bs' | 'sl' | 'ne' | 'si' | 'th' | 'vi' | 'uz' | 'az' | 'ka' | 'hy' | 'tg' | 'ky' | 'tk' | 'ms' | 'so' | 'sw' | 'kk' | 'wo' | 'ha' | 'am' | 'nl' | 'fi' | 'el' | 'fil' | 'ta' | 'te' | 'mr' | 'gu' | 'pa' | 'my' | 'km' | 'lo' | 'ar' | 'kab' | 'om' | 'ti' | 'rw' | 'rn' | 'ig' | 'yo' | 'zu' | 'xh' | 'sn' | 'ln' | 'ff';

export const TERMS: Record<LegalLanguage, LegalSection[]> = {
  fr: [
    {title: 'Objet', body: 'Ce document présente la structure provisoire des conditions d’utilisation de l’application AWA.'},
    {title: 'Utilisation de l’application', body: 'AWA propose des outils de suivi personnel et de bien-être. Le contenu définitif décrivant les droits et responsabilités des utilisatrices sera ajouté après validation juridique.'},
    {title: 'Disponibilité du service', body: 'Les modalités définitives de disponibilité, de maintenance et d’évolution du service restent à valider.'},
    {title: 'Contact', body: 'Les coordonnées officielles seront ajoutées dès leur validation par l’équipe AWA.'},
  ],
  kab: [
    {title: 'Iswi', body: 'Isemli-a yesskan taɣessa n wakud n tuqqna n tiwtilin n useqdec n AWA.'},
    {title: 'Aseqdec n usnas', body: 'AWA d-yettak ifecka n uḍfar udmawan d tezmert. Agbur ufrin ara yesfeḍ izerfan d tegdilin n yiseqdacen ad yettwarnu ticki tfukk usentem usḍris.'},
    {title: 'Tuƣalin n ugmuḍ', body: 'Tiwtilin tufrinin i yeqqnen ɣer tuɣalin, ameẓlu d usnerni n ugmuḍ mazal ttwaɛeddant ad ttwasentemant.'},
    {title: 'Anermis', body: 'Isalan n unermis ofisyal ad ttwarnun ticki ad ttwasentmen sɣur tarbaɛt n AWA.'},
  ],
  om: [
    {title: 'Kaayyoo', body: 'Sanadni kun gaggeessa yeroo muraasaaf ta\'e haala fayyadama AWA kan agarsiisu dha.'},
    {title: 'Fayyadama appii', body: 'AWA meeshaalee hordoffii dhuunfaa fi gaarummaa ofii ni dhiyeessa. Qabiyyeen dhumaa mirgaa fi itti gaafatamummaa fayyadamtootaa ibsu, madaallii seeraa erga xumuramee booda ni dabalama.'},
    {title: 'Argamuu tajaajilaa', body: 'Haalli dhumaa argamuu, suphaa fi jijjiirama tajaajilaa to\'atu ammallee ni mirkanaa\'a.'},
    {title: 'Quunnamtii', body: 'Odeeffannoon quunnamtii sirrii hojjetaa AWA irraa erga mirkanaa\'ee booda ni dabalama.'},
  ],
  ti: [
    {title: 'ዕላማ', body: 'እዚ ሰነድ ናይ AWA ግዝያዊ መዋቕር ቅጥዕታት ኣጠቓቕማ የቕርብ።'},
    {title: 'ኣጠቓቕማ ኣፕሊኬሽን', body: 'AWA ውልቃዊ ምክትታልን ናይ ጽቡቕ ህላወ መሳርሒታትን የቕርብ። ሕጊታትን ሓላፍነታትን ተጠቀምቲ ዝገልጽ እቲ መወዳእታ ትሕዝቶ ሕጋዊ ምርግጋጽ ምስ ተፈጸመ ክውስኽ እዩ።'},
    {title: 'ተረኽቢነት ኣገልግሎት', body: 'ንተረኽቢነት፣ ሕላዌን ምዕባለን እቲ ኣገልግሎት ዝቆጻጸሩ መወዳእታ ቅጥዕታት ገና ክረጋገጹ ኣለዎም።'},
    {title: 'ርክብ', body: 'ወግዓዊ ዝርዝር ርክብ ብጉጅለ AWA ምስ ተረጋገጸ ክውስኽ እዩ።'},
  ],
  rw: [
    {title: 'Intego', body: 'Iyi nyandiko igaragaza imiterere y\'agateganyo y\'amabwiriza yo gukoresha AWA.'},
    {title: 'Gukoresha porogaramu', body: 'AWA itanga ibikoresho byo kwikurikirana no kwita ku mibereho myiza. Ibikubiyemo byanyuma bisobanura uburenganzira n\'inshingano by\'abakoresha bizongerwamo nyuma y\'uko isuzuma ry\'amategeko rirangira.'},
    {title: 'Kuboneka kwa serivisi', body: 'Amabwiriza yanyuma agenga kuboneka, gusana no guhinduka kwa serivisi aracyategereje kwemezwa.'},
    {title: 'Twandikire', body: 'Amakuru yemewe yo kuvugana natwe azongerwamo nyuma y\'uko ikipe ya AWA iyemeje.'},
  ],
  rn: [
    {title: 'Intego', body: 'Iyi nyandiko yerekana imiterere y’agateganyo y’amategeko yo gukoresha AWA.'},
    {title: 'Gukoresha porogaramu', body: 'AWA itanga ibikoresho vyo kwikurikirana no kwita ku mererwe myiza. Ibikubiyemwo bya nyuma bisobanura uburenganzira n’inshingano vy’abakoresha bizongerwamwo igihe ubwemeranya bw’amategeko buzoba burangiye.'},
    {title: 'Kuboneka kwa serivisi', body: 'Amategeko ya nyuma agenga kuboneka, gukorerwa no guhinduka kwa serivisi aracari gutegerezwa kwemezwa.'},
    {title: 'Kuvugana natwe', body: 'Amakuru yemewe yo kuvugana natwe azongerwamwo igihe itsinda rya AWA rizoba ryayemeje.'},
  ],
  ig: [
    {title: 'Ebumnobi', body: 'Akwụkwọ a na-egosi nhazi nwa oge nke ụkpụrụ iji AWA.'},
    {title: 'Iji ngwa a', body: 'AWA na-enye ngwa maka isoro onwe gị na maka ọdịmma. A ga-agbakwunye ọdịnaya ikpeazụ na-akọwa ikike na ọrụ ndị ọrụ ngwa mgbe nkwenye iwu gwụchara.'},
    {title: 'Ịdị adị nke ọrụ ahụ', body: 'A ka ga-ekwenye ụkpụrụ ikpeazụ na-achịkwa ịdị adị nke ọrụ ahụ, nlekọta ya na mgbanwe ya.'},
    {title: 'Kpọtụrụ anyị', body: 'A ga-agbakwunye ozi kọntaktị gọọmentị mgbe otu AWA kwenyechara ha.'},
  ],
  yo: [
    {title: 'Èrò', body: 'Ìwé yìí ṣàfihàn ìgbékalẹ̀ ìgbà díẹ̀ ti àwọn òfin lílo AWA.'},
    {title: 'Lílo ìṣàfilọ́lẹ̀ náà', body: 'AWA ń pèsè àwọn irinṣẹ́ ìtọpa ti ara ẹni àti ti àlàáfíà. A ó fi àkóónú ìkẹyìn tó ń ṣàpèjúwe àwọn ẹ̀tọ́ àti ojúṣe àwọn olùlò kún un lẹ́yìn tí ìfọwọ́sí òfin bá parí.'},
    {title: 'Wíwà iṣẹ́ náà', body: 'A ṣì ní láti fìdí àwọn òfin ìkẹyìn tó ń ṣàkóso wíwà, ìtọ́jú, àti ìdàgbàsókè iṣẹ́ náà múlẹ̀.'},
    {title: 'Ìbánisọ̀rọ̀', body: 'A ó fi àlàyé ìbánisọ̀rọ̀ osise kún un lẹ́yìn tí ẹgbẹ́ AWA bá ti fọwọ́ sí i.'},
  ],
  zu: [
    {title: 'Inhloso', body: 'Leli dokhumenti lethula isakhiwo sesikhashana semigomo yokusetshenziswa ye-AWA.'},
    {title: 'Ukusebenzisa i-application', body: 'I-AWA inikeza amathuluzi okulandelela nokuphila kahle komuntu siqu. Okuqukethwe kokugcina okuchaza amalungelo nezibopho zabasebenzisi kuzongezwa uma ukuqinisekiswa komthetho sekuphelile.'},
    {title: 'Ukutholakala kwenkonzo', body: 'Imigomo yokugcina elawula ukutholakala, ukulungiswa nokuguquka kwenkonzo isazoqinisekiswa.'},
    {title: 'Xhumana', body: 'Imininingwane esemthethweni yokuxhumana izongezwa uma iqinisekiswe yithimba le-AWA.'},
  ],
  xh: [
    {title: 'Injongo', body: 'Esi sicatshulwa sibonisa ulwakhiwo lwexeshana lweemiqathango yokusetyenziswa kwe-AWA.'},
    {title: 'Ukusetyenziswa kwesicelo', body: 'I-AWA ibonelela ngezixhobo zokuzilandelela nezokukhathalela impilo entle. Umxholo wokugqibela ochaza amalungelo noxanduva lwabasebenzisi uya kongezwa emva kokuba ukuqinisekiswa komthetho kugqityiwe.'},
    {title: 'Ukufumaneka kwenkonzo', body: 'Iimiqathango zokugqibela ezilawula ukufumaneka, ukulungiswa nokuguquka kwenkonzo zisazakuqinisekiswa.'},
    {title: 'Unxibelelwano', body: 'Iinkcukacha ezisemthethweni zonxibelelwano ziya kongezwa emva kokuba ziqinisekiswe liqela le-AWA.'},
  ],
  sn: [
    {title: 'Chinangwa', body: 'Gwaro iri rinoratidza chimiro chekutanga chemitemo yekushandisa AWA.'},
    {title: 'Kushandisa application', body: 'AWA inopa zvishandiso zvekuteverera hutano hwako nekuzvitarisira. Zvinyorwa zvekupedzisira zvine ropafadzo nemabasa evashandisi zvichawedzerwa kana kubvumidzwa pamutemo kwapera.'},
    {title: 'Kuwanikwa kweservisi', body: 'Mitemo yekupedzisira inotarisana nekuwanikwa kweservisi, kugadziridzwa kwayo nekushanduka kwayo icharatidzwa.'},
    {title: 'Kutaura nesu', body: 'Zvekutaura nesu zviri pamutemo zvichawedzerwa kana zvabvumidzwa neboka reAWA.'},
  ],
  ln: [
    {title: 'Mokano', body: 'Ekomi oyo emonisi ndenge ya kobanda ya mibeko ya kosalela AWA.'},
    {title: 'Kosalela application', body: 'AWA epesi bisaleli ya komilandela mpe ya malamu ya nzoto. Makambo ya suka oyo elobeli makoki mpe mikumba ya basaleli ekoyeisama sima ya kondimisama na mibeko.'},
    {title: 'Kozwama ya service', body: 'Mibeko ya suka oyo etali kozwama ya service, kobongisa yango mpe ndenge ekobongwana ezali naino kondimisama.'},
    {title: 'Kosolola na biso', body: 'Bansango ya semba mpo na kosolola na biso ekoyeisama sima ya kondimisama na etuluku ya AWA.'},
  ],
  ff: [
    {title: 'Ko wadi', body: 'Binndol ndin hollii wuro dow sarti huutinirgo AWA ɗi ngonnduɗi tawi tawi.'},
    {title: 'Huutinirgo app ndin', body: 'AWA okki kuutiniraaɗe ngam jaaɓnugo e reenugo ngoolu maa. Winndannde sakiiɗe ɗe ngonnduɗi, ko yiɗi e ko hakkiilo huutinooɓe, wonan ɓeydaama nde seedaago sariya timmi.'},
    {title: 'Ngonka kuugal ndin', body: 'Sarti ɗi ngonnduɗi, ko faati e ndeenka, hesɗitinol e yaadugo kuugal ndin, tawaaki fotde yeeso.'},
    {title: 'Jokkondiral', body: 'Limle jokkondiral jaɓaaɗe ɓeydaama nde tawaaɗe jaɓaama e kuutiniroowo AWA.'},
  ],
  ar: [
    {title: 'الغرض', body: 'تعرض هذه الوثيقة البنية المؤقتة لشروط استخدام AWA.'},
    {title: 'استخدام التطبيق', body: 'يقدّم AWA أدوات للمتابعة الشخصية والعناية بالصحة. وسيُضاف المحتوى النهائي الذي يوضح حقوق المستخدمات ومسؤولياتهن بعد اكتمال المراجعة القانونية.'},
    {title: 'توفّر الخدمة', body: 'لا تزال الشروط النهائية المتعلقة بتوفّر الخدمة وصيانتها وتطويرها قيد التأكيد.'},
    {title: 'التواصل', body: 'ستُضاف بيانات التواصل الرسمية بعد اعتمادها من فريق AWA.'},
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
  'zh-Hant': [
    {title: '目的', body: '本檔案為 AWA 使用條款的臨時結構。'},
    {title: '應用的使用', body: 'AWA 提供個人記錄與健康管理工具。說明使用者權利與責任的正式內容，將在法律稽核完成後補充。'},
    {title: '服務可用性', body: '關於服務可用性、維護與更新的正式條款仍有待確認。'},
    {title: '聯絡方式', body: '官方聯絡方式將在 AWA 團隊確認後補充。'},
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
  nb: [
    {title: 'Formål', body: 'Dette dokumentet presenterer den foreløpige strukturen for brukervilkårene til AWA.'},
    {title: 'Bruk av appen', body: 'AWA tilbyr personlige verktøy for sporing og velvære. Det endelige innholdet som beskriver brukernes rettigheter og ansvar, legges til etter juridisk gjennomgang.'},
    {title: 'Tilgjengelighet av tjenesten', body: 'De endelige vilkårene for tjenestens tilgjengelighet, vedlikehold og utvikling er ennå ikke fastsatt.'},
    {title: 'Kontakt', body: 'Offisielle kontaktopplysninger legges til når de er godkjent av AWA-teamet.'},
  ],
  pl: [
    {title: 'Cel', body: 'Ten dokument przedstawia wstępną strukturę regulaminu AWA.'},
    {title: 'Korzystanie z aplikacji', body: 'AWA oferuje osobiste narzędzia do śledzenia i dbania o dobre samopoczucie. Ostateczna treść opisująca prawa i obowiązki użytkowniczek zostanie dodana po przeglądzie prawnym.'},
    {title: 'Dostępność usługi', body: 'Ostateczne warunki dostępności, utrzymania i rozwoju usługi nie zostały jeszcze ustalone.'},
    {title: 'Kontakt', body: 'Oficjalne dane kontaktowe zostaną dodane po zatwierdzeniu przez zespół AWA.'},
  ],
  uk: [
    {title: 'Мета', body: 'Цей документ представляє попередню структуру умов використання AWA.'},
    {title: 'Користування застосунком', body: 'AWA пропонує персональні інструменти відстеження та турботи про самопочуття. Остаточний текст, що описує права й обов’язки користувачок, буде додано після юридичної перевірки.'},
    {title: 'Доступність сервісу', body: 'Остаточні умови доступності, супроводу та розвитку сервісу ще не визначені.'},
    {title: 'Контакт', body: 'Офіційні контактні дані буде додано після затвердження командою AWA.'},
  ],
  cs: [
    {title: 'Účel', body: 'Tento dokument představuje předběžnou strukturu podmínek použití aplikace AWA.'},
    {title: 'Používání aplikace', body: 'AWA nabízí osobní nástroje pro sledování a péči o pohodu. Konečný text popisující práva a povinnosti uživatelek bude doplněn po právní kontrole.'},
    {title: 'Dostupnost služby', body: 'Konečné podmínky dostupnosti, údržby a rozvoje služby zatím nejsou stanoveny.'},
    {title: 'Kontakt', body: 'Oficiální kontaktní údaje budou doplněny po schválení týmem AWA.'},
  ],
  sk: [
    {title: 'Účel', body: 'Tento dokument predstavuje predbežnú štruktúru podmienok používania aplikácie AWA.'},
    {title: 'Používanie aplikácie', body: 'AWA ponúka osobné nástroje na sledovanie a starostlivosť o pohodu. Konečný text opisujúci práva a povinnosti používateliek bude doplnený po právnej kontrole.'},
    {title: 'Dostupnosť služby', body: 'Konečné podmienky dostupnosti, údržby a vývoja služby zatiaľ nie sú stanovené.'},
    {title: 'Kontakt', body: 'Oficiálne kontaktné údaje budú doplnené po schválení tímom AWA.'},
  ],
  hu: [
    {title: 'Cél', body: 'Ez a dokumentum az AWA alkalmazás felhasználási feltételeinek előzetes szerkezetét mutatja be.'},
    {title: 'Az alkalmazás használata', body: 'Az AWA személyes követési és jóléti eszközöket kínál. A felhasználók jogait és kötelezettségeit leíró végleges szöveg jogi felülvizsgálat után kerül kiegészítésre.'},
    {title: 'A szolgáltatás elérhetősége', body: 'A szolgáltatás elérhetőségére, karbantartására és fejlesztésére vonatkozó végleges feltételek még nincsenek meghatározva.'},
    {title: 'Kapcsolat', body: 'A hivatalos elérhetőségek az AWA csapat jóváhagyása után kerülnek kiegészítésre.'},
  ],
  ro: [
    {title: 'Scop', body: 'Acest document prezintă structura provizorie a condițiilor de utilizare ale aplicației AWA.'},
    {title: 'Utilizarea aplicației', body: 'AWA oferă instrumente personale de monitorizare și de bunăstare. Textul final care descrie drepturile și obligațiile utilizatoarelor va fi completat după o revizuire juridică.'},
    {title: 'Disponibilitatea serviciului', body: 'Condițiile finale privind disponibilitatea, întreținerea și dezvoltarea serviciului nu sunt încă stabilite.'},
    {title: 'Contact', body: 'Datele oficiale de contact vor fi completate după validarea echipei AWA.'},
  ],
  bg: [
    {title: 'Цел', body: 'Този документ представя временната структура на условията за ползване на приложението AWA.'},
    {title: 'Използване на приложението', body: 'AWA предлага лични инструменти за проследяване и благополучие. Окончателният текст, описващ правата и задълженията на потребителките, ще бъде допълнен след правен преглед.'},
    {title: 'Наличност на услугата', body: 'Окончателните условия относно наличността, поддръжката и развитието на услугата все още не са определени.'},
    {title: 'Контакт', body: 'Официалните данни за контакт ще бъдат допълнени след одобрение от екипа на AWA.'},
  ],
  sr: [
    {title: 'Сврха', body: 'Овај документ представља привремену структуру услова коришћења апликације AWA.'},
    {title: 'Коришћење апликације', body: 'AWA нуди личне алате за праћење и благостање. Коначан текст који описује права и обавезе корисница биће допуњен после правне провере.'},
    {title: 'Доступност услуге', body: 'Коначни услови у вези са доступношћу, одржавањем и развојем услуге још нису утврђени.'},
    {title: 'Контакт', body: 'Званични подаци за контакт биће допуњени после одобрења AWA тима.'},
  ],
  hr: [
    {title: 'Svrha', body: 'Ovaj dokument predstavlja privremenu strukturu uvjeta korištenja aplikacije AWA.'},
    {title: 'Korištenje aplikacije', body: 'AWA nudi osobne alate za praćenje i dobrobit. Konačni tekst koji opisuje prava i obveze korisnica bit će dopunjen nakon pravne provjere.'},
    {title: 'Dostupnost usluge', body: 'Konačni uvjeti u vezi s dostupnošću, održavanjem i razvojem usluge još nisu utvrđeni.'},
    {title: 'Kontakt', body: 'Službeni podaci za kontakt bit će dopunjeni nakon odobrenja AWA tima.'},
  ],
  bs: [
    {title: 'Svrha', body: 'Ovaj dokument predstavlja privremenu strukturu uslova korištenja aplikacije AWA.'},
    {title: 'Korištenje aplikacije', body: 'AWA nudi osobne alate za praćenje i dobrobit. Konačni tekst koji opisuje prava i obveze korisnica bit će dopunjen nakon pravne provjere.'},
    {title: 'Dostupnost usluge', body: 'Konačni uslovi u vezi s dostupnošću, održavanjem i razvojem usluge još nisu utvrđeni.'},
    {title: 'Kontakt', body: 'Službeni podaci za kontakt bit će dopunjeni nakon odobrenja AWA tima.'},
  ],
  sl: [
    {title: 'Namen', body: 'Ta dokument predstavlja začasno strukturo pogojev uporabe aplikacije AWA.'},
    {title: 'Uporaba aplikacije', body: 'AWA ponuja osebna orodja za spremljanje in dobro počutje. Končno besedilo, ki opisuje pravice in obveznosti uporabnic, bo dopolnjeno po pravnem pregledu.'},
    {title: 'Razpoložljivost storitve', body: 'Končni pogoji glede razpoložljivosti, vzdrževanja in razvoja storitve še niso določeni.'},
    {title: 'Stik', body: 'Uradni podatki za stik bodo dopolnjeni po potrditvi ekipe AWA.'},
  ],
  ne: [
    {title: 'उद्देश्य', body: 'यो कागजातले AWA एपका प्रयोगका सर्तहरूको अस्थायी संरचना प्रस्तुत गर्छ।'},
    {title: 'एपको प्रयोग', body: 'AWA ले अनुगमन र भलाइका लागि व्यक्तिगत उपकरणहरू प्रदान गर्छ। प्रयोगकर्ताहरूका अधिकार र दायित्व वर्णन गर्ने अन्तिम पाठ कानुनी समीक्षापछि थपिनेछ।'},
    {title: 'सेवाको उपलब्धता', body: 'सेवाको उपलब्धता, मर्मतसम्भार र विकाससम्बन्धी अन्तिम सर्तहरू अझै तय गरिएका छैनन्।'},
    {title: 'सम्पर्क', body: 'आधिकारिक सम्पर्क विवरण AWA टोलीको स्वीकृतिपछि थपिनेछ।'},
  ],
  si: [
    {title: 'අරමුණ', body: 'මෙම ලේඛනය AWA යෙදුමේ භාවිත කොන්දේසි සඳහා තාවකාලික ව්‍යුහයක් ඉදිරිපත් කරයි.'},
    {title: 'යෙදුම භාවිතය', body: 'AWA පසුවිපරම සහ යහපැවැත්ම සඳහා පුද්ගලික මෙවලම් සපයයි. පරිශීලකයන්ගේ අයිතිවාසිකම් සහ වගකීම් විස්තර කරන අවසාන පෙළ නීතිමය සමාලෝචනයෙන් පසු එක් කරනු ලැබේ.'},
    {title: 'සේවාවේ ලබාගත හැකි බව', body: 'සේවාවේ ලබාගත හැකි බව, නඩත්තුව සහ සංවර්ධනය පිළිබඳ අවසාන කොන්දේසි තවමත් තීරණය කර නැත.'},
    {title: 'සම්බන්ධ වීම', body: 'නිල සම්බන්ධතා විස්තර AWA කණ්ඩායමේ අනුමැතියෙන් පසු එක් කරනු ලැබේ.'},
  ],
  th: [
    {title: 'วัตถุประสงค์', body: 'เอกสารนี้นำเสนอโครงร่างชั่วคราวของข้อกำหนดการใช้งานแอป AWA'},
    {title: 'การใช้แอป', body: 'AWA มีเครื่องมือส่วนบุคคลสำหรับการติดตามและความเป็นอยู่ที่ดี ข้อความฉบับสุดท้ายที่อธิบายสิทธิและหน้าที่ของผู้ใช้จะเพิ่มเข้ามาหลังการตรวจสอบทางกฎหมาย'},
    {title: 'ความพร้อมให้บริการ', body: 'ข้อกำหนดสุดท้ายเกี่ยวกับความพร้อมให้บริการ การบำรุงรักษา และการพัฒนา ยังไม่ได้กำหนด'},
    {title: 'การติดต่อ', body: 'รายละเอียดการติดต่ออย่างเป็นทางการจะเพิ่มเข้ามาหลังได้รับการอนุมัติจากทีม AWA'},
  ],
  vi: [
    {title: 'Mục đích', body: 'Tài liệu này trình bày bản phác thảo tạm thời về điều khoản sử dụng ứng dụng AWA.'},
    {title: 'Sử dụng ứng dụng', body: 'AWA cung cấp các công cụ cá nhân để theo dõi và chăm sóc sức khỏe. Văn bản cuối cùng mô tả quyền và nghĩa vụ của người dùng sẽ được bổ sung sau khi được rà soát về mặt pháp lý.'},
    {title: 'Khả dụng của dịch vụ', body: 'Các điều khoản cuối cùng về tính khả dụng, bảo trì và phát triển của dịch vụ chưa được xác định.'},
    {title: 'Liên hệ', body: 'Thông tin liên hệ chính thức sẽ được bổ sung sau khi đội ngũ AWA phê duyệt.'},
  ],
  uz: [
    {title: 'Maqsad', body: 'Ushbu hujjat AWA ilovasidan foydalanish shartlarining vaqtinchalik qoralamasini taqdim etadi.'},
    {title: 'Ilovadan foydalanish', body: 'AWA shaxsiy kuzatuv va farovonlik vositalarini taklif qiladi. Foydalanuvchilarning huquq va majburiyatlarini tavsiflovchi yakuniy matn huquqiy koʻrib chiqishdan keyin qoʻshiladi.'},
    {title: 'Xizmatning mavjudligi', body: 'Xizmatning mavjudligi, texnik xizmat koʻrsatish va rivojlanishi boʻyicha yakuniy shartlar hali belgilanmagan.'},
    {title: 'Aloqa', body: 'Rasmiy aloqa maʼlumotlari AWA jamoasi tasdiqlagandan keyin qoʻshiladi.'},
  ],
  az: [
    {title: 'Məqsəd', body: 'Bu sənəd AWA tətbiqindən istifadə şərtlərinin müvəqqəti layihəsini təqdim edir.'},
    {title: 'Tətbiqdən istifadə', body: 'AWA şəxsi izləmə və rifah vasitələri təklif edir. İstifadəçilərin hüquq və öhdəliklərini təsvir edən yekun mətn hüquqi baxışdan sonra əlavə olunacaq.'},
    {title: 'Xidmətin əlçatanlığı', body: 'Xidmətin əlçatanlığı, texniki xidməti və inkişafı ilə bağlı yekun şərtlər hələ müəyyən edilməyib.'},
    {title: 'Əlaqə', body: 'Rəsmi əlaqə məlumatları AWA komandası tərəfindən təsdiqləndikdən sonra əlavə olunacaq.'},
  ],
  ka: [
    {title: 'მიზანი', body: 'ეს დოკუმენტი წარმოადგენს AWA აპლიკაციის გამოყენების პირობების დროებით პროექტს.'},
    {title: 'აპლიკაციის გამოყენება', body: 'AWA გთავაზობთ პირადი კონტროლისა და კეთილდღეობის ინსტრუმენტებს. საბოლოო ტექსტი, რომელიც მომხმარებლების უფლებებსა და ვალდებულებებს აღწერს, იურიდიული განხილვის შემდეგ დაემატება.'},
    {title: 'სერვისის ხელმისაწვდომობა', body: 'სერვისის ხელმისაწვდომობის, ტექნიკური მომსახურებისა და განვითარების საბოლოო პირობები ჯერ განსაზღვრული არ არის.'},
    {title: 'კონტაქტი', body: 'ოფიციალური საკონტაქტო ინფორმაცია დაემატება AWA-ს გუნდის მიერ დამტკიცების შემდეგ.'},
  ],
  hy: [
    {title: 'Նպատակ', body: 'Այս փաստաթուղթը AWA հավելվածի օգտագործման պայմանների ժամանակավոր նախագիծն է:'},
    {title: 'Հավելվածի օգտագործում', body: 'AWA-ն առաջարկում է անձնական հետևման և բարեկեցության գործիքներ: Օգտատերերի իրավունքներն ու պարտավորությունները նկարագրող վերջնական տեքստը կավելացվի իրավական վերանայումից հետո:'},
    {title: 'Ծառայության հասանելիություն', body: 'Ծառայության հասանելիության, տեխնիկական սպասարկման և զարգացման վերջնական պայմանները դեռ սահմանված չեն:'},
    {title: 'Կոնտակտ', body: 'Պաշտոնական կոնտակտային տեղեկությունը կավելացվի AWA թիմի կողմից հաստատվելուց հետո:'},
  ],
  tg: [
    {title: 'Мақсад', body: 'Ин ҳуҷҷат лоиҳаи муваққатии шартҳои истифодаи барномаи AWA аст.'},
    {title: 'Истифодаи барнома', body: 'AWA абзорҳои пайгирии шахсӣ ва некӯаҳволӣ пешниҳод мекунад. Матни ниҳоие, ки ҳуқуқ ва ӯҳдадориҳои корбаронро тавсиф мекунад, пас аз баррасии ҳуқуқӣ илова карда мешавад.'},
    {title: 'Дастрасии хидмат', body: 'Шартҳои ниҳоии дастрасии хидмат, хизматрасонии техникӣ ва рушд ҳанӯз муайян нашудаанд.'},
    {title: 'Тамос', body: 'Маълумоти расмии тамос пас аз тасдиқ аз ҷониби гурӯҳи AWA илова карда мешавад.'},
  ],
  ky: [
    {title: 'Максат', body: 'Бул документ AWA колдонмосунун колдонуу шарттарынын убактылуу долбоору.'},
    {title: 'Колдонмону колдонуу', body: 'AWA жеке көзөмөлдөө жана жыргалчылык куралдарын сунуштайт. Колдонуучулардын укуктарын жана милдеттерин сүрөттөгөн акыркы текст юридикалык кароодон кийин кошулат.'},
    {title: 'Кызматтын жеткиликтүүлүгү', body: 'Кызматтын жеткиликтүүлүгүнүн, техникалык тейлөөнүн жана өнүгүүнүн акыркы шарттары азырынча аныкталган эмес.'},
    {title: 'Байланыш', body: 'Расмий байланыш маалыматы AWA командасы тарабынан ырасталгандан кийин кошулат.'},
  ],
  tk: [
    {title: 'Maksat', body: 'Bu resminama AWA programmasyny ulanmagyň şertleriniň wagtlaýyn taslamasyny hödürleýär.'},
    {title: 'Programmany ulanmak', body: 'AWA şahsy yzarlama we abadançylyk gurallaryny hödürleýär. Ulanyjylaryň hukuklaryny we borçlaryny suratlandyrýan soňky tekst hukuk gözden geçirilişinden soň goşular.'},
    {title: 'Hyzmatyň elýeterliligi', body: 'Hyzmatyň elýeterliligi, tehniki hyzmaty we ösüşi bilen baglanyşykly soňky şertler heniz kesgitlenmedi.'},
    {title: 'Habarlaşmak', body: 'Resmi habarlaşmak maglumatlary AWA topary tarapyndan tassyklanandan soň goşular.'},
  ],
  ms: [
    {title: 'Tujuan', body: 'Dokumen ini membentangkan struktur sementara bagi terma penggunaan aplikasi AWA.'},
    {title: 'Penggunaan aplikasi', body: 'AWA menawarkan alat penjejakan peribadi dan kesejahteraan. Kandungan muktamad yang menerangkan hak dan tanggungjawab pengguna akan ditambah selepas semakan undang-undang selesai.'},
    {title: 'Ketersediaan perkhidmatan', body: 'Syarat muktamad berkenaan ketersediaan, penyelenggaraan dan pembangunan perkhidmatan masih belum ditetapkan.'},
    {title: 'Hubungan', body: 'Maklumat perhubungan rasmi akan ditambah selepas disahkan oleh pasukan AWA.'},
  ],
  so: [
    {title: 'Ujeeddo', body: 'Dukumentigan wuxuu soo bandhigayaa qaab ku meel gaar ah oo ku saabsan shuruudaha isticmaalka app-ka AWA.'},
    {title: 'Isticmaalka app-ka', body: 'AWA wuxuu bixiyaa qalab la socod shakhsi ah iyo fayoobaan. Macluumaadka kama dambeysta ah ee sharxaya xuquuqda iyo waajibaadka isticmaalaha ayaa lagu dari doonaa ka dib marka dib-u-eegista sharciga la dhammeeyo.'},
    {title: 'Helitaanka adeegga', body: 'Shuruudaha kama dambeysta ah ee ku saabsan helitaanka, dayactirka iyo horumarinta adeegga weli lama go’aamin.'},
    {title: 'Xiriir', body: 'Macluumaadka xiriirka rasmiga ah ayaa lagu dari doonaa ka dib marka kooxda AWA ay xaqiijiso.'},
  ],
  sw: [
    {title: 'Madhumuni', body: 'Hati hii inawasilisha toleo la muda la masharti ya matumizi ya programu ya AWA.'},
    {title: 'Matumizi ya programu', body: 'AWA inatoa zana za ufuatiliaji binafsi na za ustawi. Taarifa za mwisho zinazoeleza haki na wajibu wa mtumiaji zitaongezwa baada ya ukaguzi wa kisheria kukamilika.'},
    {title: 'Upatikanaji wa huduma', body: 'Masharti ya mwisho kuhusu upatikanaji, matengenezo na maendeleo ya huduma bado hayajaamuliwa.'},
    {title: 'Mawasiliano', body: 'Taarifa rasmi za mawasiliano zitaongezwa baada ya kuthibitishwa na timu ya AWA.'},
  ],
  kk: [
    {title: 'Мақсаты', body: 'Бұл құжат AWA қолданбасын пайдалану шарттарының уақытша нұсқасын ұсынады.'},
    {title: 'Қолданбаны пайдалану', body: 'AWA жеке бақылау және әл-ауқат құралдарын ұсынады. Пайдаланушының құқықтары мен міндеттерін түсіндіретін түпкілікті мәлімдемелер заң тұрғысынан тексеру аяқталғаннан кейін қосылады.'},
    {title: 'Қызметтің қолжетімділігі', body: 'Қызметтің қолжетімділігіне, техникалық қызмет көрсетуге және дамуына қатысты түпкілікті шарттар әлі анықталған жоқ.'},
    {title: 'Байланыс', body: 'Ресми байланыс деректері AWA тобы растағаннан кейін қосылады.'},
  ],
  wo: [
    {title: 'Jëmu bind bi', body: 'Kayit bii dafay joxe benn wersiyoŋ bu diir bu gàtt bu sàrti jëfandikoo appli AWA.'},
    {title: 'Jëfandikoo appli bi', body: 'AWA dafay joxe jumtukaay yu topp bu sa bopp ak yu wér. Kàddu yu mujj yu leeral yoon ak wareef yu jëfandikookat dinañu yokk ginnaaw bu seetlu bu yoon mottalee.'},
    {title: 'Am bu sërwis bi', body: 'Sàrti yu mujj yu jëm ci am, topp ak màggug sërwis bi dogalagul ba tey.'},
    {title: 'Jokkoo', body: 'Xibaar yu ofisiyel yu jokkoo dinañu yokk ko bu ekipu AWA dëggalee ko.'},
  ],
  ha: [
    {title: 'Manufar daftarin', body: 'Wannan takarda tana ba da taƙaitaccen sigar sharuɗɗan amfani da manhajar AWA.'},
    {title: 'Amfani da manhajar', body: 'AWA tana ba da kayan bibiyar kai da na lafiya. Za a ƙara sharuɗɗan ƙarshe na doka da nauyin mai amfani bayan an duba su bisa doka.'},
    {title: 'Samuwar sabis', body: 'Sharuɗɗan ƙarshe game da samuwa, kulawa, da ci gaban sabis har yanzu ba a tantance su ba.'},
    {title: 'Tuntuɓa', body: 'Za a ƙara ainihin bayanan tuntuɓa bayan ƙungiyar AWA ta tabbatar da su.'},
  ],
  am: [
    {title: 'የሰነዱ ዓላማ', body: 'ይህ ሰነድ የAWA መተግበሪያን የአጠቃቀም ውሎች ማጠቃለያ ያቀርባል።'},
    {title: 'የመተግበሪያው አጠቃቀም', body: 'AWA የግል ክትትልና የጤና መሣሪያዎችን ይሰጣል። የመጨረሻዎቹ ሕጋዊ ውሎችና የተጠቃሚ ኃላፊነቶች በሕግ ከተረጋገጡ በኋላ ይታከላሉ።'},
    {title: 'የአገልግሎት ተገኝነት', body: 'ስለ አገልግሎቱ ተገኝነት፣ ጥገና እና ዕድገት የመጨረሻዎቹ ውሎች ገና አልተወሰኑም።'},
    {title: 'ግንኙነት', body: 'ትክክለኛው የመገኛ መረጃ በAWA ቡድን ከተረጋገጠ በኋላ ይታከላል።'},
  ],
  nl: [
    {title: 'Doel van het document', body: 'Dit document geeft een samenvatting van de gebruiksvoorwaarden van de AWA-app.'},
    {title: 'Gebruik van de app', body: 'AWA biedt hulpmiddelen voor persoonlijke opvolging en gezondheid. De definitieve juridische voorwaarden en verantwoordelijkheden van gebruikers worden toegevoegd zodra ze juridisch zijn gevalideerd.'},
    {title: 'Beschikbaarheid van de dienst', body: 'De definitieve voorwaarden over beschikbaarheid, onderhoud en ontwikkeling van de dienst zijn nog niet vastgesteld.'},
    {title: 'Contact', body: 'De definitieve contactgegevens worden toegevoegd nadat het AWA-team ze heeft bevestigd.'},
  ],
  fi: [
    {title: 'Asiakirjan tarkoitus', body: 'Tämä asiakirja esittää yhteenvedon AWA-sovelluksen käyttöehdoista.'},
    {title: 'Sovelluksen käyttö', body: 'AWA tarjoaa henkilökohtaisen seurannan ja terveyden työkaluja. Lopulliset oikeudelliset ehdot ja käyttäjien vastuut lisätään, kun ne on validoitu oikeudellisesti.'},
    {title: 'Palvelun saatavuus', body: 'Lopullisia ehtoja palvelun saatavuudesta, ylläpidosta ja kehityksestä ei ole vielä vahvistettu.'},
    {title: 'Yhteystiedot', body: 'Lopulliset yhteystiedot lisätään, kun AWA-tiimi on vahvistanut ne.'},
  ],
  el: [
    {title: 'Σκοπός του εγγράφου', body: 'Αυτό το έγγραφο παρουσιάζει μια σύνοψη των όρων χρήσης της εφαρμογής AWA.'},
    {title: 'Χρήση της εφαρμογής', body: 'Το AWA προσφέρει εργαλεία προσωπικής παρακολούθησης και ευεξίας. Οι τελικοί νομικοί όροι και οι ευθύνες των χρηστών θα προστεθούν μόλις επικυρωθούν νομικά.'},
    {title: 'Διαθεσιμότητα της υπηρεσίας', body: 'Οι τελικοί όροι για τη διαθεσιμότητα, τη συντήρηση και την εξέλιξη της υπηρεσίας δεν έχουν ακόμη επιβεβαιωθεί.'},
    {title: 'Στοιχεία επικοινωνίας', body: 'Τα τελικά στοιχεία επικοινωνίας θα προστεθούν μόλις επιβεβαιωθούν από την ομάδα του AWA.'},
  ],
  fil: [
    {title: 'Layunin ng dokumento', body: 'Nagpapakita ang dokumentong ito ng buod ng mga tuntunin sa paggamit ng AWA application.'},
    {title: 'Paggamit ng application', body: 'Nag-aalok ang AWA ng mga kagamitan para sa personal na pagsubaybay at kagalingan. Idaragdag ang mga pinal na legal na tuntunin at responsibilidad ng mga gumagamit kapag nabeberipika na ang mga ito sa legal na aspeto.'},
    {title: 'Availability ng serbisyo', body: 'Hindi pa nakukumpirma ang mga pinal na tuntunin para sa availability, maintenance, at pag-unlad ng serbisyo.'},
    {title: 'Mga detalye ng pakikipag-ugnayan', body: 'Idaragdag ang mga pinal na detalye ng pakikipag-ugnayan kapag nakumpirma na ng pangkat ng AWA.'},
  ],
  ta: [
    {title: 'ஆவணத்தின் நோக்கம்', body: 'இந்த ஆவணம் AWA செயலியைப் பயன்படுத்துவதற்கான விதிமுறைகளின் சுருக்கத்தை வழங்குகிறது.'},
    {title: 'செயலியின் பயன்பாடு', body: 'AWA தனிப்பட்ட கண்காணிப்புக்கும் நலவாழ்வுக்குமான கருவிகளை வழங்குகிறது. இறுதிச் சட்ட விதிமுறைகளும் பயனர்களின் பொறுப்புகளும் சட்டரீதியாகச் சரிபார்க்கப்பட்ட பின் சேர்க்கப்படும்.'},
    {title: 'சேவையின் கிடைக்கும் தன்மை', body: 'சேவையின் கிடைக்கும் தன்மை, பராமரிப்பு மற்றும் மேம்பாட்டுக்கான இறுதி விதிமுறைகள் இன்னும் உறுதிப்படுத்தப்படவில்லை.'},
    {title: 'தொடர்பு விவரங்கள்', body: 'இறுதித் தொடர்பு விவரங்கள் AWA குழுவால் உறுதிப்படுத்தப்பட்ட பின் சேர்க்கப்படும்.'},
  ],
  te: [
    {title: 'పత్రం ఉద్దేశం', body: 'ఈ పత్రం AWA యాప్ వినియోగ నిబంధనల సారాంశాన్ని అందిస్తుంది.'},
    {title: 'యాప్ వినియోగం', body: 'AWA వ్యక్తిగత ట్రాకింగ్‌కు, శ్రేయస్సుకు సంబంధించిన సాధనాలను అందిస్తుంది. తుది చట్టపరమైన నిబంధనలు, వినియోగదారుల బాధ్యతలు చట్టపరమైన ధృవీకరణ తర్వాత చేర్చబడతాయి.'},
    {title: 'సేవ అందుబాటు', body: 'సేవ అందుబాటు, నిర్వహణ, అభివృద్ధికి సంబంధించిన తుది నిబంధనలు ఇంకా నిర్ధారించబడలేదు.'},
    {title: 'సంప్రదింపు వివరాలు', body: 'తుది సంప్రదింపు వివరాలు AWA బృందం ద్వారా నిర్ధారించబడిన తర్వాత చేర్చబడతాయి.'},
  ],
  mr: [
    {title: 'दस्तऐवजाचा उद्देश', body: 'हा दस्तऐवज AWA अ‍ॅप वापरण्याच्या अटींचा सारांश देतो.'},
    {title: 'अ‍ॅपचा वापर', body: 'AWA वैयक्तिक मागोव्यासाठी आणि सुदृढतेसाठी साधने देते. अंतिम कायदेशीर अटी आणि वापरकर्त्यांच्या जबाबदाऱ्या कायदेशीर पडताळणीनंतर समाविष्ट केल्या जातील.'},
    {title: 'सेवेची उपलब्धता', body: 'सेवेची उपलब्धता, देखभाल आणि सुधारणा यांच्या अंतिम अटी अजून निश्चित केलेल्या नाहीत.'},
    {title: 'संपर्क तपशील', body: 'अंतिम संपर्क तपशील AWA गटाने निश्चित केल्यानंतर समाविष्ट केले जातील.'},
  ],
  gu: [
    {title: 'દસ્તાવેજનો હેતુ', body: 'આ દસ્તાવેજ AWA એપનો ઉપયોગ કરવાની શરતોનો સારાંશ આપે છે.'},
    {title: 'એપનો ઉપયોગ', body: 'AWA વ્યક્તિગત હિસાબ અને સુખાકારી માટે સાધનો આપે છે. અંતિમ કાનૂની શરતો અને વપરાશકર્તાઓની જવાબદારીઓ કાનૂની ચકાસણી પછી સામેલ કરવામાં આવશે.'},
    {title: 'સેવાની ઉપલબ્ધતા', body: 'સેવાની ઉપલબ્ધતા, જાળવણી અને સુધારાની અંતિમ શરતો હજુ નક્કી થઈ નથી.'},
    {title: 'સંપર્ક વિગતો', body: 'અંતિમ સંપર્ક વિગતો AWA ટીમ દ્વારા નક્કી થયા પછી સામેલ કરવામાં આવશે.'},
  ],
  pa: [
    {title: 'ਦਸਤਾਵੇਜ਼ ਦਾ ਉਦੇਸ਼', body: 'ਇਹ ਦਸਤਾਵੇਜ਼ AWA ਐਪ ਦੀ ਵਰਤੋਂ ਦੀਆਂ ਸ਼ਰਤਾਂ ਦਾ ਸਾਰ ਦਿੰਦਾ ਹੈ।'},
    {title: 'ਐਪ ਦੀ ਵਰਤੋਂ', body: 'AWA ਨਿੱਜੀ ਰਿਕਾਰਡ ਅਤੇ ਸਿਹਤ-ਸੰਭਾਲ ਲਈ ਸਾਧਨ ਦਿੰਦੀ ਹੈ। ਅੰਤਿਮ ਕਾਨੂੰਨੀ ਸ਼ਰਤਾਂ ਅਤੇ ਵਰਤੋਂਕਾਰਾਂ ਦੀਆਂ ਜ਼ਿੰਮੇਵਾਰੀਆਂ ਕਾਨੂੰਨੀ ਜਾਂਚ ਤੋਂ ਬਾਅਦ ਸ਼ਾਮਲ ਕੀਤੀਆਂ ਜਾਣਗੀਆਂ।'},
    {title: 'ਸੇਵਾ ਦੀ ਉਪਲਬਧਤਾ', body: 'ਸੇਵਾ ਦੀ ਉਪਲਬਧਤਾ, ਸਾਂਭ-ਸੰਭਾਲ ਅਤੇ ਸੁਧਾਰਾਂ ਦੀਆਂ ਅੰਤਿਮ ਸ਼ਰਤਾਂ ਹਾਲੇ ਤੈਅ ਨਹੀਂ ਹੋਈਆਂ।'},
    {title: 'ਸੰਪਰਕ ਵੇਰਵੇ', body: 'ਅੰਤਿਮ ਸੰਪਰਕ ਵੇਰਵੇ AWA ਟੀਮ ਵੱਲੋਂ ਤੈਅ ਹੋਣ ਤੋਂ ਬਾਅਦ ਸ਼ਾਮਲ ਕੀਤੇ ਜਾਣਗੇ।'},
  ],
  my: [
    {title: 'စာတမ်း၏ ရည်ရွယ်ချက်', body: 'ဤစာတမ်းသည် AWA အက်ပ်ကို အသုံးပြုခြင်းဆိုင်ရာ စည်းကမ်းချက်များကို အကျဉ်းချုပ်ဖော်ပြထားသည်။'},
    {title: 'အက်ပ်အသုံးပြုမှု', body: 'AWA သည် ကိုယ်ရေးမှတ်တမ်းနှင့် ကျန်းမာရေးစောင့်ရှောက်မှုအတွက် ကိရိယာများ ပံ့ပိုးပေးသည်။ နောက်ဆုံးဥပဒေစည်းကမ်းချက်များနှင့် အသုံးပြုသူတာဝန်များကို ဥပဒေစစ်ဆေးပြီးနောက် ထည့်သွင်းမည်။'},
    {title: 'ဝန်ဆောင်မှု ရရှိနိုင်မှု', body: 'ဝန်ဆောင်မှု ရရှိနိုင်မှု၊ ထိန်းသိမ်းမှုနှင့် တိုးတက်မှုဆိုင်ရာ နောက်ဆုံးစည်းကမ်းချက်များကို မသတ်မှတ်ရသေးပါ။'},
    {title: 'ဆက်သွယ်ရန် အချက်အလက်', body: 'နောက်ဆုံးဆက်သွယ်ရန် အချက်အလက်များကို AWA အဖွဲ့က သတ်မှတ်ပြီးနောက် ထည့်သွင်းမည်။'},
  ],
  km: [
    {title: 'គោលបំណង', body: 'ឯកសារនេះបង្ហាញរចនាសម្ព័ន្ធបណ្តោះអាសន្ននៃលក្ខខណ្ឌប្រើប្រាស់របស់ AWA។'},
    {title: 'ការប្រើប្រាស់កម្មវិធី', body: 'AWA ផ្តល់ឧបករណ៍សម្រាប់តាមដានផ្ទាល់ខ្លួន និងសុខុមាលភាព។ មាតិកាចុងក្រោយដែលពិពណ៌នាអំពីសិទ្ធិ និងការទទួលខុសត្រូវរបស់អ្នកប្រើប្រាស់ នឹងត្រូវបានបន្ថែមបន្ទាប់ពីការផ្ទៀងផ្ទាត់ផ្លូវច្បាប់បានបញ្ចប់។'},
    {title: 'ភាពអាចប្រើប្រាស់សេវាកម្មបាន', body: 'លក្ខខណ្ឌចុងក្រោយដែលគ្រប់គ្រងភាពអាចប្រើប្រាស់សេវាកម្មបាន ការថែទាំ និងការអភិវឌ្ឍសេវាកម្ម នៅតែត្រូវបញ្ជាក់។'},
    {title: 'ទំនាក់ទំនង', body: 'ព័ត៌មានទំនាក់ទំនងផ្លូវការនឹងត្រូវបានបន្ថែមបន្ទាប់ពីក្រុមការងារ AWA បានផ្ទៀងផ្ទាត់។'},
  ],
  lo: [
    {title: 'ຈຸດປະສົງ', body: 'ເອກະສານນີ້ນຳສະເໜີໂຄງສ້າງຊົ່ວຄາວຂອງເງື່ອນໄຂການນຳໃຊ້ AWA.'},
    {title: 'ການນຳໃຊ້ແອັບ', body: 'AWA ມີເຄື່ອງມືສຳລັບການຕິດຕາມສ່ວນຕົວ ແລະ ສຸຂະພາບທີ່ດີ. ເນື້ອຫາສຸດທ້າຍທີ່ອະທິບາຍສິດ ແລະ ຄວາມຮັບຜິດຊອບຂອງຜູ້ໃຊ້ ຈະຖືກເພີ່ມເຂົ້າມາເມື່ອການກວດສອບທາງກົດໝາຍສຳເລັດ.'},
    {title: 'ຄວາມພ້ອມໃຫ້ບໍລິການ', body: 'ເງື່ອນໄຂສຸດທ້າຍກ່ຽວກັບຄວາມພ້ອມໃຫ້ບໍລິການ ການບຳລຸງຮັກສາ ແລະ ການພັດທະນາບໍລິການ ຍັງຕ້ອງໄດ້ຮັບການຢືນຢັນ.'},
    {title: 'ຕິດຕໍ່', body: 'ຂໍ້ມູນຕິດຕໍ່ຢ່າງເປັນທາງການຈະຖືກເພີ່ມເຂົ້າມາເມື່ອທີມງານ AWA ກວດສອບແລ້ວ.'},
  ],
};

export const PRIVACY: Record<LegalLanguage, LegalSection[]> = {
  fr: [
    {title: 'Données concernées', body: 'Cette section décrira précisément les données traitées par AWA et leur finalité après validation juridique.'},
    {title: 'Stockage et sécurité', body: 'La documentation définitive précisera les mesures de stockage, de protection et les durées de conservation.'},
    {title: 'Tes droits', body: 'Les procédures permettant d’accéder, corriger ou supprimer les données seront détaillées dans la version validée.'},
    {title: 'Rapports d’erreurs', body: 'Facultatif : désactivé par défaut, activé seulement si tu l’acceptes, et modifiable à tout moment dans Confidentialité & Sécurité. En cas d’erreur ou de plantage, un rapport technique anonyme peut être envoyé à un service de suivi d’erreurs hébergé dans l’Union européenne. Il contient uniquement des informations techniques : modèle et version du système de l’appareil, version d’AWA, état de certaines permissions de l’application (par exemple notifications ou localisation, accordées ou non), batterie, mémoire et stockage, type de connexion, et un identifiant d’installation anonyme qui change si l’application est réinstallée. Il n’est pas destiné à contenir ce que tu saisis, tes données de santé, ton nom, ton e-mail, ton adresse IP ou ta position. Ce texte sera confirmé après validation juridique.'},
    {title: 'Contact confidentialité', body: 'L’adresse officielle du responsable de la confidentialité sera ajoutée avant publication.'},
  ],
  kab: [
    {title: 'Isefka i yeqqnen', body: 'Aḥric-a ad d-yessemɣer s wudem ummid isefka i yettwaxdamen sɣur AWA d uswir-nsen, ticki tfukk usentem usḍris.'},
    {title: 'Aklas d tɣellist', body: 'Isemli ufrin ad d-yesbeggen iswiren n uklas, n ukcam d tallit n uḥrez.'},
    {title: 'Izerfan-ik', body: 'Iswiren n unekcum, n uswever neɣ n tukksa n yisefka-inek ad d-ttwabdarent deg lqem yettwasentmen.'},
    {title: 'Aneqqis n tuccḍiwin', body: 'D afraɣ: yettwasexsi s wudem amezwer, ur yețwarmed ara ala ma tebɛiḍ, tzemreḍ ad t-tbeddleḍ melmi i ak-yehwa deg Tabaḍnit d Tɣellist. Ma tuɣal tuqqna n usnas s tuccḍa neɣ ma yețwagem s wudem uffir, aneqqis uzmir ur nesɛi ara isem yezmer ad yețwaceyyeɛ ɣer ugmuḍ n uḍfar n tuccḍiwin i yețwaḥeṭṭen deg Tuddsa Tamunt n Tarwa. Yesɛa kan isefka uzmiren: tamudemt n yibenk d lqem n unagraw, lqem n AWA, addad n kra n tsiregin n usnas (amedya ilɣa neɣ tamdint, ttwabdarent neɣ xaṭi), tiḥerci, tkatut d uḥraz, anaw n tuqqna, d unekcum n usebded udmawan ur nesɛi ara isem i yettbeddilen ma yețwasbedd usnas i tikkelt-nniḍen. Ur yețwaxdem ara ad yesɛu ayen i tummeḍ, isefka-inek n tezmert, isem-ik, imayl-ik, tansa IP-inek neɣ adig-ik. Aḍris-a ad yettwasentem ticki tfukk usentem usḍris.'},
    {title: 'Anermis n tbaḍnit', body: 'Tansa tuffirt n unermis n unemhal n tbaḍnit ad tettwarna send usuffeɣ.'},
  ],
  om: [
    {title: 'Daataa wal-qabate', body: 'Kutaan kun daataa AWA\'n hojjetamu fi kaayyoo isaa, madaallii seeraa erga xumuramee booda, sirriitti ni ibsa.'},
    {title: 'Kuusuu fi nageenya', body: 'Sanadni dhumaa tooftaalee kuusuu, eegumsa fi turtii eegamu ni ibsa.'},
    {title: 'Mirgoota kee', body: 'Adeemsi daataa kee argachuu, sirreessuu yookaan haquu gosa mirkanaa\'e keessatti bal\'inaan ni ibsama.'},
    {title: 'Gabaasa dogoggoraa', body: 'Filannoo: durumaan cufaadha, yoo ati eyyamte qofa banama, yeroo hundaa Iccitii fi Nageenya keessatti jijjiiruu dandeessa. Appiin dogoggora yoo isa mudate ykn tasumaa yoo cufame, gabaasni teeknikaa maqaa hin qabne tajaajila dogoggora hordofu Gamtaa Awurooppaa keessatti kuufame tokkotti ergamuu danda\'a. Odeeffannoo teeknikaa qofa qaba: moodela meeshaa fi gosa sirna, gosa AWA, haala hayyama appii tokko tokko (fkn beeksisa ykn bakka, kennamee ykn hin kennamne), baatrii, yaadannoo fi kuusaa, gosa wal-qunnamtii, fi lakkoofsa maqaa hin qabne dhaabbii appiin irra deebi\'ee yoo dhaabbate jijjiiramu. Wanta ati barreessitu, odeeffannoo fayyaa kee, maqaa kee, imeelii kee, teessoo IP kee ykn bakka kee akka hin qabaanne ta\'a. Barreeffamni kun erga ilaalcha seeraa xumuramee booda ni mirkanaa\'a.'},
    {title: 'Quunnamtii dhuunfaa', body: 'Teessoon quunnamtii sirrii itti gaafatamaa dhuunfummaa dura maxxansuu ni dabalama.'},
  ],
  ti: [
    {title: 'እተመልከቱ ሓበሬታታት', body: 'እዚ ክፍሊ ሕጋዊ ምርግጋጽ ምስ ተፈጸመ እቲ AWA ዝሰርሖ ሓበሬታን ዕላማኡን ብትክክል ክገልጽ እዩ።'},
    {title: 'ምዕቃብን ድሕንነትን', body: 'እቲ መወዳእታ ሰነድ ኣገባባት ምዕቃብ፣ ሓለዋታትን ግዜ ምዕቃብን ክገልጽ እዩ።'},
    {title: 'መሰላትካ', body: 'ሓበሬታኻ ንምርካብ፣ ንምእራምን ንምድምሳስን ዝግበሩ መስርሓት ኣብቲ ዝተረጋገጸ ስሪት ብዝርዝር ክቐርብ እዩ።'},
    {title: 'ሪፖርታት ስሕተት', body: 'ኣማራጭ እዩ፦ ብመጀመሪያ ዝተዓጽወ እዩ፣ ብምሕላፍካ ጥራይ ይኽፈት፣ ኣብ ዝኾነ እዋን ኣብ ውልቀሰባዊነትን ድሕነትን ክትቕይሮ ትኽእል። እቲ ኣፕሊኬሽን ስሕተት እንተ ኣጋጢሙዎ ወይ ብዘይተጸበናዮ እንተ ተዓጽዩ፣ ስሙ ዘይፍለጥ ቴክኒካዊ ሪፖርት ኣብ ሕብረት ኤውሮጳ ናብ ዘሎ ናይ ስሕተት መክተቢ ኣገልግሎት ክላኣኽ ይኽእል። ቴክኒካዊ ሓበሬታ ጥራይ እዩ ዝሓዝ፡ ሞዴል መሳርሒን ሞዴል ሲስተምን፣ ስሪት AWA፣ ኩነታት ገለ ፍቓዳት ኣፕሊኬሽን (ንኣብነት መፍለጢታት ወይ ቦታ፣ ዝተዋህበ ወይ ዘይተዋህበ)፣ ባትሪ፣ ዝክርን ማህደርን፣ ዓይነት ርክብ፣ ከምኡውን ኣፕሊኬሽኑ ዳግማይ ምስ ተጻዕነ ዝቕየር ስሙ ዘይፍለጥ መጻወቲ መለለዪ። እቲ ዝጽሕፍዎ፣ ሓበሬታ ጥዕናኽ፣ ስምኪ፣ ኢሜይልኪ፣ ኣድራሻ IP ወይ ቦታኽ ከይሕዝ እዩ ዝተሓሰበ። እዚ ጽሑፍ ድሕሪ ሕጋዊ ምርግጋጽ ክረጋገጽ እዩ።'},
    {title: 'ርክብ ብዛዕባ ምስጢራዊነት', body: 'ወግዓዊ ኣድራሻ ርክብ ናይቲ ሓላፊ ምስጢራዊነት ቅድሚ ሕትመት ክውስኽ እዩ።'},
  ],
  rw: [
    {title: 'Amakuru ajyanye', body: 'Iki gice kizasobanura neza amakuru atunganywa na AWA n\'impamvu yabyo, nyuma y\'uko isuzuma ry\'amategeko rirangira.'},
    {title: 'Kubika no gucungira umutekano', body: 'Inyandiko yanyuma izagaragaza ingamba zo kubika, uburyo bwo kurinda n\'igihe amakuru abikwa.'},
    {title: 'Uburenganzira bwawe', body: 'Uburyo bwo kugera ku makuru yawe, kuyakosora cyangwa kuyasiba buzasobanurwa mu nyandiko yemejwe.'},
    {title: 'Raporo z\'amakosa', body: 'Ni ubushake: bifunze ku buryo busanzwe, bifungurwa gusa wemeye, kandi ushobora kubihindura igihe cyose muri Ibanga n\'Umutekano. Iyo porogaramu ihuye n\'ikosa cyangwa igafunga ititeguwe, raporo y\'ikoranabuhanga idafite izina ishobora koherezwa kuri serivisi ikurikirana amakosa iri mu Muryango w\'Ubumwe bw\'u Burayi. Irimo amakuru y\'ikoranabuhanga gusa: ubwoko bw\'igikoresho n\'verisiyo ya sisitemu, verisiyo ya AWA, imiterere y\'uburenganzira bumwe bwa porogaramu (urugero ibimenyesha cyangwa aho uri, byatanzwe cyangwa bitatanzwe), batiri, ububiko n\'umwanya wo kubika, ubwoko bw\'ihuza, n\'indangamuntu y\'ishyirwamo itagira izina ihinduka iyo porogaramu yongeye gushyirwamo. Ntigamije kubamo ibyo wandika, amakuru yawe y\'ubuzima, izina ryawe, imeri yawe, aderesi ya IP cyangwa aho uherereye. Iyi nyandiko izemezwa nyuma y\'isuzuma ry\'amategeko.'},
    {title: 'Kuvugana ku bijyanye n\'ibanga', body: 'Aderesi yemewe yo kuvugana n\'ushinzwe ibanga izongerwamo mbere yo gutangaza.'},
  ],
  rn: [
    {title: 'Amakuru yerekeye', body: 'Iki gice kizosobanura neza amakuru atunganywa na AWA n’impamvu yabyo, igihe ubwemeranya bw’amategeko buzoba burangiye.'},
    {title: 'Kubika n’umutekano', body: 'Inyandiko ya nyuma izosobanura ingingo zo kubika, uburyo bwo kurinda n’igihe amakuru abikwa.'},
    {title: 'Uburenganzira bwawe', body: 'Uburyo bwo kugera ku makuru yawe, kuyakosora canke kuyasiba buzosobanurwa muri verisiyo yemejwe.'},
    {title: 'Raporo z’amakosa', body: 'Ni ku bushake: bifunze mu buryo busanzwe, bifungurwa gusa wemeye, kandi urashobora kubihindura igihe cose muri Ibanga n’Umutekano. Iyo porogaramu ihuye n’ikosa canke igafunga itateguwe, raporo y’ikoranabuhanga idafise izina irashobora koherezwa kuri serivisi ikurikirana amakosa iri mu Muhora w’Ubumwe bw’Uburaya. Irimwo gusa amakuru y’ikoranabuhanga: ubwoko bw’igikoresho na verisiyo ya sisitemu, verisiyo ya AWA, uko zimwe mu ngingo zo kwemererwa za porogaramu ziri (nk’ivyamenyesha canke ahantu, vyahawe canke ntivyahawe), batiri, ububiko n’umwanya wo kubika, ubwoko bw’ihuza, hamwe n’indangamuntu y’ugushiramwo idafise izina ihinduka iyo porogaramu yongeye gushirwamwo. Ntigamije kuba irimwo ivyo wandika, amakuru yawe y’amagara, izina ryawe, imeri yawe, aderese ya IP canke ahantu uri. Iyi nyandiko izokwemezwa nyuma y’isuzuma ry’amategeko.'},
    {title: 'Kuvugana ku buzima bwite', body: 'Aderese yemewe yo kuvugana n’ushinzwe ubuzima bwite izongerwamwo imbere yo gutangazwa.'},
  ],
  ig: [
    {title: 'Data metụtara', body: 'Ngalaba a ga-akọwa nke ọma data AWA na-ahazi na ebumnobi ya, mgbe nkwenye iwu gwụchara.'},
    {title: 'Nchekwa na nchekwa ọdịmma', body: 'Akwụkwọ ikpeazụ ga-akọwapụta usoro nchekwa, nchebe na ogologo oge a na-ekwu.'},
    {title: 'Ikike gị', body: 'A ga-akọwa nke ọma usoro iji nweta, megharịa ma ọ bụ hichapụ data gị n\'ụdị a kwenyere.'},
    {title: 'Akụkọ njehie', body: 'Nhọrọ: a gbanyụrụ ya na mbụ, a na-emepe ya naanị ma ị kwenye, ị nwekwara ike ịgbanwe ya n\'oge ọ bụla na Nzuzo na Nchekwa. Ọ bụrụ na ngwa a nwee njehie ma ọ bụ mechie na mberede, enwere ike iziga akụkọ teknụzụ na-enweghị aha na ọrụ na-esochi njehie nke a na-edebe na Mba Europe. Ọ nwere naanị ozi teknụzụ: ụdị ngwaọrụ na ụdị sistemụ, ụdị AWA, ọnọdụ ikike ụfọdụ nke ngwa (dịka ọmụmaatụ ọkwa ma ọ bụ ọnọdụ, enyere ma ọ bụ enyeghị), batrị, ebe nchekwa na ebe a na-echekwa, ụdị njikọ, na njirimara nrụnye na-enweghị aha nke na-agbanwe ma ọ bụrụ na a wughachi ngwa ahụ. Ebughị n\'obi ka ọ nwee ihe ị na-edeba, data ahụike gị, aha gị, ozi ịntanetị gị, adreesị IP gị ma ọ bụ ebe ị nọ. A ga-ekwenye ederede a mgbe nyochaa iwu gasịrị.'},
    {title: 'Kpọtụrụ maka nzuzo', body: 'A ga-agbakwunye adreesị kọntaktị gọọmentị nke onye na-elekọta nzuzo tupu e bipụta ya.'},
  ],
  yo: [
    {title: 'Dátà tó kàn', body: 'Apá yìí yóò ṣàpèjúwe dátà tí AWA ń ṣiṣẹ́ lé àti ète rẹ̀ ní pàtó, lẹ́yìn tí ìfọwọ́sí òfin bá parí.'},
    {title: 'Ìpamọ́ àti ààbò', body: 'Ìwé ìkẹyìn yóò sọ àwọn ìgbésẹ̀ ìpamọ́, àwọn ààbò, àti àkókò ìtọ́jú dátà.'},
    {title: 'Àwọn ẹ̀tọ́ rẹ', body: 'A ó ṣàlàyé àwọn ìlànà fún wíwọlé, ṣíṣàtúnṣe, tàbí píparẹ́ dátà rẹ nínú ẹ̀yà tí a ti fọwọ́ sí.'},
    {title: 'Àwọn ìròyìn àṣìṣe', body: 'Àṣàyàn ni: a ti pa á ní àkọ́kọ́, a ó tan án nìkan tí o bá gbà, o sì lè yí i padà nígbàkúgbà nínú Àṣírí àti Ààbò. Tí ohun èlò náà bá pàdé àṣìṣe tàbí tó bá tìpa lójijì, a lè fi ìròyìn ìmọ̀-ẹ̀rọ aláìlórúkọ ránṣẹ́ sí iṣẹ́ àtẹ̀lé àṣìṣe tí wọ́n gbà sí Ìgbìmọ̀ Yúróòpù. Ó ní àlàyé ìmọ̀-ẹ̀rọ nìkan: irú ẹ̀rọ àti ẹ̀yà ẹ̀rọ ìṣiṣẹ́, ẹ̀yà AWA, ipò àwọn ìgbàláàyè kan ti ohun èlò náà (bíi àwọn ìkìlọ̀ tàbí ibùdó, tí a fún tàbí tí a kò fún), bátìrì, ìrántí àti ibi ìpamọ́, irú ìsopọ̀, àti àmì ìfisílẹ̀ aláìlórúkọ tó máa yí padà bí a bá tún ohun èlò náà fi sílẹ̀. A kò ní in lọ́kàn pé kó ní ohun tí o kọ, àwọn dátà ìlera rẹ, orúkọ rẹ, ímeèlì rẹ, àdírẹ́sì IP rẹ tàbí ibi tí o wà. A ó fìdí ọ̀rọ̀ yìí múlẹ̀ lẹ́yìn àyẹ̀wò òfin.'},
    {title: 'Ìbánisọ̀rọ̀ ìpamọ́', body: 'A ó fi àdírẹ́sì ìbánisọ̀rọ̀ osise ti olùṣọ́ ìpamọ́ kún un kí a tó tẹ̀ ẹ́ jáde.'},
  ],
  zu: [
    {title: 'Idatha ehlobene', body: 'Lesi sigaba sizochaza ngokucacile idatha ehlelwa yi-AWA nenhloso yayo, uma ukuqinisekiswa komthetho sekuphelile.'},
    {title: 'Ukugcinwa nokuphepha', body: 'Imibhalo yokugcina izobeka ngokucacile izindlela zokugcina, izivikelo nezikhathi zokugcinwa.'},
    {title: 'Amalungelo akho', body: 'Izinqubo zokufinyelela, ukulungisa noma ukususa idatha yakho zizochazwa kabanzi enguqulweni eqinisekisiwe.'},
    {title: 'Imibiko yamaphutha', body: 'Ngokuzikhethela: ivaliwe ngokuzenzakalela, ivulwa kuphela uma uvuma, futhi ungayishintsha noma nini ku-Ubumfihlo nokuphepha. Uma i-app ihlangana nephutha noma iyavaleka ngokungalindelekile, umbiko wezobuchwepheshe ongaziwa igama ungathunyelwa enkonzweni yokulandelela amaphutha ebanjelwe e-European Union. Iqukethe kuphela ulwazi lwezobuchwepheshe: imodeli yedivayisi nenguqulo yesistimu, inguqulo ye-AWA, isimo semvume ethile ye-app (isibonelo izaziso noma indawo, enikeziwe noma cha), ibhethri, inkumbulo nesitoreji, uhlobo lokuxhumeka, nesihlonzi sokufakwa esingaziwa igama esishintsha uma i-app ifakwa kabusha. Ayihlosiwe ukuqukatha okuthayipha kwakho, idatha yakho yezempilo, igama lakho, i-imeyili yakho, ikheli le-IP noma indawo yakho. Lo mbhalo uzoqinisekiswa ngemva kokuqinisekiswa komthetho.'},
    {title: 'Ukuxhumana ngobumfihlo', body: 'Ikheli lokuxhumana elisemthethweni lesikhulu sobumfihlo lizongezwa ngaphambi kokushicilelwa.'},
  ],
  xh: [
    {title: 'Idatha ephambili', body: 'Eli candelo liya kuchaza ngokucacileyo idatha esetyenziswa yi-AWA nenjongo yayo, emva kokuba ukuqinisekiswa komthetho kugqityiwe.'},
    {title: 'Ugcino nokhuseleko', body: 'Amaxwebhu okugqibela aya kuchaza amanyathelo okugcina, uthintelo neenkathi zokugcinwa.'},
    {title: 'Amalungelo akho', body: 'Iinkqubo zokufikelela, zokulungisa okanye zokucima idatha yakho ziya kuchazwa ngokweenkcukacha kwinguqulelo eqinisekisiweyo.'},
    {title: 'Iingxelo zeempazamo', body: 'Ngokuzikhethela: ivaliwe ngokuzenzekelayo, ivulwa kuphela ukuba uyavuma, kwaye unokuyitshintsha nangaliphi na ixesha kwi-Imfihlo kunye noKhuseleko. Ukuba i-app ihlangana nempazamo okanye ivale ngequbuliso, ingxelo yobugcisa engaziwa igama inokuthunyelwa kwinkonzo yokulandelela iimpazamo ebanjelwe kwi-European Union. Iqulethe kuphela ulwazi lobugcisa: imodeli yesixhobo nenguqulo yenkqubo, inguqulo ye-AWA, imeko yeemvume ezithile ze-app (umzekelo izaziso okanye indawo, ezinikiweyo okanye hayi), ibhetri, imemori kunye nokugcinwa, uhlobo lokudibanisa, kunye nesazisi sofakelo esingaziwa igama esitshintshayo ukuba i-app ifakwa kwakhona. Ayizami ukuqulatha oko uchwetheza, idatha yakho yempilo, igama lakho, i-imeyile yakho, idilesi ye-IP okanye indawo yakho. Esi sicatshulwa siya kuqinisekiswa emva kovavanyo lomthetho.'},
    {title: 'Unxibelelwano lwabucala', body: 'Idilesi esemthethweni yonxibelelwano yomphathi wabucala iya kongezwa phambi kokupapashwa.'},
  ],
  sn: [
    {title: 'Data inobatanidzwa', body: 'Chikamu ichi chichatsanangura zvakajeka data inoshandiswa neAWA nechikonzero chayo, kana kubvumidzwa pamutemo kwapera.'},
    {title: 'Kuchengetwa nekuchengetedzwa', body: 'Zvinyorwa zvekupedzisira zvichatsanangura matanho ekuchengeta, kuchengetedza nenguva yekuchengetwa kwedata.'},
    {title: 'Kodzero dzako', body: 'Matanho ekuwana, kugadzirisa kana kudzima data yako achatsanangurwa muchinyorwa chakabvumidzwa.'},
    {title: 'Mushumo wezvikanganiso', body: 'Zvekusarudza: yakadzimwa pakutanga, inovhurwa chete kana wabvuma, uye unogona kuishandura chero nguva muPrivacy neKuchengetedzeka. Kana app yasangana nekanganiso kana kuvhara pakarepo, mushumo wehunyanzvi usina zita unogona kutumirwa kuservisi inotevera zvikanganiso inochengetwa muEuropean Union. Une ruzivo rwehunyanzvi chete: modheri yechishandiso uye vhezheni yesisitimu, vhezheni yeAWA, mamiriro eimwe mvumo dzeapp (somuenzaniso zviziviso kana nzvimbo, dzakapiwa kana kuti kwete), bhatiri, ndangariro nekuchengetera, rudzi rwekubatana, uye chitupa chekuisa chisina zita chinoshanduka kana app yaiswa zvakare. Hazvirevi kuti iine zvaunonyora, data yako yehutano, zita rako, email yako, kero yeIP yako kana nzvimbo yako. Rugwaro urwu ruchasimbiswa mushure mekuongororwa kwemutemo.'},
    {title: 'Kutaura nezvekuchengeta zvakavanzika', body: 'Kero yepamutemo yemubatiri wezvekuchengeta zvakavanzika ichawedzerwa risati raburitswa.'},
  ],
  ln: [
    {title: 'Makambo oyo etali', body: 'Ndimbola oyo ekolimbola malamu makambo oyo AWA esalelaka mpe mpo na nini, sima ya kondimisama na mibeko.'},
    {title: 'Kobomba mpe libateli', body: 'Mokanda ya suka ekolimbola ndenge ya kobomba, bibateli mpe ntango makambo ekobombama.'},
    {title: 'Makoki na yo', body: 'Ndenge ya kotala, kobongisa to kolongola makambo na yo ekolimbolama na lolenge oyo endimisami.'},
    {title: 'Bansango ya mabunga', body: 'Ya bolingi: ekangami na ebandeli, efungolami kaka sokiondimi, mpe okoki kobongola yango ntango nyonso na Bosolo mpe Libateli. Soki application ekutani na libunga to esukoli na kozela te, rapport ya technique oyo ezali na nkombo te ekoki kotindama na service ya kolandela mabunga oyo ezali na Union européenne. Ezali na maloba ya technique kaka: modèle ya appareil mpe version ya système, version ya AWA, ndenge ya ndingisa mosusu ya application (ndakisa bansango to esika, epesameli to te), batterie, mémoire mpe esika ya kobomba, lolenge ya boyokani, mpe nimero ya installation oyo ezali na nkombo te mpe ebongolami soki application ebandi kotiama lisusu. Ezali na mokano te ya kozala na oyo okomi, bansango na yo ya bokolongono, nkombo na yo, email na yo, adresi IP na yo to esika ozali. Mokanda oyo ekondimisama sima ya botali ya mibeko.'},
    {title: 'Kosolola mpo na bomizoto', body: 'Adresse ya semba ya mokambi ya bomizoto ekoyeisama liboso ya kobimisa yango.'},
  ],
  ff: [
    {title: 'Kaalisi ɗi ngoodi', body: 'Bolle ndee hollan no feewi ko kaalisi AWA huutinirta e ngam ko, nde seedaago sariya timmi.'},
    {title: 'Reenugo e kisal', body: 'Winndannde timmunde hollan no reenorta, no kisnorta e ɗuum ɗuum haa ɗum yahdata.'},
    {title: 'Hakkeeji maa', body: 'Laawol ndiyam, hesɗitinol malla ittugo kaalisi maa ngam hollaama e bolle jaɓaaɗe.'},
    {title: 'Ɗerewol ɗe fitinaaji', body: 'Ko jaɓaama: maaɗaama ko sakitaaki, ɗum ɗon udditee tan to a jaɓi, a waawi hesɗitinde ɗum ko ɗum fuu nder Suturo e Reeneego. To jaaɓnirgel ngel yiiti fitinaaji maa ngel maɓɓi ɓaawo ngel anndaaki, ɗerewol teknik ɗo lollirɗo yiɗaa wallitee yaha e kuugal ndaaɗirgol fitinaaji ngal wondi nder Renndo Turo. Ɗum ɗon wuuri tan kabaaruuji teknik: modeel kuutiniraaɗe e wootere sistem, wootere AWA, ngonka yamiroore feere jaaɓnirgel (misaal ko anndinooɗi walla nokku, ko okkaama walla ko okkaaki), batteri, yaadu e dammugal, no jokkondiral wonirta, e limngal bañgal winndaande ndi yaltini ɗum lollirɗo, ndi sakitaa to jaaɓnirgel ngel hesɗitinaama. Ɗum nastaa ko winndu maa, kabaaruuji cellal maa, innde maa, imeel maa, aderes IP maa walla nokku maa. Winndannde ndee mooftanee ɓaawo ndaarngo sariya.'},
    {title: 'Jokkondiral suturaagu', body: 'Ɗerewol jokkondiral jaɓaangol ngam hoodere suturaagu ɓeydaama saa\'i mo ɗum yaltinaaka.'},
  ],
  ar: [
    {title: 'البيانات المعنية', body: 'سيصف هذا القسم بدقة البيانات التي يعالجها AWA والغرض من معالجتها بعد اكتمال المراجعة القانونية.'},
    {title: 'التخزين والأمان', body: 'ستحدد الوثيقة النهائية إجراءات التخزين وسبل الحماية ومدد الاحتفاظ بالبيانات.'},
    {title: 'حقوقك', body: 'ستُفصَّل في النسخة المعتمدة إجراءات الاطلاع على بياناتك أو تصحيحها أو حذفها.'},
    {title: 'تقارير الأخطاء', body: 'اختياري: مُعطَّل افتراضيًا، ولا يُفعَّل إلا بموافقتك، ويمكنك تغييره في أي وقت من «الخصوصية والأمان». إذا واجه التطبيق خطأً أو توقف فجأة، فقد يُرسَل تقرير تقني مجهول الهوية إلى خدمة لتتبع الأخطاء مستضافة في الاتحاد الأوروبي. ويحتوي على معلومات تقنية فقط: طراز الجهاز وإصدار النظام، وإصدار AWA، وحالة بعض أذونات التطبيق (مثل الإشعارات أو الموقع، ممنوحة أم لا)، والبطارية والذاكرة والتخزين، ونوع الاتصال، ومعرّف تثبيت مجهول يتغيّر إذا أُعيد تثبيت التطبيق. ولا يُقصد أن يحتوي على ما تكتبينه، ولا بياناتك الصحية، ولا اسمك أو بريدك الإلكتروني أو عنوان IP أو موقعك. سيُؤكَّد هذا النص بعد المراجعة القانونية.'},
    {title: 'التواصل بشأن الخصوصية', body: 'سيُضاف عنوان التواصل الرسمي للمسؤول عن الخصوصية قبل النشر.'},
  ],
  en: [
    {title: 'Data concerned', body: 'This section will precisely describe the data processed by AWA and its purpose, once legal validation is complete.'},
    {title: 'Storage and security', body: 'The final documentation will specify the storage measures, protections, and retention periods.'},
    {title: 'Your rights', body: 'The procedures for accessing, correcting, or deleting your data will be detailed in the validated version.'},
    {title: 'Error reports', body: 'Optional: off by default, turned on only if you agree, and you can change it at any time in Privacy & Security. If the app encounters an error or crashes, an anonymous technical report may be sent to an error-tracking service hosted in the European Union. It contains technical details only: device model and system version, AWA version, the state of some app permissions (for example notifications or location, granted or not), battery, memory and storage, connection type, and an anonymous installation ID that changes if the app is reinstalled. It is not meant to contain what you enter, your health data, your name, e-mail, IP address or location. This text will be confirmed after legal validation.'},
    {title: 'Privacy contact', body: 'The official contact address for the privacy officer will be added before publication.'},
  ],
  es: [
    {title: 'Datos tratados', body: 'Esta sección describirá con precisión los datos tratados por AWA y su finalidad, tras la validación jurídica.'},
    {title: 'Almacenamiento y seguridad', body: 'La documentación definitiva precisará las medidas de almacenamiento, protección y los plazos de conservación.'},
    {title: 'Tus derechos', body: 'Los procedimientos para acceder, corregir o eliminar los datos se detallarán en la versión validada.'},
    {title: 'Informes de errores', body: 'Opcional: desactivado por defecto, solo se activa si lo aceptas y puedes cambiarlo en cualquier momento en Privacidad y seguridad. Si la aplicación sufre un error o se cierra de forma inesperada, puede enviarse un informe técnico anónimo a un servicio de seguimiento de errores alojado en la Unión Europea. Contiene solo datos técnicos: modelo y versión del sistema del dispositivo, versión de AWA, estado de algunos permisos de la aplicación (por ejemplo, notificaciones o ubicación, concedidos o no), batería, memoria y almacenamiento, tipo de conexión y un identificador de instalación anónimo que cambia si se reinstala la aplicación. No está pensado para contener lo que escribes, tus datos de salud, tu nombre, tu correo, tu dirección IP ni tu ubicación. Este texto se confirmará tras la validación jurídica.'},
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
    {title: 'Hata raporları', body: 'İsteğe bağlı: varsayılan olarak kapalıdır, yalnızca sen kabul edersen açılır ve istediğin zaman Gizlilik ve Güvenlik bölümünden değiştirebilirsin. Uygulama bir hatayla karşılaşırsa veya çökerse, Avrupa Birliği’nde barındırılan bir hata izleme hizmetine anonim bir teknik rapor gönderilebilir. Yalnızca teknik bilgiler içerir: cihaz modeli ve sistem sürümü, AWA sürümü, bazı uygulama izinlerinin durumu (örneğin bildirimler veya konum, verilmiş ya da verilmemiş), pil, bellek ve depolama, bağlantı türü ve uygulama yeniden yüklenirse değişen anonim bir kurulum kimliği. Yazdıklarını, sağlık verilerini, adını, e-postanı, IP adresini veya konumunu içermesi amaçlanmaz. Bu metin hukuki doğrulamadan sonra onaylanacaktır.'},
    {
      title: 'Gizlilik iletişimi',
      body: 'Gizlilik sorumlusunun resmî iletişim adresi, yayımlanmadan önce eklenecektir.',
    },
  ],
  ru: [
    {title: 'Затрагиваемые данные', body: 'После завершения юридической проверки в этом разделе будут точно описаны данные, обрабатываемые AWA, и цель их обработки.'},
    {title: 'Хранение и безопасность', body: 'В окончательной документации будут указаны меры хранения, средства защиты и сроки хранения.'},
    {title: 'Ваши права', body: 'Порядок доступа к вашим данным, их исправления или удаления будет подробно описан в проверенной версии.'},
    {title: 'Отчёты об ошибках', body: 'Необязательно: по умолчанию отключено, включается только с твоего согласия, и это можно изменить в любой момент в разделе «Конфиденциальность и безопасность». Если в приложении возникает ошибка или сбой, анонимный технический отчёт может быть отправлен в сервис отслеживания ошибок, размещённый в Европейском союзе. Он содержит только технические сведения: модель и версию системы устройства, версию AWA, состояние некоторых разрешений приложения (например, уведомлений или геолокации — предоставлены они или нет), заряд батареи, память и хранилище, тип соединения и анонимный идентификатор установки, который меняется при переустановке приложения. Отчёт не должен содержать то, что ты вводишь, твои данные о здоровье, имя, e-mail, IP-адрес или местоположение. Этот текст будет подтверждён после юридической проверки.'},
    {title: 'Контакт по вопросам конфиденциальности', body: 'Официальный адрес ответственного за конфиденциальность будет добавлен до публикации.'},
  ],
  de: [
    {title: 'Betroffene Daten', body: 'Dieser Abschnitt beschreibt nach Abschluss der rechtlichen Prüfung genau, welche Daten AWA verarbeitet und zu welchem Zweck.'},
    {title: 'Speicherung und Sicherheit', body: 'Die endgültige Dokumentation legt die Speichermaßnahmen, Schutzvorkehrungen und Aufbewahrungsfristen fest.'},
    {title: 'Deine Rechte', body: 'Die Verfahren, um auf deine Daten zuzugreifen, sie zu berichtigen oder zu löschen, werden in der geprüften Fassung ausführlich beschrieben.'},
    {title: 'Fehlerberichte', body: 'Freiwillig: standardmäßig ausgeschaltet, nur mit deiner Zustimmung aktiviert und jederzeit unter Datenschutz & Sicherheit änderbar. Wenn in der App ein Fehler oder Absturz auftritt, kann ein anonymer technischer Bericht an einen in der Europäischen Union gehosteten Dienst zur Fehlerverfolgung gesendet werden. Er enthält nur technische Angaben: Gerätemodell und Systemversion, AWA-Version, den Status einiger App-Berechtigungen (zum Beispiel Benachrichtigungen oder Standort, erteilt oder nicht), Akku, Arbeits- und Speicherplatz, Verbindungsart und eine anonyme Installations-ID, die sich bei einer Neuinstallation ändert. Er soll weder deine Eingaben noch deine Gesundheitsdaten, deinen Namen, deine E-Mail-Adresse, deine IP-Adresse oder deinen Standort enthalten. Dieser Text wird nach der rechtlichen Prüfung bestätigt.'},
    {title: 'Datenschutzkontakt', body: 'Die offizielle Kontaktadresse der oder des Datenschutzverantwortlichen wird vor der Veröffentlichung ergänzt.'},
  ],
  zh: [
    {title: '涉及的数据', body: '法律审核完成后，本部分将详细说明 AWA 处理的数据及其用途。'},
    {title: '存储与安全', body: '正式文件将说明存储措施、保护措施和保存期限。'},
    {title: '你的权利', body: '访问、更正或删除你的数据的方式，将在审核通过的版本中详细说明。'},
    {title: '错误报告', body: '此功能为可选项：默认关闭，仅在你同意后开启，并可随时在“隐私与安全”中更改。 应用出现错误或崩溃时，可能会向托管在欧盟的错误跟踪服务发送一份匿名技术报告。报告仅包含技术信息：设备型号和系统版本、AWA 版本、部分应用权限的状态（例如通知或位置权限是否已授予）、电量、内存和存储空间、网络连接类型，以及重新安装应用后会更改的匿名安装标识。报告不应包含你输入的内容、健康数据、姓名、电子邮件、IP 地址或位置。本文内容将在法律审核后确认。'},
    {title: '隐私联系方式', body: '隐私负责人的官方联系地址将在发布前补充。'},
  ],
  'zh-Hant': [
    {title: '涉及的資料', body: '法律稽核完成後，本部分將詳細說明 AWA 處理的資料及其用途。'},
    {title: '儲存與安全', body: '正式檔案將說明儲存措施、保護措施和儲存期限。'},
    {title: '你的權利', body: '訪問、更正或刪除你的資料的方式，將在稽核通過的版本中詳細說明。'},
    {title: '錯誤報告', body: '此功能為選用項目：預設關閉，僅在你同意後開啟，並可隨時在「隱私與安全」中變更。 應用程式發生錯誤或當機時，可能會向託管於歐盟的錯誤追蹤服務傳送一份匿名技術報告。報告僅包含技術資訊：裝置型號與系統版本、AWA 版本、部分應用程式權限的狀態（例如通知或位置權限是否已授予）、電量、記憶體與儲存空間、連線類型，以及重新安裝應用程式後會變更的匿名安裝識別碼。報告不應包含你輸入的內容、健康資料、姓名、電子郵件、IP 位址或位置。本文內容將在法律稽核後確認。'},
    {title: '隱私聯絡方式', body: '隱私負責人的官方聯絡地址將在釋出前補充。'},
  ],
  id: [
    {title: 'Data yang diproses', body: 'Bagian ini akan menjelaskan secara rinci data yang diproses oleh AWA beserta tujuannya, setelah validasi hukum selesai.'},
    {title: 'Penyimpanan dan keamanan', body: 'Dokumen final akan merinci langkah penyimpanan, perlindungan, dan jangka waktu penyimpanan data.'},
    {title: 'Hak Anda', body: 'Tata cara mengakses, memperbaiki, atau menghapus data Anda akan dijelaskan dalam versi yang telah divalidasi.'},
    {title: 'Laporan kesalahan', body: 'Opsional: nonaktif secara bawaan, hanya aktif jika kamu setuju, dan bisa diubah kapan saja di Privasi & Keamanan. Jika aplikasi mengalami kesalahan atau berhenti tiba-tiba, laporan teknis anonim dapat dikirim ke layanan pelacakan kesalahan yang di-host di Uni Eropa. Laporan ini hanya berisi informasi teknis: model perangkat dan versi sistem, versi AWA, status beberapa izin aplikasi (misalnya notifikasi atau lokasi, diberikan atau tidak), baterai, memori dan penyimpanan, jenis koneksi, serta ID instalasi anonim yang berubah jika aplikasi dipasang ulang. Laporan tidak dimaksudkan memuat apa yang kamu ketik, data kesehatanmu, namamu, e-mailmu, alamat IP, atau lokasimu. Teks ini akan dikonfirmasi setelah validasi hukum.'},
    {title: 'Kontak privasi', body: 'Alamat kontak resmi penanggung jawab privasi akan ditambahkan sebelum dipublikasikan.'},
  ],
  hi: [
    {title: 'संबंधित डेटा', body: 'कानूनी जाँच पूरी होने के बाद, यह भाग विस्तार से बताएगा कि AWA कौन-सा डेटा प्रोसेस करता है और किस उद्देश्य से।'},
    {title: 'स्टोरेज और सुरक्षा', body: 'अंतिम दस्तावेज़ में स्टोरेज के उपाय, सुरक्षा के इंतज़ाम और डेटा रखने की अवधि बताई जाएगी।'},
    {title: 'आपके अधिकार', body: 'आपके डेटा को देखने, सुधारने या हटाने की प्रक्रिया जाँचे गए संस्करण में विस्तार से बताई जाएगी।'},
    {title: 'त्रुटि रिपोर्ट', body: 'वैकल्पिक: डिफ़ॉल्ट रूप से बंद, केवल आपकी सहमति से चालू होता है, और आप इसे कभी भी गोपनीयता और सुरक्षा में बदल सकते हैं। ऐप में कोई त्रुटि आने या उसके बंद हो जाने पर, यूरोपीय संघ में होस्ट की गई त्रुटि-निगरानी सेवा को एक गुमनाम तकनीकी रिपोर्ट भेजी जा सकती है। इसमें केवल तकनीकी जानकारी होती है: डिवाइस का मॉडल और सिस्टम संस्करण, AWA का संस्करण, ऐप की कुछ अनुमतियों की स्थिति (जैसे सूचनाएँ या लोकेशन, दी गई हों या नहीं), बैटरी, मेमोरी और स्टोरेज, कनेक्शन का प्रकार, और एक गुमनाम इंस्टॉलेशन आईडी जो ऐप दोबारा इंस्टॉल करने पर बदल जाती है। इसमें आपके द्वारा लिखी गई जानकारी, स्वास्थ्य डेटा, नाम, ईमेल, आईपी पता या लोकेशन शामिल करने का इरादा नहीं है। यह पाठ कानूनी जाँच के बाद पक्का किया जाएगा।'},
    {title: 'गोपनीयता संपर्क', body: 'गोपनीयता अधिकारी का आधिकारिक संपर्क पता प्रकाशन से पहले जोड़ा जाएगा।'},
  ],
  sq: [
    {title: 'Të dhënat që përpunohen', body: 'Ky seksion do të përshkruajë saktësisht të dhënat që përpunon AWA dhe qëllimin e tyre, pasi të përfundojë vlerësimi ligjor.'},
    {title: 'Ruajtja dhe siguria', body: 'Dokumentacioni përfundimtar do të përcaktojë masat e ruajtjes, mbrojtjet dhe afatet e ruajtjes.'},
    {title: 'Të drejtat e tua', body: 'Procedurat për të hyrë, korrigjuar ose fshirë të dhënat e tua do të detajohen në versionin e verifikuar.'},
    {title: 'Raporte gabimesh', body: 'Opsionale: e çaktivizuar si parazgjedhje, aktivizohet vetëm nëse pranon dhe mund ta ndryshosh në çdo kohë te Privatësia dhe siguria. Nëse aplikacioni has një gabim ose mbyllet papritur, mund të dërgohet një raport teknik anonim te një shërbim për ndjekjen e gabimeve i strehuar në Bashkimin Evropian. Ai përmban vetëm të dhëna teknike: modelin dhe versionin e sistemit të pajisjes, versionin e AWA, gjendjen e disa lejeve të aplikacionit (për shembull njoftimet ose vendndodhja, të dhëna ose jo), baterinë, memorien dhe hapësirën ruajtëse, llojin e lidhjes dhe një identifikues instalimi anonim që ndryshon nëse aplikacioni instalohet sërish. Nuk synohet të përmbajë çfarë shkruan ti, të dhënat e tua shëndetësore, emrin, email-in, adresën IP ose vendndodhjen tënde. Ky tekst do të konfirmohet pas vlerësimit ligjor.'},
    {title: 'Kontakti për privatësinë', body: 'Adresa zyrtare e kontaktit të përgjegjësit për privatësinë do të shtohet para publikimit.'},
  ],
  ja: [
    {title: '取り扱うデータ', body: 'このセクションでは、法的な確認が完了したのち、AWAが取り扱うデータとその目的を正確に説明します。'},
    {title: '保管とセキュリティ', body: '最終版の文書では、保管方法、保護対策、保存期間が定められます。'},
    {title: '利用者の権利', body: 'データへのアクセス、訂正、削除の手続きは、確認済みの版で詳しく説明されます。'},
    {title: 'エラーレポート', body: '任意機能です。初期設定ではオフで、同意した場合のみオンになり、「プライバシーとセキュリティ」でいつでも変更できます。 アプリでエラーや強制終了が発生した場合、欧州連合内にホストされたエラー追跡サービスへ、匿名の技術レポートが送信されることがあります。レポートに含まれるのは技術的な情報のみです：端末のモデルとシステムのバージョン、AWAのバージョン、一部のアプリ権限の状態（通知や位置情報などが許可されているかどうか）、バッテリー、メモリとストレージ、接続の種類、そしてアプリを再インストールすると変わる匿名のインストールIDです。入力した内容、健康データ、氏名、メールアドレス、IPアドレス、位置情報は含まれない設計です。この文面は法的な確認ののち確定されます。'},
    {title: 'プライバシーに関するお問い合わせ', body: 'プライバシー責任者の公式な連絡先は、公開前に追加されます。'},
  ],
  ko: [
    {title: '처리하는 데이터', body: '이 항목에서는 법률 검토가 끝난 후 AWA가 처리하는 데이터와 그 목적을 정확히 설명합니다.'},
    {title: '보관 및 보안', body: '최종 문서에는 보관 방식, 보호 조치, 보관 기간이 정해집니다.'},
    {title: '이용자의 권리', body: '데이터에 접근하고 수정하거나 삭제하는 절차는 확정된 버전에서 자세히 안내합니다.'},
    {title: '오류 보고서', body: '선택 사항입니다. 기본값은 꺼짐이며, 동의한 경우에만 켜지고, ‘개인정보 및 보안’에서 언제든 바꿀 수 있습니다. 앱에 오류가 발생하거나 앱이 종료되면, 유럽 연합에 호스팅된 오류 추적 서비스로 익명의 기술 보고서가 전송될 수 있습니다. 보고서에는 기술 정보만 포함됩니다: 기기 모델과 시스템 버전, AWA 버전, 일부 앱 권한의 상태(예: 알림이나 위치 권한의 허용 여부), 배터리, 메모리와 저장 공간, 연결 유형, 그리고 앱을 다시 설치하면 바뀌는 익명 설치 ID입니다. 입력한 내용, 건강 데이터, 이름, 이메일, IP 주소, 위치는 포함되지 않도록 설계되어 있습니다. 이 문구는 법률 검토 후 확정됩니다.'},
    {title: '개인정보 문의', body: '개인정보 보호 책임자의 공식 연락처는 공개 전에 추가됩니다.'},
  ],
  'pt-PT': [
    {title: 'Dados tratados', body: 'Esta secção descreverá com precisão os dados que o AWA trata e as respetivas finalidades, após a validação jurídica.'},
    {title: 'Conservação e segurança', body: 'O documento final definirá o modo de conservação, as medidas de proteção e os prazos de conservação.'},
    {title: 'Direitos do utilizador', body: 'Os procedimentos para aceder, retificar ou eliminar os dados serão detalhados na versão validada.'},
    {title: 'Relatórios de erros', body: 'Facultativo: desativado por predefinição, só é ativado se aceitares e podes alterá-lo a qualquer momento em Privacidade e segurança. Se a aplicação tiver um erro ou fechar inesperadamente, pode ser enviado um relatório técnico anónimo para um serviço de monitorização de erros alojado na União Europeia. Contém apenas informação técnica: modelo e versão do sistema do dispositivo, versão do AWA, estado de algumas permissões da aplicação (por exemplo, notificações ou localização, concedidas ou não), bateria, memória e armazenamento, tipo de ligação e um identificador de instalação anónimo que muda se a aplicação for reinstalada. Não se destina a conter o que escreves, os teus dados de saúde, o teu nome, o teu e-mail, o teu endereço IP ou a tua localização. Este texto será confirmado após a validação jurídica.'},
    {title: 'Contacto sobre privacidade', body: 'O contacto oficial do responsável pela privacidade será acrescentado antes da publicação.'},
  ],
  'pt-BR': [
    {title: 'Dados tratados', body: 'Esta seção descreverá com precisão os dados que o AWA trata e as respectivas finalidades, após a validação jurídica.'},
    {title: 'Armazenamento e segurança', body: 'O documento final definirá a forma de armazenamento, as medidas de proteção e os prazos de retenção.'},
    {title: 'Direitos do usuário', body: 'Os procedimentos para acessar, corrigir ou excluir os dados serão detalhados na versão validada.'},
    {title: 'Relatórios de erros', body: 'Opcional: desativado por padrão, só é ativado se você aceitar e pode ser alterado a qualquer momento em Privacidade e segurança. Se o aplicativo tiver um erro ou fechar inesperadamente, um relatório técnico anônimo pode ser enviado a um serviço de monitoramento de erros hospedado na União Europeia. Ele contém apenas informações técnicas: modelo e versão do sistema do dispositivo, versão do AWA, estado de algumas permissões do aplicativo (por exemplo, notificações ou localização, concedidas ou não), bateria, memória e armazenamento, tipo de conexão e um identificador de instalação anônimo que muda se o aplicativo for reinstalado. Ele não se destina a conter o que você digita, seus dados de saúde, seu nome, seu e-mail, seu endereço IP ou sua localização. Este texto será confirmado após a validação jurídica.'},
    {title: 'Contato sobre privacidade', body: 'O contato oficial do responsável pela privacidade será acrescentado antes da publicação.'},
  ],
  bn: [
    {title: 'প্রক্রিয়াকৃত তথ্য', body: 'আইনি যাচাইয়ের পর এই অংশে AWA কোন তথ্য প্রক্রিয়া করে এবং কী উদ্দেশ্যে করে, তা সুনির্দিষ্টভাবে বর্ণনা করা হবে।'},
    {title: 'সংরক্ষণ ও নিরাপত্তা', body: 'চূড়ান্ত নথিতে তথ্য সংরক্ষণের পদ্ধতি, সুরক্ষা ব্যবস্থা এবং সংরক্ষণের মেয়াদ নির্ধারণ করা হবে।'},
    {title: 'ব্যবহারকারীর অধিকার', body: 'তথ্য দেখা, সংশোধন বা মুছে ফেলার পদ্ধতি যাচাইকৃত সংস্করণে বিস্তারিত জানানো হবে।'},
    {title: 'ত্রুটির রিপোর্ট', body: 'ঐচ্ছিক: ডিফল্টভাবে বন্ধ, শুধু আপনার সম্মতিতে চালু হয়, এবং আপনি যেকোনো সময় গোপনীয়তা ও নিরাপত্তা থেকে বদলাতে পারেন। অ্যাপে কোনো ত্রুটি ঘটলে বা অ্যাপ বন্ধ হয়ে গেলে, ইউরোপীয় ইউনিয়নে হোস্ট করা একটি ত্রুটি-পর্যবেক্ষণ সেবায় বেনামি প্রযুক্তিগত রিপোর্ট পাঠানো হতে পারে। এতে শুধু প্রযুক্তিগত তথ্য থাকে: ডিভাইসের মডেল ও সিস্টেম সংস্করণ, AWA-এর সংস্করণ, অ্যাপের কিছু অনুমতির অবস্থা (যেমন বিজ্ঞপ্তি বা লোকেশন, দেওয়া হয়েছে কি না), ব্যাটারি, মেমোরি ও স্টোরেজ, সংযোগের ধরন এবং একটি বেনামি ইনস্টলেশন আইডি, যা অ্যাপ আবার ইনস্টল করলে বদলে যায়। আপনি যা লেখেন, আপনার স্বাস্থ্যতথ্য, নাম, ইমেইল, আইপি ঠিকানা বা অবস্থান এতে রাখার উদ্দেশ্য নেই। এই লেখাটি আইনি যাচাইয়ের পর নিশ্চিত করা হবে।'},
    {title: 'গোপনীয়তা বিষয়ক যোগাযোগ', body: 'গোপনীয়তা দায়িত্বপ্রাপ্ত ব্যক্তির আনুষ্ঠানিক যোগাযোগের তথ্য প্রকাশের আগে যোগ করা হবে।'},
  ],
  da: [
    {title: 'Berørte data', body: 'Dette afsnit vil præcist beskrive de data, AWA behandler, og formålet hermed, når den juridiske validering er afsluttet.'},
    {title: 'Opbevaring og sikkerhed', body: 'Den endelige dokumentation vil specificere opbevaringsforanstaltninger, beskyttelse og opbevaringsperioder.'},
    {title: 'Dine rettigheder', body: 'Procedurerne for at få adgang til, rette eller slette dine data vil blive beskrevet i den validerede version.'},
    {title: 'Fejlrapporter', body: 'Valgfrit: slået fra som standard, slås kun til, hvis du accepterer, og kan ændres når som helst under Privatliv og sikkerhed. Hvis appen støder på en fejl eller går ned, kan der sendes en anonym teknisk rapport til en fejlsporingstjeneste, der er hostet i EU. Den indeholder kun tekniske oplysninger: enhedens model og systemversion, AWA-version, status for nogle apptilladelser (for eksempel notifikationer eller placering, givet eller ej), batteri, hukommelse og lager, forbindelsestype og et anonymt installations-id, der ændres, hvis appen geninstalleres. Den er ikke beregnet til at indeholde det, du skriver, dine sundhedsdata, dit navn, din e-mail, din IP-adresse eller din placering. Denne tekst bekræftes efter juridisk validering.'},
    {title: 'Kontakt vedr. privatlivspolitik', body: 'Den officielle kontaktadresse for databeskyttelsesansvarlig tilføjes inden offentliggørelse.'},
  ],
  sv: [
    {title: 'Berörda uppgifter', body: 'Det här avsnittet kommer att exakt beskriva de uppgifter som AWA behandlar och syftet med dem, när den juridiska granskningen är klar.'},
    {title: 'Lagring och säkerhet', body: 'Den slutliga dokumentationen kommer att specificera lagringsåtgärder, skyddsåtgärder och lagringstider.'},
    {title: 'Dina rättigheter', body: 'Rutinerna för att få tillgång till, rätta eller radera dina uppgifter beskrivs i den validerade versionen.'},
    {title: 'Felrapporter', body: 'Valfritt: avstängt som standard, aktiveras bara om du godkänner och kan ändras när som helst under Integritet och säkerhet. Om appen stöter på ett fel eller kraschar kan en anonym teknisk rapport skickas till en felspårningstjänst som är värd i EU. Den innehåller bara tekniska uppgifter: enhetens modell och systemversion, AWA-version, status för vissa apptillstånd (till exempel aviseringar eller plats, beviljade eller inte), batteri, minne och lagring, anslutningstyp och ett anonymt installations-ID som ändras om appen installeras om. Den är inte avsedd att innehålla det du skriver, dina hälsouppgifter, ditt namn, din e-postadress, din IP-adress eller din plats. Den här texten bekräftas efter juridisk granskning.'},
    {title: 'Kontakt integritet', body: 'Den officiella kontaktadressen till dataskyddsombudet läggs till före publicering.'},
  ],
  nb: [
    {title: 'Berørte data', body: 'Denne delen vil nøyaktig beskrive dataene AWA behandler og formålet med dem, når den juridiske gjennomgangen er ferdig.'},
    {title: 'Lagring og sikkerhet', body: 'Den endelige dokumentasjonen vil spesifisere lagringstiltak, beskyttelsestiltak og oppbevaringstider.'},
    {title: 'Dine rettigheter', body: 'Fremgangsmåtene for å få tilgang til, rette eller slette dataene dine beskrives i den validerte versjonen.'},
    {title: 'Feilrapporter', body: 'Valgfritt: av som standard, slås bare på hvis du godtar, og kan endres når som helst under Personvern og sikkerhet. Hvis appen får en feil eller krasjer, kan det sendes en anonym teknisk rapport til en feilsporingstjeneste som er driftet i EU. Den inneholder bare tekniske opplysninger: enhetens modell og systemversjon, AWA-versjon, status for noen apptillatelser (for eksempel varsler eller posisjon, gitt eller ikke), batteri, minne og lagring, tilkoblingstype og en anonym installasjons-ID som endres hvis appen installeres på nytt. Den er ikke ment å inneholde det du skriver, helsedataene dine, navnet ditt, e-postadressen din, IP-adressen din eller posisjonen din. Denne teksten bekreftes etter juridisk gjennomgang.'},
    {title: 'Kontakt om personvern', body: 'Den offisielle kontaktadressen til personvernombudet legges til før publisering.'},
  ],
  pl: [
    {title: 'Przetwarzane dane', body: 'Ta sekcja dokładnie opisze dane przetwarzane przez AWA oraz cele ich przetwarzania po zakończeniu przeglądu prawnego.'},
    {title: 'Przechowywanie i bezpieczeństwo', body: 'Ostateczna dokumentacja określi środki przechowywania, zabezpieczenia i okresy przechowywania danych.'},
    {title: 'Twoje prawa', body: 'Sposoby uzyskania dostępu do danych, ich sprostowania lub usunięcia zostaną opisane w zatwierdzonej wersji.'},
    {title: 'Raporty o błędach', body: 'Opcjonalne: domyślnie wyłączone, włączane tylko za Twoją zgodą i możliwe do zmiany w każdej chwili w Prywatności i bezpieczeństwie. Jeśli w aplikacji wystąpi błąd lub nastąpi jej awaryjne zamknięcie, anonimowy raport techniczny może zostać wysłany do usługi śledzenia błędów hostowanej w Unii Europejskiej. Zawiera on wyłącznie informacje techniczne: model urządzenia i wersję systemu, wersję AWA, stan niektórych uprawnień aplikacji (na przykład powiadomień lub lokalizacji — przyznanych lub nie), baterię, pamięć i miejsce na dane, typ połączenia oraz anonimowy identyfikator instalacji, który zmienia się po ponownej instalacji aplikacji. Nie ma zawierać tego, co wpisujesz, Twoich danych o zdrowiu, imienia, adresu e-mail, adresu IP ani lokalizacji. Ten tekst zostanie potwierdzony po przeglądzie prawnym.'},
    {title: 'Kontakt w sprawie prywatności', body: 'Oficjalny adres kontaktowy inspektora ochrony danych zostanie dodany przed publikacją.'},
  ],
  uk: [
    {title: 'Оброблювані дані', body: 'Цей розділ точно описуватиме дані, які обробляє AWA, та цілі їхньої обробки після завершення юридичної перевірки.'},
    {title: 'Зберігання та безпека', body: 'Остаточна документація визначить заходи зберігання, засоби захисту та строки зберігання даних.'},
    {title: 'Ваші права', body: 'Способи доступу до ваших даних, їх виправлення або видалення будуть описані в затвердженій версії.'},
    {title: 'Звіти про помилки', body: 'Необов’язково: за замовчуванням вимкнено, вмикається лише за твоєю згодою, і це можна змінити будь-коли в розділі «Конфіденційність і безпека». Якщо в застосунку трапляється помилка або збій, анонімний технічний звіт може бути надісланий до сервісу відстеження помилок, розміщеного в Європейському Союзі. Він містить лише технічні відомості: модель і версію системи пристрою, версію AWA, стан деяких дозволів застосунку (наприклад, сповіщень чи геолокації — надано їх чи ні), заряд батареї, пам’ять і сховище, тип з’єднання та анонімний ідентифікатор встановлення, який змінюється після перевстановлення застосунку. Звіт не призначений містити те, що ти вводиш, твої дані про здоров’я, ім’я, e-mail, IP-адресу чи місцеперебування. Цей текст буде підтверджено після юридичної перевірки.'},
    {title: 'Контакт із питань конфіденційності', body: 'Офіційну контактну адресу відповідальної особи із захисту даних буде додано перед публікацією.'},
  ],
  cs: [
    {title: 'Zpracovávaná data', body: 'Tato sekce přesně popíše data, která AWA zpracovává, a účely jejich zpracování po dokončení právní kontroly.'},
    {title: 'Uložení a zabezpečení', body: 'Konečná dokumentace určí opatření k ukládání, ochranná opatření a lhůty uchování dat.'},
    {title: 'Vaše práva', body: 'Způsoby, jak získat přístup ke svým datům, opravit je nebo je smazat, budou popsány ve schválené verzi.'},
    {title: 'Hlášení o chybách', body: 'Nepovinné: ve výchozím stavu vypnuto, zapne se jen s tvým souhlasem a můžeš to kdykoli změnit v Soukromí a zabezpečení. Pokud v aplikaci dojde k chybě nebo pádu, může být anonymní technické hlášení odesláno službě pro sledování chyb hostované v Evropské unii. Obsahuje pouze technické údaje: model zařízení a verzi systému, verzi AWA, stav některých oprávnění aplikace (například oznámení nebo polohy, udělených či ne), baterii, paměť a úložiště, typ připojení a anonymní identifikátor instalace, který se změní po přeinstalaci aplikace. Nemá obsahovat to, co zadáváš, tvé zdravotní údaje, jméno, e-mail, IP adresu ani polohu. Tento text bude potvrzen po právní kontrole.'},
    {title: 'Kontakt ve věci soukromí', body: 'Oficiální kontaktní adresa pověřence pro ochranu osobních údajů bude doplněna před zveřejněním.'},
  ],
  sk: [
    {title: 'Spracúvané údaje', body: 'Táto sekcia presne opíše údaje, ktoré AWA spracúva, a účely ich spracúvania po dokončení právnej kontroly.'},
    {title: 'Uloženie a zabezpečenie', body: 'Konečná dokumentácia určí opatrenia na ukladanie, ochranné opatrenia a lehoty uchovávania údajov.'},
    {title: 'Vaše práva', body: 'Spôsoby, ako získať prístup k svojim údajom, opraviť ich alebo ich vymazať, budú opísané v schválenej verzii.'},
    {title: 'Hlásenia o chybách', body: 'Nepovinné: v predvolenom stave vypnuté, zapne sa len s tvojím súhlasom a môžeš to kedykoľvek zmeniť v Súkromí a zabezpečení. Ak v aplikácii dôjde k chybe alebo pádu, môže sa anonymné technické hlásenie odoslať službe na sledovanie chýb hostovanej v Európskej únii. Obsahuje iba technické údaje: model zariadenia a verziu systému, verziu AWA, stav niektorých povolení aplikácie (napríklad oznámení alebo polohy, udelených či nie), batériu, pamäť a úložisko, typ pripojenia a anonymný identifikátor inštalácie, ktorý sa zmení po opätovnej inštalácii aplikácie. Nemá obsahovať to, čo zadávaš, tvoje zdravotné údaje, meno, e-mail, IP adresu ani polohu. Tento text bude potvrdený po právnej kontrole.'},
    {title: 'Kontakt vo veci súkromia', body: 'Oficiálna kontaktná adresa zodpovednej osoby za ochranu osobných údajov bude doplnená pred zverejnením.'},
  ],
  hu: [
    {title: 'Kezelt adatok', body: 'Ez a rész a jogi felülvizsgálat befejezése után pontosan leírja az AWA által kezelt adatokat és kezelésük céljait.'},
    {title: 'Tárolás és biztonság', body: 'A végleges dokumentáció meghatározza a tárolási intézkedéseket, a védelmi intézkedéseket és az adatok megőrzési idejét.'},
    {title: 'Az Ön jogai', body: 'Az adatokhoz való hozzáférés, azok helyesbítése vagy törlése módját a jóváhagyott változat írja le.'},
    {title: 'Hibajelentések', body: 'Választható: alapértelmezetten ki van kapcsolva, csak a beleegyezéseddel kapcsol be, és bármikor módosíthatod az Adatvédelem és biztonság menüben. Ha az alkalmazás hibába ütközik vagy összeomlik, névtelen technikai jelentés küldhető egy az Európai Unióban üzemeltetett hibakövető szolgáltatásnak. Ez kizárólag technikai adatokat tartalmaz: az eszköz modelljét és rendszerverzióját, az AWA verzióját, egyes alkalmazásengedélyek állapotát (például értesítések vagy helymeghatározás, megadva vagy nem), az akkumulátort, a memóriát és a tárhelyet, a kapcsolat típusát, valamint egy névtelen telepítési azonosítót, amely az alkalmazás újratelepítésekor megváltozik. Nem célja, hogy tartalmazza azt, amit beírsz, az egészségügyi adataidat, a neved, az e-mail-címed, az IP-címed vagy a tartózkodási helyed. Ezt a szöveget jogi felülvizsgálat után erősítjük meg.'},
    {title: 'Kapcsolat adatvédelmi ügyekben', body: 'Az adatvédelmi felelős hivatalos elérhetősége a közzététel előtt kerül kiegészítésre.'},
  ],
  ro: [
    {title: 'Datele prelucrate', body: 'Această secțiune va descrie cu precizie datele prelucrate de AWA și scopurile prelucrării lor, după finalizarea revizuirii juridice.'},
    {title: 'Stocare și securitate', body: 'Documentația finală va defini măsurile de stocare, măsurile de protecție și durata de păstrare a datelor.'},
    {title: 'Drepturile tale', body: 'Modalitățile de acces la date, de rectificare sau de ștergere a acestora vor fi descrise în versiunea aprobată.'},
    {title: 'Rapoarte de erori', body: 'Opțional: dezactivat implicit, se activează doar cu acordul tău și poate fi schimbat oricând în Confidențialitate și securitate. Dacă aplicația întâmpină o eroare sau se oprește brusc, un raport tehnic anonim poate fi trimis către un serviciu de urmărire a erorilor găzduit în Uniunea Europeană. Acesta conține doar informații tehnice: modelul dispozitivului și versiunea sistemului, versiunea AWA, starea unor permisiuni ale aplicației (de exemplu notificări sau locație, acordate sau nu), bateria, memoria și spațiul de stocare, tipul conexiunii și un identificator de instalare anonim care se schimbă dacă aplicația este reinstalată. Nu este destinat să conțină ce introduci, datele tale de sănătate, numele, e-mailul, adresa IP sau locația ta. Acest text va fi confirmat după validarea juridică.'},
    {title: 'Contact pentru confidențialitate', body: 'Datele oficiale de contact ale responsabilului cu protecția datelor vor fi completate înainte de publicare.'},
  ],
  bg: [
    {title: 'Обработвани данни', body: 'Този раздел ще опише точно данните, които AWA обработва, и целите на обработката им, след приключване на правния преглед.'},
    {title: 'Съхранение и сигурност', body: 'Окончателната документация ще определи мерките за съхранение, мерките за защита и срока на съхранение на данните.'},
    {title: 'Твоите права', body: 'Начините за достъп до данните, за коригирането или изтриването им ще бъдат описани в одобрената версия.'},
    {title: 'Доклади за грешки', body: 'По избор: изключено по подразбиране, включва се само с твоето съгласие и можеш да го промениш по всяко време в „Поверителност и сигурност“. Ако в приложението възникне грешка или то се срине, анонимен технически доклад може да бъде изпратен до услуга за проследяване на грешки, хоствана в Европейския съюз. Той съдържа само технически данни: модел на устройството и версия на системата, версия на AWA, състояние на някои разрешения на приложението (например известия или местоположение — дадени или не), батерия, памет и хранилище, тип на връзката и анонимен идентификатор на инсталацията, който се променя при преинсталиране на приложението. Не е предназначен да съдържа това, което въвеждаш, твоите здравни данни, име, имейл, IP адрес или местоположение. Този текст ще бъде потвърден след правен преглед.'},
    {title: 'Контакт за поверителност', body: 'Официалните данни за контакт на отговорника по защита на данните ще бъдат допълнени преди публикуването.'},
  ],
  sr: [
    {title: 'Обрађени подаци', body: 'Овај одељак ће прецизно описати податке које AWA обрађује и сврхе њихове обраде, после завршетка правне провере.'},
    {title: 'Чување и безбедност', body: 'Коначна документација ће одредити мере чувања, мере заштите и рок чувања података.'},
    {title: 'Твоја права', body: 'Начини приступа подацима, њиховог исправљања или брисања биће описани у одобреној верзији.'},
    {title: 'Извештаји о грешкама', body: 'Необавезно: подразумевано искључено, укључује се само уз твоју сагласност и можеш то променити у било ком тренутку у делу „Приватност и безбедност“. Ако апликација наиђе на грешку или се неочекивано затвори, анонимни технички извештај може бити послат сервису за праћење грешака који се налази у Европској унији. Садржи само техничке податке: модел уређаја и верзију система, верзију AWA, стање неких дозвола апликације (на пример обавештења или локација, дозвољене или не), батерију, меморију и простор за складиштење, врсту везе и анонимни идентификатор инсталације који се мења ако се апликација поново инсталира. Није намењен да садржи оно што уносиш, твоје здравствене податке, име, имејл, IP адресу или локацију. Овај текст ће бити потврђен после правне провере.'},
    {title: 'Контакт за приватност', body: 'Званични подаци за контакт лица задуженог за заштиту података биће допуњени пре објављивања.'},
  ],
  hr: [
    {title: 'Obrađeni podaci', body: 'Ovaj će odjeljak precizno opisati podatke koje AWA obrađuje i svrhe njihove obrade, nakon završetka pravne provjere.'},
    {title: 'Pohrana i sigurnost', body: 'Konačna dokumentacija odredit će mjere pohrane, mjere zaštite i rok čuvanja podataka.'},
    {title: 'Tvoja prava', body: 'Načini pristupa podacima, njihova ispravka ili brisanja bit će opisani u odobrenoj verziji.'},
    {title: 'Izvješća o pogreškama', body: 'Neobvezno: prema zadanim postavkama isključeno, uključuje se samo uz tvoj pristanak i možeš to promijeniti u bilo kojem trenutku u Privatnosti i sigurnosti. Ako aplikacija naiđe na pogrešku ili se neočekivano zatvori, anonimno tehničko izvješće može se poslati usluzi za praćenje pogrešaka smještenoj u Europskoj uniji. Sadrži samo tehničke podatke: model uređaja i verziju sustava, verziju AWA, stanje nekih dozvola aplikacije (na primjer obavijesti ili lokacije, odobrene ili ne), bateriju, memoriju i pohranu, vrstu veze i anonimni identifikator instalacije koji se mijenja ako se aplikacija ponovno instalira. Nije namijenjeno da sadrži ono što upisuješ, tvoje zdravstvene podatke, ime, e-adresu, IP adresu ili lokaciju. Ovaj tekst bit će potvrđen nakon pravne provjere.'},
    {title: 'Kontakt za privatnost', body: 'Službeni podaci za kontakt osobe zadužene za zaštitu podataka bit će dopunjeni prije objave.'},
  ],
  bs: [
    {title: 'Obrađeni podaci', body: 'Ovaj će odjeljak precizno opisati podatke koje AWA obrađuje i svrhe njihove obrade, nakon završetka pravne provjere.'},
    {title: 'Pohrana i sigurnost', body: 'Konačna dokumentacija odredit će mjere pohrane, mjere zaštite i rok čuvanja podataka.'},
    {title: 'Tvoja prava', body: 'Načini pristupa podacima, njihova ispravka ili brisanja bit će opisani u odobrenoj verziji.'},
    {title: 'Izvještaji o greškama', body: 'Opcionalno: prema zadanim postavkama isključeno, uključuje se samo uz tvoj pristanak i možeš to promijeniti u bilo kojem trenutku u Privatnosti i sigurnosti. Ako aplikacija naiđe na grešku ili se neočekivano zatvori, anonimni tehnički izvještaj može se poslati usluzi za praćenje grešaka smještenoj u Evropskoj uniji. Sadrži samo tehničke podatke: model uređaja i verziju sistema, verziju AWA, stanje nekih dozvola aplikacije (na primjer obavještenja ili lokacije, odobrene ili ne), bateriju, memoriju i pohranu, vrstu veze i anonimni identifikator instalacije koji se mijenja ako se aplikacija ponovo instalira. Nije namijenjen da sadrži ono što upisuješ, tvoje zdravstvene podatke, ime, e-adresu, IP adresu ili lokaciju. Ovaj tekst bit će potvrđen nakon pravne provjere.'},
    {title: 'Kontakt za privatnost', body: 'Službeni podaci za kontakt osobe zadužene za zaštitu podataka bit će dopunjeni prije objave.'},
  ],
  sl: [
    {title: 'Obdelani podatki', body: 'Ta razdelek bo natančno opisal podatke, ki jih AWA obdeluje, in namene njihove obdelave, po zaključku pravnega pregleda.'},
    {title: 'Shranjevanje in varnost', body: 'Končna dokumentacija bo določila ukrepe shranjevanja, ukrepe zaščite in rok hrambe podatkov.'},
    {title: 'Tvoje pravice', body: 'Načini dostopa do podatkov, njihovega popravka ali izbrisa bodo opisani v potrjeni različici.'},
    {title: 'Poročila o napakah', body: 'Neobvezno: privzeto izklopljeno, vklopi se samo z tvojo privolitvijo in to lahko kadar koli spremeniš v Zasebnosti in varnosti. Če aplikacija naleti na napako ali se nepričakovano zapre, se lahko anonimno tehnično poročilo pošlje storitvi za sledenje napakam, ki gostuje v Evropski uniji. Vsebuje samo tehnične podatke: model naprave in različico sistema, različico AWA, stanje nekaterih dovoljenj aplikacije (na primer obvestil ali lokacije, odobrenih ali ne), baterijo, pomnilnik in shrambo, vrsto povezave ter anonimni identifikator namestitve, ki se spremeni, če aplikacijo ponovno namestiš. Ni namenjeno vsebini, ki jo vpisuješ, tvojim zdravstvenim podatkom, imenu, e-pošti, naslovu IP ali lokaciji. To besedilo bo potrjeno po pravnem pregledu.'},
    {title: 'Stik za zasebnost', body: 'Uradni podatki za stik pooblaščene osebe za varstvo podatkov bodo dopolnjeni pred objavo.'},
  ],
  ne: [
    {title: 'प्रशोधन गरिने डेटा', body: 'कानुनी समीक्षा सकिएपछि यो खण्डले AWA ले प्रशोधन गर्ने डेटा र तिनको प्रशोधनका उद्देश्यहरू स्पष्ट रूपमा वर्णन गर्नेछ।'},
    {title: 'भण्डारण र सुरक्षा', body: 'अन्तिम कागजातले भण्डारणका उपाय, सुरक्षाका उपाय र डेटा राख्ने अवधि निर्धारण गर्नेछ।'},
    {title: 'तपाईंका अधिकार', body: 'डेटामा पहुँच, तिनको सच्याइ वा मेटाइका तरिकाहरू स्वीकृत संस्करणमा वर्णन गरिनेछन्।'},
    {title: 'त्रुटि रिपोर्टहरू', body: 'वैकल्पिक: पूर्वनिर्धारित रूपमा बन्द, तपाईंको सहमतिमा मात्र खुल्छ, र तपाईं जुनसुकै बेला गोपनीयता र सुरक्षामा परिवर्तन गर्न सक्नुहुन्छ। एपमा त्रुटि आएमा वा एप अचानक बन्द भएमा, युरोपेली संघमा होस्ट गरिएको त्रुटि-अनुगमन सेवामा गुमनाम प्राविधिक रिपोर्ट पठाइन सक्छ। यसमा प्राविधिक जानकारी मात्र हुन्छ: उपकरणको मोडेल र प्रणालीको संस्करण, AWA को संस्करण, एपका केही अनुमतिहरूको अवस्था (जस्तै सूचना वा स्थान, दिइएको वा नदिइएको), ब्याट्री, मेमोरी र भण्डारण, जडानको प्रकार, र एप पुनः स्थापना गर्दा बदलिने गुमनाम स्थापना आईडी। तपाईंले लेखेको कुरा, स्वास्थ्य तथ्याङ्क, नाम, इमेल, आईपी ठेगाना वा स्थान यसमा समावेश गर्ने उद्देश्य छैन। यो पाठ कानुनी समीक्षापछि पुष्टि गरिनेछ।'},
    {title: 'गोपनीयतासम्बन्धी सम्पर्क', body: 'डेटा सुरक्षाको जिम्मेवार व्यक्तिको आधिकारिक सम्पर्क विवरण प्रकाशनअघि थपिनेछ।'},
  ],
  si: [
    {title: 'සැකසෙන දත්ත', body: 'නීතිමය සමාලෝචනය අවසන් වූ පසු, මෙම කොටස AWA සකසන දත්ත සහ ඒවා සැකසීමේ අරමුණු පැහැදිලිව විස්තර කරනු ඇත.'},
    {title: 'ගබඩා කිරීම සහ ආරක්ෂාව', body: 'අවසාන ලේඛනය ගබඩා කිරීමේ ක්‍රම, ආරක්ෂණ ක්‍රම සහ දත්ත රඳවා ගන්නා කාලය නිර්වචනය කරනු ඇත.'},
    {title: 'ඔබේ අයිතිවාසිකම්', body: 'දත්ත වෙත ප්‍රවේශ වීම, ඒවා නිවැරදි කිරීම හෝ මකා දැමීම සඳහා ක්‍රම අනුමත කළ අනුවාදයේ විස්තර කරනු ඇත.'},
    {title: 'දෝෂ වාර්තා', body: 'විකල්පයකි: පෙරනිමියෙන් අක්‍රියයි, ඔබ එකඟ වූ විට පමණක් සක්‍රිය වන අතර ඔබට ඕනෑම වේලාවක රහස්‍යතාව සහ ආරක්ෂාව තුළ වෙනස් කළ හැක. යෙදුමේ දෝෂයක් ඇති වූ විට හෝ එය හදිසියේ වැසී ගිය විට, යුරෝපීය සංගමයේ සත්කාරක කරන දෝෂ අනුගමන සේවාවකට නිර්නාමික තාක්ෂණික වාර්තාවක් යැවිය හැක. එයට ඇත්තේ තාක්ෂණික තොරතුරු පමණි: උපාංගයේ මාදිලිය සහ පද්ධති අනුවාදය, AWA අනුවාදය, යෙදුමේ සමහර අවසර වල තත්ත්වය (උදා: දැනුම්දීම් හෝ ස්ථානය, ලබා දී ඇත්ද නැද්ද), බැටරිය, මතකය සහ ගබඩාව, සම්බන්ධතා වර්ගය, සහ යෙදුම නැවත ස්ථාපනය කළ විට වෙනස් වන නිර්නාමික ස්ථාපන හැඳුනුම. ඔබ ටයිප් කරන දේ, ඔබේ සෞඛ්‍ය දත්ත, නම, විද්‍යුත් තැපෑල, IP ලිපිනය හෝ ස්ථානය මෙයට ඇතුළත් කිරීමට අදහස් නොකෙරේ. මෙම පෙළ නීතිමය සමාලෝචනයෙන් පසු තහවුරු කරනු ලැබේ.'},
    {title: 'රහස්‍යතාව පිළිබඳ සම්බන්ධතාව', body: 'දත්ත ආරක්ෂාවේ වගකිව යුත්තාගේ නිල සම්බන්ධතා විස්තර ප්‍රකාශයට පත් කිරීමට පෙර එක් කරනු ලැබේ.'},
  ],
  th: [
    {title: 'ข้อมูลที่ประมวลผล', body: 'เมื่อการตรวจสอบทางกฎหมายเสร็จสิ้น ส่วนนี้จะอธิบายอย่างชัดเจนถึงข้อมูลที่ AWA ประมวลผลและวัตถุประสงค์ของการประมวลผล'},
    {title: 'การจัดเก็บและความปลอดภัย', body: 'เอกสารฉบับสุดท้ายจะกำหนดมาตรการจัดเก็บ มาตรการรักษาความปลอดภัย และระยะเวลาเก็บรักษาข้อมูล'},
    {title: 'สิทธิของคุณ', body: 'วิธีการเข้าถึงข้อมูล การแก้ไข หรือการลบข้อมูล จะอธิบายไว้ในฉบับที่ได้รับการอนุมัติ'},
    {title: 'รายงานข้อผิดพลาด', body: 'ไม่บังคับ: ปิดไว้ตามค่าเริ่มต้น เปิดเฉพาะเมื่อคุณยินยอม และเปลี่ยนได้ทุกเมื่อใน ความเป็นส่วนตัวและความปลอดภัย หากแอปเกิดข้อผิดพลาดหรือหยุดทำงาน อาจมีการส่งรายงานทางเทคนิคแบบไม่ระบุตัวตนไปยังบริการติดตามข้อผิดพลาดที่โฮสต์ในสหภาพยุโรป รายงานมีเฉพาะข้อมูลทางเทคนิค ได้แก่ รุ่นอุปกรณ์และเวอร์ชันระบบ เวอร์ชัน AWA สถานะของสิทธิ์บางอย่างของแอป (เช่น การแจ้งเตือนหรือตำแหน่ง ว่าอนุญาตแล้วหรือไม่) แบตเตอรี่ หน่วยความจำและพื้นที่จัดเก็บ ประเภทการเชื่อมต่อ และรหัสการติดตั้งแบบไม่ระบุตัวตนซึ่งจะเปลี่ยนเมื่อติดตั้งแอปใหม่ รายงานไม่ได้มีไว้เพื่อบรรจุสิ่งที่คุณพิมพ์ ข้อมูลสุขภาพ ชื่อ อีเมล ที่อยู่ IP หรือตำแหน่งของคุณ ข้อความนี้จะได้รับการยืนยันหลังการตรวจสอบทางกฎหมาย'},
    {title: 'การติดต่อด้านความเป็นส่วนตัว', body: 'รายละเอียดการติดต่ออย่างเป็นทางการของผู้รับผิดชอบด้านการคุ้มครองข้อมูลจะเพิ่มเข้ามาก่อนเผยแพร่'},
  ],
  vi: [
    {title: 'Dữ liệu được xử lý', body: 'Sau khi hoàn tất rà soát pháp lý, phần này sẽ mô tả rõ ràng dữ liệu mà AWA xử lý và mục đích của việc xử lý đó.'},
    {title: 'Lưu trữ và bảo mật', body: 'Tài liệu cuối cùng sẽ xác định các biện pháp lưu trữ, các biện pháp bảo mật và thời gian lưu giữ dữ liệu.'},
    {title: 'Quyền của bạn', body: 'Cách truy cập, chỉnh sửa hoặc xóa dữ liệu của bạn sẽ được mô tả trong phiên bản đã được phê duyệt.'},
    {title: 'Báo cáo lỗi', body: 'Tùy chọn: mặc định tắt, chỉ bật khi bạn đồng ý và bạn có thể thay đổi bất cứ lúc nào trong Quyền riêng tư & Bảo mật. Khi ứng dụng gặp lỗi hoặc bị đóng đột ngột, một báo cáo kỹ thuật ẩn danh có thể được gửi tới dịch vụ theo dõi lỗi đặt tại Liên minh châu Âu. Báo cáo chỉ chứa thông tin kỹ thuật: mẫu thiết bị và phiên bản hệ thống, phiên bản AWA, trạng thái của một số quyền của ứng dụng (ví dụ thông báo hoặc vị trí, đã cấp hay chưa), pin, bộ nhớ và dung lượng lưu trữ, loại kết nối và một mã định danh cài đặt ẩn danh sẽ thay đổi nếu bạn cài lại ứng dụng. Báo cáo không nhằm chứa những gì bạn nhập, dữ liệu sức khỏe, tên, e-mail, địa chỉ IP hay vị trí của bạn. Nội dung này sẽ được xác nhận sau khi rà soát pháp lý.'},
    {title: 'Liên hệ về quyền riêng tư', body: 'Thông tin liên hệ chính thức của người phụ trách bảo vệ dữ liệu sẽ được bổ sung trước khi công bố.'},
  ],
  uz: [
    {title: 'Qayta ishlanadigan maʼlumotlar', body: 'Huquqiy koʻrib chiqish yakunlangandan keyin bu boʻlim AWA qaysi maʼlumotlarni qayta ishlashini va qayta ishlash maqsadini aniq tasvirlaydi.'},
    {title: 'Saqlash va xavfsizlik', body: 'Yakuniy hujjat saqlash usullarini, xavfsizlik choralarini va maʼlumotlarni saqlash muddatini belgilaydi.'},
    {title: 'Sizning huquqlaringiz', body: 'Maʼlumotlaringizga kirish, ularni tuzatish yoki oʻchirish tartibi tasdiqlangan versiyada tavsiflanadi.'},
    {title: 'Xatolik hisobotlari', body: 'Ixtiyoriy: sukut boʻyicha oʻchiq, faqat roziligingiz bilan yoqiladi va uni istalgan vaqtda Maxfiylik va xavfsizlik boʻlimida oʻzgartirishingiz mumkin. Ilovada xatolik yuz bersa yoki u kutilmaganda yopilsa, Yevropa Ittifoqida joylashtirilgan xatoliklarni kuzatish xizmatiga anonim texnik hisobot yuborilishi mumkin. U faqat texnik maʼlumotlarni oʻz ichiga oladi: qurilma modeli va tizim versiyasi, AWA versiyasi, ilovaning ayrim ruxsatlari holati (masalan, bildirishnomalar yoki joylashuv, berilgan yoki yoʻq), batareya, xotira va saqlash joyi, ulanish turi hamda ilova qayta oʻrnatilsa oʻzgaradigan anonim oʻrnatish identifikatori. Hisobotda siz kiritgan maʼlumotlar, sogʻligʻingiz haqidagi maʼlumotlar, ismingiz, e-pochtangiz, IP manzilingiz yoki joylashuvingiz boʻlmasligi koʻzda tutilgan. Ushbu matn huquqiy koʻrib chiqishdan keyin tasdiqlanadi.'},
    {title: 'Maxfiylik boʻyicha aloqa', body: 'Maʼlumotlarni himoya qilish uchun masʼul shaxsning rasmiy aloqa maʼlumotlari eʼlon qilishdan oldin qoʻshiladi.'},
  ],
  az: [
    {title: 'Emal olunan məlumatlar', body: 'Hüquqi baxış tamamlandıqdan sonra bu bölmə AWA-nın hansı məlumatları emal etdiyini və emalın məqsədini aydın təsvir edəcək.'},
    {title: 'Saxlama və təhlükəsizlik', body: 'Yekun sənəd saxlama üsullarını, təhlükəsizlik tədbirlərini və məlumatların saxlanma müddətini müəyyən edəcək.'},
    {title: 'Sizin hüquqlarınız', body: 'Məlumatlarınıza daxil olma, onları düzəltmə və ya silmə qaydası təsdiqlənmiş versiyada təsvir olunacaq.'},
    {title: 'Xəta hesabatları', body: 'İstəyə bağlı: susmaya görə söndürülüb, yalnız razılığınla aktiv olur və istənilən vaxt Məxfilik və Təhlükəsizlik bölməsində dəyişə bilərsən. Tətbiqdə xəta baş verərsə və ya tətbiq qəfil bağlanarsa, Avropa İttifaqında yerləşdirilmiş xəta izləmə xidmətinə anonim texniki hesabat göndərilə bilər. Hesabatda yalnız texniki məlumatlar olur: cihazın modeli və sistem versiyası, AWA versiyası, tətbiqin bəzi icazələrinin vəziyyəti (məsələn, bildirişlər və ya məkan, verilib-verilməməsi), batareya, yaddaş və saxlama sahəsi, bağlantı növü və tətbiq yenidən quraşdırıldıqda dəyişən anonim quraşdırma identifikatoru. Hesabatda yazdıqların, sağlamlıq məlumatların, adın, e-poçtun, IP ünvanın və ya məkanın olması nəzərdə tutulmur. Bu mətn hüquqi baxışdan sonra təsdiqlənəcək.'},
    {title: 'Məxfilik üzrə əlaqə', body: 'Məlumatların qorunması üzrə məsul şəxsin rəsmi əlaqə məlumatları dərc edilməzdən əvvəl əlavə olunacaq.'},
  ],
  ka: [
    {title: 'დამუშავებული მონაცემები', body: 'იურიდიული განხილვის დასრულების შემდეგ ეს განყოფილება მკაფიოდ აღწერს, რომელ მონაცემებს ამუშავებს AWA და რა მიზნით.'},
    {title: 'შენახვა და უსაფრთხოება', body: 'საბოლოო დოკუმენტი განსაზღვრავს შენახვის მეთოდებს, უსაფრთხოების ზომებს და მონაცემების შენახვის ვადებს.'},
    {title: 'თქვენი უფლებები', body: 'თქვენს მონაცემებზე წვდომის, მათი გასწორების ან წაშლის წესი აღწერილი იქნება დამტკიცებულ ვერსიაში.'},
    {title: 'შეცდომების ანგარიშები', body: 'არჩევითია: ნაგულისხმევად გამორთულია, ირთვება მხოლოდ შენი თანხმობით და ნებისმიერ დროს შეგიძლია შეცვალო განყოფილებაში „კონფიდენციალურობა და უსაფრთხოება“. თუ აპლიკაციაში მოხდება შეცდომა ან ის მოულოდნელად დაიხურება, ევროკავშირში განთავსებულ შეცდომების მონიტორინგის სერვისს შეიძლება გაეგზავნოს ანონიმური ტექნიკური ანგარიში. ის მხოლოდ ტექნიკურ ინფორმაციას შეიცავს: მოწყობილობის მოდელსა და სისტემის ვერსიას, AWA-ის ვერსიას, აპლიკაციის ზოგიერთი ნებართვის მდგომარეობას (მაგალითად, შეტყობინებები ან მდებარეობა — მინიჭებულია თუ არა), ბატარეას, მეხსიერებასა და საცავს, კავშირის ტიპს და ანონიმურ ინსტალაციის იდენტიფიკატორს, რომელიც იცვლება აპლიკაციის ხელახლა დაყენებისას. ანგარიში არ არის განკუთვნილი იმისთვის, რომ შეიცავდეს შენ მიერ შეყვანილ ინფორმაციას, ჯანმრთელობის მონაცემებს, სახელს, ელფოსტას, IP მისამართს ან მდებარეობას. ეს ტექსტი დადასტურდება იურიდიული განხილვის შემდეგ.'},
    {title: 'კონფიდენციალურობასთან დაკავშირებული კონტაქტი', body: 'მონაცემთა დაცვაზე პასუხისმგებელი პირის ოფიციალური საკონტაქტო ინფორმაცია დაემატება გამოქვეყნებამდე.'},
  ],
  hy: [
    {title: 'Մշակվող տվյալներ', body: 'Իրավական վերանայման ավարտից հետո այս բաժինը հստակ կնկարագրի, թե AWA-ն ինչ տվյալներ է մշակում և ինչ նպատակով:'},
    {title: 'Պահպանում և անվտանգություն', body: 'Վերջնական փաստաթուղթը կսահմանի պահպանման եղանակները, անվտանգության միջոցները և տվյալների պահպանման ժամկետները:'},
    {title: 'Ձեր իրավունքները', body: 'Ձեր տվյալներին հասանելիության, դրանք ուղղելու կամ ջնջելու կարգը կնկարագրվի հաստատված տարբերակում:'},
    {title: 'Սխալների հաշվետվություններ', body: 'Կամընտիր է՝ լռելյայն անջատված է, միանում է միայն քո համաձայնությամբ, և կարող ես ցանկացած պահի փոխել «Գաղտնիություն և անվտանգություն» բաժնում: Եթե հավելվածում սխալ առաջանա կամ այն անսպասելիորեն փակվի, Եվրամիությունում հոսթավորված սխալների հետևման ծառայությանը կարող է ուղարկվել անանուն տեխնիկական հաշվետվություն: Այն պարունակում է միայն տեխնիկական տվյալներ՝ սարքի մոդելը և համակարգի տարբերակը, AWA-ի տարբերակը, հավելվածի որոշ թույլտվությունների վիճակը (օրինակ՝ ծանուցումներ կամ տեղակայում, տրված է թե ոչ), մարտկոցը, հիշողությունը և պահոցը, կապի տեսակը և անանուն տեղադրման նույնացուցիչ, որը փոխվում է հավելվածը վերատեղադրելիս: Այն նախատեսված չէ պարունակելու այն, ինչ դու մուտքագրում ես, քո առողջական տվյալները, անունը, էլ. փոստը, IP հասցեն կամ տեղակայումը: Այս տեքստը կհաստատվի իրավական վերանայումից հետո:'},
    {title: 'Գաղտնիության հարցերով կոնտակտ', body: 'Տվյալների պաշտպանության համար պատասխանատու անձի պաշտոնական կոնտակտային տեղեկությունը կավելացվի հրապարակումից առաջ:'},
  ],
  tg: [
    {title: 'Маълумоти коркардашаванда', body: 'Пас аз анҷоми баррасии ҳуқуқӣ ин бахш ба таври возеҳ тавсиф мекунад, ки AWA кадом маълумотро ва бо кадом мақсад коркард мекунад.'},
    {title: 'Нигоҳдорӣ ва амният', body: 'Ҳуҷҷати ниҳоӣ усулҳои нигоҳдорӣ, чораҳои амният ва мӯҳлатҳои нигоҳ доштани маълумотро муайян мекунад.'},
    {title: 'Ҳуқуқҳои шумо', body: 'Тартиби дастрасӣ ба маълумоти шумо, ислоҳ ё нест кардани он дар нусхаи тасдиқшуда тавсиф карда мешавад.'},
    {title: 'Ҳисоботҳои хато', body: 'Ихтиёрӣ: ба таври пешфарз хомӯш аст, танҳо бо розигии ту фаъол мешавад ва онро ҳар вақт дар «Махфият ва амният» тағйир дода метавонӣ. Агар дар барнома хато рух диҳад ё он ногаҳон баста шавад, ҳисоботи техникии беном ба хидмати пайгирии хатоҳо, ки дар Иттиҳоди Аврупо ҷойгир аст, фиристода шуданаш мумкин аст. Он танҳо маълумоти техникиро дорад: модели дастгоҳ ва версияи система, версияи AWA, ҳолати баъзе иҷозатҳои барнома (масалан, огоҳиҳо ё ҷойгиршавӣ, дода шудааст ё не), батарея, хотира ва ҷои нигоҳдорӣ, навъи пайвастшавӣ ва шиносаи беноми насб, ки ҳангоми аз нав насб кардани барнома тағйир меёбад. Ҳисобот барои дарбар гирифтани он чӣ ту ворид мекунӣ, маълумоти саломатии ту, ном, почтаи электронӣ, нишонии IP ё ҷойгиршавии ту пешбинӣ нашудааст. Ин матн пас аз баррасии ҳуқуқӣ тасдиқ карда мешавад.'},
    {title: 'Тамос оид ба масъалаҳои махфият', body: 'Маълумоти расмии тамоси шахси масъули ҳифзи маълумот пеш аз нашр илова карда мешавад.'},
  ],
  ky: [
    {title: 'Иштетилүүчү маалымат', body: 'Юридикалык кароо аяктагандан кийин бул бөлүм AWA кандай маалыматты жана кандай максатта иштетерин даана сүрөттөйт.'},
    {title: 'Сактоо жана коопсуздук', body: 'Акыркы документ сактоо ыкмаларын, коопсуздук чараларын жана маалыматты сактоо мөөнөттөрүн аныктайт.'},
    {title: 'Сиздин укуктарыңыз', body: 'Маалыматыңызга кирүү, аны оңдоо же жок кылуу тартиби ырасталган версияда сүрөттөлөт.'},
    {title: 'Ката жөнүндө отчёттор', body: 'Милдеттүү эмес: демейки өчүк, сенин макулдугуң менен гана күйөт жана аны каалаган убакта «Купуялуулук жана коопсуздук» бөлүмүндө өзгөртө аласың. Колдонмодо ката кетсе же ал күтүүсүздөн жабылып калса, Европа Бирлигинде жайгаштырылган каталарды көзөмөлдөө кызматына аноним техникалык отчёт жиберилиши мүмкүн. Ал техникалык маалыматтарды гана камтыйт: түзмөктүн модели жана тутумдун версиясы, AWA версиясы, колдонмонун кээ бир уруксаттарынын абалы (мисалы, эскертмелер же жайгашкан жер, берилгенби же жокпу), батарея, эс тутум жана сактагыч, туташуу түрү жана колдонмо кайра орнотулганда өзгөрүүчү аноним орнотуу идентификатору. Отчётто сен киргизген маалымат, ден соолугуңа байланыштуу маалымат, атың, электрондук почтаң, IP дарегиң же жайгашкан жериң болбошу керек. Бул текст юридикалык кароодон кийин ырасталат.'},
    {title: 'Купуялык боюнча байланыш', body: 'Маалыматты коргоо боюнча жооптуу адамдын расмий байланыш маалыматы жарыялоодон мурун кошулат.'},
  ],
  tk: [
    {title: 'Işlenýän maglumatlar', body: 'Hukuk gözden geçirilişi tamamlanandan soň bu bölüm AWA-nyň haýsy maglumatlary we haýsy maksat bilen işleýändigini aýdyň suratlandyrar.'},
    {title: 'Saklamak we howpsuzlyk', body: 'Soňky resminama saklamak usullaryny, howpsuzlyk çärelerini we maglumatlary saklamak möhletlerini kesgitlär.'},
    {title: 'Siziň hukuklaryňyz', body: 'Maglumatlaryňyza girmegiň, olary düzetmegiň ýa-da pozmagyň tertibi tassyklanan wersiýada suratlandyrylar.'},
    {title: 'Ýalňyşlyk hasabatlary', body: 'Hökman däl: adaty ýagdaýda öçük, diňe seniň razylygyň bilen açylýar we ony islendik wagt «Gizlinlik we howpsuzlyk» bölüminde üýtgedip bilersiň. Programmada ýalňyşlyk ýüze çyksa ýa-da ol garaşylmadyk ýagdaýda ýapylsa, Ýewropa Bileleşiginde ýerleşdirilen ýalňyşlyklary yzarlaýyş hyzmatyna anonim tehniki hasabat iberilip bilner. Ol diňe tehniki maglumatlary öz içine alýar: enjamyň modeli we ulgamyň wersiýasy, AWA wersiýasy, programmanyň käbir rugsatlarynyň ýagdaýy (mysal üçin, bildirişler ýa-da ýerleşiş, berlen ýa-da berilmedik), batareýa, ýat we saklaýyş, birikme görnüşi we programma gaýtadan guralsa üýtgeýän anonim gurnama kesgitleýjisi. Hasabatda sen ýazýan zatlaryň, saglyk maglumatlaryň, adyň, e-poçtaň, IP salgyň ýa-da ýerleşişiň bolmagy göz öňünde tutulmaýar. Bu tekst hukuk gözden geçirilişinden soň tassyklanar.'},
    {title: 'Gizlinlik boýunça habarlaşmak', body: 'Maglumatlary goramak üçin jogapkär adamyň resmi habarlaşmak maglumatlary neşir edilmezden öň goşular.'},
  ],
  ms: [
    {title: 'Data yang diproses', body: 'Bahagian ini akan menerangkan dengan jelas data yang diproses oleh AWA dan tujuannya, selepas semakan undang-undang selesai.'},
    {title: 'Penyimpanan dan keselamatan', body: 'Dokumen muktamad akan menetapkan kaedah penyimpanan, langkah keselamatan dan tempoh pengekalan data.'},
    {title: 'Hak anda', body: 'Cara untuk mengakses, membetulkan atau memadam data anda akan diterangkan dalam versi yang disahkan.'},
    {title: 'Laporan ralat', body: 'Pilihan: dimatikan secara lalai, hanya dihidupkan jika anda bersetuju dan boleh diubah pada bila-bila masa dalam Privasi & Keselamatan. Jika aplikasi menghadapi ralat atau terhenti secara tiba-tiba, laporan teknikal tanpa nama boleh dihantar kepada perkhidmatan penjejakan ralat yang dihoskan di Kesatuan Eropah. Laporan ini hanya mengandungi maklumat teknikal: model peranti dan versi sistem, versi AWA, status beberapa kebenaran aplikasi (contohnya pemberitahuan atau lokasi, diberikan atau tidak), bateri, memori dan storan, jenis sambungan, serta ID pemasangan tanpa nama yang berubah jika aplikasi dipasang semula. Laporan tidak bertujuan mengandungi apa yang anda taip, data kesihatan anda, nama anda, e-mel anda, alamat IP atau lokasi anda. Teks ini akan disahkan selepas pengesahan undang-undang.'},
    {title: 'Hubungan privasi', body: 'Maklumat perhubungan rasmi bagi orang yang bertanggungjawab melindungi data akan ditambah sebelum penerbitan.'},
  ],
  so: [
    {title: 'Xogta la farsameeyo', body: 'Qaybtani si sax ah ayay u sharxi doontaa xogta AWA farsameeyo iyo ujeeddadeeda, ka dib marka dib-u-eegista sharciga la dhammeeyo.'},
    {title: 'Kaydinta iyo amniga', body: 'Dukumiintiga kama dambeysta ahi wuxuu qeexi doonaa habka kaydinta, tallaabooyinka amniga iyo muddooyinka xogta lagu hayo.'},
    {title: 'Xuquuqdaada', body: 'Habka lagu heli karo, lagu saxi karo ama lagu tirtiri karo xogtaada ayaa lagu sharxi doonaa nooca la xaqiijiyey.'},
    {title: 'Warbixinnada khaladka', body: 'Ikhtiyaari: si caadi ah waa la damiyay, waxaa lagu daarayaa oo kaliya haddii aad oggolaato, waana beddeli kartaa wakhti kasta gudaha Asturnaanta iyo Amniga. Haddii app-ku uu la kulmo khalad ama uu si lama filaan u xirmo, warbixin farsamo oo aan magac lahayn ayaa loo diri karaa adeeg la socda khaladaadka oo ku yaal Midowga Yurub. Waxay ka kooban tahay macluumaad farsamo oo kaliya: moodelka qalabka iyo nooca nidaamka, nooca AWA, xaaladda ogolaanshaha qaarkood ee app-ka (tusaale, ogeysiisyada ama goobta, la bixiyay iyo in kale), baytariga, xusuusta iyo kaydka, nooca isku xirka, iyo aqoonsi rakibaad oo aan magac lahayn oo isbeddela haddii app-ka dib loo rakibo. Looma qorshaynin inay ka koobnaato wixii aad gelisid, xogtaada caafimaadka, magacaaga, iimaylkaaga, cinwaanka IP-gaaga ama goobtaada. Qoraalkan ayaa la xaqiijin doonaa ka dib hubinta sharciga.'},
    {title: 'Xiriirka asturnaanta', body: 'Macluumaadka xiriirka rasmiga ah ee qofka mas’uulka ka ah ilaalinta xogta ayaa lagu dari doonaa ka hor daabacaadda.'},
  ],
  sw: [
    {title: 'Data zinazochakatwa', body: 'Sehemu hii itaeleza kwa usahihi data ambazo AWA huchakata na madhumuni yake, baada ya ukaguzi wa kisheria kukamilika.'},
    {title: 'Uhifadhi na usalama', body: 'Hati ya mwisho itaeleza jinsi data zinavyohifadhiwa, hatua za usalama na muda wa kuhifadhi data.'},
    {title: 'Haki zako', body: 'Utaratibu wa kufikia, kusahihisha au kufuta data zako utaelezwa katika toleo lililothibitishwa.'},
    {title: 'Ripoti za hitilafu', body: 'Hiari: imezimwa kwa chaguo-msingi, huwashwa tu ukikubali, na unaweza kuibadilisha wakati wowote katika Faragha na Usalama. Programu ikikumbwa na hitilafu au kuzimika ghafla, ripoti ya kiufundi isiyo na jina inaweza kutumwa kwa huduma ya kufuatilia hitilafu inayohifadhiwa katika Umoja wa Ulaya. Ina taarifa za kiufundi pekee: modeli ya kifaa na toleo la mfumo, toleo la AWA, hali ya baadhi ya ruhusa za programu (kwa mfano arifa au eneo, zimetolewa au la), betri, kumbukumbu na hifadhi, aina ya muunganisho, na kitambulisho cha usakinishaji kisicho na jina ambacho hubadilika programu ikisakinishwa upya. Haikusudiwi kuwa na ulichoandika, data yako ya afya, jina lako, barua pepe yako, anwani yako ya IP au eneo lako. Maandishi haya yatathibitishwa baada ya ukaguzi wa kisheria.'},
    {title: 'Mawasiliano ya faragha', body: 'Taarifa rasmi za mawasiliano za mtu anayehusika na ulinzi wa data zitaongezwa kabla ya kuchapishwa.'},
  ],
  kk: [
    {title: 'Өңделетін деректер', body: 'Бұл бөлім заң тұрғысынан тексеру аяқталғаннан кейін AWA қандай деректерді және қандай мақсатта өңдейтінін дәл сипаттайды.'},
    {title: 'Сақтау және қауіпсіздік', body: 'Түпкілікті құжат деректердің қалай сақталатынын, қауіпсіздік шараларын және сақтау мерзімін түсіндіреді.'},
    {title: 'Сіздің құқықтарыңыз', body: 'Деректеріңізге қол жеткізу, оларды түзету немесе жою тәртібі тексерілген нұсқада түсіндіріледі.'},
    {title: 'Қате туралы есептер', body: 'Міндетті емес: әдепкіде өшірулі, тек сенің келісіміңмен қосылады және оны кез келген уақытта «Құпиялылық және қауіпсіздік» бөлімінде өзгерте аласың. Қолданбада қате орын алса немесе ол күтпеген жерден жабылса, Еуропалық Одақта орналасқан қателерді қадағалау қызметіне анонимді техникалық есеп жіберілуі мүмкін. Онда тек техникалық мәліметтер болады: құрылғы үлгісі мен жүйе нұсқасы, AWA нұсқасы, қолданбаның кейбір рұқсаттарының күйі (мысалы, хабарландырулар немесе орналасқан жер, берілген бе, жоқ па), батарея, жад және сақтау орны, қосылым түрі және қолданба қайта орнатылғанда өзгеретін анонимді орнату идентификаторы. Есепте сен енгізген мәтін, денсаулығың туралы деректер, атың, электрондық поштаң, IP мекенжайың немесе орналасқан жерің болмауы тиіс. Бұл мәтін заң тұрғысынан тексеруден кейін расталады.'},
    {title: 'Құпиялылық бойынша байланыс', body: 'Деректерді қорғауға жауапты адамның ресми байланыс деректері жарияланғанға дейін қосылады.'},
  ],
  wo: [
    {title: 'Xibaar yu ñuy jëfandikoo', body: 'Pàrt bii dina leeral bu leer xibaar yi AWA di jëfandikoo ak seen jëm, ginnaaw bu seetlu bu yoon mottalee.'},
    {title: 'Denc ak aar', body: 'Kayit bu mujj bi dina leeral naka xibaar yi di dencu, jumtukaay yu aar ak diiru denc xibaar yi.'},
    {title: 'Say yoon', body: 'Anam bi ñuy dugg, jubal walla far sa xibaar dina leeral ci wersiyoŋ bu ñu dëggal.'},
    {title: 'Raportu njuumte yi', body: 'Ci bëgg-bëgg la: dafa dindi ci kaw, du tàmbali lu dul sa nangu, te mën nga ko soppi saa su nekk ci Suturaal ak Kaarange. Su appli bi amee njuumte walla mu tëj ci anam bu dul bëgg, raportu teknik bu dul tudd kenn mën na ñu ko yónnee ci sërwis bu topp njuumte yi, bu nekk ci Wàllu Tubaab Yuróop. Dafay am jumtukaay yu teknik rekk: model bu jumtukaay bi ak wersiyoŋ bu sistem bi, wersiyoŋ AWA, ni ñu def ak yenn ndigal yu appli bi (misaal yëgle yi walla bërëb, ñu ko may walla déet), batri, xel ak taxawaay, xeetu jokkoo bi, ak limu tabax bu dul tudd kenn bu soppiku su appli bi defaree ko. Waruwul am li nga bind, say xibaar ci wér-gi-yaram, sa tur, sa imeel, sa adrees IP walla sa bërëb. Mbind mii dinañu ko dëggal ginnaaw seetlu yoon.'},
    {title: 'Jokkoo ci cér-bopp', body: 'Xibaaru jokkoo bu ofisiyel bu ki yor aaru xibaar dinañu ko yokk balaa ñu ko génne.'},
  ],
  ha: [
    {title: 'Bayanan da ake amfani da su', body: 'Wannan sashe zai bayyana a fili bayanan da AWA ke amfani da su da dalilinsu, bayan an duba su bisa doka.'},
    {title: 'Ajiya da kariya', body: 'Takardar ƙarshe za ta bayyana yadda ake adana bayanai, matakan kariya da tsawon lokacin adanawa.'},
    {title: 'Haƙƙoƙinki', body: 'Hanyar samun, gyara ko share bayananki za a bayyana ta a sigar da aka tabbatar.'},
    {title: 'Rahotannin kuskure', body: 'Na zaɓi: a kashe yake ta asali, ana kunna shi ne kawai idan ka amince, kuma za ka iya canza shi a kowane lokaci a Sirri da Tsaro. Idan manhajar ta gamu da kuskure ko ta rufe ba zato ba tsammani, ana iya aika rahoton fasaha wanda ba shi da suna zuwa sabis ɗin bibiyar kurakurai da ke cikin Tarayyar Turai. Yana ƙunshe da bayanan fasaha kawai: samfurin na\'ura da sigar tsarin, sigar AWA, yanayin wasu izinin manhajar (misali sanarwa ko wuri, an bayar ko ba a bayar ba), baturi, ƙwaƙwalwa da ajiya, nau\'in haɗi, da lambar shigarwa maras suna wadda ke canjawa idan aka sake shigar da manhajar. Ba a nufin ya ƙunshi abin da kake rubutawa, bayanan lafiyarka, sunanka, imel ɗinka, adireshin IP ɗinka ko wurinka ba. Za a tabbatar da wannan rubutu bayan binciken doka.'},
    {title: 'Tuntuɓar sirri', body: 'Za a ƙara ainihin bayanan tuntuɓa na mai kula da kariyar bayanai kafin a buga.'},
  ],
  am: [
    {title: 'ጥቅም ላይ የሚውሉ መረጃዎች', body: 'ይህ ክፍል AWA የሚጠቀማቸውን መረጃዎች እና ምክንያታቸውን በሕግ ከተረጋገጠ በኋላ በግልጽ ያብራራል።'},
    {title: 'ማከማቻና ጥበቃ', body: 'የመጨረሻው ሰነድ መረጃ እንዴት እንደሚከማች፣ የጥበቃ እርምጃዎችን እና የማቆያ ጊዜን ያብራራል።'},
    {title: 'መብቶችሽ', body: 'መረጃሽን የማግኘት፣ የማረም ወይም የመሰረዝ መንገድ በተረጋገጠው ስሪት ውስጥ ይብራራል።'},
    {title: 'የስህተት ሪፖርቶች', body: 'አማራጭ ነው፦ በመጀመሪያ የተዘጋ ነው፣ የሚከፈተው በፈቃድህ ብቻ ነው፣ እና በማንኛውም ጊዜ በግላዊነትና ደህንነት ውስጥ መቀየር ትችላለህ። መተግበሪያው ስህተት ካጋጠመው ወይም ባልታሰበ ሁኔታ ከተዘጋ፣ ስሙ የማይታወቅ የቴክኒክ ሪፖርት በአውሮፓ ኅብረት ውስጥ ወደሚገኝ የስህተት መከታተያ አገልግሎት ሊላክ ይችላል። የያዘው የቴክኒክ መረጃ ብቻ ነው፦ የመሣሪያው ሞዴልና የሲስተም ስሪት፣ የAWA ስሪት፣ የአንዳንድ የመተግበሪያ ፈቃዶች ሁኔታ (ለምሳሌ ማሳወቂያዎች ወይም አካባቢ፣ የተሰጡ ወይም ያልተሰጡ)፣ ባትሪ፣ ማህደረ ትውስታና ማከማቻ፣ የግንኙነት አይነት፣ እና መተግበሪያው እንደገና ሲጫን የሚቀየር ስሙ የማይታወቅ የመጫኛ መለያ። የምትጽፈውን፣ የጤና መረጃሽን፣ ስምሽን፣ ኢሜይልሽን፣ የIP አድራሻሽን ወይም አካባቢሽን እንዲይዝ አይታሰብም። ይህ ጽሑፍ ከሕግ ግምገማ በኋላ ይረጋገጣል።'},
    {title: 'የግላዊነት ግንኙነት', body: 'ከመታተሙ በፊት የመረጃ ጥበቃ ኃላፊው ትክክለኛ የመገኛ መረጃ ይታከላል።'},
  ],
  nl: [
    {title: 'Gebruikte gegevens', body: 'Dit deel legt duidelijk uit welke gegevens AWA gebruikt en waarom, zodra het juridisch is gevalideerd.'},
    {title: 'Opslag en bescherming', body: 'Het definitieve document legt uit hoe gegevens worden opgeslagen, welke beveiligingsmaatregelen gelden en hoe lang ze worden bewaard.'},
    {title: 'Jouw rechten', body: 'Hoe je toegang krijgt tot je gegevens, ze corrigeert of verwijdert, wordt uitgelegd in de gevalideerde versie.'},
    {title: 'Foutrapporten', body: 'Optioneel: standaard uit, alleen aan met jouw toestemming en op elk moment te wijzigen bij Privacy en beveiliging. Als de app een fout tegenkomt of crasht, kan een anoniem technisch rapport worden verstuurd naar een foutopsporingsdienst die in de Europese Unie wordt gehost. Het bevat alleen technische gegevens: apparaatmodel en systeemversie, AWA-versie, de status van enkele app-machtigingen (bijvoorbeeld meldingen of locatie, verleend of niet), batterij, geheugen en opslag, verbindingstype en een anonieme installatie-ID die verandert als de app opnieuw wordt geïnstalleerd. Het is niet bedoeld om te bevatten wat je invoert, je gezondheidsgegevens, je naam, je e-mailadres, je IP-adres of je locatie. Deze tekst wordt bevestigd na juridische validatie.'},
    {title: 'Privacycontact', body: 'De definitieve contactgegevens van de functionaris voor gegevensbescherming worden vóór publicatie toegevoegd.'},
  ],
  fi: [
    {title: 'Käytetyt tiedot', body: 'Tämä osio selittää selkeästi, mitä tietoja AWA käyttää ja miksi, kun se on validoitu oikeudellisesti.'},
    {title: 'Tallennus ja suojaus', body: 'Lopullinen asiakirja selittää, miten tiedot tallennetaan, mitä turvatoimia sovelletaan ja kuinka kauan niitä säilytetään.'},
    {title: 'Oikeutesi', body: 'Se, miten voit käyttää, korjata tai poistaa tietojasi, selitetään validoidussa versiossa.'},
    {title: 'Virheraportit', body: 'Valinnainen: oletuksena pois päältä, otetaan käyttöön vain suostumuksellasi ja muutettavissa milloin tahansa kohdassa Yksityisyys ja turvallisuus. Jos sovellus kohtaa virheen tai kaatuu, nimetön tekninen raportti voidaan lähettää Euroopan unionissa isännöidylle virheenseurantapalvelulle. Se sisältää vain teknisiä tietoja: laitemallin ja järjestelmäversion, AWA-version, joidenkin sovellusoikeuksien tilan (esimerkiksi ilmoitukset tai sijainti, myönnetty vai ei), akun, muistin ja tallennustilan, yhteystyypin sekä nimettömän asennustunnuksen, joka muuttuu, jos sovellus asennetaan uudelleen. Sen ei ole tarkoitus sisältää sitä, mitä kirjoitat, terveystietojasi, nimeäsi, sähköpostiosoitettasi, IP-osoitettasi tai sijaintiasi. Tämä teksti vahvistetaan oikeudellisen tarkistuksen jälkeen.'},
    {title: 'Tietosuoja-asioiden yhteystiedot', body: 'Tietosuojavastaavan lopulliset yhteystiedot lisätään ennen julkaisua.'},
  ],
  el: [
    {title: 'Δεδομένα που χρησιμοποιούνται', body: 'Αυτή η ενότητα θα εξηγεί με σαφήνεια ποια δεδομένα χρησιμοποιεί το AWA και γιατί, μόλις επικυρωθεί νομικά.'},
    {title: 'Αποθήκευση και ασφάλεια', body: 'Το τελικό έγγραφο θα εξηγεί πώς αποθηκεύονται τα δεδομένα, ποια μέτρα ασφαλείας εφαρμόζονται και για πόσο χρόνο διατηρούνται.'},
    {title: 'Τα δικαιώματά σου', body: 'Ο τρόπος με τον οποίο μπορείς να έχεις πρόσβαση στα δεδομένα σου, να τα διορθώσεις ή να τα διαγράψεις θα εξηγείται στην επικυρωμένη έκδοση.'},
    {title: 'Αναφορές σφαλμάτων', body: 'Προαιρετικό: απενεργοποιημένο από προεπιλογή, ενεργοποιείται μόνο με τη συγκατάθεσή σου και μπορείς να το αλλάξεις οποιαδήποτε στιγμή στο Απόρρητο και ασφάλεια. Αν η εφαρμογή αντιμετωπίσει σφάλμα ή κλείσει απροσδόκητα, μπορεί να σταλεί μια ανώνυμη τεχνική αναφορά σε υπηρεσία παρακολούθησης σφαλμάτων που φιλοξενείται στην Ευρωπαϊκή Ένωση. Περιέχει μόνο τεχνικές πληροφορίες: μοντέλο συσκευής και έκδοση συστήματος, έκδοση του AWA, την κατάσταση ορισμένων αδειών της εφαρμογής (για παράδειγμα ειδοποιήσεις ή τοποθεσία, χορηγημένες ή όχι), μπαταρία, μνήμη και αποθηκευτικό χώρο, τύπο σύνδεσης και ένα ανώνυμο αναγνωριστικό εγκατάστασης που αλλάζει αν η εφαρμογή εγκατασταθεί ξανά. Δεν προορίζεται να περιέχει όσα πληκτρολογείς, τα δεδομένα υγείας σου, το όνομά σου, το e-mail σου, τη διεύθυνση IP ή την τοποθεσία σου. Το κείμενο αυτό θα επιβεβαιωθεί μετά τη νομική επικύρωση.'},
    {title: 'Επικοινωνία για το απόρρητο', body: 'Τα τελικά στοιχεία επικοινωνίας του υπευθύνου προστασίας δεδομένων θα προστεθούν πριν από τη δημοσίευση.'},
  ],
  fil: [
    {title: 'Mga datos na ginagamit', body: 'Ipapaliwanag nang malinaw ng seksyong ito kung anong mga datos ang ginagamit ng AWA at bakit, kapag nabeberipika na ito sa legal na aspeto.'},
    {title: 'Pag-iimbak at seguridad', body: 'Ipapaliwanag ng pinal na dokumento kung paano iniimbak ang mga datos, anong mga hakbang sa seguridad ang ipinapatupad, at gaano katagal itong iniingatan.'},
    {title: 'Ang iyong mga karapatan', body: 'Ipapaliwanag sa beripikadong bersyon kung paano mo maa-access, maitatama, o made-delete ang iyong mga datos.'},
    {title: 'Mga ulat ng error', body: 'Opsyonal: naka-off bilang default, bubuksan lamang kung pumayag ka, at maaari mo itong baguhin anumang oras sa Privacy at Seguridad. Kung magkaroon ng error ang app o bigla itong magsara, maaaring magpadala ng anonymous na teknikal na ulat sa isang serbisyo sa pagsubaybay ng error na naka-host sa European Union. Teknikal na impormasyon lamang ang laman nito: modelo ng device at bersyon ng system, bersyon ng AWA, kalagayan ng ilang pahintulot ng app (halimbawa, mga notification o lokasyon, ibinigay man o hindi), baterya, memorya at storage, uri ng koneksyon, at isang anonymous na ID ng pag-install na nagbabago kapag muling na-install ang app. Hindi ito nilayong maglaman ng mga inilalagay mo, ng iyong datos pangkalusugan, pangalan, e-mail, IP address, o lokasyon. Kukumpirmahin ang tekstong ito pagkatapos ng legal na pagsusuri.'},
    {title: 'Pakikipag-ugnayan tungkol sa privacy', body: 'Idaragdag ang mga pinal na detalye ng pakikipag-ugnayan ng responsable sa proteksyon ng datos bago ang paglalathala.'},
  ],
  ta: [
    {title: 'பயன்படுத்தப்படும் தரவு', body: 'AWA எந்தத் தரவைப் பயன்படுத்துகிறது, ஏன் என்பதை இந்தப் பகுதி, சட்டரீதியாகச் சரிபார்க்கப்பட்ட பின், தெளிவாக விளக்கும்.'},
    {title: 'சேமிப்பும் பாதுகாப்பும்', body: 'தரவு எப்படிச் சேமிக்கப்படுகிறது, எந்தப் பாதுகாப்பு நடவடிக்கைகள் செயல்படுத்தப்படுகின்றன, எவ்வளவு காலம் வைக்கப்படுகிறது என்பதை இறுதி ஆவணம் விளக்கும்.'},
    {title: 'உங்கள் உரிமைகள்', body: 'உங்கள் தரவை எப்படி அணுகலாம், திருத்தலாம் அல்லது நீக்கலாம் என்பதைச் சரிபார்க்கப்பட்ட பதிப்பு விளக்கும்.'},
    {title: 'பிழை அறிக்கைகள்', body: 'விருப்பத்திற்குரியது: இயல்பாக அணைக்கப்பட்டுள்ளது, நீங்கள் ஒப்புக்கொண்டால் மட்டுமே இயக்கப்படும், எப்போது வேண்டுமானாலும் தனியுரிமை & பாதுகாப்பு பகுதியில் மாற்றலாம். பயன்பாட்டில் பிழை ஏற்பட்டால் அல்லது அது திடீரென மூடப்பட்டால், ஐரோப்பிய ஒன்றியத்தில் நடத்தப்படும் பிழை கண்காணிப்புச் சேவைக்கு அடையாளம் இல்லாத தொழில்நுட்ப அறிக்கை அனுப்பப்படலாம். அதில் தொழில்நுட்பத் தகவல்கள் மட்டுமே இருக்கும்: சாதன மாடல் மற்றும் அமைப்புப் பதிப்பு, AWA பதிப்பு, பயன்பாட்டின் சில அனுமதிகளின் நிலை (எடுத்துக்காட்டாக அறிவிப்புகள் அல்லது இருப்பிடம், வழங்கப்பட்டதா இல்லையா), பேட்டரி, நினைவகம் மற்றும் சேமிப்பகம், இணைப்பு வகை, மற்றும் பயன்பாட்டை மீண்டும் நிறுவினால் மாறும் அடையாளமற்ற நிறுவல் ஐடி. நீங்கள் உள்ளிடுவது, உங்கள் உடல்நலத் தரவு, பெயர், மின்னஞ்சல், IP முகவரி அல்லது இருப்பிடம் ஆகியவை இதில் இருக்கக் கூடாது என்பதே நோக்கம். இந்த உரை சட்ட மதிப்பாய்வுக்குப் பிறகு உறுதிசெய்யப்படும்.'},
    {title: 'தனியுரிமை குறித்த தொடர்பு', body: 'தரவுப் பாதுகாப்புப் பொறுப்பாளரின் இறுதித் தொடர்பு விவரங்கள் வெளியிடுவதற்கு முன் சேர்க்கப்படும்.'},
  ],
  te: [
    {title: 'ఉపయోగించే డేటా', body: 'AWA ఏ డేటాను ఎందుకు ఉపయోగిస్తుందో ఈ విభాగం, చట్టపరమైన ధృవీకరణ తర్వాత, స్పష్టంగా వివరిస్తుంది.'},
    {title: 'నిల్వ, భద్రత', body: 'డేటా ఎలా నిల్వ చేయబడుతుందో, ఏ భద్రతా చర్యలు అమలు చేయబడతాయో, ఎంతకాలం ఉంచబడుతుందో తుది పత్రం వివరిస్తుంది.'},
    {title: 'మీ హక్కులు', body: 'మీ డేటాను ఎలా యాక్సెస్ చేయవచ్చో, సరిదిద్దవచ్చో లేదా తొలగించవచ్చో ధృవీకరించిన వెర్షన్ వివరిస్తుంది.'},
    {title: 'లోపం నివేదికలు', body: 'ఐచ్ఛికం: డిఫాల్ట్‌గా ఆఫ్‌లో ఉంటుంది, మీరు అంగీకరిస్తేనే ఆన్ అవుతుంది, మరియు ఎప్పుడైనా గోప్యత & భద్రతలో మార్చుకోవచ్చు. యాప్‌లో లోపం ఏర్పడినా లేదా అది అకస్మాత్తుగా మూసుకుపోయినా, యూరోపియన్ యూనియన్‌లో హోస్ట్ చేయబడిన లోపాల పర్యవేక్షణ సేవకు పేరు లేని సాంకేతిక నివేదిక పంపబడవచ్చు. అందులో సాంకేతిక సమాచారం మాత్రమే ఉంటుంది: పరికరం మోడల్ మరియు సిస్టమ్ వెర్షన్, AWA వెర్షన్, యాప్ కొన్ని అనుమతుల స్థితి (ఉదాహరణకు నోటిఫికేషన్లు లేదా స్థానం, ఇచ్చారా లేదా), బ్యాటరీ, మెమరీ మరియు నిల్వ, కనెక్షన్ రకం, మరియు యాప్‌ను మళ్లీ ఇన్‌స్టాల్ చేస్తే మారే పేరు లేని ఇన్‌స్టలేషన్ ఐడీ. మీరు నమోదు చేసినవి, మీ ఆరోగ్య డేటా, పేరు, ఈమెయిల్, IP చిరునామా లేదా స్థానం ఇందులో ఉండకూడదనేది ఉద్దేశం. ఈ వచనం చట్టపరమైన సమీక్ష తర్వాత నిర్ధారించబడుతుంది.'},
    {title: 'గోప్యత సంప్రదింపు', body: 'డేటా రక్షణ బాధ్యులకు సంబంధించిన తుది సంప్రదింపు వివరాలు ప్రచురణకు ముందు చేర్చబడతాయి.'},
  ],
  mr: [
    {title: 'वापरला जाणारा डेटा', body: 'AWA कोणता डेटा का वापरते ते हा विभाग, कायदेशीर पडताळणीनंतर, स्पष्टपणे स्पष्ट करेल.'},
    {title: 'साठवण आणि सुरक्षा', body: 'डेटा कसा साठवला जातो, कोणत्या सुरक्षा उपायांचा वापर केला जातो आणि तो किती काळ ठेवला जातो ते अंतिम दस्तऐवज स्पष्ट करेल.'},
    {title: 'तुमचे हक्क', body: 'तुम्ही तुमचा डेटा कसा मिळवू, दुरुस्त करू किंवा हटवू शकता ते पडताळलेली आवृत्ती स्पष्ट करेल.'},
    {title: 'त्रुटी अहवाल', body: 'ऐच्छिक: डीफॉल्टनुसार बंद, तुमच्या संमतीनेच चालू होते, आणि तुम्ही कधीही गोपनीयता आणि सुरक्षा मध्ये बदलू शकता. अ‍ॅपमध्ये त्रुटी आल्यास किंवा ते अचानक बंद पडल्यास, युरोपियन युनियनमध्ये होस्ट केलेल्या त्रुटी-निरीक्षण सेवेला निनावी तांत्रिक अहवाल पाठवला जाऊ शकतो. त्यात फक्त तांत्रिक माहिती असते: डिव्हाइसचे मॉडेल आणि सिस्टमची आवृत्ती, AWA ची आवृत्ती, अ‍ॅपच्या काही परवानग्यांची स्थिती (उदा. सूचना किंवा स्थान, दिलेली किंवा नाही), बॅटरी, मेमरी आणि स्टोरेज, कनेक्शनचा प्रकार, आणि अ‍ॅप पुन्हा इन्स्टॉल केल्यास बदलणारा निनावी इन्स्टॉलेशन आयडी. तुम्ही लिहिलेली माहिती, तुमचा आरोग्य डेटा, नाव, ईमेल, आयपी पत्ता किंवा स्थान यात समाविष्ट करण्याचा हेतू नाही. हा मजकूर कायदेशीर तपासणीनंतर निश्चित केला जाईल.'},
    {title: 'गोपनीयतेसाठी संपर्क', body: 'डेटा संरक्षण अधिकाऱ्याचे अंतिम संपर्क तपशील प्रकाशनापूर्वी समाविष्ट केले जातील.'},
  ],
  gu: [
    {title: 'વપરાતો ડેટા', body: 'AWA કયો ડેટા શા માટે વાપરે છે તે આ વિભાગ, કાનૂની ચકાસણી પછી, સ્પષ્ટપણે સમજાવશે.'},
    {title: 'સંગ્રહ અને સુરક્ષા', body: 'ડેટા કેવી રીતે સંગ્રહિત થાય છે, કયા સુરક્ષા પગલાં વપરાય છે અને તે કેટલો સમય રાખવામાં આવે છે તે અંતિમ દસ્તાવેજ સમજાવશે.'},
    {title: 'તમારા અધિકારો', body: 'તમે તમારો ડેટા કેવી રીતે મેળવી, સુધારી કે કાઢી શકો છો તે ચકાસાયેલી આવૃત્તિ સમજાવશે.'},
    {title: 'ભૂલ અહેવાલો', body: 'વૈકલ્પિક: ડિફોલ્ટ રૂપે બંધ, તમારી સંમતિથી જ ચાલુ થાય છે, અને તમે ગમે ત્યારે ગોપનીયતા અને સુરક્ષા માં બદલી શકો છો. એપમાં ભૂલ આવે અથવા તે અચાનક બંધ થઈ જાય, તો યુરોપિયન યુનિયનમાં હોસ્ટ થયેલી ભૂલ-ટ્રેકિંગ સેવાને અજ્ઞાત તકનીકી અહેવાલ મોકલવામાં આવી શકે છે. તેમાં ફક્ત તકનીકી માહિતી હોય છે: ડિવાઇસનું મોડેલ અને સિસ્ટમ સંસ્કરણ, AWA નું સંસ્કરણ, એપની કેટલીક પરવાનગીઓની સ્થિતિ (જેમ કે સૂચનાઓ અથવા સ્થાન, આપેલી છે કે નહીં), બેટરી, મેમરી અને સ્ટોરેજ, કનેક્શનનો પ્રકાર, અને એપ ફરીથી ઇન્સ્ટોલ કરવાથી બદલાતો અજ્ઞાત ઇન્સ્ટોલેશન આઈડી. તમે લખેલી માહિતી, તમારો આરોગ્ય ડેટા, નામ, ઇમેઇલ, IP સરનામું કે સ્થાન તેમાં સમાવવાનો હેતુ નથી. આ લખાણ કાનૂની ચકાસણી પછી પાકું કરવામાં આવશે.'},
    {title: 'ગોપનીયતા માટે સંપર્ક', body: 'ડેટા સંરક્ષણ અધિકારીની અંતિમ સંપર્ક વિગતો પ્રકાશન પહેલાં સામેલ કરવામાં આવશે.'},
  ],
  pa: [
    {title: 'ਵਰਤਿਆ ਜਾਂਦਾ ਡੇਟਾ', body: 'AWA ਕਿਹੜਾ ਡੇਟਾ ਕਿਉਂ ਵਰਤਦੀ ਹੈ, ਇਹ ਭਾਗ ਕਾਨੂੰਨੀ ਜਾਂਚ ਤੋਂ ਬਾਅਦ ਸਾਫ਼ ਸ਼ਬਦਾਂ ਵਿੱਚ ਦੱਸੇਗਾ।'},
    {title: 'ਸੰਭਾਲ ਅਤੇ ਸੁਰੱਖਿਆ', body: 'ਡੇਟਾ ਕਿਵੇਂ ਸੰਭਾਲਿਆ ਜਾਂਦਾ ਹੈ, ਕਿਹੜੇ ਸੁਰੱਖਿਆ ਉਪਾਅ ਵਰਤੇ ਜਾਂਦੇ ਹਨ ਅਤੇ ਇਹ ਕਿੰਨਾ ਚਿਰ ਰੱਖਿਆ ਜਾਂਦਾ ਹੈ, ਇਹ ਅੰਤਿਮ ਦਸਤਾਵੇਜ਼ ਸਮਝਾਏਗਾ।'},
    {title: 'ਤੁਹਾਡੇ ਅਧਿਕਾਰ', body: 'ਤੁਸੀਂ ਆਪਣਾ ਡੇਟਾ ਕਿਵੇਂ ਪ੍ਰਾਪਤ ਕਰ, ਠੀਕ ਕਰ ਜਾਂ ਮਿਟਾ ਸਕਦੇ ਹੋ, ਇਹ ਜਾਂਚੀ ਹੋਈ ਕਾਪੀ ਸਮਝਾਏਗੀ।'},
    {title: 'ਗਲਤੀ ਰਿਪੋਰਟਾਂ', body: 'ਵਿਕਲਪਿਕ: ਮੂਲ ਰੂਪ ਵਿੱਚ ਬੰਦ, ਸਿਰਫ਼ ਤੁਹਾਡੀ ਸਹਿਮਤੀ ਨਾਲ ਚਾਲੂ ਹੁੰਦਾ ਹੈ, ਅਤੇ ਤੁਸੀਂ ਕਿਸੇ ਵੀ ਸਮੇਂ ਗੋਪਨੀਯਤਾ ਅਤੇ ਸੁਰੱਖਿਆ ਵਿੱਚ ਬਦਲ ਸਕਦੇ ਹੋ। ਜੇ ਐਪ ਵਿੱਚ ਗਲਤੀ ਆ ਜਾਵੇ ਜਾਂ ਇਹ ਅਚਾਨਕ ਬੰਦ ਹੋ ਜਾਵੇ, ਤਾਂ ਯੂਰਪੀ ਸੰਘ ਵਿੱਚ ਹੋਸਟ ਕੀਤੀ ਗਲਤੀ-ਟਰੈਕਿੰਗ ਸੇਵਾ ਨੂੰ ਗੁਮਨਾਮ ਤਕਨੀਕੀ ਰਿਪੋਰਟ ਭੇਜੀ ਜਾ ਸਕਦੀ ਹੈ। ਇਸ ਵਿੱਚ ਸਿਰਫ਼ ਤਕਨੀਕੀ ਜਾਣਕਾਰੀ ਹੁੰਦੀ ਹੈ: ਡਿਵਾਈਸ ਦਾ ਮਾਡਲ ਅਤੇ ਸਿਸਟਮ ਵਰਜ਼ਨ, AWA ਦਾ ਵਰਜ਼ਨ, ਐਪ ਦੀਆਂ ਕੁਝ ਇਜਾਜ਼ਤਾਂ ਦੀ ਸਥਿਤੀ (ਜਿਵੇਂ ਸੂਚਨਾਵਾਂ ਜਾਂ ਟਿਕਾਣਾ, ਦਿੱਤੀਆਂ ਗਈਆਂ ਹਨ ਜਾਂ ਨਹੀਂ), ਬੈਟਰੀ, ਮੈਮਰੀ ਅਤੇ ਸਟੋਰੇਜ, ਕਨੈਕਸ਼ਨ ਦੀ ਕਿਸਮ, ਅਤੇ ਇੱਕ ਗੁਮਨਾਮ ਇੰਸਟਾਲੇਸ਼ਨ ਆਈਡੀ ਜੋ ਐਪ ਨੂੰ ਦੁਬਾਰਾ ਇੰਸਟਾਲ ਕਰਨ \'ਤੇ ਬਦਲ ਜਾਂਦੀ ਹੈ। ਤੁਹਾਡੇ ਵੱਲੋਂ ਲਿਖੀ ਜਾਣਕਾਰੀ, ਸਿਹਤ ਡੇਟਾ, ਨਾਮ, ਈਮੇਲ, IP ਪਤਾ ਜਾਂ ਟਿਕਾਣਾ ਇਸ ਵਿੱਚ ਸ਼ਾਮਲ ਕਰਨ ਦਾ ਇਰਾਦਾ ਨਹੀਂ ਹੈ। ਇਹ ਲਿਖਤ ਕਾਨੂੰਨੀ ਜਾਂਚ ਤੋਂ ਬਾਅਦ ਪੱਕੀ ਕੀਤੀ ਜਾਵੇਗੀ।'},
    {title: 'ਨਿੱਜਤਾ ਲਈ ਸੰਪਰਕ', body: 'ਡੇਟਾ ਸੁਰੱਖਿਆ ਅਧਿਕਾਰੀ ਦੇ ਅੰਤਿਮ ਸੰਪਰਕ ਵੇਰਵੇ ਪ੍ਰਕਾਸ਼ਨ ਤੋਂ ਪਹਿਲਾਂ ਸ਼ਾਮਲ ਕੀਤੇ ਜਾਣਗੇ।'},
  ],
  my: [
    {title: 'အသုံးပြုသော ဒေတာ', body: 'AWA သည် မည်သည့်ဒေတာကို အဘယ်ကြောင့် အသုံးပြုသည်ကို ဤအပိုင်းက ဥပဒေစစ်ဆေးပြီးနောက် ရှင်းလင်းစွာ ဖော်ပြမည်။'},
    {title: 'သိမ်းဆည်းမှုနှင့် လုံခြုံရေး', body: 'ဒေတာကို မည်သို့သိမ်းဆည်းသည်၊ မည်သည့်လုံခြုံရေးအစီအမံများ အသုံးပြုသည်နှင့် မည်မျှကြာကြာ ထားရှိသည်ကို နောက်ဆုံးစာတမ်းက ရှင်းပြမည်။'},
    {title: 'သင့်အခွင့်အရေးများ', body: 'သင့်ဒေတာကို မည်သို့ရယူ၊ ပြင်ဆင် သို့မဟုတ် ဖျက်နိုင်သည်ကို စစ်ဆေးပြီးဗားရှင်းက ရှင်းပြမည်။'},
    {title: 'အမှားအစီရင်ခံစာများ', body: 'ရွေးချယ်စရာ- မူလအားဖြင့် ပိတ်ထားပြီး သင်သဘောတူမှသာ ဖွင့်မည်ဖြစ်ကာ ကိုယ်ရေးလုံခြုံမှုနှင့် လုံခြုံရေးတွင် အချိန်မရွေး ပြောင်းနိုင်သည်။ အက်ပ်တွင် အမှားတစ်ခု ဖြစ်ပေါ်လာလျှင် သို့မဟုတ် ရုတ်တရက် ပိတ်သွားလျှင် ဥရောပသမဂ္ဂတွင် ဆာဗာတည်ထားသော အမှားခြေရာခံဝန်ဆောင်မှုသို့ အမည်မသိ နည်းပညာဆိုင်ရာ အစီရင်ခံစာတစ်ခု ပို့နိုင်ပါသည်။ ၎င်းတွင် နည်းပညာဆိုင်ရာ အချက်အလက်များသာ ပါဝင်သည်- စက်မော်ဒယ်နှင့် စနစ်ဗားရှင်း၊ AWA ဗားရှင်း၊ အက်ပ်၏ ခွင့်ပြုချက်အချို့၏ အခြေအနေ (ဥပမာ အသိပေးချက်များ သို့မဟုတ် တည်နေရာ၊ ပေးထားခြင်း ရှိ မရှိ)၊ ဘက်ထရီ၊ မှတ်ဉာဏ်နှင့် သိုလှောင်ခန်း၊ ချိတ်ဆက်မှုအမျိုးအစား၊ အက်ပ်ကို ပြန်လည်ထည့်သွင်းလျှင် ပြောင်းလဲသွားမည့် အမည်မသိ ထည့်သွင်းမှု ID တို့ ဖြစ်သည်။ သင်ရိုက်ထည့်သည့်အရာ၊ ကျန်းမာရေးဒေတာ၊ အမည်၊ အီးမေးလ်၊ IP လိပ်စာ သို့မဟုတ် တည်နေရာတို့ကို ထည့်သွင်းရန် ရည်ရွယ်ခြင်း မရှိပါ။ ဤစာသားကို ဥပဒေဆိုင်ရာ စစ်ဆေးပြီးနောက် အတည်ပြုမည်ဖြစ်သည်။'},
    {title: 'ကိုယ်ရေးလုံခြုံမှုဆိုင်ရာ ဆက်သွယ်ရန်', body: 'ဒေတာကာကွယ်ရေးအရာရှိ၏ နောက်ဆုံးဆက်သွယ်ရန် အချက်အလက်များကို ထုတ်ဝေမီ ထည့်သွင်းမည်။'},
  ],
  km: [
    {title: 'ទិន្នន័យដែលពាក់ព័ន្ធ', body: 'ផ្នែកនេះនឹងពិពណ៌នាឱ្យបានច្បាស់លាស់អំពីទិន្នន័យដែល AWA ដំណើរការ និងគោលបំណងរបស់វា បន្ទាប់ពីការផ្ទៀងផ្ទាត់ផ្លូវច្បាប់បានបញ្ចប់។'},
    {title: 'ការរក្សាទុក និងសុវត្ថិភាព', body: 'ឯកសារចុងក្រោយនឹងបញ្ជាក់អំពីវិធានការរក្សាទុក ការការពារ និងរយៈពេលរក្សាទុកទិន្នន័យ។'},
    {title: 'សិទ្ធិរបស់អ្នក', body: 'នីតិវិធីសម្រាប់ចូលមើល កែតម្រូវ ឬលុបទិន្នន័យរបស់អ្នក នឹងត្រូវបានពន្យល់លម្អិតក្នុងកំណែដែលបានផ្ទៀងផ្ទាត់។'},
    {title: 'របាយការណ៍កំហុស', body: 'ជាជម្រើស៖ បិទតាមលំនាំដើម បើកតែនៅពេលអ្នកយល់ព្រម ហើយអ្នកអាចផ្លាស់ប្តូរបានគ្រប់ពេលនៅក្នុងឯកជនភាព និងសុវត្ថិភាព។ ប្រសិនបើកម្មវិធីជួបកំហុស ឬបិទភ្លាមៗ របាយការណ៍បច្ចេកទេសអនាមិកអាចត្រូវបានផ្ញើទៅសេវាតាមដានកំហុសដែលបានរៀបចំនៅសហភាពអឺរ៉ុប។ វាមានតែព័ត៌មានបច្ចេកទេសប៉ុណ្ណោះ៖ ម៉ូដែលឧបករណ៍ និងកំណែប្រព័ន្ធ កំណែ AWA ស្ថានភាពនៃការអនុញ្ញាតខ្លះរបស់កម្មវិធី (ឧទាហរណ៍ ការជូនដំណឹង ឬទីតាំង ដែលបានផ្តល់ ឬមិនបានផ្តល់) ថ្ម អង្គចងចាំ និងទំហំផ្ទុក ប្រភេទការតភ្ជាប់ និងលេខសម្គាល់ការដំឡើងអនាមិក ដែលផ្លាស់ប្តូរប្រសិនបើដំឡើងកម្មវិធីឡើងវិញ។ វាមិនមានបំណងមានអ្វីដែលអ្នកបញ្ចូល ទិន្នន័យសុខភាព ឈ្មោះ អ៊ីមែល អាសយដ្ឋាន IP ឬទីតាំងរបស់អ្នកទេ។ អត្ថបទនេះនឹងត្រូវបានបញ្ជាក់បន្ទាប់ពីការត្រួតពិនិត្យផ្លូវច្បាប់។'},
    {title: 'ទំនាក់ទំនងអំពីភាពឯកជន', body: 'អាសយដ្ឋានទំនាក់ទំនងផ្លូវការរបស់មន្ត្រីទទួលបន្ទុកភាពឯកជន នឹងត្រូវបានបន្ថែមមុនការផ្សព្វផ្សាយ។'},
  ],
  lo: [
    {title: 'ຂໍ້ມູນທີ່ກ່ຽວຂ້ອງ', body: 'ສ່ວນນີ້ຈະອະທິບາຍຢ່າງຊັດເຈນກ່ຽວກັບຂໍ້ມູນທີ່ AWA ປະມວນຜົນ ແລະ ຈຸດປະສົງຂອງມັນ ເມື່ອການກວດສອບທາງກົດໝາຍສຳເລັດ.'},
    {title: 'ການເກັບຮັກສາ ແລະ ຄວາມປອດໄພ', body: 'ເອກະສານສຸດທ້າຍຈະລະບຸມາດຕະການເກັບຮັກສາ ການປົກປ້ອງ ແລະ ໄລຍະເວລາເກັບຮັກສາຂໍ້ມູນ.'},
    {title: 'ສິດຂອງທ່ານ', body: 'ຂັ້ນຕອນໃນການເຂົ້າເຖິງ ແກ້ໄຂ ຫຼື ລຶບຂໍ້ມູນຂອງທ່ານ ຈະຖືກອະທິບາຍລະອຽດໃນສະບັບທີ່ຜ່ານການກວດສອບ.'},
    {title: 'ລາຍງານຂໍ້ຜິດພາດ', body: 'ທາງເລືອກ: ປິດໄວ້ຕາມຄ່າເລີ່ມຕົ້ນ, ເປີດສະເພາະເມື່ອເຈົ້າຍິນຍອມ, ແລະ ເຈົ້າປ່ຽນໄດ້ທຸກເວລາໃນ ຄວາມເປັນສ່ວນຕົວ ແລະ ຄວາມປອດໄພ. ຖ້າແອັບພົບຂໍ້ຜິດພາດ ຫຼື ປິດຕົວແບບບໍ່ຄາດຄິດ ອາດມີການສົ່ງລາຍງານດ້ານເຕັກນິກແບບບໍ່ລະບຸຕົວຕົນໄປຍັງບໍລິການຕິດຕາມຂໍ້ຜິດພາດທີ່ໂຮສຢູ່ສະຫະພາບເອີຣົບ. ມັນມີສະເພາະຂໍ້ມູນດ້ານເຕັກນິກເທົ່ານັ້ນ: ລຸ້ນອຸປະກອນ ແລະ ເວີຊັນລະບົບ, ເວີຊັນ AWA, ສະຖານະຂອງສິດບາງຢ່າງຂອງແອັບ (ເຊັ່ນ ການແຈ້ງເຕືອນ ຫຼື ຕຳແໜ່ງ, ອະນຸຍາດແລ້ວ ຫຼື ບໍ່), ແບັດເຕີຣີ, ໜ່ວຍຄວາມຈຳ ແລະ ພື້ນທີ່ຈັດເກັບ, ປະເພດການເຊື່ອມຕໍ່, ແລະ ລະຫັດການຕິດຕັ້ງແບບບໍ່ລະບຸຕົວຕົນທີ່ປ່ຽນເມື່ອຕິດຕັ້ງແອັບໃໝ່. ບໍ່ໄດ້ມີຈຸດປະສົງໃຫ້ມີສິ່ງທີ່ເຈົ້າພິມ, ຂໍ້ມູນສຸຂະພາບ, ຊື່, ອີເມວ, ທີ່ຢູ່ IP ຫຼື ຕຳແໜ່ງຂອງເຈົ້າ. ຂໍ້ຄວາມນີ້ຈະຖືກຢືນຢັນຫຼັງຈາກການກວດສອບທາງກົດໝາຍ.'},
    {title: 'ຕິດຕໍ່ກ່ຽວກັບຄວາມເປັນສ່ວນຕົວ', body: 'ທີ່ຢູ່ຕິດຕໍ່ຢ່າງເປັນທາງການຂອງເຈົ້າໜ້າທີ່ຮັບຜິດຊອບດ້ານຄວາມເປັນສ່ວນຕົວ ຈະຖືກເພີ່ມເຂົ້າມາກ່ອນການເຜີຍແຜ່.'},
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
  if (language === 'zh-Hant') {return 'zh-Hant';}
  if (language === 'ar') {return 'ar';}
  if (language === 'kab') {return 'kab';}
  if (language === 'om') {return 'om';}
  if (language === 'ti') {return 'ti';}
  if (language === 'rw') {return 'rw';}
  if (language === 'rn') {return 'rn';}
  if (language === 'ig') {return 'ig';}
  if (language === 'yo') {return 'yo';}
  if (language === 'zu') {return 'zu';}
  if (language === 'xh') {return 'xh';}
  if (language === 'sn') {return 'sn';}
  if (language === 'ln') {return 'ln';}
  if (language === 'ff') {return 'ff';}
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
  if (language === 'nb') {return 'nb';}
  if (language === 'pl') {return 'pl';}
  if (language === 'uk') {return 'uk';}
  if (language === 'cs') {return 'cs';}
  if (language === 'sk') {return 'sk';}
  if (language === 'hu') {return 'hu';}
  if (language === 'ro') {return 'ro';}
  if (language === 'bg') {return 'bg';}
  if (language === 'sr') {return 'sr';}
  if (language === 'hr') {return 'hr';}
  if (language === 'bs') {return 'bs';}
  if (language === 'sl') {return 'sl';}
  if (language === 'ne') {return 'ne';}
  if (language === 'si') {return 'si';}
  if (language === 'th') {return 'th';}
  if (language === 'vi') {return 'vi';}
  if (language === 'uz') {return 'uz';}
  if (language === 'az') {return 'az';}
  if (language === 'ka') {return 'ka';}
  if (language === 'hy') {return 'hy';}
  if (language === 'tg') {return 'tg';}
  if (language === 'ky') {return 'ky';}
  if (language === 'tk') {return 'tk';}
  if (language === 'ms') {return 'ms';}
  if (language === 'so') {return 'so';}
  if (language === 'sw') {return 'sw';}
  if (language === 'kk') {return 'kk';}
  if (language === 'wo') {return 'wo';}
  if (language === 'ha') {return 'ha';}
  if (language === 'am') {return 'am';}
  if (language === 'nl') {return 'nl';}
  if (language === 'fi') {return 'fi';}
  if (language === 'el') {return 'el';}
  if (language === 'fil') {return 'fil';}
  if (language === 'ta') {return 'ta';}
  if (language === 'te') {return 'te';}
  if (language === 'mr') {return 'mr';}
  if (language === 'gu') {return 'gu';}
  if (language === 'pa') {return 'pa';}
  if (language === 'my') {return 'my';}
  if (language === 'km') {return 'km';}
  if (language === 'lo') {return 'lo';}
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
