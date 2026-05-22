// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
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
  sell: 'sell',
  shield: 'security',
  store: 'storefront',
  sword: 'sports-martial-arts',
  trophy: 'emoji-events',
  xmark: 'close',
  'xmark.circle': 'cancel',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
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
  return <MaterialIcons color={color} size={size} name={MAPPING[name] || 'help-outline'} style={style} />;
}
