import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateCycleModal from "@/components/create-cycle-modal";
import type { GoalWithKeyResults } from "@shared/schema";

// Minimal example to test the structure
interface TestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TestGoalFormModal({ open, onOpenChange }: TestModalProps) {
  const [showCreateCycleModal, setShowCreateCycleModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Test Goal Form</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Button 
              onClick={() => setShowCreateCycleModal(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Siklus Baru
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <CreateCycleModal 
        open={showCreateCycleModal}
        onOpenChange={setShowCreateCycleModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/cycles"] });
          toast({
            title: "Siklus berhasil dibuat",
            description: "Siklus baru telah berhasil dibuat dan dapat dipilih",
            className: "border-green-200 bg-green-50 text-green-800",
          });
        }}
      />
    </>
  );
}

export function CreateGoalButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Test Goal
      </Button>
      <TestGoalFormModal open={open} onOpenChange={setOpen} />
    </>
  );
}