import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Target,
  MapPin,
  Clock,
  BookOpen,
  GraduationCap,
  Users,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { WORKFLOW_STATUS, LEAD_STATUS } from "@shared/schema";

// Form validation schema based on the unified workflow requirements
const newIntakeSchema = z.object({
  // Basic Information (Required)
  firstName: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  lastName: z.string().min(2, "نام خانوادگی باید حداقل 2 کاراکتر باشد"), 
  phoneNumber: z.string().min(10, "شماره تلفن معتبر وارد کنید"),
  age: z.number().min(5, "سن باید بیش از 5 سال باشد").max(100, "سن معتبر وارد کنید"),
  gender: z.enum(["male", "female"], { required_error: "انتخاب جنسیت اجباری است" }),
  
  // Optional fields
  email: z.string().email("ایمیل معتبر وارد کنید").optional().or(z.literal("")),
  nationalId: z.string().length(10, "کد ملی باید 10 رقم باشد").optional().or(z.literal("")),
  
  // Course Selection (Required)
  courseTarget: z.enum(["IELTS", "TOEFL", "PTE", "GRE", "GE"], { required_error: "انتخاب دوره اجباری است" }),
  courseModule: z.string().optional(),
  goal: z.string().min(1, "انتخاب هدف اجباری است"),
  
  // Format and Delivery
  deliveryType: z.enum(["حضوری", "آنلاین", "برون‌سازمانی"], { required_error: "نوع برگزاری اجباری است" }),
  classType: z.enum(["خصوصی", "گروهی"], { required_error: "نوع کلاس اجباری است" }),
  
  // Additional Information
  referralSource: z.string().min(1, "نحوه آشنایی را وارد کنید"),
  timeLimit: z.number().optional(),
  branch: z.string().optional(),
  notes: z.string().optional()
});

type NewIntakeForm = z.infer<typeof newIntakeSchema>;

function NewIntake() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<NewIntakeForm>({
    resolver: zodResolver(newIntakeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      nationalId: "",
      courseTarget: undefined,
      courseModule: "",
      goal: "",
      deliveryType: undefined,
      classType: undefined,
      referralSource: "",
      notes: ""
    }
  });

  const courseTarget = form.watch("courseTarget");

  // Reset courseModule when courseTarget changes (Data Integrity Fix)
  useEffect(() => {
    if (courseTarget) {
      form.setValue("courseModule", "");
    }
  }, [courseTarget, form]);

  // Get available modules based on course target
  const getAvailableModules = (target: string) => {
    switch (target) {
      case "IELTS":
        return [
          { value: "Academic", label: "آکادمیک" },
          { value: "General", label: "عمومی" }
        ];
      case "PTE":
        return [
          { value: "Academic", label: "آکادمیک" },
          { value: "Core", label: "کور" }
        ];
      case "TOEFL":
        return [
          { value: "iBT", label: "iBT" }
        ];
      case "GRE":
        return [
          { value: "General", label: "عمومی" },
          { value: "Subject", label: "تخصصی" }
        ];
      case "GE":
        return [
          { value: "Conversation", label: "مکالمه" },
          { value: "Business", label: "تجاری" },
          { value: "Academic", label: "آکادمیک" }
        ];
      default:
        return [];
    }
  };

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: NewIntakeForm) => {
      // Server will automatically set assignedTo from authenticated session (Security Fix)
      // Data Semantics Fix: All courses are English language with different exam types
      const leadData = {
        ...data,
        // Security Fix: Remove assignedTo - server derives from req.user.id
        source: "call_center",
        status: LEAD_STATUS.NEW, 
        priority: "medium",
        level: "pending_assessment",
        workflowStatus: WORKFLOW_STATUS.NEW_INTAKE,
        interestedLanguage: "english", // Data Semantics Fix: All courses are English
        examType: data.courseTarget, // Store actual exam type (IELTS, TOEFL, etc.)
        interestedLevel: "beginner", // Default until assessment
        createdAt: new Date().toISOString()
      };

      return await apiRequest("/api/leads", {
        method: "POST",
        body: JSON.stringify(leadData)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "ثبت موفق",
        description: "اطلاعات متقاضی با موفقیت ثبت شد",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ثبت",
        description: error.message || "خطایی در ثبت اطلاعات رخ داد",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: NewIntakeForm) => {
    createLeadMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            ثبت متقاضی جدید
          </CardTitle>
          <CardDescription>
            اطلاعات کامل متقاضی را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  اطلاعات شخصی
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام خانوادگی *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره تلفن *</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" dir="ltr" data-testid="input-phone-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سن *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                            data-testid="input-age"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>جنسیت *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value} data-testid="select-gender">
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">آقا</SelectItem>
                              <SelectItem value="female">خانم</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ایمیل (اختیاری)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" dir="ltr" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کد ملی (اختیاری)</FormLabel>
                        <FormControl>
                          <Input {...field} dir="ltr" maxLength={10} data-testid="input-national-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Course Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  اطلاعات دوره
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>هدف دوره *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value} data-testid="select-course-target">
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IELTS">IELTS</SelectItem>
                              <SelectItem value="TOEFL">TOEFL</SelectItem>
                              <SelectItem value="PTE">PTE</SelectItem>
                              <SelectItem value="GRE">GRE</SelectItem>
                              <SelectItem value="GE">انگلیسی عمومی</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {courseTarget && getAvailableModules(courseTarget).length > 0 && (
                    <FormField
                      control={form.control}
                      name="courseModule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ماژول دوره</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value} data-testid="select-course-module">
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب کنید" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableModules(courseTarget).map((module) => (
                                  <SelectItem key={module.value} value={module.value}>
                                    {module.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>هدف از یادگیری *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="مثال: مهاجرت، تحصیل در خارج، پیشرفت شغلی..."
                          data-testid="textarea-goal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Format and Delivery */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  شیوه برگزاری
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="deliveryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع برگزاری *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 gap-2"
                            data-testid="radio-delivery-type"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="حضوری" id="in-person" />
                              <Label htmlFor="in-person">حضوری</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="آنلاین" id="online" />
                              <Label htmlFor="online">آنلاین</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="برون‌سازمانی" id="external" />
                              <Label htmlFor="external">برون‌سازمانی</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="classType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع کلاس *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 gap-2"
                            data-testid="radio-class-type"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="خصوصی" id="private" />
                              <Label htmlFor="private">خصوصی</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="گروهی" id="group" />
                              <Label htmlFor="group">گروهی</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">اطلاعات تکمیلی</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="referralSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نحوه آشنایی با موسسه *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value} data-testid="select-referral-source">
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="website">وبسایت</SelectItem>
                              <SelectItem value="social_media">شبکه‌های اجتماعی</SelectItem>
                              <SelectItem value="referral">معرفی دوستان</SelectItem>
                              <SelectItem value="advertisement">تبلیغات</SelectItem>
                              <SelectItem value="walk_in">مراجعه حضوری</SelectItem>
                              <SelectItem value="phone_inquiry">استعلام تلفنی</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>محدودیت زمانی (ماه)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                            placeholder="مثال: 6"
                            data-testid="input-time-limit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>یادداشت‌ها (اختیاری)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="یادداشت‌های اضافی در مورد متقاضی..."
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={createLeadMutation.isPending}
                  data-testid="button-submit-intake"
                >
                  {createLeadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      در حال ثبت...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      ثبت متقاضی
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewIntake;