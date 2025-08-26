import { useState } from 'react';
import axios from 'axios';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
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
import { Loader2, AlertOctagon } from 'lucide-react';

interface BlockerFormProps {
  ticketId: string;
  interventionId: string;
  onBlockerCreated: () => void;
}

export default function BlockerForm({ ticketId, interventionId, onBlockerCreated }: BlockerFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    impact: '',
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
    
    if (!formData.type || !formData.description || !formData.impact) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await axios.post(`/api/tickets/${ticketId}/interventions/${interventionId}/blockers`, formData);
      
      toast({
        title: 'Success',
        description: 'Blocker created successfully',
      });
      
      // Reset form
      setFormData({
        type: '',
        description: '',
        impact: '',
      });
      
      // Notify parent component
      onBlockerCreated();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create blocker',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50 border-b border-red-200">
        <CardTitle className="text-lg flex items-center text-red-700">
          <AlertOctagon className="h-5 w-5 mr-2" />
          Report Blocker
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Blocker Type <span className="text-red-500">*</span></Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technical">Technical Issue</SelectItem>
                <SelectItem value="Access">Access/Permission Issue</SelectItem>
                <SelectItem value="Resource">Resource Unavailable</SelectItem>
                <SelectItem value="Dependencies">External Dependencies</SelectItem>
                <SelectItem value="Requirements">Unclear Requirements</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
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
              placeholder="Describe the blocker in detail"
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="impact">Impact Level <span className="text-red-500">*</span></Label>
            <Select
              value={formData.impact}
              onValueChange={(value) => handleSelectChange('impact', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select impact level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low - Can be worked around</SelectItem>
                <SelectItem value="Medium">Medium - Significant delay</SelectItem>
                <SelectItem value="High">High - Cannot proceed</SelectItem>
                <SelectItem value="Critical">Critical - Affects other work</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">
            <p>
              <strong>Important:</strong> Creating a blocker will pause the intervention timeline and notify the responsible client.
              Only use for genuine blocking issues that prevent you from continuing your work.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} variant="destructive">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Blocker'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}