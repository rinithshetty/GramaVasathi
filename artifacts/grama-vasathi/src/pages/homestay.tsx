import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format, isBefore, startOfDay } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Star, Users, Home, BedDouble, ShieldCheck, CheckCircle2, ChevronLeft } from "lucide-react";

import {
  useGetHomestay,
  useGetHomestayAvailability,
  useCreateBooking,
  useGetHomestayChecklist,
  getGetHomestayQueryKey,
  getGetHomestayAvailabilityQueryKey,
  getGetRecentBookingsQueryKey,
  getGetInsightsSummaryQueryKey,
} from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  guestName: z.string().min(2, "Name must be at least 2 characters"),
  guestEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  checkInDate: z.date({ required_error: "Please select a check-in date" }),
  guests: z.coerce.number().min(1).max(12),
});

export default function HomestayDetail() {
  const { id } = useParams<{ id: string }>();
  const homestayId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: homestay, isLoading: loadingHomestay } = useGetHomestay(homestayId, {
    query: { enabled: !!homestayId, queryKey: getGetHomestayQueryKey(homestayId) },
  });

  const { data: availability, isLoading: loadingAvailability } = useGetHomestayAvailability(homestayId, {
    query: { enabled: !!homestayId, queryKey: getGetHomestayAvailabilityQueryKey(homestayId) },
  });

  const { data: checklist, isLoading: loadingChecklist } = useGetHomestayChecklist(homestayId, {
    query: { enabled: !!homestayId, queryKey: [`/api/homestays/${homestayId}/checklist`] },
  });

  const createBooking = useCreateBooking();

  const bookedDates = useMemo(() => {
    return (availability?.bookedDates || []).map((d) => new Date(d));
  }, [availability]);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      guests: 1,
    },
  });

  const onSubmit = (values: z.infer<typeof bookingSchema>) => {
    createBooking.mutate(
      {
        data: {
          homestayId,
          guestName: values.guestName,
          guestEmail: values.guestEmail || undefined,
          checkInDate: format(values.checkInDate, "yyyy-MM-dd"),
          guests: values.guests,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Booking Confirmed! 🎉",
            description: `You're all set to visit ${homestay?.name}.`,
          });
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetHomestayAvailabilityQueryKey(homestayId) });
          queryClient.invalidateQueries({ queryKey: getGetRecentBookingsQueryKey({ limit: 3 }) });
          queryClient.invalidateQueries({ queryKey: getGetInsightsSummaryQueryKey() });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Booking failed",
            description: err.message || "An unexpected error occurred.",
          });
        },
      }
    );
  };

  if (loadingHomestay) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div>
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!homestay) {
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
    <div className="pb-20">
      <div className="container mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Discover
        </Link>

        {/* Hero Image */}
        <div className="relative h-[400px] md:h-[500px] w-full rounded-3xl overflow-hidden mb-10 shadow-lg">
          <img src={homestay.imageUrl} alt={homestay.name} className="absolute inset-0 w-full h-full object-cover" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-medium">
                  {homestay.region}
                </Badge>
                <div className="flex items-center text-sm font-bold text-accent">
                  <Star className="w-4 h-4 mr-1 fill-accent" />
                  {homestay.rating.toFixed(1)} <span className="text-muted-foreground font-normal ml-1">({homestay.reviewCount} reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight mb-4">
                {homestay.name}
              </h1>
              <p className="text-lg text-muted-foreground flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                {homestay.village}, {homestay.state}
              </p>
            </div>

            <Separator />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col">
                <Users className="w-6 h-6 text-primary mb-2" />
                <span className="font-bold text-foreground">Up to {homestay.maxGuests} guests</span>
              </div>
              <div className="flex flex-col">
                <BedDouble className="w-6 h-6 text-primary mb-2" />
                <span className="font-bold text-foreground">{homestay.bedrooms} bedrooms</span>
              </div>
              <div className="flex flex-col">
                <Home className="w-6 h-6 text-primary mb-2" />
                <span className="font-bold text-foreground">Entire home</span>
              </div>
              <div className="flex flex-col">
                <ShieldCheck className="w-6 h-6 text-primary mb-2" />
                <span className="font-bold text-foreground">Verified Host</span>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-2xl font-serif font-bold mb-4">About your stay</h2>
              <div className="prose prose-stone max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {homestay.description}
              </div>
            </div>

            {/* Activities */}
            {homestay.activities && homestay.activities.length > 0 && (
              <div>
                <h2 className="text-2xl font-serif font-bold mb-4">Local Activities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {homestay.activities.map((activity, i) => (
                    <div key={i} className="flex items-start bg-muted/30 p-4 rounded-xl border border-border/40">
                      <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0 mt-0.5" />
                      <span className="font-medium">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Host Readiness */}
            <div className="bg-secondary/5 rounded-2xl p-6 md:p-8 border border-secondary/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-foreground">Host Readiness</h2>
                  <p className="text-muted-foreground mt-1">What to expect when you arrive</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center shadow-sm">
                  <span className="font-bold text-lg text-primary">{checklist?.score ?? homestay.readinessScore}%</span>
                </div>
              </div>

              {loadingChecklist ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
                </div>
              ) : checklist && checklist.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  {checklist.items.map((item) => (
                    <div key={item.key} className="flex items-center">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center mr-3 shrink-0", item.checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {item.checked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />}
                      </div>
                      <span className={cn("font-medium", !item.checked && "text-muted-foreground line-through opacity-70")}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Checklist information unavailable.</p>
              )}
            </div>
          </div>

          {/* Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="border border-border/60 shadow-xl overflow-hidden rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <span className="text-3xl font-serif font-bold text-foreground">₹{homestay.pricePerNight}</span>
                      <span className="text-muted-foreground ml-1">/ night</span>
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="checkInDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="font-bold">Check-in Date</FormLabel>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal h-12 bg-muted/50 border-border/50",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Select a date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setCalendarOpen(false);
                                  }}
                                  disabled={(date) =>
                                    isBefore(date, startOfDay(new Date())) ||
                                    bookedDates.some(
                                      (booked) =>
                                        date.getDate() === booked.getDate() &&
                                        date.getMonth() === booked.getMonth() &&
                                        date.getFullYear() === booked.getFullYear()
                                    )
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="guests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Guests</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={homestay.maxGuests} className="h-12 bg-muted/50 border-border/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="my-2" />

                      <FormField
                        control={form.control}
                        name="guestName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Arjun Sharma" className="h-12 bg-muted/50 border-border/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="guestEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Email (Optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="arjun@example.com" className="h-12 bg-muted/50 border-border/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full h-14 mt-4 text-lg font-bold shadow-md hover-elevate transition-all"
                        disabled={createBooking.isPending}
                      >
                        {createBooking.isPending ? "Booking..." : "Book your stay"}
                      </Button>
                      
                      <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
                        You won't be charged yet
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <div className="mt-6 text-center">
                <Link href={`/homestays/${homestayId}/host`} className="text-sm text-primary font-medium hover:underline flex items-center justify-center">
                  Are you the host? Edit Readiness
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
