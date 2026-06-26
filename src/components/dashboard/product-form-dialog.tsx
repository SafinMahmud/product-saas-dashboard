"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, ProductStatus } from "@/lib/types";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSaved: () => void;
}

interface ProductFormFieldsProps {
  product: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}

function ProductFormFields({ product, onSaved, onCancel }: ProductFormFieldsProps) {
  const isEdit = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "active");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      category: category.trim(),
      price: parseFloat(price),
      status,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/products/${product!.id}` : "/api/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      toast.success(isEdit ? "Product updated" : "Product created");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product-name">Name</Label>
        <Input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-category">Category</Label>
        <Input
          id="product-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          maxLength={100}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-price">Price (USD)</Label>
        <Input
          id="product-price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-status">Status</Label>
        <Select value={status} onValueChange={(v) => v && setStatus(v as ProductStatus)}>
          <SelectTrigger id="product-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) {
  const isEdit = Boolean(product);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the product details below."
              : "Fill in the details to create a new product."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ProductFormFields
            key={product?.id ?? "new"}
            product={product}
            onSaved={onSaved}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
