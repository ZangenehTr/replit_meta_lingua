import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneCall } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface VoIPContactButtonProps {
  phoneNumber: string;
  contactName: string;
  className?: string;
}

export function VoIPContactButton({ phoneNumber, contactName, className }: VoIPContactButtonProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation(['common']);

  const handleVoIPCall = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim() === '') {
      toast({
        title: t('common:toast.invalidPhoneNumber'),
        description: "Please provide a valid phone number to make a call.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCallActive(true);
      
      // Isabel VoIP line integration for call recording
      const voipResponse = await fetch('/api/voip/initiate-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          contactName: contactName,
          callType: 'outbound',
          recordCall: true
        })
      });

      if (!voipResponse.ok) {
        const errorData = await voipResponse.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || 'Failed to initiate VoIP call');
      }

      const callData = await voipResponse.json();
      
      toast({
        title: t('common:toast.voipCallInitiated'),
        description: `Connecting to ${contactName} at ${phoneNumber}`,
      });

      // Log the call in communication system
      await fetch('/api/callcenter/log-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          contactName: contactName,
          callId: callData.callId,
          direction: 'outbound',
          status: 'initiated'
        })
      });

      // Monitor call status
      const monitorCall = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/voip/call-status/${callData.callId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            }
          });
          
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            if (status.status === 'completed' || status.status === 'failed') {
              clearInterval(monitorCall);
              setIsCallActive(false);
              toast({
                title: status.status === 'completed' ? "Call Completed" : "Call Failed",
                description: `Call with ${contactName} has been ${status.status}${status.recordingUrl ? ' and recorded' : ''}`,
                variant: status.status === 'completed' ? 'default' : 'destructive'
              });
            }
          }
        } catch (error) {
          // Handle call monitoring error gracefully
          clearInterval(monitorCall);
        }
      }, 2000);

      // Cleanup after 30 seconds if still active
      setTimeout(() => {
        if (isCallActive) {
          clearInterval(monitorCall);
          setIsCallActive(false);
        }
      }, 30000);

    } catch (error) {
      setIsCallActive(false);
      // Handle VoIP call error gracefully
      toast({
        title: t('common:toast.voipCallFailed'),
        description: error.message || "Unable to connect via Isabel VoIP line. Please check configuration.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleVoIPCall}
      disabled={isCallActive}
      variant="outline"
      size="sm"
      className={`${className} ${isCallActive ? 'bg-green-100 border-green-300' : ''}`}
    >
      {isCallActive ? (
        <>
          <PhoneCall className="h-4 w-4 mr-1 animate-pulse text-green-600" />
          Calling...
        </>
      ) : (
        <>
          <Phone className="h-4 w-4 mr-1" />
          Call
        </>
      )}
    </Button>
  );
}