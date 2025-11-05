import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Clock, Calendar, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

interface SessionPackage {
  id: number;
  packageName: string;
  totalSessions: number;
  sessionDuration: number;
  usedSessions: number;
  remainingSessions: number;
  price: string;
  status: string;
  purchasedAt: Date;
  expiresAt?: Date;
  notes?: string;
}

interface PackageOption {
  name: string;
  sessions: number;
  duration: number;
  price: number;
}

const packageOptions: PackageOption[] = [
  { name: "Starter Package", sessions: 10, duration: 60, price: 1500000 },
  { name: "Standard Package", sessions: 20, duration: 90, price: 3600000 },
  { name: "Premium Package", sessions: 30, duration: 90, price: 5100000 },
  { name: "Intensive Package", sessions: 50, duration: 90, price: 8000000 }
];

export function SessionPackages() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: packages = [] } = useQuery<SessionPackage[]>({
    queryKey: ['/api/student/session-packages']
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageOption: PackageOption) => {
      return await apiRequest('/api/student/session-packages/purchase', {
        method: 'POST',
        body: JSON.stringify({
          packageName: packageOption.name,
          totalSessions: packageOption.sessions,
          sessionDuration: packageOption.duration,
          price: packageOption.price
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/session-packages'] });
      setIsOpen(false);
      setSelectedPackage("");
    }
  });

  const handlePurchase = () => {
    const selected = packageOptions.find(p => p.name === selectedPackage);
    if (selected) {
      purchaseMutation.mutate(selected);
    }
  };

  const activePackages = packages.filter(p => p.status === 'active');
  const completedPackages = packages.filter(p => p.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session Packages</h2>
          <p className="text-muted-foreground">Manage your private lesson packages</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Package
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase Session Package</DialogTitle>
              <DialogDescription>
                Choose a package that fits your learning needs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {packageOptions.map((option) => (
                    <SelectItem key={option.name} value={option.name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {option.sessions} sessions × {option.duration} minutes • {formatCurrency(option.price, 'IRR')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedPackage && (
                <Card>
                  <CardContent className="pt-6">
                    {packageOptions.find(p => p.name === selectedPackage) && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Total Sessions:</span>{" "}
                          {packageOptions.find(p => p.name === selectedPackage)?.sessions}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Session Duration:</span>{" "}
                          {packageOptions.find(p => p.name === selectedPackage)?.duration} minutes
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Total Price:</span>{" "}
                          {formatCurrency(packageOptions.find(p => p.name === selectedPackage)?.price || 0, 'IRR')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <Button 
                onClick={handlePurchase} 
                disabled={!selectedPackage || purchaseMutation.isPending}
                className="w-full"
              >
                {purchaseMutation.isPending ? "Processing..." : "Purchase Package"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Packages */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Packages</h3>
        {activePackages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No active packages</p>
              <p className="text-sm text-muted-foreground mt-2">
                Purchase a package to start your private lessons
              </p>
            </CardContent>
          </Card>
        ) : (
          activePackages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pkg.packageName}</CardTitle>
                  <Badge variant="default">Active</Badge>
                </div>
                <CardDescription>
                  Purchased on {format(new Date(pkg.purchasedAt), 'MMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Session Duration
                    </span>
                    <span className="font-medium">{pkg.sessionDuration} minutes</span>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Sessions Used</span>
                      <span className="font-medium">
                        {pkg.usedSessions} / {pkg.totalSessions}
                      </span>
                    </div>
                    <Progress 
                      value={(pkg.usedSessions / pkg.totalSessions) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {pkg.remainingSessions} sessions remaining
                    </p>
                  </div>
                  
                  {pkg.expiresAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Expires On
                      </span>
                      <span className="font-medium">
                        {format(new Date(pkg.expiresAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Completed Packages */}
      {completedPackages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Completed Packages</h3>
          {completedPackages.map((pkg) => (
            <Card key={pkg.id} className="opacity-75">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pkg.packageName}</CardTitle>
                  <Badge variant="secondary">Completed</Badge>
                </div>
                <CardDescription>
                  {pkg.totalSessions} sessions × {pkg.sessionDuration} minutes
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}