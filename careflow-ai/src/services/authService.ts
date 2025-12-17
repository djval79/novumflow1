import { User, UserRole, AuthResponse } from '../types';

// Mock database of users
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Dr. A. Admin',
    email: 'admin@careflow.com',
    role: UserRole.ADMIN,
    avatar: 'AA'
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    email: 'carer@careflow.com',
    role: UserRole.CARER,
    avatar: 'SJ'
  },
  {
    id: '3',
    name: 'John Doe Family',
    email: 'family@careflow.com',
    role: UserRole.FAMILY,
    avatar: 'JD'
  },
  {
    id: '4',
    name: 'Edith Crawley',
    email: 'client@careflow.com',
    role: UserRole.CLIENT,
    avatar: 'EC'
  }
];

// Simulate JWT token generation (Base64 encoded JSON)
const generateMockJwt = (user: User): string => {
  const payload = {
    sub: user.id,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  };
  return btoa(JSON.stringify(payload));
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const user = MOCK_USERS.find(u => u.email === email);

  // Simple password check for demo purposes (all passwords are 'password123')
  if (user && password === 'password123') {
    const token = generateMockJwt(user);
    return {
      user,
      token
    };
  }

  throw new Error('Invalid credentials');
};

export const verifyToken = async (token: string): Promise<User | null> => {
  try {
    const decoded = JSON.parse(atob(token));
    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    const user = MOCK_USERS.find(u => u.id === decoded.sub);
    return user || null;
  } catch (e) {
    return null;
  }
};