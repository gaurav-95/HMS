import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/types";

const QUICK_ACCESS = [
  { label: "Super Admin", email: "admin@gsshospital.com" },
  { label: "Doctor", email: "doctor@gsshospital.com" },
  { label: "Technician", email: "tech@gsshospital.com" },
  { label: "Accountant", email: "accountant@gsshospital.com" },
  { label: "Metron", email: "metron@gsshospital.com" },
  { label: "CEO", email: "ceo@gsshospital.com" },
  { label: "Receptionist", email: "receptionist@gsshospital.com" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
    if (success) {
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  const handleQuickAccess = async (quickEmail: string) => {
    setError("");
    setIsSubmitting(true);
    const success = await login(quickEmail, "password123");
    setIsSubmitting(false);
    if (success) navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-lg">
            GSS
          </div>
          <h1 className="mt-4 text-2xl font-bold">GSS Hospital Pro</h1>
          <p className="text-muted-foreground">Gandhi Seva Sadan — Management System</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@gsshospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Access (Demo)</CardTitle>
            <CardDescription className="text-xs">Click any role to sign in instantly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACCESS.map((qa) => (
                <Button
                  key={qa.email}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAccess(qa.email)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  {qa.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
