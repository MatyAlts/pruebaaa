"use client";

import { useState } from "react";
import { Study, FamilyMember } from "@/types";
import ShareModal from "@/components/modals/ShareModal";
import ViewStudyModal from "@/components/modals/ViewStudyModal";
import EditStudyModal from "@/components/modals/EditStudyModal";
import HomeEmptyState from "../HomeEmptyState";
import HomeKPIs from "../HomeKPIs";
import HomeRecentStudies from "../HomeRecentStudies";
import UploadStudyModal from "@/components/modals/UploadStudyModal";

interface HomeDashboardProps {
  recentStudies: Study[];
  stats: {
    total: number;
    myStudies: number;
    familyStudies: number;
  };
  familyMembers: FamilyMember[];
}

export default function HomeDashboard({ recentStudies, stats, familyMembers }: HomeDashboardProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);

  const handleEdit = (study: Study) => {
    setSelectedStudy(study);
    setShowEditModal(true);
  };

  const handleView = (study: Study) => {
    setSelectedStudy(study);
    setShowViewModal(true);
  };

  const handleShare = (study: Study) => {
    setSelectedStudy(study);
    setShowShareModal(true);
  };

  const handleCloseView = () => {
    setShowViewModal(false);
    setSelectedStudy(null);
  };

  const handleCloseShare = () => {
    setShowShareModal(false);
    setSelectedStudy(null);
  };

  return (
    <>
      {recentStudies.length === 0 ? (
        <HomeEmptyState onUploadClick={() => setShowUploadModal(true)} />
      ) : (
        <div>
          {/* KPIs */}
          <HomeKPIs
            totalStudies={stats.total}
            myStudies={stats.myStudies}
            familyStudies={stats.familyStudies}
          />

          {/* Recent Studies */}
          <HomeRecentStudies
            studies={recentStudies}
            familyMembers={familyMembers}
            onEdit={handleEdit}
            onView={handleView}
            onShare={handleShare}
          />
        </div>
      )}

      {/* Modals */}
      <UploadStudyModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        familyMembers={familyMembers}
      />

      {selectedStudy && (
        <>
          <EditStudyModal
            show={showEditModal}
            onHide={() => setShowEditModal(false)}
            study={selectedStudy}
            familyMembers={familyMembers}
            onDelete={() => {
              // TODO: Implement delete
              setShowEditModal(false);
            }}
            onUpdate={(updatedStudy) => {
              // TODO: Implement update
              setShowEditModal(false);
            }}
          />
          <ViewStudyModal
            show={showViewModal}
            onHide={handleCloseView}
            study={selectedStudy}
            familyMembers={familyMembers}
          />
          <ShareModal
            show={showShareModal}
            onHide={handleCloseShare}
            study={selectedStudy}
          />
        </>
      )}
    </>
  );
}
