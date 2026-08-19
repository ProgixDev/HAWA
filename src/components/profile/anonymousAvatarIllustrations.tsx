import React from 'react';
import Svg, {Circle, Ellipse, Line, Path} from 'react-native-svg';

// Original AWA anonymous-avatar illustrations — flat, minimal vector busts
// (head + shoulders), each with a fixed internal palette (skin/hair/
// accessory tones). Deliberately NOT recolored by the customizer's accent
// color — that color only ever fills the circular backdrop BEHIND the
// avatar (see AnonymousAvatar.tsx), the illustration itself stays constant
// so the character reads consistently regardless of which accent is chosen.
export type AnonymousAvatarIllustrationId =
  | 'hijab'
  | 'glasses'
  | 'hat'
  | 'minimal'
  | 'headscarfGlasses'
  | 'silhouetteHat'
  | 'turban'
  | 'shortHair';

type IllustrationProps = {size: number};

// Shared face (eyes + soft smile) — every illustration except the
// deliberately face-less "elegant hat silhouette" reuses this exactly, so
// the family reads as one cohesive set.
function Face(): React.JSX.Element {
  return (
    <>
      <Circle cx="41.5" cy="45" fill="#2B2320" r="2.4" />
      <Circle cx="58.5" cy="45" fill="#2B2320" r="2.4" />
      <Path d="M43,56 Q50,60.5 57,56" fill="none" stroke="#2B2320" strokeLinecap="round" strokeWidth="2" />
    </>
  );
}

// Shared shoulders/bust silhouette, tinted per-avatar via `fill`.
function Bust({fill}: {fill: string}): React.JSX.Element {
  return <Path d="M10,100 C10,74 27,65 50,65 C73,65 90,74 90,100 Z" fill={fill} />;
}

function AvatarHijab({size}: IllustrationProps): React.JSX.Element {
  const fabric = '#3D2A79';
  const skin = '#D9A374';
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Bust fill={fabric} />
      <Circle cx="50" cy="42" fill={fabric} r="30" />
      <Circle cx="50" cy="46" fill={skin} r="21" />
      <Face />
    </Svg>
  );
}

function AvatarGlasses({size}: IllustrationProps): React.JSX.Element {
  const hair = '#5B4636';
  const skin = '#F2C9A5';
  const frame = '#2B2320';
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Bust fill={hair} />
      <Circle cx="50" cy="44" fill={hair} r="29" />
      <Circle cx="50" cy="47" fill={skin} r="23" />
      <Face />
      <Circle cx="41.5" cy="45" fill="none" r="6.5" stroke={frame} strokeWidth="2" />
      <Circle cx="58.5" cy="45" fill="none" r="6.5" stroke={frame} strokeWidth="2" />
      <Line stroke={frame} strokeWidth="2" x1="48" x2="52" y1="45" y2="45" />
    </Svg>
  );
}

function AvatarHat({size}: IllustrationProps): React.JSX.Element {
  const hair = '#4A3B33';
  const skin = '#B97A56';
  const hat = '#8A6D5C';
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Bust fill={hair} />
      <Circle cx="50" cy="47" fill={skin} r="23" />
      <Face />
      <Path d="M28,34 C28,20 72,20 72,34 C72,26 28,26 28,34 Z" fill={hat} />
      <Ellipse cx="50" cy="34" fill={hat} rx="26" ry="4.5" />
    </Svg>
  );
}

function AvatarMinimal({size}: IllustrationProps): React.JSX.Element {
  const hair = '#4A3B33';
  const skin = '#F2C9A5';
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Bust fill={hair} />
      <Circle cx="50" cy="47" fill={skin} r="23" />
      <Face />
      <Path d="M27,40 C27,20 73,20 73,40 C73,33 27,33 27,40 Z" fill={hair} />
    </Svg>
  );
}

function AvatarHeadscarfGlasses({size}: IllustrationProps): React.JSX.Element {
  const fabric = '#7C6A8C';
  const skin = '#8B5A3C';
  const frame = '#2B2320';
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Bust fill={fabric} />
      <Circle cx="50" cy="43" fill={fabric} r="29" />
      <Circle cx="50" cy="47" fill={skin} r="20" />
      <Face />
      <Circle cx="41.5" cy="45" fill="none" r="6" stroke={frame} strokeWidth="2" />
      <Circle cx="58.5" cy="45" fill="none" r="6" stroke={frame} strokeWidth="2" />
      <Line stroke={frame} strokeWidth="2" x1="47.5" x2="52.5" y1="45" y2="45" />
    </Svg>
  );
}

function AvatarSilhouetteHat({size}: IllustrationProps): React.JSX.Element {
  const skin = '#D9A374';
  const hat = '#6B5B73';
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Bust fill={hat} />
      <Circle cx="50" cy="47" fill={skin} r="23" />
      <Ellipse cx="50" cy="30" fill={hat} rx="30" ry="6" />
      <Path d="M34,31 C34,15 66,15 66,31 C66,23 34,23 34,31 Z" fill={hat} />
    </Svg>
  );
}

function AvatarTurban({size}: IllustrationProps): React.JSX.Element {
  const fabric = '#557CA5';
  const skin = '#B97A56';
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Bust fill={fabric} />
      <Circle cx="50" cy="45" fill={fabric} r="29" />
      <Circle cx="50" cy="49" fill={skin} r="20" />
      <Face />
      <Circle cx="68" cy="27" fill={fabric} r="7" />
    </Svg>
  );
}

function AvatarShortHair({size}: IllustrationProps): React.JSX.Element {
  const hair = '#3D2A79';
  const skin = '#8B5A3C';
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Bust fill={hair} />
      <Circle cx="50" cy="47" fill={skin} r="23" />
      <Face />
      <Path d="M25,42 C22,20 78,20 75,42 C75,30 65,25 50,25 C35,25 25,30 25,42 Z" fill={hair} />
    </Svg>
  );
}

export const ANONYMOUS_AVATAR_ILLUSTRATIONS: Record<AnonymousAvatarIllustrationId, React.FC<IllustrationProps>> = {
  hijab: AvatarHijab,
  glasses: AvatarGlasses,
  hat: AvatarHat,
  minimal: AvatarMinimal,
  headscarfGlasses: AvatarHeadscarfGlasses,
  silhouetteHat: AvatarSilhouetteHat,
  turban: AvatarTurban,
  shortHair: AvatarShortHair,
};
