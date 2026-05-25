import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  'arrow.left': 'arrow-back',
  'arrow.right.square': 'logout',
  bell: 'notifications',
  bolt: 'flash-on',
  calendar: 'calendar-today',
  camera: 'photo-camera',
  checkmark: 'check',
  'chevron.left': 'chevron-left',
  'house.fill': 'home',
  'person.fill': 'person',
  'questionmark.circle': 'help-outline',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'doc.text': 'article',
  email: 'email',
  eye: 'visibility',
  'eye.slash': 'visibility-off',
  flame: 'whatshot',
  'forward.end.fill': 'skip-next',
  gamecontroller: 'sports-esports',
  gift: 'card-giftcard',
  inventory: 'inventory-2',
  leaf: 'eco',
  lock: 'lock',
  'lock.reset': 'lock-reset',
  payments: 'payments',
  person: 'person',
  'play.fill': 'play-arrow',
  shield: 'security',
  sword: 'sports-martial-arts',
  trophy: 'emoji-events',
  xmark: 'close',
  'xmark.circle': 'cancel',
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons color={color} size={size} name={MAPPING[name] || 'help-outline'} style={style} />
  );
}
