import React, { useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScanSuccess, onScanError }) => {
    const videoRef = useRef(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        // Initialize QR Scanner
        scannerRef.current = new QrScanner(
            videoElement,
            (result) => {
                if (result?.data) {
                    onScanSuccess(result.data);
                }
            },
            {
                onDecodeError: (error) => {
                    // Ignore common errors while searching for QR code
                    if (onScanError && !error.toString().includes('No QR code found')) {
                        onScanError(error);
                    }
                },
                highlightScanRegion: true,
                highlightCodeOutline: true,
                maxScansPerSecond: 5,
            }
        );

        // Start Scanner
        scannerRef.current.start().catch(err => {
            console.error("Camera access error:", err);
            if (onScanError) onScanError(err);
        });

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop();
                scannerRef.current.destroy();
            }
        };
    }, [onScanSuccess, onScanError]);

    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-900 aspect-square flex items-center justify-center relative">
                {/* Video Element */}
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                />

                {/* Visual Guide Overlay (Matches the premium design) */}
                <div className="absolute inset-0 border-[40px] border-slate-900/40 pointer-events-none">
                    <div className="w-full h-full border-2 border-white/50 rounded-xl relative">
                        {/* Animated Laser Line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse-vertical top-0"></div>

                        {/* Frame Corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-sm"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-sm"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-sm"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-sm"></div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-vertical {
                    0%, 100% { top: 0%; opacity: 0.5; }
                    50% { top: 100%; opacity: 1; }
                }
                .animate-pulse-vertical {
                    animation: pulse-vertical 2s linear infinite;
                }
            `}} />
        </div>
    );
};

export default QRScanner;
