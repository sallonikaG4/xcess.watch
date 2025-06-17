import { CheckCircle, XCircle, User, Calendar, FileText, Globe, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

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

interface ScanResultProps {
  documentData: DocumentData;
  verificationResult: VerificationResult | null;
}

export function ScanResult({ documentData, verificationResult }: ScanResultProps) {
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      
      // Handle various date formats
      let date: Date;
      if (dateString.includes('-')) {
        date = new Date(dateString);
      } else if (dateString.length === 6) {
        // YYMMDD format
        const year = parseInt('20' + dateString.substring(0, 2));
        const month = parseInt(dateString.substring(2, 4)) - 1;
        const day = parseInt(dateString.substring(4, 6));
        date = new Date(year, month, day);
      } else if (dateString.length === 8) {
        // YYYYMMDD format
        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1;
        const day = parseInt(dateString.substring(6, 8));
        date = new Date(year, month, day);
      } else {
        return dateString;
      }
      
      return date.toLocaleDateString();
    } catch {
      return dateString || 'N/A';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'passport': 'Passport',
      'id_card': 'National ID',
      'driving_license': 'Driver License',
      'swiss_eid': 'Swiss eID',
      'unknown': 'Unknown Document'
    };
    return types[type] || type;
  };

  const getNationalityFlag = (code: string) => {
    const flags: Record<string, string> = {
      'CHE': '🇨🇭',
      'DEU': '🇩🇪',
      'FRA': '🇫🇷',
      'ITA': '🇮🇹',
      'AUT': '🇦🇹',
      'USA': '🇺🇸',
      'GBR': '🇬🇧'
    };
    return flags[code] || '🌍';
  };

  const isDocumentExpired = () => {
    if (!documentData.expiryDate) return false;
    try {
      const expiryDate = new Date(documentData.expiryDate);
      return expiryDate < new Date();
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Verification Result */}
      {verificationResult && (
        <Alert variant={verificationResult.allowed ? "default" : "destructive"}>
          {verificationResult.allowed ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="font-medium">
              {verificationResult.allowed ? "Entry Allowed" : "Entry Denied"}
            </div>
            <div className="text-sm mt-1">{verificationResult.reason}</div>
            
            {verificationResult.ban && (
              <div className="mt-2 p-2 bg-destructive/10 rounded border">
                <div className="font-medium text-destructive">Ban Details:</div>
                <div className="text-xs mt-1">
                  <div>Reason: {verificationResult.ban.reason}</div>
                  <div>Date: {formatDate(verificationResult.ban.banDate)}</div>
                  <div>Club: {verificationResult.ban.club}</div>
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Document Information</span>
            <Badge variant={isDocumentExpired() ? "destructive" : "secondary"}>
              {getDocumentTypeLabel(documentData.documentType)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Full Name</span>
              </div>
              <div className="pl-6">
                <div className="font-semibold">
                  {documentData.firstName} {documentData.lastName}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date of Birth</span>
              </div>
              <div className="pl-6">
                <div>{formatDate(documentData.dateOfBirth)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Nationality</span>
              </div>
              <div className="pl-6">
                <div className="flex items-center space-x-2">
                  <span>{getNationalityFlag(documentData.nationality)}</span>
                  <span>{documentData.nationality}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Issuing Country</span>
              </div>
              <div className="pl-6">
                <div className="flex items-center space-x-2">
                  <span>{getNationalityFlag(documentData.issuingCountry)}</span>
                  <span>{documentData.issuingCountry}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Document Number</div>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                {documentData.documentNumber || 'N/A'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Expiry Date</div>
              <div className={`p-2 rounded ${isDocumentExpired() ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                <div className="flex items-center space-x-2">
                  <span>{formatDate(documentData.expiryDate)}</span>
                  {isDocumentExpired() && (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Source Indicators */}
          <Separator />

          <div className="flex flex-wrap gap-2">
            {documentData.mrzData && (
              <Badge variant="outline">
                MRZ Data Available
              </Badge>
            )}
            {documentData.ocrData && (
              <Badge variant="outline">
                OCR Data Available
              </Badge>
            )}
            {documentData.nfcData && (
              <Badge variant="outline">
                NFC Data Available
              </Badge>
            )}
          </div>

          {/* Warnings */}
          {isDocumentExpired() && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This document has expired and may not be valid for identification.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Technical Details (Collapsible) */}
      {(documentData.mrzData || documentData.ocrData || documentData.nfcData) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Technical Data</CardTitle>
          </CardHeader>
          <CardContent>
            <details className="space-y-2">
              <summary className="cursor-pointer text-sm font-medium">
                Raw Data (Click to expand)
              </summary>
              <div className="mt-2 space-y-2">
                {documentData.mrzData && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">MRZ Data:</div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {typeof documentData.mrzData === 'string' 
                        ? documentData.mrzData 
                        : JSON.stringify(documentData.mrzData, null, 2)
                      }
                    </pre>
                  </div>
                )}
                
                {documentData.nfcData && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">NFC Data:</div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {typeof documentData.nfcData === 'string' 
                        ? documentData.nfcData 
                        : JSON.stringify(documentData.nfcData, null, 2)
                      }
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}