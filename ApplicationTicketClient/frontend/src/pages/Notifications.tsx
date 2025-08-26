import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import api from '@/api/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext'; // Assurez-vous que ce chemin est correct

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string; // Ce champ doit être obligatoire, pas optionnel
}

export default function Notifications() {
  const [notif, setNotif] = useState<Notification[]>([]);
  const { t } = useTranslation();
  const { user } = useAuth(); // Récupérer l'utilisateur actuel du contexte d'authentification

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Cette route ne renvoie que les notifications de l'utilisateur connecté
      const response = await api.get('/v1/notifications/unread');
      
      // S'assurer que chaque notification a un userId correspondant à l'utilisateur actuel
      const unread = response.data.map((n: Notification) => ({ 
        ...n, 
        isRead: false,
        userId: user?.id || localStorage.getItem('userId') // Assurer que userId est défini
      }));

      // Get previously read notifications from localStorage
      const localRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');

      // Filtrer strictement les notifications locales pour ne garder que celles de l'utilisateur actuel
      const currentUserId = user?.id || localStorage.getItem('userId');
      const filteredLocalRead = localRead.filter((n: Notification) => 
        n.userId === currentUserId
      );

      const all = [...unread, ...filteredLocalRead];

      const sorted = all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotif(sorted);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const updated = notif.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      );
      setNotif(updated);

      const readToSave = updated.filter(n => n.isRead);
      
      // Stocker l'ID de l'utilisateur avec les notifications lues
      const currentUserId = user?.id || localStorage.getItem('userId');
      const readWithUserId = readToSave.map(n => ({
        ...n,
        userId: currentUserId // Utiliser l'ID de l'utilisateur actuel
      }));
      
      localStorage.setItem('readNotifications', JSON.stringify(readWithUserId));

      await api.patch(`/v1/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('notifications.title')}</h1>
      <Card className="space-y-4 p-4">
        {notif.length > 0 ? (
          notif.map(item => (
            <div
              key={item._id}
              onClick={() => markAsRead(item._id)}
              className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-200 
                ${!item.isRead ? 'bg-white border-orange-500' : 'bg-gray-100 border-gray-300'}`}
            >
              {!item.isRead && (
                <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {t('common.new')}
                </span>
              )}
              <p className="text-sm font-medium">{item.message}</p>
              <p className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('notifications.noNotifications')}</p>
          </div>
        )}
      </Card>
    </div>
  );
};