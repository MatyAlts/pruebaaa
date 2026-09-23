"use client";

import { useState } from "react";
import ShareModal from "@/components/modals/ShareModal";
import ViewStudyModal from "@/components/modals/ViewStudyModal";
import UploadStudyModal from "@/components/modals/UploadStudyModal";
import EditStudyModal from "@/components/modals/EditStudyModal";
import FamilyMemberHeader from "./FamilyMemberHeader";
import FamilyStudiesFilters from "./FamilyStudiesFilters";
import FamilyStudiesList from "./FamilyStudiesList";
import type { Study, FamilyMember } from "@/types";
import { parseDateFromDB } from "@/lib/formatters";

interface FamilyMemberDetailProps {
  member: FamilyMember;
  studies: Study[];
  studyCount: number;
  lastStudyDate: string | null;
  familyMembers?: FamilyMember[];
  onUploadClick?: () => void;
}

export default function FamilyMemberDetail({
  member,
  studies: allStudies,
  studyCount,
  lastStudyDate = null,
  familyMembers = [],
  onUploadClick
}: FamilyMemberDetailProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [shareStudy, setShareStudy] = useState<Study | null>(null);
  const [editStudy, setEditStudy] = useState<Study | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [medicoQuery, setMedicoQuery] = useState("");
  const [institutionQuery, setInstitutionQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Filter studies
  const studies = allStudies.filter((study) => {
    const matchesSearch =
      searchQuery === "" ||
      study.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMedico =
      medicoQuery === "" ||
      study.medico?.toLowerCase().includes(medicoQuery.toLowerCase());

    const matchesInstitution =
      institutionQuery === "" ||
      study.institution?.toLowerCase().includes(institutionQuery.toLowerCase());

    const matchesDate = (!selectedMonth && !selectedYear) || (() => {
      const studyDate = parseDateFromDB(study.date);
      const monthMatch = !selectedMonth || studyDate.getMonth() + 1 === parseInt(selectedMonth);
      const yearMatch = !selectedYear || studyDate.getFullYear() === parseInt(selectedYear);
      return monthMatch && yearMatch;
    })();

    return matchesSearch && matchesMedico && matchesInstitution && matchesDate;
  });

  const hasFilters = !!(searchQuery || medicoQuery || institutionQuery || selectedMonth || selectedYear);

  return (
    <>
      {/* Member Info & KPIs */}
      <FamilyMemberHeader
        member={member}
        studyCount={studyCount}
        lastStudyDate={lastStudyDate}
      />

      {/* Studies Section */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="h5 fw-semibold mb-0">Estudios</h3>
      </div>

      {/* Search and Filters */}
      <FamilyStudiesFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        medicoQuery={medicoQuery}
        setMedicoQuery={setMedicoQuery}
        institutionQuery={institutionQuery}
        setInstitutionQuery={setInstitutionQuery}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />

      {/* Studies List */}
      <FamilyStudiesList
        studies={studies}
        memberName={member.name}
        hasFilters={hasFilters}
        onView={(study) => {
          setShareStudy(study);
          setShowViewModal(true);
        }}
        onShare={(study) => setShareStudy(study)}
        onUpload={onUploadClick || (() => setShowUploadModal(true))}
        onEdit={(study) => {
          setEditStudy(study);
          setShowEditModal(true);
        }}
      />

      {/* Modals */}
      <UploadStudyModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        familyMembers={familyMembers}
        familyMemberId={member.id}
      />

      {shareStudy && (
        <>
          <ViewStudyModal
            show={showViewModal}
            onHide={() => {
              setShowViewModal(false);
              setShareStudy(null);
            }}
            study={shareStudy}
            familyMembers={familyMembers}
          />
          <ShareModal
            show={!!shareStudy && !showViewModal}
            onHide={() => setShareStudy(null)}
            study={shareStudy}
          />
        </>
      )}

      {editStudy && (
        <EditStudyModal
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setEditStudy(null);
          }}
          study={editStudy}
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
      )}
    </>
  );
}
