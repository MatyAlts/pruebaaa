import moment from "moment";
import "moment/locale/es"; // Importar locale español

// Configurar moment a español
moment.locale("es");

// Helper function to parse date from DD-MM-YYYY format to Date object
export function parseDateFromDB(dateStr: string): Date {
  // Si está en formato DD-MM-YYYY o DD-MM-YYYY HH:mm
  if (/^\d{2}-\d{2}-\d{4}/.test(dateStr)) {
    const [datePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("-");
    // Crear fecha en zona horaria local (no UTC) para evitar problemas de conversión
    // El mes es 0-indexed en JavaScript (enero = 0)
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  // Si viene en otro formato, intentar parsearlo directamente
  return new Date(dateStr);
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Helper function to format date
export function formatDate(date: Date | string): string {
  let dateObj: Date;

  // Si es un string, parsearlo con nuestra función
  if (typeof date === "string") {
    dateObj = parseDateFromDB(date);
  } else {
    dateObj = date;
  }

  // Validar que la fecha sea válida
  if (isNaN(dateObj.getTime())) {
    console.error("Fecha inválida:", date);
    return "Fecha inválida";
  }

  // Usar moment para formatear con el formato personalizado
  // Formato: "07 de jul de 2024"
  const momentDate = moment(dateObj);
  const day = momentDate.format("DD");
  const month = momentDate.format("MMM");
  const year = momentDate.format("YYYY");

  return `${day} de ${month} de ${year}`;
}

// Helper function to format relative time
export function formatRelativeTime(date: Date | string): string {
  let dateObj: Date;
  
  // Si es un string, parsearlo con nuestra función
  if (typeof date === "string") {
    dateObj = parseDateFromDB(date);
  } else {
    dateObj = date;
  }
  
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Hoy";
  if (diffInDays === 1) return "Ayer";
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
  if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;
  return `Hace ${Math.floor(diffInDays / 365)} años`;
}
