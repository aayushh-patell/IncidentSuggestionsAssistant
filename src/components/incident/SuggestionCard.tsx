import React, { useState } from 'react';
import { AlertTriangle, Lightbulb, Info, Pencil, X as LucideX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SuggestionCardProps {
  suggestion: {
    id: string;
    type: 'action' | 'root-cause' | 'trigger_event' | 'metadata';
    title: string;
    body?: string;
    timestamp: string;
    category: 'sand' | 'sage' | 'lavender';
  };
  isFocused: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  onFocus: () => void;
  animationDelay?: number;
  onEdit?: (id: string, title: string, body: string) => void;
  onCardClick?: (suggestion: SuggestionCardProps['suggestion']) => void;
}

export type { SuggestionCardProps };

// Helper to get icon for suggestion type
function getTypeIcon(type: 'action' | 'root-cause' | 'trigger_event' | 'metadata') {
  switch (type) {
    case 'action': return AlertTriangle;
    case 'root-cause': return Lightbulb;
    case 'trigger_event': return Pencil;
    case 'metadata': return Info;
    default: return Info;
  }
}

// Helper to get badge color for suggestion type
function getTypeBadgeColor(type: 'action' | 'root-cause' | 'trigger_event' | 'metadata') {
  switch (type) {
    case 'action': return 'bg-destructive text-destructive-foreground';
    case 'root-cause': return 'bg-amber-500 text-white';
    case 'trigger_event': return 'bg-purple-500 text-white';
    case 'metadata': return 'bg-blue-500 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
}

// Card background and border pastel version of tag color
function getTypePastelBackground(type: 'action' | 'root-cause' | 'trigger_event' | 'metadata') {
  switch (type) {
    case 'action': return 'bg-red-100 border-red-200';
    case 'root-cause': return 'bg-yellow-100 border-yellow-200';
    case 'trigger_event': return 'bg-purple-100 border-purple-200';
    case 'metadata': return 'bg-blue-100 border-blue-200';
    default: return 'bg-anthropicCard border-anthropicCard';
  }
}

function getTypePastelHighlight(type: 'action' | 'root-cause' | 'trigger_event' | 'metadata') {
  switch (type) {
    case 'action': return 'bg-red-200'; // deeper pastel red
    case 'root-cause': return 'bg-yellow-200'; // deeper pastel yellow
    case 'trigger_event': return 'bg-purple-200'; // deeper pastel purple
    case 'metadata': return 'bg-blue-200'; // deeper pastel blue
    default: return 'bg-anthropicCard';
  }
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  isFocused,
  onAccept,
  onDismiss,
  onFocus,
  animationDelay = 0,
  onEdit,
  onCardClick,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(suggestion.title);
  const [editBody, setEditBody] = useState(suggestion.body || '');

  const TypeIcon = getTypeIcon(suggestion.type);

  // Accept handler with pulse animation
  const handleAccept = () => {
    setIsAccepting(true);
    setTimeout(() => {
      onAccept();
    }, 300);
  };

  return (
    <Card
      className={
        `${getTypePastelBackground(suggestion.type)} rounded-xl shadow-md
        ${isFocused ? `${getTypePastelHighlight(suggestion.type)} shadow-lg` : 'shadow-md'}
        ${isAccepting ? 'animate-pulse-sage' : ''}
        transition-all duration-200 hover:shadow-lg hover:scale-[1.01] animate-fade-in cursor-pointer mb-4
        focus:outline-none focus:ring-2 focus:ring-primary
        group`
      }
      style={{ 
        animationDelay: `${animationDelay}ms`,
        width: '100%',
        minWidth: '360px',
        maxWidth: '520px',
      }}
      onClick={e => {
        if (!isEditing && onCardClick && !(e.target as HTMLElement).closest('button')) {
          onCardClick(suggestion);
        }
      }}
      onFocus={onFocus}
      tabIndex={0}
      aria-label={`Suggestion: ${suggestion.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onFocus();
        }
      }}
    >
      <CardContent className="p-6 relative">
        <Badge className={`text-xs font-bold px-3 py-1 inline-flex items-center gap-1 ${getTypeBadgeColor(suggestion.type)} drop-shadow-md`}>
          <TypeIcon className="w-4 h-4 mr-1" />
          {suggestion.type === 'action' ? 'Action Item' : 
            suggestion.type === 'root-cause' ? 'Root Cause' : 
            suggestion.type === 'trigger_event' ? 'Trigger Event' : 'Metadata'}
        </Badge>

        {/* Persistent edit and dismiss buttons in top-right */}
        {!isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="absolute top-3 right-10 text-muted-foreground hover:text-black transition-colors"
            aria-label="Edit suggestion"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute top-3 right-3 text-muted-foreground hover:text-black transition-colors"
          aria-label="Dismiss suggestion"
        >
          <LucideX className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="pt-10" style={{ minHeight: '80px' }}>
          <div className="flex items-center justify-between mb-3">
            {isEditing ? (
              <input
                className="text-xl font-black text-black pr-4 leading-tight truncate bg-transparent border border-[#E0DED8] rounded px-2 py-1 w-full max-w-xs mb-1 focus:outline-none focus:ring-2 focus:ring-primary"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <h3 className="text-xl font-bold text-black pr-4 leading-tight truncate" style={{ maxWidth: '340px' }}>{suggestion.title}</h3>
            )}
          </div>

          {isEditing ? (
            <textarea
              className="text-base text-black/80 mb-4 leading-relaxed bg-transparent border border-[#E0DED8] rounded px-2 py-1 w-full min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary"
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={3}
            />
          ) : (
            suggestion.body && (
              <p className="text-base text-muted-foreground mb-4 leading-relaxed">
              {suggestion.body}
            </p>
            )
          )}
          {isEditing && (
            <div className="flex gap-2 mt-2">
              <button
                className="bg-primary text-white px-3 py-1 rounded font-bold hover:bg-primary/90"
                onClick={e => {
                e.stopPropagation();
                  setIsEditing(false);
                  if (onEdit) onEdit(suggestion.id, editTitle, editBody);
              }}
              >
                Save
              </button>
              <button
                className="bg-muted text-black px-3 py-1 rounded font-bold hover:bg-muted/80"
                onClick={e => {
                e.stopPropagation();
                  setIsEditing(false);
                  setEditTitle(suggestion.title);
                  setEditBody(suggestion.body || '');
              }}
            >
                Cancel
              </button>
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};