export type Shift = "Reguler" | "Pagi" | "Siang" | "Malam";

export type ShiftTimeSettings = {
  checkInStart: string;
  checkInEnd: string;
  checkOutStart: string;
  checkOutEnd: string;
  overtimeThreshold: string;
};

export type TimeSettings = {
  [key in Shift]: ShiftTimeSettings;
};

export type AccessSettings = {
  allowEmployeeDashboardAccess: boolean;
  allowEmployeeViewAllRecords: boolean;
  requirePhotoForCheckIn: boolean;
  allowLogbookEdit: boolean;
};