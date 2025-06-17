import { useEffect, useRef, useState } from "react";
import { Camera, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
}

interface BlinkIDScannerProps {
  onSuccess: (data: DocumentData) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

// BlinkID SDK interface
declare global {
  interface Window {
    BlinkID?: {
      createBlinkIdRecognizer: () => any;
      VideoRecognizer: {
        createVideoRecognizerFromCameraStream: (
          cameraStream: MediaStream,
          htmlVideoElement: HTMLVideoElement,
          recognizer: any
        ) => Promise<any>;
      };
      WasmSDKLoadSettings: any;
      loadWasmModule: (settings: any) => Promise<any>;
    };
  }
}

export function BlinkIDScanner({ onSuccess, onError, isActive }: BlinkIDScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoRecognizer, setVideoRecognizer] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSDK = async () => {
      try {
        if (!window.BlinkID) {
          const script = document.createElement('script');
          script.src = '/sdk/blinkid/blinkid-sdk.js';
          script.onload = () => initializeSDK();
          script.onerror = () => setError('Failed to load BlinkID SDK');
          document.head.appendChild(script);
        } else {
          await initializeSDK();
        }
      } catch (err) {
        setError(`SDK loading failed: ${err}`);
      }
    };

    const initializeSDK = async () => {
      try {
        if (!window.BlinkID) {
          throw new Error('BlinkID SDK not available');
        }

        const loadSettings = new window.BlinkID.WasmSDKLoadSettings(
          import.meta.env.VITE_BLINKID_LICENSE_KEY || "YOUR_LICENSE_KEY",
          "/sdk/blinkid/",
          "/sdk/blinkid/"
        );

        await window.BlinkID.loadWasmModule(loadSettings);
        setSdkLoaded(true);
      } catch (err) {
        setError(`SDK initialization failed: ${err}`);
      }
    };

    loadSDK();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isActive && sdkLoaded && !scanning) {
      startScanning();
    } else if (!isActive && scanning) {
      stopScanning();
    }
  }, [isActive, sdkLoaded]);

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });

      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const recognizer = await window.BlinkID!.createBlinkIdRecognizer();
        const videoRecognizer = await window.BlinkID!.VideoRecognizer.createVideoRecognizerFromCameraStream(
          stream,
          videoRef.current,
          recognizer
        );

        setVideoRecognizer(videoRecognizer);

        videoRecognizer.onScanningDone = (recognitionState: any) => {
          handleRecognitionResult(recognitionState);
        };

        await videoRecognizer.startRecognition();
      }
    } catch (err) {
      setError(`Camera access failed: ${err}`);
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (videoRecognizer) {
      videoRecognizer.releaseVideoFeed();
      setVideoRecognizer(null);
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    setScanning(false);
  };

  const handleRecognitionResult = (recognitionState: any) => {
    try {
      if (recognitionState.resultState === 'valid') {
        const result = recognitionState.recognizer.result;

        let documentData: DocumentData;

        if (result.mrzResult && result.mrzResult.documentType !== 'unknown') {
          documentData = {
            firstName: result.mrzResult.primaryId || '',
            lastName: result.mrzResult.secondaryId || '',
            dateOfBirth: result.mrzResult.dateOfBirth?.originalDateString || '',
            documentNumber: result.mrzResult.documentNumber || '',
            documentType: result.mrzResult.documentType || 'unknown',
            nationality: result.mrzResult.nationality || '',
            issuingCountry: result.mrzResult.issuingCountry || '',
            expiryDate: result.mrzResult.dateOfExpiry?.originalDateString || '',
            mrzData: JSON.stringify(result.mrzResult)
          };
        } else {
          documentData = extractOCRData(result);
        }

        if (!documentData.firstName || !documentData.lastName || !documentData.dateOfBirth) {
          throw new Error('Incomplete document data - please rescan');
        }

        stopScanning();
        onSuccess(documentData);

      } else if (recognitionState.resultState === 'empty') {
        // Continue scanning
      } else {
        throw new Error('Document recognition failed');
      }
    } catch (err) {
      onError(`Recognition error: ${err}`);
      stopScanning();
    }
  };

  const extractOCRData = (result: any): DocumentData => {
    const ocrData = result.fullDocumentImageResult || result.faceImageResult || {};
    
    return {
      firstName: ocrData.firstName || result.firstName || '',
      lastName: ocrData.lastName || result.lastName || '',
      dateOfBirth: ocrData.dateOfBirth || result.dateOfBirth || '',
      documentNumber: ocrData.documentNumber || result.documentNumber || '',
      documentType: 'id_card',
      nationality: ocrData.nationality || '',
      issuingCountry: ocrData.issuingCountry || '',
      expiryDate: ocrData.expiryDate || result.expiryDate || '',
      ocrData: JSON.stringify(result)
    };
  };

  if (!sdkLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading BlinkID SDK...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-64 object-cover"
          playsInline
          muted
        />
        
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-white border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
              <div className="text-white text-center">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Position document in frame</p>
                <p className="text-xs mt-1">MRZ line at bottom</p>
              </div>
            </div>
          </div>
        )}

        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <Camera className="w-12 h-12 mx-auto mb-4" />
              <p>Camera ready for scanning</p>
            </div>
          </div>
        )}
      </div>

      {scanning && (
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Scanning document...</span>
          </div>
          <p className="text-xs mt-1">
            Supports: Passport, National ID, Driver License
          </p>
        </div>
      )}
    </div>
  );
}