/* Inline SVG icons — replaces lucide-react dependency */

function Icon({ children, size = 20, className = '', fill = 'none', ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  )
}

export function Menu(props) { return <Icon {...props}><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></Icon> }
export function X(props) { return <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon> }
export function Search(props) { return <Icon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon> }
export function ShoppingBag(props) { return <Icon {...props}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></Icon> }
export function User(props) { return <Icon {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon> }
export function ChevronDown(props) { return <Icon {...props}><path d="m6 9 6 6 6-6" /></Icon> }
export function ChevronLeft(props) { return <Icon {...props}><path d="m15 18-6-6 6-6" /></Icon> }
export function ChevronRight(props) { return <Icon {...props}><path d="m9 18 6-6-6-6" /></Icon> }
export function ArrowRight(props) { return <Icon {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon> }
export function Star(props) { return <Icon {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon> }
export function Heart(props) { return <Icon {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></Icon> }
export function Share2(props) { return <Icon {...props}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m15.71 7.21-7.42 3.58" /><path d="m15.71 16.79-7.42-3.58" /></Icon> }
export function Minus(props) { return <Icon {...props}><path d="M5 12h14" /></Icon> }
export function Plus(props) { return <Icon {...props}><path d="M5 12h14" /><path d="M12 5v14" /></Icon> }
export function Trash2(props) { return <Icon {...props}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></Icon> }
export function Sparkles(props) { return <Icon {...props}><path d="M12 3l1.9 4.8L19 9.7l-5.1 1.9L12 16.4l-1.9-4.8L5 9.7l5.1-1.9L12 3Z" /><path d="M19 14l.9 2.3L22 17.2l-2.1.8L19 20.3l-.9-2.3-2.1-.8 2.1-.8L19 14Z" /><path d="M5 15l.7 1.8 1.8.7-1.8.7L5 20l-.7-1.8-1.8-.7 1.8-.7L5 15Z" /></Icon> }
export function SlidersHorizontal(props) { return <Icon {...props}><path d="M21 4h-6" /><path d="M9 4H3" /><path d="M15 12H3" /><path d="M21 12h-2" /><path d="M15 20H3" /><path d="M21 20h-6" /><circle cx="18" cy="4" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18" cy="20" r="1.5" /></Icon> }
export function Grid3X3(props) { return <Icon {...props}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Icon> }
export function List(props) { return <Icon {...props}><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></Icon> }
export function Check(props) { return <Icon {...props}><path d="M20 6 9 17l-5-5" /></Icon> }
export function Truck(props) { return <Icon {...props}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><circle cx="19" cy="18" r="2" /><circle cx="5" cy="18" r="2" /><path d="M8 18h7m4 0h1a1 1 0 0 0 1-1v-4.94a1 1 0 0 0-.3-.76l-2.7-2.78A2 2 0 0 0 16.34 8H15" /></Icon> }
export function Shield(props) { return <Icon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></Icon> }
export function RefreshCw(props) { return <Icon {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></Icon> }
export function Headphones(props) { return <Icon {...props}><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" /></Icon> }
export function Percent(props) { return <Icon {...props}><line x1="19" x2="5" y1="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></Icon> }
export function Ticket(props) { return <Icon {...props}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></Icon> }
export function Mail(props) { return <Icon {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></Icon> }
export function MapPin(props) { return <Icon {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon> }
export function Phone(props) { return <Icon {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></Icon> }
export function Eye(props) { return <Icon {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Icon> }
export function EyeOff(props) { return <Icon {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></Icon> }
export function Pencil(props) { return <Icon {...props}><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></Icon> }
export function Package(props) { return <Icon {...props}><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></Icon> }
export function Upload(props) { return <Icon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></Icon> }
export function MessageCircle(props) { return <Icon {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Icon> }
export function LogIn(props) { return <Icon {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></Icon> }
export function UserPlus(props) { return <Icon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></Icon> }
export function Lock(props) { return <Icon {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon> }
export function Calendar(props) { return <Icon {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></Icon> }
export function CreditCard(props) { return <Icon {...props}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></Icon> }
export function Banknote(props) { return <Icon {...props}><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></Icon> }
export function Save(props) { return <Icon {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></Icon> }
export function Home(props) { return <Icon {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></Icon> }
export function Send(props) { return <Icon {...props}><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4Z" /></Icon> }
export function TrendingUp(props) { return <Icon {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></Icon> }
export function DollarSign(props) { return <Icon {...props}><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Icon> }
export function BarChart3(props) { return <Icon {...props}><path d="M3 3v18h18" /><path d="M7 16V8" /><path d="M11 16v-6" /><path d="M15 16V6" /><path d="M19 16v-4" /></Icon> }
export function PieChart(props) { return <Icon {...props}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></Icon> }
export function Activity(props) { return <Icon {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Icon> }
export function Smartphone(props) { return <Icon {...props}><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></Icon> }
export function ArrowUp(props) { return <Icon {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon> }
export function ArrowDown(props) { return <Icon {...props}><path d="M5 12h14" /><path d="m12 19 7-7-7-7" /></Icon> }
export function Tag(props) { return <Icon {...props}><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" /><path d="M7 7h.01" /></Icon> }
export function Edit(props) { return <Icon {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></Icon> }
