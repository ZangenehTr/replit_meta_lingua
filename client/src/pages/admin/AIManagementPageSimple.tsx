import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export function AIManagementPageSimple() {
  console.log("Simple AI Management page loading...");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Services Management</h1>
          <p className="text-muted-foreground">
            Manage local AI processing with Ollama and monitor service status
          </p>
        </div>
        <Button variant="outline">
          Refresh Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Service Status
          </CardTitle>
          <CardDescription>Current status of local AI processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-green-600 font-medium">Service Running</div>
        </CardContent>
      </Card>
    </div>
  );
}