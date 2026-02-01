import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, Headphones, Upload } from "lucide-react";
import { toast } from "sonner";

interface AudioLink {
  title: string;
  file: File;
}

interface AudioLinksManagerProps {
  links: AudioLink[];
  onLinksChange: (links: AudioLink[]) => void;
}

export const AudioLinksManager = ({ links, onLinksChange }: AudioLinksManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newAudioTitle, setNewAudioTitle] = useState("");
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validação permissiva: aceita qualquer tipo audio/*, video/mp4, video/3gpp ou extensões comuns
      const isAudioMimeType = file.type.startsWith('audio/');
      const isVideoMp4 = file.type === 'video/mp4' || file.type === 'video/3gpp';
      const hasValidExtension = file.name.match(/\.(mp3|m4a|mp4|wav|ogg|webm|aac|3gp|3gpp|amr|flac|opus|wma|caf)$/i);
      
      if (!isAudioMimeType && !isVideoMp4 && !hasValidExtension) {
        toast.error("Por favor, selecione um arquivo de áudio válido");
        return;
      }
      
      setSelectedAudioFile(file);
      if (!newAudioTitle) {
        setNewAudioTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleAddAudio = () => {
    if (!selectedAudioFile) {
      toast.error("Selecione um arquivo de áudio");
      return;
    }

    if (!newAudioTitle.trim()) {
      toast.error("Digite um título para o áudio");
      return;
    }

    onLinksChange([...links, { title: newAudioTitle, file: selectedAudioFile }]);
    setNewAudioTitle("");
    setSelectedAudioFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Áudio adicionado!");
  };

  const handleRemoveAudio = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    onLinksChange(updatedLinks);
    toast.success("Áudio removido!");
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            Áudios Gravados ({links.length})
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4">
        {/* Lista de áudios */}
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link, index) => (
              <Card key={index} className="p-3 flex items-center gap-3">
                <Headphones className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{link.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.file.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemoveAudio(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Formulário */}
        <Card className="p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="audio-file">Arquivo de Áudio</Label>
            <Input
              ref={fileInputRef}
              id="audio-file"
              type="file"
              accept=".mp3,.m4a,.mp4,.wav,.ogg,.webm,.aac,.3gp,.flac,.opus,.wma,.caf,audio/*,video/mp4"
              onChange={handleFileSelect}
            />
            {selectedAudioFile && (
              <p className="text-xs text-muted-foreground">
                Selecionado: {selectedAudioFile.name}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="audio-title">Título do Áudio</Label>
            <Input
              id="audio-title"
              placeholder="Ex: Ensaio do coral"
              value={newAudioTitle}
              onChange={(e) => setNewAudioTitle(e.target.value)}
            />
          </div>
          
          <Button onClick={handleAddAudio} className="w-full" variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Áudio
          </Button>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
