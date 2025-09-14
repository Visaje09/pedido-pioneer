import { useState, useEffect } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Settings, 
  Search, 
  Edit,
  Save,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Profile {
  user_id: string;
  nombre: string | null;
  role: AppRole;
  created_at: string | null;
}

const roles: Array<{ value: AppRole; label: string; color: string }> = [
  { value: 'admin', label: 'Administrador', color: 'bg-destructive text-destructive-foreground' },
  { value: 'comercial', label: 'Comercial', color: 'bg-primary text-primary-foreground' },
  { value: 'inventarios', label: 'Inventarios', color: 'bg-warning text-warning-foreground' },
  { value: 'produccion', label: 'Producción', color: 'bg-accent text-accent-foreground' },
  { value: 'logistica', label: 'Logística', color: 'bg-success text-success-foreground' },
  { value: 'facturacion', label: 'Facturación', color: 'bg-secondary text-secondary-foreground' },
  { value: 'financiera', label: 'Financiera', color: 'bg-muted text-muted-foreground' },
];

export default function Admin() {
  const { profile: currentUserProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ nombre: string; role: AppRole }>({ nombre: '', role: 'comercial' });

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Error al cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserProfile?.role === 'admin') {
      fetchProfiles();
    }
  }, [currentUserProfile]);

  const handleEditUser = (user: Profile) => {
    setEditingUser(user.user_id);
    setEditForm({
      nombre: user.nombre || '',
      role: user.role,
    });
  };

  const handleSaveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: editForm.nombre,
          role: editForm.role,
        })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el usuario",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuario actualizado",
        description: "Los cambios se guardaron correctamente",
      });

      setEditingUser(null);
      fetchProfiles();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ nombre: '', role: 'comercial' });
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: AppRole) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig || { label: role, color: 'bg-muted text-muted-foreground' };
  };

  if (currentUserProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
            <CardDescription>
              Solo los administradores pueden acceder a esta sección
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/dashboard">Volver al Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Settings className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
                <p className="text-muted-foreground">Gestión de usuarios y configuración del sistema</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Volver al Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Módulos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="secondary" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Usuarios
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  Catálogos (Próximamente)
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  Configuración
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Users Section */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Gestión de Usuarios</span>
                    </CardTitle>
                    <CardDescription>
                      {filteredProfiles.length} usuarios registrados
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Users List */}
                <div className="space-y-4">
                  {filteredProfiles.map((user) => (
                    <Card key={user.user_id} className="border">
                      <CardContent className="pt-4">
                        {editingUser === user.user_id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`nombre-${user.user_id}`}>Nombre</Label>
                                <Input
                                  id={`nombre-${user.user_id}`}
                                  value={editForm.nombre}
                                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                  placeholder="Nombre completo"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`role-${user.user_id}`}>Rol</Label>
                                <Select 
                                  value={editForm.role} 
                                  onValueChange={(value: AppRole) => setEditForm({ ...editForm, role: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roles.map((role) => (
                                      <SelectItem key={role.value} value={role.value}>
                                        {role.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" onClick={() => handleSaveUser(user.user_id)}>
                                <Save className="w-4 h-4 mr-2" />
                                Guardar
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="w-4 h-4 mr-2" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {user.nombre || 'Sin nombre'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {user.user_id.substring(0, 8)}...
                              </div>
                              <Badge className={getRoleBadge(user.role).color}>
                                {getRoleBadge(user.role).label}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm text-muted-foreground">
                                {user.created_at ? 
                                  new Date(user.created_at).toLocaleDateString('es-ES') : 
                                  'Fecha no disponible'
                                }
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditUser(user)}
                                disabled={user.user_id === currentUserProfile?.user_id}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredProfiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios con los criterios de búsqueda
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}