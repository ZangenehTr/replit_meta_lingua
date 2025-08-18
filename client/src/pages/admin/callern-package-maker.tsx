import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, X, BookOpen, Clock, DollarSign, Users, Calendar, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

interface RoadmapStep {
  id?: number;
  stepNumber: number;
  title: string;
  description: string;
  objectives: string;
  estimatedMinutes: number;
  skillFocus: string;
  materials: any;
  assessmentCriteria: string;
  // AI guidance for teachers
  aiTeacherGuidance?: {
    keyPoints: string[];
    suggestedQuestions: string[];
    commonMistakes: string[];
    studentHesitationHelp: string[];
  };
}

interface Roadmap {
  id?: number;
  roadmapName: string;
  description: string;
  totalSteps: number;
  estimatedHours: number;
  steps: RoadmapStep[];
}

interface CallernPackage {
  id?: number;
  packageName: string;
  totalHours: number;
  price: number;
  description: string;
  packageType: string;
  targetLevel: string;
  maxStudents: number;
  availableFrom: string;
  availableTo: string;
  roadmap?: Roadmap;
}

export default function CallernPackageMaker() {
  const { toast } = useToast();
  const [currentPackage, setCurrentPackage] = useState<CallernPackage>({
    packageName: "",
    totalHours: 10,
    price: 0,
    description: "",
    packageType: "general_conversation",
    targetLevel: "intermediate",
    maxStudents: 20,
    availableFrom: new Date().toISOString().split('T')[0],
    availableTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    roadmap: {
      roadmapName: "",
      description: "",
      totalSteps: 0,
      estimatedHours: 0,
      steps: []
    }
  });

  const [currentStep, setCurrentStep] = useState<RoadmapStep>({
    stepNumber: 1,
    title: "",
    description: "",
    objectives: "",
    estimatedMinutes: 30,
    skillFocus: "speaking",
    materials: {},
    assessmentCriteria: "",
    aiTeacherGuidance: {
      keyPoints: [],
      suggestedQuestions: [],
      commonMistakes: [],
      studentHesitationHelp: []
    }
  });

  const [isAddingStep, setIsAddingStep] = useState(false);

  // Fetch existing packages
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['/api/callern/packages'],
    enabled: true
  });

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (pkg: CallernPackage) => {
      return await apiRequest('/api/callern/packages', {
        method: 'POST',
        body: JSON.stringify(pkg)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Callern package created successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/callern/packages'] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setCurrentPackage({
      packageName: "",
      totalHours: 10,
      price: 0,
      description: "",
      packageType: "general_conversation",
      targetLevel: "intermediate",
      maxStudents: 20,
      availableFrom: new Date().toISOString().split('T')[0],
      availableTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      roadmap: {
        roadmapName: "",
        description: "",
        totalSteps: 0,
        estimatedHours: 0,
        steps: []
      }
    });
  };

  const addStep = () => {
    if (!currentStep.title || !currentStep.description) {
      toast({
        title: "Error",
        description: "Please fill in step title and description",
        variant: "destructive"
      });
      return;
    }

    const newStep = {
      ...currentStep,
      stepNumber: (currentPackage.roadmap?.steps.length || 0) + 1
    };

    setCurrentPackage(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap!,
        steps: [...(prev.roadmap?.steps || []), newStep],
        totalSteps: (prev.roadmap?.steps.length || 0) + 1,
        estimatedHours: ((prev.roadmap?.estimatedHours || 0) * 60 + newStep.estimatedMinutes) / 60
      }
    }));

    // Reset step form
    setCurrentStep({
      stepNumber: (currentPackage.roadmap?.steps.length || 0) + 2,
      title: "",
      description: "",
      objectives: "",
      estimatedMinutes: 30,
      skillFocus: "speaking",
      materials: {},
      assessmentCriteria: "",
      aiTeacherGuidance: {
        keyPoints: [],
        suggestedQuestions: [],
        commonMistakes: [],
        studentHesitationHelp: []
      }
    });
    setIsAddingStep(false);
  };

  const removeStep = (index: number) => {
    setCurrentPackage(prev => ({
      ...prev,
      roadmap: {
        ...prev.roadmap!,
        steps: prev.roadmap!.steps.filter((_, i) => i !== index).map((step, i) => ({
          ...step,
          stepNumber: i + 1
        })),
        totalSteps: prev.roadmap!.steps.length - 1,
        estimatedHours: prev.roadmap!.steps
          .filter((_, i) => i !== index)
          .reduce((sum, step) => sum + step.estimatedMinutes, 0) / 60
      }
    }));
  };

  const savePackage = () => {
    if (!currentPackage.packageName || !currentPackage.roadmap?.roadmapName) {
      toast({
        title: "Error",
        description: "Please fill in package name and roadmap name",
        variant: "destructive"
      });
      return;
    }

    if (currentPackage.roadmap?.steps.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one step to the roadmap",
        variant: "destructive"
      });
      return;
    }

    createPackageMutation.mutate(currentPackage);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Callern Package Maker</h1>
        <p className="text-muted-foreground mt-2">
          Create AI-powered learning packages with structured roadmaps
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Package</TabsTrigger>
          <TabsTrigger value="existing">Existing Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Package Details */}
            <Card>
              <CardHeader>
                <CardTitle>Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="packageName">Package Name</Label>
                  <Input
                    id="packageName"
                    value={currentPackage.packageName}
                    onChange={(e) => setCurrentPackage(prev => ({ ...prev, packageName: e.target.value }))}
                    placeholder="e.g., IELTS Speaking Mastery"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalHours">Total Hours</Label>
                    <Input
                      id="totalHours"
                      type="number"
                      value={currentPackage.totalHours}
                      onChange={(e) => setCurrentPackage(prev => ({ ...prev, totalHours: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (IRR)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={currentPackage.price}
                      onChange={(e) => setCurrentPackage(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                      placeholder="5000000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="packageType">Package Type</Label>
                  <Select
                    value={currentPackage.packageType}
                    onValueChange={(value) => setCurrentPackage(prev => ({ ...prev, packageType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_conversation">General Conversation</SelectItem>
                      <SelectItem value="ielts_speaking">IELTS Speaking</SelectItem>
                      <SelectItem value="business_english">Business English</SelectItem>
                      <SelectItem value="academic_writing">Academic Writing</SelectItem>
                      <SelectItem value="pronunciation">Pronunciation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetLevel">Target Level</Label>
                  <Select
                    value={currentPackage.targetLevel}
                    onValueChange={(value) => setCurrentPackage(prev => ({ ...prev, targetLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                      <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={currentPackage.maxStudents}
                    onChange={(e) => setCurrentPackage(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="availableFrom">Available From</Label>
                    <Input
                      id="availableFrom"
                      type="date"
                      value={currentPackage.availableFrom}
                      onChange={(e) => setCurrentPackage(prev => ({ ...prev, availableFrom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="availableTo">Available To</Label>
                    <Input
                      id="availableTo"
                      type="date"
                      value={currentPackage.availableTo}
                      onChange={(e) => setCurrentPackage(prev => ({ ...prev, availableTo: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Package Description</Label>
                  <Textarea
                    id="description"
                    value={currentPackage.description}
                    onChange={(e) => setCurrentPackage(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what students will learn..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Roadmap Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Roadmap Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roadmapName">Roadmap Name</Label>
                  <Input
                    id="roadmapName"
                    value={currentPackage.roadmap?.roadmapName}
                    onChange={(e) => setCurrentPackage(prev => ({
                      ...prev,
                      roadmap: { ...prev.roadmap!, roadmapName: e.target.value }
                    }))}
                    placeholder="e.g., Complete IELTS Speaking Preparation"
                  />
                </div>

                <div>
                  <Label htmlFor="roadmapDescription">Roadmap Description</Label>
                  <Textarea
                    id="roadmapDescription"
                    value={currentPackage.roadmap?.description}
                    onChange={(e) => setCurrentPackage(prev => ({
                      ...prev,
                      roadmap: { ...prev.roadmap!, description: e.target.value }
                    }))}
                    placeholder="Describe the learning journey..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Total Steps: {currentPackage.roadmap?.steps.length || 0} | 
                    Est. Hours: {currentPackage.roadmap?.estimatedHours.toFixed(1) || 0}
                  </div>
                  <Dialog open={isAddingStep} onOpenChange={setIsAddingStep}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Step
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Roadmap Step</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Step Title</Label>
                          <Input
                            value={currentStep.title}
                            onChange={(e) => setCurrentStep(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Introduction & Ice Breaking"
                          />
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={currentStep.description}
                            onChange={(e) => setCurrentStep(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="What will be covered in this step..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label>Learning Objectives</Label>
                          <Textarea
                            value={currentStep.objectives}
                            onChange={(e) => setCurrentStep(prev => ({ ...prev, objectives: e.target.value }))}
                            placeholder="• Build confidence in speaking\n• Learn basic greetings\n• Practice self-introduction"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Duration (minutes)</Label>
                            <Input
                              type="number"
                              value={currentStep.estimatedMinutes}
                              onChange={(e) => setCurrentStep(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) }))}
                            />
                          </div>
                          <div>
                            <Label>Skill Focus</Label>
                            <Select
                              value={currentStep.skillFocus}
                              onValueChange={(value) => setCurrentStep(prev => ({ ...prev, skillFocus: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="speaking">Speaking</SelectItem>
                                <SelectItem value="listening">Listening</SelectItem>
                                <SelectItem value="grammar">Grammar</SelectItem>
                                <SelectItem value="vocabulary">Vocabulary</SelectItem>
                                <SelectItem value="pronunciation">Pronunciation</SelectItem>
                                <SelectItem value="reading">Reading</SelectItem>
                                <SelectItem value="writing">Writing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Assessment Criteria</Label>
                          <Textarea
                            value={currentStep.assessmentCriteria}
                            onChange={(e) => setCurrentStep(prev => ({ ...prev, assessmentCriteria: e.target.value }))}
                            placeholder="How to evaluate if the student has mastered this step..."
                            rows={2}
                          />
                        </div>

                        {/* AI Teacher Guidance */}
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3">AI Teacher Guidance</h4>
                          
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm">Key Points to Cover</Label>
                              <Textarea
                                placeholder="Enter key points separated by new lines"
                                rows={2}
                                onChange={(e) => setCurrentStep(prev => ({
                                  ...prev,
                                  aiTeacherGuidance: {
                                    ...prev.aiTeacherGuidance!,
                                    keyPoints: e.target.value.split('\n').filter(p => p.trim())
                                  }
                                }))}
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Suggested Questions</Label>
                              <Textarea
                                placeholder="Enter questions separated by new lines"
                                rows={2}
                                onChange={(e) => setCurrentStep(prev => ({
                                  ...prev,
                                  aiTeacherGuidance: {
                                    ...prev.aiTeacherGuidance!,
                                    suggestedQuestions: e.target.value.split('\n').filter(q => q.trim())
                                  }
                                }))}
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Student Hesitation Help</Label>
                              <Textarea
                                placeholder="Hints to show when student hesitates (one per line)"
                                rows={2}
                                onChange={(e) => setCurrentStep(prev => ({
                                  ...prev,
                                  aiTeacherGuidance: {
                                    ...prev.aiTeacherGuidance!,
                                    studentHesitationHelp: e.target.value.split('\n').filter(h => h.trim())
                                  }
                                }))}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddingStep(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addStep}>
                            Add Step
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Steps List */}
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  {currentPackage.roadmap?.steps.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No steps added yet. Click "Add Step" to begin.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {currentPackage.roadmap?.steps.map((step, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Step {step.stepNumber}</Badge>
                                <Badge>{step.skillFocus}</Badge>
                                <Badge variant="secondary">{step.estimatedMinutes} min</Badge>
                              </div>
                              <h4 className="font-semibold mt-2">{step.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeStep(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <Button 
                  className="w-full" 
                  onClick={savePackage}
                  disabled={createPackageMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createPackageMutation.isPending ? "Creating..." : "Create Package"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="existing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p>Loading packages...</p>
            ) : packages.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No packages created yet.
              </p>
            ) : (
              packages.map((pkg: any) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{pkg.packageName}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge>{pkg.packageType}</Badge>
                      <Badge variant="outline">{pkg.targetLevel}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{pkg.totalHours} hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{pkg.price.toLocaleString()} IRR</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Max {pkg.maxStudents} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(pkg.availableFrom).toLocaleDateString()} - {new Date(pkg.availableTo).toLocaleDateString()}</span>
                      </div>
                      {pkg.roadmap && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>{pkg.roadmap.totalSteps} steps</span>
                        </div>
                      )}
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}