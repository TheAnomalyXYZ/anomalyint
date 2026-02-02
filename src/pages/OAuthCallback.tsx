import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const stateParam = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`OAuth error: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Google');
          return;
        }

        if (!stateParam) {
          setStatus('error');
          setMessage('No state parameter provided');
          return;
        }

        // Parse state - it could be either a simple drive_source_id string
        // or a JSON object with corpus_id and action
        let driveSourceId: string;
        let stateData: any;

        try {
          stateData = JSON.parse(stateParam);
          // New format with action
          if (stateData.action === 'refresh' && stateData.corpus_id) {
            // For refresh action, redirect to the API callback endpoint
            // which handles the refresh flow properly
            const params = new URLSearchParams({
              code,
              state: stateParam,
            });
            window.location.href = `/api/oauth/google/callback?${params.toString()}`;
            return;
          }
          // Old format but as JSON
          driveSourceId = stateData.drive_source_id || stateData;
        } catch {
          // Old format - plain string
          driveSourceId = stateParam;
        }

        // Exchange code for tokens (old flow)
        setMessage('Exchanging authorization code for tokens...');

        const response = await fetch('/api/oauth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            drive_source_id: driveSourceId,
            redirect_uri: `${window.location.origin}/oauth/callback`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to exchange authorization code');
        }

        const data = await response.json();

        setStatus('success');
        setMessage('OAuth tokens refreshed successfully! Redirecting...');

        // Redirect back to Knowledge Corpus page after 2 seconds
        setTimeout(() => {
          navigate('/knowledge-corpus');
        }, 2000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to process OAuth callback');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            OAuth Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
            {message}
          </p>

          {status === 'error' && (
            <Button
              onClick={() => navigate('/knowledge-corpus')}
              className="w-full"
            >
              Back to Knowledge Corpus
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
