import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Key, Building2, Calendar, Users, Shield, Copy, Check, AlertTriangle } from "lucide-react";

const licenseGenerationSchema = z.object({
  licenseeOrganization: z.string().min(1, "Organization name is required"),
  licenseType: z.enum(["starter", "professional", "enterprise"]),
  maxClubs: z.number().min(1, "Must allow at least 1 club"),
  maxUsers: z.number().min(1, "Must allow at least 1 user"),
  expirationDate: z.string().min(1, "Expiration date is required"),
  features: z.array(z.string()).min(1, "At least one feature must be selected"),
});

type LicenseGenerationData = z.infer<typeof licenseGenerationSchema>;

interface License {
  id: number;
  organization: string;
  licenseKey: string;
  licenseType: string;
  maxClubs: number;
  maxUsers: number;
  expirationDate: string;
  isActive: boolean;
  features: string[];
  createdAt: string;
}

const availableFeatures = [
  { id: "ban_management", name: "Ban Management" },
  { id: "guestlist_management", name: "Guestlist Management" },
  { id: "real_time_chat", name: "Real-time Chat" },
  { id: "advanced_reporting", name: "Advanced Reporting" },
  { id: "whitelabel_support", name: "Whitelabel Support" },
  { id: "api_access", name: "API Access" },
  { id: "mobile_app", name: "Mobile App" },
  { id: "id_scanning", name: "ID Scanning" },
  { id: "biometric_auth", name: "Biometric Authentication" },
  { id: "offline_mode", name: "Offline Mode" },
];

export default function LicensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [copiedLicense, setCopiedLicense] = useState<string | null>(null);

  const form = useForm<LicenseGenerationData>({
    resolver: zodResolver(licenseGenerationSchema),
    defaultValues: {
      licenseeOrganization: "",
      licenseType: "professional",
      maxClubs: 5,
      maxUsers: 50,
      expirationDate: "",
      features: ["ban_management", "guestlist_management"],
    },
  });

  const { data: licenses = [] } = useQuery<License[]>({
    queryKey: ["/api/platform/licenses"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/platform/licenses");
      return res.json();
    },
  });

  const generateLicenseMutation = useMutation({
    mutationFn: async (data: LicenseGenerationData) => {
      const res = await apiRequest("POST", "/api/platform/licenses/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "License Generated",
        description: `License key: ${data.licenseKey}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform/licenses"] });
      setIsGenerateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeLicenseMutation = useMutation({
    mutationFn: async (licenseId: number) => {
      const res = await apiRequest("POST", `/api/platform/licenses/${licenseId}/revoke`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "License Revoked",
        description: "License has been revoked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform/licenses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Revocation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LicenseGenerationData) => {
    generateLicenseMutation.mutate(data);
  };

  const copyLicenseKey = async (licenseKey: string) => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopiedLicense(licenseKey);
      setTimeout(() => setCopiedLicense(null), 2000);
      toast({
        title: "Copied",
        description: "License key copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy license key",
        variant: "destructive",
      });
    }
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case "starter":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "professional":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "enterprise":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (isActive: boolean, expirationDate: string) => {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (!isActive) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    } else if (daysUntilExpiry < 0) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    } else if (daysUntilExpiry < 30) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    } else {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  const getStatusText = (isActive: boolean, expirationDate: string) => {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (!isActive) {
      return "Revoked";
    } else if (daysUntilExpiry < 0) {
      return "Expired";
    } else if (daysUntilExpiry < 30) {
      return `Expires in ${daysUntilExpiry} days`;
    } else {
      return "Active";
    }
  };

  if (!user || user.role !== "super_admin") {
    return null;
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
          title="License Management"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">License Management</h1>
                <p className="text-muted-foreground mt-1">Manage organization licenses and access control</p>
              </div>
              
              <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate License
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Generate New License</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="licenseeOrganization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter organization name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="licenseType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select license type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="starter">Starter</SelectItem>
                                  <SelectItem value="professional">Professional</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="maxClubs"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Clubs</FormLabel>
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
                          control={form.control}
                          name="maxUsers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Users</FormLabel>
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
                          control={form.control}
                          name="expirationDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiration Date</FormLabel>
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
                        name="features"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Included Features</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {availableFeatures.map((feature) => (
                                <div key={feature.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={feature.id}
                                    checked={field.value.includes(feature.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        field.onChange([...field.value, feature.id]);
                                      } else {
                                        field.onChange(field.value.filter((f) => f !== feature.id));
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                  <label htmlFor={feature.id} className="text-sm">
                                    {feature.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsGenerateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={generateLicenseMutation.isPending}>
                          {generateLicenseMutation.isPending ? "Generating..." : "Generate License"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Licenses</p>
                      <p className="text-2xl font-bold">{licenses.length}</p>
                    </div>
                    <Key className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Licenses</p>
                      <p className="text-2xl font-bold text-green-600">
                        {licenses.filter(l => l.isActive && new Date(l.expirationDate) > new Date()).length}
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {licenses.filter(l => {
                          const expiry = new Date(l.expirationDate);
                          const now = new Date();
                          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return l.isActive && daysUntilExpiry > 0 && daysUntilExpiry < 30;
                        }).length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Organizations</p>
                      <p className="text-2xl font-bold">
                        {new Set(licenses.map(l => l.organization)).size}
                      </p>
                    </div>
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>License Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>License Key</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Limits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((license) => (
                      <TableRow key={license.id}>
                        <TableCell className="font-medium">{license.organization}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {license.licenseKey}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyLicenseKey(license.licenseKey)}
                            >
                              {copiedLicense === license.licenseKey ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getLicenseTypeColor(license.licenseType)}>
                            {license.licenseType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{license.maxClubs} clubs</div>
                            <div>{license.maxUsers} users</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(license.isActive, license.expirationDate)}>
                            {getStatusText(license.isActive, license.expirationDate)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(license.expirationDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {license.isActive && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => revokeLicenseMutation.mutate(license.id)}
                              disabled={revokeLicenseMutation.isPending}
                            >
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}