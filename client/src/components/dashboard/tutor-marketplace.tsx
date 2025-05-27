import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface Tutor {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
}

export function TutorMarketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tutors, isLoading } = useQuery<Tutor[]>({
    queryKey: ["/api/tutors/featured"],
  });

  const bookTutorMutation = useMutation({
    mutationFn: async (tutorId: number) => {
      const response = await apiRequest("POST", "/api/sessions", {
        tutorId,
        title: "Conversation Practice",
        description: "One-on-one conversation practice session",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        duration: 60
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Booked",
        description: "Your tutoring session has been scheduled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "Unable to book session. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Featured Tutors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6 animate-pulse">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-3" />
                  <div className="h-5 bg-muted rounded w-3/4 mx-auto mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                </div>
                <div className="h-8 bg-muted rounded w-full" />
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
          <CardTitle>Featured Tutors</CardTitle>
          <Button variant="ghost" size="sm">
            View All Tutors →
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!tutors || tutors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tutors available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <div
                key={tutor.id}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-center mb-4">
                  <Avatar className="w-20 h-20 mx-auto mb-3">
                    <AvatarImage src={tutor.avatar} alt={`${tutor.firstName} ${tutor.lastName}`} />
                    <AvatarFallback className="text-lg">
                      {tutor.firstName[0]}{tutor.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium">{tutor.firstName} {tutor.lastName}</h3>
                  <p className="text-sm text-muted-foreground">Language Specialist</p>
                  <div className="flex items-center justify-center mt-2">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">5.0 (50+ reviews)</span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Experience:</span>
                    <span>5+ years</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-medium">$25/hour</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">English</Badge>
                    <Badge variant="secondary" className="text-xs">Conversation</Badge>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => bookTutorMutation.mutate(tutor.id)}
                  disabled={bookTutorMutation.isPending}
                >
                  {bookTutorMutation.isPending ? "Booking..." : "Book Session"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
