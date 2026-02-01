import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, Link as LinkIcon, Youtube } from "lucide-react";
import { toast } from "sonner";

interface VideoLink {
  title: string;
  videoUrl: string;
}

interface VideoLinksManagerProps {
  links: VideoLink[];
  onLinksChange: (links: VideoLink[]) => void;
}

export const VideoLinksManager = ({ links, onLinksChange }: VideoLinksManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) {
      toast.error("Digite o link do vídeo");
      return;
    }

    // Validação básica de URL
    try {
      new URL(newLinkUrl);
    } catch {
      toast.error("URL inválida. Digite um link completo (ex: https://...)");
      return;
    }

    onLinksChange([...links, { title: "Vídeo", videoUrl: newLinkUrl }]);
    setNewLinkUrl("");
    toast.success("Link adicionado!");
  };

  const handleRemoveLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    onLinksChange(updatedLinks);
    toast.success("Link removido!");
  };

  const getVideoIcon = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return <Youtube className="w-4 h-4 text-red-500" />;
    }
    return <LinkIcon className="w-4 h-4 text-primary" />;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Links de Vídeos ({links.length})
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4">
        {/* Lista de links existentes */}
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link, index) => (
              <Card key={index} className="p-3 flex items-center gap-3">
                {getVideoIcon(link.videoUrl)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{link.title}</p>
                  <a
                    href={link.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block"
                  >
                    {link.videoUrl}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemoveLink(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Formulário para adicionar novo link */}
        <Card className="p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="link-url">Link do Vídeo</Label>
            <Input
              id="link-url"
              placeholder="https://youtube.com/..."
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
            />
          </div>
          
          <Button onClick={handleAddLink} className="w-full" variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Link
          </Button>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
