import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Secure E-Voting System
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Register</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Register with your Aadhaar ID to participate in the election
              </p>
              <Link href="/register">
                <Button className="w-full">Register Now</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vote</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Cast your vote securely using LSAG signatures
              </p>
              <Link href="/vote">
                <Button className="w-full" variant="outline">Vote Now</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View election results and verify the blockchain
              </p>
              <Link href="/results">
                <Button className="w-full" variant="secondary">View Results</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>About This System</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This e-voting system uses advanced cryptographic techniques including Linkable Spontaneous Anonymous Group (LSAG) signatures to ensure voter privacy and election integrity. The system is integrated with Aadhaar for voter verification and uses blockchain technology to maintain an immutable record of votes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
