
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, redirect } from 'next/navigation'; // Changed from 'next/router'
import { Loader2 } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  useEffect(() => {
    if (!authLoading && currentUser) {
      redirect('/dashboard');
    }
  }, [currentUser, authLoading, router]);


  const onSubmit: SubmitHandler<AuthFormData> = async (data) => {
    setIsLoading(true);
    try {
      if (activeTab === 'login') {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Logged In", description: "Welcome back!" });
        // router.push('/dashboard'); // Redirection will be handled by AppLayout or useEffect
      } else {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Account Created", description: "Welcome! You are now logged in." });
        // router.push('/dashboard'); // Redirection will be handled by AppLayout or useEffect
      }
      reset(); // Reset form on success
    } catch (error: any) {
      console.error(`${activeTab} error:`, error);
      toast({
        title: "Authentication Error",
        description: error.message || `Could not ${activeTab}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (!authLoading && currentUser)) { // Show loader if auth state is loading or if user is logged in (and redirecting)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Tabs defaultValue="login" className="w-full max-w-md" onValueChange={(value) => { setActiveTab(value); reset(); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Access your financial dashboard.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" {...register('email')} placeholder="you@example.com" />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" {...register('password')} />
                  {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create an account to manage your finances.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" {...register('email')} placeholder="you@example.com" />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" {...register('password')} />
                  {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
