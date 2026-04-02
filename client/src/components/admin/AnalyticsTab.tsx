import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export function AnalyticsTab() {
  const metrics = [
    { title: "Ticket Resolution", items: [
      { label: "Average Response Time", value: "2.4 hours" },
      { label: "Resolution Rate", value: "94.2%" },
      { label: "Customer Satisfaction", value: "4.7/5", star: true },
    ]},
    { title: "Communication Volume", items: [
      { label: "Daily Messages", value: "156" },
      { label: "Active Conversations", value: "23" },
      { label: "Response Rate", value: "98.1%" },
    ]},
    { title: "Notification Performance", items: [
      { label: "Delivery Rate", value: "97.8%" },
      { label: "Click Rate", value: "23.4%" },
      { label: "Engagement Score", value: "8.2/10" },
    ]},
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map(({ title, items }) => (
          <Card key={title}>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map(({ label, value, star }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm">{label}</span>
                    {star ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{value}</span>
                      </div>
                    ) : (
                      <span className="font-medium">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Communication Trends</CardTitle>
          <CardDescription>Performance metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">Communication analytics chart would go here</div>
        </CardContent>
      </Card>
    </div>
  );
}
