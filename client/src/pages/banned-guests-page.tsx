import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, AlertTriangle, RotateCcw, FileText, Camera, Calendar, User } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBannedGuestSchema, type BannedGuest, type InsertBannedGuest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const bannedGuestFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  idType: z.enum(["passport", "national_id", "driver_license", "other"]).optional(),
  banReason: z.string().min(1, "Ban reason is required"),
  policeIncidentNumber: z.string().optional(),
  incidentDate: z.string().optional(),
  incidentDescription: z.string().optional(),
  clubId: z.number().min(1, "Club selection is required"),
  status: z.enum(["banned_sl", "banned_lr", "revoked", "reinstated"]),
  revocationReason: z.string().optional(),
});

type BannedGuestFormData = z.infer<typeof bannedGuestFormSchema>;

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    banned_sl: "Banned (Short-term)",
    banned_lr: "Banned (Long-term)",
    revoked: "Ban Revoked",
    reinstated: "Reinstated",
  };
  return labels[status] || status;
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "banned_sl":
    case "banned_lr":
      return "destructive";
    case "revoked":
      return "secondary";
    case "reinstated":
      return "default";
    default:
      return "outline";
  }
};

const getIdTypeLabel = (idType: string) => {
  const labels: Record<string, string> = {
    passport: "Passport",
    national_id: "National ID",
    driver_license: "Driver's License",
    other: "Other",
  };
  return labels[idType] || idType;
};

export default function BannedGuestsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<BannedGuest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clubFilter, setClubFilter] = useState<string>("all");

  const { data: bannedGuests = [], isLoading } = useQuery<BannedGuest[]>({
    queryKey: ["/api/banned-guests"],
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ["/api/clubs"],
  });

  const form = useForm<BannedGuestFormData>({
    resolver: zodResolver(bannedGuestFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "",
      idNumber: "",
      idType: "national_id",
      banReason: "",
      policeIncidentNumber: "",
      incidentDate: "",
      incidentDescription: "",
      clubId: 0,
      status: "banned_sl",
      revocationReason: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BannedGuestFormData) => {
      const guestData = {
        ...data,
        bannedBy: user?.id,
        incidentDate: data.incidentDate ? new Date(data.incidentDate).toISOString() : undefined,
      };
      const response = await apiRequest("POST", "/api/banned-guests", guestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banned-guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Banned guest added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BannedGuestFormData> }) => {
      const updateData = {
        ...data,
        incidentDate: data.incidentDate ? new Date(data.incidentDate).toISOString() : undefined,
      };
      const response = await apiRequest("PATCH", `/api/banned-guests/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banned-guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      setEditingGuest(null);
      form.reset();
      toast({
        title: "Success",
        description: "Banned guest updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeBanMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest("PATCH", `/api/banned-guests/${id}`, {
        status: "revoked",
        revocationReason: reason,
        revokedBy: user?.id,
        revokedAt: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banned-guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Ban revoked successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BannedGuestFormData) => {
    if (editingGuest) {
      updateMutation.mutate({ id: editingGuest.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (guest: BannedGuest) => {
    setEditingGuest(guest);
    form.reset({
      firstName: guest.firstName,
      lastName: guest.lastName,
      dateOfBirth: guest.dateOfBirth || "",
      nationality: guest.nationality || "",
      idNumber: guest.idNumber || "",
      idType: (guest.idType as any) || "national_id",
      banReason: guest.banReason,
      policeIncidentNumber: guest.policeIncidentNumber || "",
      incidentDate: guest.incidentDate ? new Date(guest.incidentDate).toISOString().split('T')[0] : "",
      incidentDescription: guest.incidentDescription || "",
      clubId: guest.clubId,
      status: guest.status as any,
      revocationReason: guest.revocationReason || "",
    });
    setDialogOpen(true);
  };

  const handleRevokeBan = (guestId: number) => {
    const reason = window.prompt("Please provide a reason for revoking this ban:");
    if (reason) {
      revokeBanMutation.mutate({ id: guestId, reason });
    }
  };

  const canManageBans = user?.role === "super_admin" || user?.role === "admin" || 
                       user?.role === "club_manager" || user?.role === "security_teamleader";

  const filteredGuests = bannedGuests.filter(guest => {
    const matchesSearch = guest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.banReason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || guest.status === statusFilter;
    const matchesClub = clubFilter === "all" || guest.clubId.toString() === clubFilter;
    
    return matchesSearch && matchesStatus && matchesClub;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col lg:pl-64">
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)}
          title={t("banned_guests")}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Banned Guests Management</h1>
              <p className="text-muted-foreground mt-1">Track and manage banned individuals</p>
            </div>
            
            {canManageBans && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Ban
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingGuest ? "Edit Banned Guest" : "Add New Ban"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter first name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationality</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter nationality" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="idType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select ID type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="passport">Passport</SelectItem>
                                  <SelectItem value="national_id">National ID</SelectItem>
                                  <SelectItem value="driver_license">Driver's License</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="idNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter ID number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="clubId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Club</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select club" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {clubs.map((club: any) => (
                                    <SelectItem key={club.id} value={club.id.toString()}>
                                      {club.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ban Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="banned_sl">Banned (Short-term)</SelectItem>
                                  <SelectItem value="banned_lr">Banned (Long-term)</SelectItem>
                                  <SelectItem value="revoked">Ban Revoked</SelectItem>
                                  <SelectItem value="reinstated">Reinstated</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="banReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ban Reason</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the reason for the ban" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="policeIncidentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Police Incident Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter incident number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="incidentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Incident Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="incidentDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Incident Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed description of the incident" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {editingGuest && editingGuest.status === "revoked" && (
                        <FormField
                          control={form.control}
                          name="revocationReason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Revocation Reason</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Reason for revoking the ban" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setDialogOpen(false);
                            setEditingGuest(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          {editingGuest ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="flex space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search banned guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="banned_sl">Banned (Short-term)</SelectItem>
                <SelectItem value="banned_lr">Banned (Long-term)</SelectItem>
                <SelectItem value="revoked">Ban Revoked</SelectItem>
                <SelectItem value="reinstated">Reinstated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clubFilter} onValueChange={setClubFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs.map((club: any) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : filteredGuests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No banned guests found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" || clubFilter !== "all"
                    ? "No banned guests match your search criteria." 
                    : canManageBans 
                      ? "No banned guests recorded yet." 
                      : "No banned guests have been recorded."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Banned Guests ({filteredGuests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest Information</TableHead>
                      <TableHead>ID Details</TableHead>
                      <TableHead>Ban Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center">
                              <User className="w-4 h-4 mr-2 text-muted-foreground" />
                              {guest.firstName} {guest.lastName}
                            </div>
                            {guest.dateOfBirth && (
                              <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <Calendar className="w-3 h-3 mr-1" />
                                DOB: {new Date(guest.dateOfBirth).toLocaleDateString()}
                              </div>
                            )}
                            {guest.nationality && (
                              <div className="text-sm text-muted-foreground">
                                Nationality: {guest.nationality}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {guest.idType && guest.idNumber && (
                            <div>
                              <div className="text-sm font-medium">
                                {getIdTypeLabel(guest.idType)}
                              </div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {guest.idNumber}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium mb-1">
                              {guest.banReason}
                            </div>
                            {guest.incidentDate && (
                              <div className="text-sm text-muted-foreground">
                                Incident: {new Date(guest.incidentDate).toLocaleDateString()}
                              </div>
                            )}
                            {guest.policeIncidentNumber && (
                              <div className="text-sm text-muted-foreground">
                                Police #: {guest.policeIncidentNumber}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              Club ID: {guest.clubId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(guest.status)}>
                            {getStatusLabel(guest.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {canManageBans && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(guest)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {(guest.status === "banned_sl" || guest.status === "banned_lr") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokeBan(guest.id)}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
