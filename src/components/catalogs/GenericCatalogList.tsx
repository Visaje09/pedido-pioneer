import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { usePermission } from '@/hooks/usePermissions';
import { toast } from 'sonner';

interface CatalogField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean';
}

interface GenericCatalogListProps {
  title: string;
  description: string;
  data: any[];
  fields: CatalogField[];
  permissionCode: string;
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (id: string | number) => void;
  searchPlaceholder?: string;
}

export default function GenericCatalogList({
  title,
  description,
  data,
  fields,
  permissionCode,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  searchPlaceholder = "Buscar..."
}: GenericCatalogListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const canRead = usePermission(`catalogo.${permissionCode}.read`);
  const canManage = usePermission(`catalogo.${permissionCode}.manage`);
  
  // Filter data based on search term
  const filteredData = data.filter(item => 
    fields.some(field => {
      const value = item[field.key];
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const handleDelete = (item: any) => {
    if (!canManage || !onDelete) return;
    
    const confirmDelete = window.confirm(`¿Está seguro que desea eliminar este registro?`);
    if (confirmDelete) {
      try {
        const idField = fields.find(f => f.key.includes('id')) || fields[0];
        onDelete(item[idField.key]);
      } catch (error) {
        toast.error('No se puede eliminar, está siendo referenciado por otros registros');
      }
    }
  };

  const renderCellValue = (value: any, field: CatalogField) => {
    if (value === null || value === undefined) return '-';
    
    switch (field.type) {
      case 'boolean':
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? 'Sí' : 'No'}
          </Badge>
        );
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value.toString();
    }
  };

  if (!canRead) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Sin permisos de acceso
          </h3>
          <p className="text-sm text-muted-foreground">
            No tienes permisos para ver este catálogo
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{title}</span>
              {!canManage && (
                <Badge variant="outline" className="text-xs">
                  Solo lectura
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {canManage && onAdd && (
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredData.length} registros
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {fields.map(field => (
                  <TableHead key={field.key}>{field.label}</TableHead>
                ))}
                {canManage && (
                  <TableHead className="w-24">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={fields.length + (canManage ? 1 : 0)} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm ? 'No se encontraron registros' : 'No hay registros'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={index}>
                    {fields.map(field => (
                      <TableCell key={field.key}>
                        {renderCellValue(item[field.key], field)}
                      </TableCell>
                    ))}
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}