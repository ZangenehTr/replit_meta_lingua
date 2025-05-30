import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneCall } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoIPContactButtonProps {
  phoneNumber: string;
  contactName: string;
  className?: string;
}

export function VoIPContactButton({ phoneNumber, contactName, className }: VoIPContactButtonProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const { toast } = useToast();

  const handleVoIPCall = async () => {
    try {
      setIsCallActive(true);
      
      // Isabel VoIP line integration for call recording
      const voipResponse = await fetch('/api/voip/initiate-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          contactName: contactName,
          callType: 'outbound',
          recordCall: true
        })
      });

      if (!voipResponse.ok) {
        throw new Error('Failed to initiate VoIP call');
      }

      const callData = await voipResponse.json();
      
      toast({
        title: "VoIP Call Initiated",
        description: `Connecting to ${contactName} at ${phoneNumber}`,
      });

      // Simulate call duration tracking
      setTimeout(() => {
        setIsCallActive(false);
        toast({
          title: "Call Recorded",
          description: `Call with ${contactName} has been recorded via Isabel VoIP`,
        });
      }, 5000);

    } catch (error) {
      setIsCallActive(false);
      toast({
        title: "VoIP Call Failed",
        description: "Unable to connect via Isabel VoIP line. Please check configuration.",
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