import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVoteSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LSAG } from "@/lib/lsag";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
}

export default function Vote() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isComputing, setIsComputing] = useState(false);

  // Fetch active election
  const electionQuery = useQuery({
    queryKey: ['/api/elections/active'],
    select: (data: any) => data as { id: string, candidates: Candidate[] }
  });

  const voteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/votes/cast', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Vote Cast Successfully",
        description: "Your vote has been securely recorded on the blockchain"
      });
      navigate("/results");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Cast Vote",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (candidateId: string) => {
    if (!electionQuery.data) return;

    try {
      setIsComputing(true);
      const lsag = LSAG.getInstance();

      // Step 1: Create vote data
      const voteData = {
        candidateId,
        electionId: electionQuery.data.id,
        timestamp: new Date().toISOString()
      };

      // Step 2: Compute hash of the vote
      const encoder = new TextEncoder();
      const voteBuffer = encoder.encode(JSON.stringify(voteData));
      const voteHash = await crypto.subtle.digest('SHA-256', voteBuffer);
      const voteHashHex = Array.from(new Uint8Array(voteHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Step 3: Generate LSAG signature
      const signature = await lsag.sign(voteHashHex, electionQuery.data.id);

      // Step 4: Submit vote
      voteMutation.mutate({
        electionId: electionQuery.data.id,
        voteHash: voteHashHex,
        lsagSignature: signature
      });
    } catch (error) {
      toast({
        title: "Vote Creation Failed",
        description: "Failed to create cryptographic proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsComputing(false);
    }
  };

  if (electionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!electionQuery.data) {
    return (
      <div className="min-h-screen p-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-center">No Active Election</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Cast Your Vote</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              onValueChange={onSubmit}
              className="space-y-4"
              disabled={isComputing || voteMutation.isPending}
            >
              {electionQuery.data.candidates.map((candidate, index) => (
                <div key={candidate.id} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={candidate.id} 
                    id={candidate.id}
                    disabled={isComputing || voteMutation.isPending}
                  />
                  <label 
                    htmlFor={candidate.id} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {candidate.name}
                  </label>
                </div>
              ))}
            </RadioGroup>

            {(isComputing || voteMutation.isPending) && (
              <div className="mt-4 text-sm text-muted-foreground flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isComputing ? "Computing cryptographic proof..." : "Casting vote..."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}