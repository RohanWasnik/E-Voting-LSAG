import { apiRequest } from './queryClient';

export interface AadhaarVerificationRequest {
  aadhaarNumber: string;
  otp: string;
}

export interface AadhaarVerificationResponse {
  success: boolean;
  message: string;
  verified: boolean;
}

export const verifyAadhaar = async (data: AadhaarVerificationRequest): Promise<AadhaarVerificationResponse> => {
  const response = await apiRequest('POST', '/api/aadhaar/verify', data);
  return response.json();
};

export const generateOTP = async (aadhaarNumber: string): Promise<{success: boolean}> => {
  const response = await apiRequest('POST', '/api/aadhaar/generate-otp', { aadhaarNumber });
  return response.json();
};
