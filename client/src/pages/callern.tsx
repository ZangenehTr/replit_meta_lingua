import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { 
  Video, 
  Clock, 
  Package, 
  Phone, 
  Calendar, 
  User, 
  Star,
  CheckCircle,
  XCircle,
  PlayCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CallernPackage {
  id: number;
  packageName: string;
  totalHours: number;
  price: number;
  description: string;
  isActive: boolean;
}

interface StudentCallernPackage {
  id: number;
  packageId: number;
  totalHours: number;
  usedMinutes: number;
  remainingMinutes: number;
  price: number;
  status: string;
  purchasedAt: string;
  expiresAt?: string;
  package: CallernPackage;
}

interface CallHistory {
  id: number;
  teacherId: number;
  duration: number;
  callType: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  teacherName: string;
  recordingUrl?: string;
}

export default function CallernSystem() {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<CallernPackage | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  // Fetch available Callern packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/student/callern-packages"],
  });

  // Fetch student's purchased packages
  const { data: studentPackages = [], isLoading: studentPackagesLoading } = useQuery({
    queryKey: ["/api/student/my-callern-packages"],
  });

  // Fetch call history
  const { data: callHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/student/callern-history"],
  });

  // Purchase package mutation
  const purchasePackageMutation = useMutation({
    mutationFn: (packageId: number) =>
      apiRequest("/api/student/purchase-callern-package", {
        method: "POST",
        body: JSON.stringify({ packageId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/my-callern-packages"] });
      toast({
        title: "Package Purchased",
        description: "Callern package purchased successfully!",
      });
      setIsPurchaseDialogOpen(false);
      setSelectedPackage(null);
    },
    onError: (error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchasePackage = (pkg: CallernPackage) => {
    setSelectedPackage(pkg);
    setIsPurchaseDialogOpen(true);
  };

  const confirmPurchase = () => {
    if (selectedPackage) {
      purchasePackageMutation.mutate(selectedPackage.id);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Callern Video Call System</h1>
            <p className="text-muted-foreground mt-2">
              One-on-one video calls with professional language teachers
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentPackages.filter((pkg: StudentCallernPackage) => pkg.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Minutes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentPackages.reduce((total: number, pkg: StudentCallernPackage) => 
                  total + (pkg.status === 'active' ? pkg.remainingMinutes : 0), 0
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{callHistory.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {callHistory.filter((call: CallHistory) => {
                  const callDate = new Date(call.startedAt);
                  const thisMonth = new Date();
                  return callDate.getMonth() === thisMonth.getMonth() && 
                         callDate.getFullYear() === thisMonth.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Available Packages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {packagesLoading ? (
                <div className="text-center py-4">Loading packages...</div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg: CallernPackage) => (
                    <div key={pkg.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{pkg.packageName}</h3>
                        <Badge variant="outline">{pkg.totalHours} hours</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(pkg.price)}
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => handlePurchasePackage(pkg)}
                          disabled={purchasePackageMutation.isPending}
                        >
                          Purchase
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                My Callern Packages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentPackagesLoading ? (
                <div className="text-center py-4">Loading your packages...</div>
              ) : studentPackages.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No packages purchased yet. Purchase a package to start your video calls!
                </div>
              ) : (
                <div className="space-y-4">
                  {studentPackages.map((pkg: StudentCallernPackage) => (
                    <div key={pkg.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{pkg.package?.packageName}</h3>
                        <Badge 
                          variant={pkg.status === 'active' ? 'default' : 'secondary'}
                        >
                          {pkg.status === 'active' ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" />
                              {pkg.status}
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Remaining:</span>
                          <div className="font-medium">{formatDuration(pkg.remainingMinutes)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Used:</span>
                          <div className="font-medium">{formatDuration(pkg.usedMinutes)}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${(pkg.usedMinutes / (pkg.totalHours * 60)) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Call History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-4">Loading call history...</div>
            ) : callHistory.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No calls yet. Purchase a package and schedule your first call!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recording</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callHistory.map((call: CallHistory) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {call.teacherName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(call.startedAt).toLocaleString('fa-IR')}
                      </TableCell>
                      <TableCell>{formatDuration(call.duration)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{call.callType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={call.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.recordingUrl ? (
                          <Button size="sm" variant="outline">
                            <PlayCircle className="mr-1 h-4 w-4" />
                            Watch
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Purchase Confirmation Dialog */}
        <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Package Purchase</DialogTitle>
              <DialogDescription>
                Are you sure you want to purchase this Callern package?
              </DialogDescription>
            </DialogHeader>
            
            {selectedPackage && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{selectedPackage.packageName}</h3>
                  <p className="text-muted-foreground">{selectedPackage.description}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span>Duration: {selectedPackage.totalHours} hours</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(selectedPackage.price)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsPurchaseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmPurchase}
                disabled={purchasePackageMutation.isPending}
              >
                {purchasePackageMutation.isPending ? "Processing..." : "Confirm Purchase"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}