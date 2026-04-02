import { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

interface TeacherFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  qualifications: string;
  experience: string;
  languages: string;
  hourlyRate: number;
  bio?: string;
  status: "active" | "inactive";
}

interface Props {
  form: UseFormReturn<TeacherFormData>;
  onSubmit: (data: TeacherFormData) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}

export function TeacherForm({ form, onSubmit, onCancel, isPending, submitLabel }: Props) {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("admin:teacherManagement.form.firstName")}</FormLabel>
                <FormControl>
                  <Input placeholder="Ahmad" {...field} />
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
                <FormLabel>{t("admin:teacherManagement.form.lastName")}</FormLabel>
                <FormControl>
                  <Input placeholder="Ahmadi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("admin:teacherManagement.form.email")}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="ahmad@institute.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("admin:teacherManagement.form.phone")}</FormLabel>
                <FormControl>
                  <Input placeholder="+98 912 345 6789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("admin:teacherManagement.form.specialization")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin:teacherManagement.form.selectSpecialization")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Persian Language">Persian Language</SelectItem>
                    <SelectItem value="English Language">English Language</SelectItem>
                    <SelectItem value="Arabic Language">Arabic Language</SelectItem>
                    <SelectItem value="French Language">French Language</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Literature">Literature</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("admin:teacherManagement.form.experience")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin:teacherManagement.form.yearsOfExperience")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1-2 years">1-2 years</SelectItem>
                    <SelectItem value="3-5 years">3-5 years</SelectItem>
                    <SelectItem value="5-10 years">5-10 years</SelectItem>
                    <SelectItem value="10+ years">10+ years</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="languages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("admin:teacherManagement.form.languagesTaught")}</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Persian, English" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("admin:teacherManagement.form.hourlyRate")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="500000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="qualifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("admin:teacherManagement.form.qualifications")}</FormLabel>
              <FormControl>
                <Textarea placeholder="Degrees, certifications, and relevant qualifications..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("admin:teacherManagement.form.bio")}</FormLabel>
              <FormControl>
                <Textarea placeholder="A brief description of teaching style and background..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("admin:teacherManagement.form.cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
