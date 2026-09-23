import { Container } from "react-bootstrap";
import { Study } from "@/types";
import SharedStudyHeader from "./SharedStudyHeader";
import SharedStudyCard from "./SharedStudyCard";
import SharedStudyCTA from "./SharedStudyCTA";

interface SharedStudyViewProps {
  study: Study;
  linkUuid: string;
}

export default function SharedStudyView({ study, linkUuid }: SharedStudyViewProps) {
  return (
    <div className="min-vh-100 bg-light">
      <SharedStudyHeader />

      <Container className="py-4">
        <SharedStudyCard study={study} linkUuid={linkUuid} />

        <SharedStudyCTA />
      </Container>
    </div>
  );
}
