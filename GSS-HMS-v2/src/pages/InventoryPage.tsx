import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInventory, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Loader2, AlertTriangle, Trash2, ShieldAlert, Recycle, Package } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { formatCurrency, formatDate } from "@/lib/utils";

const CATEGORIES = ["Bed", "Chair", "Equipment", "Nebulizer", "Medicine", "Linen", "Consumable", "Furniture", "Other"];
const ASSET_TYPES = ["Fixed", "Recurring"];

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const { data: items = [], isLoading } = useInventory();
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const [showAdd, setShowAdd] = useState(false);
  const [showDamage, setShowDamage] = useState<any>(null);
  const [showDispose, setShowDispose] = useState<any>(null);
  const [itemCategory, setItemCategory] = useState("Equipment");
  const [assetType, setAssetType] = useState("Fixed");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const canWrite = hasPermission("inventory:write");

  const allItems = items as any[];
  const activeItems = allItems.filter((i: any) => !i.disposalStatus && i.damageStatus !== "WriteOff");
  const damagedItems = allItems.filter((i: any) => i.damageStatus && i.damageStatus !== "WriteOff" && !i.disposalStatus);
  const disposedItems = allItems.filter((i: any) => i.disposalStatus === "Disposed" || i.damageStatus === "WriteOff");

  const filtered = useMemo(() => {
    const list = activeTab === "active" ? activeItems : activeTab === "damaged" ? damagedItems : disposedItems;
    return list.filter((i: any) =>
      i.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.location || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allItems, activeTab, searchQuery]);

  const totalValue = activeItems.reduce((sum: number, i: any) => sum + ((i as any).unitCost || 0) * (i.quantity || 0), 0);
  const lowStock = activeItems.filter((i: any) => i.quantity <= (i.minStock || 5)).length;
  const warrantyExpiring = activeItems.filter((i: any) => {
    if (!i.warrantyExpiry) return false;
    const diff = (new Date(i.warrantyExpiry).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 30;
  }).length;

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createItem.mutate({
      name: fd.get("name") as string,
      category: itemCategory,
      assetType,
      quantity: Number(fd.get("quantity")),
      assignedQty: Number(fd.get("assignedQty") || 0),
      disposableQty: Number(fd.get("disposableQty") || 0),
      unit: fd.get("unit") as string || "pcs",
      minStock: Number(fd.get("minStock") || 5),
      maxStock: Number(fd.get("maxStock") || 100),
      location: fd.get("location") as string,
      supplier: fd.get("supplier") as string,
      unitCost: Number(fd.get("unitCost") || 0),
      purchaseDate: fd.get("purchaseDate") as string || null,
      warrantyExpiry: fd.get("warrantyExpiry") as string || null,
      billReference: fd.get("billReference") as string || null,
      warrantyDoc: fd.get("warrantyDoc") as string || null,
      photoEvidence: fd.get("photoEvidence") as string || null,
      status: "InStock",
    });
    setItemCategory("Equipment");
    setAssetType("Fixed");
    setShowAdd(false);
  };

  const handleDeclareDamage = (item: any) => {
    updateItem.mutate({ id: item.id, damageStatus: "Declared", status: "Damaged" });
    setShowDamage(null);
  };

  const handleDispose = (dispType: string) => {
    if (!showDispose) return;
    updateItem.mutate({ id: showDispose.id, disposalStatus: "Disposed", disposalType: dispType, disposalDate: new Date().toISOString().slice(0, 10), status: "Disposed" });
    setShowDispose(null);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock & Inventory</h1>
          <p className="text-muted-foreground">Fixed & recurring assets — beds, chairs, equipment, nebulizers, supplies</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            title="Inventory Report"
            columns={["Name", "Category", "Type", "Qty", "Assigned", "Disposable", "Location", "Status", "Damage", "Warranty"]}
            rows={allItems.map((i: any) => [i.name, i.category || "", i.assetType || "Fixed", i.quantity ?? 0, i.assignedQty ?? 0, i.disposableQty ?? 0, i.location || "", i.status, i.damageStatus || "—", i.warrantyExpiry || "—"])}
          />
          {canWrite && <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus size={16} /> Add Asset</Button>}
        </div>
      </div>

      {warrantyExpiring > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">Warranty Alert</h3>
            <p className="text-sm text-amber-700"><span className="font-medium">{warrantyExpiring} asset(s)</span> have warranty expiring within 30 days.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-5">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Active Assets</p><p className="text-2xl font-bold">{activeItems.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Value</p><p className="text-2xl font-bold">{formatCurrency(totalValue)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Low Stock</p><p className="text-2xl font-bold text-amber-600">{lowStock}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Damaged</p><p className="text-2xl font-bold text-destructive">{damagedItems.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Disposed</p><p className="text-2xl font-bold text-muted-foreground">{disposedItems.length}</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2"><Package size={14} /> Active ({activeItems.length})</TabsTrigger>
          <TabsTrigger value="damaged" className="gap-2"><ShieldAlert size={14} /> Damaged ({damagedItems.length})</TabsTrigger>
          <TabsTrigger value="disposed" className="gap-2"><Recycle size={14} /> Disposed ({disposedItems.length})</TabsTrigger>
        </TabsList>

        {(["active", "damaged", "disposed"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Assigned</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Warranty</TableHead>
                      <TableHead>Status</TableHead>
                      {canWrite && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item: any) => {
                      const isLow = item.quantity <= (item.minStock || 5);
                      const wExp = item.warrantyExpiry ? new Date(item.warrantyExpiry) : null;
                      const wExpiring = wExp && (wExp.getTime() - Date.now()) / 86400000 <= 30 && wExp >= new Date();
                      const wExpired = wExp && wExp < new Date();
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div>{item.name}</div>
                            {item.billReference && <div className="text-xs text-muted-foreground">Bill: {item.billReference}</div>}
                          </TableCell>
                          <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                          <TableCell><Badge variant={item.assetType === "Recurring" ? "info" : "outline"}>{item.assetType || "Fixed"}</Badge></TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.assignedQty || 0}</TableCell>
                          <TableCell className="text-muted-foreground">{item.location || "—"}</TableCell>
                          <TableCell>
                            {wExpired ? <Badge variant="destructive">Expired</Badge> :
                             wExpiring ? <Badge variant="warning">Expiring</Badge> :
                             wExp ? <span className="text-xs text-muted-foreground">{formatDate(item.warrantyExpiry)}</span> :
                             <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.status === "Disposed" || item.status === "Damaged" ? "destructive" : isLow ? "warning" : "success"}>
                              {item.damageStatus ? `Damage: ${item.damageStatus}` :
                               item.disposalStatus === "Disposed" ? `${item.disposalType || "Disposed"}` :
                               isLow ? "Low Stock" : item.status}
                            </Badge>
                          </TableCell>
                          {canWrite && (
                            <TableCell>
                              <div className="flex gap-1">
                                {tab === "active" && (
                                  <>
                                    <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 text-xs" onClick={() => setShowDamage(item)}>Damage</Button>
                                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowDispose(item)}>Dispose</Button>
                                  </>
                                )}
                                {tab === "damaged" && (
                                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowDispose(item)}>Dispose</Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteItem.mutate(item.id)}><Trash2 size={14} /></Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={canWrite ? 9 : 8} className="text-center py-8 text-muted-foreground">
                        {tab === "active" ? "No active items" : tab === "damaged" ? "No damaged items" : "No disposed items"}
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Asset Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Inventory Asset</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2"><Label>Item Name</Label><Input name="name" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={itemCategory} onValueChange={setItemCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Total Qty</Label><Input name="quantity" type="number" required /></div>
              <div className="space-y-2"><Label>Assigned Qty</Label><Input name="assignedQty" type="number" defaultValue={0} /></div>
              <div className="space-y-2"><Label>Disposable Qty</Label><Input name="disposableQty" type="number" defaultValue={0} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Unit</Label><Input name="unit" defaultValue="pcs" /></div>
              <div className="space-y-2"><Label>Min Stock</Label><Input name="minStock" type="number" defaultValue={5} /></div>
              <div className="space-y-2"><Label>Max Stock</Label><Input name="maxStock" type="number" defaultValue={100} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Location</Label><Input name="location" placeholder="Ward / Room" /></div>
              <div className="space-y-2"><Label>Supplier</Label><Input name="supplier" /></div>
              <div className="space-y-2"><Label>Unit Cost (₹)</Label><Input name="unitCost" type="number" defaultValue={0} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Purchase Date</Label><Input name="purchaseDate" type="date" /></div>
              <div className="space-y-2"><Label>Warranty Expiry</Label><Input name="warrantyExpiry" type="date" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Bill Ref</Label><Input name="billReference" placeholder="Bill no." /></div>
              <div className="space-y-2"><Label>Warranty Doc</Label><Input name="warrantyDoc" placeholder="Doc ref" /></div>
              <div className="space-y-2"><Label>Photo Ref</Label><Input name="photoEvidence" placeholder="Photo path" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={createItem.isPending}>Add Asset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Damage Declare Dialog */}
      <Dialog open={!!showDamage} onOpenChange={() => setShowDamage(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Declare Damage</DialogTitle></DialogHeader>
          {showDamage && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Declare <strong>{showDamage.name}</strong> as damaged?</p>
              <div className="rounded-lg border p-3 bg-amber-50 text-sm space-y-1">
                <p><strong>Item:</strong> {showDamage.name}</p>
                <p><strong>Category:</strong> {showDamage.category}</p>
                <p><strong>Location:</strong> {showDamage.location || "N/A"}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDamage(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleDeclareDamage(showDamage)}>
                  <ShieldAlert size={16} className="mr-2" /> Declare Damage
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispose Dialog */}
      <Dialog open={!!showDispose} onOpenChange={() => setShowDispose(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dispose Asset</DialogTitle></DialogHeader>
          {showDispose && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose disposal method for <strong>{showDispose.name}</strong>:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => handleDispose("Sell")}>
                  <span className="text-lg font-bold">₹</span>
                  <span className="font-medium">Sell</span>
                  <span className="text-xs text-muted-foreground">Auction or sale</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-1" onClick={() => handleDispose("Charitable")}>
                  <span className="text-lg">🤝</span>
                  <span className="font-medium">Charitable</span>
                  <span className="text-xs text-muted-foreground">Donate to charity</span>
                </Button>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowDispose(null)}>Cancel</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
