import React from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { OrdenKanban } from '@/types/kanban';


const Ordenes: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1  className="text-3xl font-bold text-foreground">Ordenes</h1>
          <p className="text-muted-foreground">
            Bienvenido, {currentUserProfile?.nombre.toUpperCase()}
            {currentUserProfile && (
              <Badge variant="default" className="ml-2">
                {currentUserProfile.role.toUpperCase()}
              </Badge>
            )}
          </p>
        </div>
        <Button variant="outline" asChild>
              <Link to="/dashboard">Volver al Dashboard</Link>
            </Button>
      </div>


      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Gestion de Ordenes de Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KanbanBoard onOrderClick={(order: OrdenKanban) => {}} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Ordenes;
