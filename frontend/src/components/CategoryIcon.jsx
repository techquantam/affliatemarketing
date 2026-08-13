import React from 'react';
import {
  Smartphone, Laptop, Tablet, Tv, Headphones, Camera, Watch, Zap,
  Shirt, Scissors, Sparkles, Tag, Gift, ShoppingBag, ShoppingCart,
  Heart, Flame, Activity, ShieldCheck, Smile, Sun, Flower2,
  Plane, Compass, MapPin, Globe, Car, Bike, Truck,
  Utensils, Coffee, Pizza, Wine, Apple,
  Gamepad2, Gamepad, Film, Music, Disc, BookOpen, Book,
  Home, Building, Briefcase, DollarSign, Percent, Award, Star,
  Layers, Package, Feather, Eye, Box, Radio, Bell, Key, Lightbulb,
  Cpu, Monitor, HardDrive, BatteryCharging
} from 'lucide-react';

export const ICON_MAP = {
  // Electronics & Tech
  smartphone: Smartphone,
  phone: Smartphone,
  mobile: Smartphone,
  laptop: Laptop,
  computer: Laptop,
  tablet: Tablet,
  tv: Tv,
  television: Tv,
  headphones: Headphones,
  earphones: Headphones,
  audio: Headphones,
  camera: Camera,
  photography: Camera,
  watch: Watch,
  smartwatch: Watch,
  zap: Zap,
  electronics: Smartphone,
  cpu: Cpu,
  monitor: Monitor,
  harddrive: HardDrive,
  batterycharging: BatteryCharging,
  radio: Radio,

  // Fashion & Style
  shirt: Shirt,
  fashion: Shirt,
  clothing: Shirt,
  clothes: Shirt,
  apparel: Shirt,
  scissors: Scissors,
  sparkles: Sparkles,
  tag: Tag,
  gift: Gift,
  shoppingbag: ShoppingBag,
  shoppingcart: ShoppingCart,
  feather: Feather,

  // Health, Beauty & Wellness
  heart: Heart,
  health: Heart,
  beauty: Heart,
  skincare: Heart,
  wellness: Activity,
  activity: Activity,
  flame: Flame,
  shieldcheck: ShieldCheck,
  smile: Smile,
  sun: Sun,
  flower2: Flower2,
  flower: Flower2,
  eye: Eye,

  // Travel & Outdoors
  plane: Plane,
  travel: Plane,
  flights: Plane,
  flight: Plane,
  compass: Compass,
  mappin: MapPin,
  globe: Globe,
  car: Car,
  automobile: Car,
  bike: Bike,
  bicycle: Bike,
  truck: Truck,

  // Food, Grocery & Dining
  utensils: Utensils,
  food: Utensils,
  restaurant: Utensils,
  dining: Utensils,
  coffee: Coffee,
  cafe: Coffee,
  grocery: ShoppingBag,
  groceries: ShoppingBag,
  pizza: Pizza,
  wine: Wine,
  apple: Apple,

  // Entertainment & Gaming
  gamepad2: Gamepad2,
  gamepad: Gamepad,
  gaming: Gamepad2,
  games: Gamepad2,
  film: Film,
  movies: Film,
  cinema: Film,
  music: Music,
  disc: Disc,
  bookopen: BookOpen,
  book: Book,
  books: BookOpen,

  // Home, Office & General
  home: Home,
  housing: Home,
  building: Building,
  briefcase: Briefcase,
  work: Briefcase,
  dollarsign: DollarSign,
  finance: DollarSign,
  percent: Percent,
  deals: Percent,
  offers: Tag,
  award: Award,
  star: Star,
  layers: Layers,
  all: Layers,
  package: Package,
  box: Box,
  bell: Bell,
  key: Key,
  lightbulb: Lightbulb
};

export const AVAILABLE_ICONS = [
  // Tech & Electronics
  { name: 'Smartphone', category: 'Tech', icon: Smartphone },
  { name: 'Laptop', category: 'Tech', icon: Laptop },
  { name: 'Tablet', category: 'Tech', icon: Tablet },
  { name: 'Tv', category: 'Tech', icon: Tv },
  { name: 'Headphones', category: 'Tech', icon: Headphones },
  { name: 'Camera', category: 'Tech', icon: Camera },
  { name: 'Watch', category: 'Tech', icon: Watch },
  { name: 'Cpu', category: 'Tech', icon: Cpu },
  { name: 'Zap', category: 'Tech', icon: Zap },

  // Fashion & Beauty
  { name: 'Shirt', category: 'Fashion', icon: Shirt },
  { name: 'Scissors', category: 'Fashion', icon: Scissors },
  { name: 'Sparkles', category: 'Fashion', icon: Sparkles },
  { name: 'Heart', category: 'Beauty', icon: Heart },
  { name: 'Flower2', category: 'Beauty', icon: Flower2 },
  { name: 'Sun', category: 'Beauty', icon: Sun },
  { name: 'Smile', category: 'Beauty', icon: Smile },

  // Grocery & Food
  { name: 'ShoppingBag', category: 'Grocery', icon: ShoppingBag },
  { name: 'ShoppingCart', category: 'Grocery', icon: ShoppingCart },
  { name: 'Utensils', category: 'Food', icon: Utensils },
  { name: 'Coffee', category: 'Food', icon: Coffee },
  { name: 'Pizza', category: 'Food', icon: Pizza },
  { name: 'Apple', category: 'Food', icon: Apple },

  // Travel & Transport
  { name: 'Plane', category: 'Travel', icon: Plane },
  { name: 'Compass', category: 'Travel', icon: Compass },
  { name: 'MapPin', category: 'Travel', icon: MapPin },
  { name: 'Globe', category: 'Travel', icon: Globe },
  { name: 'Car', category: 'Travel', icon: Car },
  { name: 'Bike', category: 'Travel', icon: Bike },

  // Entertainment & Gaming
  { name: 'Gamepad2', category: 'Gaming', icon: Gamepad2 },
  { name: 'Film', category: 'Entertainment', icon: Film },
  { name: 'Music', category: 'Entertainment', icon: Music },
  { name: 'BookOpen', category: 'Education', icon: BookOpen },

  // Home & Lifestyle
  { name: 'Home', category: 'Home', icon: Home },
  { name: 'Gift', category: 'Shopping', icon: Gift },
  { name: 'Tag', category: 'Shopping', icon: Tag },
  { name: 'Percent', category: 'Shopping', icon: Percent },
  { name: 'Star', category: 'Shopping', icon: Star },
  { name: 'Flame', category: 'Deals', icon: Flame },
  { name: 'Layers', category: 'General', icon: Layers },
  { name: 'Package', category: 'General', icon: Package }
];

export const POPULAR_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
];

export default function CategoryIcon({
  icon,
  iconType = 'lucide',
  customIconUrl,
  size = 20,
  color,
  className = '',
  style = {}
}) {
  // If iconType is custom image URL
  if (iconType === 'url' || (typeof icon === 'string' && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:image')))) {
    const src = customIconUrl || icon;
    return (
      <img
        src={src}
        alt=""
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          display: 'inline-block',
          borderRadius: '4px',
          ...style
        }}
        className={className}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // If iconType is emoji or string contains emoji
  if (iconType === 'emoji' || (typeof icon === 'string' && /\p{Extended_Pictographic}/u.test(icon))) {
    return (
      <span
        style={{
          fontSize: `${size * 0.9}px`,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
        className={className}
      >
        {icon}
      </span>
    );
  }

  // Direct React Component passed
  if (typeof icon === 'function' || (typeof icon === 'object' && icon.$$typeof)) {
    const Component = icon;
    return <Component size={size} color={color} className={className} style={style} />;
  }

  // String identifier lookup in ICON_MAP
  if (typeof icon === 'string') {
    const normalizedKey = icon.toLowerCase().replace(/[^a-z0-9]/g, '');
    const LucideComponent = ICON_MAP[normalizedKey];

    if (LucideComponent) {
      return <LucideComponent size={size} color={color} className={className} style={style} />;
    }
  }

  // Fallback icon
  return <ShoppingBag size={size} color={color} className={className} style={style} />;
}
