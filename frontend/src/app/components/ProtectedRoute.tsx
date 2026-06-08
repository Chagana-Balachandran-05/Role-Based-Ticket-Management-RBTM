import { Navigate } from 'react-router';
import { useAppSelector } from '../../store/hooks';

interface Props {
  children: React.ReactNode;
  allowedRoles?: ('Admin' | 'Agent' | 'User')[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
