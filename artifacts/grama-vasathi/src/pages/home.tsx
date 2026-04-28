import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Search,
  MapPin,
  Star,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Home as HomeIcon,
  Leaf,
  HandHeart,
  Filter,
  X,
  SlidersHorizontal,
} from "lucide-react";
import {
  useListHomestays,
  useGetInsightsSummary,
  useGetRecentBookings,
  useGetTopHomestays,
  getListHomestaysQueryKey,
  getGetInsightsSummaryQueryKey,
  getGetRecentBookingsQueryKey,
  getGetTopHomestaysQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/images/hero.png";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);

  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const { data: summary, isLoading: loadingSummary } = useGetInsightsSummary({
    query: { queryKey: getGetInsightsSummaryQueryKey() },
  });

  const { data: topHomestays, isLoading: loadingTop } = useGetTopHomestays(
    { limit: 4 },
    { query: { queryKey: getGetTopHomestaysQueryKey({ limit: 4 }) } },
  );

  const { data: recentBookings, isLoading: loadingRecent } = useGetRecentBookings(
    { limit: 3 },
    { query: { queryKey: getGetRecentBookingsQueryKey({ limit: 3 }) } },
  );

  const { data: homestays, isLoading: loadingHomestays } = useListHomestays(
    { q: debouncedSearch || undefined },
    {
      query: {
        queryKey: getListHomestaysQueryKey({ q: debouncedSearch || undefined }),
      },
    },
  );

  // Derive available regions and price ceiling from the unfiltered result.
  const allRegions = useMemo(() => {
    const set = new Set<string>();
    (homestays || []).forEach((h) => set.add(h.region));
    return Array.from(set).sort();
  }, [homestays]);

  const priceBounds = useMemo(() => {
    const prices = (homestays || []).map((h) => h.pricePerNight);
    if (prices.length === 0) return { min: 0, max: 5000 };
    const min = Math.floor(Math.min(...prices) / 100) * 100;
    const max = Math.ceil(Math.max(...prices) / 100) * 100;
    return { min, max };
  }, [homestays]);

  const effectiveMaxPrice = maxPrice ?? priceBounds.max;

  // Apply client-side filters + sort.
  const filtered = useMemo(() => {
    let list = [...(homestays || [])];
    if (selectedRegions.size > 0) {
      list = list.filter((h) => selectedRegions.has(h.region));
    }
    list = list.filter((h) => h.pricePerNight <= effectiveMaxPrice);
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "price-desc":
        list.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        list.sort(
          (a, b) =>
            b.rating * Math.log(b.reviewCount + 1) -
            a.rating * Math.log(a.reviewCount + 1),
        );
    }
    return list;
  }, [homestays, selectedRegions, effectiveMaxPrice, sortBy]);

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedRegions(new Set());
    setMaxPrice(null);
    setSortBy("featured");
  };

  const filtersActive =
    selectedRegions.size > 0 ||
    maxPrice !== null ||
    sortBy !== "featured" ||
    !!debouncedSearch;

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Hero */}
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
            Find your home <br /> away from the city.
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-12 font-medium">
            Stay with local families, eat farm-fresh meals, and experience the
            slow, beautiful rhythm of village life.
          </p>

          <form
            className="w-full max-w-2xl bg-background rounded-full p-2 flex items-center shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              const target = document.getElementById("destinations");
              target?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <div className="flex-1 flex items-center pl-4">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder="Where to? Try 'Coorg' or 'Rajasthan'..."
                className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-hero-search"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Why Grama Vasathi — value props */}
      <section className="py-16 md:py-20 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              Travel that gives back
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Every booking flows directly to a village family — no middlemen, no
              chains, no compromises.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValueCard
              icon={<HandHeart className="w-7 h-7 text-primary" />}
              title="Direct to the host"
              body="100% of your nightly rate goes to the host family. No platform commission baked in."
            />
            <ValueCard
              icon={<ShieldCheck className="w-7 h-7 text-primary" />}
              title="Verified readiness"
              body="Every home is reviewed against an 8-point readiness checklist before going live."
            />
            <ValueCard
              icon={<Leaf className="w-7 h-7 text-primary" />}
              title="Slow, rooted travel"
              body="Plantation walks, kitchen mornings, sunsets by the river — travel on the village's rhythm."
            />
          </div>
        </div>
      </section>

      {/* Stats */}
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
              value={
                summary?.averageReadiness !== undefined
                  ? `${summary.averageReadiness}%`
                  : undefined
              }
              label="Avg Readiness Score"
              icon={<ShieldCheck className="w-6 h-6 text-primary" />}
            />
          </div>
        </div>
      </section>

      {/* Top Hosts */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground">
                Top Rated Hosts
              </h2>
              <p className="text-muted-foreground mt-2">
                Highest readiness scores and warmest hospitality.
              </p>
            </div>
            <a
              href="#destinations"
              className="text-primary font-medium flex items-center hover:underline"
            >
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingTop
              ? Array(4)
                  .fill(0)
                  .map((_, i) => <CardSkeleton key={i} />)
              : topHomestays?.map((homestay) => (
                  <Link
                    key={homestay.id}
                    href={`/homestays/${homestay.id}`}
                    data-testid={`link-top-homestay-${homestay.id}`}
                  >
                    <Card className="overflow-hidden hover-elevate transition-all border-none shadow-sm cursor-pointer group">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={homestay.imageUrl}
                          alt={homestay.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-primary" />
                          {homestay.readinessScore}% Ready
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <h3 className="font-serif font-bold text-lg leading-tight truncate">
                              {homestay.name}
                            </h3>
                            <p className="text-muted-foreground text-sm flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1 shrink-0" />
                              <span className="truncate">
                                {homestay.village}, {homestay.region}
                              </span>
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

      {/* Destinations + filters + Recent sidebar */}
      <section
        id="destinations"
        className="py-12 bg-muted/10 border-t border-border/40 scroll-mt-24"
      >
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-10">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-serif font-bold text-foreground">
                  {debouncedSearch
                    ? `Results for "${debouncedSearch}"`
                    : "All Destinations"}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {loadingHomestays
                    ? "Loading…"
                    : `${filtered.length} ${filtered.length === 1 ? "homestay" : "homestays"} ${selectedRegions.size > 0 || maxPrice !== null ? "match your filters" : "available"}`}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground hidden md:block" />
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortKey)}
                >
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="rating">Highest rated</SelectItem>
                    <SelectItem value="price-asc">Price: low to high</SelectItem>
                    <SelectItem value="price-desc">Price: high to low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Region chips + price slider */}
            {!loadingHomestays && (homestays?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card p-5 mb-8 space-y-5">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Filter className="w-4 h-4 text-primary" />
                  Filter by region
                </div>
                <div className="flex flex-wrap gap-2">
                  {allRegions.map((region) => {
                    const active = selectedRegions.has(region);
                    return (
                      <button
                        key={region}
                        type="button"
                        onClick={() => toggleRegion(region)}
                        data-testid={`chip-region-${region.toLowerCase()}`}
                        className={cn(
                          "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all hover-elevate",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border/60 hover:border-primary/50",
                        )}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-bold text-foreground">
                      Max price per night
                    </span>
                    <span className="font-medium text-primary">
                      ₹{effectiveMaxPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <Slider
                    value={[effectiveMaxPrice]}
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={100}
                    onValueChange={(v) => setMaxPrice(v[0] ?? priceBounds.max)}
                    data-testid="slider-max-price"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>₹{priceBounds.min.toLocaleString("en-IN")}</span>
                    <span>₹{priceBounds.max.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {filtersActive && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearFilters();
                        setSearch("");
                      }}
                      data-testid="button-clear-filters"
                      className="text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loadingHomestays ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => <CardSkeleton key={i} />)
              ) : filtered.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2">
                    Nothing matches yet
                  </h3>
                  <p className="text-muted-foreground">
                    Try widening your filters or searching a different region.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => {
                      clearFilters();
                      setSearch("");
                    }}
                    data-testid="button-empty-clear"
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                filtered.map((homestay) => (
                  <Link
                    key={homestay.id}
                    href={`/homestays/${homestay.id}`}
                    data-testid={`link-homestay-${homestay.id}`}
                  >
                    <Card className="overflow-hidden hover-elevate transition-all border border-border/50 shadow-sm cursor-pointer group h-full flex flex-col">
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={homestay.imageUrl}
                          alt={homestay.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-accent text-accent" />
                          {homestay.rating.toFixed(1)}{" "}
                          <span className="text-muted-foreground font-normal">
                            ({homestay.reviewCount})
                          </span>
                        </div>
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-background/95 text-foreground hover:bg-background backdrop-blur-sm font-medium border-none shadow-sm">
                            {homestay.region}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <h3 className="font-serif font-bold text-xl leading-tight line-clamp-1 min-w-0">
                            {homestay.name}
                          </h3>
                          <div className="font-semibold whitespace-nowrap shrink-0">
                            ₹{homestay.pricePerNight.toLocaleString("en-IN")}{" "}
                            <span className="text-xs text-muted-foreground font-normal">
                              / night
                            </span>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm flex items-center mb-4">
                          <MapPin className="w-3 h-3 mr-1" /> {homestay.village},{" "}
                          {homestay.state}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border/40">
                          {homestay.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-muted text-muted-foreground font-normal text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {homestay.tags.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="bg-muted text-muted-foreground font-normal text-xs"
                            >
                              +{homestay.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>

          <aside className="w-full lg:w-80 space-y-8 shrink-0">
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
              <h3 className="font-serif font-bold text-lg mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                Recent Bookings
              </h3>
              <div className="space-y-4">
                {loadingRecent ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))
                ) : recentBookings?.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No recent bookings.
                  </p>
                ) : (
                  recentBookings?.map((booking) => (
                    <div
                      key={booking.id}
                      className="relative pl-4 border-l-2 border-primary/20 pb-4 last:pb-0"
                    >
                      <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-1.5" />
                      <p className="text-sm font-medium">
                        {booking.guestName} booked{" "}
                        <span className="font-bold text-primary">
                          {booking.homestayName}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {booking.checkOutDate
                          ? `${format(new Date(booking.checkInDate), "MMM d")}–${format(new Date(booking.checkOutDate), "MMM d")} · ${booking.nights} ${booking.nights === 1 ? "night" : "nights"}`
                          : format(new Date(booking.checkInDate), "MMM do")}{" "}
                        in {booking.village}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/15 rounded-xl p-6">
              <h3 className="font-serif font-bold text-lg mb-2 text-foreground">
                Are you a host?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open your home to thoughtful travelers and earn directly — no
                commission, just hospitality.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Start hosting
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="font-serif font-bold text-xl text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function StatCard({
  loading,
  value,
  label,
  icon,
}: {
  loading: boolean;
  value?: string | number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl border border-border/50 shadow-sm hover-elevate transition-all">
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20 mb-2" />
      ) : (
        <div className="text-3xl font-serif font-bold text-foreground mb-1">
          {value}
        </div>
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
