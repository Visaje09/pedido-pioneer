import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RoleCatalogs from '@/components/catalogs/RoleCatalogs';

export default function Catalogos() {
  const { profile } = useAuth();

  // Redirect admin users to admin panel
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Catálogos - {profile?.role}</h1>
              <p className="text-muted-foreground">
                Gestión de catálogos para tu área
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <RoleCatalogs />
      </main>
    </div>
  );
}