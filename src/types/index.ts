export type Role = 'SUPERADMIN' | 'ADMINISTRADOR' | 'LECTOR';

export interface UserSessionPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  must_change_password: boolean;
  branchPermissions: {
    branchId: string;
    sectorId?: string;
    departmentId: string | null;
  }[];
}

export interface DynamicAttributeDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  required?: boolean;
}

export interface CSVImportRow {
  rut_document: string;
  full_name: string;
  email: string;
  position: string;
  branch_code_or_name: string;
  department_name: string;
}

export interface CSVImportResult {
  totalProcessed: number;
  createdCount: number;
  omittedCount: number;
  failedCount: number;
  created: { rut: string; name: string }[];
  omitted: { rut: string; name: string; reason: string }[];
  failed: { rut: string; name: string; error: string }[];
}

export interface FilterParams {
  query?: string;
  branchId?: string;
  departmentId?: string;
  typeId?: string;
  status?: string;
}
