import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Send, 
  TestTube, 
  CheckCircle,
  AlertCircle,
  Wallet,
  Phone,
  List
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SMSTestPage() {
  const { toast } = useToast();
  const [testData, setTestData] = useState({
    phoneNumber: '',
    message: 'Hello! This is a test message from Meta Lingua platform.'
  });
  const [verificationData, setVerificationData] = useState({
    phoneNumber: '',
    code: '',
    template: ''
  });

  // Get account info
  const { data: accountInfo, refetch: refetchAccount } = useQuery({
    queryKey: ['/api/admin/sms/account-info'],
    retry: false,
  });

  // Get SMS templates
  const { data: smsTemplates = [] } = useQuery({
    queryKey: ['/api/admin/sms-templates'],
    retry: false,
  });

  // Test SMS mutation
  const testSMSMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      return await apiRequest('/api/admin/sms/test', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result: any) => {
      if (result.success) {
        toast({
          title: "SMS Sent Successfully!",
          description: `Message ID: ${result.messageId} | Cost: ${result.cost} credits`,
        });
      } else {
        toast({
          title: "SMS Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "SMS Test Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send verification SMS mutation
  const verificationSMSMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; code: string; template?: string }) => {
      return await apiRequest('/api/admin/sms/send-verification', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result: any) => {
      if (result.success) {
        toast({
          title: "Verification SMS Sent!",
          description: `Message ID: ${result.messageId} | Cost: ${result.cost} credits`,
        });
      } else {
        toast({
          title: "Verification SMS Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Verification SMS Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testData.phoneNumber || !testData.message) {
      toast({
        title: "Missing Information",
        description: "Please provide both phone number and message",
        variant: "destructive",
      });
      return;
    }
    testSMSMutation.mutate(testData);
  };

  const handleVerificationSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationData.phoneNumber || !verificationData.code) {
      toast({
        title: "Missing Information",
        description: "Please provide both phone number and verification code",
        variant: "destructive",
      });
      return;
    }
    verificationSMSMutation.mutate(verificationData);
  };

  const generateRandomCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationData({ ...verificationData, code });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">SMS Service Testing</h1>
        <p className="text-muted-foreground">
          Test your Kavenegar SMS integration with real messages
        </p>
      </div>

      {/* Account Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Kavenegar Account Information
          </CardTitle>
          <CardDescription>
            Your current SMS service status and balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              {accountInfo?.success ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Service Connected</span>
                  </div>
                  <div className="text-lg font-bold">
                    Balance: {accountInfo.balance?.toLocaleString()} Credits
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">
                    {accountInfo?.error || "Service Not Connected"}
                  </span>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetchAccount()}
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Testing Tabs */}
      <Tabs defaultValue="simple" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="simple">Simple SMS Test</TabsTrigger>
          <TabsTrigger value="verification">Verification SMS</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="simple">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Test SMS
              </CardTitle>
              <CardDescription>
                Send a simple SMS message to test your Kavenegar integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTestSMS} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="09123456789 or +989123456789"
                    value={testData.phoneNumber}
                    onChange={(e) => setTestData({ ...testData, phoneNumber: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter Iranian mobile number (starting with 09) or international format
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message Content</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your test message here..."
                    value={testData.message}
                    onChange={(e) => setTestData({ ...testData, message: e.target.value })}
                    rows={4}
                    maxLength={160}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {testData.message.length}/160 characters
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={testSMSMutation.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {testSMSMutation.isPending ? "Sending..." : "Send Test SMS"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Verification Code SMS
              </CardTitle>
              <CardDescription>
                Test sending verification codes like those used for login/registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerificationSMS} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verifyPhoneNumber">Phone Number</Label>
                  <Input
                    id="verifyPhoneNumber"
                    type="tel"
                    placeholder="09123456789"
                    value={verificationData.phoneNumber}
                    onChange={(e) => setVerificationData({ ...verificationData, phoneNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      placeholder="123456"
                      value={verificationData.code}
                      onChange={(e) => setVerificationData({ ...verificationData, code: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomCode}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Template Selection (Optional)</Label>
                  <Select
                    value={verificationData.template}
                    onValueChange={(value) => setVerificationData({ ...verificationData, template: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template or leave empty for simple SMS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Template (Simple SMS)</SelectItem>
                      {smsTemplates
                        .filter((t: any) => t.event === 'verification')
                        .map((template: any) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            Template {template.id} ({template.language})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a verification template or leave empty for simple SMS
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={verificationSMSMutation.isPending}
                  className="w-full"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {verificationSMSMutation.isPending ? "Sending..." : "Send Verification SMS"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                SMS Templates
              </CardTitle>
              <CardDescription>
                Available SMS templates with their template IDs for Kavenegar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {smsTemplates.map((template: any) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">ID: {template.id}</Badge>
                        <Badge variant={template.language === 'persian' ? 'default' : 'secondary'}>
                          {template.language}
                        </Badge>
                        <Badge variant="outline">{template.event}</Badge>
                      </div>
                      <Badge variant={template.isActive ? 'default' : 'destructive'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Recipient:</strong> {template.recipient}
                    </p>
                    <p className="text-sm bg-muted p-2 rounded font-mono">
                      {template.template}
                    </p>
                    {template.variables && template.variables.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Variables:</strong> {template.variables.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
                
                {smsTemplates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No SMS templates available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}