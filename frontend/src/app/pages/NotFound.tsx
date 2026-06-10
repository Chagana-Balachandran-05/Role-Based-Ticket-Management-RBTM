import { useNavigate } from 'react-router';
import AuthLayout from '../components/AuthLayout';
import GlassCard from '../components/GlassCard';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="flex items-center justify-center min-h-screen px-4">
        <GlassCard className="max-w-md w-full text-center">
          <div className="mb-6">
            <span className="text-7xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              404
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-500 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <button
            id="btn-back-to-dashboard"
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-emerald-200 cursor-pointer"
          >
            Back to Dashboard
          </button>
        </GlassCard>
      </div>
    </AuthLayout>
  );
}
