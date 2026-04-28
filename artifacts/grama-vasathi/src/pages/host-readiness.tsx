import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Save, ShieldAlert, CheckCircle2 } from "lucide-react";

import {
  useGetHomestay,
  useGetHomestayChecklist,
  useSaveHomestayChecklist,
  getGetHomestayQueryKey,
  getGetHomestayChecklistQueryKey,
  getGetTopHomestaysQueryKey,
  getGetInsightsSummaryQueryKey,
} from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function HostReadiness() {
  const { id } = useParams<{ id: string }>();
  const homestayId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: homestay, isLoading: loadingHomestay } = useGetHomestay(homestayId, {
    query: { enabled: !!homestayId, queryKey: getGetHomestayQueryKey(homestayId) },
  });

  const { data: checklist, isLoading: loadingChecklist } = useGetHomestayChecklist(homestayId, {
    query: { enabled: !!homestayId, queryKey: getGetHomestayChecklistQueryKey(homestayId) },
  });

  const saveChecklist = useSaveHomestayChecklist();

  // Local state for optimistic updates
  const [items, setItems] = useState<{key: string, label: string, checked: boolean}[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (checklist) {
      setItems(checklist.items);
      setScore(checklist.score);
    }
  }, [checklist]);

  const handleToggle = (key: string, checked: boolean) => {
    const newItems = items.map(item => item.key === key ? { ...item, checked } : item);
    setItems(newItems);
    
    // Optimistic score calc
    const checkedCount = newItems.filter(i => i.checked).length;
    const newScore = Math.round((checkedCount / newItems.length) * 100);
    setScore(newScore);
  };

  const handleSave = () => {
    saveChecklist.mutate(
      {
        id: homestayId,
        data: {
          items: items.map(i => ({ key: i.key, checked: i.checked }))
        }
      },
      {
        onSuccess: (data) => {
          setScore(data.score);
          toast({
            title: "Checklist Saved",
            description: "Your readiness score has been updated.",
          });
          queryClient.invalidateQueries({ queryKey: getGetHomestayChecklistQueryKey(homestayId) });
          queryClient.invalidateQueries({ queryKey: getGetTopHomestaysQueryKey({ limit: 4 }) });
          queryClient.invalidateQueries({ queryKey: getGetInsightsSummaryQueryKey() });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save checklist. Please try again.",
          });
        }
      }
    );
  };

  if (loadingHomestay || loadingChecklist) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-40 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="space-y-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!homestay || !checklist) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Homestay not found</h2>
        <Link href="/">
          <Button variant="outline">Back to Discover</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 pb-20">
      <Link href={`/homestays/${homestayId}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to {homestay.name}
      </Link>

      <Card className="border-border/60 shadow-lg overflow-hidden bg-card/50">
        <div className="bg-primary/5 p-8 border-b border-border/40 text-center">
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-full bg-background shadow-md border border-border">
            {score >= 80 ? (
              <CheckCircle2 className="w-10 h-10 text-primary" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-accent" />
            )}
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Host Readiness</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Update your checklist to let guests know what to expect. Higher scores attract more bookings.
          </p>

          <div className="mt-8 max-w-sm mx-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Score</span>
              <span className="font-serif font-bold text-3xl text-primary">{score}%</span>
            </div>
            <Progress value={score} className="h-3 bg-muted" />
          </div>
        </div>

        <CardContent className="p-8">
          <div className="space-y-6">
            {items.map((item) => (
              <div 
                key={item.key} 
                className={`flex items-start space-x-4 p-4 rounded-xl border transition-colors ${item.checked ? 'bg-primary/5 border-primary/20' : 'bg-background border-border/50 hover:bg-muted/50'}`}
              >
                <Checkbox 
                  id={item.key} 
                  checked={item.checked} 
                  onCheckedChange={(checked) => handleToggle(item.key, checked as boolean)}
                  className="mt-1 w-6 h-6 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className="grid gap-1.5 leading-none cursor-pointer" onClick={() => handleToggle(item.key, !item.checked)}>
                  <label 
                    htmlFor={item.key}
                    className="text-lg font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground"
                  >
                    {item.label}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Ensure this is ready before a guest arrives.
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-end">
            <Button 
              size="lg" 
              className="px-8 font-bold shadow-md hover-elevate transition-all text-lg h-14"
              onClick={handleSave}
              disabled={saveChecklist.isPending}
            >
              {saveChecklist.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 w-5 h-5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
