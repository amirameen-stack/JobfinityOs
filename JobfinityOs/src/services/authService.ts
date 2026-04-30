import { api } from "../api/axios";

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  username: string;
}

export const authService = {
  login: (data: LoginDTO) =>
    api.post("/auth/login", data).then((res) => res.data.data),

  register: (data: RegisterDTO) =>
    api.post("/auth/register", data).then((res) => res.data.data),

  logout: () =>
    api.post("/auth/logout").then((res) => res.data),

  me: () =>
    api.get("/auth/profile").then((res) => res.data.data as AuthUser),
};