import React from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';


const Ordenes: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {currentUserProfile?.nombre}
            {currentUserProfile && (
              <Badge variant="secondary" className="ml-2">
                {currentUserProfile.role}
              </Badge>
            )}
          </p>
        </div>
      </div>
            
      {/* Stats Cards */}

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Órdenes de Producción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KanbanBoard />
        </CardContent>
      </Card>
    </div>
  );
};

export default Ordenes;
