import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, DollarSign, Filter, Search, Video, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Tutor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  experience: number;
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  languages: string[];
  availability: string;
  profileImage?: string;
  bio: string;
}

export default function TutorsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const { data: tutors, isLoading, error } = useQuery({
    queryKey: ['/api/tutors'],
    enabled: !!user
  });

  const { data: userProfile } = useQuery({
    queryKey: ['/api/users/me/profile'],
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading tutors...</p>
        </div>
      </div>
    );
  }

  if (error || !tutors) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading tutors</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const filteredTutors = tutors.filter((tutor: Tutor) => {
    const matchesSearch = `${tutor.firstName} ${tutor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === "all" || tutor.languages.includes(languageFilter);
    const matchesPrice = priceFilter === "all" || 
                        (priceFilter === "budget" && tutor.hourlyRate < 50000) ||
                        (priceFilter === "premium" && tutor.hourlyRate >= 50000);
    const matchesRating = ratingFilter === "all" || tutor.rating >= parseInt(ratingFilter);
    
    return matchesSearch && matchesLanguage && matchesPrice && matchesRating;
  });

  const handleBookSession = (tutorId: number) => {
    // Navigate to booking flow
    window.location.href = `/book-session/${tutorId}`;
  };

  const handleMessage = (tutorId: number) => {
    // Navigate to messages with tutor
    window.location.href = `/messages?tutor=${tutorId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Find Your Perfect Persian Tutor
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect with expert Persian language tutors for personalized learning
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tutors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="Persian">Persian</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="budget">Budget (&lt; 50,000 IRR/hr)</SelectItem>
                  <SelectItem value="premium">Premium (≥ 50,000 IRR/hr)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            {filteredTutors.length} tutors found
            {userProfile?.targetLanguages?.length > 0 && (
              <span className="ml-2">
                • Matched to your target language: {userProfile.targetLanguages.join(", ")}
              </span>
            )}
          </p>
        </div>

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor: Tutor) => (
            <Card key={tutor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={tutor.profileImage} />
                    <AvatarFallback>
                      {tutor.firstName[0]}{tutor.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {tutor.firstName} {tutor.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {tutor.specialization}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{tutor.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">
                        ({tutor.totalSessions} sessions)
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {tutor.bio}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>Languages: {tutor.languages.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{tutor.experience} years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>{tutor.hourlyRate.toLocaleString()} IRR/hour</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleBookSession(tutor.id)}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMessage(tutor.id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTutors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No tutors found matching your criteria</p>
            <Button onClick={() => {
              setSearchTerm("");
              setLanguageFilter("all");
              setPriceFilter("all");
              setRatingFilter("all");
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}