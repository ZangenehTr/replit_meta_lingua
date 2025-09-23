import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Settings, 
  Globe,
  Users,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function CalendarSettings() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isRTL ? 'rtl' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-calendar-settings">
            {t('admin:calendarSettings', 'Calendar Settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-calendar-settings">
            {t('admin:calendarDescription', 'Configure scheduling, time zones, and availability settings')}
          </p>
        </div>
        <Badge variant="secondary" data-testid="badge-calendar-status">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          {t('admin:systemActive', 'System Active')}
        </Badge>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle data-testid="card-title-general-settings">
              <Calendar className="h-5 w-5 mr-2 inline" />
              {t('admin:generalCalendarSettings', 'General Calendar Settings')}
            </CardTitle>
            <CardDescription>
              {t('admin:generalCalendarDescription', 'Basic calendar configuration and display settings')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="default-timezone">{t('admin:defaultTimezone', 'Default Timezone')}</Label>
                  <Select defaultValue="Europe/London">
                    <SelectTrigger data-testid="select-default-timezone">
                      <SelectValue placeholder={t('admin:selectTimezone', 'Select timezone')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/London">GMT+0 (London)</SelectItem>
                      <SelectItem value="Europe/Berlin">GMT+1 (Berlin)</SelectItem>
                      <SelectItem value="Asia/Tehran">GMT+3:30 (Tehran)</SelectItem>
                      <SelectItem value="America/New_York">GMT-5 (New York)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="week-start">{t('admin:weekStartDay', 'Week Start Day')}</Label>
                  <Select defaultValue="monday">
                    <SelectTrigger data-testid="select-week-start">
                      <SelectValue placeholder={t('admin:selectWeekStart', 'Select start day')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">{t('admin:sunday', 'Sunday')}</SelectItem>
                      <SelectItem value="monday">{t('admin:monday', 'Monday')}</SelectItem>
                      <SelectItem value="saturday">{t('admin:saturday', 'Saturday')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date-format">{t('admin:dateFormat', 'Date Format')}</Label>
                  <Select defaultValue="dd/mm/yyyy">
                    <SelectTrigger data-testid="select-date-format">
                      <SelectValue placeholder={t('admin:selectDateFormat', 'Select format')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy/mm/dd">YYYY/MM/DD</SelectItem>
                      <SelectItem value="persian">Persian Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="time-format">{t('admin:timeFormat', 'Time Format')}</Label>
                  <Select defaultValue="24h">
                    <SelectTrigger data-testid="select-time-format">
                      <SelectValue placeholder={t('admin:selectTimeFormat', 'Select format')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-weekends">{t('admin:showWeekends', 'Show Weekends')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:showWeekendsHint', 'Display Saturday and Sunday')}</p>
                  </div>
                  <Switch id="show-weekends" defaultChecked data-testid="switch-show-weekends" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-dst">{t('admin:autoDST', 'Auto Daylight Saving')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:autoDSTHint', 'Automatically adjust for DST')}</p>
                  </div>
                  <Switch id="auto-dst" defaultChecked data-testid="switch-auto-dst" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="card-title-availability-settings">
              <Clock className="h-5 w-5 mr-2 inline" />
              {t('admin:availabilitySettings', 'Availability Settings')}
            </CardTitle>
            <CardDescription>
              {t('admin:availabilityDescription', 'Configure default availability hours and booking rules')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="default-start-time">{t('admin:defaultStartTime', 'Default Start Time')}</Label>
                  <Input 
                    id="default-start-time" 
                    type="time" 
                    defaultValue="08:00" 
                    data-testid="input-default-start-time"
                  />
                </div>
                
                <div>
                  <Label htmlFor="default-end-time">{t('admin:defaultEndTime', 'Default End Time')}</Label>
                  <Input 
                    id="default-end-time" 
                    type="time" 
                    defaultValue="18:00" 
                    data-testid="input-default-end-time"
                  />
                </div>

                <div>
                  <Label htmlFor="session-duration">{t('admin:defaultSessionDuration', 'Default Session Duration (minutes)')}</Label>
                  <Input 
                    id="session-duration" 
                    type="number" 
                    defaultValue="60" 
                    data-testid="input-session-duration"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="booking-advance">{t('admin:maxBookingAdvance', 'Max Booking Advance (days)')}</Label>
                  <Input 
                    id="booking-advance" 
                    type="number" 
                    defaultValue="30" 
                    data-testid="input-booking-advance"
                  />
                </div>

                <div>
                  <Label htmlFor="min-notice">{t('admin:minBookingNotice', 'Min Booking Notice (hours)')}</Label>
                  <Input 
                    id="min-notice" 
                    type="number" 
                    defaultValue="2" 
                    data-testid="input-min-notice"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-past-booking">{t('admin:allowPastBooking', 'Allow Past Booking')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:allowPastBookingHint', 'For admin use only')}</p>
                  </div>
                  <Switch id="allow-past-booking" data-testid="switch-allow-past-booking" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="card-title-notification-settings">
              <AlertCircle className="h-5 w-5 mr-2 inline" />
              {t('admin:notificationSettings', 'Notification Settings')}
            </CardTitle>
            <CardDescription>
              {t('admin:notificationDescription', 'Configure automatic reminders and notifications')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-reminders">{t('admin:emailReminders', 'Email Reminders')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:emailRemindersHint', 'Send email notifications')}</p>
                  </div>
                  <Switch id="email-reminders" defaultChecked data-testid="switch-email-reminders" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-reminders">{t('admin:smsReminders', 'SMS Reminders')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:smsRemindersHint', 'Send text message alerts')}</p>
                  </div>
                  <Switch id="sms-reminders" data-testid="switch-sms-reminders" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="reminder-time">{t('admin:reminderTime', 'Reminder Time (hours before)')}</Label>
                  <Input 
                    id="reminder-time" 
                    type="number" 
                    defaultValue="24" 
                    data-testid="input-reminder-time"
                  />
                </div>

                <div>
                  <Label htmlFor="followup-time">{t('admin:followupTime', 'Follow-up Time (hours after)')}</Label>
                  <Input 
                    id="followup-time" 
                    type="number" 
                    defaultValue="2" 
                    data-testid="input-followup-time"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" data-testid="button-test-settings">
            {t('admin:testSettings', 'Test Settings')}
          </Button>
          <Button data-testid="button-save-calendar-settings">
            {t('admin:saveSettings', 'Save Settings')}
          </Button>
        </div>
      </div>
    </div>
  );
}