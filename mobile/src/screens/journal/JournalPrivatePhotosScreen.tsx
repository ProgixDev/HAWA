import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Animated, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {launchCamera, launchImageLibrary, type ErrorCode} from 'react-native-image-picker';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {deleteJournalSection, getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {resolvePrivatePhotos, type PrivatePhoto} from '../../types/journal';
import {isIntimacyUnlocked, lockIntimacy} from '../../state/privateSectionAuthStore';
import {copyPrivatePhotoToAppStorage, deletePrivatePhotoFile, isAppOwnedPrivatePhotoUri, isEncryptedPrivatePhotoUri, readPrivatePhotoAsDataUri} from '../../services/privatePhotoStorage';
import {TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../../theme/spacing';
import {JournalSaveToast, useJournalSaveToast} from '../../components/journal/JournalSaveToast';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

/* ============================================================
   TYPES
============================================================ */

type Props = NativeStackScreenProps<RootStackParamList, 'PrivatePhotoEntry'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const DATE_KEY = () => new Date().toLocaleDateString('en-CA');
const MAX_PRIVATE_PHOTOS_PER_DAY = 5;

// Same timestamp+random idiom already used elsewhere in this codebase
// (privateSectionAuth.ts's randomSalt(), dailyJournalStore.ts's entry id) —
// no uuid dependency needed for a locally-unique, non-persisted-elsewhere id.
const newPhotoId = (): string => `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const PICKER_ERROR_MESSAGE: Record<ErrorCode, string> = {
  camera_unavailable: 'La caméra n’est pas disponible sur cet appareil.',
  permission: 'Autorise l’accès à la caméra ou à la galerie dans les réglages pour ajouter une photo.',
  others: 'Impossible d’ouvrir la sélection de photo pour le moment.',
};

// Which picker call is in flight: adding a new photo, or replacing an
// existing one (its id). Also doubles as the "choose source" sheet's
// visibility — the sheet is open whenever this isn't null.
type PendingPick = 'add' | {replaceId: string} | null;

/** Always holds the latest `value` behind a stable ref identity — lets an
 * effect depend on a primitive (like a uri) without also depending on a
 * callback that's re-created every render, which would otherwise re-run the
 * effect (and re-decrypt) on every unrelated parent re-render. */
function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/** Resolves a private-photo `uri` into what `<Image>` should actually render.
 * A legacy plaintext file (or a not-yet-saved fresh pick) is returned as-is,
 * synchronously — unchanged from before this feature existed. An encrypted
 * (`.awaenc`) file is decrypted into an in-memory `data:` URI; no plaintext
 * temporary file is ever written to disk. `onFailure` fires once if
 * decryption throws (corrupted/tampered file), routed into the same
 * failedIds/"Photo indisponible" handling as any other unavailable photo. */
function useDecryptedPhotoUri(uri: string | null, onFailure: () => void): {uri: string | null; loading: boolean} {
  const [resolved, setResolved] = useState<{forUri: string; dataUri: string} | null>(null);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const onFailureRef = useLatest(onFailure);

  useEffect(() => {
    if (!uri || !isEncryptedPrivatePhotoUri(uri)) {return;}
    let cancelled = false;
    readPrivatePhotoAsDataUri(uri)
      .then(dataUri => {if (!cancelled) {setResolved({forUri: uri, dataUri});}})
      .catch(() => {
        if (!cancelled) {
          setFailedUri(uri);
          onFailureRef.current();
        }
      });
    return () => {cancelled = true;};
  }, [uri, onFailureRef]);

  if (!uri) {return {uri: null, loading: false};}
  if (!isEncryptedPrivatePhotoUri(uri)) {return {uri, loading: false};}
  if (failedUri === uri) {return {uri: null, loading: false};}
  if (resolved?.forUri === uri) {return {uri: resolved.dataUri, loading: false};}
  return {uri: null, loading: true};
}

export default function JournalPrivatePhotosScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 380 || height < 720;
  const veryCompact = width < 340 || height < 640;
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [draftPhotos, setDraftPhotos] = useState<PrivatePhoto[]>([]);
  const [hadLegacyPhoto, setHadLegacyPhoto] = useState(false);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [pendingPick, setPendingPick] = useState<PendingPick>(null);
  const [pickerError, setPickerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveToast = useJournalSaveToast();
  const entrance = useRef(new Animated.Value(0)).current;

  // Snapshot of each photo's URI as of the last successful save (or initial
  // load) — used at the next Save to tell exactly which ids were replaced
  // (uri changed) or removed (id missing) so their superseded AWA-owned file
  // can be deleted only after the new state is durably persisted. Never
  // compared against a raw/external URI directly for deletion purposes —
  // deletePrivatePhotoFile() itself refuses anything outside app storage,
  // so this map staying "impure" (it may hold a not-yet-durable legacy or
  // fresh-pick URI) can never cause an external file to be deleted.
  const originalUrisRef = useRef<Map<string, string>>(new Map());
  // MIME/filename hints for photos picked THIS session, keyed by photo id —
  // never persisted (irrelevant once a photo is copied, since its extension
  // is already baked into the destination filename); only consulted at Save
  // time to pick a sensible extension for a freshly-picked file.
  const assetHintsRef = useRef<Record<string, {mimeType?: string; fileName?: string}>>({});

  const markFailed = (id: string) => {
    setFailedIds(current => new Set(current).add(id));
  };

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}).format(new Date());
  const canAddMore = draftPhotos.length < MAX_PRIVATE_PHOTOS_PER_DAY;
  const selectedPhoto = draftPhotos.find(photo => photo.id === selectedPhotoId) ?? null;
  const selectedPhotoFailed = selectedPhoto ? failedIds.has(selectedPhoto.id) : false;
  const selectedPhotoDisplay = useDecryptedPhotoUri(
    selectedPhoto && !selectedPhotoFailed ? selectedPhoto.uri : null,
    () => {if (selectedPhoto) {markFailed(selectedPhoto.id);}},
  );

  useEffect(() => {
    if (!isIntimacyUnlocked()) {navigation.replace('PrivateIntimacyUnlock', {target: 'photos'}); return;}
    getJournalEntry(DATE_KEY()).then(entry => {
      const resolved = resolvePrivatePhotos(entry);
      setDraftPhotos(resolved);
      originalUrisRef.current = new Map(resolved.map(photo => [photo.id, photo.uri]));
      setHadLegacyPhoto(Boolean(entry?.privatePhoto?.uri) && !entry?.privatePhotos);
    });
    Animated.timing(entrance, {toValue: 1, duration: 320, useNativeDriver: true}).start();
  }, [entrance, navigation]);

  const mask = () => {
    lockIntimacy();
    navigation.replace('PrivateIntimacyUnlock', {target: 'photos'});
  };

  const pick = async (fromCamera: boolean, replaceId?: string) => {
    if (busy) {return;}
    if (!replaceId && draftPhotos.length >= MAX_PRIVATE_PHOTOS_PER_DAY) {return;}
    setPickerError('');
    setBusy(true);
    try {
      const result = fromCamera
        ? await launchCamera({mediaType: 'photo', quality: 0.8})
        : await launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1});
      if (result.didCancel) {return;}
      if (result.errorCode) {setPickerError(PICKER_ERROR_MESSAGE[result.errorCode]); return;}
      const asset = result.assets?.[0];
      const uri = asset?.uri;
      if (!uri) {setPickerError(PICKER_ERROR_MESSAGE.others); return;}

      const addedAt = new Date().toISOString();
      if (replaceId) {
        setDraftPhotos(current => current.map(photo => (photo.id === replaceId ? {...photo, uri, addedAt} : photo)));
        assetHintsRef.current[replaceId] = {mimeType: asset.type, fileName: asset.fileName};
        setFailedIds(current => {
          if (!current.has(replaceId)) {return current;}
          const next = new Set(current);
          next.delete(replaceId);
          return next;
        });
      } else {
        const id = newPhotoId();
        setDraftPhotos(current => [...current, {id, uri, addedAt}]);
        assetHintsRef.current[id] = {mimeType: asset.type, fileName: asset.fileName};
      }
    } catch {
      setPickerError(PICKER_ERROR_MESSAGE.others);
    } finally {
      setBusy(false);
    }
  };

  const openAddSheet = () => {
    if (!canAddMore) {return;}
    setPendingPick('add');
  };

  const openReplaceSheet = (id: string) => {
    setSelectedPhotoId(null);
    setPendingPick({replaceId: id});
  };

  const chooseSource = (fromCamera: boolean) => {
    const target = pendingPick;
    setPendingPick(null);
    if (!target) {return;}
    pick(fromCamera, target === 'add' ? undefined : target.replaceId);
  };

  const removePhoto = (id: string) => {
    setDraftPhotos(current => current.filter(photo => photo.id !== id));
    setSelectedPhotoId(null);
  };

  const save = async () => {
    if (saving) {return;}
    try {
      setSaving(true);
      const date = DATE_KEY();

      // Durable-storage encrypt+copy happens here, at Save — never at pick
      // time — so cancelling without saving never creates a file to clean
      // up (see privatePhotoStorage.ts's header comment). This single pass
      // also covers two migration cases uniformly: a photo loaded from an
      // old entry that was never copied at all ("not yet app-owned"), and
      // one already copied but still plaintext from before encryption
      // existed ("app-owned but not yet .awaenc") — both are just "needs
      // (re-)processing" and get encrypted the same way a fresh pick would.
      // One photo's failure keeps its previous uri (still works this
      // session) and never blocks the other up-to-4 photos' save.
      let hadCopyFailure = false;
      const finalizedPhotos = await Promise.all(draftPhotos.map(async photo => {
        if (isAppOwnedPrivatePhotoUri(photo.uri) && isEncryptedPrivatePhotoUri(photo.uri)) {return photo;}
        try {
          const hint = assetHintsRef.current[photo.id];
          const durableUri = await copyPrivatePhotoToAppStorage(photo.uri, date, photo.id, hint?.mimeType, hint?.fileName);
          return {...photo, uri: durableUri};
        } catch {
          hadCopyFailure = true;
          return photo;
        }
      }));

      if (finalizedPhotos.length > 0) {
        await saveJournalSection(date, 'privatePhotos', finalizedPhotos);
      } else {
        await deleteJournalSection(date, 'privatePhotos');
      }

      // Once this day's photos are saved in the new array shape, the old
      // legacy single-photo field (if this day had one) is redundant —
      // draftPhotos already carries everything it held (see the load-time
      // migration in resolvePrivatePhotos()). Removing it here means this
      // day never needs read-time compatibility again; days never revisited
      // keep the legacy field untouched, so nothing is lost app-wide.
      //
      // This still deletes the legacy field even if that photo's durable
      // copy above failed (hadCopyFailure): finalizedPhotos then keeps its
      // original, still-working raw URI, so the reference itself is never
      // lost — it just moves from `privatePhoto` to `privatePhotos` as-is,
      // remains non-app-owned, and gets retried the next time this day is
      // opened and saved (see copyPrivatePhotoToAppStorage's callers above).
      if (hadLegacyPhoto) {
        await deleteJournalSection(date, 'privatePhoto');
        setHadLegacyPhoto(false);
      }

      // Only now that the new state is durably saved: delete whatever
      // AWA-owned file each replaced/removed photo used to point to.
      // deletePrivatePhotoFile() itself refuses to delete anything that
      // isn't ours (a raw legacy/gallery URI is silently left untouched),
      // so this is safe even though `originalUri` here may never have been
      // app-owned in the first place.
      const finalUriById = new Map(finalizedPhotos.map(photo => [photo.id, photo.uri]));
      await Promise.all(
        Array.from(originalUrisRef.current.entries()).map(([id, originalUri]) => {
          const currentUri = finalUriById.get(id);
          return currentUri === originalUri ? Promise.resolve() : deletePrivatePhotoFile(originalUri);
        }),
      );

      setDraftPhotos(finalizedPhotos);
      originalUrisRef.current = finalUriById;
      assetHintsRef.current = {};

      saveToast.show(
        'Photos enregistrées',
        hadCopyFailure
          ? 'Enregistré, mais certaines photos n’ont pas pu être stockées de façon durable — réessaie si besoin.'
          : 'Tes photos ont bien été mises à jour dans le journal.',
        navigation.goBack,
      );
    } catch {
      Alert.alert('Erreur', 'Impossible d’enregistrer pour le moment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.statusBarStyle} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={[styles.header, {paddingTop: veryCompact ? TOP_SPACING_EXTRA_COMPACT : TOP_SPACING_EXTRA}]}>
          <Pressable accessibilityLabel="Retour" accessibilityRole="button" onPress={navigation.goBack} style={styles.headerButton}>
            <MaterialDesignIcons color={theme.colors.accent} name="chevron-left" size={27} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Photos privées</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
          <Pressable accessibilityLabel="Masquer" accessibilityRole="button" onPress={mask} style={styles.mask}>
            <MaterialDesignIcons color={theme.colors.primary} name="eye-off-outline" size={17} />
            <Text style={styles.maskText}>Masquer</Text>
          </Pressable>
        </View>

        <Animated.View style={[styles.flex, {opacity: entrance, transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}]}]}>
          <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 22}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Suis ton évolution visuelle en toute discrétion — acné, pilosité, symptômes cutanés.</Text>

            <View style={styles.photoCard}>
              <View style={styles.photoCardHeader}>
                <View style={styles.photoCardHeaderIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={19} />
                </View>
                <View style={styles.photoCardHeaderCopy}>
                  <Text style={styles.photoCardEyebrow}>ESPACE PRIVÉ</Text>
                  <Text style={styles.photoCardTitle}>Mes photos</Text>
                </View>
                <View style={styles.counterPill}>
                  <Text style={styles.counterPillText}>{draftPhotos.length} / {MAX_PRIVATE_PHOTOS_PER_DAY} photos</Text>
                </View>
              </View>

              {draftPhotos.length === 0 ? (
                <>
                  <View style={[styles.empty, compact && styles.emptyCompact]}>
                    <View style={styles.emptyIconOuter}>
                      <View style={styles.emptyIcon}>
                        <MaterialDesignIcons color={theme.colors.primary} name="camera-lock-outline" size={34} />
                      </View>
                      <View style={styles.emptyLockBadge}>
                        <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="lock" size={11} />
                      </View>
                    </View>
                    <Text style={styles.emptyTitle}>Ajoute une photo privée</Text>
                    <Text style={styles.emptyText}>Choisis une photo existante ou prends-en une nouvelle pour suivre ton évolution.</Text>
                  </View>

                  <View style={styles.choiceDivider}>
                    <View style={styles.choiceDividerLine} />
                    <Text style={styles.choiceDividerText}>CHOISIR UNE SOURCE</Text>
                    <View style={styles.choiceDividerLine} />
                  </View>

                  <SourceCard disabled={busy} icon="image-multiple-outline" label="Galerie" onPress={() => pick(false)} subtitle="Choisir depuis la galerie" tone="purple" />
                  <SourceCard disabled={busy} icon="camera-outline" label="Appareil photo" onPress={() => pick(true)} subtitle="Prendre une nouvelle photo" tone="neutral" />
                </>
              ) : (
                <View style={styles.grid}>
                  {draftPhotos.map(photo => (
                    <PhotoGridCell failed={failedIds.has(photo.id)} key={photo.id} onError={() => markFailed(photo.id)} onPress={() => setSelectedPhotoId(photo.id)} photo={photo} />
                  ))}
                  {canAddMore ? (
                    <Pressable accessibilityLabel="Ajouter une photo" accessibilityRole="button" disabled={busy} onPress={openAddSheet} style={({pressed}) => [styles.gridCell, styles.addCell, pressed && styles.sourceCardPressed, busy && styles.disabled]}>
                      <MaterialDesignIcons color={theme.colors.primary} name="plus" size={26} />
                      <Text style={styles.addCellText}>Ajouter</Text>
                    </Pressable>
                  ) : null}
                </View>
              )}

              {pickerError ? (
                <View accessibilityRole="alert" style={styles.errorCard}>
                  <View style={styles.errorIcon}>
                    <MaterialDesignIcons color={theme.colors.danger} name="alert-circle-outline" size={18} />
                  </View>
                  <Text style={styles.pickerErrorText}>{pickerError}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.security}>
              <View style={styles.securityIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={20} />
              </View>
              <Text style={styles.securityText}>Tes photos sont enregistrées localement dans l’espace privé de l’application.</Text>
            </View>

            <Pressable accessibilityLabel="Enregistrer" accessibilityRole="button" disabled={saving} onPress={save} style={({pressed}) => [styles.save, pressed && styles.pressed, saving && styles.disabled]}>
              <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={saving ? 'loading' : 'content-save-outline'} size={20} />
              <Text style={styles.saveText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* DETAIL — tap a thumbnail (or its "indisponible" placeholder) to see
          it larger and access Remplacer/Supprimer for that one photo. */}
      <Modal animationType="fade" onRequestClose={() => setSelectedPhotoId(null)} transparent visible={Boolean(selectedPhoto)}>
        <View style={styles.overlay}>
          <Pressable onPress={() => setSelectedPhotoId(null)} style={StyleSheet.absoluteFill} />
          <View style={[styles.detailSheet, {paddingBottom: Math.max(insets.bottom, 16)}]}>
            <View style={styles.handle} />
            {selectedPhoto && !selectedPhotoFailed ? (
              selectedPhotoDisplay.uri ? (
                <Image accessibilityIgnoresInvertColors onError={() => selectedPhoto && markFailed(selectedPhoto.id)} resizeMode="cover" source={{uri: selectedPhotoDisplay.uri}} style={[styles.detailImage, compact && styles.detailImageCompact]} />
              ) : (
                <View style={[styles.detailImage, compact && styles.detailImageCompact, styles.detailLoading]}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              )
            ) : (
              <View style={[styles.detailUnavailable, compact && styles.detailUnavailableCompact]}>
                <MaterialDesignIcons color={theme.colors.primary} name="image-off-outline" size={34} />
                <Text style={styles.detailUnavailableText}>Cette photo n’est plus accessible sur cet appareil.</Text>
              </View>
            )}
            <View style={styles.detailActionsRow}>
              <PhotoActionCard icon="image-refresh-outline" label="Remplacer" onPress={() => selectedPhoto && openReplaceSheet(selectedPhoto.id)} subtitle="Choisir une autre photo" tone="purple" />
              <PhotoActionCard icon="trash-can-outline" label="Supprimer" onPress={() => selectedPhoto && removePhoto(selectedPhoto.id)} subtitle="Retirer du journal" tone="danger" />
            </View>
          </View>
        </View>
      </Modal>

      {/* SOURCE SHEET — reused for both "Ajouter" (from the grid) and
          "Remplacer" (from the detail view above); pendingPick tracks which. */}
      <Modal animationType="fade" onRequestClose={() => setPendingPick(null)} transparent visible={Boolean(pendingPick)}>
        <View style={styles.overlay}>
          <Pressable onPress={() => setPendingPick(null)} style={StyleSheet.absoluteFill} />
          <View style={[styles.sourceSheet, {paddingBottom: Math.max(insets.bottom, 16)}]}>
            <View style={styles.handle} />
            <Text style={styles.sourceSheetTitle}>Choisir une source</Text>
            <SourceCard disabled={busy} icon="image-multiple-outline" label="Galerie" onPress={() => chooseSource(false)} subtitle="Choisir depuis la galerie" tone="purple" />
            <SourceCard disabled={busy} icon="camera-outline" label="Appareil photo" onPress={() => chooseSource(true)} subtitle="Prendre une nouvelle photo" tone="neutral" />
          </View>
        </View>
      </Modal>

      <JournalSaveToast animation={saveToast.animation} bottom={Math.max(insets.bottom, 18) + 12} message={saveToast.message} onDismiss={saveToast.hide} title={saveToast.title} visible={saveToast.visible} />
    </SafeAreaView>
  );
}

/* ============================================================
   GRID CELL
============================================================ */

function PhotoGridCell({photo, failed, onPress, onError}: {photo: PrivatePhoto; failed: boolean; onPress: () => void; onError: () => void}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const display = useDecryptedPhotoUri(failed ? null : photo.uri, onError);
  return (
    <Pressable accessibilityLabel={failed ? 'Photo indisponible' : 'Voir la photo'} accessibilityRole="button" onPress={onPress} style={styles.gridCell}>
      {failed ? (
        <View style={styles.gridCellUnavailable}>
          <MaterialDesignIcons color={theme.colors.textMuted} name="image-off-outline" size={24} />
        </View>
      ) : display.uri ? (
        <Image accessibilityIgnoresInvertColors onError={onError} resizeMode="cover" source={{uri: display.uri}} style={styles.gridCellImage} />
      ) : (
        <View style={styles.gridCellLoading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}
    </Pressable>
  );
}

/* ============================================================
   SOURCE CARD
============================================================ */

function SourceCard({icon, label, subtitle, onPress, disabled, tone}: {icon: IconName; label: string; subtitle: string; onPress: () => void; disabled?: boolean; tone: 'purple' | 'neutral'}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed}) => [styles.sourceCard, tone === 'purple' && styles.galleryCard, pressed && styles.sourceCardPressed, disabled && styles.disabled]}>
      <View style={tone === 'purple' ? styles.sourceCardIconPurple : styles.sourceCardIconNeutral}>
        <MaterialDesignIcons color={tone === 'purple' ? theme.colors.primary : theme.colors.accent} name={icon} size={27} />
      </View>
      <View style={styles.sourceCardCopy}>
        <Text style={styles.sourceCardTitle}>{label}</Text>
        <Text style={styles.sourceCardText}>{subtitle}</Text>
      </View>
      <View style={styles.sourceArrow}>
        <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={20} />
      </View>
    </Pressable>
  );
}

/* ============================================================
   ACTION CARD
============================================================ */

function PhotoActionCard({disabled, icon, label, onPress, subtitle, tone}: {disabled?: boolean; icon: IconName; label: string; onPress: () => void; subtitle: string; tone: 'purple' | 'danger'}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const danger = tone === 'danger';
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed}) => [styles.actionCard, danger && styles.actionCardDanger, pressed && styles.sourceCardPressed, disabled && styles.disabled]}>
      <View style={[styles.actionCardIcon, danger && styles.actionCardIconDanger]}>
        <MaterialDesignIcons color={danger ? theme.colors.danger : theme.colors.primary} name={icon} size={20} />
      </View>
      <View style={styles.actionCardCopy}>
        <Text style={[styles.actionCardTitle, danger && styles.actionCardTitleDanger]}>{label}</Text>
        <Text style={styles.actionCardSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    flex: {flex: 1},

    header: {minHeight: 88, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, gap: 8},
    headerButton: {width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 15, backgroundColor: theme.colors.surface},
    headerCopy: {flex: 1, alignItems: 'center', minWidth: 0},
    title: {color: theme.colors.accent, fontSize: 20, fontWeight: '800'},
    date: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11},
    mask: {height: 39, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 14, backgroundColor: theme.colors.surface},
    maskText: {color: theme.colors.primary, fontSize: 10, fontWeight: '700'},

    content: {paddingHorizontal: 14, paddingTop: 6, gap: 14},
    subtitle: {color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19},

    photoCard: {overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 24, backgroundColor: theme.colors.surface, padding: 14, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3},
    photoCardHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
    photoCardHeaderIcon: {width: 40, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.colors.primarySoft},
    photoCardHeaderCopy: {flex: 1, minWidth: 0, marginLeft: 9},
    photoCardEyebrow: {color: theme.colors.primary, fontSize: 7.5, fontWeight: '900', letterSpacing: 1},
    photoCardTitle: {marginTop: 2, color: theme.colors.accent, fontSize: 14, fontWeight: '800'},
    counterPill: {flexShrink: 0, borderRadius: 11, backgroundColor: withAlpha(theme.colors.primary, 0.20), paddingHorizontal: 9, paddingVertical: 6},
    counterPillText: {color: theme.colors.accent, fontSize: 10, fontWeight: '800'},

    empty: {alignItems: 'center', paddingTop: 12, paddingBottom: 18, paddingHorizontal: 10},
    emptyCompact: {paddingVertical: 11},
    emptyIconOuter: {position: 'relative', width: 82, height: 82, alignItems: 'center', justifyContent: 'center'},
    emptyIcon: {width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: theme.colors.primarySoft, transform: [{rotate: '-3deg'}]},
    emptyLockBadge: {position: 'absolute', right: 0, bottom: 2, width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.colors.surface, borderRadius: 13, backgroundColor: theme.colors.primary},
    emptyTitle: {marginTop: 13, color: theme.colors.accent, fontSize: 17, fontWeight: '800', textAlign: 'center'},
    emptyText: {maxWidth: 300, marginTop: 6, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center'},

    choiceDivider: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10},
    choiceDividerLine: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: withAlpha(theme.colors.primary, 0.14)},
    choiceDividerText: {color: theme.colors.textMuted, fontSize: 7.5, fontWeight: '800', letterSpacing: 0.8},

    sourceCard: {minHeight: 72, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 18, backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: 11, paddingVertical: 10, marginBottom: 9},
    galleryCard: {borderColor: withAlpha(theme.colors.primary, 0.20), backgroundColor: theme.colors.primarySoft},
    sourceCardPressed: {opacity: 0.8, transform: [{scale: 0.992}]},
    sourceCardIconPurple: {width: 47, height: 47, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.primarySoft},
    sourceCardIconNeutral: {width: 47, height: 47, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.colors.surfaceSecondary},
    sourceCardCopy: {flex: 1, minWidth: 0, marginLeft: 11},
    sourceCardTitle: {color: theme.colors.accent, fontSize: 13, fontWeight: '800'},
    sourceCardText: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 9.5, lineHeight: 13},
    sourceArrow: {width: 31, height: 31, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: theme.colors.surface},

    grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
    gridCell: {width: '47%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: theme.colors.surfaceSecondary},
    gridCellImage: {width: '100%', height: '100%'},
    gridCellUnavailable: {flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: withAlpha(theme.colors.primary, 0.30), backgroundColor: theme.colors.surfaceSecondary},
    gridCellLoading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceSecondary},
    addCell: {borderWidth: 1, borderStyle: 'dashed', borderColor: withAlpha(theme.colors.primary, 0.35), backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 6},
    addCellText: {color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},

    actionSectionLabel: {marginTop: 14, marginBottom: 8, color: theme.colors.text, fontSize: 11.5, fontWeight: '800'},
    actionCardsRow: {flexDirection: 'row', gap: 9},
    actionCard: {flex: 1, minWidth: 0, minHeight: 74, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.25), borderRadius: 17, backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: 9, paddingVertical: 9},
    actionCardDanger: {borderColor: withAlpha(theme.colors.danger, 0.35), backgroundColor: withAlpha(theme.colors.danger, 0.08)},
    actionCardIcon: {width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.primarySoft},
    actionCardIconDanger: {backgroundColor: withAlpha(theme.colors.danger, 0.18)},
    actionCardCopy: {flex: 1, minWidth: 0, marginLeft: 8},
    actionCardTitle: {color: theme.colors.accent, fontSize: 11, fontWeight: '800'},
    actionCardTitleDanger: {color: theme.colors.danger},
    actionCardSubtitle: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 8, lineHeight: 11},

    errorCard: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11, borderRadius: 14, backgroundColor: withAlpha(theme.colors.danger, 0.08), paddingHorizontal: 10, paddingVertical: 9},
    errorIcon: {width: 30, height: 30, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: withAlpha(theme.colors.danger, 0.15)},
    pickerErrorText: {flex: 1, color: theme.colors.danger, fontSize: 10.5, lineHeight: 15},

    security: {minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08), borderRadius: 17, backgroundColor: theme.colors.primarySoft},
    securityIcon: {width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.surface},
    securityText: {flex: 1, color: theme.colors.textSecondary, fontSize: 10.5, lineHeight: 15},

    save: {height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, backgroundColor: theme.colors.primary, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4},
    saveText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '800'},
    pressed: {opacity: 0.82, transform: [{scale: 0.985}]},
    disabled: {opacity: 0.55},

    overlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(31,18,61,0.42)'},
    handle: {width: 44, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: withAlpha(theme.colors.primary, 0.25), marginBottom: 14},

    detailSheet: {borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: theme.colors.surface, paddingHorizontal: 16, paddingTop: 12},
    detailImage: {width: '100%', height: 320, borderRadius: 18, backgroundColor: theme.colors.surfaceSecondary},
    detailImageCompact: {height: 220},
    detailLoading: {alignItems: 'center', justifyContent: 'center'},
    detailUnavailable: {width: '100%', height: 220, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: withAlpha(theme.colors.primary, 0.30), backgroundColor: theme.colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24},
    detailUnavailableCompact: {height: 160},
    detailUnavailableText: {color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center'},
    detailActionsRow: {flexDirection: 'row', gap: 9, marginTop: 14},

    sourceSheet: {borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: theme.colors.surface, paddingHorizontal: 16, paddingTop: 12},
    sourceSheetTitle: {marginBottom: 14, color: theme.colors.accent, fontSize: 17, fontWeight: '800'},
  });
}
