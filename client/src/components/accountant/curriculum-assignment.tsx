import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  UserPlus, 
  Target, 
  Award,
  CheckCircle,
  Search,
  Filter,
  BookOpen,
  CreditCard,
  Calendar,
  User,
  Phone,
  Mail,
  Banknote
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Curriculum {
  id: number;
  key: string;
  name: string;
  language: string;
  description?: string;
}

interface CurriculumLevel {
  id: number;
  curriculumId: number;
  code: string;
  name: string;
  orderIndex: number;
  cefrBand?: string;
  description?: string;
  estimatedWeeks?: number;
}

interface StudentInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  currentLevel?: CurriculumLevel;
  curriculum?: Curriculum;
  studentProgress?: {
    progressPercentage: number;
    status: string;
  };
}

const studentRegistrationSchema = z.object({
  firstName: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  lastName: z.string().min(2, "نام خانوادگی باید حداقل 2 کاراکتر باشد"),
  email: z.string().email("ایمیل معتبر وارد کنید"),
  phoneNumber: z.string().min(10, "شماره تلفن معتبر وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل 6 کاراکتر باشد"),
  curriculumId: z.string().min(1, "برنامه درسی را انتخاب کنید"),
  levelId: z.string().min(1, "سطح را انتخاب کنید"),
  paymentAmount: z.string().min(1, "مبلغ پرداخت را وارد کنید"),
  paymentMethod: z.enum(["cash", "card", "transfer"], { required_error: "روش پرداخت را انتخاب کنید" }),
  notes: z.string().optional(),
});

type StudentRegistrationForm = z.infer<typeof studentRegistrationSchema>;

export function CurriculumAssignment() {
  const { toast } = useToast();
  const { t } = useTranslation(['common', 'admin', 'student']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);

  // Fetch curriculums
  const { data: curriculums = [] } = useQuery<Curriculum[]>({
    queryKey: ['/api/admin/curriculums'],
  });

  // Fetch curriculum levels
  const { data: levels = [] } = useQuery<CurriculumLevel[]>({
    queryKey: ['/api/admin/curriculum-levels'],
  });

  // Search students
  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentInfo[]>({
    queryKey: ['/api/admin/students/search', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/admin/students?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  // Student registration form
  const registrationForm = useForm<StudentRegistrationForm>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      curriculumId: '',
      levelId: '',
      paymentAmount: '',
      paymentMethod: 'cash',
      notes: '',
    },
  });

  const selectedCurriculumId = registrationForm.watch('curriculumId');
  const availableLevels = levels.filter(level => 
    level.curriculumId === parseInt(selectedCurriculumId || '0')
  );

  // Register new student with level assignment
  const registerStudent = useMutation({
    mutationFn: async (data: StudentRegistrationForm) => {
      const response = await fetch('/api/accountant/register-student', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          curriculumId: parseInt(data.curriculumId),
          levelId: parseInt(data.levelId),
          paymentAmount: parseFloat(data.paymentAmount),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register student');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "ثبت‌نام موفق",
        description: `دانشجوی جدید با کد ${data.studentId} ثبت شد`,
      });
      setIsRegistrationOpen(false);
      registrationForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/students'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ثبت‌نام",
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Assign/update student level
  const assignLevel = useMutation({
    mutationFn: async ({ studentId, curriculumId, levelId }: { studentId: number; curriculumId: number; levelId: number }) => {
      const response = await fetch('/api/curriculum/assign-level', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId, curriculumId, levelId }),
      });
      if (!response.ok) throw new Error('Failed to assign level');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "سطح تخصیص داده شد",
        description: "سطح جدید به دانشجو اختصاص یافت",
      });
      setIsAssignmentOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/students'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در تخصیص سطح",
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onRegistrationSubmit = (data: StudentRegistrationForm) => {
    registerStudent.mutate(data);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            مدیریت سطوح برنامه درسی
          </CardTitle>
          <CardDescription>
            ثبت‌نام دانشجویان جدید و تخصیص سطح برنامه درسی
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="button-register-student">
                  <UserPlus className="h-4 w-4" />
                  ثبت‌نام دانشجوی جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>ثبت‌نام دانشجوی جدید</DialogTitle>
                  <DialogDescription>
                    اطلاعات دانشجو را وارد کرده و سطح مناسب را تخصیص دهید
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...registrationForm}>
                  <form onSubmit={registrationForm.handleSubmit(onRegistrationSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registrationForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نام</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-firstName" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registrationForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نام خانوادگی</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-lastName" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registrationForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ایمیل</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registrationForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شماره تلفن</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-phoneNumber" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registrationForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رمز عبور</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registrationForm.control}
                        name="curriculumId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>برنامه درسی</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-curriculum">
                                  <SelectValue placeholder="برنامه درسی را انتخاب کنید" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {curriculums.map((curriculum) => (
                                  <SelectItem key={curriculum.id} value={curriculum.id.toString()}>
                                    {curriculum.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registrationForm.control}
                        name="levelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>سطح</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCurriculumId}>
                              <FormControl>
                                <SelectTrigger data-testid="select-level">
                                  <SelectValue placeholder="سطح را انتخاب کنید" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableLevels.map((level) => (
                                  <SelectItem key={level.id} value={level.id.toString()}>
                                    {level.name} ({level.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registrationForm.control}
                        name="paymentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مبلغ پرداخت (تومان)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-paymentAmount" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registrationForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>روش پرداخت</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-paymentMethod">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">نقدی</SelectItem>
                                <SelectItem value="card">کارتی</SelectItem>
                                <SelectItem value="transfer">انتقالی</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registrationForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>یادداشت (اختیاری)</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="textarea-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline" onClick={() => setIsRegistrationOpen(false)}>
                        انصراف
                      </Button>
                      <Button type="submit" disabled={registerStudent.isPending} data-testid="button-submit-registration">
                        {registerStudent.isPending ? 'در حال ثبت...' : 'ثبت‌نام'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              مشاهده همه دانشجویان
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Search and Level Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            جستجو و تخصیص سطح دانشجویان
          </CardTitle>
          <CardDescription>
            دانشجویان را جستجو کرده و سطح جدید اختصاص دهید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="نام، ایمیل، یا شماره تلفن دانشجو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                data-testid="input-student-search"
              />
            </div>
          </div>

          {studentsLoading && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">در حال جستجو...</p>
            </div>
          )}

          {students.length > 0 && (
            <div className="space-y-3">
              {students.map((student) => (
                <Card key={student.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{student.firstName} {student.lastName}</h4>
                        <Badge variant="outline">{student.email}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {student.phoneNumber && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.phoneNumber}
                          </span>
                        )}
                        {student.currentLevel && (
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            سطح فعلی: {student.currentLevel.name}
                          </span>
                        )}
                        {student.curriculum && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {student.curriculum.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsAssignmentOpen(true);
                      }}
                      data-testid={`button-assign-level-${student.id}`}
                    >
                      تخصیص سطح
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && students.length === 0 && !studentsLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">دانشجویی یافت نشد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Level Assignment Dialog */}
      <Dialog open={isAssignmentOpen} onOpenChange={setIsAssignmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تخصیص سطح جدید</DialogTitle>
            <DialogDescription>
              سطح جدید برای {selectedStudent?.firstName} {selectedStudent?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <p><strong>دانشجو:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p><strong>ایمیل:</strong> {selectedStudent.email}</p>
                  {selectedStudent.currentLevel && (
                    <p><strong>سطح فعلی:</strong> {selectedStudent.currentLevel.name}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>برنامه درسی جدید</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="برنامه درسی را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {curriculums.map((curriculum) => (
                        <SelectItem key={curriculum.id} value={curriculum.id.toString()}>
                          {curriculum.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>سطح جدید</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="سطح را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name} ({level.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setIsAssignmentOpen(false)}>
                  انصراف
                </Button>
                <Button disabled={assignLevel.isPending}>
                  {assignLevel.isPending ? 'در حال تخصیص...' : 'تخصیص سطح'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}