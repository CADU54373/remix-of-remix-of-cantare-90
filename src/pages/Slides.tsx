import { useState, useEffect } from "react";
import { getSlideFolders, getSlideFiles, addSlideFolder, updateSlideFolder, deleteSlideFolder, addSlideFile, deleteSlideFile } from "@/lib/supabase-storage";
import { SlideFolder, SlideFile } from "@/types";
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
import { FolderIcon, Presentation, Plus, Trash2, ChevronRight, Home, Upload, Lock, Edit, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Slides = () => {
  const { isAuthenticated } = useAuth();
  const [folders, setFolders] = useState<SlideFolder[]>([]);
  const [files, setFiles] = useState<SlideFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<SlideFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
        getSlideFolders(),
        getSlideFiles()
      ]);
      setFolders(foldersData);
      setFiles(filesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    }
  };

  const getBreadcrumb = (): SlideFolder[] => {
    const breadcrumb: SlideFolder[] = [];
    let current = folders.find((f) => f.id === currentFolderId);
    
    while (current) {
      breadcrumb.unshift(current);
      current = folders.find((f) => f.id === current!.parentId);
    }
    
    return breadcrumb;
  };

  const getFilteredFolders = () => {
    return folders.filter((f) => f.parentId === currentFolderId);
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
      await addSlideFolder({
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

  const handleOpenEditFolder = (folder: SlideFolder, e: React.MouseEvent) => {
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
      await updateSlideFolder(editingFolder.id, editFolderName);
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
        await deleteSlideFolder(folderId);
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
      const allowedTypes = [
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.oasis.opendocument.presentation"
      ];
      const allowedExtensions = [".ppt", ".pptx", ".odp"];
      
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast.error("Apenas arquivos PowerPoint (PPT, PPTX) ou ODP são permitidos");
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
      await addSlideFile({
        name: selectedFile.name,
        folderId: currentFolderId,
        uploadedBy: 'Usuário Atual',
      }, selectedFile);

      await refreshData();
      setSelectedFile(null);
      setUploadDialogOpen(false);
      toast.success("Slide enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      toast.error("Erro ao enviar arquivo");
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (confirm(`Deseja realmente excluir o arquivo "${fileName}"?`)) {
      try {
        await deleteSlideFile(fileId);
        await refreshData();
        toast.success("Arquivo excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir arquivo:", error);
        toast.error("Erro ao excluir arquivo");
      }
    }
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Slides</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Organize e acesse as apresentações do ministério
          </p>
        </div>
        
        {!isAuthenticated && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Faça login para adicionar slides
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
              Upload Slide
            </Button>
          )}
        </div>
      </div>

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
        {getBreadcrumb().map((folder) => (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-8 sm:w-8 bg-background/80 backdrop-blur"
                    onClick={() => handleDownloadFile(file.fileUrl, file.name)}
                    title="Baixar arquivo"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {isAuthenticated && (
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
                  )}
                </div>
                
                <div 
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => handleDownloadFile(file.fileUrl, file.name)}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Presentation className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base line-clamp-2 mb-1">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
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
          <Presentation className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground mb-4">Esta pasta está vazia</p>
          
          {!isAuthenticated && (
            <Alert className="mb-4 max-w-md mx-auto text-left">
              <Lock className="h-4 w-4" />
              <AlertTitle className="text-sm">Visitante</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                Faça login para adicionar arquivos de slides.
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
            Adicionar Slide
          </Button>
        </Card>
      )}

      {/* Dialog Nova Pasta */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Crie uma nova pasta para organizar seus slides
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nome da Pasta</Label>
              <Input
                id="folder-name"
                placeholder="Ex: Slides de Natal"
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
                placeholder="Ex: Slides de Natal"
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
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de Slide</DialogTitle>
            <DialogDescription>
              Adicione um arquivo PowerPoint (PPT, PPTX) ou ODP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo de Apresentação</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".ppt,.pptx,.odp"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFile(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUploadFile} disabled={!selectedFile}>
              Fazer Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Slides;
