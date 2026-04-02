import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Upload, Trash2, Square } from "lucide-react";

interface Props {
  audioFiles: File[];
  isRecording: boolean;
  recordingTime: number;
  onStart: () => void;
  onStop: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  testIdPrefix?: string;
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function AudioRecorder({ audioFiles, isRecording, recordingTime, onStart, onStop, onUpload, onRemove, testIdPrefix = "" }: Props) {
  return (
    <div className="space-y-4">
      <Label>Audio Instructions ({audioFiles.length}/5)</Label>

      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Record Audio</span>
          </div>
          {isRecording && <Badge variant="destructive" className="animate-pulse">Recording {formatTime(recordingTime)}</Badge>}
        </div>
        <div className="flex gap-2">
          {!isRecording ? (
            <Button type="button" onClick={onStart} disabled={audioFiles.length >= 5} className="flex-1" data-testid={`${testIdPrefix}button-start-recording`}>
              <Mic className="h-4 w-4 me-2" />Start Recording
            </Button>
          ) : (
            <Button type="button" onClick={onStop} variant="destructive" className="flex-1" data-testid={`${testIdPrefix}button-stop-recording`}>
              <Square className="h-4 w-4 me-2" />Stop & Save Recording
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-2">Click to record audio instructions for your students</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">Or upload audio files</p>
        <Input type="file" multiple accept="audio/*" onChange={onUpload} className="mt-2" data-testid={`${testIdPrefix}input-audio-upload`} disabled={audioFiles.length >= 5} />
      </div>

      {audioFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Audio Files</Label>
          {audioFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border" data-testid={`${testIdPrefix}audio-file-${index}`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Mic className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)} data-testid={`${testIdPrefix}button-remove-audio-${index}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
