import React from 'react';
import CoordinatorDashboard from '../components/Coordinator/CoordinatorDashboard';
import { CoordinatorAuthProvider } from '../services/CoordinatorAuth';

export default function CoordinatorDashboardRoute() {
  return (
    <CoordinatorAuthProvider>
      <CoordinatorDashboard />
    </CoordinatorAuthProvider>
  );
}
