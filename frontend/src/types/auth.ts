export interface User {
  email: string;
  name?: string;
  status?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  email: string;
  access_token: string;
  token_type: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  email: string;
  master_passphrase: string;
  new_password: string;
}

export interface UserStats {
  active_count: number;
  done_count: number;
  total: number;
}
