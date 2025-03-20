// Mock Aadhaar verification service
export async function verifyAadhaarMock(
  aadhaarNumber: string, 
  otp: string
): Promise<boolean> {
  try {
    // Basic validation
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      throw new Error('Invalid Aadhaar number format');
    }

    if (!otp || otp.length !== 6) {
      throw new Error('Invalid OTP format');
    }

    // In production, this would make actual API calls to Aadhaar service
    // For testing, accept any valid format Aadhaar number with OTP "123456"
    const isValidFormat = /^\d{12}$/.test(aadhaarNumber);
    const isValidOTP = otp === "123456";

    return isValidFormat && isValidOTP;
  } catch (error) {
    console.error('Aadhaar verification error:', error);
    return false;
  }
}

export async function generateMockOTP(aadhaarNumber: string): Promise<string> {
  // In production, this would generate and send a real OTP
  // For testing, always return "123456"
  return "123456";
}