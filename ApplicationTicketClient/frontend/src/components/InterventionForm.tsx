import { useState } from 'react';
import axios from 'axios';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';

interface InterventionFormProps {
  ticketId: string;
  onInterventionCreated: () => void;
}

export default function InterventionForm({ ticketId, onInterventionCreated }: InterventionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    urgencyLevel: '',
    description: '',
    deadline: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.urgencyLevel || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await axios.post(`/api/tickets/${ticketId}/interventions`, formData);
      
      toast({
        title: 'Success',
        description: 'Intervention created successfully',
      });
      
      // Reset form
      setFormData({
        type: '',
        urgencyLevel: '',
        description: '',
        deadline: '',
      });
      
      // Notify parent component
      onInterventionCreated();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create intervention',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create New Intervention</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Intervention Type <span className="text-red-500">*</span></Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="BugFix">Bug Fix</SelectItem>
                <SelectItem value="Enhancement">Enhancement</SelectItem>
                <SelectItem value="Configuration">Configuration</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="urgencyLevel">Urgency Level <span className="text-red-500">*</span></Label>
            <Select
              value={formData.urgencyLevel}
              onValueChange={(value) => handleSelectChange('urgencyLevel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select urgency level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the intervention"
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="deadline">Response Time</Label>
            <Select
              value={formData.deadline}
              onValueChange={(value) => handleSelectChange('deadline', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select response time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Within 1 hour</SelectItem>
                <SelectItem value="2h">Within 2 hours</SelectItem>
                <SelectItem value="4h">Within 4 hours</SelectItem>
                <SelectItem value="8h">Within 8 hours</SelectItem>
                <SelectItem value="24h">Within 24 hours</SelectItem>
                <SelectItem value="none">No specific deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-start space-x-2 text-amber-600 bg-amber-50 p-3 rounded-md">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Creating an intervention will notify assigned agents and track their response time.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Intervention'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}