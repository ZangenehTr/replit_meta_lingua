import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Clock, AlertTriangle } from "lucide-react";

interface Homework {
  id: number;
  title: string;
  courseName: string;
  dueDate: string;
  status: string;
}

export function HomeworkTasks() {
  const { data: homework, isLoading } = useQuery<Homework[]>({
    queryKey: ["/api/homework/pending"],
  });

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) {
      return { text: "Overdue", urgent: true };
    } else if (diffDays === 0) {
      return { text: "Due today", urgent: true };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", urgent: false };
    } else {
      return { text: `Due in ${diffDays} days`, urgent: false };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Homework</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border-l-4 border-muted pl-4 animate-pulse">
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mb-1" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pending Homework</CardTitle>
          <Button variant="ghost" size="sm">
            View All Tasks
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!homework || homework.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending homework</p>
            <p className="text-sm">Great job staying on top of your tasks! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {homework.map((task) => {
              const dueDateInfo = formatDueDate(task.dueDate);
              
              return (
                <div
                  key={task.id}
                  className={`border-l-4 pl-4 ${
                    dueDateInfo.urgent 
                      ? "border-red-500 bg-red-50 dark:bg-red-900/10" 
                      : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">{task.courseName}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {dueDateInfo.urgent ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          dueDateInfo.urgent ? "text-red-600" : "text-yellow-600"
                        }`}>
                          {dueDateInfo.text}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Start
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
