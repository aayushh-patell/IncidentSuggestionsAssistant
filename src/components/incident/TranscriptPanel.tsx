import React, { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Bot } from 'lucide-react';
import { NAVBAR_HEIGHT } from '../../pages/Dashboard';

interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
}

interface TranscriptPanelProps {
  isOpen: boolean;
  entries: TranscriptEntry[];
  currentTime: number;
  onTimeClick: (time: number) => void;
  onEntryHover?: (id: string | null) => void;
  highlightedTranscriptId?: string;
  onTranscriptClick?: (transcriptId: string) => void;
}

// Helper: Convert timestamp to minutes
function timeToMinutes(timestamp: string) {
  const [hours, minutes, seconds] = timestamp.split(':').map(Number);
  return hours * 60 + minutes + seconds / 60;
}

// Helper: Get icon for speaker
function getSpeakerIcon(speaker: string) {
  return speaker === 'System' ? Bot : User;
}

// Pastel color palette (Tailwind classes or custom)
const pastelColors = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-red-100 text-red-800 border-red-200',
  'bg-sky-100 text-sky-800 border-sky-200',
];

// Speaker to color mapping (per session)
const speakerColorMap: { [speaker: string]: string } = {};
let colorIndex = 0;

function getDynamicSpeakerColor(speaker: string) {
  if (speakerColorMap[speaker]) return speakerColorMap[speaker];
  
  // Assign next color
  const color = pastelColors[colorIndex % pastelColors.length];
  speakerColorMap[speaker] = color;
  colorIndex++;
  return color;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  isOpen,
  entries,
  currentTime,
  onTimeClick,
  onEntryHover,
  highlightedTranscriptId,
  onTranscriptClick
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  // Smoothly scroll highlighted transcript into view if not visible
  useEffect(() => {
    if (!highlightedTranscriptId || !scrollRef.current || !entryRefs.current[highlightedTranscriptId]) return;
    entryRefs.current[highlightedTranscriptId].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedTranscriptId]);

  // Autoscroll to bottom when new messages are added, unless a message is highlighted
  useEffect(() => {
    if (highlightedTranscriptId) return; // Don't autoscroll if user is focusing a message
    if (!scrollRef.current) return;
    // Find the last entry's ref
    const lastEntry = entries[entries.length - 1];
    if (lastEntry && entryRefs.current[lastEntry.id]) {
      entryRefs.current[lastEntry.id].scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [entries.length]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed right-0 w-80 pb-16 bg-background border-l border-border flex flex-col" style={{ marginTop: 0, height: `100%` }}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-ink">Incident Transcript</h3>
        <p className="text-sm text-muted-foreground">Real-time communication log</p>
      </div>

      {/* Transcript entries */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div ref={scrollRef} className="space-y-4">
          {entries.map((entry, i) => {
            const SpeakerIcon = getSpeakerIcon(entry.speaker);
            const isCurrentTime = Math.abs(timeToMinutes(entry.timestamp) - (currentTime + 14 * 60 + 30)) < 0.5;
            const isHighlighted = highlightedTranscriptId === entry.id;
            const isLast = i === entries.length - 1;
            
            return (
              <div
                key={entry.id}
                ref={el => (entryRefs.current[entry.id] = el)}
                className={
                  `group cursor-pointer p-3 rounded-lg border transition-all duration-200${isLast ? ' mb-16' : ''} ` +
                  (isHighlighted
                    ? 'bg-anthropicAccent1 border-anthropicAccent1 ring-2 ring-anthropicAccent1 shadow-lg'
                    : isCurrentTime
                      ? 'bg-sage/30 border-sage'
                      : 'bg-card hover:bg-muted/50 border-transparent hover:border-border')
                }
                onClick={() => {
                  const time = timeToMinutes(entry.timestamp) - (14 * 60 + 30);
                  onTimeClick(Math.max(0, time));
                  if (onTranscriptClick) onTranscriptClick(entry.id);
                }}
                tabIndex={0}
              >
                {/* Timestamp */}
                <div className="text-xs text-muted-foreground mb-2 font-medium">
                  {entry.timestamp}
                </div>
                
                {/* Speaker */}
                <div className="flex items-center gap-2 mb-2">
                  <SpeakerIcon className="w-3 h-3" />
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium border ${getDynamicSpeakerColor(entry.speaker)}`}
                  >
                    {entry.speaker}
                  </Badge>
                </div>
                
                {/* Message text */}
                <p className="text-sm text-foreground leading-relaxed">
                  {entry.text}
                </p>
                
                {/* Hover indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground mt-2">
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 pb-24 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground">
          <p className="mb-1">Keyboard shortcuts:</p>
          <p>• Press <kbd className="px-1 py-0.5 bg-background border border-border rounded text-xs">T</kbd> to toggle panel</p>
        </div>
      </div>
    </div>
  );
};