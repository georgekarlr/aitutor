import { useContext } from 'react';
import { AuthContext } from '@/context/authContextObj';

export const useAuth = () => useContext(AuthContext);
