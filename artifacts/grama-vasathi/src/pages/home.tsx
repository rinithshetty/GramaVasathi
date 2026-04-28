import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Search, MapPin, Star, Calendar, ArrowRight, ShieldCheck, Home as HomeIcon } from "lucide-react";
import { useListHomestays, useGetInsightsSummary, useGetRecentBookings, useGetTopHomestays, getListHomestaysQueryKey, getGetInsightsSummaryQueryKey, getGetRecentBookingsQueryKey, getGetTopHomestaysQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import heroImg from "@/assets/images/hero.png";
import { useDebounce } from "@/hooks/use-debounce";

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  });
  
  return debouncedValue;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);

  const { data: summary, isLoading: loadingSummary } = useGetInsightsSummary({
    query: { queryKey: getGetInsightsSummaryQueryKey() }
  });
  
  const { data: topHomestays, isLoading: loadingTop } = useGetTopHomestays({ limit: 4 }, {
    query: { queryKey: getGetTopHomestaysQueryKey({ limit: 4 }) }
  });

  const { data: recentBookings, isLoading: loadingRecent } = useGetRecentBookings({ limit: 3 }, {
    query: { queryKey: getGetRecentBookingsQueryKey({ limit: 3 }) }
  });

  const { data: homestays, isLoading: loadingHomestays } = useListHomestays({ q: debouncedSearch || undefined }, {
    query: { queryKey: getListHomestaysQueryKey({ q: debouncedSearch || undefined }) }
  });

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src={heroImg} 
          alt="Rural Indian village homestay" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 container px-4 mx-auto flex flex-col items-center text-center">
          <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary border-none mb-6 px-4 py-1.5 text-sm font-medium tracking-wide">
            Experience Authentic Rural India
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 max-w-4xl leading-tight">
            Find your home <br/> away from the city.
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-12 font-medium">
            Stay with local families, eat farm-fresh meals, and experience the slow, beautiful rhythm of village life.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-2xl bg-background rounded-full p-2 flex items-center shadow-xl">
            <div className="flex-1 flex items-center pl-4">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input 
                type="text" 
                placeholder="Where to? Try 'Coorg' or 'Rajasthan'..." 
                className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard 
              loading={loadingSummary} 
              value={summary?.totalHomestays} 
              label="Verified Homestays" 
              icon={<HomeIcon className="w-6 h-6 text-primary" />} 
            />
            <StatCard 
              loading={loadingSummary} 
              value={summary?.totalVillages} 
              label="Villages to Explore" 
              icon={<MapPin className="w-6 h-6 text-primary" />} 
            />
            <StatCard 
              loading={loadingSummary} 
              value={summary?.totalBookings} 
              label="Happy Travelers" 
              icon={<Calendar className="w-6 h-6 text-primary" />} 
            />
            <StatCard 
              loading={loadingSummary} 
              value={`${summary?.averageReadiness}%`} 
              label="Avg Readiness Score" 
              icon={<ShieldCheck className="w-6 h-6 text-primary" />} 
            />
          </div>
        </div>
      </section>

      {/* Top Hosts Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground">Top Rated Hosts</h2>
              <p className="text-muted-foreground mt-2">Highest readiness scores and warmest hospitality.</p>
            </div>
            <Link href="/" className="text-primary font-medium flex items-center hover:underline">
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingTop ? (
              Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
            ) : topHomestays?.map(homestay => (
              <Link key={homestay.id} href={`/homestays/${homestay.id}`}>
                <Card className="overflow-hidden hover-elevate transition-all border-none shadow-sm cursor-pointer group">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={homestay.imageUrl} alt={homestay.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-primary" />
                      {homestay.readinessScore}% Ready
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-serif font-bold text-lg leading-tight truncate">{homestay.name}</h3>
                        <p className="text-muted-foreground text-sm flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" /> {homestay.village}, {homestay.region}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid & Recent Bookings Sidebar */}
      <section className="py-12 bg-muted/10 border-t border-border/40">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-10">
          
          <div className="flex-1">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-8">
              {search ? `Results for "${search}"` : "All Destinations"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loadingHomestays ? (
                Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
              ) : homestays?.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2">No homestays found</h3>
                  <p className="text-muted-foreground">Try a different village, region, or host name.</p>
                  <Button variant="outline" className="mt-6" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                </div>
              ) : homestays?.map(homestay => (
                <Link key={homestay.id} href={`/homestays/${homestay.id}`}>
                  <Card className="overflow-hidden hover-elevate transition-all border border-border/50 shadow-sm cursor-pointer group h-full flex flex-col">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img src={homestay.imageUrl} alt={homestay.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-accent text-accent" />
                        {homestay.rating.toFixed(1)} <span className="text-muted-foreground font-normal">({homestay.reviewCount})</span>
                      </div>
                    </div>
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-serif font-bold text-xl leading-tight line-clamp-1">{homestay.name}</h3>
                        <div className="font-semibold whitespace-nowrap ml-2">
                          ₹{homestay.pricePerNight} <span className="text-xs text-muted-foreground font-normal">/ night</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm flex items-center mb-4">
                        <MapPin className="w-3 h-3 mr-1" /> {homestay.village}, {homestay.state}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border/40">
                        {homestay.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground font-normal text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {homestay.tags.length > 3 && (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal text-xs">
                            +{homestay.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-8">
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
              <h3 className="font-serif font-bold text-lg mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                Recent Bookings
              </h3>
              <div className="space-y-4">
                {loadingRecent ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : recentBookings?.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No recent bookings.</p>
                ) : recentBookings?.map(booking => (
                  <div key={booking.id} className="relative pl-4 border-l-2 border-primary/20 pb-4 last:pb-0">
                    <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-1.5" />
                    <p className="text-sm font-medium">
                      {booking.guestName} booked <span className="font-bold text-primary">{booking.homestayName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {booking.checkOutDate
                        ? `${format(new Date(booking.checkInDate), "MMM d")}–${format(new Date(booking.checkOutDate), "MMM d")} · ${booking.nights} ${booking.nights === 1 ? "night" : "nights"}`
                        : format(new Date(booking.checkInDate), "MMM do")} in {booking.village}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

function StatCard({ loading, value, label, icon }: { loading: boolean, value?: string | number, label: string, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover-elevate transition-all">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20 mb-2" />
      ) : (
        <div className="text-3xl font-serif font-bold text-foreground mb-1">{value}</div>
      )}
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-5">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}
