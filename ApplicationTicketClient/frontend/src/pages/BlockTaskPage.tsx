// pages/BlockTaskPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import api from '@/api/api';

const BlockTaskPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blockReason, setBlockReason] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!blockReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une raison du blocage.",
        variant: "destructive",
      });
      return;
    }
  
    setLoading(true);
    try {
      let response;
      if(user.role === 'tester'){
         response = await api.post(`/v1/testing/${id}/block`, {
          reason: blockReason,  // Ensure reason is sent
          description: 'Some description here',  // Add description field if required
        });
      }
      else{
         response = await api.post(`/v1/task/${id}/block`, {
        reason: blockReason,  // Ensure reason is sent
        description: 'Some description here',  // Add description field if required
      });
      }
      
  
      setBlockReason(response.data.reason);
  
      toast({
        title: "Bloqueur signalé",
        description: "La tâche a été marquée comme bloquée avec succès.",
        variant: "default",
      });
  
      navigate("/tasks");
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Une erreur est survenue lors du blocage de la tâche.";
  
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <Card className="shadow-lg border rounded-2xl">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <CardTitle className="text-xl">Signaler un blocage</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Vous bloquez la progression de la tâche ID : <strong>{id}</strong>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label htmlFor="blockReason" className="block text-sm font-medium text-gray-700">
            Raison du blocage <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="blockReason"
            placeholder="Décrivez ce qui vous empêche d’avancer sur cette tâche..."
            rows={6}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />
          <Button className="w-full" onClick={handleSubmit}>
            <Send className="w-4 h-4 mr-2" />
            Soumettre le blocage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockTaskPage;
