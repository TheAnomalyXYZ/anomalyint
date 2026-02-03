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

        // All OAuth callbacks should be handled by the API endpoint
        // which properly handles both create and refresh flows
        setMessage('Processing OAuth authorization...');

        // Forward to the API callback endpoint which handles everything
        const params = new URLSearchParams({
          code,
          state: stateParam,
        });

        // Redirect to API endpoint - it will redirect back to /knowledge-corpus with results
        window.location.href = `/api/oauth/google/callback?${params.toString()}`;
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
