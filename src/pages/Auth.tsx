import React, { useMemo, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // Reset forms when mode changes
  const handleModeChange = (newMode: "login" | "signup") => {
    setMode(newMode);
    setEmailSent(null); // Clear email sent state
    loginForm.reset();
    signupForm.reset();
  };

  // Resend verification email
  const handleResendEmail = async () => {
    if (!emailSent) return;
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailSent,
      options: {
        emailRedirectTo: `${window.location.origin}/auth?verified=true`
      }
    });
    
    if (error) {
      toast({ title: "Failed to resend", description: error.message });
    } else {
      toast({ 
        title: "Email sent!", 
        description: `Verification email sent again to ${emailSent}` 
      });
    }
  };

  // Check for verification success on component mount
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      toast({
        title: "Email verified successfully!",
        description: "Your account has been activated. You can now log in.",
      });
      // Clear the URL parameter
      window.history.replaceState({}, '', '/auth');
      // Switch to login mode
      setMode('login');
    }
  }, [searchParams]);

  const title = useMemo(() => (mode === "login" ? "Login" : "Create account"), [mode]);
  const description = useMemo(
    () => (mode === "login" ? "Access your Orbital Guardian dashboard." : "Sign up to start monitoring space debris."),
    [mode]
  );

  const onLoginSubmit = async (values: LoginFormValues) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back!", description: "Successfully logged in." });
    navigate("/");
  };

  const onSignupSubmit = async (values: SignupFormValues) => {
    const redirectUrl = `${window.location.origin}/auth?verified=true`;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { 
          display_name: values.name,
          full_name: values.name
        },
      },
    });
    
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      // Email confirmation required
      setEmailSent(values.email);
      toast({
        title: "Verification email sent!",
        description: `Please check your email (${values.email}) and click the verification link to activate your account.`,
      });
    } else if (data.session) {
      // User is immediately signed in (email confirmation disabled)
      toast({
        title: "Account created!",
        description: "Welcome to Orbital Guardian! Redirecting to dashboard...",
      });
      navigate("/");
    } else {
      // Fallback
      toast({
        title: "Account created!",
        description: "Please check your email for verification instructions.",
      });
    }
  };


  return (
    <main className="container max-w-md py-10">
      <Helmet>
        <title>{`${title} – Orbital Guardian`}</title>
        <meta name="description" content="Login or create an account to use Orbital Guardian space debris monitoring." />
        <link rel="canonical" href={`${window.location.origin}/auth`} />
      </Helmet>

      <h1 className="mb-2 text-2xl font-heading">{title}</h1>
      <p className="mb-6 text-muted-foreground">{description}</p>

      <div className="mb-4 flex gap-2">
        <Button variant={mode === "login" ? "default" : "outline"} onClick={() => handleModeChange("login")}>Login</Button>
        <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => handleModeChange("signup")}>Sign up</Button>
      </div>

      {mode === "login" ? (
        <Form {...loginForm} key="login-form">
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Login</Button>
          </form>
        </Form>
      ) : (
        <Form {...signupForm} key="signup-form">
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
            <FormField
              control={signupForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="John Doe" 
                      autoComplete="name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signupForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Create Account</Button>
          </form>
        </Form>
      )}

      {/* Email Verification Banner */}
      {emailSent && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold mb-2">Please check your email</h3>
          <p className="text-sm text-gray-600 mb-4">
            We've sent a verification email to <strong>{emailSent}</strong>. 
            Click the link in the email to activate your account.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleResendEmail}>
              Resend Email
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleModeChange('login')}>
              Back to Login
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
