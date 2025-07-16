import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, ChevronRight, ChevronLeft, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineBar } from '@/components/incident/TimelineBar';
import { SuggestionCard } from '@/components/incident/SuggestionCard';
import { TranscriptPanel } from '@/components/incident/TranscriptPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Suggestion {
  id: string;
  type: 'action' | 'root-cause' | 'trigger_event' | 'metadata';
  title: string;
  body?: string;
  timestamp: string;
  category: 'sand' | 'sage' | 'lavender';
  transcriptMessageId: string;
}

interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
}

const CARD_WIDTH = 360;
const CARD_HEIGHT = 140;
const CARD_VERTICAL_GAP = 48;
const CARD_OFFSET = 200;
const CONNECTOR_WIDTH = 120;
const STAGGER_OFFSET = 0;
const SIDEBAR_WIDTH = 320;

// Helper: Map transcript messages from API data
function mapTranscriptEntries(data: any): TranscriptEntry[] {
  return (data.transcript_messages || []).map((msg: any) => ({
    id: String(msg.id),
    timestamp: msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : '',
    speaker: msg.speaker || 'System',
    text: msg.content || '',
  }));
}

// Helper: Map suggestions from API data
function mapSuggestions(data: any): Suggestion[] {
  let suggestions: Suggestion[] = [];
  (data.transcript_messages || []).forEach((msg: any) => {
    if (msg.suggestions && msg.suggestions.length > 0) {
      suggestions.push(...msg.suggestions.map((s: any) => {
        let type: Suggestion['type'];
        let category: Suggestion['category'];
        switch (s.suggestion_type) {
          case 'action_item':
            type = 'action';
            category = 'sand';
            break;
          case 'trigger_event':
            type = 'trigger_event';
            category = 'lavender';
            break;
          case 'root_cause':
            type = 'root-cause';
            category = 'sage';
            break;
          case 'metadata':
          default:
            type = 'metadata';
            category = 'sage';
        }
        return {
          id: String(s.id),
          type,
          title: s.title || '',
          body: s.description || s.content || '',
          timestamp: s.created_at ? new Date(s.created_at).toLocaleTimeString() : '',
          category,
          transcriptMessageId: String(msg.id),
        };
      }));
    }
  });
  // Sort by transcriptMessageId (or timestamp)
  suggestions.sort((a, b) => {
    const idA = parseInt(a.transcriptMessageId, 10);
    const idB = parseInt(b.transcriptMessageId, 10);
    if (!isNaN(idA) && !isNaN(idB)) {
      return idA - idB;
    }
    return (a.timestamp || '').localeCompare(b.timestamp || '');
  });
  return suggestions;
}

const IncidentAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [highlightedTranscriptId, setHighlightedTranscriptId] = useState<string | null>(null);
  const [focusedSuggestion, setFocusedSuggestion] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState<Suggestion | null>(null);
  const [incidentTitle, setIncidentTitle] = useState('');
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState<number | null>(null);
  const [hasIngested, setHasIngested] = useState(false);

  // Initialize as empty arrays
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);

  // For scrolling to suggestion cards
  const suggestionCardRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 't':
          setTranscriptOpen(!transcriptOpen);
          break;
        case 'a':
          if (focusedSuggestion) {
            // Accept suggestion (implement as needed)
          }
          break;
        case 'd':
          if (focusedSuggestion) {
            // Dismiss suggestion (implement as needed)
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, transcriptOpen, focusedSuggestion]);

  // Auto-focus new suggestions
  useEffect(() => {
    if (suggestions.length > 0) {
      setFocusedSuggestion(suggestions[suggestions.length - 1].id);
    }
  }, [suggestions.length]);

  // Fetch incident data
  useEffect(() => {
    if (!id) return;
    fetch(`/api/incidents/${id}`)
      .then(res => res.json())
      .then(data => {
        setIncidentTitle(data.title || '');
        setTranscriptEntries(mapTranscriptEntries(data));
        setSuggestions(mapSuggestions(data));
      });
  }, [id]);

  // Play/Pause handler
  const handlePlayPause = async () => {
    setIsPlaying((prev) => !prev); // Toggle immediately for UI responsiveness
    if (!isPlaying && !hasIngested && id) {
      await fetch('/api/transcript_messages/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: id })
      });
      setHasIngested(true);
    }
  };

  // Poll for updates when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      fetch(`/api/incidents/${id}`)
        .then(res => res.json())
        .then(data => {
          setTranscriptEntries(mapTranscriptEntries(data));
          setSuggestions(mapSuggestions(data));
        });
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, id]);

  useEffect(() => {
    if (timelineContainerRef.current) {
      setTimelineWidth(timelineContainerRef.current.offsetWidth);
    }
  }, [suggestions.length, transcriptOpen]);

  // Timeline click handler
  const handleTimelineClick = (time: number) => {
    setCurrentTime(time);
  };

  // Suggestion edit handlers
  const handleEdit = (suggestion: Suggestion) => {
    setEditingSuggestionId(suggestion.id);
    setEditedBody(suggestion.body);
  };
  const handleEditSave = (suggestion: Suggestion) => {
    setSuggestions(suggestions.map(s => s.id === suggestion.id ? { ...s, body: editedBody } : s));
    setEditingSuggestionId(null);
  };
  const handleEditCancel = () => {
    setEditingSuggestionId(null);
  };

  // Suggestion delete handlers
  const handleDelete = (suggestion: Suggestion) => {
    setSuggestionToDelete(suggestion);
    setShowDeleteDialog(true);
  };
  const confirmDelete = () => {
    if (suggestionToDelete) {
      setSuggestions(suggestions.filter(s => s.id !== suggestionToDelete.id));
      // TODO: send DELETE to backend if needed
    }
    setShowDeleteDialog(false);
    setSuggestionToDelete(null);
  };
  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setSuggestionToDelete(null);
  };

  // Handler: When a transcript message is clicked, scroll to its suggestion (if any)
  const handleTranscriptClick = (transcriptId: string) => {
    const suggestion = suggestions.find(s => s.transcriptMessageId === transcriptId);
    if (suggestion) {
      setFocusedSuggestion(suggestion.id);
      setHighlightedTranscriptId(transcriptId);
    } else {
      setHighlightedTranscriptId(transcriptId);
    }
  };

  // Scroll to focused suggestion card
  useEffect(() => {
    if (focusedSuggestion && suggestionCardRefs.current[focusedSuggestion]) {
      suggestionCardRefs.current[focusedSuggestion].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedSuggestion]);

  // Layout calculations
  const lastY =
    suggestions.length > 0
      ? (suggestions.length - 1) * 220 + ((suggestions.length - 1) % 2 === 1 ? 40 : 0) + 60
      : 100;
  const lastCardBottom = lastY + CARD_HEIGHT;
  const extraSpace = 64;

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col p-0">
        {/* Header/navbar always visible at top, width matches timeline/cards container */}
        <header className="border-b border-border bg-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-ink">{incidentTitle || 'Incident Analysis'}</h1>
                <p className="text-muted-foreground mt-1">AI-powered incident analysis and response</p>
              </div>
              <div className="flex gap-4 items-center">
                {/* Dashboard */}
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="font-medium rounded-md px-4 py-2 text-base flex items-center gap-2 shadow-sm hover:bg-black hover:text-white border-border"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Dashboard
                </Button>
                {/* Show/Hide Transcript */}
                <Button
                  variant="outline"
                  onClick={() => setTranscriptOpen((open) => !open)}
                  className="font-medium rounded-md px-4 py-2 text-base flex items-center gap-2 shadow-sm hover:bg-black hover:text-white border-border"
                  aria-label={transcriptOpen ? 'Hide sidebar' : 'Show sidebar'}
                >
                  {transcriptOpen ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                  <span className="ml-1 text-base font-medium">
                    {transcriptOpen ? 'Hide' : 'Show'}
                  </span>
                </Button>
                {/* 3. Play/Pause */}
                <Button
                  variant="default"
                  onClick={handlePlayPause}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md px-4 py-2 text-base flex items-center gap-2 shadow-sm"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </header>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-row w-full transition-all duration-300">
          {/* Timeline and cards, always centered in available space, with extra top padding */}
          <div className="flex-1 flex flex-col items-center" style={{ paddingTop: 32, transition: 'transform 0.3s' }}>
            {/* Show sad face and message if not playing */}
            {!isPlaying ? (
              <div className="flex flex-col items-center justify-center h-full w-full text-center text-muted-foreground" style={{ minHeight: 400 }}>
                <div style={{ fontSize: 80, marginBottom: 16 }}>:(</div>
                <div className="text-lg font-medium">Press <span className="font-bold">Play</span> to begin analysis</div>
              </div>
            ) : (
              <div
                ref={timelineContainerRef}
                className="relative"
                style={{
                  width: 900,
                  minHeight: `${lastCardBottom + extraSpace}px`,
                  margin: '0 auto',
                  transition: 'width 0.3s',
                }}
              >
                {/* Timeline: continuous vertical line */}
                <div className="absolute left-1/2 top-0 w-1 bg-anthropicAccent2 rounded-full" style={{ height: `${lastY}px` }} />
                {suggestions.map((suggestion, i) => {
                  const isLeft = i % 2 === 0;
                  const baseY = i * 220;
                  const stagger = isLeft ? 0 : 40;
                  const y = baseY + stagger;
                  const CARD_OFFSET_FROM_CENTER = 200;
                  const isLast = i === suggestions.length - 1;
                  const transcript = transcriptEntries.find(t => t.id === suggestion.transcriptMessageId);
                  return (
                    <React.Fragment key={suggestion.id}>
                      {/* Timestamp label: left of timeline for left cards, right for right cards */}
                      {transcript && (
                        <div
                          className="absolute text-xs text-muted-foreground mb-2 font-medium"
                          style={{
                            top: y + 36,
                            left: isLeft ? 'auto' : 'calc(50% + 16px)',
                            right: isLeft ? 'calc(50% + 16px)' : 'auto',
                            textAlign: isLeft ? 'right' : 'left',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {transcript.timestamp}
                        </div>
                      )}
                      {/* Connector line from center timeline to card */}
                      <div
                        className="absolute"
                        style={{
                          top: y + 60,
                          left: '50%',
                          width: CARD_OFFSET_FROM_CENTER,
                          height: 2,
                          background: 'rgba(0,0,0,0.07)',
                          transform: isLeft ? 'translateX(-100%)' : 'none',
                          zIndex: 1,
                        }}
                      />
                      {/* Timeline marker */}
                      <div
                        className="absolute w-4 h-4 rounded-full bg-primary border-2 border-white z-10"
                        style={{
                          top: y + 60,
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                      {/* Suggestion card */}
                      <div
                        ref={el => (suggestionCardRefs.current[suggestion.id] = el)}
                        className={`absolute${isLast ? ' mb-16' : ''}`}
                        style={{
                          top: y,
                          width: CARD_WIDTH,
                          zIndex: 2,
                          left: isLeft ? `calc(50% - ${CARD_OFFSET_FROM_CENTER + CARD_WIDTH}px)` : undefined,
                          right: !isLeft ? `calc(50% - ${CARD_OFFSET_FROM_CENTER + CARD_WIDTH}px)` : undefined,
                        }}
                      >
                        <SuggestionCard
                          suggestion={suggestion}
                          isFocused={focusedSuggestion === suggestion.id}
                          onAccept={() => {}}
                          onDismiss={() => handleDelete(suggestion)}
                          onFocus={() => setFocusedSuggestion(suggestion.id)}
                          animationDelay={i * 100}
                          onEdit={(id, title, body) => {
                            setSuggestions(suggestions.map(s => s.id === id ? { ...s, title, body } : s));
                          }}
                          onCardClick={() => {
                            setHighlightedTranscriptId(suggestion.transcriptMessageId);
                            setTranscriptOpen(true);
                          }}
                        />
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
          {/* Sidebar, only rendered if open */}
          {transcriptOpen && (
            <div className="min-w-[320px] ml-0" style={{ marginTop: 0 }}>
              <TranscriptPanel
                isOpen={transcriptOpen}
                entries={transcriptEntries}
                currentTime={currentTime}
                onTimeClick={handleTimelineClick}
                onEntryHover={setHighlightedTranscriptId}
                highlightedTranscriptId={highlightedTranscriptId}
                onTranscriptClick={handleTranscriptClick}
              />
            </div>
          )}
        </div>
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove suggestion?</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to remove this suggestion? This cannot be undone.</p>
            <DialogFooter>
              <Button variant="destructive" onClick={confirmDelete}>Remove</Button>
              <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default IncidentAnalysis;