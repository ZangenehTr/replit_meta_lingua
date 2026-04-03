import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface BrandingPayload {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  siteName?: string;
  [key: string]: unknown;
}

export interface BackupResult {
  size?: number;
  [key: string]: unknown;
}

export function useSystemMutations(
  setIsBackupInProgress: (v: boolean) => void,
  setBackupProgress: (v: number) => void,
) {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const updateBrandingMutation = useMutation({
    mutationFn: (data: BrandingPayload) => apiRequest("/api/admin/branding", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { toast({ title: "Branding Updated", description: "Branding updated successfully." }); qc.invalidateQueries({ queryKey: ["/api/admin/system"] }); },
    onError: (e: Error) => toast({ title: "Update Failed", description: e.message, variant: "destructive" }),
  });

  const exportConfigMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/system/export", { method: "GET" }),
    onSuccess: (data: unknown) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `metalingo-config-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast({ title: t("common:toast.configurationExported") });
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      setIsBackupInProgress(true); setBackupProgress(0);
      for (let i = 0; i <= 100; i += 10) { await new Promise((r) => setTimeout(r, 200)); setBackupProgress(i); }
      return apiRequest("/api/admin/system/backup", { method: "POST" });
    },
    onSuccess: (data: BackupResult) => { setIsBackupInProgress(false); toast({ title: "Backup Created", description: `Size: ${data?.size}MB` }); },
    onError: () => { setIsBackupInProgress(false); setBackupProgress(0); },
  });

  return { updateBrandingMutation, exportConfigMutation, createBackupMutation };
}
