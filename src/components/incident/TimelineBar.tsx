import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SuggestionCard, SuggestionCardProps } from './SuggestionCard';

interface TranscriptEntryMarker {
  id: string;
  timestamp: string;
}

interface TimelineBarProps {
  currentTime: number;
  onTimeClick: (time: number) => void;
  suggestions: SuggestionCardProps['suggestion'][];
  transcriptEntries: TranscriptEntryMarker[];
  highlightedTranscriptId?: string;
  isPlaying: boolean;
}

// Helper: Convert timestamp to minutes
function timeToMinutes(timestamp: string) {
  const [hours, minutes, seconds] = timestamp.split(':').map(Number);
  return hours * 60 + minutes + seconds / 60;
}

// Helper: Render a transcript entry marker
function TranscriptMarker({ entry, position, isHighlighted }: { entry: { id: string }, position: number, isHighlighted: boolean }) {
  return (
    <div
      key={entry.id}
      className={`absolute w-3 h-3 rounded-full border-2 border-white bg-gray-400 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 z-10 ${isHighlighted ? 'ring-4 ring-primary scale-150 bg-primary shadow-lg' : ''}`}
      style={{ top: `${Math.max(0, Math.min(100, position))}%` }}
    />
  );
}

// Helper: Render a suggestion marker, connector, and card
function SuggestionNode({ suggestion, i, position, side, cardOffset, cardTop, onTimeClick }: any) {
  const markerColor =
    suggestion.category === 'sand' ? 'bg-anthropicAccent1' :
    suggestion.category === 'sage' ? 'bg-anthropicAccent2' :
    suggestion.category === 'lavender' ? 'bg-anthropicAccent3' :
    'bg-anthropicAccent1';
  return (
    <React.Fragment key={suggestion.id}>
      {/* Marker */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`absolute w-5 h-5 ${markerColor} border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg hover:scale-110 focus:scale-110 transition-all duration-150 outline-none focus:ring-2 focus:ring-primary z-20`}
              style={{ 
                top: `${position}%`,
                left: '50%'
              }}
              onClick={() => onTimeClick(timeToMinutes(suggestion.timestamp) - (14 * 60 + 30))}
              aria-label={`Jump to suggestion at ${suggestion.timestamp}`}
            />
          </TooltipTrigger>
          <TooltipContent side={side === 'left' ? 'left' : 'right'} className="bg-popover text-popover-foreground shadow-lg rounded-lg px-3 py-2">
            <p className="font-bold">{suggestion.timestamp}</p>
            <p className="text-xs text-muted-foreground">Jump to suggestion</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Connector line */}
      <div
        className={`absolute h-0.5 bg-anthropicAccent1 z-10`}
        style={{
          top: `calc(${position}% + 1px)`,
          left: side === 'left' ? 'calc(50% - 10px)' : '50%',
          width: `${cardOffset}px`,
          transform: side === 'left' ? 'translateX(-100%)' : 'none',
        }}
      />
      {/* Suggestion card */}
      <div
        className={`absolute z-30`}
        style={{
          top: cardTop,
          left: side === 'left' ? `calc(50% - ${cardOffset + 220}px)` : `calc(50% + ${cardOffset + 20}px)`,
          maxWidth: '260px',
          minWidth: '200px',
        }}
      >
        <SuggestionCard suggestion={suggestion} isFocused={false} onAccept={() => {}} onDismiss={() => {}} onFocus={() => {}} />
      </div>
    </React.Fragment>
  );
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  currentTime,
  onTimeClick,
  suggestions,
  transcriptEntries,
  highlightedTranscriptId,
  isPlaying
}) => {
  // Timeline start/end times (in minutes)
  const startTime = 14 * 60 + 30; // 14:30
  const endTime = 14 * 60 + 40;   // 14:40
  const totalDuration = endTime - startTime;
  
  // Current position as a percentage of the timeline
  const currentPosition = ((currentTime + startTime - startTime) / totalDuration) * 100;

  // Helper to check if handle is at start or end
  const isAtStart = currentPosition < 8; // within 8% of top
  const isAtEnd = currentPosition > 92;  // within 8% of bottom

  // Dynamic offset for current time label
  let currentTimeLabelStyle = {};
  if (isAtStart) {
    currentTimeLabelStyle = { top: '2.5rem' };
  } else if (isAtEnd) {
    currentTimeLabelStyle = { bottom: '2.5rem', top: 'auto' };
  } else {
    currentTimeLabelStyle = { top: '-2rem' };
  }

  // Render transcript entry markers
  const transcriptMarkers = transcriptEntries.map((entry) => {
    const entryTime = timeToMinutes(entry.timestamp);
    const position = ((entryTime - startTime) / totalDuration) * 100;
    const isHighlighted = entry.id === highlightedTranscriptId;
    return TranscriptMarker({ entry, position, isHighlighted });
  });

  // Render suggestion markers, cards, and connectors
  const suggestionNodes = suggestions.map((suggestion, i) => {
    const suggestionTime = timeToMinutes(suggestion.timestamp);
    const position = ((suggestionTime - startTime) / totalDuration) * 100;
    const side = i % 2 === 0 ? 'left' : 'right';
    const cardOffset = 120; // px from center
    const cardTop = `calc(${position}% - 32px)`;
    return SuggestionNode({ suggestion, i, position, side, cardOffset, cardTop, onTimeClick });
  });

  return (
    <div className="w-16 bg-anthropicBg border-r border-[#E0DED8] flex flex-col items-center py-8 relative shadow-md rounded-xl min-h-[400px]">
      {/* Timeline track */}
      <div className="relative h-full w-2 bg-anthropicAccent2 rounded-full mx-auto">
        {/* Transcript entry markers */}
        {transcriptMarkers}
        {/* Suggestion markers, connectors, and cards */}
        {suggestionNodes}

        {/* Current time handle */}
        <div
          className={`absolute w-5 h-5 bg-black border-4 border-anthropicAccent2 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md transition-all duration-200 cursor-pointer ${isPlaying ? 'ring-2 ring-green-400' : ''}`}
          style={{ 
            top: `${Math.max(0, Math.min(100, currentPosition))}%`,
            left: '50%'
          }}
          onClick={() => onTimeClick(currentTime)}
          aria-label="Current time handle"
        >
          {/* Current time label, always inside bar, never overlapping start/end */}
          <span
            className="absolute left-1/2 -translate-x-1/2 text-xs font-bold text-black bg-white/90 border border-[#E0DED8] rounded px-2 py-0.5 shadow-sm"
            style={currentTimeLabelStyle}
          >
            {Math.floor((currentTime + startTime) / 60)}:{String(Math.floor((currentTime + startTime) % 60)).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Start/End Time labels inside the bar */}
      <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-black bg-white/90 border border-[#E0DED8] rounded px-2 py-0.5 shadow-sm">
        14:30
      </span>
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-black bg-white/90 border border-[#E0DED8] rounded px-2 py-0.5 shadow-sm">
        14:40
      </span>
    </div>
  );
};