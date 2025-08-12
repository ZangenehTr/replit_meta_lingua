import { Link, useLocation } from "wouter";
import { 
  Home, 
  BookOpen, 
  Calendar, 
  MessageCircle, 
  User,
  GraduationCap,
  Wallet,
  Trophy,
  Video
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

export function MobileBottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    {
      path: "/dashboard",
      icon: <Home className="w-6 h-6" />,
      label: t("common:home")
    },
    {
      path: "/homework",
      icon: <BookOpen className="w-6 h-6" />,
      label: t("student:homework")
    },
    {
      path: "/sessions",
      icon: <Calendar className="w-6 h-6" />,
      label: t("student:sessions")
    },
    {
      path: "/messages",
      icon: <MessageCircle className="w-6 h-6" />,
      label: t("student:messages")
    },
    {
      path: "/profile",
      icon: <User className="w-6 h-6" />,
      label: t("common:profile")
    }
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const isActive = location === item.path || 
                        (item.path === "/dashboard" && location === "/student/dashboard");
        
        return (
          <Link key={item.path} href={item.path}>
            <motion.div
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <motion.div 
                className="mobile-nav-icon"
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  color: isActive ? "#667eea" : "#6b7280"
                }}
                transition={{ duration: 0.2 }}
              >
                {item.icon}
              </motion.div>
              <span className="mobile-nav-label">{item.label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}