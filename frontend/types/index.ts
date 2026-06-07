export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer' | 'admin' | 'super_admin';
  ward: string;
  district?: string | null;
  profilePhoto: string;
  isActive: boolean;
  isPasswordSet: boolean;
}

export const getRedirectPath = (role: string): string => {
  switch(role) {
    case 'super_admin': return '/admin'
    case 'admin':       return '/admin'
    case 'officer':     return '/officer'
    case 'citizen':     return '/my-reports'
    default:            return '/'
  }
}

export const isAdminRole = (role: string): boolean => {
  return role === 'admin' || role === 'super_admin'
}

export interface Issue {
  _id: string;
  title: string;
  description: string;
  category: 'pothole'|'garbage'|'streetlight'|'water'|'sewage'|'other';
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
  };
  photos: string[]; 
  status: 'reported'|'under_review'|'assigned'|'in_progress'|'resolved';
  reportedBy: { _id: string; name: string; email: string; };
  assignedTo: { _id: string; name: string; email: string; ward: string; } | null;
  upvotes: string[];
  resolutionPhoto: string;
  resolutionNote: string;
  ward: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  issueId: { _id: string; title: string; status: string; };
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, redirectTo?: string) => void;
  logout: () => void;
  isLoading: boolean;
}

export interface Officer {
  _id: string;
  name: string;
  email: string;
  ward: string;
}

import { AlertTriangle, Trash2, Zap, Droplets, Wind, Flag } from 'lucide-react';

export const categoryConfig: Record<string, { label: string; Icon: any; color: string }> = {
  pothole:     { label: 'Pothole',      Icon: AlertTriangle, color: 'text-amber-500' },
  garbage:     { label: 'Garbage',      Icon: Trash2,        color: 'text-red-500' },
  streetlight: { label: 'Street Light', Icon: Zap,           color: 'text-yellow-500' },
  water:       { label: 'Water',        Icon: Droplets,      color: 'text-blue-500' },
  sewage:      { label: 'Sewage',       Icon: Wind,          color: 'text-emerald-500' },
  other:       { label: 'Other',        Icon: Flag,          color: 'text-slate-500' },
}


export const statusConfig = {
  reported:     { label:'Reported',     dot:'#6b7280', bg:'bg-gray-100',   text:'text-gray-700',   border:'border-gray-200'   },
  under_review: { label:'Under Review', dot:'#d97706', bg:'bg-amber-50',   text:'text-amber-800',  border:'border-amber-200'  },
  assigned:     { label:'Assigned',     dot:'#2563eb', bg:'bg-blue-50',    text:'text-blue-800',   border:'border-blue-200'   },
  in_progress:  { label:'In Progress',  dot:'#ea580c', bg:'bg-orange-50',  text:'text-orange-800', border:'border-orange-200' },
  resolved:     { label:'Resolved',     dot:'#16a34a', bg:'bg-green-50',   text:'text-green-800',  border:'border-green-200'  },
}
