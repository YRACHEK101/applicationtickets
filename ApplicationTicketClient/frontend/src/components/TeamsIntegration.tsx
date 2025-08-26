// src/components/TeamsIntegration.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { useToast } from './ui/use-toast';
import api from '../api/api';

interface TeamsIntegrationProps {
  ticketId: string;
  teamsLink?: string;
  onTeamsChannelCreated: (teamsLink: string) => void;
}

export default function TeamsIntegration({ 
  ticketId, 
  teamsLink, 
  onTeamsChannelCreated 
}: TeamsIntegrationProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  
  const createTeamsChannel = async () => {
    if (teamsLink) {
      // Channel already exists, just open it
      window.open(teamsLink, '_blank');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await api.post(`/tickets/${ticketId}/teams-channel`);
      
      if (response.data && response.data.teamsLink) {
        toast({
          title: t('success'),
          description: t('tickets.teamsChannelCreated'),
        });
        
        // Update parent component with the new Teams link
        onTeamsChannelCreated(response.data.teamsLink);
        
        // Open the Teams channel in a new tab
        window.open(response.data.teamsLink, '_blank');
      }
    } catch (error) {
      console.error('Error creating Teams channel:', error);
      toast({
        title: t('error'),
        description: t('tickets.teamsChannelError'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div>
      {teamsLink ? (
        <Button 
          variant="outline" 
          className="w-full flex items-center" 
          onClick={() => window.open(teamsLink, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {t('tickets.openTeamsChannel')}
        </Button>
      ) : (
        <Button 
          variant="outline" 
          className="w-full flex items-center" 
          onClick={createTeamsChannel}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('tickets.creatingTeamsChannel')}
            </>
          ) : (
            <>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                className="h-4 w-4 mr-2 fill-current"
              >
                <path d="M19.3,5.7l-0.4,0.5l0.4,0.1c1.7,1.3,1.8,3.2,1.8,3.4c0,1-0.2,1.8-0.6,2.4c-0.4,0.6-1,1.1-1.6,1.3 c-0.1,0-0.5,0.1-0.5,0.3c0,0.2,0.3,0.2,0.3,0.2c0.5,0,1-0.1,1.2-0.2c0.9-0.3,1.6-1,2-1.8c0.3-0.6,0.5-1.4,0.5-2.2 c0-1-0.3-1.9-0.9-2.7C21.1,6.4,20.3,5.9,19.3,5.7z M13.9,1.7c-1.4,0-2.5,0.4-3.4,1.1c-0.7,0.6-1.2,1.3-1.6,2.2l-0.2,0.4l0.5-0.1 c1.8-0.4,3.6-0.2,5.2,0.6c1.2,0.6,2.1,1.6,2.5,2.8c0.3,0.8,0.3,1.5,0.3,2.3l0,2.7c0,0.7,0.1,1.1,0.3,1.3c0.1,0.1,0.3,0.1,0.5,0.1 c0.5,0,0.8-0.2,1-0.6c0.1-0.3,0.1-0.7,0.1-1.5c0-1.1,0-1.8,0-2.9C19.1,4.9,16.9,1.7,13.9,1.7z M13.8,4c-0.7,0-1.6,0.2-2.1,0.4 l-0.4,0.2l0.3,0.3C12.2,5.5,12.8,6.5,13,7.6c0.3,1.5,0,3.2-0.8,4.1c-0.4,0.5-0.8,0.8-1.4,0.9c-0.8,0.2-1.6,0-2.4-0.6 c-1.5-1.1-2.1-3-1.5-4.8c0.1-0.3,0.2-0.5,0.4-0.8l0.2-0.3L7.1,6.6C6.3,7.1,5.8,7.7,5.3,8.3c-0.3,0.4-0.5,0.8-0.7,1.2 c-0.5,1.4-0.2,3,0.8,4.1c0.6,0.7,1.4,1.2,2.4,1.5c1.1,0.4,2.2,0.3,3.2-0.1c1.3-0.6,2.3-1.6,2.8-3c0.3-0.8,0.4-1.5,0.4-2.4 c0-1.1-0.3-2.2-0.9-3.1C16,5.3,15,4.4,13.8,4z M6.9,9.3L6.9,9.3C6.9,9.4,6.9,9.4,6.9,9.3L6.9,9.3z M6.9,12c0,0.7,0.1,1.1,0.2,1.5 c0.1,0.2,0.2,0.3,0.4,0.4c0.2,0,0.4,0,0.6-0.1c0.2-0.1,0.5-0.3,0.7-0.6l0.2-0.2l-0.1-0.3c-0.3-0.7-0.4-1.3-0.4-2 c0-0.6,0.1-1.1,0.4-1.6l0.2-0.3L8.9,8.6C8.5,8.4,8.1,8.2,7.7,8.1L7.2,8L7.1,8.5C7,8.8,6.9,9.2,6.9,9.5C6.9,10,6.9,11.3,6.9,12z" />
              </svg>
              {t('tickets.createTeamsChannel')}
            </>
          )}
        </Button>
      )}
    </div>
  );
}