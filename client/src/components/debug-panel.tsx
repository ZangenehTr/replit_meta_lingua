import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DebugPanel() {
  const clearAuth = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/auth";
  };

  return (
    <Card className="fixed bottom-4 right-4 w-64 z-50">
      <CardHeader>
        <CardTitle className="text-sm">Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={clearAuth} variant="outline" size="sm" className="w-full">
          Clear Auth & Login Again
        </Button>
      </CardContent>
    </Card>
  );
}