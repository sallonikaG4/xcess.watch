import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Package, Download, Settings, Power, Shield, Users, AlertTriangle, CheckCircle, Upload, Trash2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const pluginInstallSchema = z.object({
  pluginFile: z.instanceof(File).optional(),
  pluginUrl: z.string().url().optional(),
  pluginKey: z.string().optional(),
}).refine((data) => data.pluginFile || data.pluginUrl || data.pluginKey, {
  message: "Please provide either a plugin file, URL, or plugin key",
});

const pluginConfigSchema = z.object({
  configKey: z.string().min(1, "Configuration key is required"),
  configValue: z.string().min(1, "Configuration value is required"),
});

type PluginInstallData = z.infer<typeof pluginInstallSchema>;
type PluginConfigData = z.infer<typeof pluginConfigSchema>;

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  isEnabled: boolean;
  isInstalled: boolean;
  requiresLicense: boolean;
  permissions: string[];
  configuration: Record<string, any>;
  lastUpdated: string;
  downloadUrl?: string;
  documentation?: string;
}

const predefinedPlugins: Plugin[] = [
  {
    id: "blinkid-scanner",
    name: "BlinkID Scanner",
    version: "2.1.0",
    description: "Advanced ID scanning with OCR and NFC support for Swiss eIDs, passports, and driver licenses",
    author: "Microblink",
    category: "Security",
    isEnabled: false,
    isInstalled: false,
    requiresLicense: true,
    permissions: ["camera", "nfc", "storage"],
    configuration: {
      enableNFC: true,
      enableOCR: true,
      supportedDocuments: ["passport", "id_card", "drivers_license"],
      apiEndpoint: "https://api.microblink.com"
    },
    lastUpdated: "2024-12-15",
    downloadUrl: "https://github.com/BlinkID/blinkid-react-native",
    documentation: "https://blinkid.github.io/blinkid-react-native/"
  },
  {
    id: "sms-notifications",
    name: "SMS Notifications",
    version: "1.5.2",
    description: "Send SMS notifications for guest invitations, ban alerts, and security updates via Twilio",
    author: "XESS Team",
    category: "Communication",
    isEnabled: false,
    isInstalled: false,
    requiresLicense: false,
    permissions: ["network", "contacts"],
    configuration: {
      twilioAccountSid: "",
      twilioAuthToken: "",
      fromPhoneNumber: "",
      enableGuestInvites: true,
      enableBanAlerts: true
    },
    lastUpdated: "2024-12-10",
    documentation: "https://docs.xess.watch/plugins/sms"
  },
  {
    id: "advanced-reporting",
    name: "Advanced Reporting",
    version: "3.0.1",
    description: "Generate detailed reports, analytics, and export data in multiple formats (PDF, Excel, CSV)",
    author: "XESS Team", 
    category: "Analytics",
    isEnabled: false,
    isInstalled: false,
    requiresLicense: true,
    permissions: ["storage", "export"],
    configuration: {
      enablePDFExport: true,
      enableExcelExport: true,
      enableScheduledReports: true,
      defaultReportFormat: "pdf"
    },
    lastUpdated: "2024-12-08",
    documentation: "https://docs.xess.watch/plugins/reporting"
  },
  {
    id: "bookmtender-integration",
    name: "BookMeTender Integration",
    version: "1.2.0",
    description: "Integrate with BookMeTender API for guest reservations and table management",
    author: "BookMeTender",
    category: "Integration",
    isEnabled: false,
    isInstalled: false,
    requiresLicense: false,
    permissions: ["network", "calendar"],
    configuration: {
      apiKey: "",
      webhookUrl: "",
      enableAutoSync: true,
      syncInterval: 15
    },
    lastUpdated: "2024-12-05",
    documentation: "https://docs.bookmtender.com/api"
  },
  {
    id: "facial-recognition",
    name: "Facial Recognition",
    version: "2.3.0",
    description: "AI-powered facial recognition for banned guest detection and VIP identification",
    author: "XESS Security",
    category: "Security",
    isEnabled: false,
    isInstalled: false,
    requiresLicense: true,
    permissions: ["camera", "ai_processing", "storage"],
    configuration: {
      confidenceThreshold: 0.85,
      enableVIPRecognition: true,
      enableBannedDetection: true,
      storeFaceTemplates: false
    },
    lastUpdated: "2024-12-01",
    documentation: "https://docs.xess.watch/plugins/facial-recognition"
  },
  {
    id: "backup-sync",
    name: "Cloud Backup & Sync",
    version: "1.4.0",
    description: "Automated cloud backup and multi-location sync for disaster recovery",
    author: "XESS Team",
    category: "Utility",
    isEnabled: false,
    isInstalled: false,
    requiresLicense: false,
    permissions: ["storage", "network", "encryption"],
    configuration: {
      cloudProvider: "aws",
      encryptionEnabled: true,
      backupFrequency: "daily",
      retentionDays: 90
    },
    lastUpdated: "2024-11-28",
    documentation: "https://docs.xess.watch/plugins/backup"
  }
];

export default function PluginsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: installedPlugins = [], isLoading } = useQuery({
    queryKey: ["/api/plugins"],
    enabled: user?.role === "super_admin",
  });

  const installForm = useForm<PluginInstallData>({
    resolver: zodResolver(pluginInstallSchema),
    defaultValues: {},
  });

  const configForm = useForm<PluginConfigData>({
    resolver: zodResolver(pluginConfigSchema),
    defaultValues: {
      configKey: "",
      configValue: "",
    },
  });

  const installPluginMutation = useMutation({
    mutationFn: async (data: PluginInstallData) => {
      const formData = new FormData();
      if (data.pluginFile) {
        formData.append("plugin", data.pluginFile);
      }
      if (data.pluginUrl) {
        formData.append("url", data.pluginUrl);
      }
      if (data.pluginKey) {
        formData.append("key", data.pluginKey);
      }
      
      const response = await fetch("/api/plugins/install", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to install plugin");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      setInstallDialogOpen(false);
      installForm.reset();
      toast({
        title: "Success",
        description: "Plugin installed successfully",
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

  const togglePluginMutation = useMutation({
    mutationFn: async ({ pluginId, enabled }: { pluginId: string; enabled: boolean }) => {
      const response = await apiRequest("POST", `/api/plugins/${pluginId}/toggle`, { enabled });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      toast({
        title: "Success",
        description: "Plugin status updated",
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

  const updateConfigMutation = useMutation({
    mutationFn: async ({ pluginId, config }: { pluginId: string; config: Record<string, any> }) => {
      const response = await apiRequest("POST", `/api/plugins/${pluginId}/config`, config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      setConfigDialogOpen(false);
      configForm.reset();
      toast({
        title: "Success",
        description: "Plugin configuration updated",
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

  const uninstallPluginMutation = useMutation({
    mutationFn: async (pluginId: string) => {
      const response = await apiRequest("DELETE", `/api/plugins/${pluginId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      toast({
        title: "Success",
        description: "Plugin uninstalled successfully",
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

  const onInstallSubmit = (data: PluginInstallData) => {
    installPluginMutation.mutate(data);
  };

  const onConfigSubmit = (data: PluginConfigData) => {
    if (selectedPlugin) {
      const newConfig = {
        ...selectedPlugin.configuration,
        [data.configKey]: data.configValue,
      };
      updateConfigMutation.mutate({
        pluginId: selectedPlugin.id,
        config: newConfig,
      });
    }
  };

  const handleTogglePlugin = (pluginId: string, enabled: boolean) => {
    togglePluginMutation.mutate({ pluginId, enabled });
  };

  const handleUninstallPlugin = (pluginId: string) => {
    if (window.confirm("Are you sure you want to uninstall this plugin? This action cannot be undone.")) {
      uninstallPluginMutation.mutate(pluginId);
    }
  };

  const allPlugins = [...predefinedPlugins, ...installedPlugins];
  const categories = ["all", ...Array.from(new Set(allPlugins.map(p => p.category)))];
  
  const filteredPlugins = allPlugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || plugin.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (plugin: Plugin) => {
    if (!plugin.isInstalled) {
      return <Badge variant="outline">Available</Badge>;
    }
    if (plugin.isEnabled) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getStatusIcon = (plugin: Plugin) => {
    if (!plugin.isInstalled) {
      return <Download className="w-4 h-4 text-muted-foreground" />;
    }
    if (plugin.isEnabled) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <Power className="w-4 h-4 text-gray-500" />;
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col lg:pl-64">
          <Topbar 
            onMenuClick={() => setSidebarOpen(true)}
            title="Plugins"
          />
          <main className="flex-1 overflow-y-auto p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Access Denied
                </h3>
                <p className="text-muted-foreground">
                  Only Super Administrators can manage plugins.
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
          title="Plugin Management"
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Plugin Management</h1>
                <p className="text-muted-foreground mt-1">
                  Install and configure plugins to extend platform functionality
                </p>
              </div>
              
              <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Install Plugin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Install New Plugin</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...installForm}>
                    <form onSubmit={installForm.handleSubmit(onInstallSubmit)} className="space-y-4">
                      <Tabs defaultValue="file">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="file">File</TabsTrigger>
                          <TabsTrigger value="url">URL</TabsTrigger>
                          <TabsTrigger value="key">Key</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="file">
                          <FormField
                            control={installForm.control}
                            name="pluginFile"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plugin File</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="file"
                                    accept=".zip,.xess"
                                    onChange={(e) => field.onChange(e.target.files?.[0])}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Upload a .zip or .xess plugin file
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        <TabsContent value="url">
                          <FormField
                            control={installForm.control}
                            name="pluginUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plugin URL</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://plugins.xess.watch/plugin.zip"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Install plugin from URL
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        <TabsContent value="key">
                          <FormField
                            control={installForm.control}
                            name="pluginKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Plugin Key</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="BLNK-1234-5678-9ABC"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Install plugin using license key
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setInstallDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={installPluginMutation.isPending}
                        >
                          Install
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex space-x-4 mb-6">
              <div className="relative flex-1">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search plugins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlugins.map((plugin) => (
                <Card key={plugin.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(plugin)}
                        <div>
                          <CardTitle className="text-lg">{plugin.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{plugin.category}</Badge>
                            {getStatusBadge(plugin)}
                            {plugin.requiresLicense && (
                              <Badge variant="secondary">Licensed</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {plugin.description}
                      </p>
                      
                      <div className="text-xs text-muted-foreground">
                        <div>Version: {plugin.version}</div>
                        <div>Author: {plugin.author}</div>
                        <div>Updated: {new Date(plugin.lastUpdated).toLocaleDateString()}</div>
                      </div>
                      
                      {plugin.permissions.length > 0 && (
                        <div className="text-xs">
                          <div className="font-medium mb-1">Permissions:</div>
                          <div className="flex flex-wrap gap-1">
                            {plugin.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        {!plugin.isInstalled ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              // Install plugin
                              if (plugin.requiresLicense) {
                                toast({
                                  title: "License Required",
                                  description: "This plugin requires a valid license key",
                                  variant: "destructive",
                                });
                              } else {
                                // Simulate installation
                                toast({
                                  title: "Installing...",
                                  description: `Installing ${plugin.name}`,
                                });
                              }
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Install
                          </Button>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={plugin.isEnabled}
                                onCheckedChange={(enabled) => handleTogglePlugin(plugin.id, enabled)}
                              />
                              <span className="text-sm">
                                {plugin.isEnabled ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPlugin(plugin);
                                setConfigDialogOpen(true);
                              }}
                            >
                              <Settings className="w-3 h-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUninstallPlugin(plugin.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPlugins.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No plugins found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || categoryFilter !== "all"
                      ? "No plugins match your search criteria." 
                      : "No plugins are available at this time."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Plugin Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedPlugin?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlugin && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Version:</span> {selectedPlugin.version}
                </div>
                <div>
                  <span className="font-medium">Author:</span> {selectedPlugin.author}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {selectedPlugin.category}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedPlugin.isEnabled ? "Enabled" : "Disabled"}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Current Configuration</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 overflow-auto">
                    {JSON.stringify(selectedPlugin.configuration, null, 2)}
                  </pre>
                </div>
              </div>
              
              <Form {...configForm}>
                <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={configForm.control}
                      name="configKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Configuration Key</FormLabel>
                          <FormControl>
                            <Input placeholder="apiKey" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={configForm.control}
                      name="configValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value</FormLabel>
                          <FormControl>
                            <Input placeholder="configuration value" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setConfigDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateConfigMutation.isPending}
                    >
                      Update Configuration
                    </Button>
                  </div>
                </form>
              </Form>
              
              {selectedPlugin.documentation && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedPlugin.documentation, '_blank')}
                  >
                    View Documentation
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}