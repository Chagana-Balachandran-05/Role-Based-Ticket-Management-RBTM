import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import GlassCard from '../components/GlassCard';
import AuthLayout from '../components/AuthLayout';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser, clearError } from '../../store/slices/authSlice';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword, ...submitData } = data;
    const result = await dispatch(registerUser({ ...submitData, role: 'User' }));
    if (registerUser.fulfilled.match(result)) {
      navigate('/login');
    }
  };

  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <GlassCard>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h1 className="text-3xl mb-2">Create Account</h1>
              <p className="text-gray-600">Join RBTM System</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm mb-2 text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    {...register('name', { required: 'Name is required' })}
                  />
                </div>
                {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    {...register('email', { required: 'Email is required' })}
                  />
                </div>
                {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
              </div>



              <div>
                <label className="block text-sm mb-2 text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                </div>
                {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password.message}</span>}
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Confirm Password</label>
                <div className="relative">
                  <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/50 border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match',
                    })}
                  />
                </div>
                {errors.confirmPassword && (
                  <span className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-emerald-600 hover:text-emerald-700">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </AuthLayout>
  );
}
