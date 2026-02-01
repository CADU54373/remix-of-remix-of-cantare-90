import { useState, useEffect } from "react";
import { getFolders, getMusicFiles, addFolder, updateFolder, deleteFolder, addMusicFile, deleteMusicFile, addMusicVideoLink, deleteMusicVideoLink, addMusicAudioLink, deleteMusicAudioLink } from "@/lib/supabase-storage";
import { Folder, MusicFile, MusicVideoLink, MusicAudioLink } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderIcon, FileText, Plus, Trash2, ChevronRight, Home, Upload, Link as LinkIcon, Settings, Lock, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VideoLinksManager } from "@/components/VideoLinksManager";
import { VideoLinksList } from "@/components/VideoLinksList";
import { AudioLinksManager } from "@/components/AudioLinksManager";
import { AudioLinksList } from "@/components/AudioLinksList";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Musicas = () => {
  const { isAuthenticated } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<MusicFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterTempo, setFilterTempo] = useState<string>("todos");
  const [videoLinks, setVideoLinks] = useState<{ title: string; videoUrl: string }[]>([]);
  const [audioLinks, setAudioLinks] = useState<{ title: string; file: File }[]>([]);
  const [manageLinksDialogOpen, setManageLinksDialogOpen] = useState(false);
  const [selectedFileForLinks, setSelectedFileForLinks] = useState<MusicFile | null>(null);

  const requireAuth = (action: () => void, actionName: string) => {
    if (!isAuthenticated) {
      toast.error(`Você precisa fazer login para ${actionName}`);
      return;
    }
    action();
  };

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const [foldersData, filesData] = await Promise.all([
        getFolders(),
        getMusicFiles()
      ]);
      setFolders(foldersData);
      setFiles(filesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    }
  };

  const getBreadcrumb = (): Folder[] => {
    const breadcrumb: Folder[] = [];
    let current = folders.find((f) => f.id === currentFolderId);
    
    while (current) {
      breadcrumb.unshift(current);
      current = folders.find((f) => f.id === current!.parentId);
    }
    
    return breadcrumb;
  };

  const getFilteredFolders = () => {
    let filtered = folders.filter((f) => f.parentId === currentFolderId);

    if (filterTempo !== "todos") {
      filtered = filtered.filter(
        (f) => f.id === filterTempo || f.parentId === filterTempo || f.id.startsWith(filterTempo)
      );
    }

    return filtered;
  };

  const getCurrentFiles = () => {
    if (!currentFolderId) return [];
    return files.filter((f) => f.folderId === currentFolderId);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Digite um nome para a pasta");
      return;
    }

    try {
      await addFolder({
        name: newFolderName,
        parentId: currentFolderId,
      });

      await refreshData();
      setNewFolderName("");
      setNewFolderDialogOpen(false);
      toast.success("Pasta criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar pasta:", error);
      toast.error("Erro ao criar pasta");
    }
  };

  const handleOpenEditFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderDialogOpen(true);
  };

  const handleUpdateFolder = async () => {
    if (!editFolderName.trim()) {
      toast.error("Digite um nome para a pasta");
      return;
    }

    if (!editingFolder) return;

    try {
      await updateFolder(editingFolder.id, editFolderName);
      await refreshData();
      setEditFolderName("");
      setEditingFolder(null);
      setEditFolderDialogOpen(false);
      toast.success("Pasta renomeada com sucesso!");
    } catch (error) {
      console.error("Erro ao renomear pasta:", error);
      toast.error("Erro ao renomear pasta");
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (confirm(`Deseja realmente excluir a pasta "${folderName}"? Todos os arquivos e subpastas também serão excluídos.`)) {
      try {
        await deleteFolder(folderId);
        await refreshData();
        toast.success("Pasta excluída com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir pasta:", error);
        toast.error("Erro ao excluir pasta");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos PDF são permitidos");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || !currentFolderId) {
      toast.error("Selecione um arquivo e uma pasta");
      return;
    }

    try {
      const newFile = await addMusicFile({
        name: selectedFile.name,
        folderId: currentFolderId,
        fileData: '', // Será preenchido pelo Supabase
        uploadedBy: 'Usuário Atual',
      }, selectedFile);

      // Adicionar links de vídeo se houver
      if (videoLinks.length > 0) {
        await Promise.all(
          videoLinks.map(link =>
            addMusicVideoLink({
              musicFileId: newFile.id,
              title: link.title,
              videoUrl: link.videoUrl,
              createdBy: 'Usuário Atual',
            })
          )
        );
      }

      // Adicionar áudios gravados se houver
      if (audioLinks.length > 0) {
        await Promise.all(
          audioLinks.map(audio =>
            addMusicAudioLink({
              musicFileId: newFile.id,
              title: audio.title,
              audioUrl: '', // Será preenchido pelo storage
              createdBy: 'Usuário Atual',
            }, audio.file)
          )
        );
      }

      await refreshData();
      setSelectedFile(null);
      setVideoLinks([]);
      setAudioLinks([]);
      setUploadDialogOpen(false);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      toast.error("Erro ao enviar arquivo");
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (confirm(`Deseja realmente excluir o arquivo "${fileName}"?`)) {
      try {
        await deleteMusicFile(fileId);
        await refreshData();
        toast.success("Arquivo excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir arquivo:", error);
        toast.error("Erro ao excluir arquivo");
      }
    }
  };

  const handleClearFilters = () => {
    setFilterTempo("todos");
  };

  const handleOpenFile = (fileUrl: string) => {
    try {
      const newTab = window.open(fileUrl, "_blank", "noopener,noreferrer");
      if (!newTab) {
        toast.error("Pop-up bloqueado. Permita pop-ups para este site.");
      }
    } catch (err) {
      console.error("Erro ao abrir PDF diretamente:", err);
      toast.error("Não foi possível abrir o PDF.");
    }
  };

  const handleOpenManageLinks = (file: MusicFile, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFileForLinks(file);
    setManageLinksDialogOpen(true);
  };

  const handleAddLinkToExistingFile = async (title: string, videoUrl: string) => {
    if (!selectedFileForLinks) return;

    try {
      await addMusicVideoLink({
        musicFileId: selectedFileForLinks.id,
        title,
        videoUrl,
        createdBy: 'Usuário Atual',
      });
      await refreshData();
      toast.success("Link adicionado!");
    } catch (error) {
      console.error("Erro ao adicionar link:", error);
      toast.error("Erro ao adicionar link");
    }
  };

  const handleDeleteLinkFromFile = async (linkId: string) => {
    try {
      await deleteMusicVideoLink(linkId);
      await refreshData();
      toast.success("Link removido!");
    } catch (error) {
      console.error("Erro ao remover link:", error);
      toast.error("Erro ao remover link");
    }
  };

  const handleAddAudioToExistingFile = async (title: string, file: File) => {
    if (!selectedFileForLinks) return;

    try {
      await addMusicAudioLink({
        musicFileId: selectedFileForLinks.id,
        title,
        audioUrl: '',
        createdBy: 'Usuário Atual',
      }, file);
      await refreshData();
      toast.success("Áudio adicionado!");
    } catch (error) {
      console.error("Erro ao adicionar áudio:", error);
      toast.error("Erro ao adicionar áudio");
    }
  };

  const handleDeleteAudioFromFile = async (linkId: string) => {
    try {
      await deleteMusicAudioLink(linkId);
      await refreshData();
      toast.success("Áudio removido!");
    } catch (error) {
      console.error("Erro ao remover áudio:", error);
      toast.error("Erro ao remover áudio");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Músicas</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Organize e acesse as músicas do ministério
          </p>
        </div>
        
        {!isAuthenticated && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Faça login para adicionar músicas
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => requireAuth(() => setNewFolderDialogOpen(true), "criar pastas")}
            variant="outline"
            disabled={!isAuthenticated}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Pasta
          </Button>
          {currentFolderId && (
            <Button 
              onClick={() => requireAuth(() => setUploadDialogOpen(true), "fazer upload")}
              disabled={!isAuthenticated}
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            <Label>Tempo Litúrgico</Label>
            <Select value={filterTempo} onValueChange={setFilterTempo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="tempo-comum">Tempo Comum</SelectItem>
                <SelectItem value="tempo-pascal">Tempo Pascal</SelectItem>
                <SelectItem value="advento">Advento</SelectItem>
                <SelectItem value="quaresma">Quaresma</SelectItem>
                <SelectItem value="natal">Natal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline" 
            onClick={handleClearFilters}
            className="w-full sm:w-auto"
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentFolderId(null)}
          className="h-8 flex-shrink-0"
        >
          <Home className="w-4 h-4" />
        </Button>
        {getBreadcrumb().map((folder, idx) => (
          <div key={folder.id} className="flex items-center gap-2 flex-shrink-0">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFolderId(folder.id)}
              className="h-8 text-xs sm:text-sm"
            >
              {folder.name}
            </Button>
          </div>
        ))}
      </div>

      {/* Pastas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {getFilteredFolders().map((folder) => (
          <Card
            key={folder.id}
            className="p-3 sm:p-4 hover-lift cursor-pointer group relative"
            onClick={() => setCurrentFolderId(folder.id)}
          >
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-smooth z-10">
              {isAuthenticated && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur"
                    onClick={(e) => handleOpenEditFolder(folder, e)}
                    title="Editar pasta"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive bg-background/80 backdrop-blur"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id, folder.name);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <p className="font-medium text-sm sm:text-base line-clamp-2">{folder.name}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Arquivos */}
      {currentFolderId && getCurrentFiles().length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Arquivos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {getCurrentFiles().map((file) => (
              <Card key={file.id} className="p-3 sm:p-4 hover-lift group relative">
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-smooth z-10">
                  {isAuthenticated && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-8 sm:w-8 bg-background/80 backdrop-blur"
                        onClick={(e) => handleOpenManageLinks(file, e)}
                        title="Gerenciar links"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-8 sm:w-8 text-destructive bg-background/80 backdrop-blur"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteFile(file.id, file.name);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                
                <a
                  href={file.fileData}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="block"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base line-clamp-2 mb-1">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </a>
                
                <VideoLinksList links={file.videoLinks || []} />
                <AudioLinksList links={file.audioLinks || []} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentFolderId && getFilteredFolders().length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <FolderIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">Nenhuma pasta encontrada</p>
        </Card>
      )}

      {currentFolderId && getCurrentFiles().length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground mb-4">Esta pasta está vazia</p>
          
          {!isAuthenticated && (
            <Alert className="mb-4 max-w-md mx-auto text-left">
              <Lock className="h-4 w-4" />
              <AlertTitle className="text-sm">Visitante</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                Faça login para adicionar arquivos. Caso tenha alguma sugestão de música a ser inserida, por gentileza enviar ao grupo do WhatsApp.
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={() => requireAuth(() => setUploadDialogOpen(true), "fazer upload")}
            disabled={!isAuthenticated}
            title={!isAuthenticated ? "Login necessário para adicionar arquivos" : ""}
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Adicionar Arquivo
          </Button>
        </Card>
      )}

      {/* Dialog Nova Pasta */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Crie uma nova pasta para organizar suas músicas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nome da Pasta</Label>
              <Input
                id="folder-name"
                placeholder="Ex: Músicas de Natal"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder}>Criar Pasta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Pasta */}
      <Dialog open={editFolderDialogOpen} onOpenChange={setEditFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pasta</DialogTitle>
            <DialogDescription>
              Altere o nome da pasta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Nome da Pasta</Label>
              <Input
                id="edit-folder-name"
                placeholder="Ex: Músicas de Natal"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFolderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateFolder}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload de PDF</DialogTitle>
            <DialogDescription>
              Adicione um arquivo PDF de música, links de vídeo e áudios gravados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo PDF</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>

            <VideoLinksManager links={videoLinks} onLinksChange={setVideoLinks} />
            <AudioLinksManager links={audioLinks} onLinksChange={setAudioLinks} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              setVideoLinks([]);
              setAudioLinks([]);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUploadFile} disabled={!selectedFile}>
              Fazer Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Gerenciar Links */}
      <Dialog open={manageLinksDialogOpen} onOpenChange={setManageLinksDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Vídeos e Áudios</DialogTitle>
            <DialogDescription>
              {selectedFileForLinks?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Links de vídeo existentes */}
            {selectedFileForLinks?.videoLinks && selectedFileForLinks.videoLinks.length > 0 && (
              <div className="space-y-2">
                <Label>Links de Vídeo</Label>
                {selectedFileForLinks.videoLinks.map((link) => (
                  <Card key={link.id} className="p-3 flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{link.title}</p>
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
                      onClick={() => handleDeleteLinkFromFile(link.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {/* Áudios existentes */}
            {selectedFileForLinks?.audioLinks && selectedFileForLinks.audioLinks.length > 0 && (
              <div className="space-y-2">
                <Label>Áudios Gravados</Label>
                <AudioLinksList 
                  links={selectedFileForLinks.audioLinks} 
                  onDelete={handleDeleteAudioFromFile}
                  showDelete={true}
                />
              </div>
            )}

            {/* Adicionar novo link */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Adicionar Novo Vídeo</Label>
              <VideoLinksManager
                links={[]}
                onLinksChange={(links) => {
                  if (links.length > 0) {
                    const newLink = links[links.length - 1];
                    handleAddLinkToExistingFile(newLink.title, newLink.videoUrl);
                  }
                }}
              />
            </div>

            {/* Adicionar novo áudio */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Adicionar Novo Áudio</Label>
              <AudioLinksManager
                links={[]}
                onLinksChange={(links) => {
                  if (links.length > 0) {
                    const newAudio = links[links.length - 1];
                    handleAddAudioToExistingFile(newAudio.title, newAudio.file);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setManageLinksDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Musicas;
