import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDoctorReviews, useDoctorKarma, useCreateDoctorReview, useStaff } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Plus, Search, Loader2, TrendingUp, Award, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ExportButtons } from "@/components/ExportButtons";
import { formatCurrency, formatDate } from "@/lib/utils";

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={14} className={i < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
      ))}
    </div>
  );
}

export default function DoctorKarmaPage() {
  const { hasPermission } = useAuth();
  const { data: reviews = [], isLoading: loadingReviews } = useDoctorReviews();
  const { data: karma = [], isLoading: loadingKarma } = useDoctorKarma();
  const { data: staffList = [] } = useStaff();
  const createReview = useCreateDoctorReview();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("karma");

  const doctors = (staffList as any[]).filter((s: any) => s.role === "Consultant" || s.role === "RMO" || s.department?.includes("OPD"));
  const allReviews = reviews as any[];
  const karmaList = karma as any[];

  const avgKarma = karmaList.length > 0 ? Math.round(karmaList.reduce((s: number, k: any) => s + k.karmaScore, 0) / karmaList.length * 10) / 10 : 0;
  const topDoctor = karmaList.length > 0 ? karmaList[0] : null;

  const filteredReviews = useMemo(() =>
    allReviews.filter((r: any) =>
      r.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [allReviews, searchQuery]);

  const karmaChartData = karmaList.slice(0, 10).map((k: any) => ({
    name: k.doctorName?.length > 15 ? k.doctorName.slice(0, 15) + "…" : k.doctorName,
    karma: k.karmaScore,
    rating: k.avgRating,
    efficacy: k.avgEfficacy,
  }));

  const handleAddReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const doc = doctors.find((d: any) => d.id === selectedDoctor);
    createReview.mutate({
      doctorId: selectedDoctor,
      doctorName: doc?.name || fd.get("doctorName") as string,
      patientName: fd.get("patientName") as string,
      rating: Number(fd.get("rating")),
      efficacyScore: Number(fd.get("efficacyScore") || 0),
      costScore: Number(fd.get("costScore") || 0),
      reviewText: fd.get("reviewText") as string,
      diagnosis: fd.get("diagnosis") as string,
      treatmentCost: Number(fd.get("treatmentCost") || 0),
    });
    setSelectedDoctor("");
    setShowAdd(false);
  };

  if (loadingReviews || loadingKarma) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doctor Karma Score</h1>
          <p className="text-muted-foreground">Patient reviews — solution efficacy & treatment cost analysis</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            title="Doctor Karma Report"
            columns={["Doctor", "Karma Score", "Avg Rating", "Avg Efficacy", "Avg Cost Score", "Reviews", "Total Treatment Cost"]}
            rows={karmaList.map((k: any) => [k.doctorName, k.karmaScore, k.avgRating, k.avgEfficacy, k.avgCost, k.reviewCount, k.totalTreatmentCost])}
          />
          {hasPermission("patient:read") && <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus size={16} /> Add Review</Button>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2"><Award className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Karma</p>
              <p className="text-2xl font-bold">{avgKarma}/10</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Top Doctor</p>
              <p className="text-lg font-bold">{topDoctor?.doctorName || "—"}</p>
              <p className="text-xs text-muted-foreground">{topDoctor ? `${topDoctor.karmaScore}/10` : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2"><Users className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Doctors Rated</p>
              <p className="text-2xl font-bold">{karmaList.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2"><Star className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold">{allReviews.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search doctors, patients, diagnosis..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="karma" className="gap-2"><Award size={14} /> Karma Scores ({karmaList.length})</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2"><Star size={14} /> All Reviews ({allReviews.length})</TabsTrigger>
          <TabsTrigger value="chart" className="gap-2"><TrendingUp size={14} /> Analytics</TabsTrigger>
        </TabsList>

        {/* Karma Scores Tab */}
        <TabsContent value="karma">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Karma Score</TableHead>
                    <TableHead>Avg Rating</TableHead>
                    <TableHead>Efficacy</TableHead>
                    <TableHead>Cost Score</TableHead>
                    <TableHead>Reviews</TableHead>
                    <TableHead className="text-right">Total Treatment Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {karmaList.map((k: any, i: number) => (
                    <TableRow key={k.doctorId}>
                      <TableCell>
                        <span className={`font-bold ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                          #{i + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{k.doctorName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 rounded-full ${k.karmaScore >= 8 ? "bg-green-500" : k.karmaScore >= 5 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, k.karmaScore * 10)}%`, maxWidth: 80 }} />
                          <span className="font-bold">{k.karmaScore}</span>
                        </div>
                      </TableCell>
                      <TableCell><StarRating value={Math.round(k.avgRating)} /> <span className="text-xs text-muted-foreground ml-1">{k.avgRating}</span></TableCell>
                      <TableCell><Badge variant={k.avgEfficacy >= 7 ? "success" : k.avgEfficacy >= 4 ? "warning" : "destructive"}>{k.avgEfficacy}/10</Badge></TableCell>
                      <TableCell><Badge variant={k.avgCost >= 7 ? "success" : k.avgCost >= 4 ? "warning" : "destructive"}>{k.avgCost}/10</Badge></TableCell>
                      <TableCell>{k.reviewCount}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(k.totalTreatmentCost)}</TableCell>
                    </TableRow>
                  ))}
                  {karmaList.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No karma data yet. Add reviews to generate scores.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Reviews Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Efficacy</TableHead>
                    <TableHead>Cost Score</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead className="text-right">Treatment ₹</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.doctorName}</TableCell>
                      <TableCell>{r.patientName}</TableCell>
                      <TableCell><StarRating value={r.rating} /></TableCell>
                      <TableCell>{r.efficacyScore ? <Badge variant={r.efficacyScore >= 7 ? "success" : "warning"}>{r.efficacyScore}/10</Badge> : "—"}</TableCell>
                      <TableCell>{r.costScore ? <Badge variant={r.costScore >= 7 ? "success" : "warning"}>{r.costScore}/10</Badge> : "—"}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{r.diagnosis || "—"}</TableCell>
                      <TableCell className="text-right">{r.treatmentCost ? formatCurrency(r.treatmentCost) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.reviewDate)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredReviews.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No reviews found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="chart">
          <Card>
            <CardHeader><CardTitle>Doctor Karma Comparison</CardTitle></CardHeader>
            <CardContent>
              {karmaChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data to chart</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={karmaChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="karma" fill="#0d9488" name="Karma Score" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rating" fill="#f59e0b" name="Avg Rating (out of 5)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="efficacy" fill="#3b82f6" name="Efficacy (out of 10)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Review Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Submit Doctor Review</DialogTitle></DialogHeader>
          <form onSubmit={handleAddReview} className="space-y-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger><SelectValue placeholder="Select doctor..." /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name} — {d.department}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Patient Name</Label><Input name="patientName" required /></div>
              <div className="space-y-2"><Label>Diagnosis</Label><Input name="diagnosis" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Rating (1-5)</Label><Input name="rating" type="number" min={1} max={5} required /></div>
              <div className="space-y-2"><Label>Efficacy (1-10)</Label><Input name="efficacyScore" type="number" min={1} max={10} /></div>
              <div className="space-y-2"><Label>Cost Score (1-10)</Label><Input name="costScore" type="number" min={1} max={10} /></div>
            </div>
            <div className="space-y-2"><Label>Treatment Cost (₹)</Label><Input name="treatmentCost" type="number" /></div>
            <div className="space-y-2"><Label>Review Comments</Label><Textarea name="reviewText" rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={createReview.isPending || !selectedDoctor}>Submit Review</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
