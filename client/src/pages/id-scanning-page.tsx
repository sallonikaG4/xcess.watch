import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { 
  QrCode, 
  Camera, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Loader2,
  RotateCcw,
  Wifi,
  WifiOff
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BlinkIDScanner } from "@/components/id-scanning/blinkid-scanner";
import { NFCReader } from "@/components/id-scanning/nfc-reader";
import { ScanResult } from "@/components/id-scanning/scan-result";
import { apiRequest } from "@/lib/queryClient";

interface DocumentData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentNumber: string;
  documentType: string;
  nationality: string;
  issuingCountry: string;
  expiryDate: string;
  mrzData?: string;
  ocrData?: any;
  nfcData?: any;
}

interface VerificationResult {
  allowed: boolean;
  reason: string;
  guest?: {
    name: string;
    status: string;
    club?: string;
  };
  ban?: {
    reason: string;
    banDate: string;
    club: string;
  };
}

export default function IDScanningPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [scanMode, setScanMode] = useState<"camera" | "nfc">("camera");
  const [scanning, setScanning] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [nfcConnected, setNfcConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyDocumentMutation = useMutation({
    mutationFn: async (data: DocumentData) => {
      const response = await fetch("https://xcess.watch/api/verify-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.VITE_API_KEY || ""}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error("Verification service unavailable");
      }
      
      return response.json();
    },
    onSuccess: (result: VerificationResult) => {
      setVerificationResult(result);
      setScanning(false);
      
      toast({
        title: result.allowed ? "Entry Allowed" : "Entry Denied",
        description: result.reason,
        variant: result.allowed ? "default" : "destructive"
      });
    },
    onError: (error: Error) => {
      setError(`Verification failed: ${error.message}`);
      setScanning(false);
      
      toast({
        title: "Verification Error",
        description: "Failed to verify document. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleScanSuccess = (data: DocumentData) => {
    setDocumentData(data);
    setError(null);
    verifyDocumentMutation.mutate(data);
  };

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
    setScanning(false);
    
    toast({
      title: "Scan Error",
      description: errorMessage,
      variant: "destructive"
    });
  };

  const resetScan = () => {
    setDocumentData(null);
    setVerificationResult(null);
    setError(null);
    setScanning(false);
  };

  const startScan = () => {
    resetScan();
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col lg:pl-64">
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)}
          title={t("id_scanning")}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">ID Document Scanning</h1>
                <p className="text-muted-foreground mt-1">
                  Scan and verify guest identification documents
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={nfcConnected ? "default" : "secondary"}>
                  {nfcConnected ? (
                    <>
                      <Wifi className="w-3 h-3 mr-1" />
                      NFC Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 mr-1" />
                      NFC Disconnected
                    </>
                  )}
                </Badge>
              </div>
            </div>

            {/* Scanning Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scanner Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="w-5 h-5" />
                    <span>Document Scanner</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={scanMode} onValueChange={(value) => setScanMode(value as "camera" | "nfc")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="camera" className="flex items-center space-x-2">
                        <Camera className="w-4 h-4" />
                        <span>Camera Scan</span>
                      </TabsTrigger>
                      <TabsTrigger value="nfc" className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4" />
                        <span>NFC Scan</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="camera" className="mt-6">
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-muted-foreground mb-4">
                            Position the document within the camera frame. Supports passports, national IDs, and driver licenses.
                          </p>
                          
                          {!scanning ? (
                            <Button onClick={startScan} size="lg" className="w-full">
                              <Camera className="w-4 h-4 mr-2" />
                              Start Camera Scan
                            </Button>
                          ) : (
                            <Button onClick={resetScan} variant="outline" size="lg" className="w-full">
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reset Scan
                            </Button>
                          )}
                        </div>

                        {scanning && (
                          <BlinkIDScanner
                            onSuccess={handleScanSuccess}
                            onError={handleScanError}
                            isActive={scanning && scanMode === "camera"}
                          />
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="nfc" className="mt-6">
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-muted-foreground mb-4">
                            Place the Swiss eID card on the NFC reader (ACR1252U).
                          </p>
                          
                          {!scanning ? (
                            <Button 
                              onClick={startScan} 
                              size="lg" 
                              className="w-full"
                              disabled={!nfcConnected}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Start NFC Scan
                            </Button>
                          ) : (
                            <Button onClick={resetScan} variant="outline" size="lg" className="w-full">
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reset Scan
                            </Button>
                          )}
                        </div>

                        {scanning && scanMode === "nfc" && (
                          <NFCReader
                            onSuccess={handleScanSuccess}
                            onError={handleScanError}
                            onConnectionChange={setNfcConnected}
                            isActive={scanning && scanMode === "nfc"}
                          />
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Status Display */}
              {(documentData || verificationResult || error || verifyDocumentMutation.isPending) && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {verifyDocumentMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : verificationResult?.allowed ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span>Entry Allowed</span>
                        </>
                      ) : verificationResult ? (
                        <>
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span>Entry Denied</span>
                        </>
                      ) : error ? (
                        <>
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                          <span>Scan Error</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <span>Document Scanned</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {verifyDocumentMutation.isPending && (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Verifying document against banned guest database...
                        </p>
                      </div>
                    )}

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {documentData && !error && !verifyDocumentMutation.isPending && (
                      <ScanResult 
                        documentData={documentData}
                        verificationResult={verificationResult}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Scanning Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Camera Scanning</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Ensure good lighting conditions</li>
                      <li>• Hold document steady and flat</li>
                      <li>• Covers MRZ and OCR fallback</li>
                      <li>• Supports passports, IDs, licenses</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">NFC Scanning</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Place card flat on NFC reader</li>
                      <li>• Wait for connection indicator</li>
                      <li>• Only for Swiss eID cards</li>
                      <li>• Requires ACR1252U reader</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}