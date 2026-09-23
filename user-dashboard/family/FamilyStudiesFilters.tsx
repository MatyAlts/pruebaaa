"use client";

import { Form, InputGroup, Button } from "react-bootstrap";

interface FamilyStudiesFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  medicoQuery: string;
  setMedicoQuery: (query: string) => void;
  institutionQuery: string;
  setInstitutionQuery: (query: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
}

const months = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

export default function FamilyStudiesFilters({
  searchQuery,
  setSearchQuery,
  medicoQuery,
  setMedicoQuery,
  institutionQuery,
  setInstitutionQuery,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}: FamilyStudiesFiltersProps) {
  // Generate years array (from 2020 to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2019 + 1 },
    (_, i) => 2020 + i,
  );

  const clearAllFilters = () => {
    setSearchQuery("");
    setMedicoQuery("");
    setInstitutionQuery("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  return (
    <div className="bg-white rounded-3 p-3 mb-4 border">
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="7.5"
                  cy="7.5"
                  r="5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M11.5 11.5L14.5 14.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar estudios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-start-0"
              style={{ boxShadow: "none" }}
            />
          </InputGroup>
        </div>

        <div className="col-12 col-md-4">
          <Form.Control
            type="text"
            placeholder="Buscar por médico..."
            value={medicoQuery}
            onChange={(e) => setMedicoQuery(e.target.value)}
            style={{ boxShadow: "none" }}
          />
        </div>

        <div className="col-12 col-md-4">
          <Form.Control
            type="text"
            placeholder="Buscar por institución..."
            value={institutionQuery}
            onChange={(e) => setInstitutionQuery(e.target.value)}
            style={{ boxShadow: "none" }}
          />
        </div>

        <div className="col-12 col-md-6 date-filter-month">
          <Form.Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ fontSize: "0.9rem" }}
          >
            <option value="">Mes</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </Form.Select>
        </div>

        <div className="col-12 col-md-6 date-filter-year">
          <Form.Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ fontSize: "0.9rem" }}
          >
            <option value="">Año</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      {/* Active filters display */}
      {(searchQuery || medicoQuery || institutionQuery || selectedMonth || selectedYear) && (
        <div className="mt-3 pt-3 border-top">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>
              Filtros activos:
            </span>
            {searchQuery && (
              <span className="badge bg-light text-dark border">
                Búsqueda: &quot;{searchQuery}&quot;
                <button
                  className="btn-close btn-close-sm ms-2"
                  style={{ fontSize: "0.6rem" }}
                  onClick={() => setSearchQuery("")}
                  aria-label="Close"
                />
              </span>
            )}
            {medicoQuery && (
              <span className="badge bg-light text-dark border">
                Médico: &quot;{medicoQuery}&quot;
                <button
                  className="btn-close btn-close-sm ms-2"
                  style={{ fontSize: "0.6rem" }}
                  onClick={() => setMedicoQuery("")}
                  aria-label="Close"
                />
              </span>
            )}
            {institutionQuery && (
              <span className="badge bg-light text-dark border">
                Institución: &quot;{institutionQuery}&quot;
                <button
                  className="btn-close btn-close-sm ms-2"
                  style={{ fontSize: "0.6rem" }}
                  onClick={() => setInstitutionQuery("")}
                  aria-label="Close"
                />
              </span>
            )}
            {(selectedMonth || selectedYear) && (
              <span className="badge bg-light text-dark border">
                {selectedMonth &&
                  months.find((m) => m.value === selectedMonth)?.label}
                {selectedMonth && selectedYear && " "}
                {selectedYear}
                <button
                  className="btn-close btn-close-sm ms-2"
                  style={{ fontSize: "0.6rem" }}
                  onClick={() => {
                    setSelectedMonth("");
                    setSelectedYear("");
                  }}
                  aria-label="Close"
                />
              </span>
            )}
            <Button
              variant="link"
              className="text-danger p-0"
              style={{ fontSize: "0.875rem" }}
              onClick={clearAllFilters}
            >
              Limpiar todos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
