import { useNavigate } from 'react-router';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="p-8 flex items-center justify-center min-h-full">
      <div className="text-center">
        <div className="w-24 h-24 bg-[#A192F8]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-6xl">404</span>
        </div>
        <h1 className="text-3xl font-bold text-primary mb-2">Page Not Found</h1>
        <p className="text-secondary mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[#A192F8] text-white rounded-lg font-medium hover:bg-[#9178E8] transition-colors cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
