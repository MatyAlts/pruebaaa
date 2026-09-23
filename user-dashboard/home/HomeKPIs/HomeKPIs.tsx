"use client";

import styles from "./HomeKPIs.module.css";

interface HomeKPIsProps {
  totalStudies: number;
  myStudies: number;
  familyStudies: number;
}

export default function HomeKPIs({ totalStudies, myStudies, familyStudies }: HomeKPIsProps) {
  return (
    <div className={`row g-3 mb-4 ${styles.homeKpis}`}>
      {/* Total Estudios */}
      <div className="col-md-4">
        <div className="bg-white rounded-3 p-4 border h-100">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--saluteca-sky-faint)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z"
                  stroke="var(--saluteca-ocean)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 2V9H20"
                  stroke="var(--saluteca-ocean)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: "1rem" }}>
                Total estudios
              </div>
              <div className="h4 mb-0 fw-semibold">{totalStudies}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mis Estudios */}
      <div className="col-md-4">
        <div className="bg-white rounded-3 p-4 border h-100">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--saluteca-family-wash)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="8" r="4" stroke="var(--saluteca-family)" strokeWidth="1.5" />
                <path
                  d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21"
                  stroke="var(--saluteca-family)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: "1rem" }}>
                Mis estudios
              </div>
              <div className="h4 mb-0 fw-semibold">{myStudies}</div>
            </div>
          </div>
        </div>
      </div>

      {/* De Familia */}
      <div className="col-md-4">
        <div className="bg-white rounded-3 p-4 border h-100">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--saluteca-green-wash)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                  stroke="var(--saluteca-green)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="7" r="4" stroke="var(--saluteca-green)" strokeWidth="1.5" />
                <path
                  d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                  stroke="var(--saluteca-green)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                  stroke="var(--saluteca-green)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: "1rem" }}>
                De familia
              </div>
              <div className="h4 mb-0 fw-semibold">{familyStudies}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
