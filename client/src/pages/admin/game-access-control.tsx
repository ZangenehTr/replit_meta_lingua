import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus, Edit, Users, BookOpen, Settings } from 'lucide-react';

export function GameAccessControl() {
  const { t } = useTranslation(['admin']);
  const { toast } = useToast();
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  // Fetch all games
  const { data: games = [] } = useQuery({
    queryKey: ['/api/admin/games']
  });

  // Fetch all students
  const { data: students = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const users = await apiRequest('/api/users');
      return users.filter((u: any) => u.role === 'Student');
    }
  });

  // Fetch all courses
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/admin/courses']
  });

  // Fetch access rules for selected game
  const { data: accessRules = [] } = useQuery({
    queryKey: ['/api/admin/games', selectedGame, 'access-rules'],
    enabled: !!selectedGame
  });

  // Fetch student assignments for selected student
  const { data: studentAssignments = [] } = useQuery({
    queryKey: ['/api/admin/students', selectedStudent, 'games'],
    enabled: !!selectedStudent
  });

  // Fetch course games for selected course
  const { data: courseGames = [] } = useQuery({
    queryKey: ['/api/admin/courses', selectedCourse, 'games'],
    enabled: !!selectedCourse
  });

  // Create access rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/admin/games/${selectedGame}/access-rules`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games', selectedGame, 'access-rules'] });
      toast({ title: t('admin:gameAccess.ruleCreated') });
    }
  });

  // Assign game to student mutation
  const assignToStudentMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/admin/students/${selectedStudent}/games`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/students', selectedStudent, 'games'] });
      toast({ title: t('admin:gameAccess.gameAssigned') });
    }
  });

  // Assign game to course mutation
  const assignToCourseMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/admin/courses/${selectedCourse}/games`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', selectedCourse, 'games'] });
      toast({ title: t('admin:gameAccess.gameAddedToCourse') });
    }
  });

  // Delete access rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/access-rules/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games', selectedGame, 'access-rules'] });
      toast({ title: t('admin:gameAccess.ruleDeleted') });
    }
  });

  // Remove student assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/game-assignments/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/students', selectedStudent, 'games'] });
      toast({ title: t('admin:gameAccess.assignmentRemoved') });
    }
  });

  // Remove course game mutation
  const removeCourseGameMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/course-games/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', selectedCourse, 'games'] });
      toast({ title: t('admin:gameAccess.gameRemovedFromCourse') });
    }
  });

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('admin:gameAccess.title', 'Game Access Control')}</h1>
        <p className="text-muted-foreground">{t('admin:gameAccess.description', 'Manage which students can access which games')}</p>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">
            <Settings className="mr-2 h-4 w-4" />
            {t('admin:gameAccess.accessRules', 'Access Rules')}
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="mr-2 h-4 w-4" />
            {t('admin:gameAccess.studentAssignments', 'Student Assignments')}
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="mr-2 h-4 w-4" />
            {t('admin:gameAccess.courseGames', 'Course Games')}
          </TabsTrigger>
        </TabsList>

        {/* Access Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:gameAccess.automaticRules', 'Automatic Access Rules')}</CardTitle>
              <CardDescription>
                {t('admin:gameAccess.rulesDescription', 'Define rules for automatic game visibility based on student properties')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('admin:gameAccess.selectGame', 'Select Game')}</Label>
                <Select value={selectedGame?.toString()} onValueChange={(v) => setSelectedGame(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin:gameAccess.chooseGame', 'Choose a game')} />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((game: any) => (
                      <SelectItem key={game.id} value={game.id.toString()}>
                        {game.gameName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedGame && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('admin:gameAccess.addRule', 'Add Access Rule')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('admin:gameAccess.newRule', 'New Access Rule')}</DialogTitle>
                      </DialogHeader>
                      <AccessRuleForm
                        onSubmit={(data) => createRuleMutation.mutate(data)}
                        isLoading={createRuleMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  <div className="space-y-2">
                    {accessRules.map((rule: any) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{rule.ruleName}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.ruleType} | 
                            {rule.minLevel && ` Level: ${rule.minLevel}-${rule.maxLevel}`}
                            {rule.minAge && ` Age: ${rule.minAge}-${rule.maxAge}`}
                            {rule.isDefault && ' (Default for all)'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Assignments Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:gameAccess.directAssignments', 'Direct Student Assignments')}</CardTitle>
              <CardDescription>
                {t('admin:gameAccess.assignDescription', 'Manually assign games to specific students')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('admin:gameAccess.selectStudent', 'Select Student')}</Label>
                <Select value={selectedStudent?.toString()} onValueChange={(v) => setSelectedStudent(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin:gameAccess.chooseStudent', 'Choose a student')} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student: any) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStudent && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('admin:gameAccess.assignGame', 'Assign Game')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('admin:gameAccess.assignGameTitle', 'Assign Game to Student')}</DialogTitle>
                      </DialogHeader>
                      <GameAssignmentForm
                        games={games}
                        onSubmit={(data) => assignToStudentMutation.mutate(data)}
                        isLoading={assignToStudentMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  <div className="space-y-2">
                    {studentAssignments.map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{assignment.game?.gameName}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.assignmentType} | 
                            {assignment.targetScore && ` Target: ${assignment.targetScore}`}
                            {assignment.isCompleted && ' ✓ Completed'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAssignmentMutation.mutate(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Course Games Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:gameAccess.courseGamesTitle', 'Course-Based Games')}</CardTitle>
              <CardDescription>
                {t('admin:gameAccess.courseGamesDescription', 'Associate games with courses for automatic access')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('admin:gameAccess.selectCourse', 'Select Course')}</Label>
                <Select value={selectedCourse?.toString()} onValueChange={(v) => setSelectedCourse(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin:gameAccess.chooseCourse', 'Choose a course')} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.courseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCourse && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('admin:gameAccess.addGameToCourse', 'Add Game to Course')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('admin:gameAccess.addGameToCourseTitle', 'Add Game to Course')}</DialogTitle>
                      </DialogHeader>
                      <CourseGameForm
                        games={games}
                        onSubmit={(data) => assignToCourseMutation.mutate(data)}
                        isLoading={assignToCourseMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  <div className="space-y-2">
                    {courseGames.map((courseGame: any) => (
                      <div key={courseGame.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{courseGame.game?.gameName}</p>
                          <p className="text-sm text-muted-foreground">
                            {courseGame.isRequired ? 'Required' : 'Optional'} | 
                            {courseGame.weekNumber && ` Week ${courseGame.weekNumber}`}
                            {courseGame.minScoreRequired && ` Min Score: ${courseGame.minScoreRequired}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCourseGameMutation.mutate(courseGame.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Access Rule Form Component
function AccessRuleForm({ onSubmit, isLoading }: any) {
  const { t } = useTranslation(['admin']);
  const [formData, setFormData] = useState({
    ruleName: '',
    ruleType: 'level',
    minLevel: '',
    maxLevel: '',
    minAge: '',
    maxAge: '',
    isDefault: false,
    requiresUnlock: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      minAge: formData.minAge ? Number(formData.minAge) : null,
      maxAge: formData.maxAge ? Number(formData.maxAge) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{t('admin:gameAccess.ruleName', 'Rule Name')}</Label>
        <Input
          value={formData.ruleName}
          onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>{t('admin:gameAccess.ruleType', 'Rule Type')}</Label>
        <Select value={formData.ruleType} onValueChange={(v) => setFormData({ ...formData, ruleType: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="level">Level-based</SelectItem>
            <SelectItem value="age">Age-based</SelectItem>
            <SelectItem value="all">All Students</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.ruleType === 'level' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t('admin:gameAccess.minLevel', 'Min Level')}</Label>
            <Select value={formData.minLevel} onValueChange={(v) => setFormData({ ...formData, minLevel: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('admin:gameAccess.maxLevel', 'Max Level')}</Label>
            <Select value={formData.maxLevel} onValueChange={(v) => setFormData({ ...formData, maxLevel: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {formData.ruleType === 'age' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t('admin:gameAccess.minAge', 'Min Age')}</Label>
            <Input
              type="number"
              value={formData.minAge}
              onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('admin:gameAccess.maxAge', 'Max Age')}</Label>
            <Input
              type="number"
              value={formData.maxAge}
              onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
        />
        <Label>{t('admin:gameAccess.defaultForAll', 'Show to all students by default')}</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.requiresUnlock}
          onCheckedChange={(checked) => setFormData({ ...formData, requiresUnlock: checked })}
        />
        <Label>{t('admin:gameAccess.requiresUnlock', 'Requires unlock through progress')}</Label>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? t('admin:saving', 'Saving...') : t('admin:save', 'Save')}
      </Button>
    </form>
  );
}

// Game Assignment Form Component
function GameAssignmentForm({ games, onSubmit, isLoading }: any) {
  const { t } = useTranslation(['admin']);
  const [formData, setFormData] = useState({
    gameId: '',
    assignmentType: 'optional',
    targetScore: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      gameId: Number(formData.gameId),
      targetScore: formData.targetScore ? Number(formData.targetScore) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{t('admin:gameAccess.game', 'Game')}</Label>
        <Select value={formData.gameId} onValueChange={(v) => setFormData({ ...formData, gameId: v })}>
          <SelectTrigger>
            <SelectValue placeholder={t('admin:gameAccess.selectGame', 'Select a game')} />
          </SelectTrigger>
          <SelectContent>
            {games.map((game: any) => (
              <SelectItem key={game.id} value={game.id.toString()}>
                {game.gameName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t('admin:gameAccess.assignmentType', 'Assignment Type')}</Label>
        <Select value={formData.assignmentType} onValueChange={(v) => setFormData({ ...formData, assignmentType: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="required">Required</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
            <SelectItem value="practice">Practice</SelectItem>
            <SelectItem value="homework">Homework</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t('admin:gameAccess.targetScore', 'Target Score (optional)')}</Label>
        <Input
          type="number"
          value={formData.targetScore}
          onChange={(e) => setFormData({ ...formData, targetScore: e.target.value })}
        />
      </div>

      <div>
        <Label>{t('admin:gameAccess.notes', 'Notes (optional)')}</Label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? t('admin:assigning', 'Assigning...') : t('admin:assign', 'Assign')}
      </Button>
    </form>
  );
}

// Course Game Form Component
function CourseGameForm({ games, onSubmit, isLoading }: any) {
  const { t } = useTranslation(['admin']);
  const [formData, setFormData] = useState({
    gameId: '',
    isRequired: false,
    weekNumber: '',
    minScoreRequired: '',
    orderIndex: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      gameId: Number(formData.gameId),
      weekNumber: formData.weekNumber ? Number(formData.weekNumber) : null,
      minScoreRequired: formData.minScoreRequired ? Number(formData.minScoreRequired) : null,
      orderIndex: formData.orderIndex ? Number(formData.orderIndex) : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{t('admin:gameAccess.game', 'Game')}</Label>
        <Select value={formData.gameId} onValueChange={(v) => setFormData({ ...formData, gameId: v })}>
          <SelectTrigger>
            <SelectValue placeholder={t('admin:gameAccess.selectGame', 'Select a game')} />
          </SelectTrigger>
          <SelectContent>
            {games.map((game: any) => (
              <SelectItem key={game.id} value={game.id.toString()}>
                {game.gameName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isRequired}
          onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
        />
        <Label>{t('admin:gameAccess.requiredGame', 'Required for course completion')}</Label>
      </div>

      <div>
        <Label>{t('admin:gameAccess.weekNumber', 'Week Number (optional)')}</Label>
        <Input
          type="number"
          value={formData.weekNumber}
          onChange={(e) => setFormData({ ...formData, weekNumber: e.target.value })}
        />
      </div>

      <div>
        <Label>{t('admin:gameAccess.minScore', 'Minimum Score Required (optional)')}</Label>
        <Input
          type="number"
          value={formData.minScoreRequired}
          onChange={(e) => setFormData({ ...formData, minScoreRequired: e.target.value })}
        />
      </div>

      <div>
        <Label>{t('admin:gameAccess.displayOrder', 'Display Order (optional)')}</Label>
        <Input
          type="number"
          value={formData.orderIndex}
          onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? t('admin:adding', 'Adding...') : t('admin:add', 'Add')}
      </Button>
    </form>
  );
}