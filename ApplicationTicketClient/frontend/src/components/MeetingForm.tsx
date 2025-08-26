import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Calendar, Users, Link as LinkIcon } from 'lucide-react';
import { Checkbox } from './ui/checkbox';

interface MeetingFormProps {
  ticketId: string;
  onMeetingCreated: () => void;
}

export default function MeetingForm({ ticketId, onMeetingCreated }: MeetingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    meetingLink: '',
    agenda: '',
    selectedAgents: [],
  });

  useEffect(() => {
    fetchAgents();
    fetchAvailabilitySlots();
  }, [ticketId]);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/users/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchAvailabilitySlots = async () => {
    try {
      const response = await axios.get(`/api/tickets/${ticketId}/availability`);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching availability slots:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAgentSelection = (agentId) => {
    setFormData(prev => {
      const selectedAgents = [...prev.selectedAgents];
      
      if (selectedAgents.includes(agentId)) {
        return {
          ...prev,
          selectedAgents: selectedAgents.filter(id => id !== agentId)
        };
      } else {
        return {
          ...prev,
          selectedAgents: [...selectedAgents, agentId]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.time || !formData.meetingLink || formData.selectedAgents.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and select at least one agent',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format the date and time
      const meetingData = {
        ...formData,
        dateTime: `${formData.date}T${formData.time}`
      };
      
      await axios.post(`/api/tickets/${ticketId}/meetings`, meetingData);
      
      toast({
        title: 'Success',
        description: 'Meeting scheduled successfully',
      });
      
      // Reset form
      setFormData({
        title: '',
        date: '',
        time: '',
        meetingLink: '',
        agenda: '',
        selectedAgents: [],
      });
      
      // Notify parent component
      onMeetingCreated();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to schedule meeting',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Schedule Meeting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Meeting Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter meeting title"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="time">Time <span className="text-red-500">*</span></Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="meetingLink">Meeting Link <span className="text-red-500">*</span></Label>
            <div className="flex items-center">
              <LinkIcon className="h-4 w-4 text-gray-400 mr-2" />
              <Input
                id="meetingLink"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleChange}
                placeholder="Teams, Zoom, or other meeting URL"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea
              id="agenda"
              name="agenda"
              value={formData.agenda}
              onChange={handleChange}
              placeholder="Enter meeting agenda"
              rows={3}
            />
          </div>
          
          {availableSlots.length > 0 && (
            <div>
              <Label className="mb-2 block">Client Availability</Label>
              <div className="bg-blue-50 p-3 rounded-md text-sm mb-4">
                <p>The client has indicated availability during these times:</p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  {availableSlots.map((slot, index) => (
                    <li key={index}>{slot}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div>
            <Label className="mb-2 block">
              Select Agents <span className="text-red-500">*</span>
            </Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              {agents.length > 0 ? (
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <div key={agent._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`agent-${agent._id}`}
                        checked={formData.selectedAgents.includes(agent._id)}
                        onCheckedChange={() => handleAgentSelection(agent._id)}
                      />
                      <Label htmlFor={`agent-${agent._id}`} className="font-normal cursor-pointer">
                        {agent.firstName} {agent.lastName}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No agents available</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Meeting'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}