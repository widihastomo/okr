import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Camera, Upload, X, Trash2, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate?: (newImageUrl: string | null) => void;
}

export function ProfileImageUpload({ currentImageUrl, onImageUpdate }: ProfileImageUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Helper function to get user initials
  const getUserInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      } else {
        return nameParts[0][0].toUpperCase();
      }
    }
    
    if (email) {
      return email[0].toUpperCase();
    }
    
    return 'U';
  };

  // Upload profile image mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);

      return await apiRequest('/api/profile/image', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary for FormData
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Berhasil',
        description: 'Foto profil berhasil diperbarui',
        variant: 'success'
      });
      
      // Update the profile image URL
      onImageUpdate?.(data.profileImageUrl);
      
      // Invalidate user queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Reset form state
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsOpen(false);
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: 'Gagal',
        description: error?.message || 'Gagal mengunggah foto profil',
        variant: 'destructive'
      });
    }
  });

  // Delete profile image mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/profile/image', {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Foto profil berhasil dihapus',
        variant: 'success'
      });
      
      // Update the profile image URL to null
      onImageUpdate?.(null);
      
      // Invalidate user queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      setShowDeleteConfirm(false);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast({
        title: 'Gagal',
        description: error?.message || 'Gagal menghapus foto profil',
        variant: 'destructive'
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'File Tidak Valid',
        description: 'Harap pilih file gambar (JPG, PNG, dll.)',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Terlalu Besar',
        description: 'Ukuran file maksimal 5MB',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsOpen(open);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <div className="relative group cursor-pointer">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage 
                src={currentImageUrl || undefined} 
                alt="Foto Profil"
                className="object-cover"
              />
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                {getUserInitials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            
            {/* Camera overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            
            {/* Edit badge */}
            <Badge className="absolute -bottom-1 -right-1 bg-orange-500 hover:bg-orange-600 text-white p-1 rounded-full border-2 border-white">
              <Camera className="w-3 h-3" />
            </Badge>
          </div>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              Ubah Foto Profil
            </DialogTitle>
            <DialogDescription>
              Unggah foto profil baru atau hapus foto yang ada. File maksimal 5MB.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current/Preview Image */}
            <div className="flex justify-center">
              <Avatar className="w-32 h-32 border-4 border-gray-200">
                <AvatarImage 
                  src={previewUrl || currentImageUrl || undefined}
                  alt="Preview" 
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                  {getUserInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* File Selection */}
            <Card>
              <CardContent className="pt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Pilih Gambar Baru
                </Button>
                
                {selectedFile && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        onClick={resetForm}
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {currentImageUrl && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="w-full sm:w-auto order-2 sm:order-1"
                disabled={uploadMutation.isPending || deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Foto
              </Button>
            )}
            
            <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="flex-1"
                disabled={uploadMutation.isPending}
              >
                Batal
              </Button>
              
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400"
              >
                {uploadMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengunggah...
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Unggah
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Foto Profil</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus foto profil? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}