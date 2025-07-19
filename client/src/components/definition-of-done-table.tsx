import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DefinitionOfDoneItem, InsertDefinitionOfDoneItem } from '@shared/schema';

interface DefinitionOfDoneTableProps {
  items: LocalDoD[];
  onItemsChange: (items: LocalDoD[]) => void;
  isLoading?: boolean;
  canEdit?: boolean;
  mode?: 'form' | 'database'; // 'form' for input mode, 'database' for saved items
}

interface LocalDoD {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  order: number;
  isNew?: boolean;
  isEditing?: boolean;
}

export function DefinitionOfDoneTable({ 
  items, 
  onItemsChange, 
  isLoading = false, 
  canEdit = true,
  mode = 'form'
}: DefinitionOfDoneTableProps) {
  const [localItems, setLocalItems] = useState<LocalDoD[]>(items || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Update local items when items prop changes
  useEffect(() => {
    setLocalItems(items || []);
  }, [items]);

  // Add new item
  const addNewItem = () => {
    const newItem: LocalDoD = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      isCompleted: false,
      order: localItems.length,
      isNew: true,
      isEditing: true
    };
    setLocalItems(prev => [...prev, newItem]);
    setEditingId(newItem.id);
  };

  // Save item (new or edited)
  const saveItem = (id: string, title: string, description: string) => {
    if (!title.trim()) return;

    const updatedItems = localItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          title: title.trim(),
          description: description.trim(),
          isNew: false,
          isEditing: false
        };
      }
      return item;
    });

    setLocalItems(updatedItems);
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    onItemsChange(updatedItems);
  };

  // Cancel edit
  const cancelEdit = (id: string) => {
    const item = localItems.find(item => item.id === id);
    if (item?.isNew) {
      // Remove new item if cancelled
      setLocalItems(prev => prev.filter(item => item.id !== id));
    } else {
      // Revert to original values
      setLocalItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, isEditing: false }
          : item
      ));
    }
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  // Delete item
  const deleteItem = (id: string) => {
    const updatedItems = localItems.filter(item => item.id !== id);
    setLocalItems(updatedItems);
    onItemsChange(updatedItems);
  };

  // Toggle completion (only for database mode)
  const toggleCompletion = (id: string) => {
    if (mode === 'form') return; // No completion toggling in form mode
    
    const updatedItems = localItems.map(item => 
      item.id === id 
        ? { ...item, isCompleted: !item.isCompleted }
        : item
    );
    setLocalItems(updatedItems);
    onItemsChange(updatedItems);
  };

  // Start editing
  const startEdit = (id: string) => {
    const item = localItems.find(item => item.id === id);
    if (item) {
      setEditTitle(item.title);
      setEditDescription(item.description);
    }
    setEditingId(id);
    setLocalItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, isEditing: true }
        : item
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Definition of Done ({localItems.length})
        </h3>
        {canEdit && (
          <Button
            type="button"
            onClick={addNewItem}
            size="sm"
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            disabled={isLoading || editingId !== null}
          >
            <Plus className="w-3 h-3 mr-1" />
            Tambah Item
          </Button>
        )}
      </div>

      {mode === 'form' ? (
        /* Table format for form input mode */
        localItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-sm">Belum ada Definition of Done yang ditambahkan</p>
            <p className="text-xs mt-1">Klik "Tambah Item" untuk menambahkan kriteria penyelesaian</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kriteria / Item</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.isEditing ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Kriteria penyelesaian..."
                          autoFocus
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.isEditing ? (
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Deskripsi detail (opsional)..."
                          rows={2}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">{item.description || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            onClick={() => saveItem(item.id, editTitle, editDescription)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-green-100"
                            disabled={!editTitle.trim()}
                          >
                            <Save className="w-3 h-3 text-green-600" />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => cancelEdit(item.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-red-100"
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            onClick={() => startEdit(item.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                          >
                            <Edit2 className="w-3 h-3 text-blue-600" />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        /* Card format for database mode */
        localItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-sm">Belum ada Definition of Done yang ditambahkan</p>
            <p className="text-xs mt-1">Klik "Tambah Item" untuk menambahkan kriteria penyelesaian</p>
          </div>
        ) : (
          <div className="space-y-2">
            {localItems.map((item, index) => (
              <DoD_Item
                key={item.id}
                item={item}
                index={index}
                isEditing={item.isEditing || false}
                canEdit={canEdit}
                onSave={(title, description) => saveItem(item.id, title, description)}
                onCancel={() => cancelEdit(item.id)}
                onEdit={() => startEdit(item.id)}
                onDelete={() => deleteItem(item.id)}
                onToggle={() => toggleCompletion(item.id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

interface DoD_ItemProps {
  item: LocalDoD;
  index: number;
  isEditing: boolean;
  canEdit: boolean;
  onSave: (title: string, description: string) => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function DoD_Item({ 
  item, 
  index, 
  isEditing, 
  canEdit,
  onSave, 
  onCancel, 
  onEdit, 
  onDelete, 
  onToggle 
}: DoD_ItemProps) {
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description);

  const handleSave = () => {
    if (editTitle.trim()) {
      onSave(editTitle, editDescription);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-white border border-orange-200 rounded-lg shadow-sm">
        <div className="space-y-3">
          <div>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Kriteria penyelesaian..."
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-sm"
            />
          </div>
          <div>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Deskripsi detail (opsional)..."
              rows={2}
              onKeyDown={handleKeyDown}
              className="text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={onCancel}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              size="sm"
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-xs"
              disabled={!editTitle.trim()}
            >
              <Save className="w-3 h-3 mr-1" />
              Simpan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 border rounded-lg transition-all ${
      item.isCompleted 
        ? 'bg-green-50 border-green-200' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={item.isCompleted}
          onCheckedChange={onToggle}
          className="mt-0.5"
          disabled={!canEdit}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                item.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {item.title}
              </p>
              {item.description && (
                <p className={`text-xs mt-1 ${
                  item.isCompleted ? 'line-through text-gray-400' : 'text-gray-600'
                }`}>
                  {item.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {item.isCompleted && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  Selesai
                </Badge>
              )}
              
              {canEdit && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    onClick={onEdit}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                  >
                    <Edit2 className="w-3 h-3 text-blue-600" />
                  </Button>
                  <Button
                    type="button"
                    onClick={onDelete}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-red-100"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}