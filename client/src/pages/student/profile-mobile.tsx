import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { 
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  Edit,
  Camera,
  Settings,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Save,
  Check
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  language: string;
  country?: string;
  city?: string;
  joinedDate: string;
  bio?: string;
  settings: {
    notifications: boolean;
    emailAlerts: boolean;
    smsAlerts: boolean;
    darkMode: boolean;
    language: string;
  };
  stats: {
    coursesCompleted: number;
    hoursLearned: number;
    achievements: number;
    certificates: number;
  };
}

export default function StudentProfileMobile() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileData>>({});

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    queryFn: () => apiRequest('/api/profile')
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: (data: Partial<ProfileData>) =>
      apiRequest('/api/profile', { method: 'PATCH', body: data }),
    onSuccess: () => {
      toast({
        title: t('student:profileUpdated'),
        description: t('student:profileUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsEditing(false);
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: (settings: any) =>
      apiRequest('/api/profile', { method: 'PATCH', body: { settings } }),
    onSuccess: () => {
      toast({
        title: t('student:settingsUpdated'),
        description: t('student:settingsUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    }
  });

  // Avatar upload mutation
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiRequest('POST', '/api/users/me/avatar', formData);
    },
    onSuccess: () => {
      toast({
        title: t('student:avatarUpdated', 'Avatar Updated'),
        description: t('student:avatarUpdatedDesc', 'Your profile photo has been updated.'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: () => {
      toast({
        title: t('student:avatarError', 'Upload Failed'),
        description: t('student:avatarErrorDesc', 'Failed to update profile photo.'),
        variant: 'destructive'
      });
    }
  });

  const handleLogout = () => {
    if (confirm(t('student:confirmLogout'))) {
      logout();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return t('student:dateNotAvailable', '-');
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return t('student:dateNotAvailable', '-');
    const locale = i18n.language === 'fa' ? 'fa-IR' : i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return date.toLocaleDateString(locale, { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <MobileLayout title={t('common:profile.title')} showBack={false} gradient="primary">
        <div className="space-y-4">
          <div className="glass-card p-6 animate-pulse">
            <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="h-4 bg-white/20 rounded w-1/2 mx-auto mb-2" />
            <div className="h-3 bg-white/20 rounded w-1/3 mx-auto" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title={t('common:profile.title')}
      showBack={false}
      gradient="primary"
    >
      {/* Profile Header */}
      <motion.div
        className="glass-card p-4 mb-3 text-center relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Edit Button */}
        <button 
          className="absolute top-3 end-3 p-1.5 rounded-full glass-button"
          onClick={() => setIsEditing(!isEditing)}
          data-testid={isEditing ? "button-save-profile" : "button-edit-profile"}
        >
          {isEditing ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <Edit className="w-4 h-4 text-white" />
          )}
        </button>
        <div className="relative inline-block mb-3">
          <Avatar className="w-20 h-20 border-4 border-white/20">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
              {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar.mutate(file);
                }}
              />
              <button
                className="absolute bottom-0 end-0 p-2 bg-purple-500 rounded-full"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              className="w-full p-2 bg-white/10 rounded-lg text-white placeholder-white/50 text-center outline-none text-sm"
              value={editedProfile.firstName || profile?.firstName}
              onChange={(e) => setEditedProfile({...editedProfile, firstName: e.target.value})}
              placeholder={t('student:firstName')}
            />
            <input
              type="text"
              className="w-full p-2 bg-white/10 rounded-lg text-white placeholder-white/50 text-center outline-none text-sm"
              value={editedProfile.lastName || profile?.lastName}
              onChange={(e) => setEditedProfile({...editedProfile, lastName: e.target.value})}
              placeholder={t('student:lastName')}
            />
            <textarea
              className="w-full p-2 bg-white/10 rounded-lg text-white placeholder-white/50 text-center outline-none resize-none text-sm"
              rows={2}
              value={editedProfile.bio || profile?.bio}
              onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
              placeholder={t('student:bio')}
            />
          </div>
        ) : (
          <>
            <h2 className="text-white text-xl font-bold mb-0.5">
              {profile?.firstName} {profile?.lastName}
            </h2>
            {profile?.bio && (
              <p className="text-white/70 text-xs mb-2 line-clamp-2">{profile.bio}</p>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-white/50" />
              <span className="text-white/55 text-xs">
                {t('student:memberSince')} {formatDate(profile?.joinedDate || '')}
              </span>
            </div>
          </>
        )}
      </motion.div>

      {/* Stats Grid — 4 compact tiles */}
      <motion.div
        className="grid grid-cols-4 gap-2 mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {[
          { value: profile?.stats.coursesCompleted || 0, label: t('student:coursesCompleted') },
          { value: profile?.stats.hoursLearned || 0, label: t('student:hoursLearned') },
          { value: profile?.stats.achievements || 0, label: t('student:achievements') },
          { value: profile?.stats.certificates || 0, label: t('student:certificates') },
        ].map(({ value, label }) => (
          <div key={label} className="glass-card p-2 text-center">
            <p className="text-white text-lg font-bold leading-tight">{value}</p>
            <p className="text-white/55 text-[10px] leading-tight mt-0.5 line-clamp-2">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Contact Information */}
      <motion.div
        className="space-y-2 mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="text-white font-semibold text-sm mb-2">
          {t('student:contactInfo')}
        </h3>
        
        <MobileCard className="flex items-center gap-2.5 p-3">
          <Mail className="w-4 h-4 text-white/50 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white/55 text-[10px]">{t('student:email')}</p>
            {isEditing ? (
              <input
                type="email"
                className="w-full bg-transparent text-white outline-none text-sm"
                value={editedProfile.email || profile?.email}
                onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
              />
            ) : (
              <p className="text-white text-sm truncate">{profile?.email}</p>
            )}
          </div>
        </MobileCard>

        <MobileCard className="flex items-center gap-2.5 p-3">
          <Phone className="w-4 h-4 text-white/50 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white/55 text-[10px]">{t('student:phone')}</p>
            {isEditing ? (
              <input
                type="tel"
                className="w-full bg-transparent text-white outline-none text-sm"
                value={editedProfile.phone || profile?.phone}
                onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                placeholder={t('student:addPhone')}
              />
            ) : (
              <p className="text-white text-sm">{profile?.phone || t('student:notProvided')}</p>
            )}
          </div>
        </MobileCard>

        <MobileCard className="flex items-center gap-2.5 p-3">
          <MapPin className="w-4 h-4 text-white/50 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white/55 text-[10px]">{t('student:location')}</p>
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-transparent text-white outline-none text-sm"
                  value={editedProfile.city || profile?.city}
                  onChange={(e) => setEditedProfile({...editedProfile, city: e.target.value})}
                  placeholder={t('student:city')}
                />
                <input
                  type="text"
                  className="flex-1 bg-transparent text-white outline-none text-sm"
                  value={editedProfile.country || profile?.country}
                  onChange={(e) => setEditedProfile({...editedProfile, country: e.target.value})}
                  placeholder={t('student:country')}
                />
              </div>
            ) : (
              <p className="text-white text-sm">
                {profile?.city && profile?.country 
                  ? `${profile.city}, ${profile.country}`
                  : t('student:notProvided')}
              </p>
            )}
          </div>
        </MobileCard>
      </motion.div>

      {/* Settings */}
      <motion.div
        className="space-y-2 mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h3 className="text-white font-semibold text-sm mb-2">
          {t('student:settings')}
        </h3>

        <MobileCard className="flex items-center justify-between py-3 px-3">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-white/50" />
            <span className="text-white text-sm">{t('student:notifications')}</span>
          </div>
          <Switch
            checked={profile?.settings.notifications}
            onCheckedChange={(checked) => 
              updateSettings.mutate({ notifications: checked })
            }
          />
        </MobileCard>

        <MobileCard className="flex items-center justify-between py-3 px-3">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-white/50" />
            <span className="text-white text-sm">{t('student:emailAlerts')}</span>
          </div>
          <Switch
            checked={profile?.settings.emailAlerts}
            onCheckedChange={(checked) => 
              updateSettings.mutate({ emailAlerts: checked })
            }
          />
        </MobileCard>

        <MobileCard className="flex items-center justify-between py-3 px-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-white/50" />
            <span className="text-white text-sm">{t('student:language')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/50" />
        </MobileCard>

        <MobileCard className="flex items-center justify-between py-3 px-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-white/50" />
            <span className="text-white text-sm">{t('student:privacy')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/50" />
        </MobileCard>
      </motion.div>

      {/* Action Buttons */}
      {isEditing ? (
        <div className="flex gap-3 mb-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setIsEditing(false);
              setEditedProfile({});
            }}
          >
            {t('common:cancel')}
          </Button>
          <Button
            className="flex-1"
            onClick={() => updateProfile.mutate(editedProfile)}
          >
            <Save className="w-4 h-4 me-2" />
            {t('common:save')}
          </Button>
        </div>
      ) : (
        <motion.button
          className="w-full glass-card p-3 mb-6 flex items-center justify-center gap-2.5 text-red-400"
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">{t('common:logout')}</span>
        </motion.button>
      )}
    </MobileLayout>
  );
}