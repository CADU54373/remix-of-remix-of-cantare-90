import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Youtube, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useState } from "react";
import { MusicVideoLink } from "@/types";

interface VideoLinksListProps {
  links: MusicVideoLink[];
}

export const VideoLinksList = ({ links }: VideoLinksListProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!links || links.length === 0) {
    return null;
  }

  const getVideoIcon = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return <Youtube className="w-3 h-3" />;
    }
    return <LinkIcon className="w-3 h-3" />;
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
              <LinkIcon className="w-3 h-3" />
              <span className="font-medium">{links.length} {links.length === 1 ? 'vídeo' : 'vídeos'}</span>
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-1.5 mt-2">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 p-2 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors group"
            >
              {getVideoIcon(link.videoUrl)}
              <span className="text-xs flex-1 truncate font-medium">{link.title}</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
