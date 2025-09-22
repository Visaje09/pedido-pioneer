import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

interface Proyecto {
  id_proyecto: number;
  nombre_proyecto: string;
  descripcion_proyecto: string | null;
  id_cliente: number;
  nit_cliente: string | null;
  cliente?: {
    nombre_cliente: string;
  };
}

interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
}

export function ProyectoCatalog() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Proyecto | null>(null);
  const [formData, setFormData] = useState({
    nombre_proyecto: '',
    descripcion_proyecto: '',
    id_cliente: '',
    nit_cliente: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch proyectos with client information (use * to be compatible if some columns are missing in some envs)
      const { data: proyectosData, error: proyectosError } = await supabase
        .from('proyecto')
        .select(`
          *,
          cliente:cliente(nombre_cliente)
        `)
        .order('nombre_proyecto');

      let proyectosOk = proyectosData;
      if (proyectosError) {
        console.error('Error fetching proyectos (with cliente join):', proyectosError);
        // Fallback: intenta sin la relación para no romper el listado
        const fallback = await supabase.from('proyecto').select('*').order('nombre_proyecto');
        if (fallback.error) {
          console.error('Error fetching proyectos (fallback *):', fallback.error);
          toast({
            title: "Error",
            description: `No se pudieron cargar los proyectos: ${fallback.error.message || ''}`,
            variant: "destructive",
          });
          return;
        }
        proyectosOk = fallback.data ?? [];
        toast({
          title: "Aviso",
          description: "Se cargaron los proyectos sin información del cliente por un problema temporal.",
          variant: "default",
        });
      }

      console.debug('Proyectos cargados:', Array.isArray(proyectosOk) ? proyectosOk.length : 0);

      // Fetch clientes for dropdown
      const { data: clientesData, error: clientesError } = await supabase
        .from('cliente')
        .select('*')
        .order('nombre_cliente');

      if (clientesError) {
        console.error('Error fetching clientes:', clientesError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        });
        return;
      }

      setProyectos(proyectosOk || []);
      setClientes(clientesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.nombre_proyecto.trim() || !formData.id_cliente) {
      toast({
        title: "Error",
        description: "El nombre del proyecto y cliente son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('proyecto')
          .update({
            nombre_proyecto: formData.nombre_proyecto.trim(),
            descripcion_proyecto: formData.descripcion_proyecto.trim() || null,
            id_cliente: parseInt(formData.id_cliente),
            nit_cliente: formData.nit_cliente.trim() || ''
          })
          .eq('id_proyecto', editingItem.id_proyecto);

        if (error) {
          console.error('Error updating proyecto:', error);
          toast({
            title: "Error",
            description: "No se pudo actualizar el proyecto",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Proyecto actualizado",
          description: "El proyecto se actualizó correctamente",
        });
      } else {
        // Create
        const { error } = await supabase
          .from('proyecto')
          .insert({
            nombre_proyecto: formData.nombre_proyecto.trim(),
            descripcion_proyecto: formData.descripcion_proyecto.trim() || null,
            id_cliente: parseInt(formData.id_cliente),
            nit_cliente: formData.nit_cliente.trim() || ''
          });

        if (error) {
          console.error('Error creating proyecto:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el proyecto",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Proyecto creado",
          description: "El proyecto se creó correctamente",
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ nombre_proyecto: '', descripcion_proyecto: '', id_cliente: '', nit_cliente: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving proyecto:', error);
      toast({
        title: "Error",
        description: "Error al guardar el proyecto",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (proyecto: Proyecto) => {
    setEditingItem(proyecto);
    setFormData({
      nombre_proyecto: proyecto.nombre_proyecto,
      descripcion_proyecto: proyecto.descripcion_proyecto || '',
      id_cliente: proyecto.id_cliente.toString(),
      nit_cliente: proyecto.nit_cliente || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('proyecto')
        .delete()
        .eq('id_proyecto', id);

      if (error) {
        console.error('Error deleting proyecto:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el proyecto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Proyecto eliminado",
        description: "El proyecto se eliminó correctamente",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting proyecto:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el proyecto",
        variant: "destructive",
      });
    }
  };

  const filteredProyectos = proyectos.filter(proyecto =>
    proyecto.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proyecto.cliente?.nombre_cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proyecto.nit_cliente || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingItem(null);
            setFormData({ nombre_proyecto: '', descripcion_proyecto: '', id_cliente: '', nit_cliente: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifica la información del proyecto' : 'Completa la información del nuevo proyecto'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id_cliente">Cliente</Label>
                <Select value={formData.id_cliente} onValueChange={(value) => setFormData({ ...formData, id_cliente: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id_cliente} value={cliente.id_cliente.toString()}>
                        {cliente.nombre_cliente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nit_cliente">NIT del Cliente</Label>
                <Input
                  id="nit_cliente"
                  value={formData.nit_cliente}
                  onChange={(e) => setFormData({ ...formData, nit_cliente: e.target.value })}
                  placeholder="Ej. 900123456-7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre_proyecto">Nombre del Proyecto</Label>
                <Input
                  id="nombre_proyecto"
                  value={formData.nombre_proyecto}
                  onChange={(e) => setFormData({ ...formData, nombre_proyecto: e.target.value })}
                  placeholder="Proyecto ABC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion_proyecto">Descripción</Label>
                <Textarea
                  id="descripcion_proyecto"
                  value={formData.descripcion_proyecto}
                  onChange={(e) => setFormData({ ...formData, descripcion_proyecto: e.target.value })}
                  placeholder="Descripción del proyecto..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingItem ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proyectos ({filteredProyectos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>NIT Cliente</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProyectos.map((proyecto) => (
                  <TableRow key={proyecto.id_proyecto}>
                    <TableCell className="font-medium">{proyecto.nombre_proyecto}</TableCell>
                    <TableCell>{proyecto.cliente?.nombre_cliente}</TableCell>
                    <TableCell>{proyecto.nit_cliente || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {proyecto.descripcion_proyecto || '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(proyecto)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente 
                              el proyecto "{proyecto.nombre_proyecto}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(proyecto.id_proyecto)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProyectos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron proyectos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}