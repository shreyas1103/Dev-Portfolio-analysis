import apiClient from "./client";

export async function getAccounts() {
  const response = await apiClient.get("/accounts");

  return response.data.data.accounts;
}

export async function connectGithub() {
  const response = await apiClient.post("/accounts/github/connect");

  return response.data.data.redirectUrl;
}

export async function connectLeetcode(username) {
  const response = await apiClient.post(
    "/accounts/leetcode/connect",
    { username }
  );

  return response.data.data.connectedAccount;
}