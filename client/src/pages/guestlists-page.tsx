import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Users, Calendar, CheckCircle, XCircle, Clock, Mail, MessageSquare, QrCode, Download, RefreshCw, MoreHorizontal } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGuestlistSchema, insertGuestlistEntrySchema, type Guestlist, type GuestlistEntry, type InsertGuestlist, type InsertGuestlistEntry } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const guestlistFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  eventDate: z.string().min(1, "Event date is required"),
  description: z.string().optional(),
  maxGuests: z.number().min(1, "Max guests must be at least 1"),
  clubId: z.number().min(1, "Club selection is required"),
  isActive: z.boolean(),
});

const guestEntryFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
  guestCount: z.number().min(1, "Guest count must be at least 1").max(10, "Maximum 10 guests"),
  comments: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "checked_in", "no_show", "revoked"]),
});

type GuestlistFormData = {
  name: string;
  eventDate: string;
  description?: string;
  maxGuests: number;
  clubId: number;
  isActive: boolean;
};

type GuestEntryFormData = z.infer<typeof guestEntryFormSchema>;

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    checked_in: "Checked In",
    no_show: "No Show",
    revoked: "Revoked",
  };
  return labels[status] || status;
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "approved":
    case "checked_in":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
    case "revoked":
    case "no_show":
      return "destructive";
    default:
      return "outline";
  }
};

export default function GuestlistsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [editingGuestlist, setEditingGuestlist] = useState<Guestlist | null>(null);
  const [selectedGuestlist, setSelectedGuestlist] = useState<Guestlist | null>(null);
  const [editingGuest, setEditingGuest] = useState<GuestlistEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [selectedEntries, setSelectedEntries] = useState<number[]>([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bookmetenderDialogOpen, setBookmetenderDialogOpen] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const { data: guestlists = [], isLoading } = useQuery<Guestlist[]>({
    queryKey: ["/api/guestlists"],
  });

  const { data: guestlistEntries = [], isLoading: entriesLoading } = useQuery<GuestlistEntry[]>({
    queryKey: ["/api/guestlists", selectedGuestlist?.id, "entries"],
    enabled: !!selectedGuestlist,
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ["/api/clubs"],
  });

  const guestlistForm = useForm<GuestlistFormData>({
    resolver: zodResolver(guestlistFormSchema),
    defaultValues: {
      name: "",
      eventDate: "",
      description: "",
      maxGuests: 100,
      clubId: 0,
      isActive: true,
    },
  });

  const guestForm = useForm<GuestEntryFormData>({
    resolver: zodResolver(guestEntryFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      guestCount: 1,
      comments: "",
      status: "pending",
    },
  });

  const createGuestlistMutation = useMutation({
    mutationFn: async (data: GuestlistFormData) => {
      const guestlistData = {
        ...data,
        createdBy: user?.id,
      };
      const response = await apiRequest("POST", "/api/guestlists", guestlistData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
      guestlistForm.reset();
      toast({
        title: "Success",
        description: "Guestlist created successfully",
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

  const updateGuestlistMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GuestlistFormData> }) => {
      const updateData = {
        ...data,
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString() : undefined,
      };
      const response = await apiRequest("PATCH", `/api/guestlists/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestlists"] });
      setDialogOpen(false);
      setEditingGuestlist(null);
      guestlistForm.reset();
      toast({
        title: "Success",
        description: "Guestlist updated successfully",
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

  const deleteGuestlistMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/guestlists/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setSelectedGuestlist(null);
      toast({
        title: "Success",
        description: "Guestlist deleted successfully",
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

  const createGuestMutation = useMutation({
    mutationFn: async (data: GuestEntryFormData) => {
      const guestData = {
        ...data,
        guestlistId: selectedGuestlist?.id,
      };
      const response = await apiRequest("POST", `/api/guestlists/${selectedGuestlist?.id}/entries`, guestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestlists", selectedGuestlist?.id, "entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setGuestDialogOpen(false);
      guestForm.reset();
      toast({
        title: "Success",
        description: "Guest added successfully",
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

  const updateGuestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GuestEntryFormData> }) => {
      const response = await apiRequest("PATCH", `/api/guestlist-entries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestlist-entries", selectedGuestlist?.id] });
      setGuestDialogOpen(false);
      setEditingGuest(null);
      guestForm.reset();
      toast({
        title: "Success",
        description: "Guest updated successfully",
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

  const checkInGuestMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("POST", `/api/guestlist-entries/${entryId}/checkin`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestlist-entries", selectedGuestlist?.id] });
      toast({
        title: "Success",
        description: "Guest checked in successfully",
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

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, entryIds }: { action: string; entryIds: number[] }) => {
      const response = await apiRequest("POST", `/api/guestlists/${selectedGuestlist?.id}/bulk-actions`, {
        action,
        entryIds
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestlist-entries", selectedGuestlist?.id] });
      setSelectedEntries([]);
      setBulkActionDialogOpen(false);
      toast({
        title: "Success",
        description: `Bulk action completed for ${data.processed} guests`,
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

  const bookmetenderSyncMutation = useMutation({
    mutationFn: async ({ apiKey, eventId }: { apiKey: string; eventId: string }) => {
      const response = await apiRequest("POST", "/api/bookmetender/sync", {
        apiKey,
        clubId: selectedGuestlist?.clubId || clubs[0]?.id,
        eventId
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/guestlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guestlist-entries", selectedGuestlist?.id] });
      setBookmetenderDialogOpen(false);
      toast({
        title: "Success",
        description: `Synced ${data.syncedGuests} guests from Bookmetender`,
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

  const { data: qrCodeData } = useQuery({
    queryKey: ["/api/guestlists", selectedGuestlist?.id, "qr-code"],
    enabled: !!selectedGuestlist && qrCodeDialogOpen,
  });

  const { data: exportData } = useQuery({
    queryKey: ["/api/guestlists", selectedGuestlist?.id, "export"],
    enabled: !!selectedGuestlist && exportDialogOpen,
  });

  const onGuestlistSubmit = (data: GuestlistFormData) => {
    if (editingGuestlist) {
      updateGuestlistMutation.mutate({ id: editingGuestlist.id, data });
    } else {
      createGuestlistMutation.mutate(data);
    }
  };

  const onGuestSubmit = (data: GuestEntryFormData) => {
    if (editingGuest) {
      updateGuestMutation.mutate({ id: editingGuest.id, data });
    } else {
      createGuestMutation.mutate(data);
    }
  };

  const handleEditGuestlist = (guestlist: Guestlist) => {
    setEditingGuestlist(guestlist);
    guestlistForm.reset({
      name: guestlist.name,
      eventDate: new Date(guestlist.eventDate).toISOString().split('T')[0],
      description: guestlist.description || "",
      maxGuests: guestlist.maxGuests || 100,
      clubId: guestlist.clubId,
      isActive: guestlist.isActive,
    });
    setDialogOpen(true);
  };

  const handleEditGuest = (guest: GuestlistEntry) => {
    setEditingGuest(guest);
    guestForm.reset({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || "",
      phone: guest.phone || "",
      guestCount: guest.guestCount,
      comments: guest.comments || "",
      status: guest.status as any,
    });
    setGuestDialogOpen(true);
  };

  const handleCheckIn = (entryId: number) => {
    if (window.confirm("Check in this guest?")) {
      checkInGuestMutation.mutate(entryId);
    }
  };

  const canManageGuestlists = user?.role === "super_admin" || user?.role === "admin" || 
                             user?.role === "club_manager" || user?.role === "security_teamleader";

  const filteredGuestlists = guestlists.filter(guestlist => {
    const matchesSearch = guestlist.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClub = clubFilter === "all" || guestlist.clubId.toString() === clubFilter;
    return matchesSearch && matchesClub;
  });

  const filteredEntries = guestlistEntries.filter(entry => {
    const matchesSearch = `${entry.firstName} ${entry.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (selectedGuestlist) {
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
            title={selectedGuestlist.name}
          />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedGuestlist(null)}
                  >
                    ← Back to Guestlists
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{selectedGuestlist.name}</h1>
                    <p className="text-muted-foreground mt-1">
                      {new Date(selectedGuestlist.eventDate).toLocaleDateString()} • 
                      {guestlistEntries.length}/{selectedGuestlist.maxGuests || "∞"} guests
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {canManageGuestlists && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setQrCodeDialogOpen(true)}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Code
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setExportDialogOpen(true)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setBookmetenderDialogOpen(true)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Bookmetender
                    </Button>
                  </>
                )}
                {canManageGuestlists && (
                  <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Guest
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingGuest ? "Edit Guest" : "Add Guest to List"}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <Form {...guestForm}>
                      <form onSubmit={guestForm.handleSubmit(onGuestSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={guestForm.control}
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
                            control={guestForm.control}
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
                        
                        <FormField
                          control={guestForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter email" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={guestForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={guestForm.control}
                            name="guestCount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Guest Count</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="10"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={guestForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="checked_in">Checked In</SelectItem>
                                    <SelectItem value="no_show">No Show</SelectItem>
                                    <SelectItem value="revoked">Revoked</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={guestForm.control}
                          name="comments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Comments</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Additional comments" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setGuestDialogOpen(false);
                              setEditingGuest(null);
                              guestForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createGuestMutation.isPending || updateGuestMutation.isPending}
                          >
                            {editingGuest ? "Update" : "Add"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
              </div>
            </div>

            <div className="flex space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search guests..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedEntries.length > 0 && canManageGuestlists && (
                <Button
                  variant="outline"
                  onClick={() => setBulkActionDialogOpen(true)}
                >
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  Bulk Actions ({selectedEntries.length})
                </Button>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Guest Entries ({filteredEntries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEntries(filteredEntries.map(entry => entry.id));
                            } else {
                              setSelectedEntries([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Guest Information</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Plus Ones</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEntries.includes(entry.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedEntries([...selectedEntries, entry.id]);
                              } else {
                                setSelectedEntries(selectedEntries.filter(id => id !== entry.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.firstName} {entry.lastName}</div>
                            {entry.comments && (
                              <div className="text-sm text-muted-foreground">{entry.comments}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {entry.email && (
                              <div className="text-sm flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {entry.email}
                              </div>
                            )}
                            {entry.phone && (
                              <div className="text-sm text-muted-foreground">{entry.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">+{entry.guestCount - 1}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(entry.status)}>
                            {getStatusLabel(entry.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {canManageGuestlists && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditGuest(entry)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {entry.status === "approved" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCheckIn(entry.id)}
                                  >
                                    <CheckCircle className="w-4 h-4" />
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

            {/* Bulk Actions Dialog */}
            <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Bulk Actions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Apply action to {selectedEntries.length} selected guests
                  </p>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => bulkActionMutation.mutate({ action: "approve", entryIds: selectedEntries })}
                      disabled={bulkActionMutation.isPending}
                    >
                      Approve All
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => bulkActionMutation.mutate({ action: "reject", entryIds: selectedEntries })}
                      disabled={bulkActionMutation.isPending}
                    >
                      Reject All
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => bulkActionMutation.mutate({ action: "checkin", entryIds: selectedEntries })}
                      disabled={bulkActionMutation.isPending}
                    >
                      Check In All
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* QR Code Dialog */}
            <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Guestlist QR Code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <QrCode size={200} className="text-black" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Scan this code to access the guestlist on mobile devices
                  </p>
                  {qrCodeData && (
                    <div className="text-xs text-muted-foreground break-all">
                      {qrCodeData.qrCode}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Export Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Export Guestlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Export guestlist data and entries
                  </p>
                  {exportData && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Guestlist:</strong> {exportData.guestlist?.name}
                      </div>
                      <div className="text-sm">
                        <strong>Entries:</strong> {exportData.entries?.length || 0}
                      </div>
                      <div className="text-sm">
                        <strong>Exported:</strong> {new Date(exportData.exportedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (exportData) {
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `guestlist-${selectedGuestlist?.name}-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Bookmetender Sync Dialog */}
            <Dialog open={bookmetenderDialogOpen} onOpenChange={setBookmetenderDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Sync with Bookmetender</DialogTitle>
                </DialogHeader>
                <Form {...useForm({
                  defaultValues: {
                    apiKey: '',
                    eventId: ''
                  }
                })}>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const apiKey = formData.get('apiKey') as string;
                    const eventId = formData.get('eventId') as string;
                    bookmetenderSyncMutation.mutate({ apiKey, eventId });
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API Key</label>
                      <Input
                        name="apiKey"
                        placeholder="bmt_xxxxxxxxxxxxxxxx"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Event ID</label>
                      <Input
                        name="eventId"
                        placeholder="evt_123"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={bookmetenderSyncMutation.isPending}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Guests
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    );
  }

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
          title={t("guestlists")}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Guestlists Management</h1>
              <p className="text-muted-foreground mt-1">Manage event guestlists and approvals</p>
            </div>
            
            {canManageGuestlists && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Guestlist
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingGuestlist ? "Edit Guestlist" : "Create New Guestlist"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...guestlistForm}>
                    <form onSubmit={guestlistForm.handleSubmit(onGuestlistSubmit)} className="space-y-4">
                      <FormField
                        control={guestlistForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter event name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={guestlistForm.control}
                        name="eventDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Date</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={guestlistForm.control}
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
                        control={guestlistForm.control}
                        name="maxGuests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Guests</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={guestlistForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Event description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setDialogOpen(false);
                            setEditingGuestlist(null);
                            guestlistForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createGuestlistMutation.isPending || updateGuestlistMutation.isPending}
                        >
                          {editingGuestlist ? "Update" : "Create"}
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
                placeholder="Search guestlists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredGuestlists.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No guestlists found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || clubFilter !== "all"
                    ? "No guestlists match your search criteria." 
                    : canManageGuestlists 
                      ? "Get started by creating your first event guestlist." 
                      : "No event guestlists have been created yet."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuestlists.map((guestlist) => (
                <Card key={guestlist.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{guestlist.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={guestlist.isActive ? "default" : "secondary"}>
                            {guestlist.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      {canManageGuestlists && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGuestlist(guestlist)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedGuestlist(guestlist)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(guestlist.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Capacity: {guestlist.maxGuests || "Unlimited"}
                        </span>
                      </div>
                      
                      {guestlist.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {guestlist.description}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGuestlist(guestlist);
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Manage Guests
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {canManageGuestlists && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditGuestlist(guestlist);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Are you sure you want to delete this guestlist?")) {
                                    deleteGuestlistMutation.mutate(guestlist.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
