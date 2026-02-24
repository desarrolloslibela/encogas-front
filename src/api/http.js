import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 20000
});

export function setAuthToken(token) {
  if (token) {
    http.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common["Authorization"];
  }
}