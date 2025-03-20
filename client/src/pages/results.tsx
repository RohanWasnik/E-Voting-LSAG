import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ElectionResult {
  candidateId: string;
  candidateName: string;
  voteCount: number;
  percentage: number;
}

export default function Results() {
  const resultsQuery = useQuery({
    queryKey: ['/api/elections/active/results'],
    select: (data: any) => {
      const results: ElectionResult[] = data.results;
      const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);
      
      return results.map(result => ({
        ...result,
        percentage: (result.voteCount / totalVotes) * 100
      }));
    }
  });

  if (resultsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!resultsQuery.data) {
    return (
      <div className="min-h-screen p-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-center">No Results Available</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Election Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {resultsQuery.data.map((result: ElectionResult) => (
                <div key={result.candidateId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{result.candidateName}</span>
                    <span className="text-sm text-muted-foreground">
                      {result.voteCount} votes ({result.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={result.percentage} className="h-2" />
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Blockchain Verification</h3>
              <p className="text-sm text-muted-foreground">
                All votes are cryptographically signed using LSAG signatures and stored on the blockchain.
                Each vote can be independently verified using the transaction hash.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
