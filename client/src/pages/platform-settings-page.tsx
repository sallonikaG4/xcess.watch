import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Settings, Server, Mail, Globe, Key, Palette, Database, Shield, Users, Building, Package } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const platformSettingsSchema = z.object({
  // General Settings
  platformName: z.string().min(1, "Platform name is required"),
  platformDescription: z.string().optional(),
  supportEmail: z.string().email("Valid email is required"),
  supportPhone: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
  
  // SMTP Settings
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean(),
  smtpFromEmail: z.string().email().optional(),
  smtpFromName: z.string().optional(),
  
  // Security Settings
  sessionTimeout: z.number().min(5, "Minimum 5 minutes"),
  passwordMinLength: z.number().min(6, "Minimum 6 characters"),
  passwordRequireSpecial: z.boolean(),
  passwordRequireNumbers: z.boolean(),
  passwordRequireUppercase: z.boolean(),
  maxLoginAttempts: z.number().min(3, "Minimum 3 attempts"),
  
  // Feature Flags
  enableGuestInvites: z.boolean(),
  enableSMSNotifications: z.boolean(),
  enableRealTimeChat: z.boolean(),
  enableOfflineMode: z.boolean(),
  enableBiometricLogin: z.boolean(),
  
  // Branding
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  darkModeEnabled: z.boolean(),
  customCSS: z.string().optional(),
  
  // Database Settings
  backupEnabled: z.boolean(),
  backupFrequency: z.string(),
  dataRetentionDays: z.number().min(30, "Minimum 30 days"),
  maintenanceMode: z.boolean(),
});

const licenseGenerationSchema = z.object({
  licenseeOrganization: z.string().min(1, "Organization name is required"),
  licenseType: z.string().min(1, "License type is required"),
  maxClubs: z.number().min(1, "Must allow at least 1 club"),
  maxUsers: z.number().min(1, "Must allow at least 1 user"),
  expirationDate: z.string().min(1, "Expiration date is required"),
  features: z.array(z.string()),
});

type PlatformSettingsData = z.infer<typeof platformSettingsSchema>;
type LicenseGenerationData = z.infer<typeof licenseGenerationSchema>;

const timezoneOptions = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles", 
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney"
];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
];

const licenseFeatures = [
  "ban_management",
  "guestlist_management", 
  "real_time_chat",
  "email_notifications",
  "sms_notifications",
  "id_scanning",
  "offline_mode",
  "advanced_reporting",
  "api_access",
  "whitelabel_support"
];

export default function PlatformSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [generatedLicense, setGeneratedLicense] = useState<string | null>(null);

  const { data: platformSettings, isLoading } = useQuery({
    queryKey: ["/api/platform/settings"],
    enabled: user?.role === "super_admin",
  });

  const { data: licenses = [], isLoading: licensesLoading } = useQuery({
    queryKey: ["/api/platform/licenses"],
    enabled: user?.role === "super_admin",
  });

  const settingsForm = useForm<PlatformSettingsData>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      platformName: "XESS Security Platform",
      platformDescription: "Comprehensive club security management system",
      supportEmail: "support@xess.watch",
      timezone: "UTC",
      language: "en",
      smtpSecure: true,
      sessionTimeout: 60,
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      maxLoginAttempts: 5,
      enableGuestInvites: true,
      enableSMSNotifications: false,
      enableRealTimeChat: true,
      enableOfflineMode: false,
      enableBiometricLogin: false,
      darkModeEnabled: true,
      backupEnabled: true,
      backupFrequency: "daily",
      dataRetentionDays: 365,
      maintenanceMode: false,
    },
  });

  const licenseForm = useForm<LicenseGenerationData>({
    resolver: zodResolver(licenseGenerationSchema),
    defaultValues: {
      licenseeOrganization: "",
      licenseType: "standard",
      maxClubs: 5,
      maxUsers: 50,
      expirationDate: "",
      features: ["ban_management", "guestlist_management"],
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: PlatformSettingsData) => {
      const response = await apiRequest("POST", "/api/platform/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/settings"] });
      toast({
        title: "Success",
        description: "Platform settings updated successfully",
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

  const generateLicenseMutation = useMutation({
    mutationFn: async (data: LicenseGenerationData) => {
      const response = await apiRequest("POST", "/api/platform/licenses/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedLicense(data.licenseKey);
      queryClient.invalidateQueries({ queryKey: ["/api/platform/licenses"] });
      licenseForm.reset();
      toast({
        title: "Success",
        description: "License generated successfully",
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

  const onSettingsSubmit = (data: PlatformSettingsData) => {
    updateSettingsMutation.mutate(data);
  };

  const onLicenseSubmit = (data: LicenseGenerationData) => {
    generateLicenseMutation.mutate(data);
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col lg:pl-64">
          <Topbar 
            onMenuClick={() => setSidebarOpen(true)}
            title="Platform Settings"
          />
          <main className="flex-1 overflow-y-auto p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Access Denied
                </h3>
                <p className="text-muted-foreground">
                  Only Super Administrators can access platform settings.
                </p>
              </CardContent>
            </Card>
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
          title="Platform Settings"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
              <p className="text-muted-foreground mt-1">
                Configure global platform settings, licenses, and system preferences
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="email">Email/SMTP</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="licenses">Licenses</TabsTrigger>
              </TabsList>

              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}>
                  <TabsContent value="general">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Settings className="w-5 h-5" />
                          <span>General Platform Settings</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={settingsForm.control}
                            name="platformName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Platform Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="XESS Security Platform" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="supportEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Support Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="support@xess.watch" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="timezone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Default Timezone</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {timezoneOptions.map((tz) => (
                                      <SelectItem key={tz} value={tz}>
                                        {tz}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Default Language</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {languageOptions.map((lang) => (
                                      <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={settingsForm.control}
                          name="platformDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your platform..."
                                  rows={3}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex items-center space-x-4">
                          <FormField
                            control={settingsForm.control}
                            name="maintenanceMode"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Maintenance Mode</FormLabel>
                                  <FormDescription>
                                    Enable to prevent user access during updates
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button type="submit" disabled={updateSettingsMutation.isPending}>
                          <Settings className="w-4 h-4 mr-2" />
                          Save General Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="email">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Mail className="w-5 h-5" />
                          <span>Email & SMTP Configuration</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={settingsForm.control}
                            name="smtpHost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Host</FormLabel>
                                <FormControl>
                                  <Input placeholder="smtp.gmail.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="smtpPort"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Port</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    placeholder="587"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="smtpUsername"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="your-email@domain.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="smtpPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="smtpFromEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="noreply@xess.watch" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="smtpFromName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>From Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="XESS Security" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={settingsForm.control}
                          name="smtpSecure"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Secure Connection (SSL/TLS)</FormLabel>
                                <FormDescription>
                                  Enable secure SMTP connection
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" disabled={updateSettingsMutation.isPending}>
                          <Mail className="w-4 h-4 mr-2" />
                          Save SMTP Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="security">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Shield className="w-5 h-5" />
                          <span>Security & Authentication</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={settingsForm.control}
                            name="sessionTimeout"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Session Timeout (minutes)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="5"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="passwordMinLength"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum Password Length</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="6"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 8)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="maxLoginAttempts"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Login Attempts</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="3"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-medium">Password Requirements</h4>
                          
                          <FormField
                            control={settingsForm.control}
                            name="passwordRequireUppercase"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Require Uppercase Letters</FormLabel>
                                  <FormDescription>
                                    Passwords must contain at least one uppercase letter
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="passwordRequireNumbers"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Require Numbers</FormLabel>
                                  <FormDescription>
                                    Passwords must contain at least one number
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="passwordRequireSpecial"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Require Special Characters</FormLabel>
                                  <FormDescription>
                                    Passwords must contain at least one special character
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button type="submit" disabled={updateSettingsMutation.isPending}>
                          <Shield className="w-4 h-4 mr-2" />
                          Save Security Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="features">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Package className="w-5 h-5" />
                          <span>Feature Management</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <FormField
                            control={settingsForm.control}
                            name="enableGuestInvites"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Guest Invitations</FormLabel>
                                  <FormDescription>
                                    Allow email and SMS guest invitations
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="enableSMSNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">SMS Notifications</FormLabel>
                                  <FormDescription>
                                    Enable SMS notifications system-wide
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="enableRealTimeChat"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Real-time Chat</FormLabel>
                                  <FormDescription>
                                    Enable real-time communication between staff
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="enableOfflineMode"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Offline Mode</FormLabel>
                                  <FormDescription>
                                    Allow offline functionality with sync
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="enableBiometricLogin"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Biometric Login</FormLabel>
                                  <FormDescription>
                                    Enable fingerprint and face ID authentication
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={settingsForm.control}
                            name="backupFrequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Backup Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="hourly">Hourly</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="dataRetentionDays"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data Retention (days)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="30"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 365)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button type="submit" disabled={updateSettingsMutation.isPending}>
                          <Package className="w-4 h-4 mr-2" />
                          Save Feature Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="branding">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Palette className="w-5 h-5" />
                          <span>Branding & Theme</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={settingsForm.control}
                            name="logoUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Logo URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com/logo.png" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="primaryColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Primary Color</FormLabel>
                                <FormControl>
                                  <Input placeholder="#3b82f6" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="secondaryColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Secondary Color</FormLabel>
                                <FormControl>
                                  <Input placeholder="#64748b" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={settingsForm.control}
                            name="accentColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Accent Color</FormLabel>
                                <FormControl>
                                  <Input placeholder="#f59e0b" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={settingsForm.control}
                          name="customCSS"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom CSS</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="/* Custom CSS styles */"
                                  rows={10}
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Add custom CSS to override default styles
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={settingsForm.control}
                          name="darkModeEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Dark Mode Support</FormLabel>
                                <FormDescription>
                                  Enable dark mode theme option
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" disabled={updateSettingsMutation.isPending}>
                          <Palette className="w-4 h-4 mr-2" />
                          Save Branding Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </form>
              </Form>

              <TabsContent value="licenses">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Key className="w-5 h-5" />
                        <span>Generate New License</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...licenseForm}>
                        <form onSubmit={licenseForm.handleSubmit(onLicenseSubmit)} className="space-y-4">
                          <FormField
                            control={licenseForm.control}
                            name="licenseeOrganization"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Organization Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Acme Security Corp" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={licenseForm.control}
                            name="licenseType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select license type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="trial">Trial (30 days)</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={licenseForm.control}
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
                              control={licenseForm.control}
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
                          </div>
                          
                          <FormField
                            control={licenseForm.control}
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
                          
                          <div className="space-y-2">
                            <FormLabel>Features</FormLabel>
                            <div className="grid grid-cols-2 gap-2">
                              {licenseFeatures.map((feature) => (
                                <div key={feature} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={feature}
                                    checked={licenseForm.watch("features").includes(feature)}
                                    onChange={(e) => {
                                      const currentFeatures = licenseForm.getValues("features");
                                      if (e.target.checked) {
                                        licenseForm.setValue("features", [...currentFeatures, feature]);
                                      } else {
                                        licenseForm.setValue("features", currentFeatures.filter(f => f !== feature));
                                      }
                                    }}
                                  />
                                  <label htmlFor={feature} className="text-sm">
                                    {feature.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <Button type="submit" disabled={generateLicenseMutation.isPending} className="w-full">
                            <Key className="w-4 h-4 mr-2" />
                            Generate License
                          </Button>
                        </form>
                      </Form>
                      
                      {generatedLicense && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">License Generated</h4>
                          <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                            {generatedLicense}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => navigator.clipboard.writeText(generatedLicense)}
                          >
                            Copy License Key
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Building className="w-5 h-5" />
                        <span>Active Licenses</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {licensesLoading ? (
                          <div className="text-center py-4">Loading licenses...</div>
                        ) : licenses.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            No licenses generated yet
                          </div>
                        ) : (
                          licenses.map((license: any) => (
                            <div key={license.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">{license.organization}</h4>
                                <Badge variant={license.isActive ? "default" : "secondary"}>
                                  {license.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>Type: {license.licenseType}</div>
                                <div>Clubs: {license.maxClubs} | Users: {license.maxUsers}</div>
                                <div>Expires: {new Date(license.expirationDate).toLocaleDateString()}</div>
                                <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-2">
                                  {license.licenseKey}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}