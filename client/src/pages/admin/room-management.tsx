import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { Building2, Plus, Edit, Trash2, MapPin, Users, CheckCircle2, XCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from 'react-i18next';

interface Room {
  id: number;
  name: string;
  type: 'classroom' | 'lab' | 'office' | 'meeting' | 'other';
  capacity: number;
  location?: string;
  features?: string[];
  equipment?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function RoomManagement() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "classroom" as Room['type'],
    capacity: 20,
    location: "",
    equipment: "",
    description: "",
    isActive: true,
    features: [] as string[]
  });

  // Fetch rooms
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: (newRoom: typeof formData) => 
      apiRequest("/api/rooms", {
        method: "POST",
        body: JSON.stringify(newRoom),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: t('common:success'),
        description: t('admin:rooms.createdSuccessfully'),
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: error.message || t('admin:rooms.failedToCreate'),
        variant: "destructive",
      });
    },
  });

  // Update room mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: number } & typeof formData) =>
      apiRequest(`/api/rooms/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: t('common:success'),
        description: t('admin:rooms.updatedSuccessfully'),
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: error.message || t('admin:rooms.failedToUpdate'),
        variant: "destructive",
      });
    },
  });

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/rooms/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: t('common:success'),
        description: t('admin:rooms.deletedSuccessfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: error.message || t('admin:rooms.failedToDelete'),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "classroom",
      capacity: 20,
      location: "",
      equipment: "",
      description: "",
      isActive: true,
      features: []
    });
    setEditingRoom(null);
  };

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        location: room.location || "",
        equipment: Array.isArray(room.equipment) ? room.equipment.join(', ') : (room.equipment || ""),
        description: room.description || "",
        isActive: room.isActive,
        features: room.features || []
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Transform equipment string to array
    const equipmentArray = formData.equipment
      ? formData.equipment.split(',').map(item => item.trim()).filter(item => item)
      : [];
    
    const submitData = {
      ...formData,
      equipment: equipmentArray
    };
    
    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom.id, ...submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this room?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'classroom':
        return <Building2 className="h-4 w-4" />;
      case 'lab':
        return <Users className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'office':
        return <Building2 className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const availableFeatures = [
    "Projector",
    "Whiteboard",
    "Smart Board",
    "Air Conditioning",
    "Computer Lab",
    "Video Conference",
    "Audio System",
    "WiFi",
    "Printer",
    "Scanner"
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 sm:p-6 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Room Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage classrooms, labs, and meeting rooms
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Room</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rooms</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rooms.filter((r: Room) => r.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rooms.reduce((sum: number, r: Room) => sum + r.capacity, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Capacity</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rooms.length > 0 
                  ? Math.round(rooms.reduce((sum: number, r: Room) => sum + r.capacity, 0) / rooms.length)
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading rooms...</div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No rooms found. Add your first room to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room: Room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getRoomTypeIcon(room.type)}
                          {room.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{room.type}</Badge>
                      </TableCell>
                      <TableCell>{room.capacity} seats</TableCell>
                      <TableCell>{room.location || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {room.features?.slice(0, 3).map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {room.features && room.features.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{room.features.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={room.isActive ? "default" : "secondary"}>
                          {room.isActive ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(room)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(room.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </DialogTitle>
                <DialogDescription>
                  {editingRoom 
                    ? "Update the room details below"
                    : "Enter the details for the new room"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Room Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Room 101"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Room Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: Room['type']) => 
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classroom">Classroom</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                        <SelectItem value="meeting">Meeting Room</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Building A, Floor 2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Room Features</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableFeatures.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={feature}
                          checked={formData.features.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={feature} className="text-sm font-normal cursor-pointer">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment">Equipment</Label>
                  <Textarea
                    id="equipment"
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    placeholder="Enter equipment separated by commas (e.g., Projector, Whiteboard, Smart Board)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional notes about the room"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Room is active and available for booking</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRoom ? "Update Room" : "Create Room"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}