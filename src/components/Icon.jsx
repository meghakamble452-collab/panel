import {
  LayoutDashboard, UserPlus, Crown, Users, Trash2, IndianRupee, CircleCheck, Power, RotateCcw,
  KeyRound, Clock, ShieldCheck, Download, LogOut, Search, Eye, Lock, Zap, User, KeySquare,
  Calendar, Banknote, Gift, ChartColumn, Plus, Menu, X, ChevronLeft, ChevronRight, ChevronsLeft,
  ChevronsRight, FileDown, RefreshCw, Activity, Wallet, TriangleAlert, CalendarPlus, BadgeCheck,
  Inbox, Sparkles, ShieldBan, Ticket, ChevronDown, Check,
} from 'lucide-react';

const MAP = {
  dash: LayoutDashboard, add: UserPlus, plus: Plus, crown: Crown, users: Users, trash: Trash2,
  rupee: IndianRupee, check: CircleCheck, power: Power, reset: RotateCcw, key: KeyRound,
  clock: Clock, shield: ShieldCheck, down: Download, out: LogOut, search: Search, eye: Eye,
  lock: Lock, bolt: Zap, user: User, pass: KeySquare, cal: Calendar, calplus: CalendarPlus,
  cash: Banknote, gift: Gift, chart: ChartColumn, menu: Menu, x: X, prev: ChevronLeft,
  next: ChevronRight, first: ChevronsLeft, last: ChevronsRight, csv: FileDown, refresh: RefreshCw,
  activity: Activity, wallet: Wallet, alert: TriangleAlert, badge: BadgeCheck, inbox: Inbox,
  spark: Sparkles, block: ShieldBan, ticket: Ticket, down2: ChevronDown, tick: Check,
};

export default function Icon({ n, s = 16, w = 2 }) {
  const C = MAP[n] || LayoutDashboard;
  return <C size={s} strokeWidth={w} aria-hidden="true" />;
}
