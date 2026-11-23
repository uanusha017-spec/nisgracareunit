/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingCareWidgets } from './components/FloatingCareWidgets';
import type { GalleryViewMode } from './components/GalleryPage';
import { PortalWorkspace, type PortalTab } from './components/PortalWorkspace';
import { PublicWebsite, type PublicPage } from './components/PublicWebsite';
import { AuthProvider } from './context/AuthContext';
import type { CareUnit } from './types/hospital';

export default function App() {
  const [view, setView] = useState<'website' | 'portal'>('website');
  const [publicPage, setPublicPage] = useState<PublicPage>('home');
  const [galleryMode, setGalleryMode] = useState<GalleryViewMode>('all');
  const [portalInitialTab, setPortalInitialTab] = useState<PortalTab | undefined>(undefined);
  const [selectedDepartment, setSelectedDepartment] = useState<CareUnit | undefined>(undefined);
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined);

  const handleOpenBookingFromWidget = () => {
    if (view !== 'website' || publicPage !== 'home') {
      setView('website');
      setPublicPage('home');
      setTimeout(() => {
        document.getElementById('book-appointment')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById('book-appointment')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        {view === 'website' ? (
          <PublicWebsite
            activePage={publicPage}
            galleryMode={galleryMode}
            onNavigatePage={(page, mode) => {
              setPublicPage(page);
              if (mode) setGalleryMode(mode);
            }}
            onOpenPortal={(initialTab) => {
              setPortalInitialTab(initialTab);
              setView('portal');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            selectedDepartment={selectedDepartment}
            selectedDoctor={selectedDoctor}
            onSelectForBooking={(department, doctor) => {
              setSelectedDepartment(department);
              setSelectedDoctor(doctor);
            }}
          />
        ) : (
          <PortalWorkspace
            initialTab={portalInitialTab}
            onBackToWebsite={() => {
              setView('website');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
          />
        )}

        <FloatingCareWidgets onBookAppointment={handleOpenBookingFromWidget} />
      </AuthProvider>
    </ErrorBoundary>
  );
}
