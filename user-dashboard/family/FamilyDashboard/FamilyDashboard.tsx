"use client";

import { useState } from "react";
import { FamilyMember } from "@/types";
import AddFamilyMemberModal from "@/components/modals/AddFamilyMemberModal";
import FamilyMemberCard from "../FamilyMemberCard";
import FamilyEmptyState from "../FamilyEmptyState";

interface FamilyDashboardProps {
  familyMembers: FamilyMember[];
}

export default function FamilyDashboard({ familyMembers }: FamilyDashboardProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      {familyMembers.length === 0 ? (
        <FamilyEmptyState onAddClick={() => setShowAddModal(true)} />
      ) : (
        <div className="row g-4">
          {familyMembers.map((member) => (
            <div key={member.id} className="col-md-6 col-lg-4">
              <FamilyMemberCard member={member} />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AddFamilyMemberModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
      />
    </>
  );
}
