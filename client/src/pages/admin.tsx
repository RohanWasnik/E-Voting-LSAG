import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertElectionSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Loader2, Plus, X } from "lucide-react";

export default function Admin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<string[]>([""]);

  const form = useForm({
    resolver: zodResolver(insertElectionSchema),
    defaultValues: {
      electionId: "",
      title: "",
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      candidates: [],
      isActive: true
    }
  });

  const createElectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        candidates: candidates.filter(c => c.trim() !== "")
      };
      const res = await apiRequest('POST', '/api/elections/create', formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Election Created",
        description: "The election has been successfully created"
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Election",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addCandidate = () => {
    setCandidates([...candidates, ""]);
  };

  const removeCandidate = (index: number) => {
    const newCandidates = [...candidates];
    newCandidates.splice(index, 1);
    setCandidates(newCandidates);
  };

  const updateCandidate = (index: number, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = value;
    setCandidates(newCandidates);
  };

  const onSubmit = (data: any) => {
    if (candidates.filter(c => c.trim() !== "").length < 2) {
      toast({
        title: "Invalid Candidates",
        description: "Please add at least two candidates",
        variant: "destructive"
      });
      return;
    }
    createElectionMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Election</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Election Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., General Election 2024" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="electionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Election ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., election-2024" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Candidates</label>
                  {candidates.map((candidate, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={candidate}
                        onChange={(e) => updateCandidate(index, e.target.value)}
                        placeholder={`Candidate ${index + 1}`}
                      />
                      {candidates.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeCandidate(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCandidate}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Candidate
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createElectionMutation.isPending}
                >
                  {createElectionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Election...
                    </>
                  ) : (
                    "Create Election"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}