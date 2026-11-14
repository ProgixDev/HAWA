# Map and address language (LocationScreen)

## Provider
* **MapTiler** (public client key in `src/config/maps.ts`, already used; nothing new): the `streets-v2` vector style rendered by MapLibre Native 13.2 (`@maplibre/maplibre-react-native` 11.3.6) and the MapTiler Geocoding API (search + reverse geocoding).

## Why the screen showed English (three separate causes)
1. **Map labels** — the served `streets-v2` style hard-wires English: `text-field` is `"{name:en}"` (cities, capitals, countries, continents, oceans), `["coalesce",["get","name:en"],["get","name"]]` (roads, rivers, lakes, states, towns, ferries), a stops function with `{name:en}` (airports) and `"{name}"` (POI, "Place labels"). The style endpoint ignores a `language` parameter (checked: identical response). → fixed by `localizeMapStyle()`.
2. **"London, United Kingdom"** in the search field — the neutral London default (`LONDON_FALLBACK`) is two English literals; nothing re-asked the provider for them. → the place is now re-named by the provider in the active language (`mapProvider.localizePlace`), coordinates unchanged.
3. **"Chinatown, Royaume-Uni"** — *not a bug*: the geocoder already localized the country; "Chinatown" has no French (or Japanese …) name in the data (`text_fr` = `text`), so the provider's own name is the correct fallback. Proper names are never translated by the app.

## What the provider supports (verified live, 2026-10-20)
| | Result |
|---|---|
| Vector tiles | carry `name:<lang>` for fr en es it tr ru de zh (`name:zh`, `name:zh-Hans`) id hi sq ja ko pt ar (+ ~60 more) and `name:latin`; no `name:nonlatin` |
| Style fonts | the name layers use `Roboto … , Noto Sans …` stacks; the glyph server has Latin, Cyrillic, Devanagari, kana and Han ranges for the `Noto Sans` stacks (a `Roboto`-only stack is empty for them, but it is only used by the `{ref}` road-shield layers, which are not localized) |
| Geocoding `language` | accepted for all AWA languages (Portuguese as `pt` only) and `ar` (Korean verified live: `language=ko` returns 그레이터런던, 영국 for London); **an unknown code (`zh-Hans`, `xx`) is rejected with HTTP 400** → `mapLanguageFor()` only sends known codes |
| Geocoding fields | `text_<lang>` / `place_name_<lang>` (+ the same per `context` item); a place without a translation returns `text_<lang>` equal to its own name |
| Lookup by feature id | works but returns **no country context**, so re-localizing searches the stored name (matched in any language) with the coordinates as `proximity`, takes a result within 50 km (same id preferred) |

## What was changed
* `services/maps/mapLanguage.ts` (new, pure): language validation, tile-property selection (`name:<lang>` → `name:latin` for Latin-script languages → `name`), `localizeMapStyle()` (rewrites only the `text-field` of name layers; house numbers, `{ref}` shields and airport codes untouched; English returns the same style object).
* `services/maps/mapProvider.ts`: explicit `language` option (default = current app language), validated; `AbortSignal` support → `CANCELLED`; `localizePlace()`; results carry `language`.
* `screens/LocationScreen.tsx`: style downloaded once, localized with `useMemo` on the active language; search / reverse geocoding pass the language and abort when superseded; the selected place is re-named on language change or when its names are in another language; the English literal is not flashed while re-asking.
* `OnboardingLocation.language` (optional) is stored with a confirmed place; `resolveInitialLocation()` marks the London default as English.

## Labels that can and cannot be localized
* **Can**: every label that reads a name from the tiles (cities, towns, states, countries, continents, oceans, lakes, rivers, roads, ferries, POI, stations, airports) — wherever OpenStreetMap has `name:<lang>`; country / region / city names in search and addresses.
* **Cannot**: a place whose data has no name in that language (it shows its local / Latin name — correct); the `{ref}` shields and numbers; street *names* of small streets and most POI, which usually exist only in the local language; the part of an address the provider returns untranslated (e.g. "Greater London" next to a Japanese country in `ja` place names).

## "stream was reset: CANCEL"
Not a functional problem. The string is an OkHttp HTTP/2 reset surfaced by MapLibre Native's own HTTP layer, whose log text (found in `org.maplibre.android.module.http.HttpRequestImpl` of `android-sdk-opengl` 13.2.0) is: *"[HTTP] This request was cancelled (%s). This is expected for tiles that were being prefetched but are no longer needed for the map to render."* It appears when the camera moves or the style is replaced (including the language switch, which re-applies the style) and in-flight tile / glyph requests are dropped. AWA's own `fetch` calls (style, geocoding) are now aborted explicitly and report `CANCELLED`, never an error to the user. Nothing was suppressed. **Not verified on a device** (no Android run); to confirm: `adb logcat | findstr Mbgl-HttpRequest` while panning, and check that labels and tiles still render.

## Remaining Android checks
See the end of the task report: language switch on the live map (labels re-draw without moving), kana / Devanagari / Cyrillic labels visible at zoom 10–16, offline behaviour of the default, TalkBack on the location card.

## Korean (`ko`) — verified live, 2026-10-21
* Tiles carry `name:ko`; `ko` is in `MAP_LANGUAGES` and `NON_LATIN_SCRIPT` (chain `name:ko` → `name`, no Latin fallback, like ja / zh / hi / ru).
* Geocoding with `language=ko` is accepted (London → 「그레이터런던, 영국」); a Korean query returns Korean addresses (「세종대로20길 15, 04524 명동, 대한민국」); coordinates unchanged.
* The glyph server was queried for all three name-label font stacks of the MapTiler streets style: **all 11,172 Hangul syllables have a glyph in every stack**, so no boxes are drawn on the map.

## Portuguese (`pt-PT` / `pt-BR`) — verified live, 2026-10-21
* The provider knows **one** Portuguese: the geocoder answers `language=pt` but rejects `pt-PT` and `pt-BR` with **HTTP 400** (`ERR_VALIDATION`), so `mapLanguageFor()` reduces both app languages (and any `pt-*` tag) to `pt`. Tiles carry `name:pt`; `pt` is a Latin-script language (chain `name:pt` → `name:latin` → `name`).
* Search / reverse geocoding: *Lisbon → « Lisboa, Portugal »*, *São Paulo → « São Paulo, Brasil »*, *London → « Grande Londres, Reino Unido »*. A place without a Portuguese name keeps its local name. Coordinates, camera, offline behaviour and cancellation are unchanged. Both variants therefore show the same map labels (the provider has no Brazil-specific names).
* Latin letters with diacritics need no glyph check beyond the existing Latin ranges (the Latin-1 supplement is in every name-label font stack).

## Bengali (`bn`) — verified live, 2026-10-21; map LABELS fall back to Latin
* The geocoder accepts `language=bn` (London → results with « যুক্তরাজ্য »; « ঢাকা » → « ঢাকা, বাংলাদেশ »; « Kolkata » → « কলকাতা, পশ্চিমবঙ্গ, ভারত ») and rejects `bn-BD` with **HTTP 400**, so `mapLanguageFor()` reduces every `bn-*` tag to `bn`. The Greater London municipality has no Bengali name in the data and keeps its local one. Search results, the address line and the location card are React Native `Text`, shaped by Android: they display Bengali correctly.
* **Map labels cannot be Bengali.** MapLibre Native draws label text itself and has **no complex-script shaping engine** (no HarfBuzz): Bengali conjuncts, reph and reordered vowel signs would be drawn as unjoined letters in the wrong order, which is worse than Latin. `mapLanguage.ts` therefore marks `bn` as an *unshaped script* (`mapLabelsUseLatinFallback('bn')`): the rewritten style never reads `name:bn`; every label asks `name:latin` → `name:en` → the local name. The interface stays Bengali; only the drawn place names on the map are Latin. The camera, the saved coordinates and request cancellation are unchanged (`stream was reset: CANCEL` is still expected on a language switch).
* Check on a device: Location screen in Bengali shows Latin labels (no boxes, no broken Bengali); search « ঢাকা » returns Bengali addresses in the list.
* **Same limitation for Hindi (`hi`)**: the style asks `name:hi`, so Devanagari labels on the map are probably drawn unshaped (conjuncts / matras broken). This was not changed (out of scope for the Bengali work) and not verified on a device; a follow-up should either confirm the rendering on a phone or put `hi` in `UNSHAPED_SCRIPT` as well.

## Danish (`da`) — added 2026-10-25; not yet verified on a device

* Danish is **Latin script** — it is not in `NON_LATIN_SCRIPT` and not in `UNSHAPED_SCRIPT`. Map labels read `name:da` with a `name:latin` → `name` fallback chain, same as French, Spanish, German, etc.
* `mapLanguageFor('da-DK')` → `'da'`; the geocoder receives `language=da`. MapTiler vector tiles carry `name:da` for most populated places (European coverage is complete; remote regions may only have the local name).
* **Not yet verified on a device.** A future check should confirm: Location screen in Danish shows Danish city/country labels; geocoder returns Danish-language addresses; `CANCEL` log is expected on a language switch (unchanged camera-reset behavior).

## Malay (`ms`) — verified live, 2026-10-28; not yet verified on a device

* Latin script (not in `NON_LATIN_SCRIPT` / `UNSHAPED_SCRIPT`). The MapTiler geocoder **accepts `language=ms`** (HTTP 200; unknown codes such as `xx` still return HTTP 400), so `ms` is in `MAP_LANGUAGES`; `mapLanguageFor('ms-MY')` → `'ms'`.
* The vector tiles do **not** carry `name:ms` (tiles z4–z6 over South-East Asia contain `name:id`, `name:ko`, `name:latin` but no `name:ms`), so labels resolve through the existing chain `name:ms` → `name:latin` → `name` (local name, Latin script). Search results and addresses are requested in Malay; a place with no Malay name keeps its provider name (e.g. "Kuala Lumpur", "Johor Bahru").
* Device check pending: Location screen in Malay shows readable Latin labels, search returns results, `CANCEL` log on language switch is expected.
