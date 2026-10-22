import {
  Banknote,
  Bell,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  CreditCard,
  Film,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Minus,
  Plus,
  QrCode,
  Search,
  Settings,
  Smartphone,
  Star,
  Ticket,
  Trash2,
  User,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';

type Def = { Icon: LucideIcon; filled?: boolean };

const map: Record<string, Def> = {
  'chevron-back': { Icon: ChevronLeft },
  'chevron-forward': { Icon: ChevronRight },
  add: { Icon: Plus },
  remove: { Icon: Minus },
  home: { Icon: Home, filled: true },
  'home-outline': { Icon: Home },
  search: { Icon: Search },
  'search-outline': { Icon: Search },
  ticket: { Icon: Ticket, filled: true },
  'ticket-outline': { Icon: Ticket },
  heart: { Icon: Heart, filled: true },
  'heart-outline': { Icon: Heart },
  person: { Icon: User, filled: true },
  'person-outline': { Icon: User },
  star: { Icon: Star, filled: true },
  'star-outline': { Icon: Star },
  notifications: { Icon: Bell, filled: true },
  'notifications-outline': { Icon: Bell },
  'qr-code-outline': { Icon: QrCode },
  'radio-button-on': { Icon: CircleDot },
  'radio-button-off': { Icon: Circle },
  'phone-portrait-outline': { Icon: Smartphone },
  'cash-outline': { Icon: Banknote },
  'card-outline': { Icon: CreditCard },
  'close-circle': { Icon: XCircle },
  'film-outline': { Icon: Film },
  'trash-outline': { Icon: Trash2 },
  'log-out-outline': { Icon: LogOut },
  'settings-outline': { Icon: Settings },
  'chatbubble-ellipses-outline': { Icon: MessageCircle },
};

type Props = { name: string; size?: number; color?: string };

export function Ionicons({ name, size = 24, color = '#fff' }: Props) {
  const def = map[name] ?? { Icon: Circle };
  const { Icon, filled } = def;
  return <Icon size={size} color={color} fill={filled ? color : 'none'} />;
}

Ionicons.glyphMap = map;