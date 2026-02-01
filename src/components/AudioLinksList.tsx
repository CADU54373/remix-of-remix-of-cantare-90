import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Headphones, Play, Pause, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { MusicAudioLink } from "@/types";

interface AudioLinksListProps {
  links: MusicAudioLink[];
  onDelete?: (linkId: string) => void;
  showDelete?: boolean;
}

export const AudioLinksList = ({ links, onDelete, showDelete = false }: AudioLinksListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const [duration, setDuration] = useState<{ [key: string]: number }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Cleanup on unmount - MUST be before any early returns
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
      });
    };
  }, []);

  if (!links || links.length === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (linkId: string, audioUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!audioRefs.current[linkId]) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(prev => ({ ...prev, [linkId]: audio.currentTime }));
      });
      audio.addEventListener('loadedmetadata', () => {
        setDuration(prev => ({ ...prev, [linkId]: audio.duration }));
      });
      audio.addEventListener('ended', () => {
        setPlayingId(null);
        setCurrentTime(prev => ({ ...prev, [linkId]: 0 }));
      });
      audioRefs.current[linkId] = audio;
    }

    const audio = audioRefs.current[linkId];

    // Pausar outros áudios
    Object.entries(audioRefs.current).forEach(([id, a]) => {
      if (id !== linkId && !a.paused) {
        a.pause();
      }
    });

    if (playingId === linkId) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.play();
      setPlayingId(linkId);
    }
  };

  const handleSeek = (linkId: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRefs.current[linkId];
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * audio.duration;
  };

  return (
    <div className="mt-3 pt-3 border-t">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between h-7 px-2"
          >
            <span className="flex items-center gap-2 text-xs">
              <Headphones className="w-3 h-3" />
              <span className="font-medium">{links.length} {links.length === 1 ? 'áudio' : 'áudios'}</span>
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-2 mt-2">
          {links.map((link) => (
            <div
              key={link.id}
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-md bg-secondary/30 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
                  onClick={(e) => handlePlayPause(link.id, link.audioUrl, e)}
                >
                  {playingId === link.id ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3 ml-0.5" />
                  )}
                </Button>
                <span className="text-xs flex-1 truncate font-medium">{link.title}</span>
                {showDelete && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(link.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 h-1.5 bg-secondary rounded-full cursor-pointer"
                  onClick={(e) => handleSeek(link.id, e)}
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${duration[link.id] ? (currentTime[link.id] || 0) / duration[link.id] * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground min-w-[60px] text-right">
                  {formatTime(currentTime[link.id] || 0)} / {formatTime(duration[link.id] || 0)}
                </span>
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
