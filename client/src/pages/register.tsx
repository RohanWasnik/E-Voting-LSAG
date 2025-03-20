import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVoterSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { generateOTP, verifyAadhaar } from "@/lib/aadhaar";
import { LSAG } from "@/lib/lsag";
import { useLocation } from "wouter";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const aadhaarFormSchema = z.object({
  aadhaarNumber: z.string().length(12, "Aadhaar number must be 12 digits").regex(/^\d+$/, "Must contain only numbers")
});

const otpFormSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "Must contain only numbers")
});

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<'aadhaar' | 'otp' | 'keys'>('aadhaar');
  const [isLoading, setIsLoading] = useState(false);

  const aadhaarForm = useForm({
    resolver: zodResolver(aadhaarFormSchema),
    defaultValues: {
      aadhaarNumber: ""
    }
  });

  const otpForm = useForm({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: ""
    }
  });

  const registrationForm = useForm({
    resolver: zodResolver(insertVoterSchema),
    defaultValues: {
      aadhaarId: "",
      publicKey: "",
      registrationCert: "",
      isVerified: false
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/voters/register', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "You can now cast your vote in the election"
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAadhaarSubmit = async (data: { aadhaarNumber: string }) => {
    try {
      setIsLoading(true);
      const response = await generateOTP(data.aadhaarNumber);
      if (response.success) {
        setStep('otp');
        toast({
          title: "OTP Sent",
          description: "Please check your registered mobile number"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to send OTP",
        description: "Please check your Aadhaar number",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (data: { otp: string }) => {
    try {
      setIsLoading(true);
      const aadhaarNumber = aadhaarForm.getValues("aadhaarNumber");
      const response = await verifyAadhaar({ aadhaarNumber, otp: data.otp });

      if (response.verified) {
        const lsag = LSAG.getInstance();
        const keyPair = await lsag.generateKeyPair();

        registrationForm.setValue("aadhaarId", aadhaarNumber);
        registrationForm.setValue("publicKey", keyPair.publicKey);
        registrationForm.setValue("registrationCert", await lsag.sign(aadhaarNumber, keyPair.privateKey));
        registrationForm.setValue("isVerified", true);

        setStep('keys');
      } else {
        toast({
          title: "Invalid OTP",
          description: "Please try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: any) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Voter Registration</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'aadhaar' && (
              <Form {...aadhaarForm}>
                <form onSubmit={aadhaarForm.handleSubmit(handleAadhaarSubmit)} className="space-y-4">
                  <FormField
                    control={aadhaarForm.control}
                    name="aadhaarNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhaar Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="Enter 12-digit Aadhaar number"
                            maxLength={12}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={!aadhaarForm.formState.isValid || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Get OTP"
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {step === 'otp' && (
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(handleOTPVerify)} className="space-y-4">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter OTP</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={!otpForm.formState.isValid || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {step === 'keys' && (
              <Form {...registrationForm}>
                <form onSubmit={registrationForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={registrationForm.control}
                    name="publicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Key</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing Registration...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}