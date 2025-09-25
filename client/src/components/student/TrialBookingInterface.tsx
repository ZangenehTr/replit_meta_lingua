import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  Video, 
  User, 
  Star, 
  Check,
  ChevronLeft,
  ChevronRight,
  Languages
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import apiClient from "@/lib/apiClient";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  profileImage?: string;
  specializations: string[];
  experience: number;
  rating: number;
  languages: string[];
  bio: string;
  availability: string[];
}

interface TimeSlot {
  time: string;
  available: boolean;
  date: string;
}

interface Props {
  teachers: Teacher[];
}

export function TrialBookingInterface({ teachers }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'teacher' | 'datetime' | 'details' | 'confirmation'>('teacher');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [studentDetails, setStudentDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    learningGoals: '',
    currentLevel: 'beginner',
    preferredLanguage: 'en'
  });

  // Generate next 7 days
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en', { month: 'short' })
      });
    }
    return dates;
  };

  // Generate time slots for selected date
  const generateTimeSlots = (): TimeSlot[] => {
    const slots = [];
    const times = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ];
    
    times.forEach(time => {
      // For demo purposes, make some slots unavailable randomly
      const available = Math.random() > 0.3;
      slots.push({
        time,
        available,
        date: selectedDate
      });
    });
    
    return slots;
  };

  // Book trial lesson mutation
  const bookTrialMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiClient.post('/student/book-trial', bookingData);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: t('student:trialBooked'),
        description: t('student:trialBookedDescription'),
      });
      setStep('confirmation');
      queryClient.invalidateQueries({ queryKey: ['/api/student/trial-bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.response?.data?.message || t('student:bookingFailed'),
        variant: 'destructive',
      });
    },
  });

  const handleBooking = () => {
    const bookingData = {
      teacherId: selectedTeacher?.id,
      date: selectedDate,
      time: selectedTime,
      studentDetails,
      lessonType: 'trial'
    };
    
    bookTrialMutation.mutate(bookingData);
  };

  const availableDates = generateAvailableDates();
  const timeSlots = selectedDate ? generateTimeSlots() : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('student:bookTrialLesson')}
        </h2>
        <p className="text-gray-600">
          {t('student:freeTrialDescription')}
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[
              { key: 'teacher', label: t('student:selectTeacher') },
              { key: 'datetime', label: t('student:chooseDateTime') },
              { key: 'details', label: t('student:yourDetails') },
              { key: 'confirmation', label: t('student:confirmation') }
            ].map((stepItem, index) => (
              <div key={stepItem.key} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepItem.key 
                    ? 'bg-blue-600 text-white' 
                    : index < ['teacher', 'datetime', 'details', 'confirmation'].indexOf(step)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < ['teacher', 'datetime', 'details', 'confirmation'].indexOf(step) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {stepItem.label}
                </span>
                {index < 3 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === 'teacher' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('student:selectTeacher')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.slice(0, 6).map((teacher) => (
                <div
                  key={teacher.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTeacher?.id === teacher.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTeacher(teacher)}
                  data-testid={`teacher-option-${teacher.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={teacher.profileImage} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        {teacher.rating.toFixed(1)}
                        <span>• {teacher.experience}+ {t('student:years')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Languages className="h-3 w-3" />
                        {teacher.languages.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep('datetime')}
                disabled={!selectedTeacher}
                data-testid="button-next-to-datetime"
              >
                {t('common:next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'datetime' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('student:chooseDateTime')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Date Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                {t('student:selectDate')}
              </Label>
              <div className="grid grid-cols-7 gap-2">
                {availableDates.map((date) => (
                  <button
                    key={date.date}
                    className={`p-3 text-center border rounded-lg transition-all ${
                      selectedDate === date.date
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDate(date.date)}
                    data-testid={`date-option-${date.date}`}
                  >
                    <div className="text-xs text-gray-500">{date.dayName}</div>
                    <div className="text-lg font-medium">{date.dayNumber}</div>
                    <div className="text-xs text-gray-500">{date.month}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  {t('student:selectTime')}
                </Label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      className={`p-2 text-center border rounded-lg transition-all ${
                        !slot.available
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : selectedTime === slot.time
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      data-testid={`time-option-${slot.time}`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('teacher')}
                data-testid="button-back-to-teacher"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('common:back')}
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={!selectedDate || !selectedTime}
                data-testid="button-next-to-details"
              >
                {t('common:next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('student:yourDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t('student:firstName')}</Label>
                <Input
                  id="firstName"
                  value={studentDetails.firstName}
                  onChange={(e) => setStudentDetails(prev => ({ ...prev, firstName: e.target.value }))}
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t('student:lastName')}</Label>
                <Input
                  id="lastName"
                  value={studentDetails.lastName}
                  onChange={(e) => setStudentDetails(prev => ({ ...prev, lastName: e.target.value }))}
                  data-testid="input-last-name"
                />
              </div>
              <div>
                <Label htmlFor="email">{t('student:email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={studentDetails.email}
                  onChange={(e) => setStudentDetails(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="phone">{t('student:phone')}</Label>
                <Input
                  id="phone"
                  value={studentDetails.phone}
                  onChange={(e) => setStudentDetails(prev => ({ ...prev, phone: e.target.value }))}
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label htmlFor="currentLevel">{t('student:currentLevel')}</Label>
                <select
                  id="currentLevel"
                  value={studentDetails.currentLevel}
                  onChange={(e) => setStudentDetails(prev => ({ ...prev, currentLevel: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  data-testid="select-current-level"
                >
                  <option value="beginner">{t('student:beginner')}</option>
                  <option value="intermediate">{t('student:intermediate')}</option>
                  <option value="advanced">{t('student:advanced')}</option>
                </select>
              </div>
              <div>
                <Label htmlFor="preferredLanguage">{t('student:preferredLanguage')}</Label>
                <select
                  id="preferredLanguage"
                  value={studentDetails.preferredLanguage}
                  onChange={(e) => setStudentDetails(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  data-testid="select-preferred-language"
                >
                  <option value="en">English</option>
                  <option value="fa">Persian/Farsi</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="learningGoals">{t('student:learningGoals')}</Label>
              <textarea
                id="learningGoals"
                rows={3}
                value={studentDetails.learningGoals}
                onChange={(e) => setStudentDetails(prev => ({ ...prev, learningGoals: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder={t('student:learningGoalsPlaceholder')}
                data-testid="textarea-learning-goals"
              />
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('datetime')}
                data-testid="button-back-to-datetime"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('common:back')}
              </Button>
              <Button
                onClick={handleBooking}
                disabled={!studentDetails.firstName || !studentDetails.lastName || !studentDetails.email || bookTrialMutation.isPending}
                data-testid="button-book-trial"
              >
                {bookTrialMutation.isPending ? t('common:booking') : t('student:bookTrialLesson')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirmation' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('student:trialBookedSuccess')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('student:trialBookedConfirmation')}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('student:teacher')}:</span>
                  <span className="font-medium">{selectedTeacher?.firstName} {selectedTeacher?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('student:date')}:</span>
                  <span className="font-medium">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('student:time')}:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setStep('teacher');
                setSelectedTeacher(null);
                setSelectedDate('');
                setSelectedTime('');
                setStudentDetails({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  learningGoals: '',
                  currentLevel: 'beginner',
                  preferredLanguage: 'en'
                });
              }}
              data-testid="button-book-another"
            >
              {t('student:bookAnother')}
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}