/**
 * Public SMS Check-in Landing Page
 * Route: /cs/:token
 * Mobile-first, no authentication required.
 */

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface SessionInfo {
  token: string;
  className: string;
  teacherName: string;
  scheduledStart: string;
  sessionStatus: string;
  tokenActive: boolean;
  alreadyConfirmed: boolean;
}

export default function ClassCheckinPage() {
  const { token } = useParams<{ token: string }>();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/cs/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data?.message || "Invalid or expired check-in link.");
        } else {
          setSessionInfo(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load session information.");
        setLoading(false);
      });
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setConfirming(true);
    setError(null);
    try {
      const r = await fetch(`/api/cs/${token}/confirm`, { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        setConfirmed(true);
      } else {
        setError(data.message || "Failed to confirm.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Loading class information…</p>
        </div>
      </div>
    );
  }

  if (!sessionInfo || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-400 mx-auto" />
            <p className="text-xl font-semibold text-gray-800">
              {error || "Invalid Link"}
            </p>
            <p className="text-gray-500 text-sm">
              This check-in link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCancelled = sessionInfo.sessionStatus === "cancelled";
  const isExpired = !sessionInfo.tokenActive && !sessionInfo.alreadyConfirmed;
  const isStarted = sessionInfo.sessionStatus === "started";

  const scheduledTime = new Date(sessionInfo.scheduledStart);
  const timeStr = scheduledTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = scheduledTime.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            {sessionInfo.className}
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            with {sessionInfo.teacherName}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{timeStr}</p>
            <p className="text-sm text-blue-500 mt-1">{dateStr}</p>
          </div>

          {isCancelled && (
            <div className="flex flex-col items-center space-y-3 py-2">
              <AlertTriangle className="h-12 w-12 text-orange-400" />
              <Badge variant="destructive" className="text-base px-4 py-1">
                Cancelled
              </Badge>
              <p className="text-gray-500 text-sm text-center">
                This class has been cancelled.
              </p>
            </div>
          )}

          {!isCancelled && confirmed && (
            <div className="flex flex-col items-center space-y-3 py-2">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-xl font-bold text-green-700">
                You're confirmed!
              </p>
              <p className="text-gray-500 text-sm text-center">
                Class has been marked as started. See you in class!
              </p>
            </div>
          )}

          {!isCancelled && !confirmed && sessionInfo.alreadyConfirmed && (
            <div className="flex flex-col items-center space-y-3 py-2">
              <CheckCircle className="h-12 w-12 text-green-400" />
              <p className="text-gray-700 font-medium">
                Already confirmed!
              </p>
            </div>
          )}

          {!isCancelled && !confirmed && isStarted && !sessionInfo.alreadyConfirmed && (
            <div className="flex flex-col items-center space-y-3 py-2">
              <Badge className="bg-green-100 text-green-800 text-sm px-4 py-1">
                Class Started
              </Badge>
              <p className="text-gray-500 text-sm text-center">
                Another student already opened the class.
              </p>
            </div>
          )}

          {!isCancelled && !confirmed && isExpired && !isStarted && (
            <div className="flex flex-col items-center space-y-3 py-2">
              <XCircle className="h-12 w-12 text-gray-400" />
              <p className="text-gray-600 text-sm text-center">
                This check-in link has expired or is no longer active.
              </p>
            </div>
          )}

          {!isCancelled && !confirmed && !sessionInfo.alreadyConfirmed && sessionInfo.tokenActive && (
            <div className="space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <Button
                className="w-full h-16 text-xl font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 transition-transform"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirming…
                  </span>
                ) : (
                  "✓  I'm Here"
                )}
              </Button>
              <p className="text-xs text-gray-400 text-center">
                Tap once to confirm your presence in class.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
