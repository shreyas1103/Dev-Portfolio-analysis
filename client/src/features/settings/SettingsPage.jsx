import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  getAccounts,
  connectGithub,
  connectLeetcode,
} from "../../api/accounts.api";

export function SettingsPage() {
  const [username, setUsername] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  const [githubLoading, setGithubLoading] = useState(false);
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);

  const [githubError, setGithubError] = useState(null);
  const [leetcodeError, setLeetcodeError] = useState(null);

  const [leetcodeSuccess, setLeetcodeSuccess] = useState(false);

  // Load connected accounts
  useEffect(() => {
    async function loadAccounts() {
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (error) {
        console.error("Unable to load connected accounts:", error);
      } finally {
        setAccountsLoading(false);
      }
    }

    loadAccounts();
  }, []);

  const githubAccount = accounts.find(
    (account) => account.source === "github"
  );

  const leetcodeAccount = accounts.find(
    (account) => account.source === "leetcode"
  );

  async function handleGithubConnect() {
    setGithubError(null);
    setGithubLoading(true);

    try {
      const redirectUrl = await connectGithub();

      window.location.href = redirectUrl;
    } catch (error) {
      setGithubError(
        error.response?.data?.error?.message ||
          "Unable to connect GitHub."
      );

      setGithubLoading(false);
    }
  }

  async function handleLeetcodeConnect(e) {
    e.preventDefault();

    setLeetcodeError(null);
    setLeetcodeSuccess(false);
    setLeetcodeLoading(true);

    try {
      const connectedAccount = await connectLeetcode(username);

      setAccounts((current) => [
        ...current.filter(
          (account) => account.source !== "leetcode"
        ),
        connectedAccount,
      ]);

      setLeetcodeSuccess(true);
      setUsername("");
    } catch (error) {
      setLeetcodeError(
        error.response?.data?.error?.message ||
          "Unable to connect LeetCode."
      );
    } finally {
      setLeetcodeLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Settings
        </h1>

        <p className="mt-1 text-slate-600">
          Connect your developer platforms to analyze your activity.
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* GitHub */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>GitHub</CardTitle>

              <Badge variant="secondary">
                GitHub
              </Badge>
            </div>

            <CardDescription>
              Connect GitHub to analyze your repositories,
              commits, and project quality.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {githubError && (
              <p className="text-sm text-red-600">
                {githubError}
              </p>
            )}

            {accountsLoading ? (
              <p className="text-sm text-slate-500">
                Checking connection...
              </p>
            ) : githubAccount ? (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    @{githubAccount.externalUsername}
                  </p>

                  <p className="text-xs text-slate-500">
                    GitHub account connected
                  </p>
                </div>

                <Badge>
                  Connected
                </Badge>
              </div>
            ) : (
              <Button
                onClick={handleGithubConnect}
                disabled={githubLoading}
              >
                {githubLoading
                  ? "Connecting..."
                  : "Connect GitHub"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* LeetCode */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>LeetCode</CardTitle>

              <Badge variant="secondary">
                LeetCode
              </Badge>
            </div>

            <CardDescription>
              Connect your LeetCode username to analyze
              your problem-solving activity.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {accountsLoading ? (
              <p className="text-sm text-slate-500">
                Checking connection...
              </p>
            ) : leetcodeAccount ? (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    @{leetcodeAccount.externalUsername}
                  </p>

                  <p className="text-xs text-slate-500">
                    LeetCode account connected
                  </p>
                </div>

                <Badge>
                  Connected
                </Badge>
              </div>
            ) : (
              <form
                onSubmit={handleLeetcodeConnect}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="leetcode-username">
                    LeetCode Username
                  </Label>

                  <Input
                    id="leetcode-username"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    placeholder="Enter your LeetCode username"
                    required
                  />
                </div>

                {leetcodeError && (
                  <p className="text-sm text-red-600">
                    {leetcodeError}
                  </p>
                )}

                {leetcodeSuccess && (
                  <p className="text-sm text-green-600">
                    LeetCode account connected successfully.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={leetcodeLoading}
                >
                  {leetcodeLoading
                    ? "Connecting..."
                    : "Connect LeetCode"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Account Connections</CardTitle>

          <CardDescription>
            Overview of your connected developer platforms.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {accountsLoading ? (
            <p className="text-sm text-slate-500">
              Loading connected accounts...
            </p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-slate-500">
              No accounts connected yet.
            </p>
          ) : (
            accounts.map((account) => (
              <div
                key={account._id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium capitalize">
                    {account.source}
                  </p>

                  <p className="text-sm text-slate-500">
                    @{account.externalUsername}
                  </p>
                </div>

                <Badge>
                  Connected
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}