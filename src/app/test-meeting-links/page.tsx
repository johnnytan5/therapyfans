'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { createAvailableSession } from '@/lib/therapistService';
import { generateMeetingId } from '@/lib/meetingLinks';

export default function TestMeetingLinksPage() {
  const [therapistWallet, setTherapistWallet] = useState('0x1234567890abcdef1234567890abcdef12345678');
  const [date, setDate] = useState('2025-01-15');
  const [time, setTime] = useState('14:00');
  const [price, setPrice] = useState(5);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealMeetingId, setRevealMeetingId] = useState(false);

  const testCreateSession = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create ISO string from date and time
      const scheduledAt = new Date(`${date}T${time}:00Z`).toISOString();
      
      console.log('Creating session with:', {
        therapistWallet,
        scheduledAt,
        price
      });

      const session = await createAvailableSession({
        therapistId: therapistWallet,
        therapistWallet,
        scheduledAt,
        durationMinutes: 30,
        priceSui: price,
      });

      if (session) {
        setResult(session);
        console.log('Session created successfully:', session);
      } else {
        setError('Failed to create session');
      }
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testGenerateMeetingId = () => {
    const slotId = `slot-${date.replace(/-/g, '')}-${time.replace(':', '')}-${therapistWallet.slice(-8)}`;
    const meetingId = generateMeetingId(
      slotId,
      therapistWallet,
      date,
      time
    );
    
    setResult({
      slotId,
      meetingId,
      generatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Test Meeting Link Generation</h1>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Therapist Wallet</label>
            <Input
              value={therapistWallet}
              onChange={(e) => setTherapistWallet(e.target.value)}
              placeholder="0x..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Price (SUI)</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex space-x-4">
            <Button 
              onClick={testCreateSession} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Creating Session..." : "Create Available Session"}
            </Button>
            
            <Button 
              onClick={testGenerateMeetingId}
              variant="outline"
              className="flex-1"
            >
              Test Meeting ID Generation
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.meetingId && (
              <div className="mt-4 p-4 bg-gradient-to-r from-indigo-100 to-cyan-100 rounded-lg border border-indigo-300 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-indigo-700 flex items-center">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full mr-2"></div>
                    Generated Meeting ID
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevealMeetingId(!revealMeetingId)}
                    className="h-7 px-3 text-xs bg-indigo-100/60 hover:bg-indigo-200/80 border border-indigo-200 rounded-md"
                  >
                    {revealMeetingId ? (
                      <>
                        <EyeOff className="w-3 h-3 mr-1 text-indigo-600" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 mr-1 text-indigo-600" />
                        Reveal
                      </>
                    )}
                  </Button>
                </div>
                {revealMeetingId && (
                  <div className="text-indigo-800 break-all font-mono text-sm bg-indigo-50/80 p-3 rounded border border-indigo-100">
                    {result.meetingId}
                  </div>
                )}
              </div>
            )}
            {result.meeting_link && (
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg border border-amber-300 shadow-sm">
                <h3 className="font-semibold text-amber-700 mb-2 flex items-center">
                  <div className="w-3 h-3 bg-amber-400 rounded-full mr-2"></div>
                  Generated Meeting Link
                </h3>
                <a 
                  href={result.meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-700 hover:text-amber-800 break-all bg-amber-50/80 p-2 rounded border border-amber-100 inline-block"
                >
                  {result.meeting_link}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
